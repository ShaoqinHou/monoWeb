// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock @tanstack/react-router
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [key: string]: unknown }) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

// Mock layout/UI components
vi.mock('../../../components/layout/PageContainer', () => ({
  PageContainer: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="page-container">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock('../../../components/ui/Card', () => ({
  Card: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="card" {...props}>{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../../components/ui/Tabs', () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabList: ({ children }: { children: React.ReactNode }) => <div role="tablist">{children}</div>,
  Tab: ({ children }: { children: React.ReactNode }) => <button role="tab">{children}</button>,
  TabPanel: ({ children }: { children: React.ReactNode }) => <div role="tabpanel">{children}</div>,
}));

// Mock the API-backed hooks
vi.mock('../hooks/useGSTReturns', () => ({
  useGSTReturnsApi: () => ({ data: [], isLoading: false }),
  useGSTReturnApi: () => ({ data: null }),
  useCreateGSTReturn: () => ({ mutate: vi.fn(), isPending: false }),
  useFileGSTReturn: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteGSTReturn: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../hooks/useTax', () => ({
  useTaxSummary: () => ({ data: null }),
}));

vi.mock('../hooks/useActivityStatements', () => ({
  useActivityStatements: () => ({ data: [], isLoading: false }),
}));

// Default tax settings mock -- returns realistic API data
const mockUseTaxSettings = vi.fn(() => ({
  data: {
    gstNumber: '111-222-333',
    gstStartDate: '2025-04-01',
    accountingBasis: 'Payments basis (Cash)',
    filingPeriod: '6-monthly',
    gstFormType: 'GST101A',
  },
  isLoading: false,
}));

vi.mock('../hooks/useTaxSettings', () => ({
  useTaxSettings: () => mockUseTaxSettings(),
}));

// Mock sub-components
vi.mock('../components/GSTReturnList', () => ({
  GSTReturnList: () => <div data-testid="gst-return-list" />,
}));

vi.mock('../components/GSTReturnDetailApi', () => ({
  GSTReturnDetailApi: () => <div />,
}));

vi.mock('../components/TaxRateList', () => ({
  TaxRateList: () => <div data-testid="tax-rate-list" />,
}));

vi.mock('../components/TaxSummaryCard', () => ({
  TaxSummaryCard: () => <div />,
}));

vi.mock('../components/ActivityStatementsList', () => ({
  ActivityStatementsList: () => <div />,
}));

import { GSTReturnsPage } from '../routes/TaxPage';

describe('GSTReturnsPage with GST settings form', () => {
  it('renders GST Settings section', () => {
    render(<GSTReturnsPage />);

    expect(screen.getByText('GST Settings')).toBeInTheDocument();
  });

  it('renders tax form type radio buttons', () => {
    render(<GSTReturnsPage />);

    expect(screen.getByTestId('gst-form-type')).toBeInTheDocument();
    expect(screen.getByText('Tax form type')).toBeInTheDocument();
    expect(screen.getByText('GST101A (Standard)')).toBeInTheDocument();
    expect(screen.getByText('GST101B (Simplified)')).toBeInTheDocument();
  });

  it('renders accounting basis from settings API', () => {
    render(<GSTReturnsPage />);

    expect(screen.getByTestId('gst-accounting-basis')).toBeInTheDocument();
    expect(screen.getByText('Accounting basis')).toBeInTheDocument();
    expect(screen.getByText('Payments basis (Cash)')).toBeInTheDocument();
  });

  it('renders filing period from settings API', () => {
    render(<GSTReturnsPage />);

    expect(screen.getByTestId('gst-filing-period')).toBeInTheDocument();
    expect(screen.getByText('Filing period')).toBeInTheDocument();
    expect(screen.getByText('6-monthly')).toBeInTheDocument();
  });

  it('renders GST number input with value from settings API', () => {
    render(<GSTReturnsPage />);

    expect(screen.getByTestId('gst-number')).toBeInTheDocument();
    const input = screen.getByTestId('gst-number-input') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.defaultValue).toBe('111-222-333');
  });

  it('renders start date input with value from settings API', () => {
    render(<GSTReturnsPage />);

    expect(screen.getByTestId('gst-start-date')).toBeInTheDocument();
    const input = screen.getByTestId('gst-start-date-input') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.defaultValue).toBe('2025-04-01');
  });

  it('shows loading state when settings are loading', () => {
    mockUseTaxSettings.mockReturnValueOnce({
      data: undefined,
      isLoading: true,
    });

    render(<GSTReturnsPage />);

    expect(screen.getByText('Loading GST returns...')).toBeInTheDocument();
  });

  it('renders default accounting basis when settings return undefined', () => {
    mockUseTaxSettings.mockReturnValueOnce({
      data: {
        gstNumber: undefined,
        gstStartDate: undefined,
        accountingBasis: undefined,
        filingPeriod: undefined,
        gstFormType: undefined,
      },
      isLoading: false,
    });

    render(<GSTReturnsPage />);

    expect(screen.getByText('Invoice basis (Accrual)')).toBeInTheDocument();
    expect(screen.getByText('2-monthly')).toBeInTheDocument();
  });

  it('selects GST101B radio when settings indicate simplified form', () => {
    mockUseTaxSettings.mockReturnValueOnce({
      data: {
        gstNumber: '999-888-777',
        gstStartDate: '2026-01-01',
        accountingBasis: 'Invoice basis (Accrual)',
        filingPeriod: 'Monthly',
        gstFormType: 'GST101B',
      },
      isLoading: false,
    });

    render(<GSTReturnsPage />);

    const radios = screen.getByTestId('gst-form-type').querySelectorAll('input[type="radio"]');
    const gst101a = radios[0] as HTMLInputElement;
    const gst101b = radios[1] as HTMLInputElement;
    expect(gst101a.defaultChecked).toBe(false);
    expect(gst101b.defaultChecked).toBe(true);
  });
});
