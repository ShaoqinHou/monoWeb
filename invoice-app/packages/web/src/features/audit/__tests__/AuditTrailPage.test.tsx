// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuditTrailPage } from '../routes/AuditTrailPage';

const MOCK_ENTRIES = [
  {
    id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    entityType: 'invoice',
    entityId: 'inv-001',
    action: 'created',
    userId: 'user-1',
    userName: 'Demo User',
    timestamp: '2026-02-16T10:00:00.000Z',
    changes: [],
  },
  {
    id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    entityType: 'contact',
    entityId: 'c-001',
    action: 'updated',
    userId: 'user-1',
    userName: 'Demo User',
    timestamp: '2026-02-15T09:00:00.000Z',
    changes: [{ field: 'name', oldValue: 'Old Name', newValue: 'New Name' }],
  },
  {
    id: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    entityType: 'bill',
    entityId: 'bill-001',
    action: 'deleted',
    userId: 'user-1',
    userName: 'Demo User',
    timestamp: '2026-02-14T08:00:00.000Z',
    changes: [],
  },
];

const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  Link: (props: { to: string; children: React.ReactNode }) => (
    <a href={props.to}>{props.children}</a>
  ),
  useNavigate: () => mockNavigate,
}));

let originalFetch: typeof globalThis.fetch;

function mockFetch(data: unknown = MOCK_ENTRIES, total?: number) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({
      ok: true,
      data,
      total: total ?? (Array.isArray(data) ? data.length : 1),
    }),
  } as Response);
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('AuditTrailPage', () => {
  beforeEach(() => {
    originalFetch = globalThis.fetch;
    mockFetch();
    mockNavigate.mockReset();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('renders page title "Audit Trail"', () => {
    render(<AuditTrailPage />, { wrapper: createWrapper() });
    expect(screen.getByRole('heading', { name: 'Audit Trail' })).toBeInTheDocument();
  });

  it('renders breadcrumbs', () => {
    render(<AuditTrailPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Audit Trail', { selector: 'span' })).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    // Use a never-resolving fetch to keep loading
    globalThis.fetch = vi.fn().mockReturnValue(new Promise(() => {}));

    render(<AuditTrailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('audit-loading')).toBeInTheDocument();
  });

  it('shows audit entries when loaded', async () => {
    render(<AuditTrailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getAllByTestId('audit-entry-row').length).toBe(3);
    });

    expect(screen.getAllByText('Demo User').length).toBeGreaterThan(0);
  });

  it('shows filter controls', () => {
    render(<AuditTrailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('filter-entity-type')).toBeInTheDocument();
    expect(screen.getByTestId('filter-action')).toBeInTheDocument();
  });

  it('filters by entity type when dropdown changes', async () => {
    render(<AuditTrailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getAllByTestId('audit-entry-row').length).toBe(3);
    });

    // Change entity type filter
    fireEvent.change(screen.getByTestId('filter-entity-type'), { target: { value: 'invoice' } });

    // Should re-fetch with filter
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('entityType=invoice'),
        expect.any(Object),
      );
    });
  });

  it('filters by action when dropdown changes', async () => {
    render(<AuditTrailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getAllByTestId('audit-entry-row').length).toBe(3);
    });

    fireEvent.change(screen.getByTestId('filter-action'), { target: { value: 'created' } });

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('action=created'),
        expect.any(Object),
      );
    });
  });

  it('shows empty state when no entries match filters', async () => {
    mockFetch([]);

    render(<AuditTrailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('audit-empty')).toBeInTheDocument();
    });

    expect(screen.getByText(/no audit entries/i)).toBeInTheDocument();
  });

  it('calls fetch with /api/audit on mount', async () => {
    render(<AuditTrailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getAllByTestId('audit-entry-row').length).toBe(3);
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/audit',
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });
});
