// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BankRuleList } from '../components/BankRuleList';
import type { BankRule } from '../hooks/useBankRules';

const MOCK_RULES: BankRule[] = [
  {
    id: 'r1',
    name: 'Office Supplies',
    accountId: 'bank-acc-1',
    matchField: 'description',
    matchType: 'contains',
    matchValue: 'Staples',
    allocateToAccountCode: '6-0200',
    taxRate: 15,
    isActive: true,
    createdAt: '2025-01-15T10:00:00.000Z',
  },
  {
    id: 'r2',
    name: 'Monthly Rent',
    accountId: 'bank-acc-1',
    matchField: 'reference',
    matchType: 'equals',
    matchValue: 'RENT-MONTHLY',
    allocateToAccountCode: '6-0100',
    taxRate: 0,
    isActive: true,
    createdAt: '2025-02-20T08:00:00.000Z',
  },
  {
    id: 'r3',
    name: 'Old Internet Rule',
    accountId: 'bank-acc-2',
    matchField: 'description',
    matchType: 'starts_with',
    matchValue: 'ISP',
    allocateToAccountCode: '6-0300',
    taxRate: 15,
    isActive: false,
    createdAt: '2025-03-10T09:30:00.000Z',
  },
];

describe('BankRuleList', () => {
  const defaultProps = {
    rules: MOCK_RULES,
    isLoading: false,
    onRuleClick: vi.fn(),
    onNewRule: vi.fn(),
  };

  it('renders all rules', () => {
    render(<BankRuleList {...defaultProps} />);
    expect(screen.getByText('Office Supplies')).toBeInTheDocument();
    expect(screen.getByText('Monthly Rent')).toBeInTheDocument();
    expect(screen.getByText('Old Internet Rule')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    render(<BankRuleList {...defaultProps} />);
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Match')).toBeInTheDocument();
    expect(screen.getByText('Allocate To')).toBeInTheDocument();
    expect(screen.getByText('Tax Rate')).toBeInTheDocument();
  });

  it('shows active indicator for active rules', () => {
    render(<BankRuleList {...defaultProps} />);
    const activeStatuses = screen.getAllByText('Active');
    expect(activeStatuses).toHaveLength(2);
  });

  it('shows inactive indicator for inactive rules', () => {
    render(<BankRuleList {...defaultProps} />);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('renders match info', () => {
    render(<BankRuleList {...defaultProps} />);
    expect(screen.getByText(/description contains "Staples"/)).toBeInTheDocument();
    expect(screen.getByText(/reference equals "RENT-MONTHLY"/)).toBeInTheDocument();
  });

  it('renders allocate-to account codes', () => {
    render(<BankRuleList {...defaultProps} />);
    expect(screen.getByText('6-0200')).toBeInTheDocument();
    expect(screen.getByText('6-0100')).toBeInTheDocument();
    expect(screen.getByText('6-0300')).toBeInTheDocument();
  });

  it('renders tax rates', () => {
    render(<BankRuleList {...defaultProps} />);
    expect(screen.getAllByText('15%')).toHaveLength(2);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('calls onRuleClick when a row is clicked', async () => {
    const onRuleClick = vi.fn();
    const user = userEvent.setup();
    render(<BankRuleList {...defaultProps} onRuleClick={onRuleClick} />);

    await user.click(screen.getByText('Office Supplies'));
    expect(onRuleClick).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Office Supplies' }),
    );
  });

  it('calls onNewRule when New Rule button is clicked', async () => {
    const onNewRule = vi.fn();
    const user = userEvent.setup();
    render(<BankRuleList {...defaultProps} onNewRule={onNewRule} />);

    await user.click(screen.getByTestId('new-rule-btn'));
    expect(onNewRule).toHaveBeenCalledOnce();
  });

  it('shows loading state', () => {
    render(<BankRuleList {...defaultProps} isLoading={true} rules={[]} />);
    expect(screen.getByTestId('rules-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading bank rules...')).toBeInTheDocument();
  });

  it('shows empty state when no rules', () => {
    render(<BankRuleList {...defaultProps} rules={[]} />);
    expect(screen.getByTestId('rules-empty')).toBeInTheDocument();
    expect(screen.getByText('No bank rules found.')).toBeInTheDocument();
  });
});
