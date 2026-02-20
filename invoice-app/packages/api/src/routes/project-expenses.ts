import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { projectExpenses, projects } from '../db/schema';
import type { Db } from '../db/index';

export function projectExpenseRoutes(db: Db) {
  const router = new Hono();

  router.get('/', async (c) => {
    const projectId = c.req.query('projectId');
    if (projectId) {
      const rows = await db.select().from(projectExpenses).where(eq(projectExpenses.projectId, projectId)).all();
      return c.json({ ok: true, data: rows });
    }
    const rows = await db.select().from(projectExpenses).all();
    return c.json({ ok: true, data: rows });
  });

  router.get('/:id', async (c) => {
    const id = c.req.param('id');
    const row = await db.select().from(projectExpenses).where(eq(projectExpenses.id, id)).get();
    if (!row) return c.json({ ok: false, error: 'Project expense not found' }, 404);
    return c.json({ ok: true, data: row });
  });

  router.post('/', async (c) => {
    const body = await c.req.json();
    if (!body.projectId || !body.description || body.amount === undefined || !body.date) {
      return c.json({ ok: false, error: 'projectId, description, amount, and date required' }, 400);
    }

    const project = await db.select().from(projects).where(eq(projects.id, body.projectId)).get();
    if (!project) return c.json({ ok: false, error: 'Project not found' }, 400);

    const now = new Date().toISOString();
    const id = randomUUID();

    await db.insert(projectExpenses).values({
      id,
      projectId: body.projectId,
      description: body.description,
      amount: body.amount,
      date: body.date,
      category: body.category ?? null,
      isBillable: body.isBillable ?? true,
      isInvoiced: false,
      createdAt: now,
    });

    const created = await db.select().from(projectExpenses).where(eq(projectExpenses.id, id)).get();
    return c.json({ ok: true, data: created }, 201);
  });

  router.put('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(projectExpenses).where(eq(projectExpenses.id, id)).get();
    if (!existing) return c.json({ ok: false, error: 'Project expense not found' }, 404);

    const body = await c.req.json();
    const updates: Record<string, unknown> = {};
    if (body.description !== undefined) updates.description = body.description;
    if (body.amount !== undefined) updates.amount = body.amount;
    if (body.date !== undefined) updates.date = body.date;
    if (body.category !== undefined) updates.category = body.category;
    if (body.isBillable !== undefined) updates.isBillable = body.isBillable;
    if (body.isInvoiced !== undefined) updates.isInvoiced = body.isInvoiced;

    await db.update(projectExpenses).set(updates).where(eq(projectExpenses.id, id));
    const updated = await db.select().from(projectExpenses).where(eq(projectExpenses.id, id)).get();
    return c.json({ ok: true, data: updated });
  });

  router.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(projectExpenses).where(eq(projectExpenses.id, id)).get();
    if (!existing) return c.json({ ok: false, error: 'Project expense not found' }, 404);
    await db.delete(projectExpenses).where(eq(projectExpenses.id, id));
    return c.json({ ok: true, data: { id } });
  });

  return router;
}
