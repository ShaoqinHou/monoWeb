import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { CreateTrackingCategorySchema, UpdateTrackingCategorySchema } from '@xero-replica/shared';
import { trackingCategories } from '../db/schema';
import type { Db } from '../db/index';

export function trackingCategoryRoutes(db: Db) {
  const router = new Hono();

  // GET /api/tracking-categories — List all tracking categories
  router.get('/', async (c) => {
    const rows = await db.select().from(trackingCategories).all();
    const parsed = rows.map((r) => ({
      ...r,
      options: JSON.parse(r.options),
    }));
    return c.json({ ok: true, data: parsed });
  });

  // GET /api/tracking-categories/:id — Get single tracking category
  router.get('/:id', async (c) => {
    const id = c.req.param('id');
    const rows = await db.select().from(trackingCategories).where(eq(trackingCategories.id, id)).all();
    if (rows.length === 0) {
      return c.json({ ok: false, error: 'Tracking category not found' }, 404);
    }
    const row = rows[0];
    return c.json({ ok: true, data: { ...row, options: JSON.parse(row.options) } });
  });

  // POST /api/tracking-categories — Create a tracking category
  router.post('/', async (c) => {
    const body = await c.req.json();
    const parsed = CreateTrackingCategorySchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ ok: false, error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const now = new Date().toISOString();
    const id = randomUUID();
    const data = parsed.data;

    // Assign IDs to options if not present
    const options = (data.options ?? []).map((opt) => ({
      id: opt.id || randomUUID(),
      name: opt.name,
      isActive: opt.isActive ?? true,
    }));

    await db.insert(trackingCategories).values({
      id,
      name: data.name,
      options: JSON.stringify(options),
      createdAt: now,
      updatedAt: now,
    });

    const rows = await db.select().from(trackingCategories).where(eq(trackingCategories.id, id)).all();
    const row = rows[0];
    return c.json({ ok: true, data: { ...row, options: JSON.parse(row.options) } }, 201);
  });

  // PUT /api/tracking-categories/:id — Update a tracking category
  router.put('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(trackingCategories).where(eq(trackingCategories.id, id)).all();
    if (existing.length === 0) {
      return c.json({ ok: false, error: 'Tracking category not found' }, 404);
    }

    const body = await c.req.json();
    const parsed = UpdateTrackingCategorySchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ ok: false, error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { updatedAt: now };
    const data = parsed.data;

    if (data.name !== undefined) updates.name = data.name;
    if (data.options !== undefined) {
      const options = data.options.map((opt) => ({
        id: opt.id || randomUUID(),
        name: opt.name,
        isActive: opt.isActive ?? true,
      }));
      updates.options = JSON.stringify(options);
    }

    await db.update(trackingCategories).set(updates).where(eq(trackingCategories.id, id));
    const rows = await db.select().from(trackingCategories).where(eq(trackingCategories.id, id)).all();
    const row = rows[0];
    return c.json({ ok: true, data: { ...row, options: JSON.parse(row.options) } });
  });

  // DELETE /api/tracking-categories/:id — Delete a tracking category
  router.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(trackingCategories).where(eq(trackingCategories.id, id)).all();
    if (existing.length === 0) {
      return c.json({ ok: false, error: 'Tracking category not found' }, 404);
    }

    await db.delete(trackingCategories).where(eq(trackingCategories.id, id));
    return c.json({ ok: true, data: { id } });
  });

  return router;
}
