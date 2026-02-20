// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MatchSuggestions } from '../components/MatchSuggestions';
import type { MatchSuggestionData } from '../types';

vi.mock('@shared/calc/currency', () => ({
  formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
}));

const mockSuggestions: MatchSuggestionData[] = [
  { type: 'invoice', id: 'inv-1', reference: 'INV-001', contact: 'Acme Corp', amount: 1000, confidence: 0.95 },
  { type: 'invoice', id: 'inv-2', reference: 'INV-002', contact: 'Widget Co', amount: 980, confidence: 0.7 },
];

vi.mock('../hooks/useMatchSuggestions', () => ({
  useMatchSuggestions: vi.fn(() => ({
    data: mockSuggestions,
    isLoading: false,
  })),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('MatchSuggestions', () => {
  const onAccept = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    // Restore default mock after tests that override it (loading/empty state tests)
    const { useMatchSuggestions } = await import('../hooks/useMatchSuggestions');
    vi.mocked(useMatchSuggestions).mockReturnValue({
      data: mockSuggestions,
      isLoading: false,
    } as ReturnType<typeof useMatchSuggestions>);
  });

  it('renders suggestion list with data', () => {
    render(
      <MatchSuggestions transactionId="tx-1" onAccept={onAccept} isAccepting={false} />,
      { wrapper },
    );
    expect(screen.getByTestId('match-suggestions-list')).toBeInTheDocument();
    expect(screen.getByText('INV-001')).toBeInTheDocument();
    expect(screen.getByText('INV-002')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('95% match')).toBeInTheDocument();
    expect(screen.getByText('70% match')).toBeInTheDocument();
  });

  it('calls onAccept when Accept button clicked', async () => {
    const user = userEvent.setup();
    render(
      <MatchSuggestions transactionId="tx-1" onAccept={onAccept} isAccepting={false} />,
      { wrapper },
    );

    const acceptBtn = screen.getByTestId('accept-btn-inv-1');
    await user.click(acceptBtn);
    expect(onAccept).toHaveBeenCalledWith(mockSuggestions[0]);
  });

  it('shows loading state', async () => {
    const { useMatchSuggestions } = await import('../hooks/useMatchSuggestions');
    vi.mocked(useMatchSuggestions).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useMatchSuggestions>);

    render(
      <MatchSuggestions transactionId="tx-1" onAccept={onAccept} isAccepting={false} />,
      { wrapper },
    );
    expect(screen.getByTestId('match-suggestions-loading')).toBeInTheDocument();
  });

  it('shows empty state when no suggestions', async () => {
    const { useMatchSuggestions } = await import('../hooks/useMatchSuggestions');
    vi.mocked(useMatchSuggestions).mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useMatchSuggestions>);

    render(
      <MatchSuggestions transactionId="tx-1" onAccept={onAccept} isAccepting={false} />,
      { wrapper },
    );
    expect(screen.getByTestId('match-suggestions-empty')).toBeInTheDocument();
  });

  it('shows count in header', () => {
    render(
      <MatchSuggestions transactionId="tx-1" onAccept={onAccept} isAccepting={false} />,
      { wrapper },
    );
    expect(screen.getByText('Smart Match Suggestions (2)')).toBeInTheDocument();
  });
});
