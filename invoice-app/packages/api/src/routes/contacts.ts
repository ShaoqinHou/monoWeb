import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { CreateContactSchema, UpdateContactSchema } from '@xero-replica/shared';
import { contacts } from '../db/schema';
import type { Db } from '../db/index';

export function contactRoutes(db: Db) {
  const router = new Hono();

  // GET /api/contacts — List all contacts
  router.get('/', async (c) => {
    const rows = await db.select().from(contacts).all();
    return c.json({ ok: true, data: rows });
  });

  // GET /api/contacts/:id — Get single contact
  router.get('/:id', async (c) => {
    const id = c.req.param('id');
    const rows = await db.select().from(contacts).where(eq(contacts.id, id)).all();
    if (rows.length === 0) {
      return c.json({ ok: false, error: 'Contact not found' }, 404);
    }
    return c.json({ ok: true, data: rows[0] });
  });

  // POST /api/contacts — Create a contact
  router.post('/', async (c) => {
    const body = await c.req.json();
    const parsed = CreateContactSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ ok: false, error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const now = new Date().toISOString();
    const id = randomUUID();
    const data = parsed.data;

    await db.insert(contacts).values({
      id,
      name: data.name,
      type: data.type,
      email: data.email ?? null,
      phone: data.phone ?? null,
      taxNumber: data.taxNumber ?? null,
      bankAccountName: data.bankAccountName ?? null,
      bankAccountNumber: data.bankAccountNumber ?? null,
      bankBSB: data.bankBSB ?? null,
      defaultAccountCode: data.defaultAccountCode ?? null,
      defaultTaxRate: data.defaultTaxRate ?? null,
      isArchived: data.isArchived ?? false,
      outstandingBalance: 0,
      overdueBalance: 0,
      createdAt: now,
      updatedAt: now,
    });

    const rows = await db.select().from(contacts).where(eq(contacts.id, id)).all();
    return c.json({ ok: true, data: rows[0] }, 201);
  });

  // PUT /api/contacts/:id — Update a contact
  router.put('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(contacts).where(eq(contacts.id, id)).all();
    if (existing.length === 0) {
      return c.json({ ok: false, error: 'Contact not found' }, 404);
    }

    const body = await c.req.json();
    const parsed = UpdateContactSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ ok: false, error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { updatedAt: now };
    const data = parsed.data;

    if (data.name !== undefined) updates.name = data.name;
    if (data.type !== undefined) updates.type = data.type;
    if (data.email !== undefined) updates.email = data.email;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.taxNumber !== undefined) updates.taxNumber = data.taxNumber;
    if (data.bankAccountName !== undefined) updates.bankAccountName = data.bankAccountName;
    if (data.bankAccountNumber !== undefined) updates.bankAccountNumber = data.bankAccountNumber;
    if (data.bankBSB !== undefined) updates.bankBSB = data.bankBSB;
    if (data.defaultAccountCode !== undefined) updates.defaultAccountCode = data.defaultAccountCode;
    if (data.defaultTaxRate !== undefined) updates.defaultTaxRate = data.defaultTaxRate;
    if (data.isArchived !== undefined) updates.isArchived = data.isArchived;

    await db.update(contacts).set(updates).where(eq(contacts.id, id));
    const rows = await db.select().from(contacts).where(eq(contacts.id, id)).all();
    return c.json({ ok: true, data: rows[0] });
  });

  // POST /api/contacts/import — Bulk import contacts from CSV
  router.post('/import', async (c) => {
    const body = await c.req.json();
    const rows = body.contacts;
    if (!Array.isArray(rows) || rows.length === 0) {
      return c.json({ ok: false, error: 'No contacts provided' }, 400);
    }

    const now = new Date().toISOString();
    const imported: unknown[] = [];

    for (const row of rows) {
      const parsed = CreateContactSchema.safeParse({
        name: row.name,
        type: row.type ?? 'customer',
        email: row.email || undefined,
        phone: row.phone || undefined,
        taxNumber: row.taxNumber || undefined,
      });
      if (!parsed.success) continue;

      const id = randomUUID();
      await db.insert(contacts).values({
        id,
        name: parsed.data.name,
        type: parsed.data.type,
        email: parsed.data.email ?? null,
        phone: parsed.data.phone ?? null,
        taxNumber: parsed.data.taxNumber ?? null,
        bankAccountName: null,
        bankAccountNumber: null,
        bankBSB: null,
        defaultAccountCode: null,
        defaultTaxRate: null,
        isArchived: false,
        outstandingBalance: 0,
        overdueBalance: 0,
        createdAt: now,
        updatedAt: now,
      });

      const created = await db.select().from(contacts).where(eq(contacts.id, id)).all();
      if (created[0]) imported.push(created[0]);
    }

    return c.json({ ok: true, data: imported }, 201);
  });

  // DELETE /api/contacts/:id — Delete a contact
  router.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(contacts).where(eq(contacts.id, id)).all();
    if (existing.length === 0) {
      return c.json({ ok: false, error: 'Contact not found' }, 404);
    }

    await db.delete(contacts).where(eq(contacts.id, id));
    return c.json({ ok: true, data: { id } });
  });

  return router;
}
