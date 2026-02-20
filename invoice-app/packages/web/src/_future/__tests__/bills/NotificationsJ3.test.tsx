import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BillsDueWidget } from '../components/BillsDueWidget';
import { computeBillsDueTotals } from '../hooks/useBillsDue';

const mockBillsDue = {
  today: [
    { id: 'b1', billNumber: 'BILL-001', contactName: 'Supplier A', total: 500, amountDue: 500, currency: 'NZD', dueDate: '2024-01-15' },
  ],
  thisWeek: [
    { id: 'b2', billNumber: 'BILL-002', contactName: 'Supplier B', total: 1200, amountDue: 1200, currency: 'NZD', dueDate: '2024-01-18' },
    { id: 'b3', billNumber: 'BILL-003', contactName: 'Supplier C', total: 800, amountDue: 800, currency: 'NZD', dueDate: '2024-01-20' },
  ],
  thisMonth: [
    { id: 'b4', billNumber: 'BILL-004', contactName: 'Supplier D', total: 3500, amountDue: 3500, currency: 'NZD', dueDate: '2024-01-30' },
    { id: 'b5', billNumber: 'BILL-005', contactName: 'Supplier E', total: 950, amountDue: 950, currency: 'NZD', dueDate: '2024-02-10' },
  ],
};

const originalFetch = globalThis.fetch;

beforeEach(() => {
  globalThis.fetch = vi.fn((url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;

    if (urlStr.includes('/bills/due')) {
      return Promise.resolve(new Response(JSON.stringify({ ok: true, data: mockBillsDue }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));
    }
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

describe('BillsDueWidget', () => {
  it('renders bills grouped by time period', async () => {
    render(<BillsDueWidget />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('bills-due-widget')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByTestId('due-today')).toBeInTheDocument();
    });
    expect(screen.getByTestId('due-this-week')).toBeInTheDocument();
    expect(screen.getByTestId('due-this-month')).toBeInTheDocument();
  });

  it('expands section to show individual bills on click', async () => {
    render(<BillsDueWidget />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('due-today-toggle')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('due-today-toggle'));
    await waitFor(() => {
      expect(screen.getByTestId('due-today-details')).toBeInTheDocument();
    });
    expect(screen.getByText('BILL-001')).toBeInTheDocument();
    expect(screen.getByTestId('pay-now-b1')).toBeInTheDocument();
  });

  it('computeBillsDueTotals calculates count and total', () => {
    const bills = [
      { id: '1', billNumber: 'B-1', contactName: 'A', total: 100, amountDue: 100, currency: 'NZD', dueDate: '2024-01-01' },
      { id: '2', billNumber: 'B-2', contactName: 'B', total: 200, amountDue: 200, currency: 'NZD', dueDate: '2024-01-02' },
    ];
    const result = computeBillsDueTotals(bills);
    expect(result.count).toBe(2);
    expect(result.total).toBe(300);
  });
});
