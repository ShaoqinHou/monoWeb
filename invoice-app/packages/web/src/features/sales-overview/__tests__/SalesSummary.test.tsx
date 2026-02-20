// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SalesSummary } from '../components/SalesSummary';
import type { SalesSummaryData } from '../hooks/useSales';

const mockData: SalesSummaryData = {
  totalSalesYTD: 250000,
  outstandingInvoices: 45000,
  overdueAmount: 12500,
  averageDaysToPay: 22,
  invoiceCount: 75,
  paidCount: 50,
  overdueCount: 8,
};

describe('SalesSummary', () => {
  it('renders loading skeleton with 4 pulse placeholders', () => {
    render(<SalesSummary data={undefined} isLoading={true} />);
    const container = screen.getByTestId('sales-summary-loading');
    expect(container).toBeInTheDocument();
    const pulses = container.querySelectorAll('.animate-pulse');
    expect(pulses.length).toBe(8); // 2 per card x 4 cards
  });

  it('returns null when data is undefined and not loading', () => {
    const { container } = render(<SalesSummary data={undefined} isLoading={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders all four summary cards with correct labels', () => {
    render(<SalesSummary data={mockData} isLoading={false} />);
    expect(screen.getByTestId('sales-summary')).toBeInTheDocument();
    expect(screen.getByText('Total Sales (YTD)')).toBeInTheDocument();
    expect(screen.getByText('Outstanding Invoices')).toBeInTheDocument();
    expect(screen.getByText('Overdue Amount')).toBeInTheDocument();
    expect(screen.getByText('Average Days to Pay')).toBeInTheDocument();
  });

  it('displays formatted currency for monetary fields', () => {
    render(<SalesSummary data={mockData} isLoading={false} />);
    expect(screen.getByText('$250,000.00')).toBeInTheDocument();
    expect(screen.getByText('$45,000.00')).toBeInTheDocument();
    expect(screen.getByText('$12,500.00')).toBeInTheDocument();
  });

  it('displays average days to pay with "days" suffix', () => {
    render(<SalesSummary data={mockData} isLoading={false} />);
    expect(screen.getByText('22 days')).toBeInTheDocument();
  });

  it('applies warning variant (red text) to overdue amount', () => {
    render(<SalesSummary data={mockData} isLoading={false} />);
    const overdueValue = screen.getByText('$12,500.00');
    expect(overdueValue.className).toContain('text-red-600');
  });

  it('applies default variant (gray text) to non-overdue cards', () => {
    render(<SalesSummary data={mockData} isLoading={false} />);
    const totalSalesValue = screen.getByText('$250,000.00');
    expect(totalSalesValue.className).toContain('text-gray-900');
    expect(totalSalesValue.className).not.toContain('text-red-600');
  });

  it('uses 4-column grid layout on large screens', () => {
    render(<SalesSummary data={mockData} isLoading={false} />);
    const grid = screen.getByTestId('sales-summary');
    expect(grid.className).toContain('lg:grid-cols-4');
  });

  it('handles zero values correctly', () => {
    const zeroData: SalesSummaryData = {
      totalSalesYTD: 0,
      outstandingInvoices: 0,
      overdueAmount: 0,
      averageDaysToPay: 0,
      invoiceCount: 0,
      paidCount: 0,
      overdueCount: 0,
    };
    render(<SalesSummary data={zeroData} isLoading={false} />);
    expect(screen.getByText('0 days')).toBeInTheDocument();
    const zeroAmounts = screen.getAllByText('$0.00');
    expect(zeroAmounts.length).toBe(3);
  });
});
