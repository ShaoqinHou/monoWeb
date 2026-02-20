import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { purchaseOrders, lineItems, contacts, bills } from '../db/schema';
import type { Db } from '../db/index';

export function purchaseOrderRoutes(db: Db) {
  const router = new Hono();

  async function getPOWithLineItems(id: string) {
    const rows = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).all();
    if (rows.length === 0) return null;
    const po = rows[0];
    const items = await db.select().from(lineItems).where(eq(lineItems.billId, id)).all();
    return { ...po, lineItems: items };
  }

  async function nextPONumber(): Promise<string> {
    const prefix = 'PO-';
    const all = await db.select({ poNumber: purchaseOrders.poNumber }).from(purchaseOrders).all();
    let maxNum = 0;
    for (const row of all) {
      if (row.poNumber?.startsWith(prefix)) {
        const num = parseInt(row.poNumber.slice(prefix.length), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
    return `${prefix}${String(maxNum + 1).padStart(4, '0')}`;
  }

  router.get('/', async (c) => {
    const rows = await db.select().from(purchaseOrders).all();
    return c.json({ ok: true, data: rows });
  });

  router.get('/:id', async (c) => {
    const id = c.req.param('id');
    const po = await getPOWithLineItems(id);
    if (!po) return c.json({ ok: false, error: 'Purchase order not found' }, 404);
    return c.json({ ok: true, data: po });
  });

  router.post('/', async (c) => {
    const body = await c.req.json();
    if (!body.contactId || !body.date) {
      return c.json({ ok: false, error: 'contactId and date required' }, 400);
    }

    const contactRows = await db.select().from(contacts).where(eq(contacts.id, body.contactId)).all();
    if (contactRows.length === 0) return c.json({ ok: false, error: 'Contact not found' }, 400);
    const contact = contactRows[0];

    const now = new Date().toISOString();
    const id = randomUUID();
    const poNumber = await nextPONumber();

    const items: Array<{ description?: string; quantity?: number; unitPrice?: number; accountCode?: string; taxRate?: number; discount?: number }> = body.lineItems ?? [];
    let subTotal = 0;
    let totalTax = 0;
    for (const li of items) {
      const qty = li.quantity ?? 1;
      const price = li.unitPrice ?? 0;
      const disc = li.discount ?? 0;
      const lineAmount = qty * price * (1 - disc / 100);
      const tax = lineAmount * (li.taxRate ?? 15) / 100;
      subTotal += lineAmount;
      totalTax += tax;
    }
    const total = Math.round((subTotal + totalTax) * 100) / 100;
    subTotal = Math.round(subTotal * 100) / 100;
    totalTax = Math.round(totalTax * 100) / 100;

    await db.insert(purchaseOrders).values({
      id,
      poNumber,
      reference: body.reference ?? null,
      contactId: body.contactId,
      contactName: contact.name,
      status: 'draft',
      deliveryDate: body.deliveryDate ?? null,
      deliveryAddress: body.deliveryAddress ?? null,
      currency: body.currency ?? 'NZD',
      date: body.date,
      subTotal,
      totalTax,
      total,
      convertedBillId: null,
      createdAt: now,
      updatedAt: now,
    });

    for (const li of items) {
      const qty = li.quantity ?? 1;
      const price = li.unitPrice ?? 0;
      const disc = li.discount ?? 0;
      const lineAmount = Math.round(qty * price * (1 - disc / 100) * 100) / 100;
      const taxAmount = Math.round(lineAmount * (li.taxRate ?? 15) / 100 * 100) / 100;
      await db.insert(lineItems).values({
        id: randomUUID(),
        invoiceId: null,
        billId: id,
        description: li.description ?? '',
        quantity: qty,
        unitPrice: price,
        accountCode: li.accountCode ?? null,
        taxRate: li.taxRate ?? 15,
        taxAmount,
        lineAmount,
        discount: disc,
      });
    }

    const result = await getPOWithLineItems(id);
    return c.json({ ok: true, data: result }, 201);
  });

  router.put('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).all();
    if (existing.length === 0) return c.json({ ok: false, error: 'Purchase order not found' }, 404);
    if (existing[0].status !== 'draft') return c.json({ ok: false, error: 'Only draft POs can be edited' }, 400);

    const body = await c.req.json();
    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { updatedAt: now };

    if (body.contactId !== undefined) {
      const contactRows = await db.select().from(contacts).where(eq(contacts.id, body.contactId)).all();
      if (contactRows.length === 0) return c.json({ ok: false, error: 'Contact not found' }, 400);
      updates.contactId = body.contactId;
      updates.contactName = contactRows[0].name;
    }
    if (body.reference !== undefined) updates.reference = body.reference;
    if (body.deliveryDate !== undefined) updates.deliveryDate = body.deliveryDate;
    if (body.deliveryAddress !== undefined) updates.deliveryAddress = body.deliveryAddress;
    if (body.date !== undefined) updates.date = body.date;

    if (body.lineItems !== undefined) {
      const items: Array<{ description?: string; quantity?: number; unitPrice?: number; accountCode?: string; taxRate?: number; discount?: number }> = body.lineItems;
      let subTotal = 0;
      let totalTax = 0;
      for (const li of items) {
        const qty = li.quantity ?? 1;
        const price = li.unitPrice ?? 0;
        const disc = li.discount ?? 0;
        const lineAmount = qty * price * (1 - disc / 100);
        const tax = lineAmount * (li.taxRate ?? 15) / 100;
        subTotal += lineAmount;
        totalTax += tax;
      }
      updates.subTotal = Math.round(subTotal * 100) / 100;
      updates.totalTax = Math.round(totalTax * 100) / 100;
      updates.total = Math.round((subTotal + totalTax) * 100) / 100;

      await db.delete(lineItems).where(eq(lineItems.billId, id));
      for (const li of items) {
        const qty = li.quantity ?? 1;
        const price = li.unitPrice ?? 0;
        const disc = li.discount ?? 0;
        const lineAmount = Math.round(qty * price * (1 - disc / 100) * 100) / 100;
        const taxAmount = Math.round(lineAmount * (li.taxRate ?? 15) / 100 * 100) / 100;
        await db.insert(lineItems).values({
          id: randomUUID(),
          invoiceId: null,
          billId: id,
          description: li.description ?? '',
          quantity: qty,
          unitPrice: price,
          accountCode: li.accountCode ?? null,
          taxRate: li.taxRate ?? 15,
          taxAmount,
          lineAmount,
          discount: disc,
        });
      }
    }

    await db.update(purchaseOrders).set(updates).where(eq(purchaseOrders.id, id));
    const result = await getPOWithLineItems(id);
    return c.json({ ok: true, data: result });
  });

  router.put('/:id/status', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).all();
    if (existing.length === 0) return c.json({ ok: false, error: 'Purchase order not found' }, 404);
    const po = existing[0];

    const body = await c.req.json();
    const newStatus = body.status;
    const allowedTransitions: Record<string, string[]> = {
      draft: ['submitted'],
      submitted: ['approved', 'draft'],
      approved: ['billed', 'closed'],
      billed: [],
      closed: [],
    };
    if (!allowedTransitions[po.status]?.includes(newStatus)) {
      return c.json({ ok: false, error: `Cannot transition from '${po.status}' to '${newStatus}'` }, 400);
    }

    const now = new Date().toISOString();
    await db.update(purchaseOrders).set({ status: newStatus, updatedAt: now }).where(eq(purchaseOrders.id, id));
    const result = await getPOWithLineItems(id);
    return c.json({ ok: true, data: result });
  });

  // PUT /:id/approve — Approve a submitted PO
  router.put('/:id/approve', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).all();
    if (existing.length === 0) return c.json({ ok: false, error: 'Purchase order not found' }, 404);
    const po = existing[0];

    if (po.status !== 'submitted') {
      return c.json({ ok: false, error: 'Only submitted POs can be approved' }, 400);
    }

    const now = new Date().toISOString();
    await db.update(purchaseOrders).set({ status: 'approved', updatedAt: now }).where(eq(purchaseOrders.id, id));
    const result = await getPOWithLineItems(id);
    return c.json({ ok: true, data: result });
  });

  // PUT /:id/reject — Reject a submitted PO
  router.put('/:id/reject', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).all();
    if (existing.length === 0) return c.json({ ok: false, error: 'Purchase order not found' }, 404);
    const po = existing[0];

    if (po.status !== 'submitted') {
      return c.json({ ok: false, error: 'Only submitted POs can be rejected' }, 400);
    }

    const now = new Date().toISOString();
    await db.update(purchaseOrders).set({ status: 'draft', updatedAt: now }).where(eq(purchaseOrders.id, id));
    const result = await getPOWithLineItems(id);
    return c.json({ ok: true, data: result });
  });

  router.post('/:id/convert', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).all();
    if (existing.length === 0) return c.json({ ok: false, error: 'Purchase order not found' }, 404);
    const po = existing[0];

    if (po.status !== 'approved') return c.json({ ok: false, error: 'Only approved POs can be converted to bills' }, 400);
    if (po.convertedBillId) return c.json({ ok: false, error: 'PO already converted to bill' }, 400);

    const now = new Date().toISOString();
    const billId = randomUUID();

    const allBills = await db.select({ billNumber: bills.billNumber }).from(bills).all();
    let maxNum = 0;
    const prefix = 'BILL-';
    for (const row of allBills) {
      if (row.billNumber?.startsWith(prefix)) {
        const num = parseInt(row.billNumber.slice(prefix.length), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
    const billNumber = `${prefix}${String(maxNum + 1).padStart(4, '0')}`;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    await db.insert(bills).values({
      id: billId,
      billNumber,
      reference: po.reference,
      contactId: po.contactId,
      contactName: po.contactName,
      status: 'draft',
      amountType: 'exclusive',
      currency: po.currency,
      date: now.split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      subTotal: po.subTotal,
      totalTax: po.totalTax,
      total: po.total,
      amountDue: po.total,
      amountPaid: 0,
      sourcePurchaseOrderId: id,
      createdAt: now,
      updatedAt: now,
    });

    const poLineItems = await db.select().from(lineItems).where(eq(lineItems.billId, id)).all();
    for (const li of poLineItems) {
      await db.insert(lineItems).values({
        id: randomUUID(),
        invoiceId: null,
        billId: billId,
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        accountCode: li.accountCode,
        taxRate: li.taxRate,
        taxAmount: li.taxAmount,
        lineAmount: li.lineAmount,
        discount: li.discount,
      });
    }

    await db.update(purchaseOrders).set({
      status: 'billed',
      convertedBillId: billId,
      updatedAt: now,
    }).where(eq(purchaseOrders.id, id));

    const result = await db.select().from(bills).where(eq(bills.id, billId)).get();
    return c.json({ ok: true, data: result }, 201);
  });

  return router;
}
