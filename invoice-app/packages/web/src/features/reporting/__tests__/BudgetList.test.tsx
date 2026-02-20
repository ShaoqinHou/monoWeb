// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BudgetList } from '../components/BudgetList';
import type { Budget } from '../hooks/useBudgets';

const SAMPLE_BUDGETS: Budget[] = [
  {
    id: 'b-001',
    name: 'FY2025 Operating Budget',
    financialYear: '2025',
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'b-002',
    name: 'FY2026 Draft Budget',
    financialYear: '2026',
    status: 'draft',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'b-003',
    name: 'FY2024 Archived Budget',
    financialYear: '2024',
    status: 'archived',
    createdAt: '2024-01-01T00:00:00Z',
  },
];

describe('BudgetList', () => {
  it('renders all budgets passed as props', () => {
    render(<BudgetList budgets={SAMPLE_BUDGETS} />);

    expect(screen.getByText('FY2025 Operating Budget')).toBeInTheDocument();
    expect(screen.getByText('FY2026 Draft Budget')).toBeInTheDocument();
    expect(screen.getByText('FY2024 Archived Budget')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    render(<BudgetList budgets={SAMPLE_BUDGETS} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Financial Year')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<BudgetList budgets={SAMPLE_BUDGETS} />);
    expect(screen.getByPlaceholderText('Search budgets...')).toBeInTheDocument();
  });

  it('renders status filter select', () => {
    render(<BudgetList budgets={SAMPLE_BUDGETS} />);
    expect(screen.getByLabelText('Filter by status')).toBeInTheDocument();
  });

  it('filters by name search', async () => {
    const user = userEvent.setup();
    render(<BudgetList budgets={SAMPLE_BUDGETS} />);

    const searchInput = screen.getByPlaceholderText('Search budgets...');
    await user.type(searchInput, 'Draft');

    expect(screen.getByText('FY2026 Draft Budget')).toBeInTheDocument();
    expect(screen.queryByText('FY2025 Operating Budget')).not.toBeInTheDocument();
    expect(screen.queryByText('FY2024 Archived Budget')).not.toBeInTheDocument();
  });

  it('filters by financial year search', async () => {
    const user = userEvent.setup();
    render(<BudgetList budgets={SAMPLE_BUDGETS} />);

    const searchInput = screen.getByPlaceholderText('Search budgets...');
    await user.type(searchInput, '2024');

    expect(screen.getByText('FY2024 Archived Budget')).toBeInTheDocument();
    expect(screen.queryByText('FY2025 Operating Budget')).not.toBeInTheDocument();
  });

  it('filters by status: active', async () => {
    const user = userEvent.setup();
    render(<BudgetList budgets={SAMPLE_BUDGETS} />);

    const statusSelect = screen.getByLabelText('Filter by status');
    await user.selectOptions(statusSelect, 'active');

    expect(screen.getByText('FY2025 Operating Budget')).toBeInTheDocument();
    expect(screen.queryByText('FY2026 Draft Budget')).not.toBeInTheDocument();
    expect(screen.queryByText('FY2024 Archived Budget')).not.toBeInTheDocument();
  });

  it('filters by status: draft', async () => {
    const user = userEvent.setup();
    render(<BudgetList budgets={SAMPLE_BUDGETS} />);

    const statusSelect = screen.getByLabelText('Filter by status');
    await user.selectOptions(statusSelect, 'draft');

    expect(screen.getByText('FY2026 Draft Budget')).toBeInTheDocument();
    expect(screen.queryByText('FY2025 Operating Budget')).not.toBeInTheDocument();
  });

  it('filters by status: archived', async () => {
    const user = userEvent.setup();
    render(<BudgetList budgets={SAMPLE_BUDGETS} />);

    const statusSelect = screen.getByLabelText('Filter by status');
    await user.selectOptions(statusSelect, 'archived');

    expect(screen.getByText('FY2024 Archived Budget')).toBeInTheDocument();
    expect(screen.queryByText('FY2025 Operating Budget')).not.toBeInTheDocument();
  });

  it('shows "No budgets found" when no results', async () => {
    const user = userEvent.setup();
    render(<BudgetList budgets={SAMPLE_BUDGETS} />);

    const searchInput = screen.getByPlaceholderText('Search budgets...');
    await user.type(searchInput, 'zzz_nonexistent_zzz');

    expect(screen.getByText('No budgets found')).toBeInTheDocument();
  });

  it('renders empty state when no budgets', () => {
    render(<BudgetList budgets={[]} />);
    expect(screen.getByText('No budgets found')).toBeInTheDocument();
  });

  it('shows correct status badge text', () => {
    render(<BudgetList budgets={SAMPLE_BUDGETS} />);

    // Status badges are spans with rounded-full class
    const activeBadges = screen.getAllByText('Active').filter(
      (el) => el.tagName === 'SPAN' && el.classList.contains('rounded-full'),
    );
    expect(activeBadges.length).toBe(1);

    const draftBadges = screen.getAllByText('Draft').filter(
      (el) => el.tagName === 'SPAN' && el.classList.contains('rounded-full'),
    );
    expect(draftBadges.length).toBe(1);

    const archivedBadges = screen.getAllByText('Archived').filter(
      (el) => el.tagName === 'SPAN' && el.classList.contains('rounded-full'),
    );
    expect(archivedBadges.length).toBe(1);
  });

  it('displays financial year for each budget', () => {
    render(<BudgetList budgets={SAMPLE_BUDGETS} />);

    expect(screen.getByText('2025')).toBeInTheDocument();
    expect(screen.getByText('2026')).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument();
  });

  it('calls onSelect when a row is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<BudgetList budgets={SAMPLE_BUDGETS} onSelect={onSelect} />);

    await user.click(screen.getByText('FY2025 Operating Budget'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(SAMPLE_BUDGETS[0]);
  });

  it('combines search and status filter', async () => {
    const user = userEvent.setup();
    render(<BudgetList budgets={SAMPLE_BUDGETS} />);

    const statusSelect = screen.getByLabelText('Filter by status');
    await user.selectOptions(statusSelect, 'active');

    const searchInput = screen.getByPlaceholderText('Search budgets...');
    await user.type(searchInput, 'Operating');

    expect(screen.getByText('FY2025 Operating Budget')).toBeInTheDocument();
    expect(screen.queryByText('FY2026 Draft Budget')).not.toBeInTheDocument();
  });
});
