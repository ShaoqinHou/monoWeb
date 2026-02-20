import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { connectedApps } from '../db/schema';
import type { Db } from '../db/index';

const DEFAULT_APPS = [
  { name: 'Stripe', description: 'Online payment processing', icon: 'stripe', connected: 0 },
  { name: 'HubSpot', description: 'CRM and marketing automation', icon: 'hubspot', connected: 0 },
  { name: 'Shopify', description: 'E-commerce platform', icon: 'shopify', connected: 0 },
  { name: 'PayPal', description: 'Online payments', icon: 'paypal', connected: 0 },
  { name: 'Dext', description: 'Receipt and invoice capture', icon: 'dext', connected: 0 },
];

export function connectedAppRoutes(db: Db) {
  const router = new Hono();

  // GET / — List all connected apps (seeds defaults if empty)
  router.get('/', async (c) => {
    let rows = await db.select().from(connectedApps).all();

    if (rows.length === 0) {
      const now = new Date().toISOString();
      for (const app of DEFAULT_APPS) {
        await db.insert(connectedApps).values({
          id: randomUUID(),
          name: app.name,
          description: app.description,
          icon: app.icon,
          connected: app.connected,
          updatedAt: now,
        });
      }
      rows = await db.select().from(connectedApps).all();
    }

    return c.json({ ok: true, data: rows });
  });

  // PUT /:id — Toggle connected status
  router.put('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(connectedApps).where(eq(connectedApps.id, id)).get();
    if (!existing) {
      return c.json({ ok: false, error: 'Connected app not found' }, 404);
    }

    const body = await c.req.json();
    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { updatedAt: now };

    if (body.connected !== undefined) updates.connected = body.connected;
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.icon !== undefined) updates.icon = body.icon;

    await db.update(connectedApps).set(updates).where(eq(connectedApps.id, id));
    const row = await db.select().from(connectedApps).where(eq(connectedApps.id, id)).get();
    return c.json({ ok: true, data: row });
  });

  return router;
}
