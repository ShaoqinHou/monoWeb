import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDb } from '../db/test-helpers';
import { createApp } from '../app';
import type { Db } from '../db/index';

let db: Db;
let cleanup: () => void;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  const testDb = createTestDb();
  db = testDb.db;
  cleanup = testDb.cleanup;
  app = createApp(db);
});

afterEach(() => cleanup());

function req(method: string, path: string, body?: unknown) {
  return app.request(path, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
  });
}

async function createContact(name = 'Test Customer'): Promise<string> {
  const res = await req('POST', '/api/contacts', { name, type: 'customer' });
  const json = await res.json();
  return json.data.id;
}

async function createTrackedProduct(code: string, name: string, qty: number): Promise<string> {
  const res = await req('POST', '/api/products', {
    code,
    name,
    isTracked: true,
    quantityOnHand: qty,
    salePrice: 100,
    purchasePrice: 50,
  });
  const json = await res.json();
  return json.data.id;
}

describe('Inventory Auto-Tracking', () => {
  describe('Invoice creation decrements inventory', () => {
    it('decrements quantityOnHand when invoice has productId line items', async () => {
      const contactId = await createContact();
      const productId = await createTrackedProduct('W-001', 'Widget', 100);

      await req('POST', '/api/invoices', {
        contactId,
        date: '2026-02-15',
        dueDate: '2026-03-15',
        lineItems: [
          { description: 'Widget x5', quantity: 5, unitPrice: 100, taxRate: 15, discount: 0, productId },
        ],
      });

      const productRes = await req('GET', `/api/products/${productId}`);
      const product = await productRes.json();
      expect(product.data.quantityOnHand).toBe(95);
    });

    it('does not decrement for line items without productId', async () => {
      const contactId = await createContact();
      const productId = await createTrackedProduct('W-002', 'Gadget', 50);

      await req('POST', '/api/invoices', {
        contactId,
        date: '2026-02-15',
        dueDate: '2026-03-15',
        lineItems: [
          { description: 'Service', quantity: 1, unitPrice: 200, taxRate: 15, discount: 0 },
        ],
      });

      const productRes = await req('GET', `/api/products/${productId}`);
      const product = await productRes.json();
      expect(product.data.quantityOnHand).toBe(50);
    });

    it('creates a stock movement record on invoice', async () => {
      const contactId = await createContact();
      const productId = await createTrackedProduct('W-003', 'Sprocket', 200);

      await req('POST', '/api/invoices', {
        contactId,
        date: '2026-02-15',
        dueDate: '2026-03-15',
        lineItems: [
          { description: 'Sprocket', quantity: 10, unitPrice: 50, taxRate: 15, discount: 0, productId },
        ],
      });

      const movRes = await req('GET', `/api/products/${productId}/movements`);
      const movements = await movRes.json();
      expect(movements.data).toHaveLength(1);
      expect(movements.data[0].type).toBe('invoice');
      expect(movements.data[0].quantity).toBe(-10);
    });
  });

  describe('Bill creation increments inventory', () => {
    it('increments quantityOnHand when bill has productId line items', async () => {
      const contactId = await createContact('Supplier Inc');
      const productId = await createTrackedProduct('W-004', 'Bolt', 100);

      await req('POST', '/api/bills', {
        contactId,
        date: '2026-02-15',
        dueDate: '2026-03-15',
        lineItems: [
          { description: 'Bolt restock', quantity: 50, unitPrice: 10, taxRate: 15, discount: 0, productId },
        ],
      });

      const productRes = await req('GET', `/api/products/${productId}`);
      const product = await productRes.json();
      expect(product.data.quantityOnHand).toBe(150);
    });

    it('creates a stock movement record on bill', async () => {
      const contactId = await createContact('Supplier Inc');
      const productId = await createTrackedProduct('W-005', 'Nut', 50);

      await req('POST', '/api/bills', {
        contactId,
        date: '2026-02-15',
        dueDate: '2026-03-15',
        lineItems: [
          { description: 'Nut restock', quantity: 25, unitPrice: 5, taxRate: 15, discount: 0, productId },
        ],
      });

      const movRes = await req('GET', `/api/products/${productId}/movements`);
      const movements = await movRes.json();
      expect(movements.data).toHaveLength(1);
      expect(movements.data[0].type).toBe('bill');
      expect(movements.data[0].quantity).toBe(25);
    });
  });

  describe('Manual stock adjustment', () => {
    it('POST /api/products/:id/adjust adjusts stock and creates movement', async () => {
      const productId = await createTrackedProduct('W-006', 'Screw', 100);

      const res = await req('POST', `/api/products/${productId}/adjust`, {
        quantity: -15,
        reason: 'damaged',
        notes: 'Dropped box',
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.quantityOnHand).toBe(85);

      const movRes = await req('GET', `/api/products/${productId}/movements`);
      const movements = await movRes.json();
      expect(movements.data).toHaveLength(1);
      expect(movements.data[0].type).toBe('adjustment');
      expect(movements.data[0].quantity).toBe(-15);
      expect(movements.data[0].reason).toBe('damaged');
      expect(movements.data[0].notes).toBe('Dropped box');
    });

    it('rejects adjustment for non-tracked product', async () => {
      const res = await req('POST', '/api/products', {
        code: 'SVC-001',
        name: 'Service',
        isTracked: false,
      });
      const { data: product } = await res.json();

      const adjustRes = await req('POST', `/api/products/${product.id}/adjust`, {
        quantity: 10,
        reason: 'stock_take',
      });
      expect(adjustRes.status).toBe(400);
      const body = await adjustRes.json();
      expect(body.error).toContain('not inventory-tracked');
    });

    it('rejects invalid adjustment data', async () => {
      const productId = await createTrackedProduct('W-007', 'Washer', 50);

      const res = await req('POST', `/api/products/${productId}/adjust`, {
        quantity: 10,
        reason: 'invalid_reason',
      });
      expect(res.status).toBe(400);
    });

    it('returns 404 for unknown product', async () => {
      const res = await req('POST', '/api/products/nonexistent/adjust', {
        quantity: 10,
        reason: 'stock_take',
      });
      expect(res.status).toBe(404);
    });

    it('supports positive adjustments (stock take increase)', async () => {
      const productId = await createTrackedProduct('W-008', 'Rivet', 30);

      const res = await req('POST', `/api/products/${productId}/adjust`, {
        quantity: 20,
        reason: 'stock_take',
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.quantityOnHand).toBe(50);
    });
  });

  describe('Stock movements endpoint', () => {
    it('GET /api/products/:id/movements returns empty for new product', async () => {
      const productId = await createTrackedProduct('W-009', 'Pin', 100);

      const res = await req('GET', `/api/products/${productId}/movements`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toEqual([]);
    });

    it('returns 404 for unknown product', async () => {
      const res = await req('GET', '/api/products/nonexistent/movements');
      expect(res.status).toBe(404);
    });
  });
});
