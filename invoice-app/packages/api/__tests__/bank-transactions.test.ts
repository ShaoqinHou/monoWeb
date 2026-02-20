import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDb } from '../src/db/test-helpers';
import { createApp } from '../src/app';
import type { Db } from '../src/db/index';

let db: Db;
let cleanup: () => void;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  ({ db, cleanup } = createTestDb());
  app = createApp(db);
});

afterEach(() => cleanup());

describe('Bank Transaction Routes', () => {
  it('GET /api/bank-transactions returns empty array initially', async () => {
    const res = await app.request('/api/bank-transactions');
    const body = await res.json();
    expect(body.data).toEqual([]);
  });

  it('POST /api/bank-transactions creates a transaction', async () => {
    const res = await app.request('/api/bank-transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: 'a-1', date: '2024-01-10', amount: 1500, description: 'Client payment' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.amount).toBe(1500);
    expect(body.data.isReconciled).toBe(false);
  });

  it('POST /api/bank-transactions/import imports multiple transactions', async () => {
    const res = await app.request('/api/bank-transactions/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountId: 'a-1',
        transactions: [
          { date: '2024-01-01', description: 'Opening', amount: 10000 },
          { date: '2024-01-05', description: 'Payment', amount: -500 },
          { date: '2024-01-10', description: 'Deposit', amount: 2000 },
        ],
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.imported).toBe(3);

    // Verify they're there
    const listRes = await app.request('/api/bank-transactions?accountId=a-1');
    const listBody = await listRes.json();
    expect(listBody.data).toHaveLength(3);
  });

  it('GET /api/bank-transactions?accountId filters by account', async () => {
    await app.request('/api/bank-transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: 'a-1', date: '2024-01-01', amount: 100 }),
    });
    await app.request('/api/bank-transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: 'a-2', date: '2024-01-01', amount: 200 }),
    });

    const res = await app.request('/api/bank-transactions?accountId=a-1');
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].amount).toBe(100);
  });

  it('PUT /api/bank-transactions/:id/reconcile marks as reconciled', async () => {
    const createRes = await app.request('/api/bank-transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: 'a-1', date: '2024-01-10', amount: 500 }),
    });
    const { data: tx } = await createRes.json();

    const res = await app.request(`/api/bank-transactions/${tx.id}/reconcile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'Revenue' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.isReconciled).toBe(true);
    expect(body.data.category).toBe('Revenue');
  });

  it('PUT /api/bank-transactions/:id/reconcile rejects already-reconciled', async () => {
    const createRes = await app.request('/api/bank-transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: 'a-1', date: '2024-01-10', amount: 500 }),
    });
    const { data: tx } = await createRes.json();

    await app.request(`/api/bank-transactions/${tx.id}/reconcile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const res = await app.request(`/api/bank-transactions/${tx.id}/reconcile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it('DELETE /api/bank-transactions/:id removes transaction', async () => {
    const createRes = await app.request('/api/bank-transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: 'a-1', date: '2024-01-10', amount: 500 }),
    });
    const { data: tx } = await createRes.json();

    await app.request(`/api/bank-transactions/${tx.id}`, { method: 'DELETE' });
    const res = await app.request(`/api/bank-transactions/${tx.id}`);
    expect(res.status).toBe(404);
  });
});
