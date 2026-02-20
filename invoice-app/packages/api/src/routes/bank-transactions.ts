import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { bankTransactions, payments, invoices, bills } from '../db/schema';
import type { Db } from '../db/index';

export function bankTransactionRoutes(db: Db) {
  const router = new Hono();

  // GET /api/bank-transactions?accountId=X
  router.get('/', async (c) => {
    const accountId = c.req.query('accountId');
    let rows;
    if (accountId) {
      rows = await db.select().from(bankTransactions).where(eq(bankTransactions.accountId, accountId)).all();
    } else {
      rows = await db.select().from(bankTransactions).all();
    }
    return c.json({ ok: true, data: rows });
  });

  // GET /api/bank-transactions/match-suggestions?amount=X&date=Y
  // Must be registered before /:id to avoid param capture
  router.get('/match-suggestions', async (c) => {
    const amountStr = c.req.query('amount');
    if (!amountStr) {
      return c.json({ ok: false, error: 'amount query parameter required' }, 400);
    }
    const amount = parseFloat(amountStr);
    if (isNaN(amount)) {
      return c.json({ ok: false, error: 'amount must be a number' }, 400);
    }

    const absAmount = Math.abs(amount);
    const isInflow = amount > 0;

    interface MatchSuggestion {
      type: 'invoice' | 'bill';
      id: string;
      reference: string;
      contact: string;
      amount: number;
      confidence: number;
    }

    const suggestions: MatchSuggestion[] = [];

    if (isInflow) {
      const allInvoices = await db.select().from(invoices).all();
      for (const inv of allInvoices) {
        if (inv.amountDue <= 0 || inv.status === 'draft' || inv.status === 'voided') continue;
        const diff = Math.abs(inv.amountDue - absAmount);
        const maxAmt = Math.max(absAmount, inv.amountDue);
        if (maxAmt > 0 && diff / maxAmt <= 0.05) {
          const confidence = 1 - diff / maxAmt;
          suggestions.push({
            type: 'invoice',
            id: inv.id,
            reference: inv.invoiceNumber ?? '',
            contact: inv.contactName,
            amount: inv.amountDue,
            confidence: Math.round(confidence * 100) / 100,
          });
        }
      }
    } else {
      const allBills = await db.select().from(bills).all();
      for (const bill of allBills) {
        if (bill.amountDue <= 0 || bill.status === 'draft' || bill.status === 'voided') continue;
        const diff = Math.abs(bill.amountDue - absAmount);
        const maxAmt = Math.max(absAmount, bill.amountDue);
        if (maxAmt > 0 && diff / maxAmt <= 0.05) {
          const confidence = 1 - diff / maxAmt;
          suggestions.push({
            type: 'bill',
            id: bill.id,
            reference: bill.billNumber ?? '',
            contact: bill.contactName,
            amount: bill.amountDue,
            confidence: Math.round(confidence * 100) / 100,
          });
        }
      }
    }

    suggestions.sort((a, b) => b.confidence - a.confidence);
    return c.json({ ok: true, data: suggestions });
  });

  // GET /api/bank-transactions/:id
  router.get('/:id', async (c) => {
    const id = c.req.param('id');
    const row = await db.select().from(bankTransactions).where(eq(bankTransactions.id, id)).get();
    if (!row) return c.json({ ok: false, error: 'Transaction not found' }, 404);
    return c.json({ ok: true, data: row });
  });

  // POST /api/bank-transactions — single transaction
  router.post('/', async (c) => {
    const body = await c.req.json();
    if (!body.accountId || !body.date || body.amount == null) {
      return c.json({ ok: false, error: 'accountId, date, and amount required' }, 400);
    }

    const id = randomUUID();
    await db.insert(bankTransactions).values({
      id,
      accountId: body.accountId,
      date: body.date,
      description: body.description ?? '',
      reference: body.reference ?? null,
      amount: body.amount,
      isReconciled: false,
      category: body.category ?? null,
    });
    const created = await db.select().from(bankTransactions).where(eq(bankTransactions.id, id)).get();
    return c.json({ ok: true, data: created }, 201);
  });

  // POST /api/bank-transactions/import — bulk import
  router.post('/import', async (c) => {
    const body = await c.req.json();
    if (!body.accountId || !Array.isArray(body.transactions)) {
      return c.json({ ok: false, error: 'accountId and transactions array required' }, 400);
    }

    const imported = [];
    for (const tx of body.transactions) {
      const id = randomUUID();
      await db.insert(bankTransactions).values({
        id,
        accountId: body.accountId,
        date: tx.date,
        description: tx.description ?? '',
        reference: tx.reference ?? null,
        amount: tx.amount,
        isReconciled: false,
      });
      imported.push(id);
    }

    return c.json({ ok: true, data: { imported: imported.length } }, 201);
  });

  // PUT /api/bank-transactions/:id/reconcile — match to invoice/bill
  router.put('/:id/reconcile', async (c) => {
    const id = c.req.param('id');
    const tx = await db.select().from(bankTransactions).where(eq(bankTransactions.id, id)).get();
    if (!tx) return c.json({ ok: false, error: 'Transaction not found' }, 404);
    if (tx.isReconciled) return c.json({ ok: false, error: 'Already reconciled' }, 400);

    const body = await c.req.json();
    const updates: Record<string, unknown> = {
      isReconciled: true,
      category: body.category ?? tx.category,
    };

    if (body.invoiceId) updates.matchedInvoiceId = body.invoiceId;
    if (body.billId) updates.matchedBillId = body.billId;
    if (body.paymentId) updates.matchedPaymentId = body.paymentId;

    await db.update(bankTransactions).set(updates).where(eq(bankTransactions.id, id));
    const updated = await db.select().from(bankTransactions).where(eq(bankTransactions.id, id)).get();
    return c.json({ ok: true, data: updated });
  });

  // DELETE /api/bank-transactions/:id
  router.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(bankTransactions).where(eq(bankTransactions.id, id)).get();
    if (!existing) return c.json({ ok: false, error: 'Transaction not found' }, 404);
    await db.delete(bankTransactions).where(eq(bankTransactions.id, id));
    return c.json({ ok: true, data: { id } });
  });

  // GET /api/bank-transactions/:id/suggestions — smart match suggestions for a transaction
  router.get('/:id/suggestions', async (c) => {
    const id = c.req.param('id');
    const tx = await db.select().from(bankTransactions).where(eq(bankTransactions.id, id)).get();
    if (!tx) return c.json({ ok: false, error: 'Transaction not found' }, 404);
    if (tx.isReconciled) return c.json({ ok: true, data: [] });

    const absAmount = Math.abs(tx.amount);
    const isInflow = tx.amount > 0;
    const descLower = tx.description.toLowerCase();

    interface Suggestion {
      type: 'invoice' | 'bill';
      id: string;
      reference: string;
      contact: string;
      amount: number;
      confidence: number;
    }

    const suggestions: Suggestion[] = [];

    if (isInflow) {
      // Match against invoices
      const allInvoices = await db.select().from(invoices).all();
      for (const inv of allInvoices) {
        if (inv.amountDue <= 0 || inv.status === 'draft' || inv.status === 'voided') continue;
        let confidence = 0;

        // Amount match (up to 60%)
        const amtDiff = Math.abs(inv.amountDue - absAmount);
        const maxAmt = Math.max(absAmount, inv.amountDue);
        if (maxAmt > 0 && amtDiff / maxAmt <= 0.05) {
          confidence += (1 - amtDiff / maxAmt) * 0.6;
        }

        // Contact name match (up to 40%)
        if (inv.contactName && descLower.includes(inv.contactName.toLowerCase())) {
          confidence += 0.4;
        }

        if (confidence > 0.1) {
          suggestions.push({
            type: 'invoice',
            id: inv.id,
            reference: inv.invoiceNumber ?? '',
            contact: inv.contactName,
            amount: inv.amountDue,
            confidence: Math.round(Math.min(confidence, 1) * 100) / 100,
          });
        }
      }
    } else {
      // Match against bills
      const allBills = await db.select().from(bills).all();
      for (const bill of allBills) {
        if (bill.amountDue <= 0 || bill.status === 'draft' || bill.status === 'voided') continue;
        let confidence = 0;

        // Amount match (up to 60%)
        const amtDiff = Math.abs(bill.amountDue - absAmount);
        const maxAmt = Math.max(absAmount, bill.amountDue);
        if (maxAmt > 0 && amtDiff / maxAmt <= 0.05) {
          confidence += (1 - amtDiff / maxAmt) * 0.6;
        }

        // Contact name match (up to 40%)
        if (bill.contactName && descLower.includes(bill.contactName.toLowerCase())) {
          confidence += 0.4;
        }

        if (confidence > 0.1) {
          suggestions.push({
            type: 'bill',
            id: bill.id,
            reference: bill.billNumber ?? '',
            contact: bill.contactName,
            amount: bill.amountDue,
            confidence: Math.round(Math.min(confidence, 1) * 100) / 100,
          });
        }
      }
    }

    // Sort by confidence descending, limit to top 5
    suggestions.sort((a, b) => b.confidence - a.confidence);
    return c.json({ ok: true, data: suggestions.slice(0, 5) });
  });

  // POST /api/bank-transactions/bulk-reconcile — reconcile multiple transactions at once
  router.post('/bulk-reconcile', async (c) => {
    const body = await c.req.json();
    const transactionIds: string[] = body.transactionIds;
    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      return c.json({ ok: false, error: 'transactionIds array required' }, 400);
    }

    let reconciled = 0;
    let failed = 0;

    for (const txId of transactionIds) {
      const tx = await db.select().from(bankTransactions).where(eq(bankTransactions.id, txId)).get();
      if (!tx || tx.isReconciled) {
        failed++;
        continue;
      }
      await db.update(bankTransactions).set({ isReconciled: true }).where(eq(bankTransactions.id, txId));
      reconciled++;
    }

    return c.json({ ok: true, data: { reconciled, failed } });
  });

  return router;
}
