import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { quotes, lineItems, contacts, invoices } from '../db/schema';
import type { Db } from '../db/index';

export function quoteRoutes(db: Db) {
  const router = new Hono();

  // Helper: fetch quote with line items
  async function getQuoteWithLineItems(id: string) {
    const rows = await db.select().from(quotes).where(eq(quotes.id, id)).all();
    if (rows.length === 0) return null;
    const quote = rows[0];
    // Quotes share the lineItems table — use invoiceId column repurposed for quoteId via reference field
    // Actually quotes have their own line items stored with quoteId pattern
    // For simplicity, store quote line items as line_items with invoiceId = quoteId (they are structurally identical)
    const items = await db.select().from(lineItems).where(eq(lineItems.invoiceId, id)).all();
    return { ...quote, lineItems: items };
  }

  // Helper: generate next quote number
  async function nextQuoteNumber(): Promise<string> {
    const prefix = 'QU-';
    const all = await db.select({ quoteNumber: quotes.quoteNumber }).from(quotes).all();
    let maxNum = 0;
    for (const row of all) {
      if (row.quoteNumber?.startsWith(prefix)) {
        const num = parseInt(row.quoteNumber.slice(prefix.length), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
    return `${prefix}${String(maxNum + 1).padStart(4, '0')}`;
  }

  // GET /api/quotes — List all quotes
  router.get('/', async (c) => {
    const rows = await db.select().from(quotes).all();
    return c.json({ ok: true, data: rows });
  });

  // GET /api/quotes/expiring — Get quotes that are expiring soon or already expired
  router.get('/expiring', async (c) => {
    const rows = await db.select().from(quotes).all();
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiring = rows.filter((q) => {
      if (q.status !== 'sent') return false;
      if (!q.expiryDate) return false;
      const expiry = new Date(q.expiryDate);
      expiry.setHours(0, 0, 0, 0);
      // Include if expiry is within 7 days from now OR already past
      return expiry <= sevenDaysFromNow;
    }).map((q) => {
      const expiry = new Date(q.expiryDate);
      expiry.setHours(0, 0, 0, 0);
      const diff = expiry.getTime() - now.getTime();
      const daysUntilExpiry = Math.floor(diff / (1000 * 60 * 60 * 24));
      const status = daysUntilExpiry < 0 ? 'expired' : 'expiring';
      return { ...q, daysUntilExpiry, expiryStatus: status };
    });

    return c.json({ ok: true, data: expiring });
  });

  // GET /api/quotes/:id — Get single quote with line items
  router.get('/:id', async (c) => {
    const id = c.req.param('id');
    const quote = await getQuoteWithLineItems(id);
    if (!quote) {
      return c.json({ ok: false, error: 'Quote not found' }, 404);
    }
    return c.json({ ok: true, data: quote });
  });

  // POST /api/quotes — Create a quote
  router.post('/', async (c) => {
    const body = await c.req.json();
    if (!body.contactId || !body.date || !body.expiryDate) {
      return c.json({ ok: false, error: 'contactId, date, and expiryDate required' }, 400);
    }

    // Verify contact exists
    const contactRows = await db.select().from(contacts).where(eq(contacts.id, body.contactId)).all();
    if (contactRows.length === 0) {
      return c.json({ ok: false, error: 'Contact not found' }, 400);
    }
    const contact = contactRows[0];

    const now = new Date().toISOString();
    const id = randomUUID();
    const quoteNumber = await nextQuoteNumber();

    // Calculate totals from line items
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

    await db.insert(quotes).values({
      id,
      quoteNumber,
      reference: body.reference ?? null,
      contactId: body.contactId,
      contactName: contact.name,
      status: 'draft',
      title: body.title ?? null,
      summary: body.summary ?? null,
      currency: body.currency ?? 'NZD',
      date: body.date,
      expiryDate: body.expiryDate,
      subTotal,
      totalTax,
      total,
      convertedInvoiceId: null,
      createdAt: now,
      updatedAt: now,
    });

    // Insert line items
    for (const li of items) {
      const qty = li.quantity ?? 1;
      const price = li.unitPrice ?? 0;
      const disc = li.discount ?? 0;
      const lineAmount = Math.round(qty * price * (1 - disc / 100) * 100) / 100;
      const taxAmount = Math.round(lineAmount * (li.taxRate ?? 15) / 100 * 100) / 100;
      await db.insert(lineItems).values({
        id: randomUUID(),
        invoiceId: id, // reuse invoiceId column for quote line items
        billId: null,
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

    const result = await getQuoteWithLineItems(id);
    return c.json({ ok: true, data: result }, 201);
  });

  // PUT /api/quotes/:id — Update a quote
  router.put('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(quotes).where(eq(quotes.id, id)).all();
    if (existing.length === 0) {
      return c.json({ ok: false, error: 'Quote not found' }, 404);
    }
    const quote = existing[0];

    if (quote.status !== 'draft') {
      return c.json({ ok: false, error: 'Only draft quotes can be edited' }, 400);
    }

    const body = await c.req.json();
    const now = new Date().toISOString();

    const updates: Record<string, unknown> = { updatedAt: now };
    if (body.contactId !== undefined) {
      const contactRows = await db.select().from(contacts).where(eq(contacts.id, body.contactId)).all();
      if (contactRows.length === 0) {
        return c.json({ ok: false, error: 'Contact not found' }, 400);
      }
      updates.contactId = body.contactId;
      updates.contactName = contactRows[0].name;
    }
    if (body.reference !== undefined) updates.reference = body.reference;
    if (body.title !== undefined) updates.title = body.title;
    if (body.summary !== undefined) updates.summary = body.summary;
    if (body.currency !== undefined) updates.currency = body.currency;
    if (body.date !== undefined) updates.date = body.date;
    if (body.expiryDate !== undefined) updates.expiryDate = body.expiryDate;

    // If line items provided, recalculate totals
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

      // Replace line items
      await db.delete(lineItems).where(eq(lineItems.invoiceId, id));
      for (const li of items) {
        const qty = li.quantity ?? 1;
        const price = li.unitPrice ?? 0;
        const disc = li.discount ?? 0;
        const lineAmount = Math.round(qty * price * (1 - disc / 100) * 100) / 100;
        const taxAmount = Math.round(lineAmount * (li.taxRate ?? 15) / 100 * 100) / 100;
        await db.insert(lineItems).values({
          id: randomUUID(),
          invoiceId: id,
          billId: null,
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

    await db.update(quotes).set(updates).where(eq(quotes.id, id));
    const result = await getQuoteWithLineItems(id);
    return c.json({ ok: true, data: result });
  });

  // PUT /api/quotes/:id/status — Transition quote status
  router.put('/:id/status', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(quotes).where(eq(quotes.id, id)).all();
    if (existing.length === 0) {
      return c.json({ ok: false, error: 'Quote not found' }, 404);
    }
    const quote = existing[0];

    const body = await c.req.json();
    const newStatus = body.status;
    const validStatuses = ['draft', 'sent', 'accepted', 'declined', 'expired', 'invoiced'];
    if (!validStatuses.includes(newStatus)) {
      return c.json({ ok: false, error: 'Invalid status' }, 400);
    }

    // Basic transition validation
    const allowedTransitions: Record<string, string[]> = {
      draft: ['sent'],
      sent: ['accepted', 'declined', 'expired'],
      accepted: ['invoiced'],
      declined: ['draft'],
      expired: ['draft'],
      invoiced: [],
    };
    if (!allowedTransitions[quote.status]?.includes(newStatus)) {
      return c.json({
        ok: false,
        error: `Cannot transition from '${quote.status}' to '${newStatus}'`,
      }, 400);
    }

    const now = new Date().toISOString();
    await db.update(quotes).set({ status: newStatus, updatedAt: now }).where(eq(quotes.id, id));

    const result = await getQuoteWithLineItems(id);
    return c.json({ ok: true, data: result });
  });

  // POST /api/quotes/batch-print-preview — Preview documents for batch printing
  router.post('/batch-print-preview', async (c) => {
    const body = await c.req.json();
    const ids: string[] = body.ids ?? [];
    if (ids.length === 0) {
      return c.json({ ok: false, error: 'No IDs provided' }, 400);
    }

    const documents = [];
    for (const quoteId of ids) {
      const rows = await db.select().from(quotes).where(eq(quotes.id, quoteId)).all();
      if (rows.length > 0) {
        const quote = rows[0];
        documents.push({
          id: quote.id,
          documentNumber: quote.quoteNumber,
          contactName: quote.contactName,
          total: quote.total,
          date: quote.date,
        });
      }
    }

    return c.json({
      ok: true,
      data: { documents, estimatedPages: documents.length },
    });
  });

  // POST /api/quotes/:id/convert — Convert quote to invoice
  router.post('/:id/convert', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(quotes).where(eq(quotes.id, id)).all();
    if (existing.length === 0) {
      return c.json({ ok: false, error: 'Quote not found' }, 404);
    }
    const quote = existing[0];

    if (quote.status !== 'accepted') {
      return c.json({ ok: false, error: 'Only accepted quotes can be converted to invoices' }, 400);
    }

    if (quote.convertedInvoiceId) {
      return c.json({ ok: false, error: 'Quote already converted to invoice' }, 400);
    }

    const now = new Date().toISOString();
    const invoiceId = randomUUID();

    // Generate invoice number
    const allInvoices = await db.select({ invoiceNumber: invoices.invoiceNumber }).from(invoices).all();
    let maxNum = 0;
    const prefix = 'INV-';
    for (const row of allInvoices) {
      if (row.invoiceNumber?.startsWith(prefix)) {
        const num = parseInt(row.invoiceNumber.slice(prefix.length), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
    const invoiceNumber = `${prefix}${String(maxNum + 1).padStart(4, '0')}`;

    // Create invoice from quote
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    await db.insert(invoices).values({
      id: invoiceId,
      invoiceNumber,
      reference: quote.reference,
      contactId: quote.contactId,
      contactName: quote.contactName,
      status: 'draft',
      amountType: 'exclusive',
      currency: quote.currency,
      date: now.split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      subTotal: quote.subTotal,
      totalTax: quote.totalTax,
      total: quote.total,
      amountDue: quote.total,
      amountPaid: 0,
      sourceQuoteId: id,
      createdAt: now,
      updatedAt: now,
    });

    // Copy line items from quote to invoice
    const quoteLineItems = await db.select().from(lineItems).where(eq(lineItems.invoiceId, id)).all();
    for (const li of quoteLineItems) {
      await db.insert(lineItems).values({
        id: randomUUID(),
        invoiceId: invoiceId,
        billId: null,
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

    // Update quote status and link
    await db.update(quotes).set({
      status: 'invoiced',
      convertedInvoiceId: invoiceId,
      updatedAt: now,
    }).where(eq(quotes.id, id));

    const result = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).get();
    return c.json({ ok: true, data: result }, 201);
  });

  return router;
}
