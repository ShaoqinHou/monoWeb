import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createApp } from '../src/app';
import { createTestDb } from '../src/db/test-helpers';
import type { Db } from '../src/db/index';

let db: Db;
let cleanup: () => void;
let app: ReturnType<typeof createApp>;

beforeEach(async () => {
  ({ db, cleanup } = createTestDb());
  app = createApp(db);
});
afterEach(() => cleanup());

function req(method: string, path: string, body?: unknown) {
  const init: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) init.body = JSON.stringify(body);
  return app.request(path, init);
}

// ─── Expenses CRUD + Validation ──────────────────────────────────────────────

describe('Expenses API (/api/expenses)', () => {
  const validExpense = {
    date: '2026-01-15',
    description: 'Office supplies',
    amount: 100,
    taxRate: 15,
  };

  describe('Create', () => {
    it('creates with valid data and calculates taxAmount/total correctly', async () => {
      const res = await req('POST', '/api/expenses', validExpense);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.description).toBe('Office supplies');
      expect(json.data.amount).toBe(100);
      expect(json.data.taxRate).toBe(15);
      expect(json.data.taxAmount).toBe(15);
      expect(json.data.total).toBe(115);
      expect(json.data.status).toBe('draft');
      expect(typeof json.data.id).toBe('string');
      expect(typeof json.data.createdAt).toBe('string');
      expect(typeof json.data.updatedAt).toBe('string');
    });

    it('rejects missing description with 400', async () => {
      const res = await req('POST', '/api/expenses', {
        date: '2026-01-15',
        amount: 100,
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.ok).toBe(false);
    });

    it('rejects missing amount with 400', async () => {
      const res = await req('POST', '/api/expenses', {
        date: '2026-01-15',
        description: 'Office supplies',
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.ok).toBe(false);
    });

    it('rejects missing date with 400', async () => {
      const res = await req('POST', '/api/expenses', {
        description: 'Office supplies',
        amount: 100,
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.ok).toBe(false);
    });
  });

  describe('List', () => {
    it('returns empty list initially', async () => {
      const res = await req('GET', '/api/expenses');
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data).toEqual([]);
    });

    it('includes created expense in list', async () => {
      await req('POST', '/api/expenses', validExpense);
      const res = await req('GET', '/api/expenses');
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toHaveLength(1);
      expect(json.data[0].description).toBe('Office supplies');
      expect(json.data[0].total).toBe(115);
    });
  });

  describe('Get by ID', () => {
    it('returns expense by ID', async () => {
      const createRes = await req('POST', '/api/expenses', validExpense);
      const created = (await createRes.json()).data;

      const res = await req('GET', `/api/expenses/${created.id}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.id).toBe(created.id);
      expect(json.data.description).toBe('Office supplies');
      expect(json.data.taxAmount).toBe(15);
      expect(json.data.total).toBe(115);
    });

    it('returns 404 for non-existent expense', async () => {
      const res = await req('GET', '/api/expenses/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.ok).toBe(false);
    });
  });

  describe('Update', () => {
    it('updates fields and recalculates tax/total', async () => {
      const createRes = await req('POST', '/api/expenses', validExpense);
      const created = (await createRes.json()).data;

      const res = await req('PUT', `/api/expenses/${created.id}`, {
        amount: 200,
        taxRate: 10,
        description: 'Updated supplies',
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.amount).toBe(200);
      expect(json.data.taxRate).toBe(10);
      // 200 * 10 / 100 = 20
      expect(json.data.taxAmount).toBe(20);
      // 200 + 20 = 220
      expect(json.data.total).toBe(220);
      expect(json.data.description).toBe('Updated supplies');
    });

    it('returns 404 when updating non-existent expense', async () => {
      const res = await req('PUT', '/api/expenses/00000000-0000-0000-0000-000000000000', {
        amount: 200,
      });
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.ok).toBe(false);
    });
  });

  describe('Status transitions', () => {
    async function createDraftExpense() {
      const createRes = await req('POST', '/api/expenses', validExpense);
      return (await createRes.json()).data;
    }

    it('transitions draft -> submitted via PUT /:id/status', async () => {
      const expense = await createDraftExpense();
      const res = await req('PUT', `/api/expenses/${expense.id}/status`, { status: 'submitted' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.status).toBe('submitted');
    });

    it('transitions submitted -> approved via PUT /:id/status', async () => {
      const expense = await createDraftExpense();
      await req('PUT', `/api/expenses/${expense.id}/status`, { status: 'submitted' });
      const res = await req('PUT', `/api/expenses/${expense.id}/status`, { status: 'approved' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.status).toBe('approved');
    });

    it('transitions approved -> reimbursed via PUT /:id/status', async () => {
      const expense = await createDraftExpense();
      await req('PUT', `/api/expenses/${expense.id}/status`, { status: 'submitted' });
      await req('PUT', `/api/expenses/${expense.id}/status`, { status: 'approved' });
      const res = await req('PUT', `/api/expenses/${expense.id}/status`, { status: 'reimbursed' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.status).toBe('reimbursed');
    });

    it('rejects invalid status value with 400', async () => {
      const expense = await createDraftExpense();
      const res = await req('PUT', `/api/expenses/${expense.id}/status`, { status: 'nonexistent' });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.ok).toBe(false);
    });
  });

  describe('Delete', () => {
    it('deletes expense and verifies it is gone', async () => {
      const createRes = await req('POST', '/api/expenses', validExpense);
      const created = (await createRes.json()).data;

      const deleteRes = await req('DELETE', `/api/expenses/${created.id}`);
      expect(deleteRes.status).toBe(200);
      const deleteJson = await deleteRes.json();
      expect(deleteJson.ok).toBe(true);
      expect(deleteJson.data.id).toBe(created.id);

      // Verify it's gone
      const getRes = await req('GET', `/api/expenses/${created.id}`);
      expect(getRes.status).toBe(404);
    });

    it('returns 404 when deleting non-existent expense', async () => {
      const res = await req('DELETE', '/api/expenses/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.ok).toBe(false);
    });
  });
});

// ─── Products CRUD + Validation ──────────────────────────────────────────────

describe('Products API (/api/products)', () => {
  const validProduct = {
    code: 'PROD-001',
    name: 'Widget A',
  };

  describe('Create', () => {
    it('creates with valid data and verifies defaults', async () => {
      const res = await req('POST', '/api/products', validProduct);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.code).toBe('PROD-001');
      expect(json.data.name).toBe('Widget A');
      // Verify defaults
      expect(json.data.isTracked).toBe(false);
      expect(json.data.isSold).toBe(true);
      expect(json.data.isPurchased).toBe(true);
      expect(json.data.isActive).toBe(true);
      expect(json.data.purchasePrice).toBe(0);
      expect(json.data.salePrice).toBe(0);
      expect(json.data.taxRate).toBe(15);
      expect(json.data.quantityOnHand).toBe(0);
      expect(typeof json.data.id).toBe('string');
      expect(typeof json.data.createdAt).toBe('string');
      expect(typeof json.data.updatedAt).toBe('string');
    });

    it('rejects missing code with 400', async () => {
      const res = await req('POST', '/api/products', { name: 'Widget A' });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.ok).toBe(false);
    });

    it('rejects missing name with 400', async () => {
      const res = await req('POST', '/api/products', { code: 'PROD-001' });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.ok).toBe(false);
    });

    it('creates with all fields and verifies salePrice, purchasePrice, accountCode, taxRate', async () => {
      const full = {
        code: 'PROD-002',
        name: 'Widget B',
        description: 'A premium widget',
        purchasePrice: 25.50,
        salePrice: 49.99,
        accountCode: '200',
        taxRate: 10,
        isTracked: true,
        quantityOnHand: 100,
        isSold: true,
        isPurchased: false,
      };
      const res = await req('POST', '/api/products', full);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.salePrice).toBe(49.99);
      expect(json.data.purchasePrice).toBe(25.50);
      expect(json.data.accountCode).toBe('200');
      expect(json.data.taxRate).toBe(10);
      expect(json.data.description).toBe('A premium widget');
      expect(json.data.isTracked).toBe(true);
      expect(json.data.quantityOnHand).toBe(100);
      expect(json.data.isPurchased).toBe(false);
    });
  });

  describe('List', () => {
    it('returns empty list initially', async () => {
      const res = await req('GET', '/api/products');
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data).toEqual([]);
    });

    it('includes created product in list', async () => {
      await req('POST', '/api/products', validProduct);
      const res = await req('GET', '/api/products');
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toHaveLength(1);
      expect(json.data[0].code).toBe('PROD-001');
      expect(json.data[0].name).toBe('Widget A');
    });
  });

  describe('Get by ID', () => {
    it('returns product by ID', async () => {
      const createRes = await req('POST', '/api/products', validProduct);
      const created = (await createRes.json()).data;

      const res = await req('GET', `/api/products/${created.id}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.id).toBe(created.id);
      expect(json.data.code).toBe('PROD-001');
      expect(json.data.name).toBe('Widget A');
    });

    it('returns 404 for non-existent product', async () => {
      const res = await req('GET', '/api/products/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.ok).toBe(false);
    });
  });

  describe('Update', () => {
    it('updates product fields', async () => {
      const createRes = await req('POST', '/api/products', validProduct);
      const created = (await createRes.json()).data;

      const res = await req('PUT', `/api/products/${created.id}`, {
        name: 'Widget A Pro',
        salePrice: 29.99,
        purchasePrice: 12.00,
        taxRate: 10,
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.name).toBe('Widget A Pro');
      expect(json.data.salePrice).toBe(29.99);
      expect(json.data.purchasePrice).toBe(12.00);
      expect(json.data.taxRate).toBe(10);
      // code unchanged
      expect(json.data.code).toBe('PROD-001');
    });

    it('returns 404 when updating non-existent product', async () => {
      const res = await req('PUT', '/api/products/00000000-0000-0000-0000-000000000000', {
        name: 'Ghost',
      });
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.ok).toBe(false);
    });
  });

  describe('Stock adjustment', () => {
    it('creates a stock movement and updates quantity on hand', async () => {
      // Must be tracked to adjust stock
      const createRes = await req('POST', '/api/products', {
        ...validProduct,
        isTracked: true,
        quantityOnHand: 50,
      });
      const created = (await createRes.json()).data;
      expect(created.quantityOnHand).toBe(50);

      const adjustRes = await req('POST', `/api/products/${created.id}/adjust`, {
        quantity: 10,
        reason: 'stock_take',
      });
      expect(adjustRes.status).toBe(200);
      const adjustJson = await adjustRes.json();
      expect(adjustJson.ok).toBe(true);
      // 50 + 10 = 60
      expect(adjustJson.data.quantityOnHand).toBe(60);
    });

    it('supports negative stock adjustment', async () => {
      const createRes = await req('POST', '/api/products', {
        ...validProduct,
        isTracked: true,
        quantityOnHand: 50,
      });
      const created = (await createRes.json()).data;

      const adjustRes = await req('POST', `/api/products/${created.id}/adjust`, {
        quantity: -20,
        reason: 'damaged',
      });
      expect(adjustRes.status).toBe(200);
      const adjustJson = await adjustRes.json();
      // 50 - 20 = 30
      expect(adjustJson.data.quantityOnHand).toBe(30);
    });

    it('rejects adjustment on non-tracked product', async () => {
      const createRes = await req('POST', '/api/products', {
        ...validProduct,
        isTracked: false,
      });
      const created = (await createRes.json()).data;

      const adjustRes = await req('POST', `/api/products/${created.id}/adjust`, {
        quantity: 10,
        reason: 'stock_take',
      });
      expect(adjustRes.status).toBe(400);
      const json = await adjustRes.json();
      expect(json.ok).toBe(false);
    });
  });

  describe('Stock movements', () => {
    it('returns movement history after adjustment', async () => {
      const createRes = await req('POST', '/api/products', {
        ...validProduct,
        isTracked: true,
        quantityOnHand: 10,
      });
      const created = (await createRes.json()).data;

      // Make two adjustments
      await req('POST', `/api/products/${created.id}/adjust`, {
        quantity: 5,
        reason: 'stock_take',
        notes: 'First count',
      });
      await req('POST', `/api/products/${created.id}/adjust`, {
        quantity: -3,
        reason: 'damaged',
        notes: 'Broken in shipping',
      });

      const movRes = await req('GET', `/api/products/${created.id}/movements`);
      expect(movRes.status).toBe(200);
      const movJson = await movRes.json();
      expect(movJson.ok).toBe(true);
      expect(movJson.data).toHaveLength(2);

      // Verify first movement
      const mov1 = movJson.data.find((m: Record<string, unknown>) => m.quantity === 5);
      expect(mov1).toMatchObject({ type: 'adjustment', reason: 'stock_take', notes: 'First count', productId: created.id });

      // Verify second movement
      const mov2 = movJson.data.find((m: Record<string, unknown>) => m.quantity === -3);
      expect(mov2).toMatchObject({ type: 'adjustment', reason: 'damaged', notes: 'Broken in shipping' });
    });

    it('returns empty movements for product with no adjustments', async () => {
      const createRes = await req('POST', '/api/products', {
        ...validProduct,
        isTracked: true,
      });
      const created = (await createRes.json()).data;

      const movRes = await req('GET', `/api/products/${created.id}/movements`);
      expect(movRes.status).toBe(200);
      const movJson = await movRes.json();
      expect(movJson.data).toEqual([]);
    });
  });

  describe('Delete', () => {
    it('deletes product and verifies it is gone', async () => {
      const createRes = await req('POST', '/api/products', validProduct);
      const created = (await createRes.json()).data;

      const deleteRes = await req('DELETE', `/api/products/${created.id}`);
      expect(deleteRes.status).toBe(200);
      const deleteJson = await deleteRes.json();
      expect(deleteJson.ok).toBe(true);
      expect(deleteJson.data.id).toBe(created.id);

      // Verify it's gone
      const getRes = await req('GET', `/api/products/${created.id}`);
      expect(getRes.status).toBe(404);
    });

    it('returns 404 when deleting non-existent product', async () => {
      const res = await req('DELETE', '/api/products/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.ok).toBe(false);
    });
  });
});
