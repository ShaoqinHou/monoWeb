// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PurchasesSummary } from '../components/PurchasesSummary';
import type { PurchasesSummaryData } from '../hooks/usePurchases';

const mockData: PurchasesSummaryData = {
  totalPurchasesYTD: 175000,
  outstandingBills: 32000,
  overdueAmount: 8500,
};

describe('PurchasesSummary', () => {
  it('renders loading skeleton with 3 pulse placeholders', () => {
    render(<PurchasesSummary data={undefined} isLoading={true} />);
    const container = screen.getByTestId('purchases-summary-loading');
    expect(container).toBeInTheDocument();
    const pulses = container.querySelectorAll('.animate-pulse');
    expect(pulses.length).toBe(6); // 2 per card x 3 cards
  });

  it('returns null when data is undefined and not loading', () => {
    const { container } = render(<PurchasesSummary data={undefined} isLoading={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders all three summary cards with correct labels', () => {
    render(<PurchasesSummary data={mockData} isLoading={false} />);
    expect(screen.getByTestId('purchases-summary')).toBeInTheDocument();
    expect(screen.getByText('Total Purchases (YTD)')).toBeInTheDocument();
    expect(screen.getByText('Outstanding Bills')).toBeInTheDocument();
    expect(screen.getByText('Overdue Amount')).toBeInTheDocument();
  });

  it('displays formatted currency values', () => {
    render(<PurchasesSummary data={mockData} isLoading={false} />);
    expect(screen.getByText('$175,000.00')).toBeInTheDocument();
    expect(screen.getByText('$32,000.00')).toBeInTheDocument();
    expect(screen.getByText('$8,500.00')).toBeInTheDocument();
  });

  it('applies warning variant (red text) to overdue amount', () => {
    render(<PurchasesSummary data={mockData} isLoading={false} />);
    const overdueValue = screen.getByText('$8,500.00');
    expect(overdueValue.className).toContain('text-red-600');
  });

  it('applies default variant (gray text) to non-overdue cards', () => {
    render(<PurchasesSummary data={mockData} isLoading={false} />);
    const totalValue = screen.getByText('$175,000.00');
    expect(totalValue.className).toContain('text-gray-900');
    expect(totalValue.className).not.toContain('text-red-600');
  });

  it('uses 3-column grid layout on large screens', () => {
    render(<PurchasesSummary data={mockData} isLoading={false} />);
    const grid = screen.getByTestId('purchases-summary');
    expect(grid.className).toContain('lg:grid-cols-3');
  });

  it('handles zero values correctly', () => {
    const zeroData: PurchasesSummaryData = {
      totalPurchasesYTD: 0,
      outstandingBills: 0,
      overdueAmount: 0,
    };
    render(<PurchasesSummary data={zeroData} isLoading={false} />);
    const zeroAmounts = screen.getAllByText('$0.00');
    expect(zeroAmounts.length).toBe(3);
  });

  it('handles large values with proper formatting', () => {
    const largeData: PurchasesSummaryData = {
      totalPurchasesYTD: 1234567.89,
      outstandingBills: 999999.99,
      overdueAmount: 500000,
    };
    render(<PurchasesSummary data={largeData} isLoading={false} />);
    expect(screen.getByText('$1,234,567.89')).toBeInTheDocument();
    expect(screen.getByText('$999,999.99')).toBeInTheDocument();
    expect(screen.getByText('$500,000.00')).toBeInTheDocument();
  });
});
