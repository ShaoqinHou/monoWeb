import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { currencies } from '../db/schema';
import type { Db } from '../db/index';

export function currencyRoutes(db: Db) {
  const router = new Hono();

  // GET / — List all currencies
  router.get('/', async (c) => {
    const rows = await db.select().from(currencies).all();
    return c.json({ ok: true, data: rows });
  });

  // GET /:code — Get single currency
  router.get('/:code', async (c) => {
    const code = c.req.param('code');
    const row = await db.select().from(currencies).where(eq(currencies.code, code)).get();
    if (!row) {
      return c.json({ ok: false, error: 'Currency not found' }, 404);
    }
    return c.json({ ok: true, data: row });
  });

  // POST / — Create a currency
  router.post('/', async (c) => {
    const body = await c.req.json();
    if (!body.code || !body.name) {
      return c.json({ ok: false, error: 'code and name are required' }, 400);
    }

    const existing = await db.select().from(currencies).where(eq(currencies.code, body.code)).get();
    if (existing) {
      return c.json({ ok: false, error: 'Currency already exists' }, 400);
    }

    const now = new Date().toISOString();
    await db.insert(currencies).values({
      code: body.code,
      name: body.name,
      rate: body.rate ?? 1.0,
      enabled: body.enabled ?? 1,
      updatedAt: now,
    });

    const row = await db.select().from(currencies).where(eq(currencies.code, body.code)).get();
    return c.json({ ok: true, data: row }, 201);
  });

  // PUT /:code — Update a currency
  router.put('/:code', async (c) => {
    const code = c.req.param('code');
    const existing = await db.select().from(currencies).where(eq(currencies.code, code)).get();
    if (!existing) {
      return c.json({ ok: false, error: 'Currency not found' }, 404);
    }

    const body = await c.req.json();
    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { updatedAt: now };

    if (body.name !== undefined) updates.name = body.name;
    if (body.rate !== undefined) updates.rate = body.rate;
    if (body.enabled !== undefined) updates.enabled = body.enabled;

    await db.update(currencies).set(updates).where(eq(currencies.code, code));
    const row = await db.select().from(currencies).where(eq(currencies.code, code)).get();
    return c.json({ ok: true, data: row });
  });

  // DELETE /:code — Delete a currency
  router.delete('/:code', async (c) => {
    const code = c.req.param('code');
    const existing = await db.select().from(currencies).where(eq(currencies.code, code)).get();
    if (!existing) {
      return c.json({ ok: false, error: 'Currency not found' }, 404);
    }

    await db.delete(currencies).where(eq(currencies.code, code));
    return c.json({ ok: true, data: { code } });
  });

  return router;
}
