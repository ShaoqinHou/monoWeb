import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createApp } from '../src/app';
import { createTestDb } from '../src/db/test-helpers';
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

async function createInvoiceInPeriod(contactId: string, date: string) {
  return req('POST', '/api/invoices', {
    contactId,
    date,
    dueDate: '2026-12-31',
    lineItems: [{ description: 'Service', quantity: 1, unitPrice: 1000, taxRate: 15 }],
  });
}

async function createBillInPeriod(contactId: string, date: string) {
  return req('POST', '/api/bills', {
    contactId,
    date,
    dueDate: '2026-12-31',
    lineItems: [{ description: 'Supplies', quantity: 1, unitPrice: 500, taxRate: 15 }],
  });
}

describe('GST Returns API', () => {
  describe('GET /api/gst-returns', () => {
    it('returns empty array initially', async () => {
      const res = await req('GET', '/api/gst-returns');
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.data).toEqual([]);
    });

    it('returns all GST returns', async () => {
      await req('POST', '/api/gst-returns', {
        period: 'Jan-Feb 2026',
        startDate: '2026-01-01',
        endDate: '2026-02-28',
        dueDate: '2026-03-28',
      });
      await req('POST', '/api/gst-returns', {
        period: 'Mar-Apr 2026',
        startDate: '2026-03-01',
        endDate: '2026-04-30',
        dueDate: '2026-05-28',
      });

      const res = await req('GET', '/api/gst-returns');
      const body = await res.json();
      expect(body.data.length).toBe(2);
    });
  });

  describe('POST /api/gst-returns', () => {
    it('creates a GST return with auto-calculated GST from invoices and bills', async () => {
      const customerId = await createContact('Customer A');
      const supplierId = await createSupplier('Supplier A');

      // Create invoices in period: 2 x 1000 @ 15% = 300 GST collected
      await createInvoiceInPeriod(customerId, '2026-01-15');
      await createInvoiceInPeriod(customerId, '2026-02-10');

      // Create bill in period: 1 x 500 @ 15% = 75 GST paid
      await createBillInPeriod(supplierId, '2026-01-20');

      const res = await req('POST', '/api/gst-returns', {
        period: 'Jan-Feb 2026',
        startDate: '2026-01-01',
        endDate: '2026-02-28',
        dueDate: '2026-03-28',
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.data.period).toBe('Jan-Feb 2026');
      expect(body.data.status).toBe('draft');
      expect(body.data.gstCollected).toBe(300);
      expect(body.data.gstPaid).toBe(75);
      expect(body.data.netGst).toBe(225);
      expect(body.data.filedAt).toBeNull();
    });

    it('returns zero GST when no invoices/bills in period', async () => {
      const res = await req('POST', '/api/gst-returns', {
        period: 'Jul-Aug 2030',
        startDate: '2030-07-01',
        endDate: '2030-08-31',
        dueDate: '2030-09-28',
      });
      const body = await res.json();
      expect(body.data.gstCollected).toBe(0);
      expect(body.data.gstPaid).toBe(0);
      expect(body.data.netGst).toBe(0);
    });

    it('excludes invoices/bills outside the period', async () => {
      const customerId = await createContact('Customer B');
      const supplierId = await createSupplier('Supplier B');

      // Invoice outside period
      await createInvoiceInPeriod(customerId, '2025-12-15');
      // Bill outside period
      await createBillInPeriod(supplierId, '2026-03-05');

      // Invoice inside period
      await createInvoiceInPeriod(customerId, '2026-01-15');

      const res = await req('POST', '/api/gst-returns', {
        period: 'Jan-Feb 2026',
        startDate: '2026-01-01',
        endDate: '2026-02-28',
        dueDate: '2026-03-28',
      });
      const body = await res.json();
      // Only the one inside-period invoice: 1000 * 15% = 150
      expect(body.data.gstCollected).toBe(150);
      expect(body.data.gstPaid).toBe(0);
      expect(body.data.netGst).toBe(150);
    });

    it('validates required fields', async () => {
      const res = await req('POST', '/api/gst-returns', {
        period: 'Jan-Feb 2026',
      });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/gst-returns/:id', () => {
    it('returns a single GST return', async () => {
      const createRes = await req('POST', '/api/gst-returns', {
        period: 'Jan-Feb 2026',
        startDate: '2026-01-01',
        endDate: '2026-02-28',
        dueDate: '2026-03-28',
      });
      const { data: created } = await createRes.json();

      const res = await req('GET', `/api/gst-returns/${created.id}`);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.data.period).toBe('Jan-Feb 2026');
    });

    it('returns 404 for missing return', async () => {
      const res = await req('GET', '/api/gst-returns/does-not-exist');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/gst-returns/:id/file', () => {
    it('files a draft GST return', async () => {
      const createRes = await req('POST', '/api/gst-returns', {
        period: 'Jan-Feb 2026',
        startDate: '2026-01-01',
        endDate: '2026-02-28',
        dueDate: '2026-03-28',
      });
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/gst-returns/${created.id}/file`);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.data.status).toBe('filed');
      expect(typeof body.data.filedAt).toBe('string');
    });

    it('rejects filing an already filed return', async () => {
      const createRes = await req('POST', '/api/gst-returns', {
        period: 'Jan-Feb 2026',
        startDate: '2026-01-01',
        endDate: '2026-02-28',
        dueDate: '2026-03-28',
      });
      const { data: created } = await createRes.json();

      // File it
      await req('PUT', `/api/gst-returns/${created.id}/file`);
      // Try to file again
      const res = await req('PUT', `/api/gst-returns/${created.id}/file`);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('already filed');
    });

    it('returns 404 for missing return', async () => {
      const res = await req('PUT', '/api/gst-returns/does-not-exist/file');
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/gst-returns/:id', () => {
    it('deletes a draft GST return', async () => {
      const createRes = await req('POST', '/api/gst-returns', {
        period: 'Jan-Feb 2026',
        startDate: '2026-01-01',
        endDate: '2026-02-28',
        dueDate: '2026-03-28',
      });
      const { data: created } = await createRes.json();

      const delRes = await req('DELETE', `/api/gst-returns/${created.id}`);
      expect(delRes.status).toBe(200);

      const getRes = await req('GET', `/api/gst-returns/${created.id}`);
      expect(getRes.status).toBe(404);
    });

    it('rejects deleting a filed GST return', async () => {
      const createRes = await req('POST', '/api/gst-returns', {
        period: 'Jan-Feb 2026',
        startDate: '2026-01-01',
        endDate: '2026-02-28',
        dueDate: '2026-03-28',
      });
      const { data: created } = await createRes.json();

      await req('PUT', `/api/gst-returns/${created.id}/file`);
      const res = await req('DELETE', `/api/gst-returns/${created.id}`);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('Cannot delete filed');
    });

    it('returns 404 for missing return', async () => {
      const res = await req('DELETE', '/api/gst-returns/does-not-exist');
      expect(res.status).toBe(404);
    });
  });
});
