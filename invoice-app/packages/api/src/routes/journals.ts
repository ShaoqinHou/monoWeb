import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { journals, journalLines } from '../db/schema';
import type { Db } from '../db/index';

export function journalRoutes(db: Db) {
  const router = new Hono();

  // GET /api/journals
  router.get('/', async (c) => {
    const rows = await db.select().from(journals).all();
    const result = [];
    for (const j of rows) {
      const lines = await db.select().from(journalLines).where(eq(journalLines.journalId, j.id)).all();
      result.push({ ...j, lines });
    }
    return c.json({ ok: true, data: result });
  });

  // GET /api/journals/:id
  router.get('/:id', async (c) => {
    const id = c.req.param('id');
    const entry = await db.select().from(journals).where(eq(journals.id, id)).get();
    if (!entry) return c.json({ ok: false, error: 'Journal entry not found' }, 404);
    const lines = await db.select().from(journalLines).where(eq(journalLines.journalId, id)).all();
    return c.json({ ok: true, data: { ...entry, lines } });
  });

  // POST /api/journals
  router.post('/', async (c) => {
    const body = await c.req.json();

    if (!body.date || !body.narration || !Array.isArray(body.lines) || body.lines.length < 2) {
      return c.json({ ok: false, error: 'Invalid journal entry: requires date, narration, and at least 2 lines' }, 400);
    }

    const totalDebit = body.lines.reduce((sum: number, l: { debit?: number }) => sum + (l.debit || 0), 0);
    const totalCredit = body.lines.reduce((sum: number, l: { credit?: number }) => sum + (l.credit || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return c.json({ ok: false, error: 'Journal entry must balance: total debits must equal total credits' }, 400);
    }

    const id = randomUUID();
    await db.insert(journals).values({
      id,
      date: body.date,
      narration: body.narration,
      status: body.status ?? 'draft',
    });

    const lineValues = body.lines.map((l: { id?: string; accountId: string; accountName?: string; description?: string; debit?: number; credit?: number }, i: number) => ({
      id: l.id ?? `${id}-line-${i}`,
      journalId: id,
      accountId: l.accountId,
      accountName: l.accountName ?? '',
      description: l.description ?? '',
      debit: l.debit ?? 0,
      credit: l.credit ?? 0,
    }));

    for (const line of lineValues) {
      await db.insert(journalLines).values(line);
    }

    const lines = await db.select().from(journalLines).where(eq(journalLines.journalId, id)).all();
    const created = await db.select().from(journals).where(eq(journals.id, id)).get();
    return c.json({ ok: true, data: { ...created, lines } }, 201);
  });

  // PUT /api/journals/:id
  router.put('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(journals).where(eq(journals.id, id)).get();
    if (!existing) return c.json({ ok: false, error: 'Journal entry not found' }, 404);
    if (existing.status === 'voided') return c.json({ ok: false, error: 'Cannot edit voided journal' }, 400);

    const body = await c.req.json();

    if (body.lines) {
      const totalDebit = body.lines.reduce((sum: number, l: { debit?: number }) => sum + (l.debit || 0), 0);
      const totalCredit = body.lines.reduce((sum: number, l: { credit?: number }) => sum + (l.credit || 0), 0);
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return c.json({ ok: false, error: 'Journal entry must balance' }, 400);
      }

      // Replace lines
      await db.delete(journalLines).where(eq(journalLines.journalId, id));
      for (let i = 0; i < body.lines.length; i++) {
        const l = body.lines[i];
        await db.insert(journalLines).values({
          id: l.id ?? `${id}-line-${i}`,
          journalId: id,
          accountId: l.accountId,
          accountName: l.accountName ?? '',
          description: l.description ?? '',
          debit: l.debit ?? 0,
          credit: l.credit ?? 0,
        });
      }
    }

    await db.update(journals).set({
      date: body.date ?? existing.date,
      narration: body.narration ?? existing.narration,
      status: body.status ?? existing.status,
    }).where(eq(journals.id, id));

    const updated = await db.select().from(journals).where(eq(journals.id, id)).get();
    const lines = await db.select().from(journalLines).where(eq(journalLines.journalId, id)).all();
    return c.json({ ok: true, data: { ...updated, lines } });
  });

  // DELETE /api/journals/:id
  router.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(journals).where(eq(journals.id, id)).get();
    if (!existing) return c.json({ ok: false, error: 'Journal entry not found' }, 404);
    await db.delete(journalLines).where(eq(journalLines.journalId, id));
    await db.delete(journals).where(eq(journals.id, id));
    return c.json({ ok: true, data: { id } });
  });

  return router;
}
