// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InvoiceFromProjectDialog } from '../components/InvoiceFromProjectDialog';

// Mock the hooks
const mockMutate = vi.fn();
vi.mock('../hooks/useUnbilledItems', () => ({
  useUnbilledItems: vi.fn(() => ({
    data: {
      timeEntries: [
        { id: 't1', date: '2024-01-10', hours: 5, hourlyRate: 100, description: 'Frontend dev', amount: 500 },
        { id: 't2', date: '2024-01-11', hours: 3, hourlyRate: 80, description: 'Backend dev', amount: 240 },
      ],
      expenses: [
        { id: 'e1', date: '2024-01-09', description: 'Software license', amount: 120, category: null },
      ],
      totalUnbilled: 860,
    },
    isLoading: false,
  })),
}));

vi.mock('../hooks/useCreateProjectInvoice', () => ({
  useCreateProjectInvoice: vi.fn(() => ({
    mutate: mockMutate,
    isPending: false,
  })),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('InvoiceFromProjectDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with unbilled items from hook', () => {
    render(
      <InvoiceFromProjectDialog open={true} onClose={() => {}} projectId="proj-1" />,
      { wrapper },
    );
    expect(screen.getByText('Create Invoice from Project')).toBeInTheDocument();
    expect(screen.getByText('Frontend dev')).toBeInTheDocument();
    expect(screen.getByText('Backend dev')).toBeInTheDocument();
    expect(screen.getByText('Software license')).toBeInTheDocument();
  });

  it('shows total of all selected items', () => {
    render(
      <InvoiceFromProjectDialog open={true} onClose={() => {}} projectId="proj-1" />,
      { wrapper },
    );
    const totalEl = screen.getByTestId('unbilled-total');
    expect(totalEl.textContent).toContain('860.00');
  });

  it('calls create mutation with selected item IDs', async () => {
    const user = userEvent.setup();
    render(
      <InvoiceFromProjectDialog open={true} onClose={() => {}} projectId="proj-1" />,
      { wrapper },
    );

    const createBtn = screen.getByTestId('create-invoice-btn');
    await user.click(createBtn);

    expect(mockMutate).toHaveBeenCalledWith(
      { timeEntryIds: ['t1', 't2'], expenseIds: ['e1'] },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it('returns null when not open', () => {
    const { container } = render(
      <InvoiceFromProjectDialog open={false} onClose={() => {}} projectId="proj-1" />,
      { wrapper },
    );
    expect(container.innerHTML).toBe('');
  });

  it('shows loading state', async () => {
    const { useUnbilledItems } = await import('../hooks/useUnbilledItems');
    vi.mocked(useUnbilledItems).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useUnbilledItems>);

    render(
      <InvoiceFromProjectDialog open={true} onClose={() => {}} projectId="proj-1" />,
      { wrapper },
    );
    expect(screen.getByTestId('unbilled-loading')).toBeInTheDocument();
  });
});
