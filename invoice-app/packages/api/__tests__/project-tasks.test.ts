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

describe('Project Tasks API', () => {
  describe('GET /api/project-tasks', () => {
    it('returns empty array initially', async () => {
      const res = await req('GET', '/api/project-tasks');
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.data).toEqual([]);
    });

    it('returns all tasks', async () => {
      const projectId = await createProject();
      await req('POST', '/api/project-tasks', {
        projectId,
        name: 'Design mockups',
      });
      await req('POST', '/api/project-tasks', {
        projectId,
        name: 'Implement UI',
      });

      const res = await req('GET', '/api/project-tasks');
      const body = await res.json();
      expect(body.data.length).toBe(2);
    });

    it('filters by projectId query param', async () => {
      const project1 = await createProject('Project A');
      const project2 = await createProject('Project B');
      await req('POST', '/api/project-tasks', { projectId: project1, name: 'Task A' });
      await req('POST', '/api/project-tasks', { projectId: project2, name: 'Task B' });

      const res = await req('GET', `/api/project-tasks?projectId=${project1}`);
      const body = await res.json();
      expect(body.data.length).toBe(1);
      expect(body.data[0].name).toBe('Task A');
    });
  });

  describe('POST /api/project-tasks', () => {
    it('creates a task with default status todo', async () => {
      const projectId = await createProject();
      const res = await req('POST', '/api/project-tasks', {
        projectId,
        name: 'Write tests',
        description: 'Unit and integration tests',
        estimatedHours: 8,
        dueDate: '2026-03-01',
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.data.name).toBe('Write tests');
      expect(body.data.description).toBe('Unit and integration tests');
      expect(body.data.status).toBe('todo');
      expect(body.data.estimatedHours).toBe(8);
      expect(body.data.actualHours).toBe(0);
      expect(body.data.dueDate).toBe('2026-03-01');
      expect(typeof body.data.id).toBe('string');
    });

    it('validates project exists', async () => {
      const res = await req('POST', '/api/project-tasks', {
        projectId: 'non-existent',
        name: 'Orphan task',
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('Project not found');
    });

    it('validates required fields', async () => {
      const res = await req('POST', '/api/project-tasks', {
        name: 'No project ID',
      });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/project-tasks/:id', () => {
    it('returns a single task', async () => {
      const projectId = await createProject();
      const createRes = await req('POST', '/api/project-tasks', {
        projectId,
        name: 'Code review',
      });
      const { data: created } = await createRes.json();

      const res = await req('GET', `/api/project-tasks/${created.id}`);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.data.name).toBe('Code review');
    });

    it('returns 404 for missing task', async () => {
      const res = await req('GET', '/api/project-tasks/does-not-exist');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/project-tasks/:id', () => {
    it('updates task status', async () => {
      const projectId = await createProject();
      const createRes = await req('POST', '/api/project-tasks', {
        projectId,
        name: 'Build feature',
      });
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/project-tasks/${created.id}`, {
        status: 'in_progress',
      });
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.data.status).toBe('in_progress');
    });

    it('updates task to done', async () => {
      const projectId = await createProject();
      const createRes = await req('POST', '/api/project-tasks', {
        projectId,
        name: 'Deploy',
      });
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/project-tasks/${created.id}`, {
        status: 'done',
      });
      const body = await res.json();
      expect(body.data.status).toBe('done');
    });

    it('updates hours and assignee', async () => {
      const projectId = await createProject();
      const createRes = await req('POST', '/api/project-tasks', {
        projectId,
        name: 'Research',
      });
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/project-tasks/${created.id}`, {
        actualHours: 5,
        estimatedHours: 10,
      });
      const body = await res.json();
      expect(body.data.actualHours).toBe(5);
      expect(body.data.estimatedHours).toBe(10);
    });

    it('returns 404 for missing task', async () => {
      const res = await req('PUT', '/api/project-tasks/does-not-exist', {
        status: 'done',
      });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/project-tasks/:id', () => {
    it('deletes a task', async () => {
      const projectId = await createProject();
      const createRes = await req('POST', '/api/project-tasks', {
        projectId,
        name: 'To delete',
      });
      const { data: created } = await createRes.json();

      const delRes = await req('DELETE', `/api/project-tasks/${created.id}`);
      expect(delRes.status).toBe(200);
      const delBody = await delRes.json();
      expect(delBody.data.id).toBe(created.id);

      // Verify it's gone
      const getRes = await req('GET', `/api/project-tasks/${created.id}`);
      expect(getRes.status).toBe(404);
    });

    it('returns 404 for missing task', async () => {
      const res = await req('DELETE', '/api/project-tasks/does-not-exist');
      expect(res.status).toBe(404);
    });
  });
});
