// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PayItemList } from '../components/PayItemList';
import type { PayItem } from '../hooks/usePayItems';

const SAMPLE_ITEMS: PayItem[] = [
  {
    id: 'pi-001',
    name: 'Ordinary Earnings',
    type: 'earnings',
    rateType: 'per_hour',
    amount: 30,
    accountCode: '200',
    isDefault: true,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'pi-002',
    name: 'Overtime',
    type: 'earnings',
    rateType: 'per_hour',
    amount: 45,
    accountCode: '200',
    isDefault: false,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'pi-003',
    name: 'KiwiSaver',
    type: 'deduction',
    rateType: 'percentage',
    amount: 3,
    accountCode: '850',
    isDefault: true,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'pi-004',
    name: 'Mileage',
    type: 'reimbursement',
    rateType: 'fixed',
    amount: 0.82,
    accountCode: null,
    isDefault: false,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'pi-005',
    name: 'PAYE',
    type: 'tax',
    rateType: 'percentage',
    amount: 17.5,
    accountCode: '860',
    isDefault: true,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'pi-006',
    name: 'Old Allowance',
    type: 'earnings',
    rateType: 'fixed',
    amount: 100,
    accountCode: '200',
    isDefault: false,
    isActive: false,
    createdAt: '2025-01-01T00:00:00Z',
  },
];

describe('PayItemList', () => {
  it('renders all pay items', () => {
    render(<PayItemList items={SAMPLE_ITEMS} />);

    expect(screen.getByText('Ordinary Earnings')).toBeInTheDocument();
    expect(screen.getByText('Overtime')).toBeInTheDocument();
    expect(screen.getByText('KiwiSaver')).toBeInTheDocument();
    expect(screen.getByText('Mileage')).toBeInTheDocument();
    expect(screen.getByText('PAYE')).toBeInTheDocument();
    expect(screen.getByText('Old Allowance')).toBeInTheDocument();
  });

  it('groups items by type with section headings', () => {
    render(<PayItemList items={SAMPLE_ITEMS} />);

    expect(screen.getByText(/Earnings \(3\)/)).toBeInTheDocument();
    expect(screen.getByText(/Deductions \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Reimbursements \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Tax \(1\)/)).toBeInTheDocument();
  });

  it('shows group counts in headings', () => {
    render(<PayItemList items={SAMPLE_ITEMS} />);

    // 3 earnings, 1 deduction, 1 reimbursement, 1 tax
    expect(screen.getByText(/Earnings \(3\)/)).toBeInTheDocument();
    expect(screen.getByText(/Deductions \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Reimbursements \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Tax \(1\)/)).toBeInTheDocument();
  });

  it('renders table headers for each group', () => {
    render(<PayItemList items={SAMPLE_ITEMS} />);

    // Each group has a table with these headers
    const nameHeaders = screen.getAllByText('Name');
    expect(nameHeaders.length).toBeGreaterThanOrEqual(4); // one per group

    const rateTypeHeaders = screen.getAllByText('Rate Type');
    expect(rateTypeHeaders.length).toBeGreaterThanOrEqual(4);
  });

  it('renders rate type labels correctly', () => {
    render(<PayItemList items={SAMPLE_ITEMS} />);

    const perHourLabels = screen.getAllByText('Per Hour');
    expect(perHourLabels.length).toBe(2); // Ordinary + Overtime

    expect(screen.getAllByText('Percentage').length).toBe(2); // KiwiSaver + PAYE
    expect(screen.getAllByText('Fixed').length).toBe(2); // Mileage + Old Allowance
  });

  it('renders percentage amounts with % sign', () => {
    render(<PayItemList items={SAMPLE_ITEMS} />);

    expect(screen.getByText('3%')).toBeInTheDocument();
    expect(screen.getByText('17.5%')).toBeInTheDocument();
  });

  it('renders currency amounts for non-percentage items', () => {
    render(<PayItemList items={SAMPLE_ITEMS} />);

    expect(screen.getByText('$30.00')).toBeInTheDocument();
    expect(screen.getByText('$45.00')).toBeInTheDocument();
  });

  it('shows account code or dash when null', () => {
    render(<PayItemList items={SAMPLE_ITEMS} />);

    // Multiple items have code 200
    const code200 = screen.getAllByText('200');
    expect(code200.length).toBe(3); // Ordinary Earnings, Overtime, Old Allowance

    expect(screen.getByText('850')).toBeInTheDocument();
    expect(screen.getByText('860')).toBeInTheDocument();
    // Mileage has no account code, shows dash
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('shows default status', () => {
    render(<PayItemList items={SAMPLE_ITEMS} />);

    const yesLabels = screen.getAllByText('Yes');
    const noLabels = screen.getAllByText('No');

    // 3 defaults: Ordinary Earnings, KiwiSaver, PAYE
    expect(yesLabels.length).toBe(3);
    // 3 non-defaults: Overtime, Mileage, Old Allowance
    expect(noLabels.length).toBe(3);
  });

  it('shows active/inactive status badges', () => {
    render(<PayItemList items={SAMPLE_ITEMS} />);

    const activeBadges = screen.getAllByText('Active');
    const inactiveBadges = screen.getAllByText('Inactive');

    expect(activeBadges.length).toBe(5); // all except Old Allowance
    expect(inactiveBadges.length).toBe(1); // Old Allowance
  });

  it('shows empty state when no items', () => {
    render(<PayItemList items={[]} />);
    expect(screen.getByText('No pay items found')).toBeInTheDocument();
  });

  it('calls onEdit when a row is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<PayItemList items={SAMPLE_ITEMS} onEdit={onEdit} />);

    await user.click(screen.getByText('Ordinary Earnings'));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(SAMPLE_ITEMS[0]);
  });

  it('does not render groups with no items', () => {
    const earningsOnly: PayItem[] = [
      {
        id: 'pi-only',
        name: 'Base Pay',
        type: 'earnings',
        rateType: 'fixed',
        amount: 1000,
        accountCode: null,
        isDefault: false,
        isActive: true,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];
    render(<PayItemList items={earningsOnly} />);

    expect(screen.getByText(/Earnings/)).toBeInTheDocument();
    expect(screen.queryByText(/Deductions/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Reimbursements/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Tax/)).not.toBeInTheDocument();
  });

  it('renders data-testid for the container', () => {
    render(<PayItemList items={[]} />);
    expect(screen.getByTestId('pay-item-list')).toBeInTheDocument();
  });
});
