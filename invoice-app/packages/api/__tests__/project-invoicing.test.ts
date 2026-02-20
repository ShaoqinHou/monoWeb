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

async function createContact(name: string) {
  const res = await app.request('/api/contacts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, type: 'customer' }),
  });
  const body = await res.json();
  return body.data;
}

async function createProject(name: string, contactId: string, contactName: string) {
  const res = await app.request('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, contactId, contactName }),
  });
  const body = await res.json();
  return body.data;
}

async function addTimeEntry(projectId: string, hours: number, hourlyRate: number, description: string = 'Work') {
  const res = await app.request('/api/timesheets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, date: '2024-02-01', hours, hourlyRate, isBillable: true, description }),
  });
  const body = await res.json();
  return body.data;
}

async function addExpense(projectId: string, amount: number, description: string = 'Expense') {
  const res = await app.request('/api/project-expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, date: '2024-02-01', amount, description, isBillable: true }),
  });
  const body = await res.json();
  return body.data;
}

describe('Project Invoicing API', () => {
  it('GET /api/projects/:id/unbilled returns unbilled time and expenses', async () => {
    const contact = await createContact('Client Corp');
    const project = await createProject('Web Build', contact.id, 'Client Corp');
    await addTimeEntry(project.id, 5, 100, 'Frontend dev');
    await addTimeEntry(project.id, 3, 80, 'Backend dev');
    await addExpense(project.id, 150, 'Cloud hosting');

    const res = await app.request(`/api/projects/${project.id}/unbilled`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.timeEntries).toHaveLength(2);
    expect(body.data.expenses).toHaveLength(1);
    expect(body.data.totalUnbilled).toBe(890); // 500 + 240 + 150
  });

  it('GET /api/projects/:id/unbilled returns 404 for missing project', async () => {
    const res = await app.request('/api/projects/nonexistent/unbilled');
    expect(res.status).toBe(404);
  });

  it('POST /api/projects/:id/create-invoice creates invoice with line items', async () => {
    const contact = await createContact('Client Corp');
    const project = await createProject('Web Build', contact.id, 'Client Corp');
    const t1 = await addTimeEntry(project.id, 5, 100, 'Frontend dev');
    const e1 = await addExpense(project.id, 200, 'License fee');

    const res = await app.request(`/api/projects/${project.id}/create-invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeEntryIds: [t1.id], expenseIds: [e1.id] }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.lineItemCount).toBe(2);
    expect(body.data.total).toBeCloseTo(805, 0); // (500 + 200) * 1.15
    expect(body.data.invoiceNumber).toEqual(expect.any(String));
  });

  it('POST /api/projects/:id/create-invoice marks entries as billed', async () => {
    const contact = await createContact('Client Corp');
    const project = await createProject('Web Build', contact.id, 'Client Corp');
    const t1 = await addTimeEntry(project.id, 3, 100, 'Dev work');
    const e1 = await addExpense(project.id, 50, 'Supplies');

    await app.request(`/api/projects/${project.id}/create-invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeEntryIds: [t1.id], expenseIds: [e1.id] }),
    });

    // Check that unbilled now returns empty
    const unbilledRes = await app.request(`/api/projects/${project.id}/unbilled`);
    const unbilledBody = await unbilledRes.json();
    expect(unbilledBody.data.timeEntries).toHaveLength(0);
    expect(unbilledBody.data.expenses).toHaveLength(0);
    expect(unbilledBody.data.totalUnbilled).toBe(0);
  });

  it('POST /api/projects/:id/create-invoice fails without contact', async () => {
    const res1 = await app.request('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'No Contact Project' }),
    });
    const { data: project } = await res1.json();

    const t1 = await addTimeEntry(project.id, 2, 100, 'Work');

    const res = await app.request(`/api/projects/${project.id}/create-invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeEntryIds: [t1.id], expenseIds: [] }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('contact');
  });

  it('POST /api/projects/:id/create-invoice fails with empty arrays', async () => {
    const contact = await createContact('Client Corp');
    const project = await createProject('Web Build', contact.id, 'Client Corp');

    const res = await app.request(`/api/projects/${project.id}/create-invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeEntryIds: [], expenseIds: [] }),
    });
    expect(res.status).toBe(400);
  });
});
