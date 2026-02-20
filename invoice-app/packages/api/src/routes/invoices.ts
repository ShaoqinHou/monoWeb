import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import {
  CreateInvoiceSchema,
  UpdateInvoiceSchema,
  InvoiceStatus,
  calcInvoiceTotals,
  calcLineItem,
  calcAmountDue,
  canTransition,
  isEditable,
  INVOICE_NUMBER_PREFIX,
} from '@xero-replica/shared';
import { invoices, lineItems, contacts, creditNotes, products, stockMovements } from '../db/schema';
import type { Db } from '../db/index';
import type { InvoiceAmountType } from '@xero-replica/shared';

export function invoiceRoutes(db: Db) {
  const router = new Hono();

  // Helper: fetch invoice with line items
  async function getInvoiceWithLineItems(id: string) {
    const rows = await db.select().from(invoices).where(eq(invoices.id, id)).all();
    if (rows.length === 0) return null;
    const invoice = rows[0];
    const items = await db.select().from(lineItems).where(eq(lineItems.invoiceId, id)).all();
    return { ...invoice, lineItems: items };
  }

  // Helper: generate next invoice number
  async function nextInvoiceNumber(): Promise<string> {
    const all = await db.select({ invoiceNumber: invoices.invoiceNumber }).from(invoices).all();
    let maxNum = 0;
    for (const row of all) {
      if (row.invoiceNumber?.startsWith(INVOICE_NUMBER_PREFIX)) {
        const num = parseInt(row.invoiceNumber.slice(INVOICE_NUMBER_PREFIX.length), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
    return `${INVOICE_NUMBER_PREFIX}${String(maxNum + 1).padStart(4, '0')}`;
  }

  // GET /api/invoices — List all invoices
  router.get('/', async (c) => {
    const rows = await db.select().from(invoices).all();
    return c.json({ ok: true, data: rows });
  });

  // GET /api/invoices/overdue — Get overdue invoices
  router.get('/overdue', async (c) => {
    const filter = c.req.query('filter') as string | undefined;
    const rows = await db.select().from(invoices).all();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let overdue = rows.filter((inv) => {
      if (inv.status === 'paid' || inv.status === 'voided') return false;
      if (!inv.dueDate) return false;
      const due = new Date(inv.dueDate);
      due.setHours(0, 0, 0, 0);
      return due < today;
    }).map((inv) => {
      const due = new Date(inv.dueDate);
      due.setHours(0, 0, 0, 0);
      const diff = today.getTime() - due.getTime();
      const daysOverdue = Math.floor(diff / (1000 * 60 * 60 * 24));
      return { ...inv, daysOverdue };
    });

    // Apply filter
    if (filter === '1-30') {
      overdue = overdue.filter((inv) => inv.daysOverdue >= 1 && inv.daysOverdue <= 30);
    } else if (filter === '31-60') {
      overdue = overdue.filter((inv) => inv.daysOverdue >= 31 && inv.daysOverdue <= 60);
    } else if (filter === '60+') {
      overdue = overdue.filter((inv) => inv.daysOverdue > 60);
    }

    return c.json({ ok: true, data: overdue });
  });

  // GET /api/invoices/:id — Get single invoice with line items
  router.get('/:id', async (c) => {
    const id = c.req.param('id');
    const invoice = await getInvoiceWithLineItems(id);
    if (!invoice) {
      return c.json({ ok: false, error: 'Invoice not found' }, 404);
    }
    return c.json({ ok: true, data: invoice });
  });

  // POST /api/invoices — Create an invoice
  router.post('/', async (c) => {
    const body = await c.req.json();
    const parsed = CreateInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ ok: false, error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const data = parsed.data;

    // Verify contact exists
    const contactRows = await db.select().from(contacts).where(eq(contacts.id, data.contactId)).all();
    if (contactRows.length === 0) {
      return c.json({ ok: false, error: 'Contact not found' }, 400);
    }
    const contact = contactRows[0];

    const amountType = (data.amountType ?? 'exclusive') as InvoiceAmountType;

    // Calculate totals
    const totals = calcInvoiceTotals(
      data.lineItems.map((li) => ({
        quantity: li.quantity ?? 1,
        unitPrice: li.unitPrice ?? 0,
        discount: li.discount ?? 0,
        taxRate: li.taxRate ?? 15,
      })),
      amountType,
    );

    const now = new Date().toISOString();
    const id = randomUUID();
    const invoiceNumber = await nextInvoiceNumber();

    await db.insert(invoices).values({
      id,
      invoiceNumber,
      reference: data.reference ?? null,
      contactId: data.contactId,
      contactName: contact.name,
      status: 'draft',
      amountType,
      currency: data.currency ?? 'NZD',
      date: data.date,
      dueDate: data.dueDate,
      notes: data.notes ?? null,
      subTotal: totals.subTotal,
      totalTax: totals.totalTax,
      total: totals.total,
      amountDue: totals.total,
      amountPaid: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Insert line items
    for (const li of data.lineItems) {
      const calc = calcLineItem(
        {
          quantity: li.quantity ?? 1,
          unitPrice: li.unitPrice ?? 0,
          discount: li.discount ?? 0,
          taxRate: li.taxRate ?? 15,
        },
        amountType,
      );
      await db.insert(lineItems).values({
        id: randomUUID(),
        invoiceId: id,
        billId: null,
        productId: li.productId ?? null,
        description: li.description ?? '',
        quantity: li.quantity ?? 1,
        unitPrice: li.unitPrice ?? 0,
        accountCode: li.accountCode ?? null,
        taxRate: li.taxRate ?? 15,
        taxAmount: calc.taxAmount,
        lineAmount: calc.lineAmount,
        discount: li.discount ?? 0,
      });

      // Decrement inventory for tracked products
      if (li.productId) {
        const productRows = await db.select().from(products).where(eq(products.id, li.productId)).all();
        if (productRows.length > 0 && productRows[0].isTracked) {
          const qty = li.quantity ?? 1;
          const newQty = productRows[0].quantityOnHand - qty;
          await db.update(products).set({
            quantityOnHand: newQty,
            updatedAt: now,
          }).where(eq(products.id, li.productId));

          await db.insert(stockMovements).values({
            id: randomUUID(),
            productId: li.productId,
            type: 'invoice',
            quantity: -qty,
            reason: null,
            notes: null,
            referenceId: id,
            createdAt: now,
          });
        }
      }
    }

    const result = await getInvoiceWithLineItems(id);
    return c.json({ ok: true, data: result }, 201);
  });

  // PUT /api/invoices/:id — Update an invoice (draft only)
  router.put('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(invoices).where(eq(invoices.id, id)).all();
    if (existing.length === 0) {
      return c.json({ ok: false, error: 'Invoice not found' }, 404);
    }
    const invoice = existing[0];

    if (!isEditable(invoice.status)) {
      return c.json({ ok: false, error: 'Only draft invoices can be edited' }, 400);
    }

    const body = await c.req.json();
    const parsed = UpdateInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ ok: false, error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const data = parsed.data;
    const now = new Date().toISOString();

    // Build update set
    const updates: Record<string, unknown> = { updatedAt: now };
    if (data.contactId !== undefined) {
      const contactRows = await db.select().from(contacts).where(eq(contacts.id, data.contactId)).all();
      if (contactRows.length === 0) {
        return c.json({ ok: false, error: 'Contact not found' }, 400);
      }
      updates.contactId = data.contactId;
      updates.contactName = contactRows[0].name;
    }
    if (data.reference !== undefined) updates.reference = data.reference;
    if (data.notes !== undefined) updates.notes = data.notes;
    if (data.amountType !== undefined) updates.amountType = data.amountType;
    if (data.currency !== undefined) updates.currency = data.currency;
    if (data.date !== undefined) updates.date = data.date;
    if (data.dueDate !== undefined) updates.dueDate = data.dueDate;

    // If line items provided, recalculate totals
    if (data.lineItems !== undefined) {
      const amountType = (data.amountType ?? invoice.amountType) as InvoiceAmountType;
      const totals = calcInvoiceTotals(
        data.lineItems.map((li) => ({
          quantity: li.quantity ?? 1,
          unitPrice: li.unitPrice ?? 0,
          discount: li.discount ?? 0,
          taxRate: li.taxRate ?? 15,
        })),
        amountType,
      );
      updates.subTotal = totals.subTotal;
      updates.totalTax = totals.totalTax;
      updates.total = totals.total;
      updates.amountDue = calcAmountDue(totals.total, invoice.amountPaid);

      // Replace line items
      await db.delete(lineItems).where(eq(lineItems.invoiceId, id));
      for (const li of data.lineItems) {
        const calc = calcLineItem(
          {
            quantity: li.quantity ?? 1,
            unitPrice: li.unitPrice ?? 0,
            discount: li.discount ?? 0,
            taxRate: li.taxRate ?? 15,
          },
          amountType,
        );
        await db.insert(lineItems).values({
          id: randomUUID(),
          invoiceId: id,
          billId: null,
          productId: li.productId ?? null,
          description: li.description ?? '',
          quantity: li.quantity ?? 1,
          unitPrice: li.unitPrice ?? 0,
          accountCode: li.accountCode ?? null,
          taxRate: li.taxRate ?? 15,
          taxAmount: calc.taxAmount,
          lineAmount: calc.lineAmount,
          discount: li.discount ?? 0,
        });
      }
    }

    await db.update(invoices).set(updates).where(eq(invoices.id, id));
    const result = await getInvoiceWithLineItems(id);
    return c.json({ ok: true, data: result });
  });

  // POST /api/invoices/:id/email — Send invoice email (mock)
  router.post('/:id/email', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(invoices).where(eq(invoices.id, id)).all();
    if (existing.length === 0) {
      return c.json({ ok: false, error: 'Invoice not found' }, 404);
    }
    const body = await c.req.json();
    if (!body.to) {
      return c.json({ ok: false, error: 'Recipient email required' }, 400);
    }
    const sentAt = new Date().toISOString();
    return c.json({ ok: true, data: { ok: true, sentAt } });
  });

  // POST /api/invoices/:id/send-reminder — Send overdue reminder (mock)
  router.post('/:id/send-reminder', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(invoices).where(eq(invoices.id, id)).all();
    if (existing.length === 0) {
      return c.json({ ok: false, error: 'Invoice not found' }, 404);
    }
    const sentAt = new Date().toISOString();
    return c.json({ ok: true, data: { success: true, invoiceId: id, sentAt } });
  });

  // POST /api/invoices/:id/payment-receipt — Send payment receipt (mock)
  router.post('/:id/payment-receipt', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(invoices).where(eq(invoices.id, id)).all();
    if (existing.length === 0) {
      return c.json({ ok: false, error: 'Invoice not found' }, 404);
    }
    const sentAt = new Date().toISOString();
    return c.json({ ok: true, data: { success: true, sentAt } });
  });

  // POST /api/invoices/batch-print-preview — Preview documents for batch printing
  router.post('/batch-print-preview', async (c) => {
    const body = await c.req.json();
    const ids: string[] = body.ids ?? [];
    if (ids.length === 0) {
      return c.json({ ok: false, error: 'No IDs provided' }, 400);
    }

    const documents = [];
    for (const invId of ids) {
      const rows = await db.select().from(invoices).where(eq(invoices.id, invId)).all();
      if (rows.length > 0) {
        const inv = rows[0];
        documents.push({
          id: inv.id,
          documentNumber: inv.invoiceNumber,
          contactName: inv.contactName,
          total: inv.total,
          date: inv.date,
        });
      }
    }

    return c.json({
      ok: true,
      data: { documents, estimatedPages: documents.length },
    });
  });

  // POST /api/invoices/bulk-email — Send bulk invoice emails (mock)
  router.post('/bulk-email', async (c) => {
    const body = await c.req.json();
    const invoiceIds: string[] = body.invoiceIds ?? [];
    if (invoiceIds.length === 0) {
      return c.json({ ok: false, error: 'No invoice IDs provided' }, 400);
    }
    return c.json({ ok: true, data: { ok: true, sentCount: invoiceIds.length } });
  });

  // PUT /api/invoices/:id/status — Transition invoice status
  router.put('/:id/status', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(invoices).where(eq(invoices.id, id)).all();
    if (existing.length === 0) {
      return c.json({ ok: false, error: 'Invoice not found' }, 404);
    }
    const invoice = existing[0];

    const body = await c.req.json();
    const statusResult = InvoiceStatus.safeParse(body.status);
    if (!statusResult.success) {
      return c.json({ ok: false, error: 'Invalid status' }, 400);
    }

    const newStatus = statusResult.data;
    type StatusType = typeof newStatus;
    if (!canTransition(invoice.status as StatusType, newStatus)) {
      return c.json({
        ok: false,
        error: `Cannot transition from '${invoice.status}' to '${newStatus}'`,
      }, 400);
    }

    const now = new Date().toISOString();
    await db.update(invoices).set({ status: newStatus, updatedAt: now }).where(eq(invoices.id, id));

    const result = await getInvoiceWithLineItems(id);
    return c.json({ ok: true, data: result });
  });

  // POST /api/invoices/:id/copy — Duplicate an invoice
  router.post('/:id/copy', async (c) => {
    const id = c.req.param('id');
    const source = await getInvoiceWithLineItems(id);
    if (!source) {
      return c.json({ ok: false, error: 'Invoice not found' }, 404);
    }

    const now = new Date().toISOString();
    const today = now.split('T')[0];
    const newId = randomUUID();
    const invoiceNumber = await nextInvoiceNumber();

    await db.insert(invoices).values({
      id: newId,
      invoiceNumber,
      reference: source.reference ?? null,
      contactId: source.contactId,
      contactName: source.contactName,
      status: 'draft',
      amountType: source.amountType,
      currency: source.currency,
      date: today,
      dueDate: today,
      subTotal: source.subTotal,
      totalTax: source.totalTax,
      total: source.total,
      amountDue: source.total,
      amountPaid: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Copy line items
    for (const li of source.lineItems) {
      await db.insert(lineItems).values({
        id: randomUUID(),
        invoiceId: newId,
        billId: null,
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        accountCode: li.accountCode ?? null,
        taxRate: li.taxRate,
        taxAmount: li.taxAmount,
        lineAmount: li.lineAmount,
        discount: li.discount,
      });
    }

    const result = await getInvoiceWithLineItems(newId);
    return c.json({ ok: true, data: result }, 201);
  });

  // POST /api/invoices/:id/apply-credit — Apply a credit note to an invoice
  router.post('/:id/apply-credit', async (c) => {
    const id = c.req.param('id');
    const inv = await db.select().from(invoices).where(eq(invoices.id, id)).all();
    if (inv.length === 0) {
      return c.json({ ok: false, error: 'Invoice not found' }, 404);
    }
    const invoice = inv[0];

    const body = await c.req.json();
    const { creditNoteId, amount } = body;

    if (!creditNoteId || !amount || amount <= 0) {
      return c.json({ ok: false, error: 'creditNoteId and positive amount required' }, 400);
    }

    const cn = await db.select().from(creditNotes).where(eq(creditNotes.id, creditNoteId)).get();
    if (!cn) {
      return c.json({ ok: false, error: 'Credit note not found' }, 404);
    }

    if (cn.status !== 'approved') {
      return c.json({ ok: false, error: 'Only approved credit notes can be applied' }, 400);
    }

    if (amount > cn.remainingCredit) {
      return c.json({ ok: false, error: 'Amount exceeds remaining credit' }, 400);
    }

    if (amount > invoice.amountDue) {
      return c.json({ ok: false, error: 'Amount exceeds invoice amount due' }, 400);
    }

    const newAmountDue = Math.max(0, Math.round((invoice.amountDue - amount) * 100) / 100);
    const newAmountPaid = Math.round((invoice.amountPaid + amount) * 100) / 100;
    const newRemaining = Math.round((cn.remainingCredit - amount) * 100) / 100;
    const newCnStatus = newRemaining <= 0 ? 'applied' : cn.status;

    await db.update(invoices).set({
      amountDue: newAmountDue,
      amountPaid: newAmountPaid,
      updatedAt: new Date().toISOString(),
    }).where(eq(invoices.id, id));

    await db.update(creditNotes).set({
      remainingCredit: newRemaining,
      status: newCnStatus,
      linkedInvoiceId: id,
    }).where(eq(creditNotes.id, creditNoteId));

    return c.json({
      ok: true,
      data: {
        invoiceId: id,
        creditNoteId,
        amount,
        newAmountDue,
        newRemainingCredit: newRemaining,
      },
    });
  });

  // POST /api/invoices/bulk-approve — Approve multiple submitted invoices
  router.post('/bulk-approve', async (c) => {
    const body = await c.req.json();
    const invoiceIds: string[] = body.invoiceIds ?? [];
    if (invoiceIds.length === 0) {
      return c.json({ ok: false, error: 'No invoice IDs provided' }, 400);
    }

    const approved: string[] = [];
    const skipped: string[] = [];
    const now = new Date().toISOString();

    for (const invId of invoiceIds) {
      const rows = await db.select().from(invoices).where(eq(invoices.id, invId)).all();
      if (rows.length === 0) {
        skipped.push(invId);
        continue;
      }
      const inv = rows[0];
      if (inv.status !== 'submitted') {
        skipped.push(invId);
        continue;
      }
      await db.update(invoices).set({ status: 'approved', updatedAt: now }).where(eq(invoices.id, invId));
      approved.push(invId);
    }

    return c.json({ ok: true, data: { approved, skipped } });
  });

  return router;
}
