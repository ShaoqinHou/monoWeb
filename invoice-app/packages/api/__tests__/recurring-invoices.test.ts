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

async function createContact(name = 'Test Customer'): Promise<string> {
  const res = await req('POST', '/api/contacts', { name, type: 'customer' });
  const json = await res.json();
  return json.data.id;
}

function makeRecurringBody(contactId: string, overrides?: Record<string, unknown>) {
  return {
    templateName: 'Monthly Retainer',
    contactId,
    frequency: 'monthly',
    nextDate: '2026-03-01',
    daysUntilDue: 14,
    subTotal: 1000,
    totalTax: 150,
    total: 1150,
    ...overrides,
  };
}

describe('Recurring Invoices API', () => {
  describe('GET /api/recurring-invoices', () => {
    it('returns empty array when no recurring invoices', async () => {
      const res = await req('GET', '/api/recurring-invoices');
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toEqual([]);
    });

    it('returns all recurring invoices', async () => {
      const contactId = await createContact();
      await req('POST', '/api/recurring-invoices', makeRecurringBody(contactId));
      await req('POST', '/api/recurring-invoices', makeRecurringBody(contactId, { templateName: 'Weekly' }));

      const res = await req('GET', '/api/recurring-invoices');
      const json = await res.json();
      expect(json.data).toHaveLength(2);
    });
  });

  describe('POST /api/recurring-invoices', () => {
    it('creates a recurring invoice template', async () => {
      const contactId = await createContact();
      const res = await req('POST', '/api/recurring-invoices', makeRecurringBody(contactId));
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.templateName).toBe('Monthly Retainer');
      expect(json.data.contactId).toBe(contactId);
      expect(json.data.contactName).toBe('Test Customer');
      expect(json.data.frequency).toBe('monthly');
      expect(json.data.nextDate).toBe('2026-03-01');
      expect(json.data.status).toBe('active');
      expect(json.data.timesGenerated).toBe(0);
      expect(json.data.daysUntilDue).toBe(14);
      expect(json.data.total).toBe(1150);
    });

    it('rejects with missing required fields', async () => {
      const res = await req('POST', '/api/recurring-invoices', { templateName: 'test' });
      expect(res.status).toBe(400);
    });

    it('rejects with non-existent contact', async () => {
      const res = await req('POST', '/api/recurring-invoices', makeRecurringBody('00000000-0000-0000-0000-000000000000'));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Contact not found');
    });

    it('rejects invalid frequency', async () => {
      const contactId = await createContact();
      const res = await req('POST', '/api/recurring-invoices', makeRecurringBody(contactId, { frequency: 'daily' }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Invalid frequency');
    });
  });

  describe('PUT /api/recurring-invoices/:id', () => {
    it('updates a recurring invoice template', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/recurring-invoices', makeRecurringBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/recurring-invoices/${created.id}`, {
        templateName: 'Updated Retainer',
        frequency: 'quarterly',
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.templateName).toBe('Updated Retainer');
      expect(json.data.frequency).toBe('quarterly');
    });

    it('returns 404 for non-existent template', async () => {
      const res = await req('PUT', '/api/recurring-invoices/00000000-0000-0000-0000-000000000000', { templateName: 'X' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/recurring-invoices/:id', () => {
    it('deletes a recurring invoice template', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/recurring-invoices', makeRecurringBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('DELETE', `/api/recurring-invoices/${created.id}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.id).toBe(created.id);

      // Verify it's gone
      const getRes = await req('GET', `/api/recurring-invoices/${created.id}`);
      expect(getRes.status).toBe(404);
    });

    it('returns 404 for non-existent template', async () => {
      const res = await req('DELETE', '/api/recurring-invoices/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/recurring-invoices/:id/generate', () => {
    it('generates an invoice from template', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/recurring-invoices', makeRecurringBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('POST', `/api/recurring-invoices/${created.id}/generate`);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.invoiceNumber).toMatch(/^INV-\d{4}$/);
      expect(json.data.status).toBe('draft');
      expect(json.data.contactId).toBe(contactId);
      expect(json.data.total).toBe(1150);

      // Verify template was updated
      const templateRes = await req('GET', `/api/recurring-invoices/${created.id}`);
      const templateJson = await templateRes.json();
      expect(templateJson.data.timesGenerated).toBe(1);
      expect(templateJson.data.nextDate).toBe('2026-04-01'); // monthly: March -> April
    });

    it('advances nextDate correctly for weekly frequency', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/recurring-invoices', makeRecurringBody(contactId, {
        frequency: 'weekly',
        nextDate: '2026-03-01',
      }));
      const { data: created } = await createRes.json();

      await req('POST', `/api/recurring-invoices/${created.id}/generate`);

      const templateRes = await req('GET', `/api/recurring-invoices/${created.id}`);
      const templateJson = await templateRes.json();
      expect(templateJson.data.nextDate).toBe('2026-03-08'); // +7 days
    });

    it('increments timesGenerated on each generation', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/recurring-invoices', makeRecurringBody(contactId));
      const { data: created } = await createRes.json();

      await req('POST', `/api/recurring-invoices/${created.id}/generate`);
      await req('POST', `/api/recurring-invoices/${created.id}/generate`);

      const templateRes = await req('GET', `/api/recurring-invoices/${created.id}`);
      const templateJson = await templateRes.json();
      expect(templateJson.data.timesGenerated).toBe(2);
    });

    it('sets status to completed when past endDate', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/recurring-invoices', makeRecurringBody(contactId, {
        frequency: 'monthly',
        nextDate: '2026-03-01',
        endDate: '2026-03-15',
      }));
      const { data: created } = await createRes.json();

      await req('POST', `/api/recurring-invoices/${created.id}/generate`);

      const templateRes = await req('GET', `/api/recurring-invoices/${created.id}`);
      const templateJson = await templateRes.json();
      // nextDate advances to 2026-04-01, which is past endDate 2026-03-15
      expect(templateJson.data.status).toBe('completed');
    });

    it('rejects generating from inactive template', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/recurring-invoices', makeRecurringBody(contactId));
      const { data: created } = await createRes.json();

      // Pause the template
      await req('PUT', `/api/recurring-invoices/${created.id}`, { status: 'paused' });

      const res = await req('POST', `/api/recurring-invoices/${created.id}/generate`);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Only active recurring invoices can generate invoices');
    });

    it('returns 404 for non-existent template', async () => {
      const res = await req('POST', '/api/recurring-invoices/00000000-0000-0000-0000-000000000000/generate');
      expect(res.status).toBe(404);
    });
  });
});
