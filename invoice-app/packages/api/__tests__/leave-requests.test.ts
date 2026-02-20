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

async function createEmployee(): Promise<string> {
  const res = await req('POST', '/api/employees', {
    firstName: 'John',
    lastName: 'Doe',
    startDate: '2025-01-01',
    salary: 50000,
  });
  const body = await res.json();
  return body.data.id;
}

describe('Leave Request Routes', () => {
  it('GET /api/leave-requests returns empty array initially', async () => {
    const res = await req('GET', '/api/leave-requests');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data).toEqual([]);
  });

  it('POST /api/leave-requests creates a leave request', async () => {
    const empId = await createEmployee();
    const res = await req('POST', '/api/leave-requests', {
      employeeId: empId,
      leaveType: 'annual',
      startDate: '2026-03-01',
      endDate: '2026-03-05',
      hours: 40,
      notes: 'Family holiday',
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.employeeId).toBe(empId);
    expect(body.data.leaveType).toBe('annual');
    expect(body.data.startDate).toBe('2026-03-01');
    expect(body.data.endDate).toBe('2026-03-05');
    expect(body.data.hours).toBe(40);
    expect(body.data.status).toBe('pending');
    expect(body.data.notes).toBe('Family holiday');
  });

  it('POST /api/leave-requests validates employee exists', async () => {
    const res = await req('POST', '/api/leave-requests', {
      employeeId: 'non-existent-employee',
      leaveType: 'annual',
      startDate: '2026-03-01',
      endDate: '2026-03-05',
      hours: 40,
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain('Employee not found');
  });

  it('POST /api/leave-requests validates leave type', async () => {
    const empId = await createEmployee();
    const res = await req('POST', '/api/leave-requests', {
      employeeId: empId,
      leaveType: 'holiday', // invalid type
      startDate: '2026-03-01',
      endDate: '2026-03-05',
      hours: 40,
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain('Invalid leave type');
  });

  it('POST /api/leave-requests rejects missing required fields', async () => {
    const empId = await createEmployee();
    const res = await req('POST', '/api/leave-requests', {
      employeeId: empId,
      leaveType: 'annual',
      // missing startDate, endDate, hours
    });
    expect(res.status).toBe(400);
  });

  it('POST /api/leave-requests accepts all valid leave types', async () => {
    const empId = await createEmployee();
    const validTypes = ['annual', 'sick', 'bereavement', 'parental', 'unpaid'];

    for (const leaveType of validTypes) {
      const res = await req('POST', '/api/leave-requests', {
        employeeId: empId,
        leaveType,
        startDate: '2026-04-01',
        endDate: '2026-04-02',
        hours: 16,
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.data.leaveType).toBe(leaveType);
    }
  });

  it('GET /api/leave-requests/:id returns single leave request', async () => {
    const empId = await createEmployee();
    const createRes = await req('POST', '/api/leave-requests', {
      employeeId: empId,
      leaveType: 'sick',
      startDate: '2026-03-10',
      endDate: '2026-03-11',
      hours: 16,
    });
    const { data: created } = await createRes.json();

    const res = await req('GET', `/api/leave-requests/${created.id}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.leaveType).toBe('sick');
    expect(body.data.hours).toBe(16);
  });

  it('GET /api/leave-requests/:id returns 404 for non-existent', async () => {
    const res = await req('GET', '/api/leave-requests/non-existent-id');
    expect(res.status).toBe(404);
  });

  it('PUT /api/leave-requests/:id/approve approves pending request', async () => {
    const empId = await createEmployee();
    const createRes = await req('POST', '/api/leave-requests', {
      employeeId: empId,
      leaveType: 'annual',
      startDate: '2026-03-01',
      endDate: '2026-03-05',
      hours: 40,
    });
    const { data: created } = await createRes.json();
    expect(created.status).toBe('pending');

    const res = await req('PUT', `/api/leave-requests/${created.id}/approve`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe('approved');
  });

  it('PUT /api/leave-requests/:id/approve rejects non-pending request', async () => {
    const empId = await createEmployee();
    const createRes = await req('POST', '/api/leave-requests', {
      employeeId: empId,
      leaveType: 'annual',
      startDate: '2026-03-01',
      endDate: '2026-03-05',
      hours: 40,
    });
    const { data: created } = await createRes.json();

    // Approve it first
    await req('PUT', `/api/leave-requests/${created.id}/approve`);

    // Try to approve again
    const res = await req('PUT', `/api/leave-requests/${created.id}/approve`);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Only pending requests can be approved');
  });

  it('PUT /api/leave-requests/:id/approve returns 404 for non-existent', async () => {
    const res = await req('PUT', '/api/leave-requests/non-existent-id/approve');
    expect(res.status).toBe(404);
  });

  it('PUT /api/leave-requests/:id/decline declines pending request', async () => {
    const empId = await createEmployee();
    const createRes = await req('POST', '/api/leave-requests', {
      employeeId: empId,
      leaveType: 'bereavement',
      startDate: '2026-04-01',
      endDate: '2026-04-03',
      hours: 24,
    });
    const { data: created } = await createRes.json();

    const res = await req('PUT', `/api/leave-requests/${created.id}/decline`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe('declined');
  });

  it('PUT /api/leave-requests/:id/decline rejects non-pending request', async () => {
    const empId = await createEmployee();
    const createRes = await req('POST', '/api/leave-requests', {
      employeeId: empId,
      leaveType: 'annual',
      startDate: '2026-03-01',
      endDate: '2026-03-05',
      hours: 40,
    });
    const { data: created } = await createRes.json();

    // Decline first
    await req('PUT', `/api/leave-requests/${created.id}/decline`);

    // Try to decline again
    const res = await req('PUT', `/api/leave-requests/${created.id}/decline`);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Only pending requests can be declined');
  });

  it('DELETE /api/leave-requests/:id deletes pending request', async () => {
    const empId = await createEmployee();
    const createRes = await req('POST', '/api/leave-requests', {
      employeeId: empId,
      leaveType: 'annual',
      startDate: '2026-03-01',
      endDate: '2026-03-05',
      hours: 40,
    });
    const { data: created } = await createRes.json();

    const res = await req('DELETE', `/api/leave-requests/${created.id}`);
    expect(res.status).toBe(200);

    const getRes = await req('GET', `/api/leave-requests/${created.id}`);
    expect(getRes.status).toBe(404);
  });

  it('DELETE /api/leave-requests/:id rejects non-pending request', async () => {
    const empId = await createEmployee();
    const createRes = await req('POST', '/api/leave-requests', {
      employeeId: empId,
      leaveType: 'annual',
      startDate: '2026-03-01',
      endDate: '2026-03-05',
      hours: 40,
    });
    const { data: created } = await createRes.json();

    // Approve it
    await req('PUT', `/api/leave-requests/${created.id}/approve`);

    // Try to delete approved request
    const res = await req('DELETE', `/api/leave-requests/${created.id}`);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Only pending requests can be deleted');
  });

  it('DELETE /api/leave-requests/:id returns 404 for non-existent', async () => {
    const res = await req('DELETE', '/api/leave-requests/non-existent-id');
    expect(res.status).toBe(404);
  });

  it('GET /api/leave-requests lists all leave requests', async () => {
    const empId = await createEmployee();
    await req('POST', '/api/leave-requests', {
      employeeId: empId,
      leaveType: 'annual',
      startDate: '2026-03-01',
      endDate: '2026-03-05',
      hours: 40,
    });
    await req('POST', '/api/leave-requests', {
      employeeId: empId,
      leaveType: 'sick',
      startDate: '2026-04-01',
      endDate: '2026-04-02',
      hours: 16,
    });

    const res = await req('GET', '/api/leave-requests');
    const body = await res.json();
    expect(body.data).toHaveLength(2);
  });
});
