import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createApp } from '../src/app';
import { createTestDb } from '../src/db/test-helpers';
import type { Db } from '../src/db/index';

let db: Db;
let cleanup: () => void;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  const t = createTestDb();
  db = t.db;
  cleanup = t.cleanup;
  app = createApp(db);
});

afterEach(() => {
  cleanup();
});

function req(method: string, path: string, body?: unknown) {
  const init: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) init.body = JSON.stringify(body);
  return app.request(path, init);
}

describe('Pay Item Routes', () => {
  it('GET /api/pay-items returns empty array initially', async () => {
    const res = await req('GET', '/api/pay-items');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data).toEqual([]);
  });

  it('POST /api/pay-items creates an earnings pay item', async () => {
    const res = await req('POST', '/api/pay-items', {
      name: 'Ordinary Earnings',
      type: 'earnings',
      rateType: 'per_hour',
      amount: 30,
      accountCode: '200',
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.name).toBe('Ordinary Earnings');
    expect(body.data.type).toBe('earnings');
    expect(body.data.rateType).toBe('per_hour');
    expect(body.data.amount).toBe(30);
    expect(body.data.accountCode).toBe('200');
    expect(body.data.isDefault).toBe(false);
    expect(body.data.isActive).toBe(true);
  });

  it('POST /api/pay-items creates a deduction pay item', async () => {
    const res = await req('POST', '/api/pay-items', {
      name: 'KiwiSaver',
      type: 'deduction',
      rateType: 'percentage',
      amount: 3,
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.type).toBe('deduction');
    expect(body.data.rateType).toBe('percentage');
    expect(body.data.amount).toBe(3);
  });

  it('POST /api/pay-items creates a reimbursement pay item', async () => {
    const res = await req('POST', '/api/pay-items', {
      name: 'Mileage',
      type: 'reimbursement',
      amount: 0.82,
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.type).toBe('reimbursement');
    expect(body.data.rateType).toBe('fixed'); // default
  });

  it('POST /api/pay-items creates a tax pay item', async () => {
    const res = await req('POST', '/api/pay-items', {
      name: 'PAYE',
      type: 'tax',
      rateType: 'percentage',
      amount: 17.5,
      isDefault: true,
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.type).toBe('tax');
    expect(body.data.isDefault).toBe(true);
  });

  it('POST /api/pay-items rejects invalid type', async () => {
    const res = await req('POST', '/api/pay-items', {
      name: 'Invalid',
      type: 'bonus', // not a valid type
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain('Invalid type');
  });

  it('POST /api/pay-items rejects invalid rateType', async () => {
    const res = await req('POST', '/api/pay-items', {
      name: 'Bad Rate',
      type: 'earnings',
      rateType: 'per_day', // not a valid rateType
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain('Invalid rate type');
  });

  it('POST /api/pay-items rejects missing name', async () => {
    const res = await req('POST', '/api/pay-items', {
      type: 'earnings',
    });
    expect(res.status).toBe(400);
  });

  it('POST /api/pay-items rejects missing type', async () => {
    const res = await req('POST', '/api/pay-items', {
      name: 'No Type',
    });
    expect(res.status).toBe(400);
  });

  it('GET /api/pay-items/:id returns single pay item', async () => {
    const createRes = await req('POST', '/api/pay-items', {
      name: 'Overtime',
      type: 'earnings',
      rateType: 'per_hour',
      amount: 45,
    });
    const { data: created } = await createRes.json();

    const res = await req('GET', `/api/pay-items/${created.id}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.name).toBe('Overtime');
    expect(body.data.amount).toBe(45);
  });

  it('GET /api/pay-items/:id returns 404 for non-existent', async () => {
    const res = await req('GET', '/api/pay-items/non-existent-id');
    expect(res.status).toBe(404);
  });

  it('PUT /api/pay-items/:id updates fields', async () => {
    const createRes = await req('POST', '/api/pay-items', {
      name: 'Original',
      type: 'earnings',
      amount: 25,
    });
    const { data: created } = await createRes.json();

    const res = await req('PUT', `/api/pay-items/${created.id}`, {
      name: 'Updated Earnings',
      amount: 35,
      isDefault: true,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.name).toBe('Updated Earnings');
    expect(body.data.amount).toBe(35);
    expect(body.data.isDefault).toBe(true);
    // Unchanged fields stay the same
    expect(body.data.type).toBe('earnings');
  });

  it('PUT /api/pay-items/:id can deactivate a pay item', async () => {
    const createRes = await req('POST', '/api/pay-items', {
      name: 'Active Item',
      type: 'deduction',
    });
    const { data: created } = await createRes.json();
    expect(created.isActive).toBe(true);

    const res = await req('PUT', `/api/pay-items/${created.id}`, {
      isActive: false,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.isActive).toBe(false);
  });

  it('PUT /api/pay-items/:id returns 404 for non-existent', async () => {
    const res = await req('PUT', '/api/pay-items/non-existent-id', { name: 'X' });
    expect(res.status).toBe(404);
  });

  it('DELETE /api/pay-items/:id removes pay item', async () => {
    const createRes = await req('POST', '/api/pay-items', {
      name: 'To Delete',
      type: 'reimbursement',
    });
    const { data: created } = await createRes.json();

    const delRes = await req('DELETE', `/api/pay-items/${created.id}`);
    expect(delRes.status).toBe(200);
    const delBody = await delRes.json();
    expect(delBody.data.id).toBe(created.id);

    // Verify it's gone
    const getRes = await req('GET', `/api/pay-items/${created.id}`);
    expect(getRes.status).toBe(404);
  });

  it('DELETE /api/pay-items/:id returns 404 for non-existent', async () => {
    const res = await req('DELETE', '/api/pay-items/non-existent-id');
    expect(res.status).toBe(404);
  });

  it('GET /api/pay-items lists all pay items', async () => {
    await req('POST', '/api/pay-items', { name: 'Earnings A', type: 'earnings' });
    await req('POST', '/api/pay-items', { name: 'Deduction B', type: 'deduction' });
    await req('POST', '/api/pay-items', { name: 'Tax C', type: 'tax' });

    const res = await req('GET', '/api/pay-items');
    const body = await res.json();
    expect(body.data).toHaveLength(3);
  });
});
