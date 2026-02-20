import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDb } from '../src/db/test-helpers';
import { createApp } from '../src/app';
import { employees } from '../src/db/schema';
import type { Db } from '../src/db/index';

let db: Db;
let cleanup: () => void;
let app: ReturnType<typeof createApp>;

beforeEach(async () => {
  ({ db, cleanup } = createTestDb());
  app = createApp(db);

  // Seed employees
  await db.insert(employees).values([
    { id: 'emp-1', firstName: 'Emma', lastName: 'Stone', startDate: '2022-01-01', salary: 85000, payFrequency: 'monthly', taxCode: 'M', isActive: true },
    { id: 'emp-2', firstName: 'James', lastName: 'Wilson', startDate: '2023-01-01', salary: 95000, payFrequency: 'monthly', taxCode: 'M', isActive: true },
  ]);
});

afterEach(() => cleanup());

describe('Pay Run Routes', () => {
  it('GET /api/pay-runs returns empty array initially', async () => {
    const res = await app.request('/api/pay-runs');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
  });

  it('POST /api/pay-runs creates a pay run with payslips', async () => {
    const res = await app.request('/api/pay-runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payPeriodStart: '2024-01-01',
        payPeriodEnd: '2024-01-31',
        payDate: '2024-01-31',
        employeeIds: ['emp-1', 'emp-2'],
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.status).toBe('draft');
    expect(body.data.payslips).toHaveLength(2);
    expect(body.data.totalGross).toBeGreaterThan(0);
    expect(body.data.totalNet).toBeGreaterThan(0);
    expect(body.data.totalNet).toBeLessThan(body.data.totalGross);
  });

  it('POST /api/pay-runs auto-includes all active employees when no IDs given', async () => {
    const res = await app.request('/api/pay-runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payPeriodStart: '2024-02-01',
        payPeriodEnd: '2024-02-28',
        payDate: '2024-02-28',
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.payslips).toHaveLength(2);
  });

  it('GET /api/pay-runs/:id returns pay run with payslips', async () => {
    const createRes = await app.request('/api/pay-runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payPeriodStart: '2024-01-01',
        payPeriodEnd: '2024-01-31',
        payDate: '2024-01-31',
        employeeIds: ['emp-1'],
      }),
    });
    const { data: pr } = await createRes.json();

    const res = await app.request(`/api/pay-runs/${pr.id}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.payslips).toHaveLength(1);
    expect(body.data.payslips[0].grossPay).toBeGreaterThan(0);
  });

  it('PUT /api/pay-runs/:id/post changes status to posted', async () => {
    const createRes = await app.request('/api/pay-runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payPeriodStart: '2024-01-01',
        payPeriodEnd: '2024-01-31',
        payDate: '2024-01-31',
        employeeIds: ['emp-1'],
      }),
    });
    const { data: pr } = await createRes.json();

    const res = await app.request(`/api/pay-runs/${pr.id}/post`, { method: 'PUT' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe('posted');
  });

  it('PUT /api/pay-runs/:id/post rejects already-posted runs', async () => {
    const createRes = await app.request('/api/pay-runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payPeriodStart: '2024-01-01',
        payPeriodEnd: '2024-01-31',
        payDate: '2024-01-31',
        employeeIds: ['emp-1'],
      }),
    });
    const { data: pr } = await createRes.json();

    await app.request(`/api/pay-runs/${pr.id}/post`, { method: 'PUT' });
    const res = await app.request(`/api/pay-runs/${pr.id}/post`, { method: 'PUT' });
    expect(res.status).toBe(400);
  });
});
