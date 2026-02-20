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

const validContact = {
  name: 'Test Customer',
  type: 'customer' as const,
  email: 'test@example.com',
};

describe('Contacts API', () => {
  describe('POST /api/contacts', () => {
    it('creates a contact with valid data', async () => {
      const res = await req('POST', '/api/contacts', validContact);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.name).toBe('Test Customer');
      expect(json.data.type).toBe('customer');
      expect(json.data.email).toBe('test@example.com');
      expect(typeof json.data.id).toBe('string');
      expect(json.data.outstandingBalance).toBe(0);
      expect(json.data.overdueBalance).toBe(0);
    });

    it('rejects contact with missing name', async () => {
      const res = await req('POST', '/api/contacts', { type: 'customer' });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error).toBe('Validation failed');
    });

    it('rejects contact with invalid type', async () => {
      const res = await req('POST', '/api/contacts', { name: 'Test', type: 'invalid' });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.ok).toBe(false);
    });

    it('creates a supplier contact', async () => {
      const res = await req('POST', '/api/contacts', { name: 'Supplier Co', type: 'supplier' });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.type).toBe('supplier');
    });

    it('creates contact with all optional fields', async () => {
      const full = {
        name: 'Full Contact',
        type: 'customer_and_supplier',
        email: 'full@example.com',
        phone: '+64 21 123 4567',
        taxNumber: 'GST-123',
        bankAccountName: 'Full Contact Ltd',
        bankAccountNumber: '12-3456-7890123-00',
        defaultAccountCode: '200',
      };
      const res = await req('POST', '/api/contacts', full);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.phone).toBe('+64 21 123 4567');
      expect(json.data.taxNumber).toBe('GST-123');
      expect(json.data.bankAccountName).toBe('Full Contact Ltd');
    });
  });

  describe('GET /api/contacts', () => {
    it('returns empty array when no contacts', async () => {
      const res = await req('GET', '/api/contacts');
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data).toEqual([]);
    });

    it('returns all contacts', async () => {
      await req('POST', '/api/contacts', validContact);
      await req('POST', '/api/contacts', { name: 'Second', type: 'supplier' });

      const res = await req('GET', '/api/contacts');
      const json = await res.json();
      expect(json.data).toHaveLength(2);
    });
  });

  describe('GET /api/contacts/:id', () => {
    it('returns a specific contact', async () => {
      const createRes = await req('POST', '/api/contacts', validContact);
      const { data: created } = await createRes.json();

      const res = await req('GET', `/api/contacts/${created.id}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.name).toBe('Test Customer');
    });

    it('returns 404 for non-existent contact', async () => {
      const res = await req('GET', '/api/contacts/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error).toBe('Contact not found');
    });
  });

  describe('PUT /api/contacts/:id', () => {
    it('updates contact name', async () => {
      const createRes = await req('POST', '/api/contacts', validContact);
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/contacts/${created.id}`, { name: 'Updated Name' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.name).toBe('Updated Name');
      expect(json.data.email).toBe('test@example.com'); // unchanged
    });

    it('updates multiple fields', async () => {
      const createRes = await req('POST', '/api/contacts', validContact);
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/contacts/${created.id}`, {
        name: 'New Name',
        type: 'supplier',
        phone: '555-1234',
      });
      const json = await res.json();
      expect(json.data.name).toBe('New Name');
      expect(json.data.type).toBe('supplier');
      expect(json.data.phone).toBe('555-1234');
    });

    it('returns 404 for non-existent contact', async () => {
      const res = await req('PUT', '/api/contacts/00000000-0000-0000-0000-000000000000', { name: 'X' });
      expect(res.status).toBe(404);
    });

    it('rejects invalid type on update', async () => {
      const createRes = await req('POST', '/api/contacts', validContact);
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/contacts/${created.id}`, { type: 'invalid' });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/contacts/:id', () => {
    it('deletes an existing contact', async () => {
      const createRes = await req('POST', '/api/contacts', validContact);
      const { data: created } = await createRes.json();

      const res = await req('DELETE', `/api/contacts/${created.id}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.id).toBe(created.id);

      // Verify deleted
      const getRes = await req('GET', `/api/contacts/${created.id}`);
      expect(getRes.status).toBe(404);
    });

    it('returns 404 for non-existent contact', async () => {
      const res = await req('DELETE', '/api/contacts/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });
  });
});
