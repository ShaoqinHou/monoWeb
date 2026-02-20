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

const validRule = {
  name: 'Office Supplies',
  accountId: 'bank-acc-1',
  matchValue: 'Staples',
  allocateToAccountCode: '6-0200',
};

async function createRule(overrides: Record<string, unknown> = {}): Promise<string> {
  const res = await req('POST', '/api/bank-rules', { ...validRule, ...overrides });
  return (await res.json()).data.id;
}

describe('Bank Rules API', () => {
  describe('GET /api/bank-rules', () => {
    it('returns empty array when no rules', async () => {
      const res = await req('GET', '/api/bank-rules');
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data).toEqual([]);
    });

    it('returns all rules', async () => {
      await createRule();
      await createRule({ name: 'Rent Payment', matchValue: 'Rent' });
      const res = await req('GET', '/api/bank-rules');
      const json = await res.json();
      expect(json.data).toHaveLength(2);
    });
  });

  describe('POST /api/bank-rules', () => {
    it('creates a rule with valid data', async () => {
      const res = await req('POST', '/api/bank-rules', validRule);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.name).toBe('Office Supplies');
      expect(json.data.accountId).toBe('bank-acc-1');
      expect(json.data.matchValue).toBe('Staples');
      expect(json.data.allocateToAccountCode).toBe('6-0200');
      expect(typeof json.data.id).toBe('string');
    });

    it('applies default values for optional fields', async () => {
      const res = await req('POST', '/api/bank-rules', validRule);
      const json = await res.json();
      expect(json.data.matchField).toBe('description');
      expect(json.data.matchType).toBe('contains');
      expect(json.data.taxRate).toBe(15);
      expect(json.data.isActive).toBe(true);
    });

    it('creates a rule with custom matchField and matchType', async () => {
      const res = await req('POST', '/api/bank-rules', {
        ...validRule,
        matchField: 'reference',
        matchType: 'equals',
      });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.matchField).toBe('reference');
      expect(json.data.matchType).toBe('equals');
    });

    it('creates a rule with starts_with match type', async () => {
      const res = await req('POST', '/api/bank-rules', {
        ...validRule,
        matchType: 'starts_with',
      });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.matchType).toBe('starts_with');
    });

    it('creates a rule with amount matchField', async () => {
      const res = await req('POST', '/api/bank-rules', {
        ...validRule,
        matchField: 'amount',
        matchValue: '100.00',
      });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.matchField).toBe('amount');
    });

    it('rejects rule with missing name', async () => {
      const res = await req('POST', '/api/bank-rules', {
        accountId: 'bank-acc-1',
        matchValue: 'Test',
        allocateToAccountCode: '6-0200',
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.ok).toBe(false);
    });

    it('rejects rule with missing accountId', async () => {
      const res = await req('POST', '/api/bank-rules', {
        name: 'Test',
        matchValue: 'Test',
        allocateToAccountCode: '6-0200',
      });
      expect(res.status).toBe(400);
    });

    it('rejects rule with missing matchValue', async () => {
      const res = await req('POST', '/api/bank-rules', {
        name: 'Test',
        accountId: 'bank-acc-1',
        allocateToAccountCode: '6-0200',
      });
      expect(res.status).toBe(400);
    });

    it('rejects rule with missing allocateToAccountCode', async () => {
      const res = await req('POST', '/api/bank-rules', {
        name: 'Test',
        accountId: 'bank-acc-1',
        matchValue: 'Test',
      });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/bank-rules/:id', () => {
    it('returns a specific rule', async () => {
      const ruleId = await createRule();
      const res = await req('GET', `/api/bank-rules/${ruleId}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.name).toBe('Office Supplies');
    });

    it('returns 404 for non-existent rule', async () => {
      const res = await req('GET', '/api/bank-rules/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error).toBe('Bank rule not found');
    });
  });

  describe('PUT /api/bank-rules/:id', () => {
    it('updates rule name', async () => {
      const ruleId = await createRule();
      const res = await req('PUT', `/api/bank-rules/${ruleId}`, { name: 'Updated Rule' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.name).toBe('Updated Rule');
    });

    it('updates matchField and matchType', async () => {
      const ruleId = await createRule();
      const res = await req('PUT', `/api/bank-rules/${ruleId}`, {
        matchField: 'reference',
        matchType: 'equals',
      });
      const json = await res.json();
      expect(json.data.matchField).toBe('reference');
      expect(json.data.matchType).toBe('equals');
    });

    it('updates isActive to false', async () => {
      const ruleId = await createRule();
      const res = await req('PUT', `/api/bank-rules/${ruleId}`, { isActive: false });
      const json = await res.json();
      expect(json.data.isActive).toBe(false);
    });

    it('returns 404 for non-existent rule', async () => {
      const res = await req('PUT', '/api/bank-rules/00000000-0000-0000-0000-000000000000', { name: 'X' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/bank-rules/:id', () => {
    it('deletes an existing rule', async () => {
      const ruleId = await createRule();
      const res = await req('DELETE', `/api/bank-rules/${ruleId}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.id).toBe(ruleId);

      // Verify deleted
      const getRes = await req('GET', `/api/bank-rules/${ruleId}`);
      expect(getRes.status).toBe(404);
    });

    it('returns 404 for non-existent rule', async () => {
      const res = await req('DELETE', '/api/bank-rules/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });
  });
});
