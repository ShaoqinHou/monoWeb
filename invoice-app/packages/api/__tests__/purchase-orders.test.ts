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

async function createContact(name = 'Supplier Co'): Promise<string> {
  const res = await req('POST', '/api/contacts', { name, type: 'supplier' });
  const json = await res.json();
  return json.data.id;
}

function makePOBody(contactId: string, overrides?: Record<string, unknown>) {
  return {
    contactId,
    date: '2026-01-20',
    deliveryDate: '2026-02-28',
    lineItems: [
      { description: 'Office Chairs', quantity: 10, unitPrice: 250, taxRate: 15, discount: 0 },
    ],
    ...overrides,
  };
}

describe('Purchase Orders API', () => {
  describe('GET /api/purchase-orders', () => {
    it('returns empty array when no purchase orders', async () => {
      const res = await req('GET', '/api/purchase-orders');
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toEqual([]);
    });

    it('returns all purchase orders', async () => {
      const contactId = await createContact();
      await req('POST', '/api/purchase-orders', makePOBody(contactId));
      await req('POST', '/api/purchase-orders', makePOBody(contactId));

      const res = await req('GET', '/api/purchase-orders');
      const json = await res.json();
      expect(json.data).toHaveLength(2);
    });
  });

  describe('POST /api/purchase-orders', () => {
    it('creates a PO with calculated totals and line items', async () => {
      const contactId = await createContact();
      const res = await req('POST', '/api/purchase-orders', makePOBody(contactId));
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.status).toBe('draft');
      expect(json.data.contactId).toBe(contactId);
      expect(json.data.contactName).toBe('Supplier Co');
      // 10 * 250 = 2500 exclusive, tax = 375, total = 2875
      expect(json.data.subTotal).toBe(2500);
      expect(json.data.totalTax).toBe(375);
      expect(json.data.total).toBe(2875);
      expect(json.data.poNumber).toMatch(/^PO-\d{4}$/);
      expect(json.data.lineItems).toHaveLength(1);
      expect(json.data.lineItems[0].lineAmount).toBe(2500);
      expect(json.data.lineItems[0].taxAmount).toBe(375);
    });

    it('creates PO with multiple line items', async () => {
      const contactId = await createContact();
      const body = makePOBody(contactId, {
        lineItems: [
          { description: 'Chairs', quantity: 5, unitPrice: 200, taxRate: 15, discount: 0 },
          { description: 'Desks', quantity: 3, unitPrice: 500, taxRate: 15, discount: 10 },
        ],
      });
      const res = await req('POST', '/api/purchase-orders', body);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.lineItems).toHaveLength(2);
      // Chairs: 5*200 = 1000, tax=150
      // Desks: 3*500*(0.9) = 1350, tax=202.50
      expect(json.data.subTotal).toBe(2350);
      expect(json.data.totalTax).toBe(352.5);
      expect(json.data.total).toBe(2702.5);
    });

    it('auto-increments PO numbers', async () => {
      const contactId = await createContact();
      const res1 = await req('POST', '/api/purchase-orders', makePOBody(contactId));
      const res2 = await req('POST', '/api/purchase-orders', makePOBody(contactId));
      const json1 = await res1.json();
      const json2 = await res2.json();
      expect(json1.data.poNumber).toBe('PO-0001');
      expect(json2.data.poNumber).toBe('PO-0002');
    });

    it('rejects PO with non-existent contact', async () => {
      const res = await req('POST', '/api/purchase-orders', makePOBody('00000000-0000-0000-0000-000000000000'));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Contact not found');
    });

    it('rejects PO with missing required fields', async () => {
      const res = await req('POST', '/api/purchase-orders', { contactId: 'not-uuid' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/purchase-orders/:id', () => {
    it('returns PO with line items', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/purchase-orders', makePOBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('GET', `/api/purchase-orders/${created.id}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.lineItems).toHaveLength(1);
      expect(json.data.lineItems[0].description).toBe('Office Chairs');
    });

    it('returns 404 for non-existent PO', async () => {
      const res = await req('GET', '/api/purchase-orders/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/purchase-orders/:id', () => {
    it('updates draft PO reference', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/purchase-orders', makePOBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/purchase-orders/${created.id}`, { reference: 'REQ-789' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.reference).toBe('REQ-789');
    });

    it('recalculates totals when line items updated', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/purchase-orders', makePOBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/purchase-orders/${created.id}`, {
        lineItems: [
          { description: 'Monitors', quantity: 5, unitPrice: 400, taxRate: 15, discount: 0 },
        ],
      });
      const json = await res.json();
      // 5 * 400 = 2000, tax = 300, total = 2300
      expect(json.data.subTotal).toBe(2000);
      expect(json.data.totalTax).toBe(300);
      expect(json.data.total).toBe(2300);
      expect(json.data.lineItems).toHaveLength(1);
      expect(json.data.lineItems[0].description).toBe('Monitors');
    });

    it('rejects update on non-draft PO', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/purchase-orders', makePOBody(contactId));
      const { data: created } = await createRes.json();

      await req('PUT', `/api/purchase-orders/${created.id}/status`, { status: 'submitted' });

      const res = await req('PUT', `/api/purchase-orders/${created.id}`, { reference: 'X' });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Only draft POs can be edited');
    });

    it('returns 404 for non-existent PO', async () => {
      const res = await req('PUT', '/api/purchase-orders/00000000-0000-0000-0000-000000000000', { reference: 'X' });
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/purchase-orders/:id/status', () => {
    it('transitions draft to submitted', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/purchase-orders', makePOBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/purchase-orders/${created.id}/status`, { status: 'submitted' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.status).toBe('submitted');
    });

    it('transitions submitted to approved', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/purchase-orders', makePOBody(contactId));
      const { data: created } = await createRes.json();

      await req('PUT', `/api/purchase-orders/${created.id}/status`, { status: 'submitted' });
      const res = await req('PUT', `/api/purchase-orders/${created.id}/status`, { status: 'approved' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.status).toBe('approved');
    });

    it('allows returning submitted to draft', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/purchase-orders', makePOBody(contactId));
      const { data: created } = await createRes.json();

      await req('PUT', `/api/purchase-orders/${created.id}/status`, { status: 'submitted' });
      const res = await req('PUT', `/api/purchase-orders/${created.id}/status`, { status: 'draft' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.status).toBe('draft');
    });

    it('rejects invalid transition (draft to approved)', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/purchase-orders', makePOBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/purchase-orders/${created.id}/status`, { status: 'approved' });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('Cannot transition');
    });

    it('rejects transition from billed', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/purchase-orders', makePOBody(contactId));
      const { data: created } = await createRes.json();

      await req('PUT', `/api/purchase-orders/${created.id}/status`, { status: 'submitted' });
      await req('PUT', `/api/purchase-orders/${created.id}/status`, { status: 'approved' });
      await req('PUT', `/api/purchase-orders/${created.id}/status`, { status: 'billed' });

      const res = await req('PUT', `/api/purchase-orders/${created.id}/status`, { status: 'draft' });
      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent PO', async () => {
      const res = await req('PUT', '/api/purchase-orders/00000000-0000-0000-0000-000000000000/status', { status: 'submitted' });
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/purchase-orders/:id/convert', () => {
    it('converts approved PO to bill', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/purchase-orders', makePOBody(contactId));
      const { data: created } = await createRes.json();

      await req('PUT', `/api/purchase-orders/${created.id}/status`, { status: 'submitted' });
      await req('PUT', `/api/purchase-orders/${created.id}/status`, { status: 'approved' });

      const res = await req('POST', `/api/purchase-orders/${created.id}/convert`);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.billNumber).toMatch(/^BILL-\d{4}$/);
      expect(json.data.status).toBe('draft');
      expect(json.data.contactId).toBe(contactId);
      expect(json.data.total).toBe(created.total);

      // PO should now be billed
      const poRes = await req('GET', `/api/purchase-orders/${created.id}`);
      const poJson = await poRes.json();
      expect(poJson.data.status).toBe('billed');
      expect(poJson.data.convertedBillId).toBe(json.data.id);
    });

    it('rejects converting non-approved PO', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/purchase-orders', makePOBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('POST', `/api/purchase-orders/${created.id}/convert`);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Only approved POs can be converted to bills');
    });

    it('rejects converting already-converted PO', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/purchase-orders', makePOBody(contactId));
      const { data: created } = await createRes.json();

      await req('PUT', `/api/purchase-orders/${created.id}/status`, { status: 'submitted' });
      await req('PUT', `/api/purchase-orders/${created.id}/status`, { status: 'approved' });
      await req('POST', `/api/purchase-orders/${created.id}/convert`);

      // Try again (PO is now billed, so approved check fails)
      const res = await req('POST', `/api/purchase-orders/${created.id}/convert`);
      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent PO', async () => {
      const res = await req('POST', '/api/purchase-orders/00000000-0000-0000-0000-000000000000/convert');
      expect(res.status).toBe(404);
    });
  });
});
