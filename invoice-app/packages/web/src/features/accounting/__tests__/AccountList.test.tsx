// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountList } from '../components/AccountList';
import type { AccountGroup } from '../types';

const MOCK_GROUPS: AccountGroup[] = [
  {
    type: 'revenue',
    label: 'Revenue',
    accounts: [
      { id: '1', code: '4-0000', name: 'Sales', type: 'revenue', taxType: 'output', isArchived: false, balance: 45000 },
      { id: '2', code: '4-0100', name: 'Other Revenue', type: 'revenue', taxType: 'output', isArchived: false, balance: 2000 },
    ],
  },
  {
    type: 'expense',
    label: 'Expenses',
    accounts: [
      { id: '3', code: '6-0100', name: 'Advertising', type: 'expense', taxType: 'input', isArchived: false, balance: 3200 },
    ],
  },
  {
    type: 'asset',
    label: 'Assets',
    accounts: [
      { id: '4', code: '1-0000', name: 'Bank Account', type: 'asset', taxType: 'none', isArchived: false, balance: 25000 },
    ],
  },
];

describe('AccountList', () => {
  it('renders all account type sections', () => {
    render(<AccountList groups={MOCK_GROUPS} />);

    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Expenses')).toBeInTheDocument();
    expect(screen.getByText('Assets')).toBeInTheDocument();
  });

  it('renders accounts within each section', () => {
    render(<AccountList groups={MOCK_GROUPS} />);

    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('Other Revenue')).toBeInTheDocument();
    expect(screen.getByText('Advertising')).toBeInTheDocument();
    expect(screen.getByText('Bank Account')).toBeInTheDocument();
  });

  it('renders account codes', () => {
    render(<AccountList groups={MOCK_GROUPS} />);

    expect(screen.getByText('4-0000')).toBeInTheDocument();
    expect(screen.getByText('4-0100')).toBeInTheDocument();
    expect(screen.getByText('6-0100')).toBeInTheDocument();
    expect(screen.getByText('1-0000')).toBeInTheDocument();
  });

  it('renders formatted balances', () => {
    render(<AccountList groups={MOCK_GROUPS} />);

    expect(screen.getByText('$45,000.00')).toBeInTheDocument();
    expect(screen.getByText('$2,000.00')).toBeInTheDocument();
    expect(screen.getByText('$3,200.00')).toBeInTheDocument();
    expect(screen.getByText('$25,000.00')).toBeInTheDocument();
  });

  it('sections are expanded by default', () => {
    render(<AccountList groups={MOCK_GROUPS} />);

    // All accounts should be visible
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('Advertising')).toBeInTheDocument();
    expect(screen.getByText('Bank Account')).toBeInTheDocument();
  });

  it('sections can be collapsed by clicking the header', async () => {
    const user = userEvent.setup();
    render(<AccountList groups={MOCK_GROUPS} />);

    const revenueButton = screen.getByLabelText('Revenue section');
    await user.click(revenueButton);

    // Revenue accounts should be hidden
    expect(screen.queryByText('4-0000')).not.toBeInTheDocument();
    expect(screen.queryByText('Other Revenue')).not.toBeInTheDocument();

    // Other sections should still be visible
    expect(screen.getByText('Advertising')).toBeInTheDocument();
    expect(screen.getByText('Bank Account')).toBeInTheDocument();
  });

  it('collapsed sections can be expanded again', async () => {
    const user = userEvent.setup();
    render(<AccountList groups={MOCK_GROUPS} />);

    const revenueButton = screen.getByLabelText('Revenue section');

    // Collapse
    await user.click(revenueButton);
    expect(screen.queryByText('4-0000')).not.toBeInTheDocument();

    // Expand
    await user.click(revenueButton);
    expect(screen.getByText('4-0000')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
  });

  it('shows empty state when no groups', () => {
    render(<AccountList groups={[]} />);
    expect(screen.getByText('No accounts found.')).toBeInTheDocument();
  });

  it('section buttons have aria-expanded attribute', () => {
    render(<AccountList groups={MOCK_GROUPS} />);

    const revenueButton = screen.getByLabelText('Revenue section');
    expect(revenueButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('aria-expanded is false when section is collapsed', async () => {
    const user = userEvent.setup();
    render(<AccountList groups={MOCK_GROUPS} />);

    const revenueButton = screen.getByLabelText('Revenue section');
    await user.click(revenueButton);
    expect(revenueButton).toHaveAttribute('aria-expanded', 'false');
  });
});
