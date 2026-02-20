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

async function createContact(name = 'Customer'): Promise<string> {
  const res = await req('POST', '/api/contacts', { name, type: 'customer' });
  const json = await res.json();
  return json.data.id;
}

async function createApprovedInvoice(contactId: string): Promise<{ id: string; total: number }> {
  const createRes = await req('POST', '/api/invoices', {
    contactId,
    date: '2026-01-15',
    dueDate: '2026-02-15',
    lineItems: [{ description: 'Service', quantity: 1, unitPrice: 1000, taxRate: 15, discount: 0 }],
  });
  const { data } = await createRes.json();
  // draft -> submitted -> approved
  await req('PUT', `/api/invoices/${data.id}/status`, { status: 'submitted' });
  await req('PUT', `/api/invoices/${data.id}/status`, { status: 'approved' });
  return { id: data.id, total: data.total };
}

async function createApprovedBill(contactId: string): Promise<{ id: string; total: number }> {
  const createRes = await req('POST', '/api/bills', {
    contactId,
    date: '2026-01-20',
    dueDate: '2026-02-20',
    lineItems: [{ description: 'Supplies', quantity: 1, unitPrice: 500, taxRate: 15, discount: 0 }],
  });
  const { data } = await createRes.json();
  await req('PUT', `/api/bills/${data.id}/status`, { status: 'submitted' });
  await req('PUT', `/api/bills/${data.id}/status`, { status: 'approved' });
  return { id: data.id, total: data.total };
}

describe('Payments API', () => {
  describe('POST /api/payments (invoice)', () => {
    it('records partial payment on approved invoice', async () => {
      const contactId = await createContact();
      const invoice = await createApprovedInvoice(contactId);
      // total = 1150 (1000 + 15% GST)

      const res = await req('POST', '/api/payments', {
        invoiceId: invoice.id,
        amount: 500,
        date: '2026-02-01',
        reference: 'CHQ-001',
      });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.amount).toBe(500);
      expect(json.data.invoiceId).toBe(invoice.id);

      // Verify invoice updated
      const invRes = await req('GET', `/api/invoices/${invoice.id}`);
      const invJson = await invRes.json();
      expect(invJson.data.amountPaid).toBe(500);
      expect(invJson.data.amountDue).toBe(650);
      expect(invJson.data.status).toBe('approved'); // not yet paid
    });

    it('full payment transitions invoice to paid', async () => {
      const contactId = await createContact();
      const invoice = await createApprovedInvoice(contactId);

      const res = await req('POST', '/api/payments', {
        invoiceId: invoice.id,
        amount: 1150,
        date: '2026-02-01',
      });
      expect(res.status).toBe(201);

      const invRes = await req('GET', `/api/invoices/${invoice.id}`);
      const invJson = await invRes.json();
      expect(invJson.data.amountPaid).toBe(1150);
      expect(invJson.data.amountDue).toBe(0);
      expect(invJson.data.status).toBe('paid');
    });

    it('rejects payment on draft invoice', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/invoices', {
        contactId,
        date: '2026-01-15',
        dueDate: '2026-02-15',
        lineItems: [{ description: 'X', quantity: 1, unitPrice: 100, taxRate: 15, discount: 0 }],
      });
      const { data } = await createRes.json();

      const res = await req('POST', '/api/payments', {
        invoiceId: data.id,
        amount: 50,
        date: '2026-02-01',
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('approved');
    });

    it('rejects payment exceeding amount due', async () => {
      const contactId = await createContact();
      const invoice = await createApprovedInvoice(contactId);

      const res = await req('POST', '/api/payments', {
        invoiceId: invoice.id,
        amount: 9999,
        date: '2026-02-01',
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('exceeds');
    });

    it('rejects payment for non-existent invoice', async () => {
      const res = await req('POST', '/api/payments', {
        invoiceId: '00000000-0000-0000-0000-000000000000',
        amount: 100,
        date: '2026-02-01',
      });
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/payments (bill)', () => {
    it('records payment on approved bill', async () => {
      const contactId = await createContact('Vendor');
      const bill = await createApprovedBill(contactId);
      // total = 575 (500 + 15% GST)

      const res = await req('POST', '/api/payments', {
        billId: bill.id,
        amount: 575,
        date: '2026-02-01',
      });
      expect(res.status).toBe(201);

      const billRes = await req('GET', `/api/bills/${bill.id}`);
      const billJson = await billRes.json();
      expect(billJson.data.amountPaid).toBe(575);
      expect(billJson.data.amountDue).toBe(0);
      expect(billJson.data.status).toBe('paid');
    });

    it('rejects payment on draft bill', async () => {
      const contactId = await createContact('Vendor');
      const createRes = await req('POST', '/api/bills', {
        contactId,
        date: '2026-01-20',
        dueDate: '2026-02-20',
        lineItems: [{ description: 'X', quantity: 1, unitPrice: 100, taxRate: 15, discount: 0 }],
      });
      const { data } = await createRes.json();

      const res = await req('POST', '/api/payments', {
        billId: data.id,
        amount: 50,
        date: '2026-02-01',
      });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/payments (validation)', () => {
    it('rejects payment with no invoice or bill', async () => {
      const res = await req('POST', '/api/payments', {
        amount: 100,
        date: '2026-02-01',
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('linked');
    });

    it('rejects payment with zero amount', async () => {
      const contactId = await createContact();
      const invoice = await createApprovedInvoice(contactId);
      const res = await req('POST', '/api/payments', {
        invoiceId: invoice.id,
        amount: 0,
        date: '2026-02-01',
      });
      expect(res.status).toBe(400);
    });

    it('rejects payment with negative amount', async () => {
      const contactId = await createContact();
      const invoice = await createApprovedInvoice(contactId);
      const res = await req('POST', '/api/payments', {
        invoiceId: invoice.id,
        amount: -100,
        date: '2026-02-01',
      });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/payments', () => {
    it('returns all payments', async () => {
      const contactId = await createContact();
      const invoice = await createApprovedInvoice(contactId);

      await req('POST', '/api/payments', { invoiceId: invoice.id, amount: 100, date: '2026-02-01' });
      await req('POST', '/api/payments', { invoiceId: invoice.id, amount: 200, date: '2026-02-02' });

      const res = await req('GET', '/api/payments');
      const json = await res.json();
      expect(json.data).toHaveLength(2);
    });

    it('filters payments by invoiceId', async () => {
      const contactId = await createContact();
      const inv1 = await createApprovedInvoice(contactId);
      const inv2 = await createApprovedInvoice(contactId);

      await req('POST', '/api/payments', { invoiceId: inv1.id, amount: 100, date: '2026-02-01' });
      await req('POST', '/api/payments', { invoiceId: inv2.id, amount: 200, date: '2026-02-02' });

      const res = await req('GET', `/api/payments?invoiceId=${inv1.id}`);
      const json = await res.json();
      expect(json.data).toHaveLength(1);
      expect(json.data[0].invoiceId).toBe(inv1.id);
    });

    it('filters payments by billId', async () => {
      const contactId = await createContact('Vendor');
      const bill = await createApprovedBill(contactId);

      await req('POST', '/api/payments', { billId: bill.id, amount: 100, date: '2026-02-01' });

      const res = await req('GET', `/api/payments?billId=${bill.id}`);
      const json = await res.json();
      expect(json.data).toHaveLength(1);
      expect(json.data[0].billId).toBe(bill.id);
    });

    it('returns empty array when no payments', async () => {
      const res = await req('GET', '/api/payments');
      const json = await res.json();
      expect(json.data).toEqual([]);
    });
  });

  describe('Multiple partial payments', () => {
    it('handles multiple partial payments summing to full amount', async () => {
      const contactId = await createContact();
      const invoice = await createApprovedInvoice(contactId);
      // total = 1150

      await req('POST', '/api/payments', { invoiceId: invoice.id, amount: 400, date: '2026-02-01' });
      await req('POST', '/api/payments', { invoiceId: invoice.id, amount: 400, date: '2026-02-10' });
      await req('POST', '/api/payments', { invoiceId: invoice.id, amount: 350, date: '2026-02-15' });

      const invRes = await req('GET', `/api/invoices/${invoice.id}`);
      const invJson = await invRes.json();
      expect(invJson.data.amountPaid).toBe(1150);
      expect(invJson.data.amountDue).toBe(0);
      expect(invJson.data.status).toBe('paid');

      // Verify all 3 payments recorded
      const payRes = await req('GET', `/api/payments?invoiceId=${invoice.id}`);
      const payJson = await payRes.json();
      expect(payJson.data).toHaveLength(3);
    });
  });
});
