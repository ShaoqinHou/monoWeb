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

function makeQuoteBody(contactId: string, overrides?: Record<string, unknown>) {
  return {
    contactId,
    date: '2026-01-15',
    expiryDate: '2026-02-15',
    title: 'Website Redesign',
    lineItems: [
      { description: 'Design work', quantity: 10, unitPrice: 100, taxRate: 15, discount: 0 },
    ],
    ...overrides,
  };
}

describe('Quotes API', () => {
  describe('GET /api/quotes', () => {
    it('returns empty array when no quotes', async () => {
      const res = await req('GET', '/api/quotes');
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toEqual([]);
    });

    it('returns all quotes', async () => {
      const contactId = await createContact();
      await req('POST', '/api/quotes', makeQuoteBody(contactId));
      await req('POST', '/api/quotes', makeQuoteBody(contactId));

      const res = await req('GET', '/api/quotes');
      const json = await res.json();
      expect(json.data).toHaveLength(2);
    });
  });

  describe('POST /api/quotes', () => {
    it('creates a quote with calculated totals', async () => {
      const contactId = await createContact();
      const res = await req('POST', '/api/quotes', makeQuoteBody(contactId));
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.status).toBe('draft');
      expect(json.data.contactId).toBe(contactId);
      expect(json.data.contactName).toBe('Test Customer');
      // 10 * 100 = 1000 exclusive, tax = 150, total = 1150
      expect(json.data.subTotal).toBe(1000);
      expect(json.data.totalTax).toBe(150);
      expect(json.data.total).toBe(1150);
      expect(json.data.quoteNumber).toMatch(/^QU-\d{4}$/);
      expect(json.data.lineItems).toHaveLength(1);
      expect(json.data.lineItems[0].lineAmount).toBe(1000);
      expect(json.data.lineItems[0].taxAmount).toBe(150);
    });

    it('creates quote with multiple line items', async () => {
      const contactId = await createContact();
      const body = makeQuoteBody(contactId, {
        lineItems: [
          { description: 'Design', quantity: 5, unitPrice: 200, taxRate: 15, discount: 0 },
          { description: 'Dev', quantity: 3, unitPrice: 50, taxRate: 15, discount: 10 },
        ],
      });
      const res = await req('POST', '/api/quotes', body);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.lineItems).toHaveLength(2);
      // Design: 5*200 = 1000, tax=150
      // Dev: 3*50*(0.9) = 135, tax=20.25
      expect(json.data.subTotal).toBe(1135);
      expect(json.data.totalTax).toBe(170.25);
      expect(json.data.total).toBe(1305.25);
    });

    it('auto-increments quote numbers', async () => {
      const contactId = await createContact();
      const res1 = await req('POST', '/api/quotes', makeQuoteBody(contactId));
      const res2 = await req('POST', '/api/quotes', makeQuoteBody(contactId));
      const json1 = await res1.json();
      const json2 = await res2.json();
      expect(json1.data.quoteNumber).toBe('QU-0001');
      expect(json2.data.quoteNumber).toBe('QU-0002');
    });

    it('rejects quote with non-existent contact', async () => {
      const res = await req('POST', '/api/quotes', makeQuoteBody('00000000-0000-0000-0000-000000000000'));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Contact not found');
    });

    it('rejects quote with missing required fields', async () => {
      const res = await req('POST', '/api/quotes', { contactId: 'not-uuid' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/quotes/:id', () => {
    it('returns quote with line items', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/quotes', makeQuoteBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('GET', `/api/quotes/${created.id}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.lineItems).toHaveLength(1);
      expect(json.data.lineItems[0].description).toBe('Design work');
    });

    it('returns 404 for non-existent quote', async () => {
      const res = await req('GET', '/api/quotes/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/quotes/:id', () => {
    it('updates draft quote reference', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/quotes', makeQuoteBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/quotes/${created.id}`, { reference: 'REF-123' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.reference).toBe('REF-123');
    });

    it('recalculates totals when line items updated', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/quotes', makeQuoteBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/quotes/${created.id}`, {
        lineItems: [
          { description: 'Consulting', quantity: 5, unitPrice: 200, taxRate: 15, discount: 0 },
        ],
      });
      const json = await res.json();
      // 5 * 200 = 1000, tax = 150, total = 1150
      expect(json.data.subTotal).toBe(1000);
      expect(json.data.totalTax).toBe(150);
      expect(json.data.total).toBe(1150);
      expect(json.data.lineItems).toHaveLength(1);
      expect(json.data.lineItems[0].description).toBe('Consulting');
    });

    it('rejects update on non-draft quote', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/quotes', makeQuoteBody(contactId));
      const { data: created } = await createRes.json();

      // Move to sent
      await req('PUT', `/api/quotes/${created.id}/status`, { status: 'sent' });

      const res = await req('PUT', `/api/quotes/${created.id}`, { reference: 'X' });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Only draft quotes can be edited');
    });

    it('returns 404 for non-existent quote', async () => {
      const res = await req('PUT', '/api/quotes/00000000-0000-0000-0000-000000000000', { reference: 'X' });
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/quotes/:id/status', () => {
    it('transitions draft to sent', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/quotes', makeQuoteBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/quotes/${created.id}/status`, { status: 'sent' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.status).toBe('sent');
    });

    it('transitions sent to accepted', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/quotes', makeQuoteBody(contactId));
      const { data: created } = await createRes.json();

      await req('PUT', `/api/quotes/${created.id}/status`, { status: 'sent' });
      const res = await req('PUT', `/api/quotes/${created.id}/status`, { status: 'accepted' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.status).toBe('accepted');
    });

    it('transitions accepted to invoiced', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/quotes', makeQuoteBody(contactId));
      const { data: created } = await createRes.json();

      await req('PUT', `/api/quotes/${created.id}/status`, { status: 'sent' });
      await req('PUT', `/api/quotes/${created.id}/status`, { status: 'accepted' });
      const res = await req('PUT', `/api/quotes/${created.id}/status`, { status: 'invoiced' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.status).toBe('invoiced');
    });

    it('rejects invalid transition (draft to accepted)', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/quotes', makeQuoteBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/quotes/${created.id}/status`, { status: 'accepted' });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('Cannot transition');
    });

    it('rejects invalid status value', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/quotes', makeQuoteBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/quotes/${created.id}/status`, { status: 'garbage' });
      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent quote', async () => {
      const res = await req('PUT', '/api/quotes/00000000-0000-0000-0000-000000000000/status', { status: 'sent' });
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/quotes/:id/convert', () => {
    it('converts accepted quote to invoice', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/quotes', makeQuoteBody(contactId));
      const { data: created } = await createRes.json();

      await req('PUT', `/api/quotes/${created.id}/status`, { status: 'sent' });
      await req('PUT', `/api/quotes/${created.id}/status`, { status: 'accepted' });

      const res = await req('POST', `/api/quotes/${created.id}/convert`);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.invoiceNumber).toMatch(/^INV-\d{4}$/);
      expect(json.data.status).toBe('draft');
      expect(json.data.contactId).toBe(contactId);
      expect(json.data.total).toBe(created.total);

      // Quote should now be invoiced
      const quoteRes = await req('GET', `/api/quotes/${created.id}`);
      const quoteJson = await quoteRes.json();
      expect(quoteJson.data.status).toBe('invoiced');
      expect(quoteJson.data.convertedInvoiceId).toBe(json.data.id);
    });

    it('rejects converting non-accepted quote', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/quotes', makeQuoteBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('POST', `/api/quotes/${created.id}/convert`);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Only accepted quotes can be converted to invoices');
    });

    it('rejects converting already-converted quote', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/quotes', makeQuoteBody(contactId));
      const { data: created } = await createRes.json();

      await req('PUT', `/api/quotes/${created.id}/status`, { status: 'sent' });
      await req('PUT', `/api/quotes/${created.id}/status`, { status: 'accepted' });
      await req('POST', `/api/quotes/${created.id}/convert`);

      // Try to convert again (quote is now invoiced, so accepted check fails)
      const res = await req('POST', `/api/quotes/${created.id}/convert`);
      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent quote', async () => {
      const res = await req('POST', '/api/quotes/00000000-0000-0000-0000-000000000000/convert');
      expect(res.status).toBe(404);
    });
  });
});
