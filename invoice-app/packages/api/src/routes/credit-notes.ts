import { Hono } from 'hono';
import { eq, and, gt, asc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { creditNotes, contacts, invoices, bills } from '../db/schema';
import type { Db } from '../db/index';

export function creditNoteRoutes(db: Db) {
  const router = new Hono();

  // GET /api/credit-notes — List all credit notes
  router.get('/', async (c) => {
    const rows = await db.select().from(creditNotes).all();
    return c.json({ ok: true, data: rows });
  });

  // GET /api/credit-notes/:id — Get single credit note
  router.get('/:id', async (c) => {
    const id = c.req.param('id');
    const row = await db.select().from(creditNotes).where(eq(creditNotes.id, id)).get();
    if (!row) {
      return c.json({ ok: false, error: 'Credit note not found' }, 404);
    }
    return c.json({ ok: true, data: row });
  });

  // POST /api/credit-notes — Create a credit note
  router.post('/', async (c) => {
    const body = await c.req.json();
    if (!body.type || !body.contactId || !body.date) {
      return c.json({ ok: false, error: 'type, contactId, and date required' }, 400);
    }

    const validTypes = ['sales', 'purchase'];
    if (!validTypes.includes(body.type)) {
      return c.json({ ok: false, error: 'type must be sales or purchase' }, 400);
    }

    // Verify contact exists
    const contactRows = await db.select().from(contacts).where(eq(contacts.id, body.contactId)).all();
    if (contactRows.length === 0) {
      return c.json({ ok: false, error: 'Contact not found' }, 400);
    }
    const contact = contactRows[0];

    const now = new Date().toISOString();
    const id = randomUUID();

    // Generate credit note number
    const all = await db.select({ creditNoteNumber: creditNotes.creditNoteNumber }).from(creditNotes).all();
    let maxNum = 0;
    const prefix = 'CN-';
    for (const row of all) {
      if (row.creditNoteNumber?.startsWith(prefix)) {
        const num = parseInt(row.creditNoteNumber.slice(prefix.length), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
    const creditNoteNumber = `${prefix}${String(maxNum + 1).padStart(4, '0')}`;

    const subTotal = body.subTotal ?? 0;
    const totalTax = body.totalTax ?? 0;
    const total = body.total ?? Math.round((subTotal + totalTax) * 100) / 100;

    await db.insert(creditNotes).values({
      id,
      creditNoteNumber,
      type: body.type,
      contactId: body.contactId,
      contactName: contact.name,
      linkedInvoiceId: body.linkedInvoiceId ?? null,
      linkedBillId: body.linkedBillId ?? null,
      status: 'draft',
      date: body.date,
      subTotal,
      totalTax,
      total,
      remainingCredit: total,
      createdAt: now,
    });

    const created = await db.select().from(creditNotes).where(eq(creditNotes.id, id)).get();
    return c.json({ ok: true, data: created }, 201);
  });

  // PUT /api/credit-notes/:id/status — Transition credit note status
  router.put('/:id/status', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(creditNotes).where(eq(creditNotes.id, id)).get();
    if (!existing) {
      return c.json({ ok: false, error: 'Credit note not found' }, 404);
    }

    const body = await c.req.json();
    const newStatus = body.status;
    const validStatuses = ['draft', 'submitted', 'approved', 'applied', 'voided'];
    if (!validStatuses.includes(newStatus)) {
      return c.json({ ok: false, error: 'Invalid status' }, 400);
    }

    const allowedTransitions: Record<string, string[]> = {
      draft: ['submitted', 'voided'],
      submitted: ['approved', 'voided'],
      approved: ['applied', 'voided'],
      applied: [],
      voided: [],
    };
    if (!allowedTransitions[existing.status]?.includes(newStatus)) {
      return c.json({
        ok: false,
        error: `Cannot transition from '${existing.status}' to '${newStatus}'`,
      }, 400);
    }

    await db.update(creditNotes).set({ status: newStatus }).where(eq(creditNotes.id, id));
    const updated = await db.select().from(creditNotes).where(eq(creditNotes.id, id)).get();
    return c.json({ ok: true, data: updated });
  });

  // POST /api/credit-notes/:id/apply — Apply credit note to an invoice or bill
  router.post('/:id/apply', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(creditNotes).where(eq(creditNotes.id, id)).get();
    if (!existing) {
      return c.json({ ok: false, error: 'Credit note not found' }, 404);
    }

    if (existing.status !== 'approved') {
      return c.json({ ok: false, error: 'Only approved credit notes can be applied' }, 400);
    }

    if (existing.remainingCredit <= 0) {
      return c.json({ ok: false, error: 'No remaining credit to apply' }, 400);
    }

    const body = await c.req.json();
    const amount = body.amount;
    if (!amount || amount <= 0) {
      return c.json({ ok: false, error: 'amount must be positive' }, 400);
    }

    if (amount > existing.remainingCredit) {
      return c.json({ ok: false, error: 'Amount exceeds remaining credit' }, 400);
    }

    // Apply to invoice or bill
    if (body.invoiceId) {
      const inv = await db.select().from(invoices).where(eq(invoices.id, body.invoiceId)).get();
      if (!inv) {
        return c.json({ ok: false, error: 'Invoice not found' }, 404);
      }
      const newAmountDue = Math.max(0, Math.round((inv.amountDue - amount) * 100) / 100);
      const newAmountPaid = Math.round((inv.amountPaid + amount) * 100) / 100;
      await db.update(invoices).set({
        amountDue: newAmountDue,
        amountPaid: newAmountPaid,
      }).where(eq(invoices.id, body.invoiceId));
    } else if (body.billId) {
      const bill = await db.select().from(bills).where(eq(bills.id, body.billId)).get();
      if (!bill) {
        return c.json({ ok: false, error: 'Bill not found' }, 404);
      }
      const newAmountDue = Math.max(0, Math.round((bill.amountDue - amount) * 100) / 100);
      const newAmountPaid = Math.round((bill.amountPaid + amount) * 100) / 100;
      await db.update(bills).set({
        amountDue: newAmountDue,
        amountPaid: newAmountPaid,
      }).where(eq(bills.id, body.billId));
    } else {
      return c.json({ ok: false, error: 'invoiceId or billId required' }, 400);
    }

    const newRemaining = Math.round((existing.remainingCredit - amount) * 100) / 100;
    const newStatus = newRemaining <= 0 ? 'applied' : existing.status;

    await db.update(creditNotes).set({
      remainingCredit: newRemaining,
      status: newStatus,
      linkedInvoiceId: body.invoiceId ?? existing.linkedInvoiceId,
      linkedBillId: body.billId ?? existing.linkedBillId,
    }).where(eq(creditNotes.id, id));

    const updated = await db.select().from(creditNotes).where(eq(creditNotes.id, id)).get();
    return c.json({ ok: true, data: updated });
  });

  // POST /api/credit-notes/:id/auto-allocate — Auto-allocate credit to oldest unpaid invoices for same contact
  router.post('/:id/auto-allocate', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(creditNotes).where(eq(creditNotes.id, id)).get();
    if (!existing) {
      return c.json({ ok: false, error: 'Credit note not found' }, 404);
    }

    if (existing.status !== 'approved') {
      return c.json({ ok: false, error: 'Only approved credit notes can be auto-allocated' }, 400);
    }

    if (existing.remainingCredit <= 0) {
      return c.json({ ok: false, error: 'No remaining credit to allocate' }, 400);
    }

    // Find oldest unpaid invoices for the same contact, ordered by date ascending
    const unpaidInvoices = await db.select().from(invoices)
      .where(and(
        eq(invoices.contactId, existing.contactId),
        gt(invoices.amountDue, 0),
      ))
      .orderBy(asc(invoices.date))
      .all();

    let remainingCredit = existing.remainingCredit;
    const allocations: Array<{ invoiceId: string; invoiceNumber: string | null; amount: number }> = [];

    for (const inv of unpaidInvoices) {
      if (remainingCredit <= 0) break;

      const allocateAmount = Math.min(remainingCredit, inv.amountDue);
      const rounded = Math.round(allocateAmount * 100) / 100;

      const newAmountDue = Math.max(0, Math.round((inv.amountDue - rounded) * 100) / 100);
      const newAmountPaid = Math.round((inv.amountPaid + rounded) * 100) / 100;

      await db.update(invoices).set({
        amountDue: newAmountDue,
        amountPaid: newAmountPaid,
      }).where(eq(invoices.id, inv.id));

      remainingCredit = Math.round((remainingCredit - rounded) * 100) / 100;
      allocations.push({ invoiceId: inv.id, invoiceNumber: inv.invoiceNumber, amount: rounded });
    }

    const newStatus = remainingCredit <= 0 ? 'applied' : existing.status;

    await db.update(creditNotes).set({
      remainingCredit,
      status: newStatus,
    }).where(eq(creditNotes.id, id));

    const updated = await db.select().from(creditNotes).where(eq(creditNotes.id, id)).get();
    return c.json({ ok: true, data: { creditNote: updated, allocations } });
  });

  return router;
}
