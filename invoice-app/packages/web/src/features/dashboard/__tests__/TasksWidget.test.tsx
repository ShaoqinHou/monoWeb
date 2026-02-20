// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TasksWidget } from '../components/TasksWidget';
import type { DashboardTasks } from '../types';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, search, children, ...rest }: Record<string, unknown>) => {
    let href = to as string;
    if (search && typeof search === 'object') {
      const params = new URLSearchParams(search as Record<string, string>);
      href = `${href}?${params.toString()}`;
    }
    return <a href={href} {...rest}>{children as React.ReactNode}</a>;
  },
}));

function makeTasks(overrides?: Partial<DashboardTasks>): DashboardTasks {
  return {
    overdueInvoices: { count: 5, total: 2340 },
    billsDueThisWeek: { count: 3, total: 890 },
    unreconciledTransactions: { count: 12 },
    unapprovedExpenses: { count: 2 },
    pendingLeaveRequests: { count: 1 },
    ...overrides,
  };
}

function mockFetchWith(data: DashboardTasks) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ ok: true, data }),
  });
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

const WAIT_OPTS = { timeout: 3000 };

describe('TasksWidget', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('renders tasks heading', () => {
    globalThis.fetch = mockFetchWith(makeTasks());
    render(<TasksWidget />, { wrapper: createWrapper() });
    expect(screen.getByText('Tasks')).toBeInTheDocument();
  });

  it('renders overdue invoices count and amount', async () => {
    globalThis.fetch = mockFetchWith(makeTasks());
    render(<TasksWidget />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('task-item-overdue-invoices')).toBeInTheDocument();
    }, WAIT_OPTS);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('($2,340)')).toBeInTheDocument();
  });

  it('renders bills due this week with count', async () => {
    globalThis.fetch = mockFetchWith(makeTasks());
    render(<TasksWidget />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('task-item-bills-due-this-week')).toBeInTheDocument();
    }, WAIT_OPTS);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('($890)')).toBeInTheDocument();
  });

  it('renders unreconciled transactions count', async () => {
    globalThis.fetch = mockFetchWith(makeTasks());
    render(<TasksWidget />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('task-item-unreconciled-transactions')).toBeInTheDocument();
    }, WAIT_OPTS);
  });

  it('hides items with zero count', async () => {
    globalThis.fetch = mockFetchWith(
      makeTasks({
        overdueInvoices: { count: 0, total: 0 },
        unapprovedExpenses: { count: 0 },
      }),
    );
    render(<TasksWidget />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('task-item-bills-due-this-week')).toBeInTheDocument();
    }, WAIT_OPTS);
    expect(screen.queryByTestId('task-item-overdue-invoices')).not.toBeInTheDocument();
    expect(screen.queryByTestId('task-item-unapproved-expenses')).not.toBeInTheDocument();
  });

  it('shows "all caught up" message when all counts are zero', async () => {
    globalThis.fetch = mockFetchWith(
      makeTasks({
        overdueInvoices: { count: 0, total: 0 },
        billsDueThisWeek: { count: 0, total: 0 },
        unreconciledTransactions: { count: 0 },
        unapprovedExpenses: { count: 0 },
        pendingLeaveRequests: { count: 0 },
      }),
    );
    render(<TasksWidget />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText(/all caught up/i)).toBeInTheDocument();
    }, WAIT_OPTS);
  });

  it('links overdue invoices to filtered invoices list', async () => {
    globalThis.fetch = mockFetchWith(makeTasks());
    render(<TasksWidget />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('task-item-overdue-invoices')).toBeInTheDocument();
    }, WAIT_OPTS);
    const link = screen.getByTestId('task-item-overdue-invoices') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toContain('/sales/invoices');
  });
});
