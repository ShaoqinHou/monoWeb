// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GSTReturnList } from '../components/GSTReturnList';
import type { GSTReturnApi } from '../hooks/useGSTReturns';

const MOCK_RETURNS: GSTReturnApi[] = [
  {
    id: 'gst-2026-01',
    period: 'Jan-Feb 2026',
    startDate: '2026-01-01',
    endDate: '2026-02-28',
    dueDate: '2026-03-28',
    status: 'draft',
    gstCollected: 18750,
    gstPaid: 12300,
    netGst: 6450,
    filedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'gst-2025-11',
    period: 'Nov-Dec 2025',
    startDate: '2025-11-01',
    endDate: '2025-12-31',
    dueDate: '2026-01-28',
    status: 'overdue',
    gstCollected: 17775,
    gstPaid: 11475,
    netGst: 6300,
    filedAt: null,
    createdAt: '2025-11-01T00:00:00Z',
  },
  {
    id: 'gst-2025-09',
    period: 'Sep-Oct 2025',
    startDate: '2025-09-01',
    endDate: '2025-10-31',
    dueDate: '2025-11-28',
    status: 'filed',
    gstCollected: 21300,
    gstPaid: 13650,
    netGst: 7650,
    filedAt: '2025-11-25T10:00:00Z',
    createdAt: '2025-09-01T00:00:00Z',
  },
];

describe('GSTReturnList', () => {
  it('renders table with column headers', () => {
    render(<GSTReturnList returns={MOCK_RETURNS} onSelectReturn={vi.fn()} />);
    expect(screen.getByText('Period')).toBeInTheDocument();
    expect(screen.getByText('Due Date')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('GST Collected')).toBeInTheDocument();
    expect(screen.getByText('GST Paid')).toBeInTheDocument();
    expect(screen.getByText('Net GST')).toBeInTheDocument();
  });

  it('renders all return periods', () => {
    render(<GSTReturnList returns={MOCK_RETURNS} onSelectReturn={vi.fn()} />);
    expect(screen.getByText('Jan-Feb 2026')).toBeInTheDocument();
    expect(screen.getByText('Nov-Dec 2025')).toBeInTheDocument();
    expect(screen.getByText('Sep-Oct 2025')).toBeInTheDocument();
  });

  it('renders Draft badge with warning variant', () => {
    render(<GSTReturnList returns={MOCK_RETURNS} onSelectReturn={vi.fn()} />);
    const draftBadge = screen.getByText('Draft');
    expect(draftBadge.className).toContain('text-[#f59e0b]');
  });

  it('renders Overdue badge with error variant', () => {
    render(<GSTReturnList returns={MOCK_RETURNS} onSelectReturn={vi.fn()} />);
    const overdueBadge = screen.getByText('Overdue');
    expect(overdueBadge.className).toContain('text-[#ef4444]');
  });

  it('renders Filed badge with success variant', () => {
    render(<GSTReturnList returns={MOCK_RETURNS} onSelectReturn={vi.fn()} />);
    const filedBadge = screen.getByText('Filed');
    expect(filedBadge.className).toContain('text-[#14b8a6]');
  });

  it('displays formatted currency values', () => {
    render(<GSTReturnList returns={MOCK_RETURNS} onSelectReturn={vi.fn()} />);
    // GST collected for first row: $18,750.00
    expect(screen.getByText('$18,750.00')).toBeInTheDocument();
    // Net GST for first row: $6,450.00
    expect(screen.getByText('$6,450.00')).toBeInTheDocument();
  });

  it('calls onSelectReturn with the return id when row is clicked', () => {
    const onSelect = vi.fn();
    render(<GSTReturnList returns={MOCK_RETURNS} onSelectReturn={onSelect} />);
    fireEvent.click(screen.getByTestId('gst-return-row-gst-2026-01'));
    expect(onSelect).toHaveBeenCalledWith('gst-2026-01');
  });

  it('shows empty state with heading and CTA when no returns', () => {
    render(<GSTReturnList returns={[]} onSelectReturn={vi.fn()} />);
    expect(screen.getByText('No GST returns')).toBeInTheDocument();
    expect(screen.getByText('Create a GST return to get started')).toBeInTheDocument();
    expect(screen.getByTestId('empty-new-gst-return-btn')).toBeInTheDocument();
  });

  it('calls onNewReturn when empty state button is clicked', () => {
    const onNewReturn = vi.fn();
    render(<GSTReturnList returns={[]} onSelectReturn={vi.fn()} onNewReturn={onNewReturn} />);
    fireEvent.click(screen.getByTestId('empty-new-gst-return-btn'));
    expect(onNewReturn).toHaveBeenCalled();
  });

  it('renders the correct number of rows', () => {
    render(<GSTReturnList returns={MOCK_RETURNS} onSelectReturn={vi.fn()} />);
    const rows = screen.getAllByTestId(/^gst-return-row-/);
    expect(rows.length).toBe(3);
  });
});
