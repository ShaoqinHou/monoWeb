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

describe('Notification Preferences API', () => {
  describe('GET /api/notification-preferences', () => {
    it('creates default preferences on first request', async () => {
      const res = await req('GET', '/api/notification-preferences');
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.data.id).toBe('default');
      expect(body.data.overdueReminders).toBe(1);
      expect(body.data.overdueReminderDays).toBe(7);
      expect(body.data.paymentConfirmations).toBe(1);
      expect(body.data.quoteExpiryAlerts).toBe(1);
      expect(body.data.quoteExpiryDaysBefore).toBe(7);
      expect(body.data.billDueAlerts).toBe(1);
      expect(body.data.billDueDaysBefore).toBe(3);
      expect(body.data.bankFeedUpdates).toBe(1);
    });

    it('returns same singleton on subsequent requests', async () => {
      await req('GET', '/api/notification-preferences');
      const res = await req('GET', '/api/notification-preferences');
      const body = await res.json();
      expect(body.data.id).toBe('default');
    });
  });

  describe('PUT /api/notification-preferences', () => {
    it('updates overdue reminder days', async () => {
      const res = await req('PUT', '/api/notification-preferences', { overdueReminderDays: 14 });
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.overdueReminderDays).toBe(14);
    });

    it('disables overdue reminders', async () => {
      const res = await req('PUT', '/api/notification-preferences', { overdueReminders: 0 });
      const body = await res.json();
      expect(body.data.overdueReminders).toBe(0);
    });

    it('updates multiple fields at once', async () => {
      const res = await req('PUT', '/api/notification-preferences', {
        billDueAlerts: 0,
        billDueDaysBefore: 5,
        bankFeedUpdates: 0,
      });
      const body = await res.json();
      expect(body.data.billDueAlerts).toBe(0);
      expect(body.data.billDueDaysBefore).toBe(5);
      expect(body.data.bankFeedUpdates).toBe(0);
    });

    it('creates default before updating if none exists', async () => {
      const res = await req('PUT', '/api/notification-preferences', { paymentConfirmations: 0 });
      const body = await res.json();
      expect(body.data.paymentConfirmations).toBe(0);
      // Other fields should be defaults
      expect(body.data.overdueReminders).toBe(1);
    });
  });
});
