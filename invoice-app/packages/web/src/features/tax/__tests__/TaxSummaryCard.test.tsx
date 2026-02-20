// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaxSummaryCard } from '../components/TaxSummaryCard';
import type { TaxSummary } from '../types';

const MOCK_SUMMARY: TaxSummary = {
  taxCollected: 109545,
  taxPaid: 71835,
  netGSTPayable: 37710,
  periodCount: 6,
};

describe('TaxSummaryCard', () => {
  it('renders the "Tax Summary" heading', () => {
    render(<TaxSummaryCard summary={MOCK_SUMMARY} />);
    expect(screen.getByText('Tax Summary')).toBeInTheDocument();
  });

  it('displays tax collected (output tax)', () => {
    render(<TaxSummaryCard summary={MOCK_SUMMARY} />);
    expect(screen.getByTestId('tax-collected')).toBeInTheDocument();
    expect(screen.getByText('Tax Collected (Output Tax)')).toBeInTheDocument();
    expect(screen.getByText('$109,545.00')).toBeInTheDocument();
  });

  it('displays tax paid (input tax)', () => {
    render(<TaxSummaryCard summary={MOCK_SUMMARY} />);
    expect(screen.getByTestId('tax-paid')).toBeInTheDocument();
    expect(screen.getByText('Tax Paid (Input Tax)')).toBeInTheDocument();
    expect(screen.getByText('$71,835.00')).toBeInTheDocument();
  });

  it('displays net GST payable', () => {
    render(<TaxSummaryCard summary={MOCK_SUMMARY} />);
    expect(screen.getByTestId('net-gst-payable')).toBeInTheDocument();
    expect(screen.getByText('Net GST Payable')).toBeInTheDocument();
    expect(screen.getByText('$37,710.00')).toBeInTheDocument();
  });

  it('displays period count', () => {
    render(<TaxSummaryCard summary={MOCK_SUMMARY} />);
    expect(screen.getByTestId('period-count')).toHaveTextContent('Based on 6 filing periods');
  });

  it('uses singular "period" when count is 1', () => {
    render(<TaxSummaryCard summary={{ ...MOCK_SUMMARY, periodCount: 1 }} />);
    expect(screen.getByTestId('period-count')).toHaveTextContent('Based on 1 filing period');
  });
});
