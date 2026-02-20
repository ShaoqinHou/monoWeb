import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { canReceivePayment, calcAmountDue } from '@xero-replica/shared';
import { payments, invoices, bills } from '../db/schema';
import type { Db } from '../db/index';
import { z } from 'zod';

// Inline create schema to avoid the .refine() — Hono route needs direct field access
const CreatePaymentBodySchema = z.object({
  invoiceId: z.string().uuid().optional(),
  billId: z.string().uuid().optional(),
  amount: z.number().positive('Amount must be positive'),
  date: z.string(),
  reference: z.string().optional(),
  accountCode: z.string().optional(),
});

export function paymentRoutes(db: Db) {
  const router = new Hono();

  // POST /api/payments — Record a payment
  router.post('/', async (c) => {
    const body = await c.req.json();
    const parsed = CreatePaymentBodySchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ ok: false, error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const data = parsed.data;

    // Must link to invoice or bill
    if (!data.invoiceId && !data.billId) {
      return c.json({ ok: false, error: 'Payment must be linked to an invoice or bill' }, 400);
    }

    const now = new Date().toISOString();
    const id = randomUUID();

    if (data.invoiceId) {
      // Verify invoice exists and is approved
      const rows = await db.select().from(invoices).where(eq(invoices.id, data.invoiceId)).all();
      if (rows.length === 0) {
        return c.json({ ok: false, error: 'Invoice not found' }, 404);
      }
      const invoice = rows[0];
      if (!canReceivePayment(invoice.status as Parameters<typeof canReceivePayment>[0])) {
        return c.json({ ok: false, error: 'Invoice must be approved to receive payment' }, 400);
      }

      // Check payment doesn't exceed amount due
      if (data.amount > invoice.amountDue) {
        return c.json({ ok: false, error: 'Payment exceeds amount due' }, 400);
      }

      // Record payment
      await db.insert(payments).values({
        id,
        invoiceId: data.invoiceId,
        billId: null,
        amount: data.amount,
        date: data.date,
        reference: data.reference ?? null,
        accountCode: data.accountCode ?? null,
        createdAt: now,
      });

      // Update invoice amounts
      const newAmountPaid = invoice.amountPaid + data.amount;
      const newAmountDue = calcAmountDue(invoice.total, newAmountPaid);
      const newStatus = newAmountDue <= 0 ? 'paid' : invoice.status;

      await db.update(invoices).set({
        amountPaid: newAmountPaid,
        amountDue: newAmountDue,
        status: newStatus,
        updatedAt: now,
      }).where(eq(invoices.id, data.invoiceId));
    }

    if (data.billId) {
      // Verify bill exists and is approved
      const rows = await db.select().from(bills).where(eq(bills.id, data.billId)).all();
      if (rows.length === 0) {
        return c.json({ ok: false, error: 'Bill not found' }, 404);
      }
      const bill = rows[0];
      if (!canReceivePayment(bill.status as Parameters<typeof canReceivePayment>[0])) {
        return c.json({ ok: false, error: 'Bill must be approved to receive payment' }, 400);
      }

      // Check payment doesn't exceed amount due
      if (data.amount > bill.amountDue) {
        return c.json({ ok: false, error: 'Payment exceeds amount due' }, 400);
      }

      // Record payment
      await db.insert(payments).values({
        id,
        invoiceId: null,
        billId: data.billId,
        amount: data.amount,
        date: data.date,
        reference: data.reference ?? null,
        accountCode: data.accountCode ?? null,
        createdAt: now,
      });

      // Update bill amounts
      const newAmountPaid = bill.amountPaid + data.amount;
      const newAmountDue = calcAmountDue(bill.total, newAmountPaid);
      const newStatus = newAmountDue <= 0 ? 'paid' : bill.status;

      await db.update(bills).set({
        amountPaid: newAmountPaid,
        amountDue: newAmountDue,
        status: newStatus,
        updatedAt: now,
      }).where(eq(bills.id, data.billId));
    }

    const paymentRows = await db.select().from(payments).where(eq(payments.id, id)).all();
    return c.json({ ok: true, data: paymentRows[0] }, 201);
  });

  // GET /api/payments?invoiceId=X or ?billId=X
  router.get('/', async (c) => {
    const invoiceId = c.req.query('invoiceId');
    const billId = c.req.query('billId');

    if (invoiceId) {
      const rows = await db.select().from(payments).where(eq(payments.invoiceId, invoiceId)).all();
      return c.json({ ok: true, data: rows });
    }

    if (billId) {
      const rows = await db.select().from(payments).where(eq(payments.billId, billId)).all();
      return c.json({ ok: true, data: rows });
    }

    // No filter — return all
    const rows = await db.select().from(payments).all();
    return c.json({ ok: true, data: rows });
  });

  return router;
}
