import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { leaveRequests, employees } from '../db/schema';
import type { Db } from '../db/index';

export function leaveRequestRoutes(db: Db) {
  const router = new Hono();

  router.get('/', async (c) => {
    const rows = await db.select().from(leaveRequests).all();
    return c.json({ ok: true, data: rows });
  });

  router.get('/:id', async (c) => {
    const id = c.req.param('id');
    const row = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id)).get();
    if (!row) return c.json({ ok: false, error: 'Leave request not found' }, 404);
    return c.json({ ok: true, data: row });
  });

  router.post('/', async (c) => {
    const body = await c.req.json();
    if (!body.employeeId || !body.leaveType || !body.startDate || !body.endDate || body.hours === undefined) {
      return c.json({ ok: false, error: 'employeeId, leaveType, startDate, endDate, and hours required' }, 400);
    }

    const employee = await db.select().from(employees).where(eq(employees.id, body.employeeId)).get();
    if (!employee) return c.json({ ok: false, error: 'Employee not found' }, 400);

    const validTypes = ['annual', 'sick', 'bereavement', 'parental', 'unpaid'];
    if (!validTypes.includes(body.leaveType)) return c.json({ ok: false, error: 'Invalid leave type' }, 400);

    const now = new Date().toISOString();
    const id = randomUUID();

    await db.insert(leaveRequests).values({
      id,
      employeeId: body.employeeId,
      leaveType: body.leaveType,
      startDate: body.startDate,
      endDate: body.endDate,
      hours: body.hours,
      status: 'pending',
      notes: body.notes ?? null,
      createdAt: now,
    });

    const created = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id)).get();
    return c.json({ ok: true, data: created }, 201);
  });

  router.put('/:id/approve', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id)).get();
    if (!existing) return c.json({ ok: false, error: 'Leave request not found' }, 404);
    if (existing.status !== 'pending') return c.json({ ok: false, error: 'Only pending requests can be approved' }, 400);

    await db.update(leaveRequests).set({ status: 'approved' }).where(eq(leaveRequests.id, id));
    const updated = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id)).get();
    return c.json({ ok: true, data: updated });
  });

  router.put('/:id/decline', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id)).get();
    if (!existing) return c.json({ ok: false, error: 'Leave request not found' }, 404);
    if (existing.status !== 'pending') return c.json({ ok: false, error: 'Only pending requests can be declined' }, 400);

    await db.update(leaveRequests).set({ status: 'declined' }).where(eq(leaveRequests.id, id));
    const updated = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id)).get();
    return c.json({ ok: true, data: updated });
  });

  router.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id)).get();
    if (!existing) return c.json({ ok: false, error: 'Leave request not found' }, 404);
    if (existing.status !== 'pending') return c.json({ ok: false, error: 'Only pending requests can be deleted' }, 400);
    await db.delete(leaveRequests).where(eq(leaveRequests.id, id));
    return c.json({ ok: true, data: { id } });
  });

  return router;
}
