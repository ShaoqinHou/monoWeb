import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { auditRoutes, resetAuditStore } from '../routes/audit';

function createTestApp() {
  const app = new Hono();
  app.route('/api/audit', auditRoutes());
  return app;
}

describe('Audit API Routes', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    resetAuditStore();
    app = createTestApp();
  });

  describe('GET /api/audit', () => {
    it('returns seeded audit entries', async () => {
      const res = await app.request('/api/audit');
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBeGreaterThanOrEqual(15);
    });

    it('returns entries sorted newest first', async () => {
      const res = await app.request('/api/audit');
      const json = await res.json();

      const timestamps = json.data.map((e: { timestamp: string }) => new Date(e.timestamp).getTime());
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i - 1]).toBeGreaterThanOrEqual(timestamps[i]);
      }
    });

    it('filters by entityType', async () => {
      const res = await app.request('/api/audit?entityType=invoice');
      const json = await res.json();

      expect(json.ok).toBe(true);
      expect(json.data.length).toBeGreaterThan(0);
      for (const entry of json.data) {
        expect(entry.entityType).toBe('invoice');
      }
    });

    it('filters by action', async () => {
      const res = await app.request('/api/audit?action=created');
      const json = await res.json();

      expect(json.ok).toBe(true);
      expect(json.data.length).toBeGreaterThan(0);
      for (const entry of json.data) {
        expect(entry.action).toBe('created');
      }
    });

    it('filters by entityId', async () => {
      // Get an entry first to know an entityId
      const allRes = await app.request('/api/audit');
      const allJson = await allRes.json();
      const firstEntry = allJson.data[0];

      const res = await app.request(`/api/audit?entityId=${firstEntry.entityId}`);
      const json = await res.json();

      expect(json.ok).toBe(true);
      expect(json.data.length).toBeGreaterThan(0);
      for (const entry of json.data) {
        expect(entry.entityId).toBe(firstEntry.entityId);
      }
    });

    it('filters by date range (startDate)', async () => {
      const res = await app.request('/api/audit?startDate=2026-02-10T00:00:00.000Z');
      const json = await res.json();

      expect(json.ok).toBe(true);
      for (const entry of json.data) {
        expect(new Date(entry.timestamp).getTime()).toBeGreaterThanOrEqual(
          new Date('2026-02-10T00:00:00.000Z').getTime()
        );
      }
    });

    it('filters by date range (endDate)', async () => {
      const res = await app.request('/api/audit?endDate=2026-01-15T00:00:00.000Z');
      const json = await res.json();

      expect(json.ok).toBe(true);
      for (const entry of json.data) {
        expect(new Date(entry.timestamp).getTime()).toBeLessThanOrEqual(
          new Date('2026-01-15T00:00:00.000Z').getTime()
        );
      }
    });

    it('supports limit parameter', async () => {
      const res = await app.request('/api/audit?limit=5');
      const json = await res.json();

      expect(json.ok).toBe(true);
      expect(json.data.length).toBeLessThanOrEqual(5);
    });

    it('supports offset parameter', async () => {
      const allRes = await app.request('/api/audit');
      const allJson = await allRes.json();

      const res = await app.request('/api/audit?offset=5&limit=5');
      const json = await res.json();

      expect(json.ok).toBe(true);
      // The first entry at offset 5 should be the 6th entry overall
      if (allJson.data.length > 5) {
        expect(json.data[0].id).toBe(allJson.data[5].id);
      }
    });

    it('returns total count in response', async () => {
      const res = await app.request('/api/audit?limit=5');
      const json = await res.json();

      expect(json.ok).toBe(true);
      expect(typeof json.total).toBe('number');
      expect(json.total).toBeGreaterThanOrEqual(json.data.length);
    });
  });

  describe('GET /api/audit/:id', () => {
    it('returns a single audit entry by id', async () => {
      const allRes = await app.request('/api/audit');
      const allJson = await allRes.json();
      const entry = allJson.data[0];

      const res = await app.request(`/api/audit/${entry.id}`);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.ok).toBe(true);
      expect(json.data.id).toBe(entry.id);
      expect(json.data.entityType).toBe(entry.entityType);
    });

    it('returns 404 for non-existent id', async () => {
      const res = await app.request('/api/audit/non-existent-id');
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.ok).toBe(false);
      expect(json.error).toBe('Audit entry not found');
    });
  });

  describe('POST /api/audit', () => {
    it('creates a new audit entry', async () => {
      const newEntry = {
        entityType: 'invoice',
        entityId: 'inv-new-001',
        action: 'created',
        userId: 'user-test',
        userName: 'Test User',
        timestamp: '2026-02-16T15:00:00.000Z',
        changes: [
          { field: 'status', oldValue: null, newValue: 'draft' },
        ],
      };

      const res = await app.request('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry),
      });

      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.ok).toBe(true);
      expect(typeof json.data.id).toBe('string');
      expect(json.data.entityType).toBe('invoice');
      expect(json.data.entityId).toBe('inv-new-001');
      expect(json.data.action).toBe('created');
      expect(json.data.changes).toHaveLength(1);
    });

    it('rejects invalid entity type', async () => {
      const res = await app.request('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'invalid-type',
          entityId: 'x',
          action: 'created',
          timestamp: '2026-02-16T15:00:00.000Z',
        }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.ok).toBe(false);
    });

    it('rejects invalid action', async () => {
      const res = await app.request('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'invoice',
          entityId: 'x',
          action: 'invalid-action',
          timestamp: '2026-02-16T15:00:00.000Z',
        }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.ok).toBe(false);
    });

    it('created entry appears in GET list', async () => {
      await app.request('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'contact',
          entityId: 'c-new-001',
          action: 'updated',
          timestamp: '2026-02-16T16:00:00.000Z',
          changes: [{ field: 'name', oldValue: 'Old', newValue: 'New' }],
        }),
      });

      const res = await app.request('/api/audit?entityId=c-new-001');
      const json = await res.json();

      expect(json.data.length).toBe(1);
      expect(json.data[0].entityId).toBe('c-new-001');
    });
  });
});
