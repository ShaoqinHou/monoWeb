// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaxRateList } from '../components/TaxRateList';

describe('TaxRateList', () => {
  it('renders the "Tax Rates" heading', () => {
    render(<TaxRateList />);
    expect(screen.getByText('Tax Rates')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<TaxRateList />);
    expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /rate/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /default/i })).toBeInTheDocument();
  });

  it('renders all NZ tax rates from shared constants', () => {
    render(<TaxRateList />);
    expect(screen.getByText('GST on Income')).toBeInTheDocument();
    expect(screen.getByText('GST on Expenses')).toBeInTheDocument();
    expect(screen.getByText('No GST')).toBeInTheDocument();
    expect(screen.getByText('GST Free Income')).toBeInTheDocument();
    expect(screen.getByText('GST Free Expenses')).toBeInTheDocument();
  });

  it('renders 15% rate for GST on Income', () => {
    render(<TaxRateList />);
    const rates = screen.getAllByText('15%');
    expect(rates.length).toBe(2); // GST on Income and GST on Expenses
  });

  it('renders 0% rate for No GST items', () => {
    render(<TaxRateList />);
    const zeroRates = screen.getAllByText('0%');
    expect(zeroRates.length).toBe(3); // No GST, GST Free Income, GST Free Expenses
  });

  it('shows "Default" badge for default tax rates', () => {
    render(<TaxRateList />);
    // GST on Income and GST on Expenses have isDefault: true
    // Filter out the <th> column header -- badges are <span> elements
    const defaultBadges = screen.getAllByText('Default').filter(
      (el) => el.tagName === 'SPAN',
    );
    expect(defaultBadges.length).toBe(2);
  });

  it('"Default" badges have success variant', () => {
    render(<TaxRateList />);
    const defaultBadges = screen.getAllByText('Default').filter(
      (el) => el.tagName === 'SPAN',
    );
    defaultBadges.forEach((badge) => {
      expect(badge.className).toContain('text-[#14b8a6]');
    });
  });

  it('renders 5 tax rate rows', () => {
    render(<TaxRateList />);
    const rows = screen.getAllByTestId(/^tax-rate-row-/);
    expect(rows.length).toBe(5);
  });
});
