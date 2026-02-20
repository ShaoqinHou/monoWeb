import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OverdueRemindersPanel } from '../components/OverdueRemindersPanel';
import { PaymentReceiptDialog } from '../components/PaymentReceiptDialog';
import { QuoteFollowUpPanel } from '../components/QuoteFollowUpPanel';
import { filterByRange, type OverdueInvoice, type OverdueFilter } from '../hooks/useOverdueReminders';
import type { PaymentReceiptData } from '../hooks/useSendPaymentReceipt';

// Mock fetch to return expected API data for these component tests
const mockOverdueInvoices = [
  { id: '1', invoiceNumber: 'INV-001', contactName: 'Acme Corp', total: 1500, amountDue: 1500, currency: 'NZD', dueDate: '2024-01-01', daysOverdue: 5 },
  { id: '2', invoiceNumber: 'INV-002', contactName: 'Beta Ltd', total: 3200, amountDue: 3200, currency: 'NZD', dueDate: '2024-01-01', daysOverdue: 15 },
  { id: '3', invoiceNumber: 'INV-003', contactName: 'Gamma Inc', total: 800, amountDue: 800, currency: 'NZD', dueDate: '2024-01-01', daysOverdue: 45 },
  { id: '4', invoiceNumber: 'INV-004', contactName: 'Delta Co', total: 12000, amountDue: 12000, currency: 'NZD', dueDate: '2024-01-01', daysOverdue: 90 },
];

const mockExpiringQuotes = [
  { id: 'q1', quoteNumber: 'QU-001', contactName: 'Acme Corp', total: 5000, currency: 'NZD', expiryDate: '2024-01-20', daysUntilExpiry: 3, expiryStatus: 'expiring' },
  { id: 'q2', quoteNumber: 'QU-002', contactName: 'Beta Ltd', total: 2500, currency: 'NZD', expiryDate: '2024-01-23', daysUntilExpiry: 6, expiryStatus: 'expiring' },
  { id: 'q3', quoteNumber: 'QU-003', contactName: 'Gamma Inc', total: 8000, currency: 'NZD', expiryDate: '2024-01-10', daysUntilExpiry: -5, expiryStatus: 'expired' },
  { id: 'q4', quoteNumber: 'QU-004', contactName: 'Delta Co', total: 1200, currency: 'NZD', expiryDate: '2024-01-01', daysUntilExpiry: -15, expiryStatus: 'expired' },
];

const originalFetch = globalThis.fetch;

beforeEach(() => {
  globalThis.fetch = vi.fn((url: string | URL | Request, init?: RequestInit) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;

    if (urlStr.includes('/invoices/overdue')) {
      return Promise.resolve(new Response(JSON.stringify({ ok: true, data: mockOverdueInvoices }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));
    }
    if (urlStr.includes('/send-reminder')) {
      return Promise.resolve(new Response(JSON.stringify({ ok: true, data: { success: true, invoiceId: 'test', sentAt: new Date().toISOString() } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));
    }
    if (urlStr.includes('/payment-receipt')) {
      return Promise.resolve(new Response(JSON.stringify({ ok: true, data: { success: true, sentAt: new Date().toISOString() } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));
    }
    if (urlStr.includes('/quotes/expiring')) {
      return Promise.resolve(new Response(JSON.stringify({ ok: true, data: mockExpiringQuotes }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));
    }
    // Fallback
    return Promise.resolve(new Response(JSON.stringify({ ok: true, data: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
  }) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('OverdueRemindersPanel', () => {
  it('renders overdue invoices with days count', async () => {
    render(<OverdueRemindersPanel />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('overdue-reminders-panel')).toBeInTheDocument();
    });
    // Wait for data to load — mock data has 4 invoices
    await waitFor(() => {
      expect(screen.getByText('INV-001')).toBeInTheDocument();
    });
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('5 days')).toBeInTheDocument();
  });

  it('shows send reminder button per invoice', async () => {
    render(<OverdueRemindersPanel />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('send-reminder-1')).toBeInTheDocument();
    });
    expect(screen.getByTestId('send-reminder-2')).toBeInTheDocument();
  });

  it('send reminder mutation works — shows Sent after clicking', async () => {
    render(<OverdueRemindersPanel />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('send-reminder-1')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('send-reminder-1'));
    await waitFor(() => {
      expect(screen.getByTestId('sent-1')).toBeInTheDocument();
    });
    expect(screen.getByTestId('sent-1')).toHaveTextContent('Sent');
  });

  it('bulk reminders button sends to all', async () => {
    render(<OverdueRemindersPanel />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('send-all-reminders')).toBeInTheDocument();
    });
    // Wait for data
    await waitFor(() => {
      expect(screen.getByText('INV-001')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('send-all-reminders'));
    await waitFor(() => {
      expect(screen.getByTestId('sent-1')).toBeInTheDocument();
      expect(screen.getByTestId('sent-2')).toBeInTheDocument();
    });
  });

  it('filters invoices by date range', () => {
    const invoices: OverdueInvoice[] = [
      { id: '1', invoiceNumber: 'INV-001', contactName: 'A', total: 100, amountDue: 100, currency: 'NZD', dueDate: '2024-01-01', daysOverdue: 10 },
      { id: '2', invoiceNumber: 'INV-002', contactName: 'B', total: 200, amountDue: 200, currency: 'NZD', dueDate: '2024-01-01', daysOverdue: 45 },
      { id: '3', invoiceNumber: 'INV-003', contactName: 'C', total: 300, amountDue: 300, currency: 'NZD', dueDate: '2024-01-01', daysOverdue: 75 },
    ];

    expect(filterByRange(invoices, 'all')).toHaveLength(3);
    expect(filterByRange(invoices, '1-30')).toHaveLength(1);
    expect(filterByRange(invoices, '31-60')).toHaveLength(1);
    expect(filterByRange(invoices, '60+')).toHaveLength(1);
  });
});

describe('PaymentReceiptDialog', () => {
  const mockPayment: PaymentReceiptData = {
    paymentId: 'pay-1',
    invoiceId: 'inv-1',
    invoiceNumber: 'INV-100',
    contactName: 'Test Contact',
    contactEmail: 'test@example.com',
    paymentAmount: 500,
    paymentDate: '2024-06-15',
    currency: 'NZD',
    remainingBalance: 200,
  };

  it('shows payment details when open', () => {
    render(
      <PaymentReceiptDialog open={true} onClose={vi.fn()} payment={mockPayment} />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByTestId('receipt-invoice-ref')).toHaveTextContent('INV-100');
    expect(screen.getByTestId('receipt-contact')).toHaveTextContent('Test Contact');
    expect(screen.getByTestId('receipt-amount')).toHaveTextContent('500.00');
    expect(screen.getByTestId('receipt-date')).toHaveTextContent('2024-06-15');
    expect(screen.getByTestId('receipt-balance')).toHaveTextContent('200.00');
    expect(screen.getByTestId('receipt-email')).toHaveTextContent('test@example.com');
  });

  it('calls onClose when Skip is clicked', () => {
    const onClose = vi.fn();
    render(
      <PaymentReceiptDialog open={true} onClose={onClose} payment={mockPayment} />,
      { wrapper: createWrapper() },
    );
    fireEvent.click(screen.getByTestId('receipt-skip'));
    expect(onClose).toHaveBeenCalled();
  });

  it('returns null when payment is null', () => {
    const { container } = render(
      <PaymentReceiptDialog open={true} onClose={vi.fn()} payment={null} />,
      { wrapper: createWrapper() },
    );
    expect(container.innerHTML).toBe('');
  });
});

describe('QuoteFollowUpPanel', () => {
  it('renders expiring quotes with status badges', async () => {
    render(<QuoteFollowUpPanel />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('QU-001')).toBeInTheDocument();
    });
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    // Expired quotes show red badge
    expect(screen.getByText('5 days past')).toBeInTheDocument();
    // Expiring quotes show warning/info badge
    expect(screen.getByText('3 days left')).toBeInTheDocument();
  });

  it('send follow-up button works per quote', async () => {
    render(<QuoteFollowUpPanel />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('send-followup-q1')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('send-followup-q1'));
    await waitFor(() => {
      expect(screen.getByTestId('followup-sent-q1')).toBeInTheDocument();
    });
  });
});
