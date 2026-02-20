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

describe('Connected Apps API', () => {
  describe('GET /api/connected-apps', () => {
    it('seeds default apps on first request', async () => {
      const res = await req('GET', '/api/connected-apps');
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
      expect(typeof body.data[0].name).toBe('string');
      expect(body.data[0].connected).toBe(0);
    });

    it('returns same apps on subsequent requests (no re-seed)', async () => {
      const res1 = await req('GET', '/api/connected-apps');
      const body1 = await res1.json();

      const res2 = await req('GET', '/api/connected-apps');
      const body2 = await res2.json();

      expect(body1.data.length).toBe(body2.data.length);
      expect(body1.data[0].id).toBe(body2.data[0].id);
    });
  });

  describe('PUT /api/connected-apps/:id', () => {
    it('toggles connected status', async () => {
      const listRes = await req('GET', '/api/connected-apps');
      const { data: apps } = await listRes.json();
      const appId = apps[0].id;

      const res = await req('PUT', `/api/connected-apps/${appId}`, { connected: 1 });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.connected).toBe(1);

      // Toggle back
      const res2 = await req('PUT', `/api/connected-apps/${appId}`, { connected: 0 });
      const body2 = await res2.json();
      expect(body2.data.connected).toBe(0);
    });

    it('returns 404 for non-existent app', async () => {
      const res = await req('PUT', '/api/connected-apps/00000000-0000-0000-0000-000000000000', { connected: 1 });
      expect(res.status).toBe(404);
    });
  });
});
