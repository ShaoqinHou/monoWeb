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

describe('Settings API', () => {
  describe('GET /api/settings', () => {
    it('returns empty object initially', async () => {
      const res = await req('GET', '/api/settings');
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.data).toEqual({});
    });

    it('returns all settings as key-value object', async () => {
      await req('PUT', '/api/settings/org_name', { value: 'Acme Corp' });
      await req('PUT', '/api/settings/country', { value: 'NZ' });
      await req('PUT', '/api/settings/tax_id', { value: '123-456-789' });

      const res = await req('GET', '/api/settings');
      const body = await res.json();
      expect(body.data).toEqual({
        org_name: 'Acme Corp',
        country: 'NZ',
        tax_id: '123-456-789',
      });
    });
  });

  describe('GET /api/settings/:key', () => {
    it('returns a single setting', async () => {
      await req('PUT', '/api/settings/theme', { value: 'dark' });

      const res = await req('GET', '/api/settings/theme');
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.data.key).toBe('theme');
      expect(body.data.value).toBe('dark');
      expect(typeof body.data.updatedAt).toBe('string');
    });

    it('returns 404 for missing key', async () => {
      const res = await req('GET', '/api/settings/nonexistent');
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.ok).toBe(false);
    });
  });

  describe('PUT /api/settings/:key', () => {
    it('creates a new setting', async () => {
      const res = await req('PUT', '/api/settings/language', { value: 'en-NZ' });
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.data.key).toBe('language');
      expect(body.data.value).toBe('en-NZ');
    });

    it('updates an existing setting', async () => {
      await req('PUT', '/api/settings/currency', { value: 'NZD' });
      const res = await req('PUT', '/api/settings/currency', { value: 'AUD' });
      const body = await res.json();
      expect(body.data.value).toBe('AUD');

      // Verify via GET
      const getRes = await req('GET', '/api/settings/currency');
      const getBody = await getRes.json();
      expect(getBody.data.value).toBe('AUD');
    });

    it('converts non-string values to string', async () => {
      const res = await req('PUT', '/api/settings/tax_rate', { value: 15 });
      const body = await res.json();
      expect(body.data.value).toBe('15');
    });

    it('requires value field', async () => {
      const res = await req('PUT', '/api/settings/empty', {});
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.ok).toBe(false);
    });
  });

  describe('DELETE /api/settings/:key', () => {
    it('deletes an existing setting', async () => {
      await req('PUT', '/api/settings/temp', { value: 'temporary' });
      const delRes = await req('DELETE', '/api/settings/temp');
      expect(delRes.status).toBe(200);
      const delBody = await delRes.json();
      expect(delBody.data.key).toBe('temp');

      // Verify it's gone
      const getRes = await req('GET', '/api/settings/temp');
      expect(getRes.status).toBe(404);
    });

    it('returns 404 for missing key', async () => {
      const res = await req('DELETE', '/api/settings/nonexistent');
      expect(res.status).toBe(404);
    });
  });
});
