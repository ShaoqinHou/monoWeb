// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActivityStatementsList } from '../components/ActivityStatementsList';
import type { ActivityStatement } from '../hooks/useActivityStatements';

const MOCK_STATEMENTS: ActivityStatement[] = [
  {
    id: 'as-1',
    period: 'Jan-Feb 2026',
    startDate: '2026-01-01',
    endDate: '2026-02-28',
    dueDate: '2026-03-28',
    status: 'due',
    gstAmount: 6450,
    payeAmount: 3200,
    totalAmount: 9650,
    filedAt: null,
  },
  {
    id: 'as-2',
    period: 'Nov-Dec 2025',
    startDate: '2025-11-01',
    endDate: '2025-12-31',
    dueDate: '2026-01-28',
    status: 'overdue',
    gstAmount: 6300,
    payeAmount: 3100,
    totalAmount: 9400,
    filedAt: null,
  },
  {
    id: 'as-3',
    period: 'Sep-Oct 2025',
    startDate: '2025-09-01',
    endDate: '2025-10-31',
    dueDate: '2025-11-28',
    status: 'filed',
    gstAmount: 7650,
    payeAmount: 3400,
    totalAmount: 11050,
    filedAt: '2025-11-20T10:00:00Z',
  },
];

describe('ActivityStatementsList', () => {
  it('renders the list with correct number of rows', () => {
    render(<ActivityStatementsList statements={MOCK_STATEMENTS} />);
    expect(screen.getByTestId('activity-statements-list')).toBeInTheDocument();
    expect(screen.getByTestId('statement-row-as-1')).toBeInTheDocument();
    expect(screen.getByTestId('statement-row-as-2')).toBeInTheDocument();
    expect(screen.getByTestId('statement-row-as-3')).toBeInTheDocument();
  });

  it('displays period labels', () => {
    render(<ActivityStatementsList statements={MOCK_STATEMENTS} />);
    expect(screen.getByText('Jan-Feb 2026')).toBeInTheDocument();
    expect(screen.getByText('Nov-Dec 2025')).toBeInTheDocument();
    expect(screen.getByText('Sep-Oct 2025')).toBeInTheDocument();
  });

  it('displays status badges', () => {
    render(<ActivityStatementsList statements={MOCK_STATEMENTS} />);
    expect(screen.getByText('Due')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
    expect(screen.getByText('Filed')).toBeInTheDocument();
  });

  it('displays amounts', () => {
    render(<ActivityStatementsList statements={MOCK_STATEMENTS} />);
    expect(screen.getByText('$9,650.00')).toBeInTheDocument();
    expect(screen.getByText('$9,400.00')).toBeInTheDocument();
    expect(screen.getByText('$11,050.00')).toBeInTheDocument();
  });

  it('shows empty message when no statements', () => {
    render(<ActivityStatementsList statements={[]} />);
    expect(screen.getByText('No activity statements found.')).toBeInTheDocument();
  });
});
