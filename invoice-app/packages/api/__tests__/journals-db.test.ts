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

describe('Journal Routes (DB-backed)', () => {
  it('GET /api/journals returns empty array initially', async () => {
    const res = await app.request('/api/journals');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data).toEqual([]);
  });

  it('POST /api/journals creates a balanced journal', async () => {
    const res = await app.request('/api/journals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: '2024-01-15',
        narration: 'Test journal',
        lines: [
          { accountId: 'a-1', accountName: 'Sales', description: 'Debit', debit: 1000, credit: 0 },
          { accountId: 'a-2', accountName: 'Bank', description: 'Credit', debit: 0, credit: 1000 },
        ],
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.narration).toBe('Test journal');
    expect(body.data.lines).toHaveLength(2);
  });

  it('POST /api/journals rejects unbalanced entry', async () => {
    const res = await app.request('/api/journals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: '2024-01-15',
        narration: 'Bad journal',
        lines: [
          { accountId: 'a-1', debit: 1000, credit: 0 },
          { accountId: 'a-2', debit: 0, credit: 500 },
        ],
      }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain('balance');
  });

  it('GET /api/journals/:id returns journal with lines', async () => {
    const createRes = await app.request('/api/journals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: '2024-02-01',
        narration: 'Depreciation',
        lines: [
          { accountId: 'a-1', debit: 500, credit: 0 },
          { accountId: 'a-2', debit: 0, credit: 500 },
        ],
      }),
    });
    const { data: created } = await createRes.json();

    const res = await app.request(`/api/journals/${created.id}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.narration).toBe('Depreciation');
    expect(body.data.lines).toHaveLength(2);
  });

  it('GET /api/journals/:id returns 404 for missing', async () => {
    const res = await app.request('/api/journals/nonexistent');
    expect(res.status).toBe(404);
  });

  it('PUT /api/journals/:id updates narration and lines', async () => {
    const createRes = await app.request('/api/journals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: '2024-01-01',
        narration: 'Original',
        lines: [
          { accountId: 'a-1', debit: 200, credit: 0 },
          { accountId: 'a-2', debit: 0, credit: 200 },
        ],
      }),
    });
    const { data: created } = await createRes.json();

    const res = await app.request(`/api/journals/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        narration: 'Updated narration',
        lines: [
          { accountId: 'a-3', debit: 300, credit: 0 },
          { accountId: 'a-4', debit: 0, credit: 300 },
        ],
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.narration).toBe('Updated narration');
    expect(body.data.lines).toHaveLength(2);
    expect(body.data.lines[0].accountId).toBe('a-3');
  });

  it('DELETE /api/journals/:id removes journal and lines', async () => {
    const createRes = await app.request('/api/journals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: '2024-01-01',
        narration: 'To delete',
        lines: [
          { accountId: 'a-1', debit: 100, credit: 0 },
          { accountId: 'a-2', debit: 0, credit: 100 },
        ],
      }),
    });
    const { data: created } = await createRes.json();

    const delRes = await app.request(`/api/journals/${created.id}`, { method: 'DELETE' });
    expect(delRes.status).toBe(200);

    const getRes = await app.request(`/api/journals/${created.id}`);
    expect(getRes.status).toBe(404);
  });
});
