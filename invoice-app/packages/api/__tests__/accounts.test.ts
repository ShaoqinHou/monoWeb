import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createApp } from '../src/app';
import { createTestDb } from '../src/db/test-helpers';
import type { Db } from '../src/db/index';

let db: Db;
let cleanup: () => void;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  const testDb = createTestDb();
  db = testDb.db;
  cleanup = testDb.cleanup;
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

const validAccount = {
  code: '200',
  name: 'Sales Revenue',
  type: 'revenue' as const,
  taxType: 'output' as const,
  description: 'Revenue from sales',
};

describe('Accounts API', () => {
  describe('POST /api/accounts', () => {
    it('creates an account with valid data', async () => {
      const res = await req('POST', '/api/accounts', validAccount);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.code).toBe('200');
      expect(json.data.name).toBe('Sales Revenue');
      expect(json.data.type).toBe('revenue');
      expect(json.data.taxType).toBe('output');
      expect(typeof json.data.id).toBe('string');
    });

    it('rejects account with missing name', async () => {
      const res = await req('POST', '/api/accounts', { code: '200', type: 'revenue' });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error).toBe('Validation failed');
    });

    it('rejects account with invalid type', async () => {
      const res = await req('POST', '/api/accounts', { code: '200', name: 'Test', type: 'invalid' });
      expect(res.status).toBe(400);
    });

    it('rejects duplicate account code', async () => {
      await req('POST', '/api/accounts', validAccount);
      const res = await req('POST', '/api/accounts', { ...validAccount, name: 'Another' });
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.error).toContain('already exists');
    });

    it('creates account with minimal fields', async () => {
      const res = await req('POST', '/api/accounts', { code: '100', name: 'Cash', type: 'asset' });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.taxType).toBe('none');
      expect(json.data.isArchived).toBe(false);
    });
  });

  describe('GET /api/accounts', () => {
    it('returns empty array when no accounts', async () => {
      const res = await req('GET', '/api/accounts');
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data).toEqual([]);
    });

    it('returns all accounts', async () => {
      await req('POST', '/api/accounts', validAccount);
      await req('POST', '/api/accounts', { code: '300', name: 'Expenses', type: 'expense' });

      const res = await req('GET', '/api/accounts');
      const json = await res.json();
      expect(json.data).toHaveLength(2);
    });
  });

  describe('GET /api/accounts/:id', () => {
    it('returns a specific account', async () => {
      const createRes = await req('POST', '/api/accounts', validAccount);
      const { data: created } = await createRes.json();

      const res = await req('GET', `/api/accounts/${created.id}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.name).toBe('Sales Revenue');
    });

    it('returns 404 for non-existent account', async () => {
      const res = await req('GET', '/api/accounts/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.ok).toBe(false);
    });
  });

  describe('PUT /api/accounts/:id', () => {
    it('updates account name', async () => {
      const createRes = await req('POST', '/api/accounts', validAccount);
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/accounts/${created.id}`, { name: 'Updated Revenue' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.name).toBe('Updated Revenue');
      expect(json.data.code).toBe('200'); // unchanged
    });

    it('rejects duplicate code on update', async () => {
      await req('POST', '/api/accounts', validAccount);
      const createRes = await req('POST', '/api/accounts', { code: '300', name: 'Other', type: 'expense' });
      const { data: other } = await createRes.json();

      const res = await req('PUT', `/api/accounts/${other.id}`, { code: '200' });
      expect(res.status).toBe(409);
    });

    it('returns 404 for non-existent account', async () => {
      const res = await req('PUT', '/api/accounts/00000000-0000-0000-0000-000000000000', { name: 'X' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/accounts/:id', () => {
    it('deletes an existing account', async () => {
      const createRes = await req('POST', '/api/accounts', validAccount);
      const { data: created } = await createRes.json();

      const res = await req('DELETE', `/api/accounts/${created.id}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);

      const getRes = await req('GET', `/api/accounts/${created.id}`);
      expect(getRes.status).toBe(404);
    });

    it('returns 404 for non-existent account', async () => {
      const res = await req('DELETE', '/api/accounts/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });
  });
});
