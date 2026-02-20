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

function makeBillBody(contactId: string, overrides?: Record<string, unknown>) {
  return {
    contactId,
    date: '2026-01-20',
    dueDate: '2026-02-20',
    lineItems: [
      { description: 'Office supplies', quantity: 20, unitPrice: 25, taxRate: 15, discount: 0 },
    ],
    ...overrides,
  };
}

describe('Bills API', () => {
  describe('POST /api/bills', () => {
    it('creates a bill with calculated totals', async () => {
      const contactId = await createContact();
      const res = await req('POST', '/api/bills', makeBillBody(contactId));
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.status).toBe('draft');
      expect(json.data.contactName).toBe('Supplier Co');
      // 20 * 25 = 500 exclusive, tax = 75, total = 575
      expect(json.data.subTotal).toBe(500);
      expect(json.data.totalTax).toBe(75);
      expect(json.data.total).toBe(575);
      expect(json.data.amountDue).toBe(575);
      expect(json.data.billNumber).toMatch(/^BILL-\d{4}$/);
      expect(json.data.lineItems).toHaveLength(1);
    });

    it('auto-increments bill numbers', async () => {
      const contactId = await createContact();
      const res1 = await req('POST', '/api/bills', makeBillBody(contactId));
      const res2 = await req('POST', '/api/bills', makeBillBody(contactId));
      const json1 = await res1.json();
      const json2 = await res2.json();
      expect(json1.data.billNumber).toBe('BILL-0001');
      expect(json2.data.billNumber).toBe('BILL-0002');
    });

    it('rejects bill with no line items', async () => {
      const contactId = await createContact();
      const res = await req('POST', '/api/bills', {
        contactId,
        date: '2026-01-20',
        dueDate: '2026-02-20',
        lineItems: [],
      });
      expect(res.status).toBe(400);
    });

    it('rejects bill with non-existent contact', async () => {
      const res = await req('POST', '/api/bills', makeBillBody('00000000-0000-0000-0000-000000000000'));
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/bills', () => {
    it('returns empty array when no bills', async () => {
      const res = await req('GET', '/api/bills');
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toEqual([]);
    });

    it('returns all bills', async () => {
      const contactId = await createContact();
      await req('POST', '/api/bills', makeBillBody(contactId));
      await req('POST', '/api/bills', makeBillBody(contactId));

      const res = await req('GET', '/api/bills');
      const json = await res.json();
      expect(json.data).toHaveLength(2);
    });
  });

  describe('GET /api/bills/:id', () => {
    it('returns bill with line items', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/bills', makeBillBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('GET', `/api/bills/${created.id}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.lineItems).toHaveLength(1);
      expect(json.data.lineItems[0].description).toBe('Office supplies');
    });

    it('returns 404 for non-existent bill', async () => {
      const res = await req('GET', '/api/bills/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/bills/:id', () => {
    it('updates draft bill reference', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/bills', makeBillBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/bills/${created.id}`, { reference: 'SUPP-456' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.reference).toBe('SUPP-456');
    });

    it('recalculates totals when line items updated', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/bills', makeBillBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/bills/${created.id}`, {
        lineItems: [
          { description: 'Paper', quantity: 100, unitPrice: 10, taxRate: 15, discount: 0 },
        ],
      });
      const json = await res.json();
      expect(json.data.subTotal).toBe(1000);
      expect(json.data.totalTax).toBe(150);
      expect(json.data.total).toBe(1150);
    });

    it('rejects update on non-draft bill', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/bills', makeBillBody(contactId));
      const { data: created } = await createRes.json();

      await req('PUT', `/api/bills/${created.id}/status`, { status: 'submitted' });

      const res = await req('PUT', `/api/bills/${created.id}`, { reference: 'X' });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Only draft bills can be edited');
    });

    it('returns 404 for non-existent bill', async () => {
      const res = await req('PUT', '/api/bills/00000000-0000-0000-0000-000000000000', { reference: 'X' });
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/bills/:id/status', () => {
    it('transitions draft to submitted', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/bills', makeBillBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/bills/${created.id}/status`, { status: 'submitted' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.status).toBe('submitted');
    });

    it('transitions through full lifecycle', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/bills', makeBillBody(contactId));
      const { data: created } = await createRes.json();

      await req('PUT', `/api/bills/${created.id}/status`, { status: 'submitted' });
      await req('PUT', `/api/bills/${created.id}/status`, { status: 'approved' });

      const res = await req('GET', `/api/bills/${created.id}`);
      const json = await res.json();
      expect(json.data.status).toBe('approved');
    });

    it('rejects invalid transition (draft to approved)', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/bills', makeBillBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/bills/${created.id}/status`, { status: 'approved' });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('Cannot transition');
    });

    it('rejects invalid status value', async () => {
      const contactId = await createContact();
      const createRes = await req('POST', '/api/bills', makeBillBody(contactId));
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/bills/${created.id}/status`, { status: 'garbage' });
      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent bill', async () => {
      const res = await req('PUT', '/api/bills/00000000-0000-0000-0000-000000000000/status', { status: 'submitted' });
      expect(res.status).toBe(404);
    });
  });
});
