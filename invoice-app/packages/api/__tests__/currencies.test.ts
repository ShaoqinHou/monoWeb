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

const validCurrency = { code: 'USD', name: 'US Dollar', rate: 0.62 };

describe('Currencies API', () => {
  describe('GET /api/currencies', () => {
    it('returns empty array initially', async () => {
      const res = await req('GET', '/api/currencies');
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.data).toEqual([]);
    });

    it('returns all currencies', async () => {
      await req('POST', '/api/currencies', validCurrency);
      await req('POST', '/api/currencies', { code: 'AUD', name: 'Australian Dollar', rate: 0.93 });

      const res = await req('GET', '/api/currencies');
      const body = await res.json();
      expect(body.data).toHaveLength(2);
    });
  });

  describe('GET /api/currencies/:code', () => {
    it('returns a specific currency', async () => {
      await req('POST', '/api/currencies', validCurrency);

      const res = await req('GET', '/api/currencies/USD');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.code).toBe('USD');
      expect(body.data.name).toBe('US Dollar');
      expect(body.data.rate).toBe(0.62);
    });

    it('returns 404 for non-existent currency', async () => {
      const res = await req('GET', '/api/currencies/XYZ');
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.ok).toBe(false);
    });
  });

  describe('POST /api/currencies', () => {
    it('creates a currency', async () => {
      const res = await req('POST', '/api/currencies', validCurrency);
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.data.code).toBe('USD');
      expect(body.data.name).toBe('US Dollar');
      expect(body.data.rate).toBe(0.62);
      expect(body.data.enabled).toBe(1);
    });

    it('rejects missing code', async () => {
      const res = await req('POST', '/api/currencies', { name: 'No Code' });
      expect(res.status).toBe(400);
    });

    it('rejects missing name', async () => {
      const res = await req('POST', '/api/currencies', { code: 'XXX' });
      expect(res.status).toBe(400);
    });

    it('rejects duplicate code', async () => {
      await req('POST', '/api/currencies', validCurrency);
      const res = await req('POST', '/api/currencies', validCurrency);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Currency already exists');
    });

    it('defaults rate to 1.0 and enabled to 1', async () => {
      const res = await req('POST', '/api/currencies', { code: 'NZD', name: 'NZ Dollar' });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.data.rate).toBe(1.0);
      expect(body.data.enabled).toBe(1);
    });
  });

  describe('PUT /api/currencies/:code', () => {
    it('updates currency rate', async () => {
      await req('POST', '/api/currencies', validCurrency);
      const res = await req('PUT', '/api/currencies/USD', { rate: 0.65 });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.rate).toBe(0.65);
    });

    it('updates enabled status', async () => {
      await req('POST', '/api/currencies', validCurrency);
      const res = await req('PUT', '/api/currencies/USD', { enabled: 0 });
      const body = await res.json();
      expect(body.data.enabled).toBe(0);
    });

    it('returns 404 for non-existent currency', async () => {
      const res = await req('PUT', '/api/currencies/XYZ', { rate: 1.5 });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/currencies/:code', () => {
    it('deletes an existing currency', async () => {
      await req('POST', '/api/currencies', validCurrency);
      const res = await req('DELETE', '/api/currencies/USD');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.code).toBe('USD');

      const getRes = await req('GET', '/api/currencies/USD');
      expect(getRes.status).toBe(404);
    });

    it('returns 404 for non-existent currency', async () => {
      const res = await req('DELETE', '/api/currencies/XYZ');
      expect(res.status).toBe(404);
    });
  });
});
