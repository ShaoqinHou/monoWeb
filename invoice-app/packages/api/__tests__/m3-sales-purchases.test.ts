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

async function createInvoice(contactId: string, overrides?: Record<string, unknown>) {
  const body = {
    contactId,
    date: '2026-01-15',
    dueDate: '2026-02-15',
    lineItems: [
      { description: 'Widget', quantity: 10, unitPrice: 100, taxRate: 15, discount: 0 },
    ],
    ...overrides,
  };
  const res = await req('POST', '/api/invoices', body);
  const json = await res.json();
  return json.data;
}

async function createBill(contactId: string, overrides?: Record<string, unknown>) {
  const body = {
    contactId,
    date: '2026-01-20',
    dueDate: '2026-02-20',
    lineItems: [
      { description: 'Office supplies', quantity: 20, unitPrice: 25, taxRate: 15, discount: 0 },
    ],
    ...overrides,
  };
  const res = await req('POST', '/api/bills', body);
  const json = await res.json();
  return json.data;
}

async function createQuote(contactId: string, overrides?: Record<string, unknown>) {
  const body = {
    contactId,
    date: '2026-01-15',
    expiryDate: '2026-02-15',
    title: 'Test Quote',
    lineItems: [
      { description: 'Consulting', quantity: 5, unitPrice: 200, taxRate: 15, discount: 0 },
    ],
    ...overrides,
  };
  const res = await req('POST', '/api/quotes', body);
  const json = await res.json();
  return json.data;
}

describe('GET /api/invoices/overdue', () => {
  it('returns empty array when no overdue invoices', async () => {
    const res = await req('GET', '/api/invoices/overdue');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data).toEqual([]);
  });

  it('returns overdue invoices with daysOverdue', async () => {
    const contactId = await createContact();
    // Create an invoice with a due date in the past
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    const dueDate = pastDate.toISOString().slice(0, 10);

    const invoice = await createInvoice(contactId, { dueDate });
    // Transition to approved (draft -> submitted -> approved)
    await req('PUT', `/api/invoices/${invoice.id}/status`, { status: 'submitted' });
    await req('PUT', `/api/invoices/${invoice.id}/status`, { status: 'approved' });

    const res = await req('GET', '/api/invoices/overdue');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(1);
    expect(json.data[0].id).toBe(invoice.id);
    expect(json.data[0].daysOverdue).toBeGreaterThanOrEqual(9);
    expect(json.data[0].daysOverdue).toBeLessThanOrEqual(11);
  });

  it('excludes paid and voided invoices', async () => {
    const contactId = await createContact();
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const dueDate = pastDate.toISOString().slice(0, 10);

    const invoice = await createInvoice(contactId, { dueDate });
    // Transition to paid
    await req('PUT', `/api/invoices/${invoice.id}/status`, { status: 'submitted' });
    await req('PUT', `/api/invoices/${invoice.id}/status`, { status: 'approved' });
    await req('PUT', `/api/invoices/${invoice.id}/status`, { status: 'paid' });

    const res = await req('GET', '/api/invoices/overdue');
    const json = await res.json();
    expect(json.data).toHaveLength(0);
  });

  it('filters by 1-30 days range', async () => {
    const contactId = await createContact();
    // 10 days overdue
    const pastDate10 = new Date();
    pastDate10.setDate(pastDate10.getDate() - 10);
    await createInvoice(contactId, { dueDate: pastDate10.toISOString().slice(0, 10) });

    // 45 days overdue
    const pastDate45 = new Date();
    pastDate45.setDate(pastDate45.getDate() - 45);
    await createInvoice(contactId, { dueDate: pastDate45.toISOString().slice(0, 10) });

    const res = await req('GET', '/api/invoices/overdue?filter=1-30');
    const json = await res.json();
    expect(json.data).toHaveLength(1);
    expect(json.data[0].daysOverdue).toBeGreaterThanOrEqual(9);
    expect(json.data[0].daysOverdue).toBeLessThanOrEqual(11);
  });
});

describe('POST /api/invoices/:id/send-reminder', () => {
  it('returns success for valid invoice', async () => {
    const contactId = await createContact();
    const invoice = await createInvoice(contactId);

    const res = await req('POST', `/api/invoices/${invoice.id}/send-reminder`, {});
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.success).toBe(true);
    expect(json.data.invoiceId).toBe(invoice.id);
    expect(typeof json.data.sentAt).toBe('string');
  });

  it('returns 404 for non-existent invoice', async () => {
    const res = await req('POST', '/api/invoices/nonexistent/send-reminder', {});
    expect(res.status).toBe(404);
  });
});

describe('POST /api/invoices/:id/payment-receipt', () => {
  it('returns success for valid invoice', async () => {
    const contactId = await createContact();
    const invoice = await createInvoice(contactId);

    const res = await req('POST', `/api/invoices/${invoice.id}/payment-receipt`, {
      paymentAmount: 500,
      contactEmail: 'test@example.com',
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.success).toBe(true);
    expect(typeof json.data.sentAt).toBe('string');
  });

  it('returns 404 for non-existent invoice', async () => {
    const res = await req('POST', '/api/invoices/nonexistent/payment-receipt', {});
    expect(res.status).toBe(404);
  });
});

describe('POST /api/invoices/batch-print-preview', () => {
  it('returns documents for valid IDs', async () => {
    const contactId = await createContact();
    const inv1 = await createInvoice(contactId);
    const inv2 = await createInvoice(contactId);

    const res = await req('POST', '/api/invoices/batch-print-preview', {
      ids: [inv1.id, inv2.id],
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.documents).toHaveLength(2);
    expect(json.data.estimatedPages).toBe(2);
    expect(json.data.documents[0].documentNumber).toMatch(/^INV-/);
    expect(json.data.documents[0].contactName).toBe('Test Customer');
  });

  it('returns 400 for empty IDs', async () => {
    const res = await req('POST', '/api/invoices/batch-print-preview', { ids: [] });
    expect(res.status).toBe(400);
  });

  it('skips non-existent IDs', async () => {
    const contactId = await createContact();
    const inv = await createInvoice(contactId);

    const res = await req('POST', '/api/invoices/batch-print-preview', {
      ids: [inv.id, 'nonexistent'],
    });
    const json = await res.json();
    expect(json.data.documents).toHaveLength(1);
    expect(json.data.estimatedPages).toBe(1);
  });
});

describe('GET /api/bills/due', () => {
  it('returns empty groups when no bills', async () => {
    const res = await req('GET', '/api/bills/due');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.today).toEqual([]);
    expect(json.data.thisWeek).toEqual([]);
    expect(json.data.thisMonth).toEqual([]);
  });

  it('groups bills into today, thisWeek, thisMonth', async () => {
    const contactId = await createContact('Supplier Co', 'supplier');

    // Use local date formatting to match API's local date comparison
    const pad = (n: number) => String(n).padStart(2, '0');
    const localDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const today = new Date();
    const todayStr = localDateStr(today);

    const threeDays = new Date(today);
    threeDays.setDate(threeDays.getDate() + 3);
    const threeDaysStr = localDateStr(threeDays);

    const twentyDays = new Date(today);
    twentyDays.setDate(twentyDays.getDate() + 20);
    const twentyDaysStr = localDateStr(twentyDays);

    await createBill(contactId, { dueDate: todayStr });
    await createBill(contactId, { dueDate: threeDaysStr });
    await createBill(contactId, { dueDate: twentyDaysStr });

    const res = await req('GET', '/api/bills/due');
    const json = await res.json();
    expect(json.data.today).toHaveLength(1);
    expect(json.data.thisWeek).toHaveLength(1);
    expect(json.data.thisMonth).toHaveLength(1);
  });

  it('excludes paid and voided bills', async () => {
    const contactId = await createContact('Supplier Co', 'supplier');
    const pad2 = (n: number) => String(n).padStart(2, '0');
    const now = new Date();
    const today = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;

    const bill = await createBill(contactId, { dueDate: today });
    // Pay the bill via batch-payment
    await req('POST', '/api/bills/batch-payment', {
      billIds: [bill.id],
      paymentDate: today,
    });

    const res = await req('GET', '/api/bills/due');
    const json = await res.json();
    expect(json.data.today).toHaveLength(0);
  });
});

describe('POST /api/bills/batch-print-preview', () => {
  it('returns documents for valid IDs', async () => {
    const contactId = await createContact('Supplier Co', 'supplier');
    const bill1 = await createBill(contactId);
    const bill2 = await createBill(contactId);

    const res = await req('POST', '/api/bills/batch-print-preview', {
      ids: [bill1.id, bill2.id],
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.documents).toHaveLength(2);
    expect(json.data.estimatedPages).toBe(2);
    expect(json.data.documents[0].documentNumber).toMatch(/^BILL-/);
  });

  it('returns 400 for empty IDs', async () => {
    const res = await req('POST', '/api/bills/batch-print-preview', { ids: [] });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/quotes/expiring', () => {
  it('returns empty array when no expiring quotes', async () => {
    const res = await req('GET', '/api/quotes/expiring');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data).toEqual([]);
  });

  it('returns sent quotes expiring within 7 days', async () => {
    const contactId = await createContact();
    const threeDays = new Date();
    threeDays.setDate(threeDays.getDate() + 3);
    const expiryDate = threeDays.toISOString().slice(0, 10);

    const quote = await createQuote(contactId, { expiryDate });
    // Transition to sent
    await req('PUT', `/api/quotes/${quote.id}/status`, { status: 'sent' });

    const res = await req('GET', '/api/quotes/expiring');
    const json = await res.json();
    expect(json.data).toHaveLength(1);
    expect(json.data[0].daysUntilExpiry).toBeGreaterThanOrEqual(2);
    expect(json.data[0].daysUntilExpiry).toBeLessThanOrEqual(4);
    expect(json.data[0].expiryStatus).toBe('expiring');
  });

  it('returns sent quotes that are already expired', async () => {
    const contactId = await createContact();
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const expiryDate = pastDate.toISOString().slice(0, 10);

    const quote = await createQuote(contactId, { expiryDate });
    await req('PUT', `/api/quotes/${quote.id}/status`, { status: 'sent' });

    const res = await req('GET', '/api/quotes/expiring');
    const json = await res.json();
    expect(json.data).toHaveLength(1);
    expect(json.data[0].daysUntilExpiry).toBeLessThan(0);
    expect(json.data[0].expiryStatus).toBe('expired');
  });

  it('excludes draft quotes', async () => {
    const contactId = await createContact();
    const threeDays = new Date();
    threeDays.setDate(threeDays.getDate() + 3);
    const expiryDate = threeDays.toISOString().slice(0, 10);

    // Quote stays draft — should NOT appear in expiring
    await createQuote(contactId, { expiryDate });

    const res = await req('GET', '/api/quotes/expiring');
    const json = await res.json();
    expect(json.data).toHaveLength(0);
  });

  it('excludes quotes expiring more than 7 days out', async () => {
    const contactId = await createContact();
    const tenDays = new Date();
    tenDays.setDate(tenDays.getDate() + 10);
    const expiryDate = tenDays.toISOString().slice(0, 10);

    const quote = await createQuote(contactId, { expiryDate });
    await req('PUT', `/api/quotes/${quote.id}/status`, { status: 'sent' });

    const res = await req('GET', '/api/quotes/expiring');
    const json = await res.json();
    expect(json.data).toHaveLength(0);
  });
});

describe('POST /api/quotes/batch-print-preview', () => {
  it('returns documents for valid IDs', async () => {
    const contactId = await createContact();
    const q1 = await createQuote(contactId);
    const q2 = await createQuote(contactId);

    const res = await req('POST', '/api/quotes/batch-print-preview', {
      ids: [q1.id, q2.id],
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.documents).toHaveLength(2);
    expect(json.data.estimatedPages).toBe(2);
    expect(json.data.documents[0].documentNumber).toMatch(/^QU-/);
  });

  it('returns 400 for empty IDs', async () => {
    const res = await req('POST', '/api/quotes/batch-print-preview', { ids: [] });
    expect(res.status).toBe(400);
  });
});
