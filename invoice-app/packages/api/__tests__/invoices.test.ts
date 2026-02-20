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

// Helper: create a contact and return its id
async function createContact(name = 'Test Customer'): Promise<string> {
  const res = await req('POST', '/api/contacts', { name, type: 'customer' });
  const json = await res.json();
  return json.data.id;
}

function makeInvoiceBody(contactId: string, overrides?: Record<string, unknown>) {
  return {
    contactId,
    date: '2026-01-15',
    dueDate: '2026-02-15',
    lineItems: [
      { description: 'Widget', quantity: 10, unitPrice: 100, taxRate: 15, discount: 0 },
    ],
    ...overrides,
  };
}

describe('Invoices API', () => {
  describe('POST /api/invoices', () => {
    it('creates an invoice with calculated totals', async () => {
      const contactId = await createContact();
      const res = await req('POST', '/api/invoices', makeInvoiceBody(contactId));
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
      expect(json.data.amountDue).toBe(1150);
      expect(json.data.amountPaid).toBe(0);
      expect(json.data.invoiceNumber).toMatch(/^INV-\d{4}$/);
      expect(json.data.lineItems).toHaveLength(1);
      expect(json.data.lineItems[0].lineAmount).toBe(1000);
      expect(json.data.lineItems[0].taxAmount).toBe(150);
    });

    it('creates invoice with multiple line items', async () => {
      const contactId = await createContact();
      const body = makeInvoiceBody(contactId, {
        lineItems: [
          { description: 'Widget A', quantity: 5, unitPrice: 200, taxRate: 15, discount: 0 },
          { description: 'Widget B', quantity: 3, unitPrice: 50, taxRate: 15, discount: 10 },
        ],
      });
      const res = await req('POST', '/api/invoices', body);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.lineItems).toHaveLength(2);
      // A: 5*200 = 1000, tax=150
      // B: 3*50*(0.9) = 135, tax=20.25
      expect(json.data.subTotal).toBe(1135);
      expect(json.data.totalTax).toBe(170.25);
      expect(json.data.total).toBe(1305.25);
    });

    it('auto-increments invoice numbers', async () => {
      const contactId = await createContact();
      const res1 = await req('POST', '/api/invoices', makeInvoiceBody(contactId));
      const res2 = await req('POST', '/api/invoices', makeInvoiceBody(contactId));
      const json1 = await res1.json();
      const json2 = await res2.json();
      expect(json1.data.invoiceNumber).toBe('INV-0001');
      expect(json2.data.invoiceNumber).toBe('INV-0002');
    });

    it('rejects invoice with no line items', async () => {
      const contactId = await createContact();
      const res = await req('POST', '/api/invoices', {
        contactId,
        date: '2026-01-15',
        dueDate: '2026-02-15',
        lineItems: [],
      });
      expect(res.status).toBe(400);
    });

    it('rejects invoice with non-existent contact', async () => {
      const res = await req('POST', '/api/invoices', makeInvoiceBody('00000000-0000-0000-0000-000000000000'));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Contact not found');
    });

    it('rejects invoice with missing required fields', async () => {
      const res = await req('POST', '/api/invoices', { contactId: 'not-uuid' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/invoices', () => {
    it('returns empty array when no invoices', async () => {
      const res = await req('GET', '/api/invoices');
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toEqual([]);
    });

    it('returns all invoices', async () => {
      const contactId = await createContact();
      await req('POST', '/api/invoices', makeInvoiceBody(contactId));
      await req('POST', '/api/invoices', makeInvoiceBody(contactId));

      const res = await req('GET', '/api/invoices');
      const json = await res.json();
      expect(json.data).toHaveLength(2);
    });
  });

  describe('GET /api/invoices/:id', () => {
    it('returns invoice with line items', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/invoices', makeInvoiceBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('GET', `/api/invoices/${created.id}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.lineItems).toHaveLength(1);
      expect(json.data.lineItems[0].description).toBe('Widget');
    });

    it('returns 404 for non-existent invoice', async () => {
      const res = await req('GET', '/api/invoices/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/invoices/:id', () => {
    it('updates draft invoice reference', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/invoices', makeInvoiceBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/invoices/${created.id}`, { reference: 'PO-123' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.reference).toBe('PO-123');
    });

    it('recalculates totals when line items updated', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/invoices', makeInvoiceBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/invoices/${created.id}`, {
        lineItems: [
          { description: 'Gadget', quantity: 5, unitPrice: 200, taxRate: 15, discount: 0 },
        ],
      });
      const json = await res.json();
      // 5 * 200 = 1000, tax = 150, total = 1150
      expect(json.data.subTotal).toBe(1000);
      expect(json.data.totalTax).toBe(150);
      expect(json.data.total).toBe(1150);
      expect(json.data.lineItems).toHaveLength(1);
      expect(json.data.lineItems[0].description).toBe('Gadget');
    });

    it('rejects update on non-draft invoice', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/invoices', makeInvoiceBody(contactId));
      const { data: created } = await createRes.json();

      // Submit the invoice
      await req('PUT', `/api/invoices/${created.id}/status`, { status: 'submitted' });

      const res = await req('PUT', `/api/invoices/${created.id}`, { reference: 'X' });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Only draft invoices can be edited');
    });

    it('returns 404 for non-existent invoice', async () => {
      const res = await req('PUT', '/api/invoices/00000000-0000-0000-0000-000000000000', { reference: 'X' });
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/invoices/:id/status', () => {
    it('transitions draft to submitted', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/invoices', makeInvoiceBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/invoices/${created.id}/status`, { status: 'submitted' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.status).toBe('submitted');
    });

    it('transitions submitted to approved', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/invoices', makeInvoiceBody(contactId));
      const { data: created } = await createRes.json();

      await req('PUT', `/api/invoices/${created.id}/status`, { status: 'submitted' });
      const res = await req('PUT', `/api/invoices/${created.id}/status`, { status: 'approved' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.status).toBe('approved');
    });

    it('rejects invalid transition (draft to paid)', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/invoices', makeInvoiceBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/invoices/${created.id}/status`, { status: 'paid' });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('Cannot transition');
    });

    it('rejects invalid transition (approved to draft)', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/invoices', makeInvoiceBody(contactId));
      const { data: created } = await createRes.json();

      await req('PUT', `/api/invoices/${created.id}/status`, { status: 'submitted' });
      await req('PUT', `/api/invoices/${created.id}/status`, { status: 'approved' });

      const res = await req('PUT', `/api/invoices/${created.id}/status`, { status: 'draft' });
      expect(res.status).toBe(400);
    });

    it('allows voiding a draft', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/invoices', makeInvoiceBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/invoices/${created.id}/status`, { status: 'voided' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.status).toBe('voided');
    });

    it('rejects transition from voided', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/invoices', makeInvoiceBody(contactId));
      const { data: created } = await createRes.json();

      await req('PUT', `/api/invoices/${created.id}/status`, { status: 'voided' });

      const res = await req('PUT', `/api/invoices/${created.id}/status`, { status: 'draft' });
      expect(res.status).toBe(400);
    });

    it('rejects invalid status value', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/invoices', makeInvoiceBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/invoices/${created.id}/status`, { status: 'garbage' });
      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent invoice', async () => {
      const res = await req('PUT', '/api/invoices/00000000-0000-0000-0000-000000000000/status', { status: 'submitted' });
      expect(res.status).toBe(404);
    });
  });
});
