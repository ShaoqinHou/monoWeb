import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { CreateExpenseSchema, UpdateExpenseSchema } from '@xero-replica/shared';
import { expenses } from '../db/schema';
import type { Db } from '../db/index';

export function expenseRoutes(db: Db) {
  const router = new Hono();

  // GET /api/expenses — List all expenses
  router.get('/', async (c) => {
    const rows = await db.select().from(expenses).all();
    return c.json({ ok: true, data: rows });
  });

  // GET /api/expenses/:id — Get single expense
  router.get('/:id', async (c) => {
    const id = c.req.param('id');
    const rows = await db.select().from(expenses).where(eq(expenses.id, id)).all();
    if (rows.length === 0) {
      return c.json({ ok: false, error: 'Expense not found' }, 404);
    }
    return c.json({ ok: true, data: rows[0] });
  });

  // POST /api/expenses — Create an expense
  router.post('/', async (c) => {
    const body = await c.req.json();
    const parsed = CreateExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ ok: false, error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const now = new Date().toISOString();
    const id = randomUUID();
    const data = parsed.data;

    const taxAmount = data.amount * (data.taxRate ?? 15) / 100;
    const total = data.amount + taxAmount;

    await db.insert(expenses).values({
      id,
      employeeId: data.employeeId ?? null,
      contactId: data.contactId ?? null,
      date: data.date,
      description: data.description,
      amount: data.amount,
      taxRate: data.taxRate ?? 15,
      taxAmount,
      total,
      category: data.category ?? null,
      receiptUrl: data.receiptUrl ?? null,
      status: 'draft',
      accountCode: data.accountCode ?? null,
      notes: data.notes ?? null,
      mileageKm: data.mileageKm ?? null,
      mileageRate: data.mileageRate ?? null,
      createdAt: now,
      updatedAt: now,
    });

    const rows = await db.select().from(expenses).where(eq(expenses.id, id)).all();
    return c.json({ ok: true, data: rows[0] }, 201);
  });

  // PUT /api/expenses/:id — Update an expense
  router.put('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(expenses).where(eq(expenses.id, id)).all();
    if (existing.length === 0) {
      return c.json({ ok: false, error: 'Expense not found' }, 404);
    }

    const body = await c.req.json();
    const parsed = UpdateExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ ok: false, error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { updatedAt: now };
    const data = parsed.data;

    if (data.employeeId !== undefined) updates.employeeId = data.employeeId;
    if (data.contactId !== undefined) updates.contactId = data.contactId;
    if (data.date !== undefined) updates.date = data.date;
    if (data.description !== undefined) updates.description = data.description;
    if (data.amount !== undefined) updates.amount = data.amount;
    if (data.taxRate !== undefined) updates.taxRate = data.taxRate;
    if (data.category !== undefined) updates.category = data.category;
    if (data.receiptUrl !== undefined) updates.receiptUrl = data.receiptUrl;
    if (data.accountCode !== undefined) updates.accountCode = data.accountCode;
    if (data.notes !== undefined) updates.notes = data.notes;
    if (data.mileageKm !== undefined) updates.mileageKm = data.mileageKm;
    if (data.mileageRate !== undefined) updates.mileageRate = data.mileageRate;

    // Recalculate tax/total if amount or taxRate changed
    const current = existing[0];
    const amount = (data.amount !== undefined ? data.amount : current.amount) as number;
    const taxRate = (data.taxRate !== undefined ? data.taxRate : current.taxRate) as number;
    updates.taxAmount = amount * taxRate / 100;
    updates.total = amount + (updates.taxAmount as number);

    await db.update(expenses).set(updates).where(eq(expenses.id, id));
    const rows = await db.select().from(expenses).where(eq(expenses.id, id)).all();
    return c.json({ ok: true, data: rows[0] });
  });

  // PUT /api/expenses/:id/status — Update expense status
  router.put('/:id/status', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(expenses).where(eq(expenses.id, id)).all();
    if (existing.length === 0) {
      return c.json({ ok: false, error: 'Expense not found' }, 404);
    }

    const body = await c.req.json();
    const { status } = body;
    const validStatuses = ['draft', 'submitted', 'approved', 'reimbursed', 'declined'];
    if (!validStatuses.includes(status)) {
      return c.json({ ok: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, 400);
    }

    const now = new Date().toISOString();
    await db.update(expenses).set({ status, updatedAt: now }).where(eq(expenses.id, id));
    const rows = await db.select().from(expenses).where(eq(expenses.id, id)).all();
    return c.json({ ok: true, data: rows[0] });
  });

  // PUT /api/expenses/:id/approve — Approve a submitted expense
  router.put('/:id/approve', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(expenses).where(eq(expenses.id, id)).all();
    if (existing.length === 0) {
      return c.json({ ok: false, error: 'Expense not found' }, 404);
    }
    const expense = existing[0];
    if (expense.status !== 'submitted') {
      return c.json({ ok: false, error: 'Only submitted expenses can be approved' }, 400);
    }

    const now = new Date().toISOString();
    await db.update(expenses).set({ status: 'approved', updatedAt: now }).where(eq(expenses.id, id));
    const rows = await db.select().from(expenses).where(eq(expenses.id, id)).all();
    return c.json({ ok: true, data: rows[0] });
  });

  // PUT /api/expenses/:id/reject — Reject a submitted or approved expense
  router.put('/:id/reject', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(expenses).where(eq(expenses.id, id)).all();
    if (existing.length === 0) {
      return c.json({ ok: false, error: 'Expense not found' }, 404);
    }
    const expense = existing[0];
    if (expense.status !== 'submitted' && expense.status !== 'approved') {
      return c.json({ ok: false, error: 'Only submitted or approved expenses can be rejected' }, 400);
    }

    const now = new Date().toISOString();
    await db.update(expenses).set({ status: 'declined', updatedAt: now }).where(eq(expenses.id, id));
    const rows = await db.select().from(expenses).where(eq(expenses.id, id)).all();
    return c.json({ ok: true, data: rows[0] });
  });

  // PUT /api/expenses/:id/reimburse — Reimburse an approved expense
  router.put('/:id/reimburse', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(expenses).where(eq(expenses.id, id)).all();
    if (existing.length === 0) {
      return c.json({ ok: false, error: 'Expense not found' }, 404);
    }
    const expense = existing[0];
    if (expense.status !== 'approved') {
      return c.json({ ok: false, error: 'Only approved expenses can be reimbursed' }, 400);
    }

    const now = new Date().toISOString();
    await db.update(expenses).set({ status: 'reimbursed', updatedAt: now }).where(eq(expenses.id, id));
    const rows = await db.select().from(expenses).where(eq(expenses.id, id)).all();
    return c.json({ ok: true, data: rows[0] });
  });

  // DELETE /api/expenses/:id — Delete an expense
  router.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(expenses).where(eq(expenses.id, id)).all();
    if (existing.length === 0) {
      return c.json({ ok: false, error: 'Expense not found' }, 404);
    }

    await db.delete(expenses).where(eq(expenses.id, id));
    return c.json({ ok: true, data: { id } });
  });

  return router;
}
