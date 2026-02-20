import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { timesheets } from '../db/schema';
import type { Db } from '../db/index';

export function timesheetRoutes(db: Db) {
  const router = new Hono();

  // GET /api/timesheets?projectId=X
  router.get('/', async (c) => {
    const projectId = c.req.query('projectId');
    let rows;
    if (projectId) {
      rows = await db.select().from(timesheets).where(eq(timesheets.projectId, projectId)).all();
    } else {
      rows = await db.select().from(timesheets).all();
    }
    return c.json({ ok: true, data: rows });
  });

  // GET /api/timesheets/:id
  router.get('/:id', async (c) => {
    const id = c.req.param('id');
    const row = await db.select().from(timesheets).where(eq(timesheets.id, id)).get();
    if (!row) return c.json({ ok: false, error: 'Timesheet entry not found' }, 404);
    return c.json({ ok: true, data: row });
  });

  // POST /api/timesheets
  router.post('/', async (c) => {
    const body = await c.req.json();
    if (!body.projectId || body.hours == null || !body.date) {
      return c.json({ ok: false, error: 'projectId, date, and hours required' }, 400);
    }

    const id = randomUUID();
    await db.insert(timesheets).values({
      id,
      projectId: body.projectId,
      employeeId: body.employeeId ?? null,
      date: body.date,
      hours: body.hours,
      description: body.description ?? '',
      isBillable: body.isBillable ?? true,
      isInvoiced: false,
      hourlyRate: body.hourlyRate ?? 0,
    });
    const created = await db.select().from(timesheets).where(eq(timesheets.id, id)).get();
    return c.json({ ok: true, data: created }, 201);
  });

  // PUT /api/timesheets/:id
  router.put('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(timesheets).where(eq(timesheets.id, id)).get();
    if (!existing) return c.json({ ok: false, error: 'Timesheet entry not found' }, 404);

    const body = await c.req.json();
    await db.update(timesheets).set({
      projectId: body.projectId ?? existing.projectId,
      employeeId: body.employeeId !== undefined ? body.employeeId : existing.employeeId,
      date: body.date ?? existing.date,
      hours: body.hours ?? existing.hours,
      description: body.description ?? existing.description,
      isBillable: body.isBillable ?? existing.isBillable,
      hourlyRate: body.hourlyRate ?? existing.hourlyRate,
    }).where(eq(timesheets.id, id));

    const updated = await db.select().from(timesheets).where(eq(timesheets.id, id)).get();
    return c.json({ ok: true, data: updated });
  });

  // DELETE /api/timesheets/:id
  router.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(timesheets).where(eq(timesheets.id, id)).get();
    if (!existing) return c.json({ ok: false, error: 'Timesheet entry not found' }, 404);
    await db.delete(timesheets).where(eq(timesheets.id, id));
    return c.json({ ok: true, data: { id } });
  });

  return router;
}
