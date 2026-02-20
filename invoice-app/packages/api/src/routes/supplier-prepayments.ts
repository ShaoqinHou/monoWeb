import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { supplierPrepayments } from '../db/schema';
import type { Db } from '../db/index';

export function supplierPrepaymentRoutes(db: Db) {
  const router = new Hono();

  // GET / — List all supplier prepayments
  router.get('/', async (c) => {
    const rows = await db.select().from(supplierPrepayments).all();
    return c.json({ ok: true, data: rows });
  });

  // GET /:id — Get single supplier prepayment
  router.get('/:id', async (c) => {
    const id = c.req.param('id');
    const row = await db.select().from(supplierPrepayments).where(eq(supplierPrepayments.id, id)).get();
    if (!row) {
      return c.json({ ok: false, error: 'Supplier prepayment not found' }, 404);
    }
    return c.json({ ok: true, data: row });
  });

  // POST / — Create a supplier prepayment
  router.post('/', async (c) => {
    const body = await c.req.json();
    if (!body.contactId || body.amount === undefined || !body.date) {
      return c.json({ ok: false, error: 'contactId, amount, and date are required' }, 400);
    }

    const now = new Date().toISOString();
    const id = randomUUID();

    await db.insert(supplierPrepayments).values({
      id,
      contactId: body.contactId,
      contactName: body.contactName ?? '',
      amount: body.amount,
      balance: body.balance ?? body.amount,
      date: body.date,
      reference: body.reference ?? '',
      createdAt: now,
    });

    const row = await db.select().from(supplierPrepayments).where(eq(supplierPrepayments.id, id)).get();
    return c.json({ ok: true, data: row }, 201);
  });

  // PUT /:id — Update a supplier prepayment (balance)
  router.put('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(supplierPrepayments).where(eq(supplierPrepayments.id, id)).get();
    if (!existing) {
      return c.json({ ok: false, error: 'Supplier prepayment not found' }, 404);
    }

    const body = await c.req.json();
    const updates: Record<string, unknown> = {};

    if (body.balance !== undefined) updates.balance = body.balance;
    if (body.contactName !== undefined) updates.contactName = body.contactName;
    if (body.reference !== undefined) updates.reference = body.reference;

    await db.update(supplierPrepayments).set(updates).where(eq(supplierPrepayments.id, id));
    const row = await db.select().from(supplierPrepayments).where(eq(supplierPrepayments.id, id)).get();
    return c.json({ ok: true, data: row });
  });

  // DELETE /:id — Delete a supplier prepayment
  router.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(supplierPrepayments).where(eq(supplierPrepayments.id, id)).get();
    if (!existing) {
      return c.json({ ok: false, error: 'Supplier prepayment not found' }, 404);
    }

    await db.delete(supplierPrepayments).where(eq(supplierPrepayments.id, id));
    return c.json({ ok: true, data: { id } });
  });

  return router;
}
