// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StaffTimeOverviewPage } from '../routes/StaffTimeOverviewPage';
import type { StaffTimeOverviewEntry } from '../hooks/useStaffTimeOverview';

// Recharts needs ResizeObserver in jsdom
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

const MOCK_ENTRIES: StaffTimeOverviewEntry[] = [
  { staffName: 'Alice', projectId: 'p1', projectName: 'Web Redesign', totalHours: 40 },
  { staffName: 'Alice', projectId: 'p2', projectName: 'Mobile App', totalHours: 20 },
  { staffName: 'Bob', projectId: 'p1', projectName: 'Web Redesign', totalHours: 30 },
  { staffName: 'Bob', projectId: 'p2', projectName: 'Mobile App', totalHours: 25 },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function mockFetchEntries() {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ ok: true, data: MOCK_ENTRIES }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

describe('StaffTimeOverviewPage', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = mockFetchEntries();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('renders the page heading', async () => {
    render(<StaffTimeOverviewPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Staff Time Overview')).toBeInTheDocument();
    });
  });

  it('renders loading state initially', () => {
    render(<StaffTimeOverviewPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('staff-time-loading')).toBeInTheDocument();
  });

  it('renders the staff time grid with data', async () => {
    render(<StaffTimeOverviewPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('staff-time-grid')).toBeInTheDocument();
    });
    // Staff names appear in both grid headers and staff cards — use getAllByText
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Bob').length).toBeGreaterThan(0);
    // Project names as rows
    expect(screen.getByText('Mobile App')).toBeInTheDocument();
    expect(screen.getByText('Web Redesign')).toBeInTheDocument();
  });

  it('displays hours in the grid cells', async () => {
    render(<StaffTimeOverviewPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('staff-time-grid')).toBeInTheDocument();
    });
    // Alice has 40 on Web Redesign, 20 on Mobile App
    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('displays grand total', async () => {
    render(<StaffTimeOverviewPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('grand-total')).toBeInTheDocument();
    });
    // Grand total: 40 + 20 + 30 + 25 = 115
    expect(screen.getByTestId('grand-total')).toHaveTextContent('115');
  });
});
