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

const validPrepayment = {
  contactId: 'c-1',
  contactName: 'Supplier Co',
  amount: 5000,
  date: '2025-06-15',
  reference: 'PREPAY-001',
};

describe('Supplier Prepayments API', () => {
  describe('GET /api/supplier-prepayments', () => {
    it('returns empty array initially', async () => {
      const res = await req('GET', '/api/supplier-prepayments');
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.data).toEqual([]);
    });

    it('returns all prepayments', async () => {
      await req('POST', '/api/supplier-prepayments', validPrepayment);
      await req('POST', '/api/supplier-prepayments', { ...validPrepayment, amount: 3000 });

      const res = await req('GET', '/api/supplier-prepayments');
      const body = await res.json();
      expect(body.data).toHaveLength(2);
    });
  });

  describe('GET /api/supplier-prepayments/:id', () => {
    it('returns a specific prepayment', async () => {
      const createRes = await req('POST', '/api/supplier-prepayments', validPrepayment);
      const { data: created } = await createRes.json();

      const res = await req('GET', `/api/supplier-prepayments/${created.id}`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.amount).toBe(5000);
      expect(body.data.contactName).toBe('Supplier Co');
    });

    it('returns 404 for non-existent prepayment', async () => {
      const res = await req('GET', '/api/supplier-prepayments/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/supplier-prepayments', () => {
    it('creates a prepayment', async () => {
      const res = await req('POST', '/api/supplier-prepayments', validPrepayment);
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.data.contactId).toBe('c-1');
      expect(body.data.amount).toBe(5000);
      expect(body.data.balance).toBe(5000);
      expect(body.data.reference).toBe('PREPAY-001');
    });

    it('rejects missing contactId', async () => {
      const res = await req('POST', '/api/supplier-prepayments', { amount: 1000, date: '2025-01-01' });
      expect(res.status).toBe(400);
    });

    it('rejects missing amount', async () => {
      const res = await req('POST', '/api/supplier-prepayments', { contactId: 'c-1', date: '2025-01-01' });
      expect(res.status).toBe(400);
    });

    it('rejects missing date', async () => {
      const res = await req('POST', '/api/supplier-prepayments', { contactId: 'c-1', amount: 1000 });
      expect(res.status).toBe(400);
    });

    it('defaults balance to amount', async () => {
      const res = await req('POST', '/api/supplier-prepayments', {
        contactId: 'c-1',
        amount: 2000,
        date: '2025-01-01',
      });
      const body = await res.json();
      expect(body.data.balance).toBe(2000);
    });
  });

  describe('PUT /api/supplier-prepayments/:id', () => {
    it('updates balance', async () => {
      const createRes = await req('POST', '/api/supplier-prepayments', validPrepayment);
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/supplier-prepayments/${created.id}`, { balance: 3000 });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.balance).toBe(3000);
    });

    it('returns 404 for non-existent prepayment', async () => {
      const res = await req('PUT', '/api/supplier-prepayments/00000000-0000-0000-0000-000000000000', { balance: 0 });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/supplier-prepayments/:id', () => {
    it('deletes an existing prepayment', async () => {
      const createRes = await req('POST', '/api/supplier-prepayments', validPrepayment);
      const { data: created } = await createRes.json();

      const res = await req('DELETE', `/api/supplier-prepayments/${created.id}`);
      expect(res.status).toBe(200);

      const getRes = await req('GET', `/api/supplier-prepayments/${created.id}`);
      expect(getRes.status).toBe(404);
    });

    it('returns 404 for non-existent prepayment', async () => {
      const res = await req('DELETE', '/api/supplier-prepayments/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });
  });
});
