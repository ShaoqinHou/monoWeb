import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createApp } from '../src/app';
import { createTestDb } from '../src/db/test-helpers';
import type { Db } from '../src/db/index';

let db: Db;
let cleanup: () => void;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  const testDb = createTestDb();
  db = testDb.db;
  cleanup = testDb.cleanup;
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

async function createContact(name = 'Supplier Co'): Promise<string> {
  const res = await req('POST', '/api/contacts', { name, type: 'supplier' });
  const json = await res.json();
  return json.data.id;
}

function makeRecurringBillBody(contactId: string, overrides?: Record<string, unknown>) {
  return {
    templateName: 'Monthly Office Rent',
    contactId,
    frequency: 'monthly',
    nextDate: '2026-03-01',
    daysUntilDue: 20,
    subTotal: 2000,
    totalTax: 300,
    total: 2300,
    ...overrides,
  };
}

describe('Recurring Bills API', () => {
  describe('GET /api/recurring-bills', () => {
    it('returns empty array when no recurring bills', async () => {
      const res = await req('GET', '/api/recurring-bills');
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toEqual([]);
    });

    it('returns all recurring bills', async () => {
      const contactId = await createContact();
      await req('POST', '/api/recurring-bills', makeRecurringBillBody(contactId));
      await req('POST', '/api/recurring-bills', makeRecurringBillBody(contactId, { templateName: 'Weekly Cleaning' }));

      const res = await req('GET', '/api/recurring-bills');
      const json = await res.json();
      expect(json.data).toHaveLength(2);
    });
  });

  describe('POST /api/recurring-bills', () => {
    it('creates a recurring bill template', async () => {
      const contactId = await createContact();
      const res = await req('POST', '/api/recurring-bills', makeRecurringBillBody(contactId));
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.templateName).toBe('Monthly Office Rent');
      expect(json.data.contactId).toBe(contactId);
      expect(json.data.contactName).toBe('Supplier Co');
      expect(json.data.frequency).toBe('monthly');
      expect(json.data.nextDate).toBe('2026-03-01');
      expect(json.data.status).toBe('active');
      expect(json.data.timesGenerated).toBe(0);
      expect(json.data.daysUntilDue).toBe(20);
      expect(json.data.total).toBe(2300);
    });

    it('rejects with missing required fields', async () => {
      const res = await req('POST', '/api/recurring-bills', { templateName: 'test' });
      expect(res.status).toBe(400);
    });

    it('rejects with non-existent contact', async () => {
      const res = await req('POST', '/api/recurring-bills', makeRecurringBillBody('00000000-0000-0000-0000-000000000000'));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Contact not found');
    });

    it('rejects invalid frequency', async () => {
      const contactId = await createContact();
      const res = await req('POST', '/api/recurring-bills', makeRecurringBillBody(contactId, { frequency: 'daily' }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Invalid frequency');
    });
  });

  describe('PUT /api/recurring-bills/:id', () => {
    it('updates a recurring bill template', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/recurring-bills', makeRecurringBillBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/recurring-bills/${created.id}`, {
        templateName: 'Updated Rent',
        frequency: 'quarterly',
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.templateName).toBe('Updated Rent');
      expect(json.data.frequency).toBe('quarterly');
    });

    it('returns 404 for non-existent template', async () => {
      const res = await req('PUT', '/api/recurring-bills/00000000-0000-0000-0000-000000000000', { templateName: 'X' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/recurring-bills/:id', () => {
    it('deletes a recurring bill template', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/recurring-bills', makeRecurringBillBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('DELETE', `/api/recurring-bills/${created.id}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.id).toBe(created.id);

      // Verify it's gone
      const getRes = await req('GET', `/api/recurring-bills/${created.id}`);
      expect(getRes.status).toBe(404);
    });

    it('returns 404 for non-existent template', async () => {
      const res = await req('DELETE', '/api/recurring-bills/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/recurring-bills/:id/generate', () => {
    it('generates a bill from template', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/recurring-bills', makeRecurringBillBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('POST', `/api/recurring-bills/${created.id}/generate`);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.billNumber).toMatch(/^BILL-\d{4}$/);
      expect(json.data.status).toBe('draft');
      expect(json.data.contactId).toBe(contactId);
      expect(json.data.total).toBe(2300);

      // Verify template was updated
      const templateRes = await req('GET', `/api/recurring-bills/${created.id}`);
      const templateJson = await templateRes.json();
      expect(templateJson.data.timesGenerated).toBe(1);
      expect(templateJson.data.nextDate).toBe('2026-04-01'); // monthly: March -> April
    });

    it('advances nextDate correctly for weekly frequency', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/recurring-bills', makeRecurringBillBody(contactId, {
        frequency: 'weekly',
        nextDate: '2026-03-01',
      }));
      const { data: created } = await createRes.json();

      await req('POST', `/api/recurring-bills/${created.id}/generate`);

      const templateRes = await req('GET', `/api/recurring-bills/${created.id}`);
      const templateJson = await templateRes.json();
      expect(templateJson.data.nextDate).toBe('2026-03-08'); // +7 days
    });

    it('increments timesGenerated on each generation', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/recurring-bills', makeRecurringBillBody(contactId));
      const { data: created } = await createRes.json();

      await req('POST', `/api/recurring-bills/${created.id}/generate`);
      await req('POST', `/api/recurring-bills/${created.id}/generate`);

      const templateRes = await req('GET', `/api/recurring-bills/${created.id}`);
      const templateJson = await templateRes.json();
      expect(templateJson.data.timesGenerated).toBe(2);
    });

    it('sets status to completed when past endDate', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/recurring-bills', makeRecurringBillBody(contactId, {
        frequency: 'monthly',
        nextDate: '2026-03-01',
        endDate: '2026-03-15',
      }));
      const { data: created } = await createRes.json();

      await req('POST', `/api/recurring-bills/${created.id}/generate`);

      const templateRes = await req('GET', `/api/recurring-bills/${created.id}`);
      const templateJson = await templateRes.json();
      // nextDate advances to 2026-04-01, which is past endDate 2026-03-15
      expect(templateJson.data.status).toBe('completed');
    });

    it('rejects generating from inactive template', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/recurring-bills', makeRecurringBillBody(contactId));
      const { data: created } = await createRes.json();

      // Pause the template
      await req('PUT', `/api/recurring-bills/${created.id}`, { status: 'paused' });

      const res = await req('POST', `/api/recurring-bills/${created.id}/generate`);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Only active recurring bills can generate bills');
    });

    it('returns 404 for non-existent template', async () => {
      const res = await req('POST', '/api/recurring-bills/00000000-0000-0000-0000-000000000000/generate');
      expect(res.status).toBe(404);
    });
  });
});
