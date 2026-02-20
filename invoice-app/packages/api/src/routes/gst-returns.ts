import { Hono } from 'hono';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { gstReturns, invoices, bills, creditNotes, contacts, lineItems } from '../db/schema';
import type { Db } from '../db/index';

export function gstReturnRoutes(db: Db) {
  const router = new Hono();

  router.get('/', async (c) => {
    const rows = await db.select().from(gstReturns).all();
    return c.json({ ok: true, data: rows });
  });

  // GET /summary — compute totals from all GST returns
  router.get('/summary', async (c) => {
    const rows = await db.select().from(gstReturns).all();
    const taxCollected = rows.reduce((sum, r) => sum + r.gstCollected, 0);
    const taxPaid = rows.reduce((sum, r) => sum + r.gstPaid, 0);
    return c.json({
      ok: true,
      data: {
        taxCollected: Math.round(taxCollected * 100) / 100,
        taxPaid: Math.round(taxPaid * 100) / 100,
        netGSTPayable: Math.round((taxCollected - taxPaid) * 100) / 100,
        periodCount: rows.length,
      },
    });
  });

  // GET /audit-transactions — compute tax audit data from invoices + bills + credit_notes
  router.get('/audit-transactions', async (c) => {
    const dateFrom = c.req.query('dateFrom');
    const dateTo = c.req.query('dateTo');
    const taxRateFilter = c.req.query('taxRate');
    const accountFilter = c.req.query('account');

    if (!dateFrom || !dateTo) {
      return c.json({ ok: false, error: 'dateFrom and dateTo query params required' }, 400);
    }

    interface AuditTransaction {
      id: string;
      date: string;
      type: string;
      reference: string;
      contact: string;
      netAmount: number;
      taxAmount: number;
      grossAmount: number;
      taxRate: string;
      account: string;
    }

    const transactions: AuditTransaction[] = [];

    // Invoices in period
    const periodInvoices = await db.select().from(invoices)
      .where(and(gte(invoices.date, dateFrom), lte(invoices.date, dateTo)))
      .all();

    for (const inv of periodInvoices) {
      if (inv.status === 'voided') continue;
      const lines = await db.select().from(lineItems).where(eq(lineItems.invoiceId, inv.id)).all();
      // Group by tax rate and account code
      for (const line of lines) {
        const rateStr = `${line.taxRate}%`;
        const acct = line.accountCode ?? 'Sales';
        if (taxRateFilter && rateStr !== taxRateFilter) continue;
        if (accountFilter && acct !== accountFilter) continue;
        transactions.push({
          id: `inv-${inv.id}-${line.id}`,
          date: inv.date,
          type: 'Invoice',
          reference: inv.invoiceNumber ?? inv.reference ?? '',
          contact: inv.contactName,
          netAmount: line.lineAmount,
          taxAmount: line.taxAmount,
          grossAmount: Math.round((line.lineAmount + line.taxAmount) * 100) / 100,
          taxRate: rateStr,
          account: acct,
        });
      }
    }

    // Bills in period
    const periodBills = await db.select().from(bills)
      .where(and(gte(bills.date, dateFrom), lte(bills.date, dateTo)))
      .all();

    for (const bill of periodBills) {
      if (bill.status === 'voided') continue;
      const lines = await db.select().from(lineItems).where(eq(lineItems.billId, bill.id)).all();
      for (const line of lines) {
        const rateStr = `${line.taxRate}%`;
        const acct = line.accountCode ?? 'Purchases';
        if (taxRateFilter && rateStr !== taxRateFilter) continue;
        if (accountFilter && acct !== accountFilter) continue;
        transactions.push({
          id: `bill-${bill.id}-${line.id}`,
          date: bill.date,
          type: 'Bill',
          reference: bill.billNumber ?? bill.reference ?? '',
          contact: bill.contactName,
          netAmount: line.lineAmount,
          taxAmount: line.taxAmount,
          grossAmount: Math.round((line.lineAmount + line.taxAmount) * 100) / 100,
          taxRate: rateStr,
          account: acct,
        });
      }
    }

    // Credit notes in period
    const periodCreditNotes = await db.select().from(creditNotes)
      .where(and(gte(creditNotes.date, dateFrom), lte(creditNotes.date, dateTo)))
      .all();

    for (const cn of periodCreditNotes) {
      if (cn.status === 'voided') continue;
      const rateStr = cn.totalTax > 0 ? '15%' : '0%';
      const acct = cn.type === 'sales' ? 'Sales' : 'Purchases';
      if (taxRateFilter && rateStr !== taxRateFilter) continue;
      if (accountFilter && acct !== accountFilter) continue;
      transactions.push({
        id: `cn-${cn.id}`,
        date: cn.date,
        type: 'Credit Note',
        reference: cn.creditNoteNumber ?? '',
        contact: cn.contactName,
        netAmount: -cn.subTotal,
        taxAmount: -cn.totalTax,
        grossAmount: -cn.total,
        taxRate: rateStr,
        account: acct,
      });
    }

    // Sort by date
    transactions.sort((a, b) => a.date.localeCompare(b.date));

    return c.json({ ok: true, data: transactions });
  });

  router.get('/:id', async (c) => {
    const id = c.req.param('id');
    const row = await db.select().from(gstReturns).where(eq(gstReturns.id, id)).get();
    if (!row) return c.json({ ok: false, error: 'GST return not found' }, 404);
    return c.json({ ok: true, data: row });
  });

  router.post('/', async (c) => {
    const body = await c.req.json();
    if (!body.period || !body.startDate || !body.endDate || !body.dueDate) {
      return c.json({ ok: false, error: 'period, startDate, endDate, and dueDate required' }, 400);
    }

    const now = new Date().toISOString();
    const id = randomUUID();

    // Calculate GST from invoices and bills in period
    const periodInvoices = await db.select().from(invoices)
      .where(and(gte(invoices.date, body.startDate), lte(invoices.date, body.endDate)))
      .all();
    const periodBills = await db.select().from(bills)
      .where(and(gte(bills.date, body.startDate), lte(bills.date, body.endDate)))
      .all();

    let gstCollected = 0;
    for (const inv of periodInvoices) {
      if (inv.status !== 'voided') gstCollected += inv.totalTax;
    }

    let gstPaid = 0;
    for (const bill of periodBills) {
      if (bill.status !== 'voided') gstPaid += bill.totalTax;
    }

    gstCollected = Math.round(gstCollected * 100) / 100;
    gstPaid = Math.round(gstPaid * 100) / 100;
    const netGst = Math.round((gstCollected - gstPaid) * 100) / 100;

    await db.insert(gstReturns).values({
      id,
      period: body.period,
      startDate: body.startDate,
      endDate: body.endDate,
      dueDate: body.dueDate,
      status: 'draft',
      gstCollected,
      gstPaid,
      netGst,
      filedAt: null,
      createdAt: now,
    });

    const created = await db.select().from(gstReturns).where(eq(gstReturns.id, id)).get();
    return c.json({ ok: true, data: created }, 201);
  });

  router.put('/:id/file', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(gstReturns).where(eq(gstReturns.id, id)).get();
    if (!existing) return c.json({ ok: false, error: 'GST return not found' }, 404);
    if (existing.status === 'filed') return c.json({ ok: false, error: 'GST return already filed' }, 400);

    const now = new Date().toISOString();
    await db.update(gstReturns).set({ status: 'filed', filedAt: now }).where(eq(gstReturns.id, id));
    const updated = await db.select().from(gstReturns).where(eq(gstReturns.id, id)).get();
    return c.json({ ok: true, data: updated });
  });

  router.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(gstReturns).where(eq(gstReturns.id, id)).get();
    if (!existing) return c.json({ ok: false, error: 'GST return not found' }, 404);
    if (existing.status === 'filed') return c.json({ ok: false, error: 'Cannot delete filed GST return' }, 400);
    await db.delete(gstReturns).where(eq(gstReturns.id, id));
    return c.json({ ok: true, data: { id } });
  });

  return router;
}
