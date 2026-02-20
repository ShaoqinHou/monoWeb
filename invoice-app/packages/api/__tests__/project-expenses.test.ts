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

async function createContact(name = 'Test Customer'): Promise<string> {
  const res = await req('POST', '/api/contacts', { name, type: 'customer' });
  return (await res.json()).data.id;
}

async function createProject(name = 'Test Project'): Promise<string> {
  const contactId = await createContact();
  const res = await req('POST', '/api/projects', { name, contactId });
  return (await res.json()).data.id;
}

describe('Project Expenses API', () => {
  describe('GET /api/project-expenses', () => {
    it('returns empty array initially', async () => {
      const res = await req('GET', '/api/project-expenses');
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.data).toEqual([]);
    });

    it('returns all expenses', async () => {
      const projectId = await createProject();
      await req('POST', '/api/project-expenses', {
        projectId,
        description: 'Office supplies',
        amount: 150,
        date: '2026-02-01',
      });
      await req('POST', '/api/project-expenses', {
        projectId,
        description: 'Software license',
        amount: 500,
        date: '2026-02-05',
      });

      const res = await req('GET', '/api/project-expenses');
      const body = await res.json();
      expect(body.data.length).toBe(2);
    });

    it('filters by projectId query param', async () => {
      const project1 = await createProject('Project A');
      const project2 = await createProject('Project B');
      await req('POST', '/api/project-expenses', {
        projectId: project1,
        description: 'Expense A',
        amount: 100,
        date: '2026-02-01',
      });
      await req('POST', '/api/project-expenses', {
        projectId: project2,
        description: 'Expense B',
        amount: 200,
        date: '2026-02-02',
      });

      const res = await req('GET', `/api/project-expenses?projectId=${project1}`);
      const body = await res.json();
      expect(body.data.length).toBe(1);
      expect(body.data[0].description).toBe('Expense A');
    });
  });

  describe('POST /api/project-expenses', () => {
    it('creates an expense', async () => {
      const projectId = await createProject();
      const res = await req('POST', '/api/project-expenses', {
        projectId,
        description: 'Travel costs',
        amount: 350.50,
        date: '2026-02-10',
        category: 'travel',
        isBillable: true,
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.data.description).toBe('Travel costs');
      expect(body.data.amount).toBe(350.50);
      expect(body.data.date).toBe('2026-02-10');
      expect(body.data.category).toBe('travel');
      expect(body.data.isBillable).toBe(true);
      expect(body.data.isInvoiced).toBe(false);
      expect(typeof body.data.id).toBe('string');
    });

    it('validates project exists', async () => {
      const res = await req('POST', '/api/project-expenses', {
        projectId: 'non-existent-id',
        description: 'Something',
        amount: 100,
        date: '2026-02-01',
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.ok).toBe(false);
      expect(body.error).toContain('Project not found');
    });

    it('validates required fields', async () => {
      const res = await req('POST', '/api/project-expenses', {
        description: 'No project',
        amount: 100,
      });
      expect(res.status).toBe(400);
    });

    it('defaults isBillable to true', async () => {
      const projectId = await createProject();
      const res = await req('POST', '/api/project-expenses', {
        projectId,
        description: 'Default billable',
        amount: 75,
        date: '2026-02-15',
      });
      const body = await res.json();
      expect(body.data.isBillable).toBe(true);
    });
  });

  describe('GET /api/project-expenses/:id', () => {
    it('returns a single expense', async () => {
      const projectId = await createProject();
      const createRes = await req('POST', '/api/project-expenses', {
        projectId,
        description: 'Catering',
        amount: 200,
        date: '2026-02-20',
      });
      const { data: created } = await createRes.json();

      const res = await req('GET', `/api/project-expenses/${created.id}`);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.data.id).toBe(created.id);
      expect(body.data.description).toBe('Catering');
    });

    it('returns 404 for missing expense', async () => {
      const res = await req('GET', '/api/project-expenses/does-not-exist');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/project-expenses/:id', () => {
    it('updates expense fields', async () => {
      const projectId = await createProject();
      const createRes = await req('POST', '/api/project-expenses', {
        projectId,
        description: 'Original',
        amount: 100,
        date: '2026-02-01',
      });
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/project-expenses/${created.id}`, {
        description: 'Updated',
        amount: 250,
        category: 'materials',
        isBillable: false,
      });
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.data.description).toBe('Updated');
      expect(body.data.amount).toBe(250);
      expect(body.data.category).toBe('materials');
      expect(body.data.isBillable).toBe(false);
    });

    it('returns 404 for missing expense', async () => {
      const res = await req('PUT', '/api/project-expenses/does-not-exist', {
        description: 'No expense',
      });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/project-expenses/:id', () => {
    it('deletes an expense', async () => {
      const projectId = await createProject();
      const createRes = await req('POST', '/api/project-expenses', {
        projectId,
        description: 'To delete',
        amount: 50,
        date: '2026-02-01',
      });
      const { data: created } = await createRes.json();

      const delRes = await req('DELETE', `/api/project-expenses/${created.id}`);
      expect(delRes.status).toBe(200);
      const delBody = await delRes.json();
      expect(delBody.data.id).toBe(created.id);

      // Verify it's gone
      const getRes = await req('GET', `/api/project-expenses/${created.id}`);
      expect(getRes.status).toBe(404);
    });

    it('returns 404 for missing expense', async () => {
      const res = await req('DELETE', '/api/project-expenses/does-not-exist');
      expect(res.status).toBe(404);
    });
  });
});
