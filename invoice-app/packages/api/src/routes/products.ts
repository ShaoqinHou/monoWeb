import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { CreateProductSchema, UpdateProductSchema, StockAdjustmentSchema } from '@xero-replica/shared';
import { products, stockMovements } from '../db/schema';
import type { Db } from '../db/index';

export function productRoutes(db: Db) {
  const router = new Hono();

  // GET /api/products — List all products
  router.get('/', async (c) => {
    const rows = await db.select().from(products).all();
    return c.json({ ok: true, data: rows });
  });

  // GET /api/products/:id — Get single product
  router.get('/:id', async (c) => {
    const id = c.req.param('id');
    const rows = await db.select().from(products).where(eq(products.id, id)).all();
    if (rows.length === 0) {
      return c.json({ ok: false, error: 'Product not found' }, 404);
    }
    return c.json({ ok: true, data: rows[0] });
  });

  // POST /api/products — Create a product
  router.post('/', async (c) => {
    const body = await c.req.json();
    const parsed = CreateProductSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ ok: false, error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const now = new Date().toISOString();
    const id = randomUUID();
    const data = parsed.data;

    await db.insert(products).values({
      id,
      code: data.code,
      name: data.name,
      description: data.description ?? null,
      purchasePrice: data.purchasePrice ?? 0,
      salePrice: data.salePrice ?? 0,
      accountCode: data.accountCode ?? null,
      taxRate: data.taxRate ?? 15,
      isTracked: data.isTracked ?? false,
      quantityOnHand: data.quantityOnHand ?? 0,
      isSold: data.isSold ?? true,
      isPurchased: data.isPurchased ?? true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const rows = await db.select().from(products).where(eq(products.id, id)).all();
    return c.json({ ok: true, data: rows[0] }, 201);
  });

  // PUT /api/products/:id — Update a product
  router.put('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(products).where(eq(products.id, id)).all();
    if (existing.length === 0) {
      return c.json({ ok: false, error: 'Product not found' }, 404);
    }

    const body = await c.req.json();
    const parsed = UpdateProductSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ ok: false, error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { updatedAt: now };
    const data = parsed.data;

    if (data.code !== undefined) updates.code = data.code;
    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.purchasePrice !== undefined) updates.purchasePrice = data.purchasePrice;
    if (data.salePrice !== undefined) updates.salePrice = data.salePrice;
    if (data.accountCode !== undefined) updates.accountCode = data.accountCode;
    if (data.taxRate !== undefined) updates.taxRate = data.taxRate;
    if (data.isTracked !== undefined) updates.isTracked = data.isTracked;
    if (data.quantityOnHand !== undefined) updates.quantityOnHand = data.quantityOnHand;
    if (data.isSold !== undefined) updates.isSold = data.isSold;
    if (data.isPurchased !== undefined) updates.isPurchased = data.isPurchased;

    await db.update(products).set(updates).where(eq(products.id, id));
    const rows = await db.select().from(products).where(eq(products.id, id)).all();
    return c.json({ ok: true, data: rows[0] });
  });

  // POST /api/products/:id/adjust — Manual stock adjustment
  router.post('/:id/adjust', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(products).where(eq(products.id, id)).all();
    if (existing.length === 0) {
      return c.json({ ok: false, error: 'Product not found' }, 404);
    }
    const product = existing[0];

    if (!product.isTracked) {
      return c.json({ ok: false, error: 'Product is not inventory-tracked' }, 400);
    }

    const body = await c.req.json();
    const parsed = StockAdjustmentSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ ok: false, error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const { quantity, reason, notes } = parsed.data;
    const newQty = product.quantityOnHand + quantity;
    const now = new Date().toISOString();

    await db.update(products).set({ quantityOnHand: newQty, updatedAt: now }).where(eq(products.id, id));

    const movementId = randomUUID();
    await db.insert(stockMovements).values({
      id: movementId,
      productId: id,
      type: 'adjustment',
      quantity,
      reason,
      notes: notes ?? null,
      referenceId: null,
      createdAt: now,
    });

    const updated = await db.select().from(products).where(eq(products.id, id)).all();
    return c.json({ ok: true, data: updated[0] });
  });

  // GET /api/products/:id/movements — Stock movement log
  router.get('/:id/movements', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(products).where(eq(products.id, id)).all();
    if (existing.length === 0) {
      return c.json({ ok: false, error: 'Product not found' }, 404);
    }

    const movements = await db.select().from(stockMovements).where(eq(stockMovements.productId, id)).all();
    return c.json({ ok: true, data: movements });
  });

  // DELETE /api/products/:id — Delete a product (soft-delete via isActive)
  router.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(products).where(eq(products.id, id)).all();
    if (existing.length === 0) {
      return c.json({ ok: false, error: 'Product not found' }, 404);
    }

    await db.delete(products).where(eq(products.id, id));
    return c.json({ ok: true, data: { id } });
  });

  return router;
}
