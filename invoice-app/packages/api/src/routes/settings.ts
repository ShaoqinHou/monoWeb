import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { settings } from '../db/schema';
import type { Db } from '../db/index';

export function settingsRoutes(db: Db) {
  const router = new Hono();

  router.get('/', async (c) => {
    const rows = await db.select().from(settings).all();
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return c.json({ ok: true, data: result });
  });

  router.get('/:key', async (c) => {
    const key = c.req.param('key');
    const row = await db.select().from(settings).where(eq(settings.key, key)).get();
    if (!row) return c.json({ ok: false, error: 'Setting not found' }, 404);
    return c.json({ ok: true, data: row });
  });

  router.put('/:key', async (c) => {
    const key = c.req.param('key');
    const body = await c.req.json();
    if (body.value === undefined) return c.json({ ok: false, error: 'value required' }, 400);

    const now = new Date().toISOString();
    const existing = await db.select().from(settings).where(eq(settings.key, key)).get();

    if (existing) {
      await db.update(settings).set({ value: String(body.value), updatedAt: now }).where(eq(settings.key, key));
    } else {
      await db.insert(settings).values({ key, value: String(body.value), updatedAt: now });
    }

    const updated = await db.select().from(settings).where(eq(settings.key, key)).get();
    return c.json({ ok: true, data: updated });
  });

  router.delete('/:key', async (c) => {
    const key = c.req.param('key');
    const existing = await db.select().from(settings).where(eq(settings.key, key)).get();
    if (!existing) return c.json({ ok: false, error: 'Setting not found' }, 404);
    await db.delete(settings).where(eq(settings.key, key));
    return c.json({ ok: true, data: { key } });
  });

  return router;
}
