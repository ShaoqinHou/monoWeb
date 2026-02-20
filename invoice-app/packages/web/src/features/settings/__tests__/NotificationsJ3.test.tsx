// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock api-helpers so the component doesn't make real requests
const mockApiFetch = vi.fn();
const mockApiPut = vi.fn();

vi.mock('../../../lib/api-helpers', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  apiPost: vi.fn(),
  apiPut: (...args: unknown[]) => mockApiPut(...args),
  apiDelete: vi.fn(),
}));

import { NotificationPreferences } from '../components/NotificationPreferences';

const DEFAULT_PREFS = {
  overdueReminders: true,
  overdueReminderDays: 7,
  paymentConfirmations: true,
  quoteExpiryAlerts: true,
  quoteExpiryDaysBefore: 7,
  billDueAlerts: true,
  billDueDaysBefore: 3,
  bankFeedUpdates: true,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('NotificationPreferences', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
    mockApiPut.mockReset();
    // Default: return default preferences from API
    mockApiFetch.mockResolvedValue(DEFAULT_PREFS);
    mockApiPut.mockImplementation((_path: string, body: unknown) =>
      Promise.resolve(body),
    );
  });

  it('renders all notification toggles', async () => {
    render(<NotificationPreferences />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('notification-preferences')).toBeInTheDocument();
    });
    expect(screen.getByTestId('pref-overdue-reminders-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('pref-payment-confirmations-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('pref-quote-expiry-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('pref-bill-due-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('pref-bank-feed-toggle')).toBeInTheDocument();
  });

  it('toggles and saves when Save is clicked', async () => {
    render(<NotificationPreferences />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('pref-overdue-reminders-toggle')).toBeInTheDocument();
    });

    // Toggle overdue reminders OFF
    fireEvent.click(screen.getByTestId('pref-overdue-reminders-toggle'));

    // Click Save
    fireEvent.click(screen.getByTestId('save-preferences'));

    await waitFor(() => {
      expect(screen.getByTestId('preferences-saved')).toBeInTheDocument();
    });

    // Verify the API was called with updated preferences
    expect(mockApiPut).toHaveBeenCalledWith(
      '/notification-preferences',
      expect.objectContaining({ overdueReminders: false }),
    );
  });

  it('loads preferences from API', async () => {
    mockApiFetch.mockResolvedValue(DEFAULT_PREFS);

    render(<NotificationPreferences />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('notification-preferences')).toBeInTheDocument();
    });

    expect(mockApiFetch).toHaveBeenCalledWith('/notification-preferences');
  });
});
