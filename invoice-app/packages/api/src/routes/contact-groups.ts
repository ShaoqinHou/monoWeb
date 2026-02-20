import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { contactGroups, contactGroupMembers, contactNotes, contacts } from '../db/schema';
import type { Db } from '../db/index';

export function contactGroupRoutes(db: Db) {
  const router = new Hono();

  // ── Groups ────────────────────────────────────────────────────────────────

  router.get('/', async (c) => {
    const rows = await db.select().from(contactGroups).all();
    return c.json({ ok: true, data: rows });
  });

  router.get('/:id', async (c) => {
    const id = c.req.param('id');
    const group = await db.select().from(contactGroups).where(eq(contactGroups.id, id)).get();
    if (!group) return c.json({ ok: false, error: 'Group not found' }, 404);

    const members = await db.select().from(contactGroupMembers).where(eq(contactGroupMembers.groupId, id)).all();
    const memberContactIds = members.map((m) => m.contactId);
    const memberContacts = [];
    for (const cid of memberContactIds) {
      const contact = await db.select().from(contacts).where(eq(contacts.id, cid)).get();
      if (contact) memberContacts.push(contact);
    }

    return c.json({ ok: true, data: { ...group, members: memberContacts } });
  });

  router.post('/', async (c) => {
    const body = await c.req.json();
    if (!body.name) return c.json({ ok: false, error: 'name required' }, 400);

    const now = new Date().toISOString();
    const id = randomUUID();

    await db.insert(contactGroups).values({
      id,
      name: body.name,
      description: body.description ?? null,
      createdAt: now,
    });

    const created = await db.select().from(contactGroups).where(eq(contactGroups.id, id)).get();
    return c.json({ ok: true, data: created }, 201);
  });

  router.put('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(contactGroups).where(eq(contactGroups.id, id)).get();
    if (!existing) return c.json({ ok: false, error: 'Group not found' }, 404);

    const body = await c.req.json();
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;

    await db.update(contactGroups).set(updates).where(eq(contactGroups.id, id));
    const updated = await db.select().from(contactGroups).where(eq(contactGroups.id, id)).get();
    return c.json({ ok: true, data: updated });
  });

  router.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(contactGroups).where(eq(contactGroups.id, id)).get();
    if (!existing) return c.json({ ok: false, error: 'Group not found' }, 404);
    await db.delete(contactGroups).where(eq(contactGroups.id, id));
    return c.json({ ok: true, data: { id } });
  });

  // ── Group Members ─────────────────────────────────────────────────────────

  router.post('/:id/members', async (c) => {
    const groupId = c.req.param('id');
    const group = await db.select().from(contactGroups).where(eq(contactGroups.id, groupId)).get();
    if (!group) return c.json({ ok: false, error: 'Group not found' }, 404);

    const body = await c.req.json();
    if (!body.contactId) return c.json({ ok: false, error: 'contactId required' }, 400);

    const contact = await db.select().from(contacts).where(eq(contacts.id, body.contactId)).get();
    if (!contact) return c.json({ ok: false, error: 'Contact not found' }, 400);

    const id = randomUUID();
    await db.insert(contactGroupMembers).values({
      id,
      groupId,
      contactId: body.contactId,
    });

    return c.json({ ok: true, data: { id, groupId, contactId: body.contactId } }, 201);
  });

  router.delete('/:id/members/:contactId', async (c) => {
    const groupId = c.req.param('id');
    const contactId = c.req.param('contactId');

    const members = await db.select().from(contactGroupMembers).where(eq(contactGroupMembers.groupId, groupId)).all();
    const member = members.find((m) => m.contactId === contactId);
    if (!member) return c.json({ ok: false, error: 'Member not found in group' }, 404);

    await db.delete(contactGroupMembers).where(eq(contactGroupMembers.id, member.id));
    return c.json({ ok: true, data: { groupId, contactId } });
  });

  // ── Contact Notes ─────────────────────────────────────────────────────────

  router.get('/notes/:contactId', async (c) => {
    const contactId = c.req.param('contactId');
    const notes = await db.select().from(contactNotes).where(eq(contactNotes.contactId, contactId)).all();
    return c.json({ ok: true, data: notes });
  });

  router.post('/notes/:contactId', async (c) => {
    const contactId = c.req.param('contactId');
    const contact = await db.select().from(contacts).where(eq(contacts.id, contactId)).get();
    if (!contact) return c.json({ ok: false, error: 'Contact not found' }, 400);

    const body = await c.req.json();
    if (!body.content) return c.json({ ok: false, error: 'content required' }, 400);

    const now = new Date().toISOString();
    const id = randomUUID();

    await db.insert(contactNotes).values({
      id,
      contactId,
      content: body.content,
      createdAt: now,
    });

    const created = await db.select().from(contactNotes).where(eq(contactNotes.id, id)).get();
    return c.json({ ok: true, data: created }, 201);
  });

  router.delete('/notes/:contactId/:noteId', async (c) => {
    const noteId = c.req.param('noteId');
    const existing = await db.select().from(contactNotes).where(eq(contactNotes.id, noteId)).get();
    if (!existing) return c.json({ ok: false, error: 'Note not found' }, 404);
    await db.delete(contactNotes).where(eq(contactNotes.id, noteId));
    return c.json({ ok: true, data: { id: noteId } });
  });

  return router;
}
