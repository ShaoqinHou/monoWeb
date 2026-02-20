import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import {
  CreateBillSchema,
  UpdateBillSchema,
  BillStatus,
  calcInvoiceTotals,
  calcLineItem,
  calcAmountDue,
  canTransition,
  isEditable,
  BILL_NUMBER_PREFIX,
} from '@xero-replica/shared';
import { bills, lineItems, contacts, products, stockMovements } from '../db/schema';
import type { Db } from '../db/index';
import type { InvoiceAmountType } from '@xero-replica/shared';

export function billRoutes(db: Db) {
  const router = new Hono();

  // Helper: fetch bill with line items
  async function getBillWithLineItems(id: string) {
    const rows = await db.select().from(bills).where(eq(bills.id, id)).all();
    if (rows.length === 0) return null;
    const bill = rows[0];
    const items = await db.select().from(lineItems).where(eq(lineItems.billId, id)).all();
    return { ...bill, lineItems: items };
  }

  // Helper: generate next bill number
  async function nextBillNumber(): Promise<string> {
    const all = await db.select({ billNumber: bills.billNumber }).from(bills).all();
    let maxNum = 0;
    for (const row of all) {
      if (row.billNumber?.startsWith(BILL_NUMBER_PREFIX)) {
        const num = parseInt(row.billNumber.slice(BILL_NUMBER_PREFIX.length), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
    return `${BILL_NUMBER_PREFIX}${String(maxNum + 1).padStart(4, '0')}`;
  }

  // GET /api/bills — List all bills
  router.get('/', async (c) => {
    const rows = await db.select().from(bills).all();
    return c.json({ ok: true, data: rows });
  });

  // GET /api/bills/due — Get bills due grouped by today, thisWeek, thisMonth
  router.get('/due', async (c) => {
    const rows = await db.select().from(bills).all();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const monthFromNow = new Date(today);
    monthFromNow.setDate(monthFromNow.getDate() + 30);

    const unpaid = rows.filter((b) => b.status !== 'paid' && b.status !== 'voided');

    const todayBills = unpaid.filter((b) => {
      const due = new Date(b.dueDate);
      due.setHours(0, 0, 0, 0);
      return due.getTime() === today.getTime();
    });

    const thisWeekBills = unpaid.filter((b) => {
      const due = new Date(b.dueDate);
      due.setHours(0, 0, 0, 0);
      return due > today && due <= weekFromNow;
    });

    const thisMonthBills = unpaid.filter((b) => {
      const due = new Date(b.dueDate);
      due.setHours(0, 0, 0, 0);
      return due > weekFromNow && due <= monthFromNow;
    });

    return c.json({
      ok: true,
      data: {
        today: todayBills,
        thisWeek: thisWeekBills,
        thisMonth: thisMonthBills,
      },
    });
  });

  // GET /api/bills/:id — Get single bill with line items
  router.get('/:id', async (c) => {
    const id = c.req.param('id');
    const bill = await getBillWithLineItems(id);
    if (!bill) {
      return c.json({ ok: false, error: 'Bill not found' }, 404);
    }
    return c.json({ ok: true, data: bill });
  });

  // POST /api/bills — Create a bill
  router.post('/', async (c) => {
    const body = await c.req.json();
    const parsed = CreateBillSchema.safeParse(body);
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
    const billNumber = await nextBillNumber();

    await db.insert(bills).values({
      id,
      billNumber,
      reference: data.reference ?? null,
      contactId: data.contactId,
      contactName: contact.name,
      status: 'draft',
      amountType,
      currency: data.currency ?? 'NZD',
      date: data.date,
      dueDate: data.dueDate,
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
        invoiceId: null,
        billId: id,
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

      // Increment inventory for tracked products (purchase = stock in)
      if (li.productId) {
        const productRows = await db.select().from(products).where(eq(products.id, li.productId)).all();
        if (productRows.length > 0 && productRows[0].isTracked) {
          const qty = li.quantity ?? 1;
          const newQty = productRows[0].quantityOnHand + qty;
          await db.update(products).set({
            quantityOnHand: newQty,
            updatedAt: now,
          }).where(eq(products.id, li.productId));

          await db.insert(stockMovements).values({
            id: randomUUID(),
            productId: li.productId,
            type: 'bill',
            quantity: qty,
            reason: null,
            notes: null,
            referenceId: id,
            createdAt: now,
          });
        }
      }
    }

    const result = await getBillWithLineItems(id);
    return c.json({ ok: true, data: result }, 201);
  });

  // PUT /api/bills/:id — Update a bill (draft only)
  router.put('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(bills).where(eq(bills.id, id)).all();
    if (existing.length === 0) {
      return c.json({ ok: false, error: 'Bill not found' }, 404);
    }
    const bill = existing[0];

    if (!isEditable(bill.status as Parameters<typeof isEditable>[0])) {
      return c.json({ ok: false, error: 'Only draft bills can be edited' }, 400);
    }

    const body = await c.req.json();
    const parsed = UpdateBillSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ ok: false, error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const data = parsed.data;
    const now = new Date().toISOString();

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
    if (data.amountType !== undefined) updates.amountType = data.amountType;
    if (data.currency !== undefined) updates.currency = data.currency;
    if (data.date !== undefined) updates.date = data.date;
    if (data.dueDate !== undefined) updates.dueDate = data.dueDate;

    // If line items provided, recalculate totals
    if (data.lineItems !== undefined) {
      const amountType = (data.amountType ?? bill.amountType) as InvoiceAmountType;
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
      updates.amountDue = calcAmountDue(totals.total, bill.amountPaid);

      // Replace line items
      await db.delete(lineItems).where(eq(lineItems.billId, id));
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
          invoiceId: null,
          billId: id,
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

    await db.update(bills).set(updates).where(eq(bills.id, id));
    const result = await getBillWithLineItems(id);
    return c.json({ ok: true, data: result });
  });

  // PUT /api/bills/:id/status — Transition bill status
  router.put('/:id/status', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(bills).where(eq(bills.id, id)).all();
    if (existing.length === 0) {
      return c.json({ ok: false, error: 'Bill not found' }, 404);
    }
    const bill = existing[0];

    const body = await c.req.json();
    const statusResult = BillStatus.safeParse(body.status);
    if (!statusResult.success) {
      return c.json({ ok: false, error: 'Invalid status' }, 400);
    }

    const newStatus = statusResult.data;
    // BillStatus uses same transitions as InvoiceStatus
    if (!canTransition(bill.status as Parameters<typeof canTransition>[0], newStatus as Parameters<typeof canTransition>[1])) {
      return c.json({
        ok: false,
        error: `Cannot transition from '${bill.status}' to '${newStatus}'`,
      }, 400);
    }

    const now = new Date().toISOString();
    await db.update(bills).set({ status: newStatus, updatedAt: now }).where(eq(bills.id, id));

    const result = await getBillWithLineItems(id);
    return c.json({ ok: true, data: result });
  });

  // POST /api/bills/:id/copy — Duplicate a bill as a new draft
  router.post('/:id/copy', async (c) => {
    const id = c.req.param('id');
    const original = await getBillWithLineItems(id);
    if (!original) {
      return c.json({ ok: false, error: 'Bill not found' }, 404);
    }

    const now = new Date().toISOString();
    const newId = randomUUID();
    const billNumber = await nextBillNumber();

    await db.insert(bills).values({
      id: newId,
      billNumber,
      reference: original.reference ? `Copy of ${original.reference}` : null,
      contactId: original.contactId,
      contactName: original.contactName,
      status: 'draft',
      amountType: original.amountType,
      currency: original.currency,
      date: now.slice(0, 10),
      dueDate: '',
      subTotal: original.subTotal,
      totalTax: original.totalTax,
      total: original.total,
      amountDue: original.total,
      amountPaid: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Copy line items
    for (const li of original.lineItems) {
      await db.insert(lineItems).values({
        id: randomUUID(),
        invoiceId: null,
        billId: newId,
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        accountCode: li.accountCode ?? null,
        taxRate: li.taxRate,
        taxAmount: li.taxAmount,
        lineAmount: li.lineAmount,
        discount: li.discount ?? 0,
      });
    }

    const result = await getBillWithLineItems(newId);
    return c.json({ ok: true, data: result }, 201);
  });

  // POST /api/bills/batch-print-preview — Preview documents for batch printing
  router.post('/batch-print-preview', async (c) => {
    const body = await c.req.json();
    const ids: string[] = body.ids ?? [];
    if (ids.length === 0) {
      return c.json({ ok: false, error: 'No IDs provided' }, 400);
    }

    const documents = [];
    for (const billId of ids) {
      const rows = await db.select().from(bills).where(eq(bills.id, billId)).all();
      if (rows.length > 0) {
        const bill = rows[0];
        documents.push({
          id: bill.id,
          documentNumber: bill.billNumber,
          contactName: bill.contactName,
          total: bill.total,
          date: bill.date,
        });
      }
    }

    return c.json({
      ok: true,
      data: { documents, estimatedPages: documents.length },
    });
  });

  // POST /api/bills/batch-payment — Pay multiple bills at once
  router.post('/batch-payment', async (c) => {
    const body = await c.req.json();
    const { billIds, paymentDate, bankAccount } = body;

    if (!Array.isArray(billIds) || billIds.length === 0) {
      return c.json({ ok: false, error: 'billIds must be a non-empty array' }, 400);
    }
    if (!paymentDate) {
      return c.json({ ok: false, error: 'paymentDate is required' }, 400);
    }

    const results: Array<{ billId: string; paymentId: string }> = [];

    for (const billId of billIds) {
      const existing = await db.select().from(bills).where(eq(bills.id, billId)).all();
      if (existing.length === 0) {
        return c.json({ ok: false, error: `Bill ${billId} not found` }, 404);
      }
      const bill = existing[0];

      if (bill.amountDue <= 0) {
        return c.json({ ok: false, error: `Bill ${billId} has no amount due` }, 400);
      }

      const now = new Date().toISOString();
      const paymentId = randomUUID();

      // Mark bill as paid
      await db.update(bills).set({
        status: 'paid',
        amountPaid: bill.total,
        amountDue: 0,
        updatedAt: now,
      }).where(eq(bills.id, billId));

      results.push({ billId, paymentId });
    }

    return c.json({
      ok: true,
      data: {
        count: results.length,
        payments: results,
        message: `${results.length} bill${results.length !== 1 ? 's' : ''} paid successfully`,
      },
    });
  });

  return router;
}
