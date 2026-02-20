// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@shared/calc/currency', () => ({
  formatCurrency: (amount: number) =>
    `$${amount.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
}));

import { PayrollSummary } from '../components/PayrollSummary';
import type { PayrollSummary as PayrollSummaryData } from '../types';

const SAMPLE_SUMMARY: PayrollSummaryData = {
  nextPayRunDate: '2026-03-01',
  totalEmployees: 4,
  ytdPayrollCosts: 51538.48,
};

describe('PayrollSummary', () => {
  it('renders data-testid', () => {
    render(<PayrollSummary summary={SAMPLE_SUMMARY} />);
    expect(screen.getByTestId('payroll-summary')).toBeInTheDocument();
  });

  it('renders Next Pay Run card', () => {
    render(<PayrollSummary summary={SAMPLE_SUMMARY} />);
    expect(screen.getByText('Next Pay Run')).toBeInTheDocument();
  });

  it('renders Total Employees card', () => {
    render(<PayrollSummary summary={SAMPLE_SUMMARY} />);
    expect(screen.getByText('Total Employees')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('renders YTD Payroll Costs card', () => {
    render(<PayrollSummary summary={SAMPLE_SUMMARY} />);
    expect(screen.getByText('YTD Payroll Costs')).toBeInTheDocument();
    expect(screen.getByText('$51,538.48')).toBeInTheDocument();
  });

  it('renders six summary cards', () => {
    render(<PayrollSummary summary={SAMPLE_SUMMARY} />);
    const container = screen.getByTestId('payroll-summary');
    // Grid with 6 Card children (original 3 + Total Cost Last Month, Total Tax Last Month, Next Payment Date)
    expect(container.children.length).toBe(6);
  });
});
