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

const validSmartList = {
  name: 'Overdue Customers',
  filters: { status: 'overdue', type: 'customer' },
};

describe('Smart Lists API', () => {
  describe('GET /api/smart-lists', () => {
    it('returns empty array initially', async () => {
      const res = await req('GET', '/api/smart-lists');
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.data).toEqual([]);
    });

    it('returns all smart lists with parsed filters', async () => {
      await req('POST', '/api/smart-lists', validSmartList);
      await req('POST', '/api/smart-lists', { name: 'High Value', filters: { minAmount: 1000 } });

      const res = await req('GET', '/api/smart-lists');
      const body = await res.json();
      expect(body.data).toHaveLength(2);
      expect(body.data[0].filters).toBeTypeOf('object');
    });
  });

  describe('GET /api/smart-lists/:id', () => {
    it('returns a specific smart list with parsed filters', async () => {
      const createRes = await req('POST', '/api/smart-lists', validSmartList);
      const { data: created } = await createRes.json();

      const res = await req('GET', `/api/smart-lists/${created.id}`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.name).toBe('Overdue Customers');
      expect(body.data.filters).toEqual({ status: 'overdue', type: 'customer' });
    });

    it('returns 404 for non-existent smart list', async () => {
      const res = await req('GET', '/api/smart-lists/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/smart-lists', () => {
    it('creates a smart list', async () => {
      const res = await req('POST', '/api/smart-lists', validSmartList);
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.data.name).toBe('Overdue Customers');
      expect(body.data.filters).toEqual({ status: 'overdue', type: 'customer' });
      expect(typeof body.data.id).toBe('string');
    });

    it('rejects missing name', async () => {
      const res = await req('POST', '/api/smart-lists', { filters: {} });
      expect(res.status).toBe(400);
    });

    it('rejects missing filters', async () => {
      const res = await req('POST', '/api/smart-lists', { name: 'Test' });
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/smart-lists/:id', () => {
    it('updates smart list name', async () => {
      const createRes = await req('POST', '/api/smart-lists', validSmartList);
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/smart-lists/${created.id}`, { name: 'Updated Name' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.name).toBe('Updated Name');
    });

    it('updates filters', async () => {
      const createRes = await req('POST', '/api/smart-lists', validSmartList);
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/smart-lists/${created.id}`, { filters: { newFilter: true } });
      const body = await res.json();
      expect(body.data.filters).toEqual({ newFilter: true });
    });

    it('returns 404 for non-existent smart list', async () => {
      const res = await req('PUT', '/api/smart-lists/00000000-0000-0000-0000-000000000000', { name: 'X' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/smart-lists/:id', () => {
    it('deletes an existing smart list', async () => {
      const createRes = await req('POST', '/api/smart-lists', validSmartList);
      const { data: created } = await createRes.json();

      const res = await req('DELETE', `/api/smart-lists/${created.id}`);
      expect(res.status).toBe(200);

      const getRes = await req('GET', `/api/smart-lists/${created.id}`);
      expect(getRes.status).toBe(404);
    });

    it('returns 404 for non-existent smart list', async () => {
      const res = await req('DELETE', '/api/smart-lists/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });
  });
});
