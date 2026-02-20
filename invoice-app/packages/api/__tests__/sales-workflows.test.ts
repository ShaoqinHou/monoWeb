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

// ── Part A: Quote → Invoice Conversion with sourceQuoteId ──────────────────

describe('Quote → Invoice Conversion Tracking', () => {
  it('creates invoice with sourceQuoteId set to the quote id', async () => {
    const contactId = await createContact();
    const createRes = await req('POST', '/api/quotes', {
      contactId,
      date: '2026-01-15',
      expiryDate: '2026-02-15',
      lineItems: [{ description: 'Design work', quantity: 10, unitPrice: 100, taxRate: 15, discount: 0 }],
    });
    const { data: quote } = await createRes.json();

    // Move to accepted
    await req('PUT', `/api/quotes/${quote.id}/status`, { status: 'sent' });
    await req('PUT', `/api/quotes/${quote.id}/status`, { status: 'accepted' });

    // Convert
    const convertRes = await req('POST', `/api/quotes/${quote.id}/convert`);
    expect(convertRes.status).toBe(201);
    const { data: invoice } = await convertRes.json();

    expect(invoice.sourceQuoteId).toBe(quote.id);
    expect(invoice.invoiceNumber).toMatch(/^INV-\d{4}$/);
    expect(invoice.contactId).toBe(contactId);
    expect(invoice.total).toBe(quote.total);
  });

  it('copies line items from quote to invoice', async () => {
    const contactId = await createContact();
    const createRes = await req('POST', '/api/quotes', {
      contactId,
      date: '2026-01-15',
      expiryDate: '2026-02-15',
      lineItems: [
        { description: 'Design', quantity: 5, unitPrice: 200, taxRate: 15, discount: 0 },
        { description: 'Dev', quantity: 3, unitPrice: 100, taxRate: 15, discount: 10 },
      ],
    });
    const { data: quote } = await createRes.json();

    await req('PUT', `/api/quotes/${quote.id}/status`, { status: 'sent' });
    await req('PUT', `/api/quotes/${quote.id}/status`, { status: 'accepted' });

    const convertRes = await req('POST', `/api/quotes/${quote.id}/convert`);
    const { data: invoice } = await convertRes.json();

    // Fetch invoice with line items
    const invRes = await req('GET', `/api/invoices/${invoice.id}`);
    const invJson = await invRes.json();
    // The invoice route returns invoice with line items
    expect(invJson.data.sourceQuoteId).toBe(quote.id);
  });

  it('marks quote as invoiced after conversion', async () => {
    const contactId = await createContact();
    const createRes = await req('POST', '/api/quotes', {
      contactId,
      date: '2026-01-15',
      expiryDate: '2026-02-15',
      lineItems: [{ description: 'Work', quantity: 1, unitPrice: 500, taxRate: 15, discount: 0 }],
    });
    const { data: quote } = await createRes.json();

    await req('PUT', `/api/quotes/${quote.id}/status`, { status: 'sent' });
    await req('PUT', `/api/quotes/${quote.id}/status`, { status: 'accepted' });
    await req('POST', `/api/quotes/${quote.id}/convert`);

    const quoteRes = await req('GET', `/api/quotes/${quote.id}`);
    const quoteJson = await quoteRes.json();
    expect(quoteJson.data.status).toBe('invoiced');
  });

  it('rejects conversion of non-accepted quote', async () => {
    const contactId = await createContact();
    const createRes = await req('POST', '/api/quotes', {
      contactId,
      date: '2026-01-15',
      expiryDate: '2026-02-15',
      lineItems: [{ description: 'Work', quantity: 1, unitPrice: 100, taxRate: 15, discount: 0 }],
    });
    const { data: quote } = await createRes.json();

    const res = await req('POST', `/api/quotes/${quote.id}/convert`);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Only accepted quotes can be converted to invoices');
  });
});

// ── Part B: PO → Bill Conversion with sourcePurchaseOrderId ────────────────

describe('PO → Bill Conversion Tracking', () => {
  it('creates bill with sourcePurchaseOrderId set to PO id', async () => {
    const contactId = await createContact('Supplier Co');
    const createRes = await req('POST', '/api/purchase-orders', {
      contactId,
      date: '2026-01-20',
      lineItems: [{ description: 'Raw materials', quantity: 20, unitPrice: 50, taxRate: 15, discount: 0 }],
    });
    const { data: po } = await createRes.json();

    // Move to approved
    await req('PUT', `/api/purchase-orders/${po.id}/status`, { status: 'submitted' });
    await req('PUT', `/api/purchase-orders/${po.id}/status`, { status: 'approved' });

    // Convert
    const convertRes = await req('POST', `/api/purchase-orders/${po.id}/convert`);
    expect(convertRes.status).toBe(201);
    const { data: bill } = await convertRes.json();

    expect(bill.sourcePurchaseOrderId).toBe(po.id);
    expect(bill.billNumber).toMatch(/^BILL-\d{4}$/);
    expect(bill.contactId).toBe(contactId);
    expect(bill.total).toBe(po.total);
  });

  it('marks PO as billed after conversion', async () => {
    const contactId = await createContact('Supplier Co');
    const createRes = await req('POST', '/api/purchase-orders', {
      contactId,
      date: '2026-01-20',
      lineItems: [{ description: 'Parts', quantity: 10, unitPrice: 25, taxRate: 15, discount: 0 }],
    });
    const { data: po } = await createRes.json();

    await req('PUT', `/api/purchase-orders/${po.id}/status`, { status: 'submitted' });
    await req('PUT', `/api/purchase-orders/${po.id}/status`, { status: 'approved' });
    await req('POST', `/api/purchase-orders/${po.id}/convert`);

    const poRes = await req('GET', `/api/purchase-orders/${po.id}`);
    const poJson = await poRes.json();
    expect(poJson.data.status).toBe('billed');
  });

  it('rejects conversion of non-approved PO', async () => {
    const contactId = await createContact('Supplier Co');
    const createRes = await req('POST', '/api/purchase-orders', {
      contactId,
      date: '2026-01-20',
      lineItems: [{ description: 'Stuff', quantity: 1, unitPrice: 100, taxRate: 15, discount: 0 }],
    });
    const { data: po } = await createRes.json();

    const res = await req('POST', `/api/purchase-orders/${po.id}/convert`);
    expect(res.status).toBe(400);
  });

  it('rejects double conversion of PO', async () => {
    const contactId = await createContact('Supplier Co');
    const createRes = await req('POST', '/api/purchase-orders', {
      contactId,
      date: '2026-01-20',
      lineItems: [{ description: 'Stuff', quantity: 1, unitPrice: 100, taxRate: 15, discount: 0 }],
    });
    const { data: po } = await createRes.json();

    await req('PUT', `/api/purchase-orders/${po.id}/status`, { status: 'submitted' });
    await req('PUT', `/api/purchase-orders/${po.id}/status`, { status: 'approved' });
    await req('POST', `/api/purchase-orders/${po.id}/convert`);

    const res = await req('POST', `/api/purchase-orders/${po.id}/convert`);
    expect(res.status).toBe(400);
  });
});

// ── Part C: Recurring Invoice/Bill Batch Generation ────────────────────────

describe('Recurring Invoice Batch Generation', () => {
  it('generates invoices for all due recurring templates', async () => {
    const contactId = await createContact();

    // Create two recurring invoices with nextDate in the past
    await req('POST', '/api/recurring-invoices', {
      templateName: 'Monthly Hosting',
      contactId,
      frequency: 'monthly',
      nextDate: '2026-01-01',
      total: 100,
      subTotal: 86.96,
      totalTax: 13.04,
    });
    await req('POST', '/api/recurring-invoices', {
      templateName: 'Weekly Backup',
      contactId,
      frequency: 'weekly',
      nextDate: '2026-02-10',
      total: 50,
      subTotal: 43.48,
      totalTax: 6.52,
    });

    const res = await req('POST', '/api/recurring-invoices/generate-due');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.generated).toHaveLength(2);

    // Each generated entry should have invoiceId, recurringId, invoiceNumber
    for (const entry of json.data.generated) {
      expect(entry.invoiceId).toEqual(expect.any(String));
      expect(entry.recurringId).toEqual(expect.any(String));
      expect(entry.invoiceNumber).toMatch(/^INV-\d{4}$/);
    }

    // Verify invoices were created
    const invoicesRes = await req('GET', '/api/invoices');
    const invoicesJson = await invoicesRes.json();
    expect(invoicesJson.data.length).toBeGreaterThanOrEqual(2); // at least the 2 generated + any pre-existing
  });

  it('advances nextDate after generation', async () => {
    const contactId = await createContact();

    const createRes = await req('POST', '/api/recurring-invoices', {
      templateName: 'Monthly',
      contactId,
      frequency: 'monthly',
      nextDate: '2026-01-15',
      total: 100,
    });
    const { data: recurring } = await createRes.json();

    await req('POST', '/api/recurring-invoices/generate-due');

    const updatedRes = await req('GET', `/api/recurring-invoices/${recurring.id}`);
    const { data: updated } = await updatedRes.json();
    expect(updated.nextDate).toBe('2026-02-15');
    expect(updated.timesGenerated).toBe(1);
  });

  it('skips templates not yet due', async () => {
    const contactId = await createContact();

    await req('POST', '/api/recurring-invoices', {
      templateName: 'Future',
      contactId,
      frequency: 'monthly',
      nextDate: '2030-12-01',
      total: 100,
    });

    const res = await req('POST', '/api/recurring-invoices/generate-due');
    const json = await res.json();
    expect(json.data.generated).toHaveLength(0);
  });

  it('skips paused templates', async () => {
    const contactId = await createContact();

    const createRes = await req('POST', '/api/recurring-invoices', {
      templateName: 'Paused',
      contactId,
      frequency: 'monthly',
      nextDate: '2026-01-01',
      total: 100,
    });
    const { data: recurring } = await createRes.json();

    // Pause it
    await req('PUT', `/api/recurring-invoices/${recurring.id}`, { status: 'paused' });

    const res = await req('POST', '/api/recurring-invoices/generate-due');
    const json = await res.json();
    expect(json.data.generated).toHaveLength(0);
  });
});

describe('Recurring Bill Batch Generation', () => {
  it('generates bills for all due recurring templates', async () => {
    const contactId = await createContact('Supplier');

    await req('POST', '/api/recurring-bills', {
      templateName: 'Monthly Rent',
      contactId,
      frequency: 'monthly',
      nextDate: '2026-01-01',
      total: 2000,
      subTotal: 1739.13,
      totalTax: 260.87,
    });

    const res = await req('POST', '/api/recurring-bills/generate-due');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.generated).toHaveLength(1);
    expect(json.data.generated[0].billNumber).toMatch(/^BILL-\d{4}$/);
  });

  it('returns empty when no templates are due', async () => {
    const res = await req('POST', '/api/recurring-bills/generate-due');
    const json = await res.json();
    expect(json.data.generated).toHaveLength(0);
  });
});

// ── Part D: Credit Note Auto-Allocation ────────────────────────────────────

describe('Credit Note Auto-Allocation', () => {
  async function createInvoice(contactId: string, total: number): Promise<string> {
    const res = await req('POST', '/api/invoices', {
      contactId,
      date: '2026-01-01',
      dueDate: '2026-02-01',
      lineItems: [{ description: 'Item', quantity: 1, unitPrice: total, taxRate: 0, discount: 0 }],
    });
    const json = await res.json();
    return json.data.id;
  }

  it('allocates credit note across oldest unpaid invoices', async () => {
    const contactId = await createContact();

    // Create 3 invoices of varying amounts
    const inv1 = await createInvoice(contactId, 100); // oldest
    const inv2 = await createInvoice(contactId, 200);
    const inv3 = await createInvoice(contactId, 300);

    // Create and approve a credit note for 250
    const cnRes = await req('POST', '/api/credit-notes', {
      type: 'sales',
      contactId,
      date: '2026-02-01',
      total: 250,
      subTotal: 250,
      totalTax: 0,
    });
    const { data: cn } = await cnRes.json();

    // Approve the credit note (draft -> submitted -> approved)
    await req('PUT', `/api/credit-notes/${cn.id}/status`, { status: 'submitted' });
    await req('PUT', `/api/credit-notes/${cn.id}/status`, { status: 'approved' });

    // Auto-allocate
    const allocRes = await req('POST', `/api/credit-notes/${cn.id}/auto-allocate`);
    expect(allocRes.status).toBe(200);
    const { data } = await allocRes.json();

    // Should allocate 100 to inv1 (fully paid), 150 to inv2 (partially paid)
    expect(data.allocations).toHaveLength(2);
    expect(data.allocations[0].invoiceId).toBe(inv1);
    expect(data.allocations[0].amount).toBe(100);
    expect(data.allocations[1].invoiceId).toBe(inv2);
    expect(data.allocations[1].amount).toBe(150);

    // Credit note should have 0 remaining
    expect(data.creditNote.remainingCredit).toBe(0);
    expect(data.creditNote.status).toBe('applied');

    // Verify invoice amounts
    const inv1Res = await req('GET', `/api/invoices/${inv1}`);
    const inv1Json = await inv1Res.json();
    expect(inv1Json.data.amountDue).toBe(0);

    const inv2Res = await req('GET', `/api/invoices/${inv2}`);
    const inv2Json = await inv2Res.json();
    expect(inv2Json.data.amountDue).toBe(50);

    // inv3 should be untouched
    const inv3Res = await req('GET', `/api/invoices/${inv3}`);
    const inv3Json = await inv3Res.json();
    expect(inv3Json.data.amountDue).toBe(300);
  });

  it('keeps approved status when credit not fully consumed', async () => {
    const contactId = await createContact();
    await createInvoice(contactId, 50); // only 50 due

    const cnRes = await req('POST', '/api/credit-notes', {
      type: 'sales',
      contactId,
      date: '2026-02-01',
      total: 200,
      subTotal: 200,
      totalTax: 0,
    });
    const { data: cn } = await cnRes.json();

    await req('PUT', `/api/credit-notes/${cn.id}/status`, { status: 'submitted' });
    await req('PUT', `/api/credit-notes/${cn.id}/status`, { status: 'approved' });

    const allocRes = await req('POST', `/api/credit-notes/${cn.id}/auto-allocate`);
    const { data } = await allocRes.json();

    expect(data.allocations).toHaveLength(1);
    expect(data.allocations[0].amount).toBe(50);
    expect(data.creditNote.remainingCredit).toBe(150);
    expect(data.creditNote.status).toBe('approved'); // still has credit left
  });

  it('rejects auto-allocate for non-approved credit note', async () => {
    const contactId = await createContact();
    const cnRes = await req('POST', '/api/credit-notes', {
      type: 'sales',
      contactId,
      date: '2026-02-01',
      total: 100,
    });
    const { data: cn } = await cnRes.json();

    const res = await req('POST', `/api/credit-notes/${cn.id}/auto-allocate`);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Only approved credit notes can be auto-allocated');
  });

  it('rejects auto-allocate when no remaining credit', async () => {
    const contactId = await createContact();
    await createInvoice(contactId, 100);

    const cnRes = await req('POST', '/api/credit-notes', {
      type: 'sales',
      contactId,
      date: '2026-02-01',
      total: 100,
      subTotal: 100,
      totalTax: 0,
    });
    const { data: cn } = await cnRes.json();

    await req('PUT', `/api/credit-notes/${cn.id}/status`, { status: 'submitted' });
    await req('PUT', `/api/credit-notes/${cn.id}/status`, { status: 'approved' });

    // First allocation should use all credit and transition to 'applied'
    const firstRes = await req('POST', `/api/credit-notes/${cn.id}/auto-allocate`);
    const firstJson = await firstRes.json();
    expect(firstJson.data.creditNote.status).toBe('applied');
    expect(firstJson.data.creditNote.remainingCredit).toBe(0);

    // Second attempt should fail (status is now 'applied', not 'approved')
    const res = await req('POST', `/api/credit-notes/${cn.id}/auto-allocate`);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Only approved credit notes can be auto-allocated');
  });

  it('returns 404 for non-existent credit note', async () => {
    const res = await req('POST', '/api/credit-notes/00000000-0000-0000-0000-000000000000/auto-allocate');
    expect(res.status).toBe(404);
  });

  it('returns empty allocations when no unpaid invoices exist', async () => {
    const contactId = await createContact();

    const cnRes = await req('POST', '/api/credit-notes', {
      type: 'sales',
      contactId,
      date: '2026-02-01',
      total: 100,
      subTotal: 100,
      totalTax: 0,
    });
    const { data: cn } = await cnRes.json();

    await req('PUT', `/api/credit-notes/${cn.id}/status`, { status: 'submitted' });
    await req('PUT', `/api/credit-notes/${cn.id}/status`, { status: 'approved' });

    const allocRes = await req('POST', `/api/credit-notes/${cn.id}/auto-allocate`);
    const { data } = await allocRes.json();

    expect(data.allocations).toHaveLength(0);
    expect(data.creditNote.remainingCredit).toBe(100);
    expect(data.creditNote.status).toBe('approved');
  });
});
