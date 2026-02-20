// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationCenter } from '../components/NotificationCenter';
import { NotificationItem } from '../components/NotificationItem';
import type { Notification } from '../hooks/useNotifications';
import { _resetNotifications } from '../hooks/useNotifications';

const mockNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'invoice_overdue',
    message: 'Invoice INV-0042 is overdue',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 'n2',
    type: 'payment_received',
    message: 'Payment of $3,500.00 received',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 'n3',
    type: 'expense_submitted',
    message: 'Expense claim submitted',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
];

describe('NotificationCenter', () => {
  beforeEach(() => {
    _resetNotifications(mockNotifications);
  });

  afterEach(() => {
    _resetNotifications();
  });

  it('renders bell icon with unread count badge', () => {
    render(<NotificationCenter />);

    expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
    expect(screen.getByTestId('notification-badge')).toBeInTheDocument();
    expect(screen.getByTestId('notification-badge').textContent).toBe('2');
  });

  it('shows notifications list when bell is clicked', () => {
    render(<NotificationCenter />);

    // Dropdown should not be visible initially
    expect(screen.queryByTestId('notification-dropdown')).not.toBeInTheDocument();

    // Click bell
    fireEvent.click(screen.getByTestId('notification-bell'));

    // Dropdown appears
    expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('notification-list')).toBeInTheDocument();

    // All 3 notifications rendered
    expect(screen.getByTestId('notification-n1')).toBeInTheDocument();
    expect(screen.getByTestId('notification-n2')).toBeInTheDocument();
    expect(screen.getByTestId('notification-n3')).toBeInTheDocument();
  });

  it('mark read changes notification state', async () => {
    render(<NotificationCenter />);

    // Open dropdown
    fireEvent.click(screen.getByTestId('notification-bell'));

    // Click on unread notification n1 to mark it read
    fireEvent.click(screen.getByTestId('notification-n1'));

    // Badge should now show 1 (only n2 still unread)
    await waitFor(() => {
      expect(screen.getByTestId('notification-badge').textContent).toBe('1');
    });
  });

  it('mark all read triggers event', async () => {
    render(<NotificationCenter />);

    // Open dropdown
    fireEvent.click(screen.getByTestId('notification-bell'));

    // Click mark all read
    fireEvent.click(screen.getByTestId('mark-all-read'));

    // Badge should disappear (all notifications now read)
    await waitFor(() => {
      expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument();
    });
  });

  it('dismiss removes notification', async () => {
    render(<NotificationCenter />);

    // Open dropdown
    fireEvent.click(screen.getByTestId('notification-bell'));

    // Dismiss notification n2
    fireEvent.click(screen.getByTestId('dismiss-n2'));

    // n2 should be removed from DOM
    await waitFor(() => {
      expect(screen.queryByTestId('notification-n2')).not.toBeInTheDocument();
    });
    // n1 and n3 should still be present
    expect(screen.getByTestId('notification-n1')).toBeInTheDocument();
    expect(screen.getByTestId('notification-n3')).toBeInTheDocument();
  });

  it('shows empty state when no notifications', () => {
    _resetNotifications([]);

    render(<NotificationCenter />);

    // No badge
    expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument();

    // Open dropdown
    fireEvent.click(screen.getByTestId('notification-bell'));
    expect(screen.getByTestId('notification-empty')).toBeInTheDocument();
  });
});

describe('NotificationItem', () => {
  const mockMarkRead = vi.fn();
  const mockDismiss = vi.fn();

  beforeEach(() => {
    mockMarkRead.mockClear();
    mockDismiss.mockClear();
  });

  it('renders notification types with correct icon labels', () => {
    const types: Array<{ type: Notification['type']; label: string }> = [
      { type: 'invoice_overdue', label: 'INV' },
      { type: 'payment_received', label: 'PAY' },
      { type: 'expense_submitted', label: 'EXP' },
      { type: 'leave_request', label: 'LV' },
      { type: 'bank_feed', label: 'BNK' },
    ];

    for (const { type, label } of types) {
      const notification: Notification = {
        id: `test-${type}`,
        type,
        message: `Test ${type} message`,
        timestamp: new Date().toISOString(),
        read: false,
      };

      const { unmount } = render(
        <NotificationItem
          notification={notification}
          onMarkRead={mockMarkRead}
          onDismiss={mockDismiss}
        />,
      );

      expect(screen.getByTestId(`notification-icon-${type}`).textContent).toBe(label);
      unmount();
    }
  });

  it('shows unread dot for unread notifications', () => {
    const notification: Notification = {
      id: 'unread-test',
      type: 'invoice_overdue',
      message: 'Unread test',
      timestamp: new Date().toISOString(),
      read: false,
    };

    render(
      <NotificationItem
        notification={notification}
        onMarkRead={mockMarkRead}
        onDismiss={mockDismiss}
      />,
    );

    expect(screen.getByTestId('unread-dot-unread-test')).toBeInTheDocument();
  });

  it('does not show unread dot for read notifications', () => {
    const notification: Notification = {
      id: 'read-test',
      type: 'payment_received',
      message: 'Read test',
      timestamp: new Date().toISOString(),
      read: true,
    };

    render(
      <NotificationItem
        notification={notification}
        onMarkRead={mockMarkRead}
        onDismiss={mockDismiss}
      />,
    );

    expect(screen.queryByTestId('unread-dot-read-test')).not.toBeInTheDocument();
  });
});
