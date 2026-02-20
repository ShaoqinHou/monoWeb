import { Hono } from 'hono';
import { eq, and, gte, lte } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { CreateAccountSchema, UpdateAccountSchema } from '@xero-replica/shared';
import { accounts, journals, journalLines } from '../db/schema';
import type { Db } from '../db/index';

export function accountRoutes(db: Db) {
  const router = new Hono();

  // GET /api/accounts — List all accounts
  router.get('/', async (c) => {
    const rows = await db.select().from(accounts).all();
    return c.json({ ok: true, data: rows });
  });

  // GET /api/accounts/:code/transactions — Get transactions for an account code
  router.get('/:code/transactions', async (c) => {
    const code = c.req.param('code');
    const from = c.req.query('from');
    const to = c.req.query('to');

    // Find account by code to validate it exists
    const account = await db.select().from(accounts).where(eq(accounts.code, code)).get();
    if (!account) {
      return c.json({ ok: false, error: `Account with code '${code}' not found` }, 404);
    }

    // Query journal_lines where accountId matches the account code or account id
    // The journalLines.accountId field stores the account id or code depending on how entries were created
    const allLines = await db.select().from(journalLines).all();
    const matchingLines = allLines.filter(
      (line) => line.accountId === account.id || line.accountId === code || line.accountName === account.name,
    );

    // Get the parent journals for the matching lines
    const journalIds = [...new Set(matchingLines.map((l) => l.journalId))];
    const journalMap = new Map<string, { id: string; date: string; narration: string; status: string }>();

    for (const jId of journalIds) {
      const journal = await db.select().from(journals).where(eq(journals.id, jId)).get();
      if (journal) {
        journalMap.set(journal.id, journal);
      }
    }

    interface AccountTxn {
      id: string;
      date: string;
      description: string;
      reference: string;
      debit: number;
      credit: number;
    }

    let transactions: AccountTxn[] = [];

    for (const line of matchingLines) {
      const journal = journalMap.get(line.journalId);
      if (!journal) continue;

      // Date range filter
      if (from && journal.date < from) continue;
      if (to && journal.date > to) continue;

      transactions.push({
        id: line.id,
        date: journal.date,
        description: line.description || journal.narration,
        reference: journal.id,
        debit: line.debit,
        credit: line.credit,
      });
    }

    // Sort by date
    transactions.sort((a, b) => a.date.localeCompare(b.date));

    return c.json({ ok: true, data: transactions });
  });

  // GET /api/accounts/:id — Get single account
  router.get('/:id', async (c) => {
    const id = c.req.param('id');
    const rows = await db.select().from(accounts).where(eq(accounts.id, id)).all();
    if (rows.length === 0) {
      return c.json({ ok: false, error: 'Account not found' }, 404);
    }
    return c.json({ ok: true, data: rows[0] });
  });

  // POST /api/accounts — Create an account
  router.post('/', async (c) => {
    const body = await c.req.json();
    const parsed = CreateAccountSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ ok: false, error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const data = parsed.data;
    const id = randomUUID();

    // Check for duplicate code
    const existing = await db.select().from(accounts).where(eq(accounts.code, data.code)).all();
    if (existing.length > 0) {
      return c.json({ ok: false, error: `Account code '${data.code}' already exists` }, 409);
    }

    await db.insert(accounts).values({
      id,
      code: data.code,
      name: data.name,
      type: data.type,
      taxType: data.taxType ?? 'none',
      description: data.description ?? null,
      isArchived: data.isArchived ?? false,
    });

    const rows = await db.select().from(accounts).where(eq(accounts.id, id)).all();
    return c.json({ ok: true, data: rows[0] }, 201);
  });

  // POST /api/accounts/import — Bulk import accounts from CSV data
  router.post('/import', async (c) => {
    const body = await c.req.json();
    const rows = body.accounts as Array<{ code: string; name: string; type: string; taxType?: string }>;

    if (!Array.isArray(rows) || rows.length === 0) {
      return c.json({ ok: false, error: 'Non-empty accounts array required' }, 400);
    }

    const validTypes = ['revenue', 'expense', 'asset', 'liability', 'equity'];
    const validTaxTypes = ['output', 'input', 'none'];

    // Fetch existing codes to detect duplicates
    const existingAccounts = await db.select({ code: accounts.code }).from(accounts).all();
    const existingCodes = new Set(existingAccounts.map((a) => a.code));

    const imported: string[] = [];
    const skipped: Array<{ code: string; reason: string }> = [];

    // Also track codes being imported to detect in-batch duplicates
    const batchCodes = new Set<string>();

    for (const row of rows) {
      if (!row.code || !row.name || !row.type) {
        skipped.push({ code: row.code ?? '(empty)', reason: 'Missing required fields' });
        continue;
      }

      if (!validTypes.includes(row.type)) {
        skipped.push({ code: row.code, reason: `Invalid account type: ${row.type}` });
        continue;
      }

      if (row.taxType && !validTaxTypes.includes(row.taxType)) {
        skipped.push({ code: row.code, reason: `Invalid tax type: ${row.taxType}` });
        continue;
      }

      if (existingCodes.has(row.code) || batchCodes.has(row.code)) {
        skipped.push({ code: row.code, reason: 'Duplicate code' });
        continue;
      }

      const id = randomUUID();
      await db.insert(accounts).values({
        id,
        code: row.code,
        name: row.name,
        type: row.type as 'revenue' | 'expense' | 'asset' | 'liability' | 'equity',
        taxType: (row.taxType as 'output' | 'input' | 'none') ?? 'none',
        isArchived: false,
      });

      imported.push(row.code);
      batchCodes.add(row.code);
    }

    const message = skipped.length > 0
      ? `${imported.length} accounts imported, ${skipped.length} skipped (${skipped.map((s) => s.reason).filter((v, i, a) => a.indexOf(v) === i).join(', ')})`
      : `${imported.length} accounts imported`;

    return c.json({
      ok: true,
      data: { imported: imported.length, skipped: skipped.length, skippedDetails: skipped, message },
    }, 201);
  });

  // PUT /api/accounts/:id — Update an account
  router.put('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(accounts).where(eq(accounts.id, id)).all();
    if (existing.length === 0) {
      return c.json({ ok: false, error: 'Account not found' }, 404);
    }

    const body = await c.req.json();
    const parsed = UpdateAccountSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ ok: false, error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const data = parsed.data;
    const updates: Record<string, unknown> = {};

    if (data.code !== undefined) {
      // Check for duplicate code (different id)
      const dup = await db.select().from(accounts).where(eq(accounts.code, data.code)).all();
      if (dup.length > 0 && dup[0].id !== id) {
        return c.json({ ok: false, error: `Account code '${data.code}' already exists` }, 409);
      }
      updates.code = data.code;
    }
    if (data.name !== undefined) updates.name = data.name;
    if (data.type !== undefined) updates.type = data.type;
    if (data.taxType !== undefined) updates.taxType = data.taxType;
    if (data.description !== undefined) updates.description = data.description;
    if (data.isArchived !== undefined) updates.isArchived = data.isArchived;

    await db.update(accounts).set(updates).where(eq(accounts.id, id));
    const rows = await db.select().from(accounts).where(eq(accounts.id, id)).all();
    return c.json({ ok: true, data: rows[0] });
  });

  // DELETE /api/accounts/:id — Delete an account
  router.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(accounts).where(eq(accounts.id, id)).all();
    if (existing.length === 0) {
      return c.json({ ok: false, error: 'Account not found' }, 404);
    }

    await db.delete(accounts).where(eq(accounts.id, id));
    return c.json({ ok: true, data: { id } });
  });

  return router;
}
