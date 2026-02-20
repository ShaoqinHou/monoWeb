import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { smartLists } from '../db/schema';
import type { Db } from '../db/index';

export function smartListRoutes(db: Db) {
  const router = new Hono();

  // GET / — List all smart lists
  router.get('/', async (c) => {
    const rows = await db.select().from(smartLists).all();
    const parsed = rows.map((r) => ({
      ...r,
      filters: JSON.parse(r.filters),
    }));
    return c.json({ ok: true, data: parsed });
  });

  // GET /:id — Get single smart list
  router.get('/:id', async (c) => {
    const id = c.req.param('id');
    const row = await db.select().from(smartLists).where(eq(smartLists.id, id)).get();
    if (!row) {
      return c.json({ ok: false, error: 'Smart list not found' }, 404);
    }
    return c.json({ ok: true, data: { ...row, filters: JSON.parse(row.filters) } });
  });

  // POST / — Create a smart list
  router.post('/', async (c) => {
    const body = await c.req.json();
    if (!body.name || body.filters === undefined) {
      return c.json({ ok: false, error: 'name and filters are required' }, 400);
    }

    const now = new Date().toISOString();
    const id = randomUUID();

    await db.insert(smartLists).values({
      id,
      name: body.name,
      filters: typeof body.filters === 'string' ? body.filters : JSON.stringify(body.filters),
      createdAt: now,
    });

    const row = await db.select().from(smartLists).where(eq(smartLists.id, id)).get();
    return c.json({ ok: true, data: { ...row!, filters: JSON.parse(row!.filters) } }, 201);
  });

  // PUT /:id — Update a smart list
  router.put('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(smartLists).where(eq(smartLists.id, id)).get();
    if (!existing) {
      return c.json({ ok: false, error: 'Smart list not found' }, 404);
    }

    const body = await c.req.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.filters !== undefined) {
      updates.filters = typeof body.filters === 'string' ? body.filters : JSON.stringify(body.filters);
    }

    await db.update(smartLists).set(updates).where(eq(smartLists.id, id));
    const row = await db.select().from(smartLists).where(eq(smartLists.id, id)).get();
    return c.json({ ok: true, data: { ...row!, filters: JSON.parse(row!.filters) } });
  });

  // DELETE /:id — Delete a smart list
  router.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(smartLists).where(eq(smartLists.id, id)).get();
    if (!existing) {
      return c.json({ ok: false, error: 'Smart list not found' }, 404);
    }

    await db.delete(smartLists).where(eq(smartLists.id, id));
    return c.json({ ok: true, data: { id } });
  });

  return router;
}
