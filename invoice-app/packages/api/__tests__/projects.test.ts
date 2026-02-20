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

describe('Project Routes', () => {
  it('GET /api/projects returns empty array initially', async () => {
    const res = await app.request('/api/projects');
    const body = await res.json();
    expect(body.data).toEqual([]);
  });

  it('POST /api/projects creates a project', async () => {
    const res = await app.request('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Website Redesign', estimatedBudget: 25000 }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.name).toBe('Website Redesign');
    expect(body.data.status).toBe('in_progress');
  });

  it('GET /api/projects/:id includes timesheet summary', async () => {
    const createRes = await app.request('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Project' }),
    });
    const { data: proj } = await createRes.json();

    // Add timesheet entry
    await app.request('/api/timesheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: proj.id, date: '2024-02-01', hours: 5, hourlyRate: 100, isBillable: true }),
    });

    const res = await app.request(`/api/projects/${proj.id}`);
    const body = await res.json();
    expect(body.data.totalHours).toBe(5);
    expect(body.data.totalCost).toBe(500);
    expect(body.data.billableHours).toBe(5);
  });

  it('PUT /api/projects/:id updates project', async () => {
    const createRes = await app.request('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Original Name' }),
    });
    const { data: proj } = await createRes.json();

    const res = await app.request(`/api/projects/${proj.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated Name', status: 'completed' }),
    });
    const body = await res.json();
    expect(body.data.name).toBe('Updated Name');
    expect(body.data.status).toBe('completed');
  });

  it('DELETE /api/projects/:id removes project', async () => {
    const createRes = await app.request('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'To Delete' }),
    });
    const { data: proj } = await createRes.json();

    await app.request(`/api/projects/${proj.id}`, { method: 'DELETE' });
    const res = await app.request(`/api/projects/${proj.id}`);
    expect(res.status).toBe(404);
  });
});
