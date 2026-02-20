import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createApp } from '../src/app';
import { createTestDb } from '../src/db/test-helpers';
import type { Db } from '../src/db/index';

let db: Db;
let cleanup: () => void;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  ({ db, cleanup } = createTestDb());
  app = createApp(db);
});
afterEach(() => cleanup());

function req(method: string, path: string, body?: unknown) {
  const init: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) init.body = JSON.stringify(body);
  return app.request(path, init);
}

/** Seed a contact so FK constraints pass */
async function seedContact(id = 'ct-1', name = 'Acme Corp') {
  const res = await req('POST', '/api/contacts', { name, type: 'customer' });
  const json = await res.json();
  return json.data.id as string;
}

// ---------------------------------------------------------------------------
// Quotes CRUD + Validation
// ---------------------------------------------------------------------------
describe('Quotes CRUD + Validation', () => {
  let contactId: string;
  beforeEach(async () => {
    contactId = await seedContact();
  });

  describe('POST /api/quotes', () => {
    it('creates a quote with valid data and returns 201', async () => {
      const res = await req('POST', '/api/quotes', {
        contactId,
        date: '2026-03-01',
        expiryDate: '2026-03-31',
        title: 'Website Redesign',
        lineItems: [
          { description: 'Design', quantity: 10, unitPrice: 150, taxRate: 15 },
        ],
      });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(typeof json.data.id).toBe('string');
      expect(json.data.quoteNumber).toMatch(/^QU-\d{4}$/);
      expect(json.data.status).toBe('draft');
      expect(json.data.contactName).toBe('Acme Corp');
      // 10 * 150 = 1500 subtotal, 225 tax, 1725 total
      expect(json.data.subTotal).toBe(1500);
      expect(json.data.totalTax).toBe(225);
      expect(json.data.total).toBe(1725);
      expect(json.data.lineItems).toHaveLength(1);
      expect(json.data.lineItems[0].lineAmount).toBe(1500);
    });

    it('rejects missing contactId', async () => {
      const res = await req('POST', '/api/quotes', { date: '2026-03-01', expiryDate: '2026-03-31' });
      expect(res.status).toBe(400);
    });

    it('rejects missing date', async () => {
      const res = await req('POST', '/api/quotes', { contactId, expiryDate: '2026-03-31' });
      expect(res.status).toBe(400);
    });

    it('rejects missing expiryDate', async () => {
      const res = await req('POST', '/api/quotes', { contactId, date: '2026-03-01' });
      expect(res.status).toBe(400);
    });

    it('rejects non-existent contact', async () => {
      const res = await req('POST', '/api/quotes', { contactId: 'no-such-contact', date: '2026-03-01', expiryDate: '2026-03-31' });
      expect(res.status).toBe(400);
    });

    it('creates with zero totals when no line items', async () => {
      const res = await req('POST', '/api/quotes', { contactId, date: '2026-03-01', expiryDate: '2026-03-31' });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.subTotal).toBe(0);
      expect(json.data.total).toBe(0);
    });
  });

  describe('GET /api/quotes', () => {
    it('returns empty list initially', async () => {
      const res = await req('GET', '/api/quotes');
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toHaveLength(0);
    });

    it('returns created quotes', async () => {
      await req('POST', '/api/quotes', { contactId, date: '2026-03-01', expiryDate: '2026-03-31' });
      await req('POST', '/api/quotes', { contactId, date: '2026-04-01', expiryDate: '2026-04-30' });
      const res = await req('GET', '/api/quotes');
      const json = await res.json();
      expect(json.data).toHaveLength(2);
    });
  });

  describe('GET /api/quotes/:id', () => {
    it('returns quote with line items', async () => {
      const createRes = await req('POST', '/api/quotes', {
        contactId, date: '2026-03-01', expiryDate: '2026-03-31',
        lineItems: [{ description: 'Item', quantity: 2, unitPrice: 100 }],
      });
      const { data: created } = await createRes.json();

      const res = await req('GET', `/api/quotes/${created.id}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.id).toBe(created.id);
      expect(json.data.lineItems).toHaveLength(1);
    });

    it('returns 404 for non-existent quote', async () => {
      const res = await req('GET', '/api/quotes/nonexistent');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/quotes/:id', () => {
    it('updates a draft quote', async () => {
      const createRes = await req('POST', '/api/quotes', { contactId, date: '2026-03-01', expiryDate: '2026-03-31' });
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/quotes/${created.id}`, { title: 'Updated Title', reference: 'REF-001' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.title).toBe('Updated Title');
      expect(json.data.reference).toBe('REF-001');
    });

    it('rejects editing a non-draft quote', async () => {
      const createRes = await req('POST', '/api/quotes', { contactId, date: '2026-03-01', expiryDate: '2026-03-31' });
      const { data: created } = await createRes.json();
      // Transition to sent
      await req('PUT', `/api/quotes/${created.id}/status`, { status: 'sent' });

      const res = await req('PUT', `/api/quotes/${created.id}`, { title: 'Nope' });
      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent quote', async () => {
      const res = await req('PUT', '/api/quotes/nonexistent', { title: 'X' });
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/quotes/:id/status', () => {
    it('transitions draft → sent → accepted', async () => {
      const createRes = await req('POST', '/api/quotes', { contactId, date: '2026-03-01', expiryDate: '2026-03-31' });
      const { data: created } = await createRes.json();

      let res = await req('PUT', `/api/quotes/${created.id}/status`, { status: 'sent' });
      expect(res.status).toBe(200);
      let json = await res.json();
      expect(json.data.status).toBe('sent');

      res = await req('PUT', `/api/quotes/${created.id}/status`, { status: 'accepted' });
      expect(res.status).toBe(200);
      json = await res.json();
      expect(json.data.status).toBe('accepted');
    });

    it('rejects invalid transition draft → accepted', async () => {
      const createRes = await req('POST', '/api/quotes', { contactId, date: '2026-03-01', expiryDate: '2026-03-31' });
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/quotes/${created.id}/status`, { status: 'accepted' });
      expect(res.status).toBe(400);
    });

    it('allows declined → draft (re-open)', async () => {
      const createRes = await req('POST', '/api/quotes', { contactId, date: '2026-03-01', expiryDate: '2026-03-31' });
      const { data: created } = await createRes.json();
      await req('PUT', `/api/quotes/${created.id}/status`, { status: 'sent' });
      await req('PUT', `/api/quotes/${created.id}/status`, { status: 'declined' });

      const res = await req('PUT', `/api/quotes/${created.id}/status`, { status: 'draft' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.status).toBe('draft');
    });

    it('rejects invalid status value', async () => {
      const createRes = await req('POST', '/api/quotes', { contactId, date: '2026-03-01', expiryDate: '2026-03-31' });
      const { data: created } = await createRes.json();
      const res = await req('PUT', `/api/quotes/${created.id}/status`, { status: 'bogus' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/quotes/:id/convert', () => {
    it('converts accepted quote to invoice', async () => {
      const createRes = await req('POST', '/api/quotes', {
        contactId, date: '2026-03-01', expiryDate: '2026-03-31',
        lineItems: [{ description: 'Work', quantity: 5, unitPrice: 200 }],
      });
      const { data: created } = await createRes.json();
      await req('PUT', `/api/quotes/${created.id}/status`, { status: 'sent' });
      await req('PUT', `/api/quotes/${created.id}/status`, { status: 'accepted' });

      const res = await req('POST', `/api/quotes/${created.id}/convert`);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.invoiceNumber).toMatch(/^INV-\d{4}$/);
      expect(json.data.contactId).toBe(contactId);
      expect(json.data.total).toBe(created.total);
      expect(json.data.status).toBe('draft');

      // Quote should now be 'invoiced'
      const quoteRes = await req('GET', `/api/quotes/${created.id}`);
      const quoteJson = await quoteRes.json();
      expect(quoteJson.data.status).toBe('invoiced');
      expect(quoteJson.data.convertedInvoiceId).toBe(json.data.id);
    });

    it('rejects converting a non-accepted quote', async () => {
      const createRes = await req('POST', '/api/quotes', { contactId, date: '2026-03-01', expiryDate: '2026-03-31' });
      const { data: created } = await createRes.json();

      const res = await req('POST', `/api/quotes/${created.id}/convert`);
      expect(res.status).toBe(400);
    });

    it('rejects double conversion', async () => {
      const createRes = await req('POST', '/api/quotes', { contactId, date: '2026-03-01', expiryDate: '2026-03-31' });
      const { data: created } = await createRes.json();
      await req('PUT', `/api/quotes/${created.id}/status`, { status: 'sent' });
      await req('PUT', `/api/quotes/${created.id}/status`, { status: 'accepted' });
      await req('POST', `/api/quotes/${created.id}/convert`);

      const res = await req('POST', `/api/quotes/${created.id}/convert`);
      expect(res.status).toBe(400);
    });
  });
});

// ---------------------------------------------------------------------------
// Credit Notes CRUD + Validation
// ---------------------------------------------------------------------------
describe('Credit Notes CRUD + Validation', () => {
  let contactId: string;
  beforeEach(async () => {
    contactId = await seedContact();
  });

  describe('POST /api/credit-notes', () => {
    it('creates a sales credit note with valid data and returns 201', async () => {
      const res = await req('POST', '/api/credit-notes', {
        type: 'sales',
        contactId,
        date: '2026-03-01',
        subTotal: 1000,
        totalTax: 150,
        total: 1150,
      });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.creditNoteNumber).toMatch(/^CN-\d{4}$/);
      expect(json.data.type).toBe('sales');
      expect(json.data.status).toBe('draft');
      expect(json.data.total).toBe(1150);
      expect(json.data.remainingCredit).toBe(1150);
      expect(json.data.contactName).toBe('Acme Corp');
    });

    it('creates a purchase credit note', async () => {
      const res = await req('POST', '/api/credit-notes', {
        type: 'purchase',
        contactId,
        date: '2026-03-01',
        total: 500,
      });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.type).toBe('purchase');
    });

    it('rejects missing type', async () => {
      const res = await req('POST', '/api/credit-notes', { contactId, date: '2026-03-01' });
      expect(res.status).toBe(400);
    });

    it('rejects missing contactId', async () => {
      const res = await req('POST', '/api/credit-notes', { type: 'sales', date: '2026-03-01' });
      expect(res.status).toBe(400);
    });

    it('rejects missing date', async () => {
      const res = await req('POST', '/api/credit-notes', { type: 'sales', contactId });
      expect(res.status).toBe(400);
    });

    it('rejects invalid type', async () => {
      const res = await req('POST', '/api/credit-notes', { type: 'refund', contactId, date: '2026-03-01' });
      expect(res.status).toBe(400);
    });

    it('rejects non-existent contact', async () => {
      const res = await req('POST', '/api/credit-notes', { type: 'sales', contactId: 'ghost', date: '2026-03-01' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/credit-notes', () => {
    it('lists all credit notes', async () => {
      await req('POST', '/api/credit-notes', { type: 'sales', contactId, date: '2026-03-01', total: 100 });
      await req('POST', '/api/credit-notes', { type: 'purchase', contactId, date: '2026-03-02', total: 200 });
      const res = await req('GET', '/api/credit-notes');
      const json = await res.json();
      expect(json.data).toHaveLength(2);
    });
  });

  describe('GET /api/credit-notes/:id', () => {
    it('returns a credit note by ID', async () => {
      const createRes = await req('POST', '/api/credit-notes', { type: 'sales', contactId, date: '2026-03-01', total: 500 });
      const { data: cn } = await createRes.json();
      const res = await req('GET', `/api/credit-notes/${cn.id}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.id).toBe(cn.id);
    });

    it('returns 404 for non-existent', async () => {
      const res = await req('GET', '/api/credit-notes/nonexistent');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/credit-notes/:id/status', () => {
    it('transitions draft → submitted → approved', async () => {
      const createRes = await req('POST', '/api/credit-notes', { type: 'sales', contactId, date: '2026-03-01', total: 500 });
      const { data: cn } = await createRes.json();

      let res = await req('PUT', `/api/credit-notes/${cn.id}/status`, { status: 'submitted' });
      expect(res.status).toBe(200);
      expect((await res.json()).data.status).toBe('submitted');

      res = await req('PUT', `/api/credit-notes/${cn.id}/status`, { status: 'approved' });
      expect(res.status).toBe(200);
      expect((await res.json()).data.status).toBe('approved');
    });

    it('rejects invalid transition draft → approved', async () => {
      const createRes = await req('POST', '/api/credit-notes', { type: 'sales', contactId, date: '2026-03-01', total: 500 });
      const { data: cn } = await createRes.json();
      const res = await req('PUT', `/api/credit-notes/${cn.id}/status`, { status: 'approved' });
      expect(res.status).toBe(400);
    });

    it('allows voiding from draft', async () => {
      const createRes = await req('POST', '/api/credit-notes', { type: 'sales', contactId, date: '2026-03-01', total: 500 });
      const { data: cn } = await createRes.json();
      const res = await req('PUT', `/api/credit-notes/${cn.id}/status`, { status: 'voided' });
      expect(res.status).toBe(200);
      expect((await res.json()).data.status).toBe('voided');
    });

    it('rejects transitions out of voided', async () => {
      const createRes = await req('POST', '/api/credit-notes', { type: 'sales', contactId, date: '2026-03-01', total: 500 });
      const { data: cn } = await createRes.json();
      await req('PUT', `/api/credit-notes/${cn.id}/status`, { status: 'voided' });
      const res = await req('PUT', `/api/credit-notes/${cn.id}/status`, { status: 'draft' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/credit-notes/:id/apply', () => {
    it('applies approved credit note to an invoice', async () => {
      // Create invoice
      const invRes = await req('POST', '/api/invoices', {
        contactId, date: '2026-03-01', dueDate: '2026-03-31',
        lineItems: [{ description: 'Service', quantity: 1, unitPrice: 1000 }],
      });
      const { data: inv } = await invRes.json();

      // Create + approve credit note
      const cnRes = await req('POST', '/api/credit-notes', {
        type: 'sales', contactId, date: '2026-03-01', total: 300,
      });
      const { data: cn } = await cnRes.json();
      await req('PUT', `/api/credit-notes/${cn.id}/status`, { status: 'submitted' });
      await req('PUT', `/api/credit-notes/${cn.id}/status`, { status: 'approved' });

      const res = await req('POST', `/api/credit-notes/${cn.id}/apply`, {
        invoiceId: inv.id,
        amount: 300,
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.remainingCredit).toBe(0);
      expect(json.data.status).toBe('applied');

      // Invoice amountDue should decrease
      const invCheck = await req('GET', `/api/invoices/${inv.id}`);
      const invJson = await invCheck.json();
      expect(invJson.data.amountPaid).toBe(300);
    });

    it('rejects applying non-approved credit note', async () => {
      const cnRes = await req('POST', '/api/credit-notes', { type: 'sales', contactId, date: '2026-03-01', total: 300 });
      const { data: cn } = await cnRes.json();
      const res = await req('POST', `/api/credit-notes/${cn.id}/apply`, { invoiceId: 'whatever', amount: 100 });
      expect(res.status).toBe(400);
    });

    it('rejects amount exceeding remaining credit', async () => {
      const cnRes = await req('POST', '/api/credit-notes', { type: 'sales', contactId, date: '2026-03-01', total: 100 });
      const { data: cn } = await cnRes.json();
      await req('PUT', `/api/credit-notes/${cn.id}/status`, { status: 'submitted' });
      await req('PUT', `/api/credit-notes/${cn.id}/status`, { status: 'approved' });

      const invRes = await req('POST', '/api/invoices', {
        contactId, date: '2026-03-01', dueDate: '2026-03-31',
        lineItems: [{ description: 'X', quantity: 1, unitPrice: 500 }],
      });
      const { data: inv } = await invRes.json();

      const res = await req('POST', `/api/credit-notes/${cn.id}/apply`, { invoiceId: inv.id, amount: 200 });
      expect(res.status).toBe(400);
    });

    it('rejects when neither invoiceId nor billId provided', async () => {
      const cnRes = await req('POST', '/api/credit-notes', { type: 'sales', contactId, date: '2026-03-01', total: 100 });
      const { data: cn } = await cnRes.json();
      await req('PUT', `/api/credit-notes/${cn.id}/status`, { status: 'submitted' });
      await req('PUT', `/api/credit-notes/${cn.id}/status`, { status: 'approved' });

      const res = await req('POST', `/api/credit-notes/${cn.id}/apply`, { amount: 50 });
      expect(res.status).toBe(400);
    });
  });
});

// ---------------------------------------------------------------------------
// Purchase Orders CRUD + Validation
// ---------------------------------------------------------------------------
describe('Purchase Orders CRUD + Validation', () => {
  let contactId: string;
  beforeEach(async () => {
    contactId = await seedContact();
  });

  describe('POST /api/purchase-orders', () => {
    it('creates a PO with valid data and returns 201', async () => {
      const res = await req('POST', '/api/purchase-orders', {
        contactId,
        date: '2026-03-01',
        deliveryDate: '2026-03-15',
        lineItems: [
          { description: 'Office Chairs', quantity: 10, unitPrice: 250, taxRate: 15 },
        ],
      });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.poNumber).toMatch(/^PO-\d{4}$/);
      expect(json.data.status).toBe('draft');
      expect(json.data.contactName).toBe('Acme Corp');
      // 10 * 250 = 2500 subtotal, 375 tax, 2875 total
      expect(json.data.subTotal).toBe(2500);
      expect(json.data.totalTax).toBe(375);
      expect(json.data.total).toBe(2875);
      expect(json.data.lineItems).toHaveLength(1);
    });

    it('rejects missing contactId', async () => {
      const res = await req('POST', '/api/purchase-orders', { date: '2026-03-01' });
      expect(res.status).toBe(400);
    });

    it('rejects missing date', async () => {
      const res = await req('POST', '/api/purchase-orders', { contactId });
      expect(res.status).toBe(400);
    });

    it('rejects non-existent contact', async () => {
      const res = await req('POST', '/api/purchase-orders', { contactId: 'fake', date: '2026-03-01' });
      expect(res.status).toBe(400);
    });

    it('creates PO with zero totals when no line items', async () => {
      const res = await req('POST', '/api/purchase-orders', { contactId, date: '2026-03-01' });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.subTotal).toBe(0);
      expect(json.data.total).toBe(0);
    });
  });

  describe('GET /api/purchase-orders', () => {
    it('returns all POs', async () => {
      await req('POST', '/api/purchase-orders', { contactId, date: '2026-03-01' });
      await req('POST', '/api/purchase-orders', { contactId, date: '2026-04-01' });
      const res = await req('GET', '/api/purchase-orders');
      const json = await res.json();
      expect(json.data).toHaveLength(2);
    });
  });

  describe('GET /api/purchase-orders/:id', () => {
    it('returns PO with line items', async () => {
      const createRes = await req('POST', '/api/purchase-orders', {
        contactId, date: '2026-03-01',
        lineItems: [{ description: 'Stuff', quantity: 1, unitPrice: 100 }],
      });
      const { data: po } = await createRes.json();
      const res = await req('GET', `/api/purchase-orders/${po.id}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.lineItems).toHaveLength(1);
    });

    it('returns 404 for non-existent PO', async () => {
      const res = await req('GET', '/api/purchase-orders/nonexistent');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/purchase-orders/:id', () => {
    it('updates a draft PO', async () => {
      const createRes = await req('POST', '/api/purchase-orders', { contactId, date: '2026-03-01' });
      const { data: po } = await createRes.json();

      const res = await req('PUT', `/api/purchase-orders/${po.id}`, {
        reference: 'REF-PO-001',
        deliveryAddress: '123 Main St',
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.reference).toBe('REF-PO-001');
      expect(json.data.deliveryAddress).toBe('123 Main St');
    });

    it('rejects editing a non-draft PO', async () => {
      const createRes = await req('POST', '/api/purchase-orders', { contactId, date: '2026-03-01' });
      const { data: po } = await createRes.json();
      await req('PUT', `/api/purchase-orders/${po.id}/status`, { status: 'submitted' });

      const res = await req('PUT', `/api/purchase-orders/${po.id}`, { reference: 'Nope' });
      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent PO', async () => {
      const res = await req('PUT', '/api/purchase-orders/nonexistent', { reference: 'X' });
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/purchase-orders/:id/status', () => {
    it('transitions draft → submitted → approved', async () => {
      const createRes = await req('POST', '/api/purchase-orders', { contactId, date: '2026-03-01' });
      const { data: po } = await createRes.json();

      let res = await req('PUT', `/api/purchase-orders/${po.id}/status`, { status: 'submitted' });
      expect(res.status).toBe(200);
      expect((await res.json()).data.status).toBe('submitted');

      res = await req('PUT', `/api/purchase-orders/${po.id}/status`, { status: 'approved' });
      expect(res.status).toBe(200);
      expect((await res.json()).data.status).toBe('approved');
    });

    it('rejects invalid transition draft → approved', async () => {
      const createRes = await req('POST', '/api/purchase-orders', { contactId, date: '2026-03-01' });
      const { data: po } = await createRes.json();
      const res = await req('PUT', `/api/purchase-orders/${po.id}/status`, { status: 'approved' });
      expect(res.status).toBe(400);
    });

    it('allows submitted → draft (reject back)', async () => {
      const createRes = await req('POST', '/api/purchase-orders', { contactId, date: '2026-03-01' });
      const { data: po } = await createRes.json();
      await req('PUT', `/api/purchase-orders/${po.id}/status`, { status: 'submitted' });

      const res = await req('PUT', `/api/purchase-orders/${po.id}/status`, { status: 'draft' });
      expect(res.status).toBe(200);
      expect((await res.json()).data.status).toBe('draft');
    });
  });

  describe('PUT /api/purchase-orders/:id/approve & reject', () => {
    it('approves a submitted PO', async () => {
      const createRes = await req('POST', '/api/purchase-orders', { contactId, date: '2026-03-01' });
      const { data: po } = await createRes.json();
      await req('PUT', `/api/purchase-orders/${po.id}/status`, { status: 'submitted' });

      const res = await req('PUT', `/api/purchase-orders/${po.id}/approve`);
      expect(res.status).toBe(200);
      expect((await res.json()).data.status).toBe('approved');
    });

    it('rejects approving a non-submitted PO', async () => {
      const createRes = await req('POST', '/api/purchase-orders', { contactId, date: '2026-03-01' });
      const { data: po } = await createRes.json();
      const res = await req('PUT', `/api/purchase-orders/${po.id}/approve`);
      expect(res.status).toBe(400);
    });

    it('rejects a submitted PO back to draft', async () => {
      const createRes = await req('POST', '/api/purchase-orders', { contactId, date: '2026-03-01' });
      const { data: po } = await createRes.json();
      await req('PUT', `/api/purchase-orders/${po.id}/status`, { status: 'submitted' });

      const res = await req('PUT', `/api/purchase-orders/${po.id}/reject`);
      expect(res.status).toBe(200);
      expect((await res.json()).data.status).toBe('draft');
    });
  });

  describe('POST /api/purchase-orders/:id/convert', () => {
    it('converts an approved PO to a bill', async () => {
      const createRes = await req('POST', '/api/purchase-orders', {
        contactId, date: '2026-03-01',
        lineItems: [{ description: 'Supplies', quantity: 5, unitPrice: 100 }],
      });
      const { data: po } = await createRes.json();
      await req('PUT', `/api/purchase-orders/${po.id}/status`, { status: 'submitted' });
      await req('PUT', `/api/purchase-orders/${po.id}/status`, { status: 'approved' });

      const res = await req('POST', `/api/purchase-orders/${po.id}/convert`);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.billNumber).toMatch(/^BILL-\d{4}$/);
      expect(json.data.contactId).toBe(contactId);
      expect(json.data.total).toBe(po.total);
      expect(json.data.status).toBe('draft');

      // PO should now be 'billed'
      const poCheck = await req('GET', `/api/purchase-orders/${po.id}`);
      const poJson = await poCheck.json();
      expect(poJson.data.status).toBe('billed');
      expect(poJson.data.convertedBillId).toBe(json.data.id);
    });

    it('rejects converting a non-approved PO', async () => {
      const createRes = await req('POST', '/api/purchase-orders', { contactId, date: '2026-03-01' });
      const { data: po } = await createRes.json();
      const res = await req('POST', `/api/purchase-orders/${po.id}/convert`);
      expect(res.status).toBe(400);
    });

    it('rejects double conversion', async () => {
      const createRes = await req('POST', '/api/purchase-orders', { contactId, date: '2026-03-01' });
      const { data: po } = await createRes.json();
      await req('PUT', `/api/purchase-orders/${po.id}/status`, { status: 'submitted' });
      await req('PUT', `/api/purchase-orders/${po.id}/status`, { status: 'approved' });
      await req('POST', `/api/purchase-orders/${po.id}/convert`);

      const res = await req('POST', `/api/purchase-orders/${po.id}/convert`);
      expect(res.status).toBe(400);
    });
  });
});

// ---------------------------------------------------------------------------
// Recurring Invoices CRUD + Validation
// ---------------------------------------------------------------------------
describe('Recurring Invoices CRUD + Validation', () => {
  let contactId: string;
  beforeEach(async () => {
    contactId = await seedContact();
  });

  describe('POST /api/recurring-invoices', () => {
    it('creates a recurring invoice with valid data and returns 201', async () => {
      const res = await req('POST', '/api/recurring-invoices', {
        templateName: 'Monthly Retainer',
        contactId,
        frequency: 'monthly',
        nextDate: '2026-04-01',
        daysUntilDue: 14,
        subTotal: 2000,
        totalTax: 300,
        total: 2300,
      });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.templateName).toBe('Monthly Retainer');
      expect(json.data.frequency).toBe('monthly');
      expect(json.data.status).toBe('active');
      expect(json.data.timesGenerated).toBe(0);
      expect(json.data.daysUntilDue).toBe(14);
      expect(json.data.contactName).toBe('Acme Corp');
      expect(json.data.total).toBe(2300);
    });

    it('rejects missing templateName', async () => {
      const res = await req('POST', '/api/recurring-invoices', { contactId, frequency: 'monthly', nextDate: '2026-04-01' });
      expect(res.status).toBe(400);
    });

    it('rejects missing contactId', async () => {
      const res = await req('POST', '/api/recurring-invoices', { templateName: 'X', frequency: 'monthly', nextDate: '2026-04-01' });
      expect(res.status).toBe(400);
    });

    it('rejects missing frequency', async () => {
      const res = await req('POST', '/api/recurring-invoices', { templateName: 'X', contactId, nextDate: '2026-04-01' });
      expect(res.status).toBe(400);
    });

    it('rejects missing nextDate', async () => {
      const res = await req('POST', '/api/recurring-invoices', { templateName: 'X', contactId, frequency: 'monthly' });
      expect(res.status).toBe(400);
    });

    it('rejects invalid frequency', async () => {
      const res = await req('POST', '/api/recurring-invoices', {
        templateName: 'X', contactId, frequency: 'daily', nextDate: '2026-04-01',
      });
      expect(res.status).toBe(400);
    });

    it('rejects non-existent contact', async () => {
      const res = await req('POST', '/api/recurring-invoices', {
        templateName: 'X', contactId: 'ghost', frequency: 'monthly', nextDate: '2026-04-01',
      });
      expect(res.status).toBe(400);
    });

    it('defaults daysUntilDue to 30', async () => {
      const res = await req('POST', '/api/recurring-invoices', {
        templateName: 'Default Due', contactId, frequency: 'weekly', nextDate: '2026-04-01',
      });
      const json = await res.json();
      expect(json.data.daysUntilDue).toBe(30);
    });
  });

  describe('GET /api/recurring-invoices', () => {
    it('lists all recurring invoices', async () => {
      await req('POST', '/api/recurring-invoices', { templateName: 'A', contactId, frequency: 'monthly', nextDate: '2026-04-01' });
      await req('POST', '/api/recurring-invoices', { templateName: 'B', contactId, frequency: 'weekly', nextDate: '2026-04-01' });
      const res = await req('GET', '/api/recurring-invoices');
      const json = await res.json();
      expect(json.data).toHaveLength(2);
    });
  });

  describe('GET /api/recurring-invoices/:id', () => {
    it('returns a recurring invoice by ID', async () => {
      const createRes = await req('POST', '/api/recurring-invoices', {
        templateName: 'Get Me', contactId, frequency: 'quarterly', nextDate: '2026-04-01',
      });
      const { data: ri } = await createRes.json();
      const res = await req('GET', `/api/recurring-invoices/${ri.id}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.templateName).toBe('Get Me');
    });

    it('returns 404 for non-existent', async () => {
      const res = await req('GET', '/api/recurring-invoices/nonexistent');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/recurring-invoices/:id', () => {
    it('updates recurring invoice fields', async () => {
      const createRes = await req('POST', '/api/recurring-invoices', {
        templateName: 'Old Name', contactId, frequency: 'monthly', nextDate: '2026-04-01',
      });
      const { data: ri } = await createRes.json();

      const res = await req('PUT', `/api/recurring-invoices/${ri.id}`, {
        templateName: 'New Name',
        frequency: 'quarterly',
        daysUntilDue: 7,
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.templateName).toBe('New Name');
      expect(json.data.frequency).toBe('quarterly');
      expect(json.data.daysUntilDue).toBe(7);
    });

    it('can pause a recurring invoice', async () => {
      const createRes = await req('POST', '/api/recurring-invoices', {
        templateName: 'Pause Me', contactId, frequency: 'monthly', nextDate: '2026-04-01',
      });
      const { data: ri } = await createRes.json();

      const res = await req('PUT', `/api/recurring-invoices/${ri.id}`, { status: 'paused' });
      expect(res.status).toBe(200);
      expect((await res.json()).data.status).toBe('paused');
    });

    it('returns 404 for non-existent', async () => {
      const res = await req('PUT', '/api/recurring-invoices/nonexistent', { templateName: 'X' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/recurring-invoices/:id', () => {
    it('deletes a recurring invoice', async () => {
      const createRes = await req('POST', '/api/recurring-invoices', {
        templateName: 'Delete Me', contactId, frequency: 'monthly', nextDate: '2026-04-01',
      });
      const { data: ri } = await createRes.json();

      const res = await req('DELETE', `/api/recurring-invoices/${ri.id}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.id).toBe(ri.id);

      // Verify gone
      const getRes = await req('GET', `/api/recurring-invoices/${ri.id}`);
      expect(getRes.status).toBe(404);
    });

    it('returns 404 for non-existent', async () => {
      const res = await req('DELETE', '/api/recurring-invoices/nonexistent');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/recurring-invoices/:id/generate', () => {
    it('generates an invoice from active recurring template', async () => {
      const createRes = await req('POST', '/api/recurring-invoices', {
        templateName: 'Monthly Billing',
        contactId,
        frequency: 'monthly',
        nextDate: '2026-03-01',
        total: 1500,
        subTotal: 1304.35,
        totalTax: 195.65,
      });
      const { data: ri } = await createRes.json();

      const res = await req('POST', `/api/recurring-invoices/${ri.id}/generate`);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.invoiceNumber).toMatch(/^INV-\d{4}$/);
      expect(json.data.contactId).toBe(contactId);
      expect(json.data.total).toBe(1500);
      expect(json.data.status).toBe('draft');
      expect(json.data.date).toBe('2026-03-01');

      // Template should advance nextDate and increment timesGenerated
      const riCheck = await req('GET', `/api/recurring-invoices/${ri.id}`);
      const riJson = await riCheck.json();
      expect(riJson.data.nextDate).toBe('2026-04-01');
      expect(riJson.data.timesGenerated).toBe(1);
    });

    it('rejects generating from paused template', async () => {
      const createRes = await req('POST', '/api/recurring-invoices', {
        templateName: 'Paused', contactId, frequency: 'monthly', nextDate: '2026-03-01',
      });
      const { data: ri } = await createRes.json();
      await req('PUT', `/api/recurring-invoices/${ri.id}`, { status: 'paused' });

      const res = await req('POST', `/api/recurring-invoices/${ri.id}/generate`);
      expect(res.status).toBe(400);
    });

    it('marks template completed when end date reached', async () => {
      const createRes = await req('POST', '/api/recurring-invoices', {
        templateName: 'Ending',
        contactId,
        frequency: 'monthly',
        nextDate: '2026-03-01',
        endDate: '2026-03-15',
        total: 100,
      });
      const { data: ri } = await createRes.json();

      const res = await req('POST', `/api/recurring-invoices/${ri.id}/generate`);
      expect(res.status).toBe(201);

      // Next date would be April 1, which is past endDate March 15 → completed
      const riCheck = await req('GET', `/api/recurring-invoices/${ri.id}`);
      const riJson = await riCheck.json();
      expect(riJson.data.status).toBe('completed');
    });

    it('returns 404 for non-existent', async () => {
      const res = await req('POST', '/api/recurring-invoices/nonexistent/generate');
      expect(res.status).toBe(404);
    });
  });
});
