import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { projectTasks, projects } from '../db/schema';
import type { Db } from '../db/index';

export function projectTaskRoutes(db: Db) {
  const router = new Hono();

  router.get('/', async (c) => {
    const projectId = c.req.query('projectId');
    if (projectId) {
      const rows = await db.select().from(projectTasks).where(eq(projectTasks.projectId, projectId)).all();
      return c.json({ ok: true, data: rows });
    }
    const rows = await db.select().from(projectTasks).all();
    return c.json({ ok: true, data: rows });
  });

  router.get('/:id', async (c) => {
    const id = c.req.param('id');
    const row = await db.select().from(projectTasks).where(eq(projectTasks.id, id)).get();
    if (!row) return c.json({ ok: false, error: 'Project task not found' }, 404);
    return c.json({ ok: true, data: row });
  });

  router.post('/', async (c) => {
    const body = await c.req.json();
    if (!body.projectId || !body.name) {
      return c.json({ ok: false, error: 'projectId and name required' }, 400);
    }

    const project = await db.select().from(projects).where(eq(projects.id, body.projectId)).get();
    if (!project) return c.json({ ok: false, error: 'Project not found' }, 400);

    const now = new Date().toISOString();
    const id = randomUUID();

    await db.insert(projectTasks).values({
      id,
      projectId: body.projectId,
      name: body.name,
      description: body.description ?? null,
      status: 'todo',
      assigneeId: body.assigneeId ?? null,
      estimatedHours: body.estimatedHours ?? null,
      actualHours: 0,
      dueDate: body.dueDate ?? null,
      createdAt: now,
    });

    const created = await db.select().from(projectTasks).where(eq(projectTasks.id, id)).get();
    return c.json({ ok: true, data: created }, 201);
  });

  router.put('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(projectTasks).where(eq(projectTasks.id, id)).get();
    if (!existing) return c.json({ ok: false, error: 'Project task not found' }, 404);

    const body = await c.req.json();
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.status !== undefined) updates.status = body.status;
    if (body.assigneeId !== undefined) updates.assigneeId = body.assigneeId;
    if (body.estimatedHours !== undefined) updates.estimatedHours = body.estimatedHours;
    if (body.actualHours !== undefined) updates.actualHours = body.actualHours;
    if (body.dueDate !== undefined) updates.dueDate = body.dueDate;

    await db.update(projectTasks).set(updates).where(eq(projectTasks.id, id));
    const updated = await db.select().from(projectTasks).where(eq(projectTasks.id, id)).get();
    return c.json({ ok: true, data: updated });
  });

  router.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(projectTasks).where(eq(projectTasks.id, id)).get();
    if (!existing) return c.json({ ok: false, error: 'Project task not found' }, 404);
    await db.delete(projectTasks).where(eq(projectTasks.id, id));
    return c.json({ ok: true, data: { id } });
  });

  return router;
}
