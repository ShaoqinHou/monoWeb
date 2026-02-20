// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectExpenseList } from '../components/ProjectExpenseList';
import type { ProjectExpense } from '../hooks/useProjectExpenses';

const MOCK_EXPENSES: ProjectExpense[] = [
  {
    id: 'exp-1',
    projectId: 'proj-1',
    description: 'Office supplies',
    amount: 150.50,
    date: '2026-02-01',
    category: 'materials',
    isBillable: true,
    isInvoiced: false,
    createdAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'exp-2',
    projectId: 'proj-1',
    description: 'Travel to client',
    amount: 350,
    date: '2026-02-05',
    category: 'travel',
    isBillable: true,
    isInvoiced: true,
    createdAt: '2026-02-05T10:00:00Z',
  },
  {
    id: 'exp-3',
    projectId: 'proj-1',
    description: 'Internal meeting lunch',
    amount: 75,
    date: '2026-02-10',
    category: null,
    isBillable: false,
    isInvoiced: false,
    createdAt: '2026-02-10T10:00:00Z',
  },
];

describe('ProjectExpenseList', () => {
  it('renders table with column headers', () => {
    render(<ProjectExpenseList expenses={MOCK_EXPENSES} />);
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders all expense rows', () => {
    render(<ProjectExpenseList expenses={MOCK_EXPENSES} />);
    expect(screen.getByText('Office supplies')).toBeInTheDocument();
    expect(screen.getByText('Travel to client')).toBeInTheDocument();
    expect(screen.getByText('Internal meeting lunch')).toBeInTheDocument();
  });

  it('shows empty state when no expenses', () => {
    render(<ProjectExpenseList expenses={[]} />);
    expect(screen.getByTestId('empty-expenses')).toBeInTheDocument();
    expect(screen.getByText('No expenses yet')).toBeInTheDocument();
  });

  it('shows summary bar with totals', () => {
    render(<ProjectExpenseList expenses={MOCK_EXPENSES} />);
    const summary = screen.getByTestId('expense-summary');
    expect(summary).toBeInTheDocument();
    // Total: 150.50 + 350 + 75 = 575.50
    expect(screen.getByTestId('summary-total')).toHaveTextContent('$575.50');
    // Billable: 150.50 + 350 = 500.50
    expect(screen.getByTestId('summary-billable')).toHaveTextContent('$500.50');
    expect(screen.getByTestId('summary-count')).toHaveTextContent('3');
  });

  it('displays formatted currency amounts', () => {
    render(<ProjectExpenseList expenses={MOCK_EXPENSES} />);
    expect(screen.getByText('$150.50')).toBeInTheDocument();
    expect(screen.getByText('$350.00')).toBeInTheDocument();
  });

  it('shows category or dash when null', () => {
    render(<ProjectExpenseList expenses={MOCK_EXPENSES} />);
    expect(screen.getByText('materials')).toBeInTheDocument();
    expect(screen.getByText('travel')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('shows billable/non-billable badges', () => {
    render(<ProjectExpenseList expenses={MOCK_EXPENSES} />);
    const billableBadges = screen.getAllByText('Billable');
    expect(billableBadges.length).toBe(2);
    expect(screen.getByText('Non-billable')).toBeInTheDocument();
  });

  it('shows invoiced badge when applicable', () => {
    render(<ProjectExpenseList expenses={MOCK_EXPENSES} />);
    expect(screen.getByText('Invoiced')).toBeInTheDocument();
  });

  it('renders edit and delete buttons when callbacks provided', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <ProjectExpenseList
        expenses={MOCK_EXPENSES}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );
    expect(screen.getByLabelText('Edit Office supplies')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete Office supplies')).toBeInTheDocument();
  });

  it('calls onEdit with expense when Edit is clicked', () => {
    const onEdit = vi.fn();
    render(<ProjectExpenseList expenses={MOCK_EXPENSES} onEdit={onEdit} />);
    fireEvent.click(screen.getByLabelText('Edit Office supplies'));
    expect(onEdit).toHaveBeenCalledWith(MOCK_EXPENSES[0]);
  });

  it('calls onDelete with expense id when Delete is clicked', () => {
    const onDelete = vi.fn();
    render(<ProjectExpenseList expenses={MOCK_EXPENSES} onDelete={onDelete} />);
    fireEvent.click(screen.getByLabelText('Delete Office supplies'));
    expect(onDelete).toHaveBeenCalledWith('exp-1');
  });

  it('does not render Actions column when no callbacks', () => {
    render(<ProjectExpenseList expenses={MOCK_EXPENSES} />);
    expect(screen.queryByText('Actions')).not.toBeInTheDocument();
  });
});
