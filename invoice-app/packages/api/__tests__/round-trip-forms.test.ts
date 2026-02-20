/**
 * Round-trip integration tests: Form → API → Database
 *
 * This test layer verifies the contract that React form components depend on:
 * forms send a contactId, the API validates it exists in the DB.
 *
 * The key failure path: if a form sends a contactId that doesn't exist in the
 * DB (e.g., hardcoded or stale), the API must reject it with 400.
 */
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

// ---------- Helpers ----------

const FAKE_UUID = '00000000-0000-0000-0000-000000000000';

const LINE_ITEM = {
  description: 'Test Service',
  quantity: 1,
  unitPrice: 100,
  accountCode: '200',
  taxRate: 15,
  discount: 0,
};

async function createContact(name = 'Test Customer', type: 'customer' | 'supplier' = 'customer'): Promise<string> {
  const res = await req('POST', '/api/contacts', { name, type });
  expect(res.status).toBe(201);
  const json = await res.json();
  expect(json.ok).toBe(true);
  return json.data.id;
}

// ---------- Tests ----------

describe('Round-trip: Contact -> Invoice', () => {
  it('creates invoice with real contact ID', async () => {
    const contactId = await createContact();
    const res = await req('POST', '/api/invoices', {
      contactId,
      date: '2026-01-15',
      dueDate: '2026-02-15',
      lineItems: [LINE_ITEM],
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.contactId).toBe(contactId);
    expect(json.data.contactName).toBe('Test Customer');
    expect(json.data.status).toBe('draft');
    expect(json.data.subTotal).toBe(100);
    expect(json.data.totalTax).toBe(15);
    expect(json.data.total).toBe(115);
  });

  it('rejects invoice with nonexistent contact ID', async () => {
    const res = await req('POST', '/api/invoices', {
      contactId: FAKE_UUID,
      date: '2026-01-15',
      dueDate: '2026-02-15',
      lineItems: [LINE_ITEM],
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBe('Contact not found');
  });

  it('rejects invoice with empty contact ID', async () => {
    const res = await req('POST', '/api/invoices', {
      contactId: '',
      date: '2026-01-15',
      dueDate: '2026-02-15',
      lineItems: [LINE_ITEM],
    });
    expect(res.status).toBe(400);
  });
});

describe('Round-trip: Contact -> Quote', () => {
  it('creates quote with real contact ID', async () => {
    const contactId = await createContact();
    const res = await req('POST', '/api/quotes', {
      contactId,
      date: '2026-01-15',
      expiryDate: '2026-03-15',
      lineItems: [LINE_ITEM],
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.contactId).toBe(contactId);
    expect(json.data.contactName).toBe('Test Customer');
    expect(json.data.status).toBe('draft');
    expect(json.data.quoteNumber).toMatch(/^QU-\d{4}$/);
  });

  it('rejects quote with nonexistent contact ID', async () => {
    const res = await req('POST', '/api/quotes', {
      contactId: FAKE_UUID,
      date: '2026-01-15',
      expiryDate: '2026-03-15',
      lineItems: [LINE_ITEM],
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBe('Contact not found');
  });
});

describe('Round-trip: Contact -> Credit Note', () => {
  it('creates credit note with real contact ID', async () => {
    const contactId = await createContact();
    const res = await req('POST', '/api/credit-notes', {
      type: 'sales',
      contactId,
      date: '2026-01-15',
      subTotal: 100,
      totalTax: 15,
      total: 115,
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.contactId).toBe(contactId);
    expect(json.data.contactName).toBe('Test Customer');
    expect(json.data.status).toBe('draft');
    expect(json.data.creditNoteNumber).toMatch(/^CN-\d{4}$/);
  });

  it('rejects credit note with nonexistent contact ID', async () => {
    const res = await req('POST', '/api/credit-notes', {
      type: 'sales',
      contactId: FAKE_UUID,
      date: '2026-01-15',
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBe('Contact not found');
  });
});

describe('Round-trip: Contact -> Purchase Order', () => {
  it('creates PO with real contact ID', async () => {
    const contactId = await createContact('Test Supplier', 'supplier');
    const res = await req('POST', '/api/purchase-orders', {
      contactId,
      date: '2026-01-15',
      lineItems: [LINE_ITEM],
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.contactId).toBe(contactId);
    expect(json.data.contactName).toBe('Test Supplier');
    expect(json.data.status).toBe('draft');
    expect(json.data.poNumber).toMatch(/^PO-\d{4}$/);
  });

  it('rejects PO with nonexistent contact ID', async () => {
    const res = await req('POST', '/api/purchase-orders', {
      contactId: FAKE_UUID,
      date: '2026-01-15',
      lineItems: [LINE_ITEM],
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBe('Contact not found');
  });
});

describe('Round-trip: Contact -> Bill', () => {
  it('creates bill with real contact ID', async () => {
    const contactId = await createContact('Test Supplier', 'supplier');
    const res = await req('POST', '/api/bills', {
      contactId,
      date: '2026-01-20',
      dueDate: '2026-02-20',
      lineItems: [LINE_ITEM],
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.contactId).toBe(contactId);
    expect(json.data.contactName).toBe('Test Supplier');
    expect(json.data.status).toBe('draft');
    expect(json.data.subTotal).toBe(100);
    expect(json.data.totalTax).toBe(15);
    expect(json.data.total).toBe(115);
  });

  it('rejects bill with nonexistent contact ID', async () => {
    const res = await req('POST', '/api/bills', {
      contactId: FAKE_UUID,
      date: '2026-01-20',
      dueDate: '2026-02-20',
      lineItems: [LINE_ITEM],
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBe('Contact not found');
  });
});

describe('Round-trip: Contact -> Recurring Invoice', () => {
  it('creates recurring invoice with real contact ID', async () => {
    const contactId = await createContact();
    const res = await req('POST', '/api/recurring-invoices', {
      templateName: 'Monthly Retainer',
      contactId,
      frequency: 'monthly',
      nextDate: '2026-03-01',
      subTotal: 100,
      totalTax: 15,
      total: 115,
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.contactId).toBe(contactId);
    expect(json.data.contactName).toBe('Test Customer');
    expect(json.data.status).toBe('active');
    expect(json.data.frequency).toBe('monthly');
  });

  it('rejects recurring invoice with nonexistent contact ID', async () => {
    const res = await req('POST', '/api/recurring-invoices', {
      templateName: 'Monthly Retainer',
      contactId: FAKE_UUID,
      frequency: 'monthly',
      nextDate: '2026-03-01',
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBe('Contact not found');
  });
});

describe('Round-trip: Full lifecycle', () => {
  it('contact -> invoice -> approve -> payment', async () => {
    // Step 1: Create a real contact
    const contactId = await createContact('Acme Corp');

    // Step 2: Create an invoice with that contact's real ID
    const invoiceRes = await req('POST', '/api/invoices', {
      contactId,
      date: '2026-01-15',
      dueDate: '2026-02-15',
      lineItems: [
        { description: 'Consulting', quantity: 10, unitPrice: 150, taxRate: 15, discount: 0 },
      ],
    });
    expect(invoiceRes.status).toBe(201);
    const invoiceJson = await invoiceRes.json();
    const invoiceId = invoiceJson.data.id;
    expect(invoiceJson.data.contactId).toBe(contactId);
    expect(invoiceJson.data.contactName).toBe('Acme Corp');
    // 10 * 150 = 1500, tax = 225, total = 1725
    expect(invoiceJson.data.total).toBe(1725);

    // Step 3: Transition draft -> submitted -> approved
    const submitRes = await req('PUT', `/api/invoices/${invoiceId}/status`, { status: 'submitted' });
    expect(submitRes.status).toBe(200);
    const submitJson = await submitRes.json();
    expect(submitJson.data.status).toBe('submitted');

    const approveRes = await req('PUT', `/api/invoices/${invoiceId}/status`, { status: 'approved' });
    expect(approveRes.status).toBe(200);
    const approveJson = await approveRes.json();
    expect(approveJson.data.status).toBe('approved');

    // Step 4: Record full payment
    const paymentRes = await req('POST', '/api/payments', {
      invoiceId,
      amount: 1725,
      date: '2026-02-10',
      reference: 'PAY-001',
    });
    expect(paymentRes.status).toBe(201);
    const paymentJson = await paymentRes.json();
    expect(paymentJson.ok).toBe(true);
    expect(paymentJson.data.amount).toBe(1725);

    // Step 5: Verify invoice is now paid
    const finalRes = await req('GET', `/api/invoices/${invoiceId}`);
    expect(finalRes.status).toBe(200);
    const finalJson = await finalRes.json();
    expect(finalJson.data.status).toBe('paid');
    expect(finalJson.data.amountPaid).toBe(1725);
    expect(finalJson.data.amountDue).toBe(0);
  });

  it('contact -> quote -> accept -> convert to invoice', async () => {
    // Step 1: Create a real contact
    const contactId = await createContact('Widget Co');

    // Step 2: Create a quote with that contact's real ID
    const quoteRes = await req('POST', '/api/quotes', {
      contactId,
      date: '2026-01-10',
      expiryDate: '2026-02-10',
      lineItems: [
        { description: 'Widget Design', quantity: 1, unitPrice: 5000, taxRate: 15, discount: 0 },
      ],
    });
    expect(quoteRes.status).toBe(201);
    const quoteJson = await quoteRes.json();
    const quoteId = quoteJson.data.id;
    expect(quoteJson.data.contactId).toBe(contactId);
    expect(quoteJson.data.contactName).toBe('Widget Co');

    // Step 3: Transition draft -> sent -> accepted
    const sentRes = await req('PUT', `/api/quotes/${quoteId}/status`, { status: 'sent' });
    expect(sentRes.status).toBe(200);
    expect((await sentRes.json()).data.status).toBe('sent');

    const acceptedRes = await req('PUT', `/api/quotes/${quoteId}/status`, { status: 'accepted' });
    expect(acceptedRes.status).toBe(200);
    expect((await acceptedRes.json()).data.status).toBe('accepted');

    // Step 4: Convert to invoice
    const convertRes = await req('POST', `/api/quotes/${quoteId}/convert`);
    expect(convertRes.status).toBe(201);
    const convertJson = await convertRes.json();
    expect(convertJson.ok).toBe(true);
    // The converted invoice should reference the same contact
    expect(convertJson.data.contactId).toBe(contactId);
    expect(convertJson.data.contactName).toBe('Widget Co');
    expect(convertJson.data.status).toBe('draft');

    // Step 5: Verify quote is now marked as invoiced
    const quoteAfterRes = await req('GET', `/api/quotes/${quoteId}`);
    expect(quoteAfterRes.status).toBe(200);
    const quoteAfterJson = await quoteAfterRes.json();
    expect(quoteAfterJson.data.status).toBe('invoiced');
    expect(quoteAfterJson.data.convertedInvoiceId).toBe(convertJson.data.id);
  });
});

describe('Round-trip: Cross-entity contact validation on update', () => {
  it('rejects updating invoice to a nonexistent contact', async () => {
    const contactId = await createContact();
    const invoiceRes = await req('POST', '/api/invoices', {
      contactId,
      date: '2026-01-15',
      dueDate: '2026-02-15',
      lineItems: [LINE_ITEM],
    });
    const invoiceId = (await invoiceRes.json()).data.id;

    // Try to update the invoice's contactId to a fake one
    const updateRes = await req('PUT', `/api/invoices/${invoiceId}`, {
      contactId: FAKE_UUID,
    });
    expect(updateRes.status).toBe(400);
    const json = await updateRes.json();
    expect(json.error).toBe('Contact not found');
  });

  it('rejects updating quote to a nonexistent contact', async () => {
    const contactId = await createContact();
    const quoteRes = await req('POST', '/api/quotes', {
      contactId,
      date: '2026-01-15',
      expiryDate: '2026-03-15',
      lineItems: [LINE_ITEM],
    });
    const quoteId = (await quoteRes.json()).data.id;

    const updateRes = await req('PUT', `/api/quotes/${quoteId}`, {
      contactId: FAKE_UUID,
    });
    expect(updateRes.status).toBe(400);
    const json = await updateRes.json();
    expect(json.error).toBe('Contact not found');
  });

  it('rejects updating bill to a nonexistent contact', async () => {
    const contactId = await createContact('Supplier', 'supplier');
    const billRes = await req('POST', '/api/bills', {
      contactId,
      date: '2026-01-20',
      dueDate: '2026-02-20',
      lineItems: [LINE_ITEM],
    });
    const billId = (await billRes.json()).data.id;

    const updateRes = await req('PUT', `/api/bills/${billId}`, {
      contactId: FAKE_UUID,
    });
    expect(updateRes.status).toBe(400);
    const json = await updateRes.json();
    expect(json.error).toBe('Contact not found');
  });

  it('rejects updating PO to a nonexistent contact', async () => {
    const contactId = await createContact('Supplier', 'supplier');
    const poRes = await req('POST', '/api/purchase-orders', {
      contactId,
      date: '2026-01-15',
      lineItems: [LINE_ITEM],
    });
    const poId = (await poRes.json()).data.id;

    const updateRes = await req('PUT', `/api/purchase-orders/${poId}`, {
      contactId: FAKE_UUID,
    });
    expect(updateRes.status).toBe(400);
    const json = await updateRes.json();
    expect(json.error).toBe('Contact not found');
  });

  it('rejects updating recurring invoice to a nonexistent contact', async () => {
    const contactId = await createContact();
    const riRes = await req('POST', '/api/recurring-invoices', {
      templateName: 'Test Template',
      contactId,
      frequency: 'monthly',
      nextDate: '2026-03-01',
    });
    const riId = (await riRes.json()).data.id;

    const updateRes = await req('PUT', `/api/recurring-invoices/${riId}`, {
      contactId: FAKE_UUID,
    });
    expect(updateRes.status).toBe(400);
    const json = await updateRes.json();
    expect(json.error).toBe('Contact not found');
  });
});
