import { Hono } from 'hono';
import { eq, lte, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { recurringBills, bills, contacts } from '../db/schema';
import type { Db } from '../db/index';

export function recurringBillRoutes(db: Db) {
  const router = new Hono();

  router.get('/', async (c) => {
    const rows = await db.select().from(recurringBills).all();
    return c.json({ ok: true, data: rows });
  });

  router.get('/:id', async (c) => {
    const id = c.req.param('id');
    const row = await db.select().from(recurringBills).where(eq(recurringBills.id, id)).get();
    if (!row) return c.json({ ok: false, error: 'Recurring bill not found' }, 404);
    return c.json({ ok: true, data: row });
  });

  router.post('/', async (c) => {
    const body = await c.req.json();
    if (!body.templateName || !body.contactId || !body.frequency || !body.nextDate) {
      return c.json({ ok: false, error: 'templateName, contactId, frequency, and nextDate required' }, 400);
    }

    const contactRows = await db.select().from(contacts).where(eq(contacts.id, body.contactId)).all();
    if (contactRows.length === 0) return c.json({ ok: false, error: 'Contact not found' }, 400);
    const contact = contactRows[0];

    const validFrequencies = ['weekly', 'fortnightly', 'monthly', 'bimonthly', 'quarterly', 'yearly'];
    if (!validFrequencies.includes(body.frequency)) return c.json({ ok: false, error: 'Invalid frequency' }, 400);

    const now = new Date().toISOString();
    const id = randomUUID();

    await db.insert(recurringBills).values({
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

    const created = await db.select().from(recurringBills).where(eq(recurringBills.id, id)).get();
    return c.json({ ok: true, data: created }, 201);
  });

  router.put('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(recurringBills).where(eq(recurringBills.id, id)).get();
    if (!existing) return c.json({ ok: false, error: 'Recurring bill not found' }, 404);

    const body = await c.req.json();
    const updates: Record<string, unknown> = {};

    if (body.templateName !== undefined) updates.templateName = body.templateName;
    if (body.contactId !== undefined) {
      const contactRows = await db.select().from(contacts).where(eq(contacts.id, body.contactId)).all();
      if (contactRows.length === 0) return c.json({ ok: false, error: 'Contact not found' }, 400);
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

    await db.update(recurringBills).set(updates).where(eq(recurringBills.id, id));
    const updated = await db.select().from(recurringBills).where(eq(recurringBills.id, id)).get();
    return c.json({ ok: true, data: updated });
  });

  router.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(recurringBills).where(eq(recurringBills.id, id)).get();
    if (!existing) return c.json({ ok: false, error: 'Recurring bill not found' }, 404);
    await db.delete(recurringBills).where(eq(recurringBills.id, id));
    return c.json({ ok: true, data: { id } });
  });

  router.post('/:id/generate', async (c) => {
    const id = c.req.param('id');
    const template = await db.select().from(recurringBills).where(eq(recurringBills.id, id)).get();
    if (!template) return c.json({ ok: false, error: 'Recurring bill not found' }, 404);
    if (template.status !== 'active') return c.json({ ok: false, error: 'Only active recurring bills can generate bills' }, 400);

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

    const dueDate = new Date(template.nextDate);
    dueDate.setDate(dueDate.getDate() + template.daysUntilDue);

    await db.insert(bills).values({
      id: billId,
      billNumber,
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

    await db.update(recurringBills).set({
      nextDate: nextDate.toISOString().split('T')[0],
      timesGenerated: template.timesGenerated + 1,
      status: newStatus,
    }).where(eq(recurringBills.id, id));

    const bill = await db.select().from(bills).where(eq(bills.id, billId)).get();
    return c.json({ ok: true, data: bill }, 201);
  });

  // POST /api/recurring-bills/generate-due — Generate bills for all active templates due today or earlier
  router.post('/generate-due', async (c) => {
    const today = new Date().toISOString().split('T')[0];
    const dueTemplates = await db.select().from(recurringBills)
      .where(and(
        eq(recurringBills.status, 'active'),
        lte(recurringBills.nextDate, today),
      ))
      .all();

    if (dueTemplates.length === 0) {
      return c.json({ ok: true, data: { generated: [] } });
    }

    const generated: Array<{ billId: string; recurringId: string; billNumber: string }> = [];

    for (const template of dueTemplates) {
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

      const dueDate = new Date(template.nextDate);
      dueDate.setDate(dueDate.getDate() + template.daysUntilDue);

      await db.insert(bills).values({
        id: billId,
        billNumber,
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

      await db.update(recurringBills).set({
        nextDate: nextDate.toISOString().split('T')[0],
        timesGenerated: template.timesGenerated + 1,
        status: newStatus,
      }).where(eq(recurringBills.id, template.id));

      generated.push({ billId, recurringId: template.id, billNumber });
    }

    return c.json({ ok: true, data: { generated } });
  });

  return router;
}
