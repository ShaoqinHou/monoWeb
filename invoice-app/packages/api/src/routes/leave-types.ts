import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { leaveTypes } from '../db/schema';
import type { Db } from '../db/index';

export function leaveTypeRoutes(db: Db) {
  const router = new Hono();

  // GET / — List all leave types
  router.get('/', async (c) => {
    const rows = await db.select().from(leaveTypes).all();
    return c.json({ ok: true, data: rows });
  });

  // GET /:id — Get single leave type
  router.get('/:id', async (c) => {
    const id = c.req.param('id');
    const row = await db.select().from(leaveTypes).where(eq(leaveTypes.id, id)).get();
    if (!row) {
      return c.json({ ok: false, error: 'Leave type not found' }, 404);
    }
    return c.json({ ok: true, data: row });
  });

  // POST / — Create a leave type
  router.post('/', async (c) => {
    const body = await c.req.json();
    if (!body.name) {
      return c.json({ ok: false, error: 'name is required' }, 400);
    }

    const id = randomUUID();

    await db.insert(leaveTypes).values({
      id,
      name: body.name,
      paidLeave: body.paidLeave ?? 1,
      showOnPayslip: body.showOnPayslip ?? 1,
      defaultDaysPerYear: body.defaultDaysPerYear ?? 0,
    });

    const row = await db.select().from(leaveTypes).where(eq(leaveTypes.id, id)).get();
    return c.json({ ok: true, data: row }, 201);
  });

  // PUT /:id — Update a leave type
  router.put('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(leaveTypes).where(eq(leaveTypes.id, id)).get();
    if (!existing) {
      return c.json({ ok: false, error: 'Leave type not found' }, 404);
    }

    const body = await c.req.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.paidLeave !== undefined) updates.paidLeave = body.paidLeave;
    if (body.showOnPayslip !== undefined) updates.showOnPayslip = body.showOnPayslip;
    if (body.defaultDaysPerYear !== undefined) updates.defaultDaysPerYear = body.defaultDaysPerYear;

    await db.update(leaveTypes).set(updates).where(eq(leaveTypes.id, id));
    const row = await db.select().from(leaveTypes).where(eq(leaveTypes.id, id)).get();
    return c.json({ ok: true, data: row });
  });

  // DELETE /:id — Delete a leave type
  router.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(leaveTypes).where(eq(leaveTypes.id, id)).get();
    if (!existing) {
      return c.json({ ok: false, error: 'Leave type not found' }, 404);
    }

    await db.delete(leaveTypes).where(eq(leaveTypes.id, id));
    return c.json({ ok: true, data: { id } });
  });

  return router;
}
