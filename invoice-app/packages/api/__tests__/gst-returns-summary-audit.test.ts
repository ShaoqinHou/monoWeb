import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { createApp } from '../src/app';
import { createTestDb } from '../src/db/test-helpers';
import { invoices } from '../src/db/schema';
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

async function createSupplier(name = 'Test Supplier'): Promise<string> {
  const res = await req('POST', '/api/contacts', { name, type: 'supplier' });
  return (await res.json()).data.id;
}

describe('GST Returns — Summary endpoint', () => {
  it('returns zeros when no GST returns exist', async () => {
    const res = await req('GET', '/api/gst-returns/summary');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data).toEqual({
      taxCollected: 0,
      taxPaid: 0,
      netGSTPayable: 0,
      periodCount: 0,
    });
  });

  it('computes totals from all GST returns', async () => {
    const customerId = await createContact('Cust A');
    const supplierId = await createSupplier('Sup A');

    // Create invoices and bills then GST returns
    await req('POST', '/api/invoices', {
      contactId: customerId,
      date: '2026-01-15',
      dueDate: '2026-12-31',
      lineItems: [{ description: 'Svc', quantity: 1, unitPrice: 1000, taxRate: 15 }],
    });
    await req('POST', '/api/bills', {
      contactId: supplierId,
      date: '2026-01-20',
      dueDate: '2026-12-31',
      lineItems: [{ description: 'Sup', quantity: 1, unitPrice: 500, taxRate: 15 }],
    });

    await req('POST', '/api/gst-returns', {
      period: 'Jan-Feb 2026',
      startDate: '2026-01-01',
      endDate: '2026-02-28',
      dueDate: '2026-03-28',
    });

    // Create a second return with no data
    await req('POST', '/api/gst-returns', {
      period: 'Mar-Apr 2026',
      startDate: '2026-03-01',
      endDate: '2026-04-30',
      dueDate: '2026-05-28',
    });

    const res = await req('GET', '/api/gst-returns/summary');
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.periodCount).toBe(2);
    // First return: gstCollected=150, gstPaid=75; Second: 0/0
    expect(body.data.taxCollected).toBe(150);
    expect(body.data.taxPaid).toBe(75);
    expect(body.data.netGSTPayable).toBe(75);
  });
});

describe('GST Returns — Audit Transactions endpoint', () => {
  it('returns 400 when dateFrom/dateTo missing', async () => {
    const res = await req('GET', '/api/gst-returns/audit-transactions');
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain('dateFrom');
  });

  it('returns empty array when no invoices/bills in period', async () => {
    const res = await req('GET', '/api/gst-returns/audit-transactions?dateFrom=2030-01-01&dateTo=2030-12-31');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data).toEqual([]);
  });

  it('returns invoice line items as audit transactions', async () => {
    const customerId = await createContact('Customer Audit');
    await req('POST', '/api/invoices', {
      contactId: customerId,
      date: '2026-02-10',
      dueDate: '2026-03-10',
      lineItems: [
        { description: 'Service A', quantity: 2, unitPrice: 500, taxRate: 15, accountCode: '200' },
      ],
    });

    const res = await req('GET', '/api/gst-returns/audit-transactions?dateFrom=2026-02-01&dateTo=2026-02-28');
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.length).toBe(1);

    const tx = body.data[0];
    expect(tx.type).toBe('Invoice');
    expect(tx.contact).toBe('Customer Audit');
    expect(tx.taxRate).toBe('15%');
    expect(tx.account).toBe('200');
    expect(tx.taxAmount).toBeGreaterThan(0);
  });

  it('returns bill line items as audit transactions', async () => {
    const supplierId = await createSupplier('Supplier Audit');
    await req('POST', '/api/bills', {
      contactId: supplierId,
      date: '2026-02-15',
      dueDate: '2026-03-15',
      lineItems: [
        { description: 'Supplies', quantity: 1, unitPrice: 800, taxRate: 15 },
      ],
    });

    const res = await req('GET', '/api/gst-returns/audit-transactions?dateFrom=2026-02-01&dateTo=2026-02-28');
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.length).toBe(1);
    expect(body.data[0].type).toBe('Bill');
    expect(body.data[0].contact).toBe('Supplier Audit');
  });

  it('filters by taxRate query param', async () => {
    const customerId = await createContact('Multi Tax Cust');
    await req('POST', '/api/invoices', {
      contactId: customerId,
      date: '2026-02-10',
      dueDate: '2026-03-10',
      lineItems: [
        { description: 'Taxed', quantity: 1, unitPrice: 1000, taxRate: 15 },
        { description: 'Zero', quantity: 1, unitPrice: 500, taxRate: 0 },
      ],
    });

    const res = await req('GET', '/api/gst-returns/audit-transactions?dateFrom=2026-02-01&dateTo=2026-02-28&taxRate=0%25');
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.length).toBe(1);
    expect(body.data[0].taxRate).toBe('0%');
  });

  it('excludes voided invoices', async () => {
    const customerId = await createContact('Void Test');
    const createRes = await req('POST', '/api/invoices', {
      contactId: customerId,
      date: '2026-02-10',
      dueDate: '2026-03-10',
      lineItems: [{ description: 'Svc', quantity: 1, unitPrice: 1000, taxRate: 15 }],
    });
    const invoiceId = (await createRes.json()).data.id;

    // Void the invoice directly in the DB (API only allows editing drafts)
    await db.update(invoices).set({ status: 'voided' }).where(eq(invoices.id, invoiceId));

    const res = await req('GET', '/api/gst-returns/audit-transactions?dateFrom=2026-02-01&dateTo=2026-02-28');
    const body = await res.json();
    expect(body.data.length).toBe(0);
  });

  it('returns transactions sorted by date', async () => {
    const customerId = await createContact('Date Sort');
    await req('POST', '/api/invoices', {
      contactId: customerId,
      date: '2026-02-20',
      dueDate: '2026-03-20',
      lineItems: [{ description: 'Late', quantity: 1, unitPrice: 100, taxRate: 15 }],
    });
    await req('POST', '/api/invoices', {
      contactId: customerId,
      date: '2026-02-05',
      dueDate: '2026-03-05',
      lineItems: [{ description: 'Early', quantity: 1, unitPrice: 100, taxRate: 15 }],
    });

    const res = await req('GET', '/api/gst-returns/audit-transactions?dateFrom=2026-02-01&dateTo=2026-02-28');
    const body = await res.json();
    expect(body.data.length).toBe(2);
    expect(body.data[0].date).toBe('2026-02-05');
    expect(body.data[1].date).toBe('2026-02-20');
  });
});
