import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { notificationPreferences } from '../db/schema';
import type { Db } from '../db/index';

const DEFAULT_ID = 'default';

export function notificationPreferenceRoutes(db: Db) {
  const router = new Hono();

  // GET / — Get singleton notification preferences (creates default if missing)
  router.get('/', async (c) => {
    let row = await db.select().from(notificationPreferences).where(eq(notificationPreferences.id, DEFAULT_ID)).get();

    if (!row) {
      await db.insert(notificationPreferences).values({
        id: DEFAULT_ID,
        overdueReminders: 1,
        overdueReminderDays: 7,
        paymentConfirmations: 1,
        quoteExpiryAlerts: 1,
        quoteExpiryDaysBefore: 7,
        billDueAlerts: 1,
        billDueDaysBefore: 3,
        bankFeedUpdates: 1,
      });
      row = await db.select().from(notificationPreferences).where(eq(notificationPreferences.id, DEFAULT_ID)).get();
    }

    return c.json({ ok: true, data: row });
  });

  // PUT / — Update notification preferences
  router.put('/', async (c) => {
    const body = await c.req.json();

    // Ensure default row exists
    let existing = await db.select().from(notificationPreferences).where(eq(notificationPreferences.id, DEFAULT_ID)).get();
    if (!existing) {
      await db.insert(notificationPreferences).values({
        id: DEFAULT_ID,
        overdueReminders: 1,
        overdueReminderDays: 7,
        paymentConfirmations: 1,
        quoteExpiryAlerts: 1,
        quoteExpiryDaysBefore: 7,
        billDueAlerts: 1,
        billDueDaysBefore: 3,
        bankFeedUpdates: 1,
      });
    }

    const updates: Record<string, unknown> = {};

    if (body.overdueReminders !== undefined) updates.overdueReminders = body.overdueReminders;
    if (body.overdueReminderDays !== undefined) updates.overdueReminderDays = body.overdueReminderDays;
    if (body.paymentConfirmations !== undefined) updates.paymentConfirmations = body.paymentConfirmations;
    if (body.quoteExpiryAlerts !== undefined) updates.quoteExpiryAlerts = body.quoteExpiryAlerts;
    if (body.quoteExpiryDaysBefore !== undefined) updates.quoteExpiryDaysBefore = body.quoteExpiryDaysBefore;
    if (body.billDueAlerts !== undefined) updates.billDueAlerts = body.billDueAlerts;
    if (body.billDueDaysBefore !== undefined) updates.billDueDaysBefore = body.billDueDaysBefore;
    if (body.bankFeedUpdates !== undefined) updates.bankFeedUpdates = body.bankFeedUpdates;

    if (Object.keys(updates).length > 0) {
      await db.update(notificationPreferences).set(updates).where(eq(notificationPreferences.id, DEFAULT_ID));
    }

    const row = await db.select().from(notificationPreferences).where(eq(notificationPreferences.id, DEFAULT_ID)).get();
    return c.json({ ok: true, data: row });
  });

  return router;
}
