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

describe('Account Transactions API', () => {
  describe('GET /api/accounts/:code/transactions', () => {
    it('returns 404 for non-existent account code', async () => {
      const res = await req('GET', '/api/accounts/999/transactions');
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.ok).toBe(false);
      expect(body.error).toContain('not found');
    });

    it('returns empty array when no journal entries match', async () => {
      // Create an account
      await req('POST', '/api/accounts', {
        code: '200',
        name: 'Sales',
        type: 'revenue',
        taxType: 'output',
      });

      const res = await req('GET', '/api/accounts/200/transactions');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.data).toEqual([]);
    });

    it('returns transactions from journal entries matching account', async () => {
      // Create account
      const acctRes = await req('POST', '/api/accounts', {
        code: '200',
        name: 'Sales Revenue',
        type: 'revenue',
        taxType: 'output',
      });
      const accountId = (await acctRes.json()).data.id;

      // Create account for offsetting entry
      await req('POST', '/api/accounts', {
        code: '100',
        name: 'Cash',
        type: 'asset',
      });

      // Create a journal entry referencing this account
      await req('POST', '/api/journals', {
        date: '2026-02-10',
        narration: 'Record sale',
        lines: [
          { accountId, accountName: 'Sales Revenue', description: 'Product sale', debit: 0, credit: 1000 },
          { accountId: 'cash-id', accountName: 'Cash', description: 'Cash received', debit: 1000, credit: 0 },
        ],
      });

      const res = await req('GET', '/api/accounts/200/transactions');
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.data.length).toBe(1);
      expect(body.data[0].credit).toBe(1000);
      expect(body.data[0].debit).toBe(0);
      expect(body.data[0].date).toBe('2026-02-10');
    });

    it('filters by date range', async () => {
      // Create account
      const acctRes = await req('POST', '/api/accounts', {
        code: '300',
        name: 'Expenses',
        type: 'expense',
      });
      const accountId = (await acctRes.json()).data.id;

      // Journal in range
      await req('POST', '/api/journals', {
        date: '2026-02-15',
        narration: 'Feb expense',
        lines: [
          { accountId, accountName: 'Expenses', debit: 500, credit: 0 },
          { accountId: 'bank', accountName: 'Bank', debit: 0, credit: 500 },
        ],
      });

      // Journal out of range
      await req('POST', '/api/journals', {
        date: '2026-03-15',
        narration: 'Mar expense',
        lines: [
          { accountId, accountName: 'Expenses', debit: 300, credit: 0 },
          { accountId: 'bank', accountName: 'Bank', debit: 0, credit: 300 },
        ],
      });

      const res = await req('GET', '/api/accounts/300/transactions?from=2026-02-01&to=2026-02-28');
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.data.length).toBe(1);
      expect(body.data[0].debit).toBe(500);
    });

    it('returns all transactions when no date range specified', async () => {
      const acctRes = await req('POST', '/api/accounts', {
        code: '400',
        name: 'Revenue',
        type: 'revenue',
      });
      const accountId = (await acctRes.json()).data.id;

      await req('POST', '/api/journals', {
        date: '2026-01-10',
        narration: 'Jan revenue',
        lines: [
          { accountId, accountName: 'Revenue', debit: 0, credit: 200 },
          { accountId: 'bank', accountName: 'Bank', debit: 200, credit: 0 },
        ],
      });

      await req('POST', '/api/journals', {
        date: '2026-03-10',
        narration: 'Mar revenue',
        lines: [
          { accountId, accountName: 'Revenue', debit: 0, credit: 300 },
          { accountId: 'bank', accountName: 'Bank', debit: 300, credit: 0 },
        ],
      });

      const res = await req('GET', '/api/accounts/400/transactions');
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.data.length).toBe(2);
    });
  });
});
