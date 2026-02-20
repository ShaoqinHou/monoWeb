import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { budgets, budgetLines } from '../db/schema';
import type { Db } from '../db/index';

export function budgetRoutes(db: Db) {
  const router = new Hono();

  router.get('/', async (c) => {
    const rows = await db.select().from(budgets).all();
    return c.json({ ok: true, data: rows });
  });

  router.get('/:id', async (c) => {
    const id = c.req.param('id');
    const budget = await db.select().from(budgets).where(eq(budgets.id, id)).get();
    if (!budget) return c.json({ ok: false, error: 'Budget not found' }, 404);

    const lines = await db.select().from(budgetLines).where(eq(budgetLines.budgetId, id)).all();
    return c.json({ ok: true, data: { ...budget, lines } });
  });

  router.post('/', async (c) => {
    const body = await c.req.json();
    if (!body.name || !body.financialYear) {
      return c.json({ ok: false, error: 'name and financialYear required' }, 400);
    }

    const now = new Date().toISOString();
    const id = randomUUID();

    await db.insert(budgets).values({
      id,
      name: body.name,
      financialYear: body.financialYear,
      status: 'draft',
      createdAt: now,
    });

    // Insert budget lines if provided
    const lines: Array<{ accountCode: string; accountName: string; month1?: number; month2?: number; month3?: number; month4?: number; month5?: number; month6?: number; month7?: number; month8?: number; month9?: number; month10?: number; month11?: number; month12?: number }> = body.lines ?? [];
    for (const line of lines) {
      await db.insert(budgetLines).values({
        id: randomUUID(),
        budgetId: id,
        accountCode: line.accountCode,
        accountName: line.accountName ?? '',
        month1: line.month1 ?? 0,
        month2: line.month2 ?? 0,
        month3: line.month3 ?? 0,
        month4: line.month4 ?? 0,
        month5: line.month5 ?? 0,
        month6: line.month6 ?? 0,
        month7: line.month7 ?? 0,
        month8: line.month8 ?? 0,
        month9: line.month9 ?? 0,
        month10: line.month10 ?? 0,
        month11: line.month11 ?? 0,
        month12: line.month12 ?? 0,
      });
    }

    const created = await db.select().from(budgets).where(eq(budgets.id, id)).get();
    const createdLines = await db.select().from(budgetLines).where(eq(budgetLines.budgetId, id)).all();
    return c.json({ ok: true, data: { ...created, lines: createdLines } }, 201);
  });

  router.put('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(budgets).where(eq(budgets.id, id)).get();
    if (!existing) return c.json({ ok: false, error: 'Budget not found' }, 404);

    const body = await c.req.json();
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.financialYear !== undefined) updates.financialYear = body.financialYear;
    if (body.status !== undefined) updates.status = body.status;

    if (Object.keys(updates).length > 0) {
      await db.update(budgets).set(updates).where(eq(budgets.id, id));
    }

    // Replace budget lines if provided
    if (body.lines !== undefined) {
      await db.delete(budgetLines).where(eq(budgetLines.budgetId, id));
      for (const line of body.lines) {
        await db.insert(budgetLines).values({
          id: randomUUID(),
          budgetId: id,
          accountCode: line.accountCode,
          accountName: line.accountName ?? '',
          month1: line.month1 ?? 0,
          month2: line.month2 ?? 0,
          month3: line.month3 ?? 0,
          month4: line.month4 ?? 0,
          month5: line.month5 ?? 0,
          month6: line.month6 ?? 0,
          month7: line.month7 ?? 0,
          month8: line.month8 ?? 0,
          month9: line.month9 ?? 0,
          month10: line.month10 ?? 0,
          month11: line.month11 ?? 0,
          month12: line.month12 ?? 0,
        });
      }
    }

    const updated = await db.select().from(budgets).where(eq(budgets.id, id)).get();
    const updatedLines = await db.select().from(budgetLines).where(eq(budgetLines.budgetId, id)).all();
    return c.json({ ok: true, data: { ...updated, lines: updatedLines } });
  });

  router.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(budgets).where(eq(budgets.id, id)).get();
    if (!existing) return c.json({ ok: false, error: 'Budget not found' }, 404);
    await db.delete(budgets).where(eq(budgets.id, id));
    return c.json({ ok: true, data: { id } });
  });

  return router;
}
