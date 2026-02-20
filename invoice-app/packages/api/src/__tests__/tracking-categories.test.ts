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

describe('Tracking Categories API', () => {
  it('GET /api/tracking-categories returns empty list', async () => {
    const res = await req('GET', '/api/tracking-categories');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data).toEqual([]);
  });

  it('POST /api/tracking-categories creates a category with options', async () => {
    const res = await req('POST', '/api/tracking-categories', {
      name: 'Region',
      options: [
        { id: 'opt-1', name: 'North', isActive: true },
        { id: 'opt-2', name: 'South', isActive: true },
      ],
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.name).toBe('Region');
    expect(json.data.options).toHaveLength(2);
    expect(json.data.options[0].name).toBe('North');
  });

  it('POST /api/tracking-categories creates with empty options', async () => {
    const res = await req('POST', '/api/tracking-categories', {
      name: 'Department',
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.options).toEqual([]);
  });

  it('POST /api/tracking-categories rejects missing name', async () => {
    const res = await req('POST', '/api/tracking-categories', {});
    expect(res.status).toBe(400);
  });

  it('GET /api/tracking-categories/:id returns single category', async () => {
    const createRes = await req('POST', '/api/tracking-categories', {
      name: 'Test Category',
      options: [{ id: 'o1', name: 'Option A' }],
    });
    const { data: created } = await createRes.json();

    const res = await req('GET', `/api/tracking-categories/${created.id}`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.name).toBe('Test Category');
    expect(json.data.options).toHaveLength(1);
  });

  it('GET /api/tracking-categories/:id returns 404 for unknown', async () => {
    const res = await req('GET', '/api/tracking-categories/nonexistent');
    expect(res.status).toBe(404);
  });

  it('PUT /api/tracking-categories/:id updates name and options', async () => {
    const createRes = await req('POST', '/api/tracking-categories', {
      name: 'Old Name',
    });
    const { data: created } = await createRes.json();

    const res = await req('PUT', `/api/tracking-categories/${created.id}`, {
      name: 'New Name',
      options: [{ id: 'o1', name: 'New Option' }],
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.name).toBe('New Name');
    expect(json.data.options).toHaveLength(1);
    expect(json.data.options[0].name).toBe('New Option');
  });

  it('DELETE /api/tracking-categories/:id removes a category', async () => {
    const createRes = await req('POST', '/api/tracking-categories', {
      name: 'To Delete',
    });
    const { data: created } = await createRes.json();

    const res = await req('DELETE', `/api/tracking-categories/${created.id}`);
    expect(res.status).toBe(200);

    const getRes = await req('GET', `/api/tracking-categories/${created.id}`);
    expect(getRes.status).toBe(404);
  });
});
