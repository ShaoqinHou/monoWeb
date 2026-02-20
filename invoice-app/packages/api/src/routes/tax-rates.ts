import { Hono } from 'hono';
import { taxRates } from '../db/schema';
import type { Db } from '../db/index';

export function taxRateRoutes(db: Db) {
  const router = new Hono();

  // GET /api/tax-rates — List all active tax rates
  router.get('/', async (c) => {
    const rows = await db.select().from(taxRates).all();
    return c.json({ ok: true, data: rows });
  });

  return router;
}
