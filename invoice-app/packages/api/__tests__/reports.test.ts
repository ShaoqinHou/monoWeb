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

async function createInvoice(contactId: string, overrides?: Record<string, unknown>): Promise<string> {
  const body = {
    contactId,
    date: '2026-01-15',
    dueDate: '2026-02-15',
    lineItems: [
      { description: 'Service', quantity: 1, unitPrice: 1000, taxRate: 15, discount: 0 },
    ],
    ...overrides,
  };
  const res = await req('POST', '/api/invoices', body);
  const json = await res.json();
  return json.data.id;
}

async function createBill(contactId: string, overrides?: Record<string, unknown>): Promise<string> {
  const body = {
    contactId,
    date: '2026-01-15',
    dueDate: '2026-02-15',
    lineItems: [
      { description: 'Supplies', quantity: 1, unitPrice: 500, taxRate: 15, discount: 0 },
    ],
    ...overrides,
  };
  const res = await req('POST', '/api/bills', body);
  const json = await res.json();
  return json.data.id;
}

async function markPaid(type: 'invoices' | 'bills', id: string) {
  // Transition draft → submitted → approved → paid
  await req('PUT', `/api/${type}/${id}/status`, { status: 'submitted' });
  await req('PUT', `/api/${type}/${id}/status`, { status: 'approved' });
  await req('PUT', `/api/${type}/${id}/status`, { status: 'paid' });
}

describe('Reports API', () => {
  describe('GET /api/reports/profit-and-loss', () => {
    it('returns zeros with empty database', async () => {
      const res = await req('GET', '/api/reports/profit-and-loss');
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.totalRevenue).toBe(0);
      expect(json.data.totalOperatingExpenses).toBe(0);
      expect(json.data.netProfit).toBe(0);
      expect(json.data.revenue).toEqual([]);
    });

    it('calculates income from paid invoices', async () => {
      const contactId = await createContact();
      const invoiceId = await createInvoice(contactId);
      await markPaid('invoices', invoiceId);

      const res = await req('GET', '/api/reports/profit-and-loss?start=2026-01-01&end=2026-12-31');
      const json = await res.json();
      expect(json.data.totalRevenue).toBe(1150); // 1000 + 150 tax
      expect(json.data.totalOperatingExpenses).toBe(0);
      expect(json.data.netProfit).toBe(1150);
    });

    it('calculates expenses from paid bills', async () => {
      const contactId = await createContact('Supplier', 'supplier');
      const billId = await createBill(contactId);
      await markPaid('bills', billId);

      const res = await req('GET', '/api/reports/profit-and-loss?start=2026-01-01&end=2026-12-31');
      const json = await res.json();
      expect(json.data.totalRevenue).toBe(0);
      expect(json.data.totalOperatingExpenses).toBe(575); // 500 + 75 tax
      expect(json.data.netProfit).toBe(-575);
    });

    it('filters by date range', async () => {
      const contactId = await createContact();
      const invoiceId = await createInvoice(contactId, { date: '2026-06-15', dueDate: '2026-07-15' });
      await markPaid('invoices', invoiceId);

      // Query range that excludes the invoice
      const res = await req('GET', '/api/reports/profit-and-loss?start=2026-01-01&end=2026-05-31');
      const json = await res.json();
      expect(json.data.totalRevenue).toBe(0);
    });

    it('excludes unpaid invoices from income on cash basis', async () => {
      const contactId = await createContact();
      await createInvoice(contactId); // stays as draft

      const res = await req('GET', '/api/reports/profit-and-loss?basis=cash');
      const json = await res.json();
      expect(json.data.totalRevenue).toBe(0);
    });

    it('includes unpaid invoices on accrual basis', async () => {
      const contactId = await createContact();
      await createInvoice(contactId); // stays as draft

      const res = await req('GET', '/api/reports/profit-and-loss?basis=accrual&start=2026-01-01&end=2026-12-31');
      const json = await res.json();
      expect(json.data.totalRevenue).toBe(1150);
    });
  });

  describe('GET /api/reports/balance-sheet', () => {
    it('returns zeros with empty database', async () => {
      const res = await req('GET', '/api/reports/balance-sheet');
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.totalAssets).toBe(0);
      expect(json.data.totalLiabilities).toBe(0);
      expect(json.data.totalEquity).toBe(0);
    });

    it('includes outstanding invoice amounts as assets', async () => {
      const contactId = await createContact();
      await createInvoice(contactId);

      const res = await req('GET', '/api/reports/balance-sheet?asAt=2026-12-31');
      const json = await res.json();
      expect(json.data.totalAssets).toBe(1150); // amountDue = total for draft invoice
    });

    it('includes outstanding bill amounts as liabilities', async () => {
      const contactId = await createContact('Supplier', 'supplier');
      await createBill(contactId);

      const res = await req('GET', '/api/reports/balance-sheet?asAt=2026-12-31');
      const json = await res.json();
      expect(json.data.totalLiabilities).toBe(575);
    });
  });

  describe('GET /api/reports/aged-receivables', () => {
    it('returns empty buckets with no invoices', async () => {
      const res = await req('GET', '/api/reports/aged-receivables');
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.total).toBe(0);
      expect(json.data.buckets).toHaveLength(5);
      for (const bucket of json.data.buckets) {
        expect(bucket.amount).toBe(0);
        expect(bucket.count).toBe(0);
      }
    });

    it('buckets outstanding invoices by aging', async () => {
      const contactId = await createContact();
      // Create invoice with a due date in the future (current bucket)
      await createInvoice(contactId, { dueDate: '2099-01-01' });

      const res = await req('GET', '/api/reports/aged-receivables');
      const json = await res.json();
      expect(json.data.total).toBe(1150);
      expect(json.data.buckets[0].label).toBe('Current');
      expect(json.data.buckets[0].amount).toBe(1150);
      expect(json.data.buckets[0].count).toBe(1);
    });

    it('excludes paid invoices', async () => {
      const contactId = await createContact();
      const invoiceId = await createInvoice(contactId);
      await markPaid('invoices', invoiceId);

      const res = await req('GET', '/api/reports/aged-receivables');
      const json = await res.json();
      expect(json.data.total).toBe(0);
    });

    it('has correct bucket labels', async () => {
      const res = await req('GET', '/api/reports/aged-receivables');
      const json = await res.json();
      const labels = json.data.buckets.map((b: { label: string }) => b.label);
      expect(labels).toEqual(['Current', '1-30 days', '31-60 days', '61-90 days', '90+ days']);
    });
  });

  describe('GET /api/reports/aged-payables', () => {
    it('returns empty buckets with no bills', async () => {
      const res = await req('GET', '/api/reports/aged-payables');
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.total).toBe(0);
      expect(json.data.buckets).toHaveLength(5);
    });

    it('buckets outstanding bills by aging', async () => {
      const contactId = await createContact('Supplier', 'supplier');
      // Create bill with future due date (current bucket)
      await createBill(contactId, { dueDate: '2099-01-01' });

      const res = await req('GET', '/api/reports/aged-payables');
      const json = await res.json();
      expect(json.data.total).toBe(575);
      expect(json.data.buckets[0].label).toBe('Current');
      expect(json.data.buckets[0].amount).toBe(575);
      expect(json.data.buckets[0].count).toBe(1);
    });

    it('excludes paid bills', async () => {
      const contactId = await createContact('Supplier', 'supplier');
      const billId = await createBill(contactId);
      await markPaid('bills', billId);

      const res = await req('GET', '/api/reports/aged-payables');
      const json = await res.json();
      expect(json.data.total).toBe(0);
    });
  });
});
