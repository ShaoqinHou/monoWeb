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

describe('Budget Routes', () => {
  it('GET /api/budgets returns empty array initially', async () => {
    const res = await req('GET', '/api/budgets');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data).toEqual([]);
  });

  it('POST /api/budgets creates a budget without lines', async () => {
    const res = await req('POST', '/api/budgets', {
      name: 'FY2026 Budget',
      financialYear: '2026',
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.name).toBe('FY2026 Budget');
    expect(body.data.financialYear).toBe('2026');
    expect(body.data.status).toBe('draft');
    expect(body.data.lines).toEqual([]);
  });

  it('POST /api/budgets creates a budget with lines', async () => {
    const res = await req('POST', '/api/budgets', {
      name: 'FY2026 Budget',
      financialYear: '2026',
      lines: [
        {
          accountCode: '200',
          accountName: 'Sales Revenue',
          month1: 1000,
          month2: 1500,
          month3: 2000,
        },
        {
          accountCode: '400',
          accountName: 'Office Expenses',
          month1: 500,
          month6: 800,
          month12: 1200,
        },
      ],
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.lines).toHaveLength(2);
    expect(body.data.lines[0].accountCode).toBe('200');
    expect(body.data.lines[0].accountName).toBe('Sales Revenue');
    expect(body.data.lines[0].month1).toBe(1000);
    expect(body.data.lines[0].month2).toBe(1500);
    expect(body.data.lines[0].month3).toBe(2000);
    // Unset months default to 0
    expect(body.data.lines[0].month4).toBe(0);
    expect(body.data.lines[1].accountCode).toBe('400');
    expect(body.data.lines[1].month6).toBe(800);
    expect(body.data.lines[1].month12).toBe(1200);
  });

  it('POST /api/budgets rejects missing name', async () => {
    const res = await req('POST', '/api/budgets', {
      financialYear: '2026',
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  it('POST /api/budgets rejects missing financialYear', async () => {
    const res = await req('POST', '/api/budgets', {
      name: 'Budget without year',
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  it('GET /api/budgets/:id returns budget with lines', async () => {
    const createRes = await req('POST', '/api/budgets', {
      name: 'FY2026',
      financialYear: '2026',
      lines: [
        { accountCode: '200', accountName: 'Revenue', month1: 5000 },
      ],
    });
    const { data: created } = await createRes.json();

    const res = await req('GET', `/api/budgets/${created.id}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.name).toBe('FY2026');
    expect(body.data.lines).toHaveLength(1);
    expect(body.data.lines[0].accountCode).toBe('200');
    expect(body.data.lines[0].month1).toBe(5000);
  });

  it('GET /api/budgets/:id returns 404 for non-existent budget', async () => {
    const res = await req('GET', '/api/budgets/non-existent-id');
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  it('PUT /api/budgets/:id updates budget fields', async () => {
    const createRes = await req('POST', '/api/budgets', {
      name: 'Draft Budget',
      financialYear: '2026',
    });
    const { data: created } = await createRes.json();

    const res = await req('PUT', `/api/budgets/${created.id}`, {
      name: 'Final Budget',
      status: 'active',
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.name).toBe('Final Budget');
    expect(body.data.status).toBe('active');
    expect(body.data.financialYear).toBe('2026');
  });

  it('PUT /api/budgets/:id replaces lines when provided', async () => {
    const createRes = await req('POST', '/api/budgets', {
      name: 'Budget',
      financialYear: '2026',
      lines: [
        { accountCode: '200', accountName: 'Old Line', month1: 100 },
        { accountCode: '300', accountName: 'Another Old', month1: 200 },
      ],
    });
    const { data: created } = await createRes.json();
    expect(created.lines).toHaveLength(2);

    const res = await req('PUT', `/api/budgets/${created.id}`, {
      lines: [
        { accountCode: '500', accountName: 'New Line', month1: 9999, month12: 5555 },
      ],
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.lines).toHaveLength(1);
    expect(body.data.lines[0].accountCode).toBe('500');
    expect(body.data.lines[0].accountName).toBe('New Line');
    expect(body.data.lines[0].month1).toBe(9999);
    expect(body.data.lines[0].month12).toBe(5555);
  });

  it('PUT /api/budgets/:id returns 404 for non-existent budget', async () => {
    const res = await req('PUT', '/api/budgets/non-existent-id', { name: 'X' });
    expect(res.status).toBe(404);
  });

  it('DELETE /api/budgets/:id removes budget', async () => {
    const createRes = await req('POST', '/api/budgets', {
      name: 'To Delete',
      financialYear: '2026',
      lines: [{ accountCode: '200', accountName: 'Line' }],
    });
    const { data: created } = await createRes.json();

    const delRes = await req('DELETE', `/api/budgets/${created.id}`);
    expect(delRes.status).toBe(200);
    const delBody = await delRes.json();
    expect(delBody.data.id).toBe(created.id);

    // Verify it's gone
    const getRes = await req('GET', `/api/budgets/${created.id}`);
    expect(getRes.status).toBe(404);
  });

  it('DELETE /api/budgets/:id returns 404 for non-existent budget', async () => {
    const res = await req('DELETE', '/api/budgets/non-existent-id');
    expect(res.status).toBe(404);
  });

  it('GET /api/budgets lists all budgets', async () => {
    await req('POST', '/api/budgets', { name: 'Budget A', financialYear: '2025' });
    await req('POST', '/api/budgets', { name: 'Budget B', financialYear: '2026' });

    const res = await req('GET', '/api/budgets');
    const body = await res.json();
    expect(body.data).toHaveLength(2);
  });
});
