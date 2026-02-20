// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PayRun } from '../types';

// Mock dependencies
vi.mock('@shared/calc/currency', () => ({
  formatCurrency: (amount: number) =>
    `$${amount.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
}));

const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

import { PayRunCard } from '../components/PayRunCard';

const DRAFT_PAY_RUN: PayRun = {
  id: 'pr-003',
  periodStart: '2026-02-01',
  periodEnd: '2026-02-28',
  payDate: '2026-03-01',
  status: 'draft',
  employees: [
    { employeeId: 'emp-001', employeeName: 'Sarah Chen', gross: 7916.67, tax: 1820.83, net: 6095.84 },
    { employeeId: 'emp-002', employeeName: 'James Wilson', gross: 9166.67, tax: 2575.00, net: 6591.67 },
  ],
  totalGross: 17083.34,
  totalTax: 4395.83,
  totalNet: 12687.51,
};

const PAID_PAY_RUN: PayRun = {
  ...DRAFT_PAY_RUN,
  id: 'pr-001',
  status: 'paid',
};

describe('PayRunCard', () => {
  it('renders pay run card with data-testid', () => {
    render(<PayRunCard payRun={DRAFT_PAY_RUN} />);
    expect(screen.getByTestId('pay-run-card-pr-003')).toBeInTheDocument();
  });

  it('renders pay date', () => {
    render(<PayRunCard payRun={DRAFT_PAY_RUN} />);
    expect(screen.getByText(/Pay Date:/)).toBeInTheDocument();
  });

  it('renders status badge for draft', () => {
    render(<PayRunCard payRun={DRAFT_PAY_RUN} />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders status badge for paid', () => {
    render(<PayRunCard payRun={PAID_PAY_RUN} />);
    expect(screen.getByText('Paid')).toBeInTheDocument();
  });

  it('renders employee count', () => {
    render(<PayRunCard payRun={DRAFT_PAY_RUN} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders gross and net amounts', () => {
    render(<PayRunCard payRun={DRAFT_PAY_RUN} />);
    expect(screen.getByText('$17,083.34')).toBeInTheDocument();
    expect(screen.getByText('$12,687.51')).toBeInTheDocument();
  });

  it('navigates to pay run detail on click', async () => {
    const user = userEvent.setup();
    render(<PayRunCard payRun={DRAFT_PAY_RUN} />);

    await user.click(screen.getByTestId('pay-run-card-pr-003'));
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/payroll/pay-runs/$payRunId',
      params: { payRunId: 'pr-003' },
    });
  });

  it('renders "Employees:" label', () => {
    render(<PayRunCard payRun={DRAFT_PAY_RUN} />);
    expect(screen.getByText('Employees:')).toBeInTheDocument();
  });

  it('renders "Gross:" label', () => {
    render(<PayRunCard payRun={DRAFT_PAY_RUN} />);
    expect(screen.getByText('Gross:')).toBeInTheDocument();
  });

  it('renders "Net:" label', () => {
    render(<PayRunCard payRun={DRAFT_PAY_RUN} />);
    expect(screen.getByText('Net:')).toBeInTheDocument();
  });
});
