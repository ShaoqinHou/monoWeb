import { Hono } from 'hono';
import { eq, lte, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { recurringInvoices, invoices, contacts } from '../db/schema';
import type { Db } from '../db/index';

export function recurringInvoiceRoutes(db: Db) {
  const router = new Hono();

  // GET /api/recurring-invoices — List all recurring invoices
  router.get('/', async (c) => {
    const rows = await db.select().from(recurringInvoices).all();
    return c.json({ ok: true, data: rows });
  });

  // GET /api/recurring-invoices/:id — Get single recurring invoice
  router.get('/:id', async (c) => {
    const id = c.req.param('id');
    const row = await db.select().from(recurringInvoices).where(eq(recurringInvoices.id, id)).get();
    if (!row) {
      return c.json({ ok: false, error: 'Recurring invoice not found' }, 404);
    }
    return c.json({ ok: true, data: row });
  });

  // POST /api/recurring-invoices — Create a recurring invoice template
  router.post('/', async (c) => {
    const body = await c.req.json();
    if (!body.templateName || !body.contactId || !body.frequency || !body.nextDate) {
      return c.json({ ok: false, error: 'templateName, contactId, frequency, and nextDate required' }, 400);
    }

    // Verify contact exists
    const contactRows = await db.select().from(contacts).where(eq(contacts.id, body.contactId)).all();
    if (contactRows.length === 0) {
      return c.json({ ok: false, error: 'Contact not found' }, 400);
    }
    const contact = contactRows[0];

    const validFrequencies = ['weekly', 'fortnightly', 'monthly', 'bimonthly', 'quarterly', 'yearly'];
    if (!validFrequencies.includes(body.frequency)) {
      return c.json({ ok: false, error: 'Invalid frequency' }, 400);
    }

    const now = new Date().toISOString();
    const id = randomUUID();

    await db.insert(recurringInvoices).values({
      id,
      templateName: body.templateName,
      contactId: body.contactId,
      contactName: contact.name,
      frequency: body.frequency,
      nextDate: body.nextDate,
      endDate: body.endDate ?? null,
      daysUntilDue: body.daysUntilDue ?? 30,
      status: 'active',
      subTotal: body.subTotal ?? 0,
      totalTax: body.totalTax ?? 0,
      total: body.total ?? 0,
      timesGenerated: 0,
      createdAt: now,
    });

    const created = await db.select().from(recurringInvoices).where(eq(recurringInvoices.id, id)).get();
    return c.json({ ok: true, data: created }, 201);
  });

  // PUT /api/recurring-invoices/:id — Update a recurring invoice template
  router.put('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(recurringInvoices).where(eq(recurringInvoices.id, id)).get();
    if (!existing) {
      return c.json({ ok: false, error: 'Recurring invoice not found' }, 404);
    }

    const body = await c.req.json();
    const updates: Record<string, unknown> = {};

    if (body.templateName !== undefined) updates.templateName = body.templateName;
    if (body.contactId !== undefined) {
      const contactRows = await db.select().from(contacts).where(eq(contacts.id, body.contactId)).all();
      if (contactRows.length === 0) {
        return c.json({ ok: false, error: 'Contact not found' }, 400);
      }
      updates.contactId = body.contactId;
      updates.contactName = contactRows[0].name;
    }
    if (body.frequency !== undefined) updates.frequency = body.frequency;
    if (body.nextDate !== undefined) updates.nextDate = body.nextDate;
    if (body.endDate !== undefined) updates.endDate = body.endDate;
    if (body.daysUntilDue !== undefined) updates.daysUntilDue = body.daysUntilDue;
    if (body.status !== undefined) updates.status = body.status;
    if (body.subTotal !== undefined) updates.subTotal = body.subTotal;
    if (body.totalTax !== undefined) updates.totalTax = body.totalTax;
    if (body.total !== undefined) updates.total = body.total;

    await db.update(recurringInvoices).set(updates).where(eq(recurringInvoices.id, id));
    const updated = await db.select().from(recurringInvoices).where(eq(recurringInvoices.id, id)).get();
    return c.json({ ok: true, data: updated });
  });

  // DELETE /api/recurring-invoices/:id — Delete a recurring invoice template
  router.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(recurringInvoices).where(eq(recurringInvoices.id, id)).get();
    if (!existing) {
      return c.json({ ok: false, error: 'Recurring invoice not found' }, 404);
    }
    await db.delete(recurringInvoices).where(eq(recurringInvoices.id, id));
    return c.json({ ok: true, data: { id } });
  });

  // POST /api/recurring-invoices/:id/generate — Create an invoice from the template
  router.post('/:id/generate', async (c) => {
    const id = c.req.param('id');
    const template = await db.select().from(recurringInvoices).where(eq(recurringInvoices.id, id)).get();
    if (!template) {
      return c.json({ ok: false, error: 'Recurring invoice not found' }, 404);
    }

    if (template.status !== 'active') {
      return c.json({ ok: false, error: 'Only active recurring invoices can generate invoices' }, 400);
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

    // Calculate due date
    const dueDate = new Date(template.nextDate);
    dueDate.setDate(dueDate.getDate() + template.daysUntilDue);

    await db.insert(invoices).values({
      id: invoiceId,
      invoiceNumber,
      reference: `From recurring: ${template.templateName}`,
      contactId: template.contactId,
      contactName: template.contactName,
      status: 'draft',
      amountType: 'exclusive',
      currency: 'NZD',
      date: template.nextDate,
      dueDate: dueDate.toISOString().split('T')[0],
      subTotal: template.subTotal,
      totalTax: template.totalTax,
      total: template.total,
      amountDue: template.total,
      amountPaid: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Advance nextDate based on frequency
    const nextDate = new Date(template.nextDate);
    switch (template.frequency) {
      case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
      case 'fortnightly': nextDate.setDate(nextDate.getDate() + 14); break;
      case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
      case 'bimonthly': nextDate.setMonth(nextDate.getMonth() + 2); break;
      case 'quarterly': nextDate.setMonth(nextDate.getMonth() + 3); break;
      case 'yearly': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
    }

    // Check if we've passed the end date
    let newStatus = template.status as 'active' | 'paused' | 'completed';
    if (template.endDate && nextDate.toISOString() > template.endDate) {
      newStatus = 'completed';
    }

    await db.update(recurringInvoices).set({
      nextDate: nextDate.toISOString().split('T')[0],
      timesGenerated: template.timesGenerated + 1,
      status: newStatus,
    }).where(eq(recurringInvoices.id, id));

    const invoice = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).get();
    return c.json({ ok: true, data: invoice }, 201);
  });

  // POST /api/recurring-invoices/generate-due — Generate invoices for all active templates due today or earlier
  router.post('/generate-due', async (c) => {
    const today = new Date().toISOString().split('T')[0];
    const dueTemplates = await db.select().from(recurringInvoices)
      .where(and(
        eq(recurringInvoices.status, 'active'),
        lte(recurringInvoices.nextDate, today),
      ))
      .all();

    if (dueTemplates.length === 0) {
      return c.json({ ok: true, data: { generated: [] } });
    }

    const generated: Array<{ invoiceId: string; recurringId: string; invoiceNumber: string }> = [];

    for (const template of dueTemplates) {
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

      const dueDate = new Date(template.nextDate);
      dueDate.setDate(dueDate.getDate() + template.daysUntilDue);

      await db.insert(invoices).values({
        id: invoiceId,
        invoiceNumber,
        reference: `From recurring: ${template.templateName}`,
        contactId: template.contactId,
        contactName: template.contactName,
        status: 'draft',
        amountType: 'exclusive',
        currency: 'NZD',
        date: template.nextDate,
        dueDate: dueDate.toISOString().split('T')[0],
        subTotal: template.subTotal,
        totalTax: template.totalTax,
        total: template.total,
        amountDue: template.total,
        amountPaid: 0,
        createdAt: now,
        updatedAt: now,
      });

      // Advance nextDate
      const nextDate = new Date(template.nextDate);
      switch (template.frequency) {
        case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
        case 'fortnightly': nextDate.setDate(nextDate.getDate() + 14); break;
        case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
        case 'bimonthly': nextDate.setMonth(nextDate.getMonth() + 2); break;
        case 'quarterly': nextDate.setMonth(nextDate.getMonth() + 3); break;
        case 'yearly': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
      }

      let newStatus = template.status as 'active' | 'paused' | 'completed';
      if (template.endDate && nextDate.toISOString() > template.endDate) {
        newStatus = 'completed';
      }

      await db.update(recurringInvoices).set({
        nextDate: nextDate.toISOString().split('T')[0],
        timesGenerated: template.timesGenerated + 1,
        status: newStatus,
      }).where(eq(recurringInvoices.id, template.id));

      generated.push({ invoiceId, recurringId: template.id, invoiceNumber });
    }

    return c.json({ ok: true, data: { generated } });
  });

  return router;
}
