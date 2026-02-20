import { useState, useCallback } from 'react';

export type NotificationType =
  | 'invoice_overdue'
  | 'payment_received'
  | 'expense_submitted'
  | 'leave_request'
  | 'bank_feed';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: string;
  read: boolean;
}

const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'invoice_overdue',
    message: 'Invoice INV-0042 to Acme Corp is 7 days overdue ($1,250.00)',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 'n2',
    type: 'payment_received',
    message: 'Payment of $3,500.00 received from Beta Industries',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 'n3',
    type: 'expense_submitted',
    message: 'Jane Smith submitted an expense claim for $245.80',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 'n4',
    type: 'leave_request',
    message: 'John Doe requested annual leave: 15-19 Mar 2026',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: 'n5',
    type: 'bank_feed',
    message: '12 new transactions imported from Business Checking',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
];

// Shared mutable state for session-scoped notifications.
// All hook instances share the same array reference so that
// markRead / markAllRead / dismiss changes are visible across
// components within a single page render cycle.
let sharedNotifications: Notification[] = [...SEED_NOTIFICATIONS];

/** Reset shared state — useful for tests */
export function _resetNotifications(seed?: Notification[]): void {
  sharedNotifications = seed ? [...seed] : [...SEED_NOTIFICATIONS];
}

export function useNotifications() {
  const [, forceUpdate] = useState(0);

  // Return current shared state; the forceUpdate mechanism is
  // triggered by the companion hooks below via window event.
  const rerender = useCallback(() => forceUpdate((n) => n + 1), []);

  // Subscribe once — but since hooks are called many times we keep it simple.
  // The NotificationCenter already subscribes to the custom event.
  // We just expose the data here.

  const unreadCount = sharedNotifications.filter((n) => !n.read).length;

  return { notifications: sharedNotifications, unreadCount, _rerender: rerender };
}

export function useMarkNotificationRead() {
  return useCallback((id: string) => {
    sharedNotifications = sharedNotifications.map((n) =>
      n.id === id ? { ...n, read: true } : n,
    );
    window.dispatchEvent(new Event('notifications-updated'));
  }, []);
}

export function useMarkAllRead() {
  return useCallback(() => {
    sharedNotifications = sharedNotifications.map((n) => ({ ...n, read: true }));
    window.dispatchEvent(new Event('notifications-updated'));
  }, []);
}

export function useDismissNotification() {
  return useCallback((id: string) => {
    sharedNotifications = sharedNotifications.filter((n) => n.id !== id);
    window.dispatchEvent(new Event('notifications-updated'));
  }, []);
}
