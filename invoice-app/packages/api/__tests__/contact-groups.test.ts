import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createApp } from '../src/app';
import { createTestDb } from '../src/db/test-helpers';
import type { Db } from '../src/db/index';

let db: Db;
let cleanup: () => void;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  const t = createTestDb();
  db = t.db;
  cleanup = t.cleanup;
  app = createApp(db);
});

afterEach(() => {
  cleanup();
});

function req(method: string, path: string, body?: unknown) {
  const init: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) init.body = JSON.stringify(body);
  return app.request(path, init);
}

async function createContact(name = 'Test Customer'): Promise<string> {
  const res = await req('POST', '/api/contacts', { name, type: 'customer' });
  return (await res.json()).data.id;
}

async function createGroup(name = 'VIP Clients', description?: string): Promise<string> {
  const body: Record<string, string> = { name };
  if (description) body.description = description;
  const res = await req('POST', '/api/contact-groups', body);
  return (await res.json()).data.id;
}

describe('Contact Groups API', () => {
  describe('GET /api/contact-groups', () => {
    it('returns empty array when no groups', async () => {
      const res = await req('GET', '/api/contact-groups');
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data).toEqual([]);
    });

    it('returns all groups', async () => {
      await createGroup('Group A');
      await createGroup('Group B');
      const res = await req('GET', '/api/contact-groups');
      const json = await res.json();
      expect(json.data).toHaveLength(2);
    });
  });

  describe('POST /api/contact-groups', () => {
    it('creates a group with name', async () => {
      const res = await req('POST', '/api/contact-groups', { name: 'VIP Clients' });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.name).toBe('VIP Clients');
      expect(typeof json.data.id).toBe('string');
    });

    it('creates a group with name and description', async () => {
      const res = await req('POST', '/api/contact-groups', {
        name: 'VIP Clients',
        description: 'High-value customers',
      });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.description).toBe('High-value customers');
    });

    it('rejects group with missing name', async () => {
      const res = await req('POST', '/api/contact-groups', {});
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error).toBe('name required');
    });
  });

  describe('GET /api/contact-groups/:id', () => {
    it('returns a group with members', async () => {
      const groupId = await createGroup('VIP Clients');
      const contactId = await createContact('Alice');

      await req('POST', `/api/contact-groups/${groupId}/members`, { contactId });

      const res = await req('GET', `/api/contact-groups/${groupId}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.name).toBe('VIP Clients');
      expect(json.data.members).toHaveLength(1);
      expect(json.data.members[0].name).toBe('Alice');
    });

    it('returns 404 for non-existent group', async () => {
      const res = await req('GET', '/api/contact-groups/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error).toBe('Group not found');
    });
  });

  describe('PUT /api/contact-groups/:id', () => {
    it('updates group name', async () => {
      const groupId = await createGroup('Old Name');
      const res = await req('PUT', `/api/contact-groups/${groupId}`, { name: 'New Name' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.name).toBe('New Name');
    });

    it('updates group description', async () => {
      const groupId = await createGroup('VIP');
      const res = await req('PUT', `/api/contact-groups/${groupId}`, { description: 'Updated desc' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.description).toBe('Updated desc');
    });

    it('returns 404 for non-existent group', async () => {
      const res = await req('PUT', '/api/contact-groups/00000000-0000-0000-0000-000000000000', { name: 'X' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/contact-groups/:id', () => {
    it('deletes an existing group', async () => {
      const groupId = await createGroup('To Delete');
      const res = await req('DELETE', `/api/contact-groups/${groupId}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.id).toBe(groupId);

      // Verify deleted
      const getRes = await req('GET', `/api/contact-groups/${groupId}`);
      expect(getRes.status).toBe(404);
    });

    it('returns 404 for non-existent group', async () => {
      const res = await req('DELETE', '/api/contact-groups/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/contact-groups/:id/members', () => {
    it('adds a member to the group', async () => {
      const groupId = await createGroup('VIP');
      const contactId = await createContact('Bob');

      const res = await req('POST', `/api/contact-groups/${groupId}/members`, { contactId });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.groupId).toBe(groupId);
      expect(json.data.contactId).toBe(contactId);
    });

    it('returns 404 for non-existent group', async () => {
      const contactId = await createContact('Bob');
      const res = await req('POST', '/api/contact-groups/00000000-0000-0000-0000-000000000000/members', { contactId });
      expect(res.status).toBe(404);
    });

    it('returns 400 for missing contactId', async () => {
      const groupId = await createGroup('VIP');
      const res = await req('POST', `/api/contact-groups/${groupId}/members`, {});
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('contactId required');
    });

    it('returns 400 for non-existent contact', async () => {
      const groupId = await createGroup('VIP');
      const res = await req('POST', `/api/contact-groups/${groupId}/members`, {
        contactId: '00000000-0000-0000-0000-000000000000',
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Contact not found');
    });
  });

  describe('DELETE /api/contact-groups/:id/members/:contactId', () => {
    it('removes a member from the group', async () => {
      const groupId = await createGroup('VIP');
      const contactId = await createContact('Charlie');
      await req('POST', `/api/contact-groups/${groupId}/members`, { contactId });

      const res = await req('DELETE', `/api/contact-groups/${groupId}/members/${contactId}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.groupId).toBe(groupId);
      expect(json.data.contactId).toBe(contactId);

      // Verify removed
      const getRes = await req('GET', `/api/contact-groups/${groupId}`);
      const groupJson = await getRes.json();
      expect(groupJson.data.members).toHaveLength(0);
    });

    it('returns 404 for non-existent member', async () => {
      const groupId = await createGroup('VIP');
      const res = await req('DELETE', `/api/contact-groups/${groupId}/members/00000000-0000-0000-0000-000000000000`);
      expect(res.status).toBe(404);
    });
  });
});

describe('Contact Notes API', () => {
  describe('POST /api/contact-groups/notes/:contactId', () => {
    it('creates a note for a contact', async () => {
      const contactId = await createContact('Diana');
      const res = await req('POST', `/api/contact-groups/notes/${contactId}`, {
        content: 'Met at conference',
      });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.content).toBe('Met at conference');
      expect(json.data.contactId).toBe(contactId);
    });

    it('rejects note with missing content', async () => {
      const contactId = await createContact('Eve');
      const res = await req('POST', `/api/contact-groups/notes/${contactId}`, {});
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('content required');
    });

    it('rejects note for non-existent contact', async () => {
      const res = await req('POST', '/api/contact-groups/notes/00000000-0000-0000-0000-000000000000', {
        content: 'Test',
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Contact not found');
    });
  });

  describe('GET /api/contact-groups/notes/:contactId', () => {
    it('returns notes for a contact', async () => {
      const contactId = await createContact('Frank');
      await req('POST', `/api/contact-groups/notes/${contactId}`, { content: 'Note 1' });
      await req('POST', `/api/contact-groups/notes/${contactId}`, { content: 'Note 2' });

      const res = await req('GET', `/api/contact-groups/notes/${contactId}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data).toHaveLength(2);
    });

    it('returns empty array when no notes', async () => {
      const contactId = await createContact('Grace');
      const res = await req('GET', `/api/contact-groups/notes/${contactId}`);
      const json = await res.json();
      expect(json.data).toEqual([]);
    });
  });

  describe('DELETE /api/contact-groups/notes/:contactId/:noteId', () => {
    it('deletes a note', async () => {
      const contactId = await createContact('Hank');
      const createRes = await req('POST', `/api/contact-groups/notes/${contactId}`, { content: 'To delete' });
      const noteId = (await createRes.json()).data.id;

      const res = await req('DELETE', `/api/contact-groups/notes/${contactId}/${noteId}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.id).toBe(noteId);

      // Verify deleted
      const listRes = await req('GET', `/api/contact-groups/notes/${contactId}`);
      const listJson = await listRes.json();
      expect(listJson.data).toHaveLength(0);
    });

    it('returns 404 for non-existent note', async () => {
      const contactId = await createContact('Ivy');
      const res = await req('DELETE', `/api/contact-groups/notes/${contactId}/00000000-0000-0000-0000-000000000000`);
      expect(res.status).toBe(404);
    });
  });
});
