import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDb } from '../src/db/test-helpers';
import { createApp } from '../src/app';
import { projects } from '../src/db/schema';
import type { Db } from '../src/db/index';

let db: Db;
let cleanup: () => void;
let app: ReturnType<typeof createApp>;

beforeEach(async () => {
  ({ db, cleanup } = createTestDb());
  app = createApp(db);

  // Seed a project
  await db.insert(projects).values({ id: 'proj-1', name: 'Test Project', status: 'in_progress' });
});

afterEach(() => cleanup());

describe('Timesheet Routes', () => {
  it('GET /api/timesheets returns empty array initially', async () => {
    const res = await app.request('/api/timesheets');
    const body = await res.json();
    expect(body.data).toEqual([]);
  });

  it('POST /api/timesheets creates a timesheet entry', async () => {
    const res = await app.request('/api/timesheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: 'proj-1',
        date: '2024-02-01',
        hours: 8,
        description: 'Development work',
        hourlyRate: 150,
        isBillable: true,
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.hours).toBe(8);
    expect(body.data.hourlyRate).toBe(150);
    expect(body.data.isBillable).toBe(true);
    expect(body.data.isInvoiced).toBe(false);
  });

  it('GET /api/timesheets?projectId filters by project', async () => {
    await app.request('/api/timesheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'proj-1', date: '2024-02-01', hours: 4 }),
    });

    const res = await app.request('/api/timesheets?projectId=proj-1');
    const body = await res.json();
    expect(body.data).toHaveLength(1);
  });

  it('PUT /api/timesheets/:id updates entry', async () => {
    const createRes = await app.request('/api/timesheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'proj-1', date: '2024-02-01', hours: 4 }),
    });
    const { data: ts } = await createRes.json();

    const res = await app.request(`/api/timesheets/${ts.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hours: 6, description: 'Updated work' }),
    });
    const body = await res.json();
    expect(body.data.hours).toBe(6);
    expect(body.data.description).toBe('Updated work');
  });

  it('DELETE /api/timesheets/:id removes entry', async () => {
    const createRes = await app.request('/api/timesheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'proj-1', date: '2024-02-01', hours: 2 }),
    });
    const { data: ts } = await createRes.json();

    await app.request(`/api/timesheets/${ts.id}`, { method: 'DELETE' });
    const res = await app.request(`/api/timesheets/${ts.id}`);
    expect(res.status).toBe(404);
  });
});
