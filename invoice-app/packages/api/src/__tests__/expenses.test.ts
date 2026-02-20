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

describe('Expenses API', () => {
  it('GET /api/expenses returns empty list', async () => {
    const res = await req('GET', '/api/expenses');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data).toEqual([]);
  });

  it('POST /api/expenses creates an expense with tax calculation', async () => {
    const res = await req('POST', '/api/expenses', {
      date: '2026-02-15',
      description: 'Office supplies',
      amount: 100,
      taxRate: 15,
      category: 'Office',
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.description).toBe('Office supplies');
    expect(json.data.amount).toBe(100);
    expect(json.data.taxAmount).toBe(15);
    expect(json.data.total).toBe(115);
    expect(json.data.status).toBe('draft');
  });

  it('POST /api/expenses rejects invalid data', async () => {
    const res = await req('POST', '/api/expenses', { amount: 100 });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });

  it('GET /api/expenses/:id returns single expense', async () => {
    const createRes = await req('POST', '/api/expenses', {
      date: '2026-02-15',
      description: 'Taxi',
      amount: 50,
    });
    const { data: created } = await createRes.json();

    const res = await req('GET', `/api/expenses/${created.id}`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.id).toBe(created.id);
  });

  it('GET /api/expenses/:id returns 404 for unknown', async () => {
    const res = await req('GET', '/api/expenses/nonexistent');
    expect(res.status).toBe(404);
  });

  it('PUT /api/expenses/:id updates an expense', async () => {
    const createRes = await req('POST', '/api/expenses', {
      date: '2026-02-15',
      description: 'Lunch',
      amount: 30,
    });
    const { data: created } = await createRes.json();

    const res = await req('PUT', `/api/expenses/${created.id}`, {
      amount: 45,
      description: 'Team lunch',
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.amount).toBe(45);
    expect(json.data.description).toBe('Team lunch');
    expect(json.data.taxAmount).toBeCloseTo(6.75);
    expect(json.data.total).toBeCloseTo(51.75);
  });

  it('PUT /api/expenses/:id/status transitions status', async () => {
    const createRes = await req('POST', '/api/expenses', {
      date: '2026-02-15',
      description: 'Flight',
      amount: 500,
    });
    const { data: created } = await createRes.json();

    const res = await req('PUT', `/api/expenses/${created.id}/status`, {
      status: 'submitted',
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.status).toBe('submitted');
  });

  it('PUT /api/expenses/:id/status rejects invalid status', async () => {
    const createRes = await req('POST', '/api/expenses', {
      date: '2026-02-15',
      description: 'Flight',
      amount: 500,
    });
    const { data: created } = await createRes.json();

    const res = await req('PUT', `/api/expenses/${created.id}/status`, {
      status: 'invalid_status',
    });
    expect(res.status).toBe(400);
  });

  it('DELETE /api/expenses/:id removes an expense', async () => {
    const createRes = await req('POST', '/api/expenses', {
      date: '2026-02-15',
      description: 'To delete',
      amount: 10,
    });
    const { data: created } = await createRes.json();

    const res = await req('DELETE', `/api/expenses/${created.id}`);
    expect(res.status).toBe(200);

    const getRes = await req('GET', `/api/expenses/${created.id}`);
    expect(getRes.status).toBe(404);
  });
});
