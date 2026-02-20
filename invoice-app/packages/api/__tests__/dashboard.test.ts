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

async function createContact(name: string = 'Test Customer') {
  const res = await req('POST', '/api/contacts', { name, type: 'customer' });
  const json = await res.json();
  return json.data;
}

async function createInvoice(contactId: string, total: number, status: string = 'draft') {
  const res = await req('POST', '/api/invoices', {
    contactId,
    date: '2026-01-15',
    dueDate: '2026-02-15',
    lineItems: [{ description: 'Item', quantity: 1, unitPrice: total, taxRate: 0 }],
    amountType: 'no_tax',
  });
  const json = await res.json();
  if (status !== 'draft') {
    await req('PUT', `/api/invoices/${json.data.id}/status`, { status: 'submitted' });
    if (status === 'approved' || status === 'paid') {
      await req('PUT', `/api/invoices/${json.data.id}/status`, { status: 'approved' });
    }
    if (status === 'paid') {
      await req('PUT', `/api/invoices/${json.data.id}/status`, { status: 'paid' });
    }
  }
  return json.data;
}

describe('Dashboard API', () => {
  describe('GET /api/dashboard/summary', () => {
    it('returns empty summary when no data', async () => {
      const res = await req('GET', '/api/dashboard/summary');
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.totalInvoicesOwed).toBe(0);
      expect(json.data.totalBillsToPay).toBe(0);
      expect(json.data.invoiceCount).toBe(0);
      expect(json.data.billCount).toBe(0);
      expect(json.data.cashFlow).toHaveLength(12);
    });

    it('returns correct invoice totals', async () => {
      const contact = await createContact();
      await createInvoice(contact.id, 1000, 'submitted');
      await createInvoice(contact.id, 500, 'approved');

      const res = await req('GET', '/api/dashboard/summary');
      const json = await res.json();
      expect(json.data.invoiceCount).toBe(2);
      expect(json.data.totalInvoicesOwed).toBe(1500);
    });

    it('excludes paid invoices from owed total', async () => {
      const contact = await createContact();
      await createInvoice(contact.id, 1000, 'paid');
      await createInvoice(contact.id, 500, 'submitted');

      const res = await req('GET', '/api/dashboard/summary');
      const json = await res.json();
      expect(json.data.totalInvoicesOwed).toBe(500);
    });

    it('returns recent invoices', async () => {
      const contact = await createContact();
      await createInvoice(contact.id, 100);
      await createInvoice(contact.id, 200);
      await createInvoice(contact.id, 300);

      const res = await req('GET', '/api/dashboard/summary');
      const json = await res.json();
      expect(json.data.recentInvoices).toHaveLength(3);
    });
  });
});
