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

async function createContact(name = 'Test Customer', type = 'customer'): Promise<string> {
  const res = await req('POST', '/api/contacts', { name, type });
  const json = await res.json();
  return json.data.id;
}

function makeCreditNoteBody(contactId: string, overrides?: Record<string, unknown>) {
  return {
    type: 'sales',
    contactId,
    date: '2026-02-01',
    subTotal: 500,
    totalTax: 75,
    total: 575,
    ...overrides,
  };
}

async function createInvoice(contactId: string) {
  const res = await req('POST', '/api/invoices', {
    contactId,
    date: '2026-01-15',
    dueDate: '2026-02-15',
    lineItems: [
      { description: 'Service', quantity: 10, unitPrice: 100, taxRate: 15, discount: 0 },
    ],
  });
  const json = await res.json();
  return json.data;
}

async function createBill(contactId: string) {
  const res = await req('POST', '/api/bills', {
    contactId,
    date: '2026-01-20',
    dueDate: '2026-02-20',
    lineItems: [
      { description: 'Supplies', quantity: 20, unitPrice: 25, taxRate: 15, discount: 0 },
    ],
  });
  const json = await res.json();
  return json.data;
}

describe('Credit Notes API', () => {
  describe('GET /api/credit-notes', () => {
    it('returns empty array when no credit notes', async () => {
      const res = await req('GET', '/api/credit-notes');
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toEqual([]);
    });

    it('returns all credit notes', async () => {
      const contactId = await createContact();
      await req('POST', '/api/credit-notes', makeCreditNoteBody(contactId));
      await req('POST', '/api/credit-notes', makeCreditNoteBody(contactId));

      const res = await req('GET', '/api/credit-notes');
      const json = await res.json();
      expect(json.data).toHaveLength(2);
    });
  });

  describe('POST /api/credit-notes', () => {
    it('creates a credit note with auto-generated number', async () => {
      const contactId = await createContact();
      const res = await req('POST', '/api/credit-notes', makeCreditNoteBody(contactId));
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.creditNoteNumber).toMatch(/^CN-\d{4}$/);
      expect(json.data.creditNoteNumber).toBe('CN-0001');
      expect(json.data.status).toBe('draft');
      expect(json.data.type).toBe('sales');
      expect(json.data.contactId).toBe(contactId);
      expect(json.data.contactName).toBe('Test Customer');
      expect(json.data.total).toBe(575);
      expect(json.data.remainingCredit).toBe(575);
    });

    it('auto-increments credit note numbers', async () => {
      const contactId = await createContact();
      const res1 = await req('POST', '/api/credit-notes', makeCreditNoteBody(contactId));
      const res2 = await req('POST', '/api/credit-notes', makeCreditNoteBody(contactId));
      const json1 = await res1.json();
      const json2 = await res2.json();
      expect(json1.data.creditNoteNumber).toBe('CN-0001');
      expect(json2.data.creditNoteNumber).toBe('CN-0002');
    });

    it('rejects with missing required fields', async () => {
      const res = await req('POST', '/api/credit-notes', { type: 'sales' });
      expect(res.status).toBe(400);
    });

    it('rejects with invalid type', async () => {
      const contactId = await createContact();
      const res = await req('POST', '/api/credit-notes', makeCreditNoteBody(contactId, { type: 'invalid' }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('type must be sales or purchase');
    });

    it('rejects with non-existent contact', async () => {
      const res = await req('POST', '/api/credit-notes', makeCreditNoteBody('00000000-0000-0000-0000-000000000000'));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Contact not found');
    });
  });

  describe('PUT /api/credit-notes/:id/status', () => {
    it('transitions draft to submitted', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/credit-notes', makeCreditNoteBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/credit-notes/${created.id}/status`, { status: 'submitted' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.status).toBe('submitted');
    });

    it('transitions submitted to approved', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/credit-notes', makeCreditNoteBody(contactId));
      const { data: created } = await createRes.json();

      await req('PUT', `/api/credit-notes/${created.id}/status`, { status: 'submitted' });
      const res = await req('PUT', `/api/credit-notes/${created.id}/status`, { status: 'approved' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.status).toBe('approved');
    });

    it('allows voiding from draft', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/credit-notes', makeCreditNoteBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/credit-notes/${created.id}/status`, { status: 'voided' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.status).toBe('voided');
    });

    it('rejects invalid transition (draft to applied)', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/credit-notes', makeCreditNoteBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/credit-notes/${created.id}/status`, { status: 'applied' });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('Cannot transition');
    });

    it('rejects transition from voided', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/credit-notes', makeCreditNoteBody(contactId));
      const { data: created } = await createRes.json();

      await req('PUT', `/api/credit-notes/${created.id}/status`, { status: 'voided' });
      const res = await req('PUT', `/api/credit-notes/${created.id}/status`, { status: 'draft' });
      expect(res.status).toBe(400);
    });

    it('rejects invalid status value', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/credit-notes', makeCreditNoteBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/credit-notes/${created.id}/status`, { status: 'garbage' });
      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent credit note', async () => {
      const res = await req('PUT', '/api/credit-notes/00000000-0000-0000-0000-000000000000/status', { status: 'submitted' });
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/credit-notes/:id/apply', () => {
    it('applies credit note to an invoice (reduces amountDue)', async () => {
      const contactId = await createContact();

      // Create an invoice (total = 1150)
      const invoice = await createInvoice(contactId);

      // Create and approve a credit note
      const cnRes = await req('POST', '/api/credit-notes', makeCreditNoteBody(contactId, { total: 200, subTotal: 200, totalTax: 0 }));
      const { data: cn } = await cnRes.json();
      await req('PUT', `/api/credit-notes/${cn.id}/status`, { status: 'submitted' });
      await req('PUT', `/api/credit-notes/${cn.id}/status`, { status: 'approved' });

      // Apply 200 to invoice
      const res = await req('POST', `/api/credit-notes/${cn.id}/apply`, {
        invoiceId: invoice.id,
        amount: 200,
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.remainingCredit).toBe(0);
      expect(json.data.status).toBe('applied');

      // Verify invoice was updated
      const invRes = await req('GET', `/api/invoices/${invoice.id}`);
      const invJson = await invRes.json();
      expect(invJson.data.amountDue).toBe(invoice.amountDue - 200);
      expect(invJson.data.amountPaid).toBe(200);
    });

    it('applies credit note to a bill', async () => {
      const contactId = await createContact('Supplier Co', 'supplier');

      // Create a bill
      const bill = await createBill(contactId);

      // Create and approve a purchase credit note
      const cnRes = await req('POST', '/api/credit-notes', {
        type: 'purchase',
        contactId,
        date: '2026-02-01',
        subTotal: 100,
        totalTax: 0,
        total: 100,
      });
      const { data: cn } = await cnRes.json();
      await req('PUT', `/api/credit-notes/${cn.id}/status`, { status: 'submitted' });
      await req('PUT', `/api/credit-notes/${cn.id}/status`, { status: 'approved' });

      // Apply 100 to bill
      const res = await req('POST', `/api/credit-notes/${cn.id}/apply`, {
        billId: bill.id,
        amount: 100,
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.remainingCredit).toBe(0);

      // Verify bill was updated
      const billRes = await req('GET', `/api/bills/${bill.id}`);
      const billJson = await billRes.json();
      expect(billJson.data.amountDue).toBe(bill.amountDue - 100);
      expect(billJson.data.amountPaid).toBe(100);
    });

    it('rejects applying non-approved credit note', async () => {
      const contactId = await createContact();
      const cnRes = await req('POST', '/api/credit-notes', makeCreditNoteBody(contactId));
      const { data: cn } = await cnRes.json();

      const res = await req('POST', `/api/credit-notes/${cn.id}/apply`, {
        invoiceId: 'some-id',
        amount: 100,
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Only approved credit notes can be applied');
    });

    it('rejects amount exceeding remaining credit', async () => {
      const contactId = await createContact();
      const invoice = await createInvoice(contactId);

      const cnRes = await req('POST', '/api/credit-notes', makeCreditNoteBody(contactId, { total: 100, subTotal: 100, totalTax: 0 }));
      const { data: cn } = await cnRes.json();
      await req('PUT', `/api/credit-notes/${cn.id}/status`, { status: 'submitted' });
      await req('PUT', `/api/credit-notes/${cn.id}/status`, { status: 'approved' });

      const res = await req('POST', `/api/credit-notes/${cn.id}/apply`, {
        invoiceId: invoice.id,
        amount: 200, // exceeds 100 remaining
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Amount exceeds remaining credit');
    });

    it('rejects apply without invoiceId or billId', async () => {
      const contactId = await createContact();
      const cnRes = await req('POST', '/api/credit-notes', makeCreditNoteBody(contactId));
      const { data: cn } = await cnRes.json();
      await req('PUT', `/api/credit-notes/${cn.id}/status`, { status: 'submitted' });
      await req('PUT', `/api/credit-notes/${cn.id}/status`, { status: 'approved' });

      const res = await req('POST', `/api/credit-notes/${cn.id}/apply`, { amount: 100 });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('invoiceId or billId required');
    });

    it('returns 404 for non-existent credit note', async () => {
      const res = await req('POST', '/api/credit-notes/00000000-0000-0000-0000-000000000000/apply', {
        invoiceId: 'some-id',
        amount: 100,
      });
      expect(res.status).toBe(404);
    });
  });
});
