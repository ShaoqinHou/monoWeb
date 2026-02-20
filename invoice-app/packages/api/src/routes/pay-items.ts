import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { payItems } from '../db/schema';
import type { Db } from '../db/index';

export function payItemRoutes(db: Db) {
  const router = new Hono();

  router.get('/', async (c) => {
    const rows = await db.select().from(payItems).all();
    return c.json({ ok: true, data: rows });
  });

  router.get('/:id', async (c) => {
    const id = c.req.param('id');
    const row = await db.select().from(payItems).where(eq(payItems.id, id)).get();
    if (!row) return c.json({ ok: false, error: 'Pay item not found' }, 404);
    return c.json({ ok: true, data: row });
  });

  router.post('/', async (c) => {
    const body = await c.req.json();
    if (!body.name || !body.type) {
      return c.json({ ok: false, error: 'name and type required' }, 400);
    }

    const validTypes = ['earnings', 'deduction', 'reimbursement', 'tax'];
    if (!validTypes.includes(body.type)) return c.json({ ok: false, error: 'Invalid type' }, 400);

    const validRateTypes = ['fixed', 'per_hour', 'percentage'];
    if (body.rateType && !validRateTypes.includes(body.rateType)) {
      return c.json({ ok: false, error: 'Invalid rate type' }, 400);
    }

    const now = new Date().toISOString();
    const id = randomUUID();

    await db.insert(payItems).values({
      id,
      name: body.name,
      type: body.type,
      rateType: body.rateType ?? 'fixed',
      amount: body.amount ?? 0,
      accountCode: body.accountCode ?? null,
      isDefault: body.isDefault ?? false,
      isActive: body.isActive ?? true,
      createdAt: now,
    });

    const created = await db.select().from(payItems).where(eq(payItems.id, id)).get();
    return c.json({ ok: true, data: created }, 201);
  });

  router.put('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(payItems).where(eq(payItems.id, id)).get();
    if (!existing) return c.json({ ok: false, error: 'Pay item not found' }, 404);

    const body = await c.req.json();
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.type !== undefined) updates.type = body.type;
    if (body.rateType !== undefined) updates.rateType = body.rateType;
    if (body.amount !== undefined) updates.amount = body.amount;
    if (body.accountCode !== undefined) updates.accountCode = body.accountCode;
    if (body.isDefault !== undefined) updates.isDefault = body.isDefault;
    if (body.isActive !== undefined) updates.isActive = body.isActive;

    await db.update(payItems).set(updates).where(eq(payItems.id, id));
    const updated = await db.select().from(payItems).where(eq(payItems.id, id)).get();
    return c.json({ ok: true, data: updated });
  });

  router.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(payItems).where(eq(payItems.id, id)).get();
    if (!existing) return c.json({ ok: false, error: 'Pay item not found' }, 404);
    await db.delete(payItems).where(eq(payItems.id, id));
    return c.json({ ok: true, data: { id } });
  });

  return router;
}
