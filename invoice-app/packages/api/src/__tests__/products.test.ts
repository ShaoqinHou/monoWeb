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

describe('Products API', () => {
  it('GET /api/products returns empty list', async () => {
    const res = await req('GET', '/api/products');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data).toEqual([]);
  });

  it('POST /api/products creates a product', async () => {
    const res = await req('POST', '/api/products', {
      code: 'WIDGET-001',
      name: 'Widget',
      salePrice: 29.99,
      purchasePrice: 15.00,
      taxRate: 15,
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.code).toBe('WIDGET-001');
    expect(json.data.name).toBe('Widget');
    expect(json.data.salePrice).toBe(29.99);
    expect(json.data.isActive).toBe(true);
    expect(json.data.isSold).toBe(true);
    expect(json.data.isPurchased).toBe(true);
  });

  it('POST /api/products rejects missing code', async () => {
    const res = await req('POST', '/api/products', { name: 'No code' });
    expect(res.status).toBe(400);
  });

  it('POST /api/products rejects missing name', async () => {
    const res = await req('POST', '/api/products', { code: 'X' });
    expect(res.status).toBe(400);
  });

  it('GET /api/products/:id returns single product', async () => {
    const createRes = await req('POST', '/api/products', {
      code: 'P1',
      name: 'Product 1',
    });
    const { data: created } = await createRes.json();

    const res = await req('GET', `/api/products/${created.id}`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.code).toBe('P1');
  });

  it('GET /api/products/:id returns 404 for unknown', async () => {
    const res = await req('GET', '/api/products/nonexistent');
    expect(res.status).toBe(404);
  });

  it('PUT /api/products/:id updates a product', async () => {
    const createRes = await req('POST', '/api/products', {
      code: 'P2',
      name: 'Product 2',
      salePrice: 10,
    });
    const { data: created } = await createRes.json();

    const res = await req('PUT', `/api/products/${created.id}`, {
      salePrice: 25,
      name: 'Updated Product 2',
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.salePrice).toBe(25);
    expect(json.data.name).toBe('Updated Product 2');
  });

  it('DELETE /api/products/:id removes a product', async () => {
    const createRes = await req('POST', '/api/products', {
      code: 'DEL',
      name: 'To delete',
    });
    const { data: created } = await createRes.json();

    const res = await req('DELETE', `/api/products/${created.id}`);
    expect(res.status).toBe(200);

    const getRes = await req('GET', `/api/products/${created.id}`);
    expect(getRes.status).toBe(404);
  });
});
