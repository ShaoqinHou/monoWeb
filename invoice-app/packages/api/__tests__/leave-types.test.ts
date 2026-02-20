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

const validLeaveType = { name: 'Annual Leave', paidLeave: 1, defaultDaysPerYear: 20 };

describe('Leave Types API', () => {
  describe('GET /api/leave-types', () => {
    it('returns empty array initially', async () => {
      const res = await req('GET', '/api/leave-types');
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.data).toEqual([]);
    });

    it('returns all leave types', async () => {
      await req('POST', '/api/leave-types', validLeaveType);
      await req('POST', '/api/leave-types', { name: 'Sick Leave' });

      const res = await req('GET', '/api/leave-types');
      const body = await res.json();
      expect(body.data).toHaveLength(2);
    });
  });

  describe('GET /api/leave-types/:id', () => {
    it('returns a specific leave type', async () => {
      const createRes = await req('POST', '/api/leave-types', validLeaveType);
      const { data: created } = await createRes.json();

      const res = await req('GET', `/api/leave-types/${created.id}`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.name).toBe('Annual Leave');
      expect(body.data.defaultDaysPerYear).toBe(20);
    });

    it('returns 404 for non-existent leave type', async () => {
      const res = await req('GET', '/api/leave-types/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/leave-types', () => {
    it('creates a leave type', async () => {
      const res = await req('POST', '/api/leave-types', validLeaveType);
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.data.name).toBe('Annual Leave');
      expect(body.data.paidLeave).toBe(1);
      expect(body.data.showOnPayslip).toBe(1);
      expect(body.data.defaultDaysPerYear).toBe(20);
    });

    it('rejects missing name', async () => {
      const res = await req('POST', '/api/leave-types', { paidLeave: 1 });
      expect(res.status).toBe(400);
    });

    it('defaults paidLeave, showOnPayslip, and defaultDaysPerYear', async () => {
      const res = await req('POST', '/api/leave-types', { name: 'Personal' });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.data.paidLeave).toBe(1);
      expect(body.data.showOnPayslip).toBe(1);
      expect(body.data.defaultDaysPerYear).toBe(0);
    });
  });

  describe('PUT /api/leave-types/:id', () => {
    it('updates leave type name', async () => {
      const createRes = await req('POST', '/api/leave-types', validLeaveType);
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/leave-types/${created.id}`, { name: 'Holiday Leave' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.name).toBe('Holiday Leave');
    });

    it('updates defaultDaysPerYear', async () => {
      const createRes = await req('POST', '/api/leave-types', validLeaveType);
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/leave-types/${created.id}`, { defaultDaysPerYear: 25 });
      const body = await res.json();
      expect(body.data.defaultDaysPerYear).toBe(25);
    });

    it('returns 404 for non-existent leave type', async () => {
      const res = await req('PUT', '/api/leave-types/00000000-0000-0000-0000-000000000000', { name: 'X' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/leave-types/:id', () => {
    it('deletes an existing leave type', async () => {
      const createRes = await req('POST', '/api/leave-types', validLeaveType);
      const { data: created } = await createRes.json();

      const res = await req('DELETE', `/api/leave-types/${created.id}`);
      expect(res.status).toBe(200);

      const getRes = await req('GET', `/api/leave-types/${created.id}`);
      expect(getRes.status).toBe(404);
    });

    it('returns 404 for non-existent leave type', async () => {
      const res = await req('DELETE', '/api/leave-types/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });
  });
});
