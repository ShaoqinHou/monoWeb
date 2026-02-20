import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { fixedAssets, journals, journalLines } from '../db/schema';
import type { Db } from '../db/index';

export function fixedAssetRoutes(db: Db) {
  const router = new Hono();

  router.get('/', async (c) => {
    const rows = await db.select().from(fixedAssets).all();
    return c.json({ ok: true, data: rows });
  });

  router.get('/:id', async (c) => {
    const id = c.req.param('id');
    const row = await db.select().from(fixedAssets).where(eq(fixedAssets.id, id)).get();
    if (!row) return c.json({ ok: false, error: 'Fixed asset not found' }, 404);
    return c.json({ ok: true, data: row });
  });

  router.post('/', async (c) => {
    const body = await c.req.json();
    if (!body.name || !body.purchaseDate || body.purchasePrice === undefined || !body.assetAccountCode || !body.depreciationAccountCode) {
      return c.json({ ok: false, error: 'name, purchaseDate, purchasePrice, assetAccountCode, and depreciationAccountCode required' }, 400);
    }

    const now = new Date().toISOString();
    const id = randomUUID();

    // Generate asset number
    const all = await db.select({ assetNumber: fixedAssets.assetNumber }).from(fixedAssets).all();
    let maxNum = 0;
    const prefix = 'FA-';
    for (const row of all) {
      if (row.assetNumber?.startsWith(prefix)) {
        const num = parseInt(row.assetNumber.slice(prefix.length), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
    const assetNumber = `${prefix}${String(maxNum + 1).padStart(4, '0')}`;

    await db.insert(fixedAssets).values({
      id,
      name: body.name,
      assetNumber,
      purchaseDate: body.purchaseDate,
      purchasePrice: body.purchasePrice,
      depreciationMethod: body.depreciationMethod ?? 'straight_line',
      depreciationRate: body.depreciationRate ?? 0,
      currentValue: body.currentValue ?? body.purchasePrice,
      accumulatedDepreciation: 0,
      assetAccountCode: body.assetAccountCode,
      depreciationAccountCode: body.depreciationAccountCode,
      status: 'registered',
      disposalDate: null,
      disposalPrice: null,
      createdAt: now,
    });

    const created = await db.select().from(fixedAssets).where(eq(fixedAssets.id, id)).get();
    return c.json({ ok: true, data: created }, 201);
  });

  router.put('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(fixedAssets).where(eq(fixedAssets.id, id)).get();
    if (!existing) return c.json({ ok: false, error: 'Fixed asset not found' }, 404);
    if (existing.status !== 'registered') return c.json({ ok: false, error: 'Only registered assets can be edited' }, 400);

    const body = await c.req.json();
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.purchaseDate !== undefined) updates.purchaseDate = body.purchaseDate;
    if (body.purchasePrice !== undefined) updates.purchasePrice = body.purchasePrice;
    if (body.depreciationMethod !== undefined) updates.depreciationMethod = body.depreciationMethod;
    if (body.depreciationRate !== undefined) updates.depreciationRate = body.depreciationRate;
    if (body.currentValue !== undefined) updates.currentValue = body.currentValue;
    if (body.assetAccountCode !== undefined) updates.assetAccountCode = body.assetAccountCode;
    if (body.depreciationAccountCode !== undefined) updates.depreciationAccountCode = body.depreciationAccountCode;

    await db.update(fixedAssets).set(updates).where(eq(fixedAssets.id, id));
    const updated = await db.select().from(fixedAssets).where(eq(fixedAssets.id, id)).get();
    return c.json({ ok: true, data: updated });
  });

  // POST /api/fixed-assets/depreciate — bulk depreciation run for all active assets
  router.post('/depreciate', async (c) => {
    const body = await c.req.json();
    const period = body.period as string;
    const clientEntries = body.entries as Array<{
      assetId: string;
      assetName: string;
      amount: number;
      debitAccount: string;
      creditAccount: string;
    }>;

    if (!period || !Array.isArray(clientEntries) || clientEntries.length === 0) {
      return c.json({ ok: false, error: 'period and non-empty entries array required' }, 400);
    }

    const journalId = randomUUID();
    const now = new Date().toISOString();

    // Create a journal entry for the depreciation run
    await db.insert(journals).values({
      id: journalId,
      date: `${period}-01`,
      narration: `Depreciation run for ${period}`,
      status: 'posted',
      createdAt: now,
      updatedAt: now,
    });

    let journalLineCount = 0;

    for (const entry of clientEntries) {
      // Update asset: reduce currentValue, increase accumulatedDepreciation
      const asset = await db.select().from(fixedAssets).where(eq(fixedAssets.id, entry.assetId)).get();
      if (!asset || asset.status !== 'registered') continue;

      const newCurrentValue = Math.max(0, Math.round((asset.currentValue - entry.amount) * 100) / 100);
      const newAccumulated = Math.round((asset.accumulatedDepreciation + entry.amount) * 100) / 100;

      await db.update(fixedAssets).set({
        currentValue: newCurrentValue,
        accumulatedDepreciation: newAccumulated,
      }).where(eq(fixedAssets.id, entry.assetId));

      // Create debit journal line (depreciation expense)
      await db.insert(journalLines).values({
        id: randomUUID(),
        journalId,
        accountId: entry.debitAccount,
        accountName: `Depreciation - ${entry.assetName}`,
        description: `Depreciation ${period} - ${entry.assetName}`,
        debit: entry.amount,
        credit: 0,
      });

      // Create credit journal line (accumulated depreciation)
      await db.insert(journalLines).values({
        id: randomUUID(),
        journalId,
        accountId: entry.creditAccount,
        accountName: `Accumulated Depreciation - ${entry.assetName}`,
        description: `Depreciation ${period} - ${entry.assetName}`,
        debit: 0,
        credit: entry.amount,
      });

      journalLineCount += 2;
    }

    return c.json({
      ok: true,
      data: {
        journalId,
        assetsProcessed: clientEntries.length,
        journalEntriesCreated: journalLineCount,
        message: `Depreciation processed for ${clientEntries.length} assets, ${journalLineCount} journal entries created`,
      },
    }, 201);
  });

  router.post('/:id/depreciate', async (c) => {
    const id = c.req.param('id');
    const asset = await db.select().from(fixedAssets).where(eq(fixedAssets.id, id)).get();
    if (!asset) return c.json({ ok: false, error: 'Fixed asset not found' }, 404);
    if (asset.status !== 'registered') return c.json({ ok: false, error: 'Only registered assets can be depreciated' }, 400);

    let depAmount: number;
    if (asset.depreciationMethod === 'straight_line') {
      depAmount = Math.round(asset.purchasePrice * asset.depreciationRate / 100 * 100) / 100;
    } else {
      depAmount = Math.round(asset.currentValue * asset.depreciationRate / 100 * 100) / 100;
    }

    const newCurrentValue = Math.max(0, Math.round((asset.currentValue - depAmount) * 100) / 100);
    const newAccumulated = Math.round((asset.accumulatedDepreciation + depAmount) * 100) / 100;

    await db.update(fixedAssets).set({
      currentValue: newCurrentValue,
      accumulatedDepreciation: newAccumulated,
    }).where(eq(fixedAssets.id, id));

    const updated = await db.select().from(fixedAssets).where(eq(fixedAssets.id, id)).get();
    return c.json({ ok: true, data: updated });
  });

  router.post('/:id/dispose', async (c) => {
    const id = c.req.param('id');
    const asset = await db.select().from(fixedAssets).where(eq(fixedAssets.id, id)).get();
    if (!asset) return c.json({ ok: false, error: 'Fixed asset not found' }, 404);
    if (asset.status !== 'registered') return c.json({ ok: false, error: 'Only registered assets can be disposed' }, 400);

    const body = await c.req.json();
    const disposalType = body.type ?? 'disposed'; // 'disposed' or 'sold'
    const disposalPrice = body.price ?? 0;

    await db.update(fixedAssets).set({
      status: disposalType === 'sold' ? 'sold' : 'disposed',
      disposalDate: new Date().toISOString().split('T')[0],
      disposalPrice,
      currentValue: 0,
    }).where(eq(fixedAssets.id, id));

    const updated = await db.select().from(fixedAssets).where(eq(fixedAssets.id, id)).get();
    return c.json({ ok: true, data: updated });
  });

  return router;
}
