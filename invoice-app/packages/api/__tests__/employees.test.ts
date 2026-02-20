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

describe('Employee Routes', () => {
  it('GET /api/employees returns empty array initially', async () => {
    const res = await app.request('/api/employees');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
  });

  it('POST /api/employees creates an employee', async () => {
    const res = await app.request('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Emma',
        lastName: 'Stone',
        email: 'emma@test.com',
        startDate: '2024-01-01',
        salary: 85000,
        payFrequency: 'monthly',
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.firstName).toBe('Emma');
    expect(body.data.salary).toBe(85000);
    expect(body.data.isActive).toBe(true);
  });

  it('POST /api/employees rejects missing required fields', async () => {
    const res = await app.request('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: 'Incomplete' }),
    });
    expect(res.status).toBe(400);
  });

  it('GET /api/employees/:id returns single employee', async () => {
    const createRes = await app.request('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: 'James', lastName: 'Wilson', startDate: '2024-01-15', salary: 90000 }),
    });
    const { data: emp } = await createRes.json();

    const res = await app.request(`/api/employees/${emp.id}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.firstName).toBe('James');
  });

  it('PUT /api/employees/:id updates fields', async () => {
    const createRes = await app.request('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: 'Sarah', lastName: 'Chen', startDate: '2024-01-01', salary: 78000 }),
    });
    const { data: emp } = await createRes.json();

    const res = await app.request(`/api/employees/${emp.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ salary: 82000, position: 'Senior Accountant' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.salary).toBe(82000);
    expect(body.data.position).toBe('Senior Accountant');
  });

  it('DELETE /api/employees/:id removes employee', async () => {
    const createRes = await app.request('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: 'Del', lastName: 'Eted', startDate: '2024-01-01' }),
    });
    const { data: emp } = await createRes.json();

    const res = await app.request(`/api/employees/${emp.id}`, { method: 'DELETE' });
    expect(res.status).toBe(200);

    const getRes = await app.request(`/api/employees/${emp.id}`);
    expect(getRes.status).toBe(404);
  });
});
