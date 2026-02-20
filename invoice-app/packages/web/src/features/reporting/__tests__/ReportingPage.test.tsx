// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportingPage } from '../routes/ReportingPage';

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: Record<string, unknown>) => (
    <a href={to as string} {...rest}>{children as React.ReactNode}</a>
  ),
  useNavigate: () => vi.fn(),
}));

describe('ReportingPage', () => {
  it('renders the page title', () => {
    render(<ReportingPage />);
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('renders search input with placeholder', () => {
    render(<ReportingPage />);
    expect(screen.getByTestId('report-search')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Find a report')).toBeInTheDocument();
  });

  it('renders show descriptions toggle', () => {
    render(<ReportingPage />);
    expect(screen.getByTestId('show-descriptions-toggle')).toBeInTheDocument();
    expect(screen.getByText('Show descriptions')).toBeInTheDocument();
  });

  it('renders all report cards', () => {
    render(<ReportingPage />);
    // Favourites (P&L, BS) appear twice — once in Favourites, once in category
    expect(screen.getAllByText('Profit and Loss').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Balance Sheet').length).toBeGreaterThan(0);
    expect(screen.getByText('Trial Balance')).toBeInTheDocument();
    expect(screen.getByText('Cash Flow Forecast')).toBeInTheDocument();
    expect(screen.getByText('Aged Receivables')).toBeInTheDocument();
    expect(screen.getByText('Aged Payables')).toBeInTheDocument();
    expect(screen.getByText('GST Return')).toBeInTheDocument();
    expect(screen.getByText('Account Transactions')).toBeInTheDocument();
    expect(screen.getByText('Business Snapshot')).toBeInTheDocument();
    expect(screen.getByText('Executive Summary')).toBeInTheDocument();
    expect(screen.getByText('Payroll Report')).toBeInTheDocument();
    expect(screen.getByText('Bank Reconciliation')).toBeInTheDocument();
    expect(screen.getAllByTestId('report-card-budgets').length).toBeGreaterThan(0);
  });

  it('renders Xero-style category headings', () => {
    render(<ReportingPage />);
    expect(screen.getByText('Financial performance')).toBeInTheDocument();
    expect(screen.getByText('Financial statements')).toBeInTheDocument();
    expect(screen.getByText('Payables and receivables')).toBeInTheDocument();
    expect(screen.getByText('Payroll')).toBeInTheDocument();
    expect(screen.getByText('Reconciliations')).toBeInTheDocument();
    expect(screen.getByText('Taxes and balances')).toBeInTheDocument();
    expect(screen.getByText('Transactions')).toBeInTheDocument();
  });

  it('renders Favourites section with default favourites', () => {
    render(<ReportingPage />);
    expect(screen.getByTestId('favourites-section')).toBeInTheDocument();
    expect(screen.getByText('Favourites')).toBeInTheDocument();
  });

  it('renders descriptions by default', () => {
    render(<ReportingPage />);
    expect(screen.getAllByText('Shows revenue, expenses, and net profit over a period').length).toBeGreaterThan(0);
  });

  it('hides descriptions when toggle unchecked', () => {
    render(<ReportingPage />);
    const toggle = screen.getByTestId('show-descriptions-toggle').querySelector('input')!;
    fireEvent.click(toggle);
    expect(screen.queryAllByText('Shows revenue, expenses, and net profit over a period')).toHaveLength(0);
  });

  it('filters reports by search query', () => {
    render(<ReportingPage />);
    const searchInput = screen.getByTestId('report-search');
    fireEvent.change(searchInput, { target: { value: 'profit' } });
    // P&L matches search, may appear in favourites + category
    expect(screen.getAllByText('Profit and Loss').length).toBeGreaterThan(0);
    expect(screen.queryByText('Bank Reconciliation')).not.toBeInTheDocument();
  });

  it('renders favourite buttons on report cards', () => {
    render(<ReportingPage />);
    expect(screen.getAllByTestId('favourite-btn-profit-and-loss').length).toBeGreaterThan(0);
  });

  it('renders more options buttons on report cards', () => {
    render(<ReportingPage />);
    expect(screen.getAllByTestId('more-options-profit-and-loss').length).toBeGreaterThan(0);
  });

  it('renders links with correct hrefs', () => {
    render(<ReportingPage />);
    // Some cards appear in both Favourites and their category section
    const pnlCards = screen.getAllByTestId('report-card-profit-and-loss');
    expect(pnlCards[0]).toHaveAttribute('href', '/reporting/profit-and-loss');
    const bsCards = screen.getAllByTestId('report-card-balance-sheet');
    expect(bsCards[0]).toHaveAttribute('href', '/reporting/balance-sheet');
    const gstCard = screen.getByTestId('report-card-gst-return');
    expect(gstCard).toHaveAttribute('href', '/tax/gst-returns');
  });
});
