import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: any) => <a href={to} {...rest}>{children}</a>,
  useParams: () => ({ journalId: 'j-1' }),
  useNavigate: () => mockNavigate,
}));

const mockUseJournal = vi.fn();

vi.mock('../hooks/useJournals', () => ({
  useJournal: (...args: unknown[]) => mockUseJournal(...args),
}));

import { JournalDetailPage } from '../routes/JournalDetailPage';

describe('JournalDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockJournal = {
    id: 'j-1',
    date: '2026-01-15',
    narration: 'Office supplies purchase',
    status: 'posted' as const,
    lines: [
      {
        id: 'line-1',
        accountId: 'acc-1',
        accountName: 'Office Supplies',
        description: 'Pens and paper',
        debit: 150.0,
        credit: 0,
      },
      {
        id: 'line-2',
        accountId: 'acc-2',
        accountName: 'Cash at Bank',
        description: 'Payment',
        debit: 0,
        credit: 150.0,
      },
    ],
  };

  it('shows loading state while fetching journal', () => {
    mockUseJournal.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(<JournalDetailPage />);
    expect(screen.getByTestId('journal-loading')).toHaveTextContent('Loading journal...');
  });

  it('shows not-found state when journal is missing', () => {
    mockUseJournal.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });

    render(<JournalDetailPage />);
    expect(screen.getByTestId('journal-not-found')).toHaveTextContent(
      'The requested journal entry could not be found.',
    );
  });

  it('shows not-found state when there is a load error', () => {
    mockUseJournal.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
    });

    render(<JournalDetailPage />);
    expect(screen.getByTestId('journal-not-found')).toBeInTheDocument();
  });

  it('displays journal header information', () => {
    mockUseJournal.mockReturnValue({
      data: mockJournal,
      isLoading: false,
      error: null,
    });

    render(<JournalDetailPage />);

    expect(screen.getByTestId('journal-date')).toHaveTextContent('2026-01-15');
    expect(screen.getByTestId('journal-number')).toHaveTextContent('j-1');
    expect(screen.getByTestId('journal-status')).toHaveTextContent('Posted');
    expect(screen.getByTestId('journal-narration')).toHaveTextContent('Office supplies purchase');
  });

  it('displays journal lines in a table', () => {
    mockUseJournal.mockReturnValue({
      data: mockJournal,
      isLoading: false,
      error: null,
    });

    render(<JournalDetailPage />);

    const table = screen.getByTestId('journal-lines-table');
    expect(table).toBeInTheDocument();

    expect(screen.getByText('Office Supplies')).toBeInTheDocument();
    expect(screen.getByText('Pens and paper')).toBeInTheDocument();
    expect(screen.getByText('Cash at Bank')).toBeInTheDocument();
    expect(screen.getByText('Payment')).toBeInTheDocument();
  });

  it('displays totals that balance (debits = credits)', () => {
    mockUseJournal.mockReturnValue({
      data: mockJournal,
      isLoading: false,
      error: null,
    });

    render(<JournalDetailPage />);

    const totalDebits = screen.getByTestId('total-debits');
    const totalCredits = screen.getByTestId('total-credits');

    // Both should show $150.00
    expect(totalDebits.textContent).toContain('150.00');
    expect(totalCredits.textContent).toContain('150.00');
  });

  it('does not show unbalanced warning when journal is balanced', () => {
    mockUseJournal.mockReturnValue({
      data: mockJournal,
      isLoading: false,
      error: null,
    });

    render(<JournalDetailPage />);
    expect(screen.queryByTestId('unbalanced-warning')).not.toBeInTheDocument();
  });

  it('shows unbalanced warning when debits != credits', () => {
    const unbalancedJournal = {
      ...mockJournal,
      lines: [
        {
          id: 'line-1',
          accountId: 'acc-1',
          accountName: 'Office Supplies',
          description: 'Pens',
          debit: 200.0,
          credit: 0,
        },
        {
          id: 'line-2',
          accountId: 'acc-2',
          accountName: 'Cash at Bank',
          description: 'Payment',
          debit: 0,
          credit: 150.0,
        },
      ],
    };

    mockUseJournal.mockReturnValue({
      data: unbalancedJournal,
      isLoading: false,
      error: null,
    });

    render(<JournalDetailPage />);
    expect(screen.getByTestId('unbalanced-warning')).toBeInTheDocument();
    expect(screen.getByTestId('unbalanced-warning')).toHaveTextContent(
      'unbalanced',
    );
  });

  it('renders action buttons', () => {
    mockUseJournal.mockReturnValue({
      data: mockJournal,
      isLoading: false,
      error: null,
    });

    render(<JournalDetailPage />);

    expect(screen.getByRole('button', { name: /back to journals/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /print \/ export/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reverse/i })).toBeInTheDocument();
  });

  it('renders breadcrumbs with journal narration', () => {
    mockUseJournal.mockReturnValue({
      data: mockJournal,
      isLoading: false,
      error: null,
    });

    render(<JournalDetailPage />);

    // "Office supplies purchase" appears in both breadcrumb and narration field
    const narrationElements = screen.getAllByText('Office supplies purchase');
    expect(narrationElements.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Manual journals')).toBeInTheDocument();
  });

  it('passes journalId to useJournal hook', () => {
    mockUseJournal.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(<JournalDetailPage />);
    expect(mockUseJournal).toHaveBeenCalledWith('j-1');
  });

  it('shows "No description" when narration is empty', () => {
    const noNarrationJournal = {
      ...mockJournal,
      narration: '',
    };

    mockUseJournal.mockReturnValue({
      data: noNarrationJournal,
      isLoading: false,
      error: null,
    });

    render(<JournalDetailPage />);
    expect(screen.getByTestId('journal-narration')).toHaveTextContent('No description');
  });
});
