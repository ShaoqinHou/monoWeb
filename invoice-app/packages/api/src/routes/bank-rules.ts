import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { bankRules } from '../db/schema';
import type { Db } from '../db/index';

export function bankRuleRoutes(db: Db) {
  const router = new Hono();

  router.get('/', async (c) => {
    const rows = await db.select().from(bankRules).all();
    return c.json({ ok: true, data: rows });
  });

  router.get('/:id', async (c) => {
    const id = c.req.param('id');
    const row = await db.select().from(bankRules).where(eq(bankRules.id, id)).get();
    if (!row) return c.json({ ok: false, error: 'Bank rule not found' }, 404);
    return c.json({ ok: true, data: row });
  });

  router.post('/', async (c) => {
    const body = await c.req.json();
    if (!body.name || !body.accountId || !body.matchValue || !body.allocateToAccountCode) {
      return c.json({ ok: false, error: 'name, accountId, matchValue, and allocateToAccountCode required' }, 400);
    }

    const now = new Date().toISOString();
    const id = randomUUID();

    await db.insert(bankRules).values({
      id,
      name: body.name,
      accountId: body.accountId,
      matchField: body.matchField ?? 'description',
      matchType: body.matchType ?? 'contains',
      matchValue: body.matchValue,
      allocateToAccountCode: body.allocateToAccountCode,
      taxRate: body.taxRate ?? 15,
      isActive: body.isActive ?? true,
      createdAt: now,
    });

    const created = await db.select().from(bankRules).where(eq(bankRules.id, id)).get();
    return c.json({ ok: true, data: created }, 201);
  });

  router.put('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(bankRules).where(eq(bankRules.id, id)).get();
    if (!existing) return c.json({ ok: false, error: 'Bank rule not found' }, 404);

    const body = await c.req.json();
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.accountId !== undefined) updates.accountId = body.accountId;
    if (body.matchField !== undefined) updates.matchField = body.matchField;
    if (body.matchType !== undefined) updates.matchType = body.matchType;
    if (body.matchValue !== undefined) updates.matchValue = body.matchValue;
    if (body.allocateToAccountCode !== undefined) updates.allocateToAccountCode = body.allocateToAccountCode;
    if (body.taxRate !== undefined) updates.taxRate = body.taxRate;
    if (body.isActive !== undefined) updates.isActive = body.isActive;

    await db.update(bankRules).set(updates).where(eq(bankRules.id, id));
    const updated = await db.select().from(bankRules).where(eq(bankRules.id, id)).get();
    return c.json({ ok: true, data: updated });
  });

  router.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(bankRules).where(eq(bankRules.id, id)).get();
    if (!existing) return c.json({ ok: false, error: 'Bank rule not found' }, 404);
    await db.delete(bankRules).where(eq(bankRules.id, id));
    return c.json({ ok: true, data: { id } });
  });

  return router;
}
