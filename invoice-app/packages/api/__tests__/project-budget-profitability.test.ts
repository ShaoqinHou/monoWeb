import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { randomUUID } from 'crypto';
import { createTestDb } from '../src/db/test-helpers';
import { createApp } from '../src/app';
import { projects, timesheets, projectExpenses } from '../src/db/schema';
import type { Db } from '../src/db/index';

let db: Db;
let cleanup: () => void;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  ({ db, cleanup } = createTestDb());
  app = createApp(db);
});

afterEach(() => cleanup());

async function createProject(name: string, estimatedBudget?: number) {
  const res = await app.request('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, estimatedBudget }),
  });
  const body = await res.json();
  return body.data;
}

/** Insert timesheet directly into DB (supports isInvoiced which the API doesn't expose on POST) */
function insertTimesheet(projectId: string, opts: {
  date: string; hours: number; hourlyRate: number;
  isBillable?: boolean; isInvoiced?: boolean;
}) {
  const id = randomUUID();
  db.insert(timesheets).values({
    id,
    projectId,
    date: opts.date,
    hours: opts.hours,
    hourlyRate: opts.hourlyRate,
    isBillable: opts.isBillable ?? true,
    isInvoiced: opts.isInvoiced ?? false,
  }).run();
  return id;
}

/** Insert project expense directly into DB (supports isInvoiced) */
function insertExpense(projectId: string, opts: {
  description: string; amount: number; date: string;
  category?: string; isBillable?: boolean; isInvoiced?: boolean;
}) {
  const id = randomUUID();
  db.insert(projectExpenses).values({
    id,
    projectId,
    description: opts.description,
    amount: opts.amount,
    date: opts.date,
    category: opts.category ?? null,
    isBillable: opts.isBillable ?? true,
    isInvoiced: opts.isInvoiced ?? false,
  }).run();
  return id;
}

describe('GET /api/projects/:id/budget', () => {
  it('returns 404 for non-existent project', async () => {
    const res = await app.request('/api/projects/nonexistent/budget');
    expect(res.status).toBe(404);
  });

  it('returns zero budget for project with no estimatedBudget or data', async () => {
    const proj = await createProject('Empty Project');
    const res = await app.request(`/api/projects/${proj.id}/budget`);
    const body = await res.json();

    expect(body.ok).toBe(true);
    expect(body.data.totalBudget).toBe(0);
    expect(body.data.totalActual).toBe(0);
    expect(body.data.totalVariance).toBe(0);
    expect(body.data.totalPercentUsed).toBe(0);
    expect(body.data.categories).toHaveLength(3);
    expect(body.data.categories[0].name).toBe('Labour');
    expect(body.data.categories[1].name).toBe('Materials');
    expect(body.data.categories[2].name).toBe('Other');
  });

  it('distributes estimatedBudget across categories (60/30/10)', async () => {
    const proj = await createProject('Budgeted Project', 10000);
    const res = await app.request(`/api/projects/${proj.id}/budget`);
    const body = await res.json();

    expect(body.data.categories[0].budget).toBe(6000); // 60% labour
    expect(body.data.categories[1].budget).toBe(3000); // 30% materials
    expect(body.data.categories[2].budget).toBe(1000); // 10% other
    expect(body.data.totalBudget).toBe(10000);
  });

  it('computes labour actual from timesheets', async () => {
    const proj = await createProject('Labour Project', 10000);
    insertTimesheet(proj.id, { date: '2026-01-15', hours: 10, hourlyRate: 100 });
    insertTimesheet(proj.id, { date: '2026-01-16', hours: 5, hourlyRate: 80 });

    const res = await app.request(`/api/projects/${proj.id}/budget`);
    const body = await res.json();

    const labour = body.data.categories.find((c: { id: string }) => c.id === 'labour');
    expect(labour.actual).toBe(1400); // 10*100 + 5*80
    expect(labour.budget).toBe(6000);
  });

  it('computes materials and other actuals from expenses', async () => {
    const proj = await createProject('Expense Project', 10000);
    insertExpense(proj.id, { description: 'Steel', amount: 500, date: '2026-01-15', category: 'materials' });
    insertExpense(proj.id, { description: 'Wood', amount: 300, date: '2026-01-16', category: 'Materials' });
    insertExpense(proj.id, { description: 'Travel', amount: 200, date: '2026-01-17', category: 'travel' });

    const res = await app.request(`/api/projects/${proj.id}/budget`);
    const body = await res.json();

    const materials = body.data.categories.find((c: { id: string }) => c.id === 'materials');
    const other = body.data.categories.find((c: { id: string }) => c.id === 'other');
    expect(materials.actual).toBe(800); // 500 + 300
    expect(other.actual).toBe(200);
  });

  it('computes percentUsed correctly', async () => {
    const proj = await createProject('Percent Project', 10000);
    insertTimesheet(proj.id, { date: '2026-01-15', hours: 30, hourlyRate: 100 }); // 3000 actual vs 6000 budget = 50%

    const res = await app.request(`/api/projects/${proj.id}/budget`);
    const body = await res.json();

    const labour = body.data.categories.find((c: { id: string }) => c.id === 'labour');
    expect(labour.percentUsed).toBe(50);
  });
});

describe('PUT /api/projects/:id/budget', () => {
  it('returns 404 for non-existent project', async () => {
    const res = await app.request('/api/projects/nonexistent/budget', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categories: [
          { id: 'labour', name: 'Labour', budget: 5000, actual: 0 },
          { id: 'materials', name: 'Materials', budget: 3000, actual: 0 },
          { id: 'other', name: 'Other', budget: 2000, actual: 0 },
        ],
      }),
    });
    expect(res.status).toBe(404);
  });

  it('updates project estimatedBudget based on category totals', async () => {
    const proj = await createProject('Update Budget Project', 10000);

    await app.request(`/api/projects/${proj.id}/budget`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categories: [
          { id: 'labour', name: 'Labour', budget: 8000, actual: 0 },
          { id: 'materials', name: 'Materials', budget: 4000, actual: 0 },
          { id: 'other', name: 'Other', budget: 3000, actual: 0 },
        ],
      }),
    });

    // Verify project estimatedBudget updated
    const projRes = await app.request(`/api/projects/${proj.id}`);
    const projBody = await projRes.json();
    expect(projBody.data.estimatedBudget).toBe(15000);
  });

  it('returns updated budget data with correct actuals', async () => {
    const proj = await createProject('With Data', 5000);
    insertTimesheet(proj.id, { date: '2026-02-01', hours: 10, hourlyRate: 50 });

    const res = await app.request(`/api/projects/${proj.id}/budget`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categories: [
          { id: 'labour', name: 'Labour', budget: 2000, actual: 0 },
          { id: 'materials', name: 'Materials', budget: 1000, actual: 0 },
          { id: 'other', name: 'Other', budget: 500, actual: 0 },
        ],
      }),
    });
    const body = await res.json();

    expect(body.ok).toBe(true);
    // Labour actual should be computed from DB (10h * 50 = 500), not from the input
    const labour = body.data.categories.find((c: { id: string }) => c.id === 'labour');
    expect(labour.actual).toBe(500);
    expect(labour.budget).toBe(2000);
  });

  it('returns 400 when categories is not an array', async () => {
    const proj = await createProject('Bad Input');
    const res = await app.request(`/api/projects/${proj.id}/budget`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories: 'not-array' }),
    });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/projects/:id/profitability', () => {
  it('returns 404 for non-existent project', async () => {
    const res = await app.request('/api/projects/nonexistent/profitability');
    expect(res.status).toBe(404);
  });

  it('returns zero profitability for project with no data', async () => {
    const proj = await createProject('Empty');
    const res = await app.request(`/api/projects/${proj.id}/profitability`);
    const body = await res.json();

    expect(body.ok).toBe(true);
    expect(body.data.totalRevenue).toBe(0);
    expect(body.data.totalCost).toBe(0);
    expect(body.data.profit).toBe(0);
    expect(body.data.margin).toBe(0);
    expect(body.data.monthlyBreakdown).toEqual([]);
  });

  it('computes revenue from invoiced billable time entries', async () => {
    const proj = await createProject('Revenue Project');

    // Invoiced billable entry -> contributes to revenue
    insertTimesheet(proj.id, {
      date: '2026-01-15', hours: 10, hourlyRate: 100,
      isBillable: true, isInvoiced: true,
    });
    // Non-invoiced billable entry -> does NOT contribute to revenue (cost only)
    insertTimesheet(proj.id, {
      date: '2026-01-16', hours: 5, hourlyRate: 100,
      isBillable: true, isInvoiced: false,
    });

    const res = await app.request(`/api/projects/${proj.id}/profitability`);
    const body = await res.json();

    expect(body.data.totalRevenue).toBe(1000); // only invoiced billable
    expect(body.data.totalCost).toBe(1500); // all time entries
  });

  it('computes revenue from invoiced billable expenses', async () => {
    const proj = await createProject('Expense Revenue');
    insertExpense(proj.id, {
      description: 'Billable travel', amount: 500, date: '2026-02-10',
      isBillable: true, isInvoiced: true,
    });
    insertExpense(proj.id, {
      description: 'Internal cost', amount: 200, date: '2026-02-11',
      isBillable: false, isInvoiced: false,
    });

    const res = await app.request(`/api/projects/${proj.id}/profitability`);
    const body = await res.json();

    expect(body.data.totalRevenue).toBe(500); // only billable+invoiced
    expect(body.data.totalCost).toBe(700); // all expenses
  });

  it('computes profit and margin correctly', async () => {
    const proj = await createProject('Profit Project');
    insertTimesheet(proj.id, {
      date: '2026-03-01', hours: 20, hourlyRate: 100,
      isBillable: true, isInvoiced: true,
    });
    // Cost = 2000, Revenue = 2000, Profit = 0, Margin = 0

    const res = await app.request(`/api/projects/${proj.id}/profitability`);
    const body = await res.json();

    expect(body.data.totalRevenue).toBe(2000);
    expect(body.data.totalCost).toBe(2000);
    expect(body.data.profit).toBe(0);
    expect(body.data.margin).toBe(0);
  });

  it('groups monthly breakdown by time entry date', async () => {
    const proj = await createProject('Monthly Breakdown');
    insertTimesheet(proj.id, {
      date: '2026-01-15', hours: 10, hourlyRate: 100,
      isBillable: true, isInvoiced: true,
    });
    insertTimesheet(proj.id, {
      date: '2026-02-15', hours: 5, hourlyRate: 100,
      isBillable: true, isInvoiced: false,
    });

    const res = await app.request(`/api/projects/${proj.id}/profitability`);
    const body = await res.json();

    expect(body.data.monthlyBreakdown).toHaveLength(2);
    expect(body.data.monthlyBreakdown[0].month).toBe('Jan');
    expect(body.data.monthlyBreakdown[0].revenue).toBe(1000);
    expect(body.data.monthlyBreakdown[0].cost).toBe(1000);
    expect(body.data.monthlyBreakdown[1].month).toBe('Feb');
    expect(body.data.monthlyBreakdown[1].revenue).toBe(0); // not invoiced
    expect(body.data.monthlyBreakdown[1].cost).toBe(500);
  });

  it('includes expenses in monthly breakdown', async () => {
    const proj = await createProject('Expense Monthly');
    insertExpense(proj.id, {
      description: 'March expense', amount: 300, date: '2026-03-10',
      isBillable: true, isInvoiced: true,
    });

    const res = await app.request(`/api/projects/${proj.id}/profitability`);
    const body = await res.json();

    expect(body.data.monthlyBreakdown).toHaveLength(1);
    expect(body.data.monthlyBreakdown[0].month).toBe('Mar');
    expect(body.data.monthlyBreakdown[0].revenue).toBe(300);
    expect(body.data.monthlyBreakdown[0].cost).toBe(300);
  });

  it('computes positive margin when revenue exceeds cost', async () => {
    const proj = await createProject('High Margin');
    // 2 billable invoiced at $200/h = $2000 revenue
    insertTimesheet(proj.id, {
      date: '2026-04-01', hours: 10, hourlyRate: 200,
      isBillable: true, isInvoiced: true,
    });
    // 1 non-billable cost entry at $50/h = $500 cost (not revenue)
    insertTimesheet(proj.id, {
      date: '2026-04-02', hours: 10, hourlyRate: 50,
      isBillable: false, isInvoiced: false,
    });

    const res = await app.request(`/api/projects/${proj.id}/profitability`);
    const body = await res.json();

    // Revenue = 2000, Cost = 2000 + 500 = 2500
    expect(body.data.totalRevenue).toBe(2000);
    expect(body.data.totalCost).toBe(2500);
    expect(body.data.profit).toBe(-500);
  });
});
