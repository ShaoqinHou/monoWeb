// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock hooks before importing the component
const mockSearchData: unknown[] = [];
let mockIsSearching = false;
const mockRecodeMutate = vi.fn();

vi.mock('../hooks/useFindRecode', () => ({
  useSearchTransactions: () => ({
    data: mockSearchData,
    isLoading: mockIsSearching,
  }),
  useRecodeTransactions: () => ({
    mutate: mockRecodeMutate,
    isPending: false,
  }),
}));

vi.mock('../../../components/layout/PageContainer', () => ({
  PageContainer: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="page-container">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock('../../../components/ui/Button', () => ({
  Button: (props: Record<string, unknown>) => (
    <button
      onClick={props.onClick as () => void}
      disabled={!!props.disabled || !!props.loading}
      data-testid={props['data-testid'] as string}
    >
      {props.children as React.ReactNode}
    </button>
  ),
}));

vi.mock('../../../components/ui/Input', () => ({
  Input: (props: Record<string, unknown>) => (
    <input
      value={props.value as string}
      onChange={props.onChange as () => void}
      placeholder={props.placeholder as string}
      data-testid={props['data-testid'] as string}
    />
  ),
}));

vi.mock('../../../components/ui/Select', () => ({
  Select: (props: Record<string, unknown>) => (
    <select
      value={props.value as string}
      onChange={props.onChange as () => void}
      data-testid={props['data-testid'] as string}
    >
      {(props.options as Array<{ value: string; label: string }>)?.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  ),
}));

vi.mock('../../../components/ui/Table', () => ({
  Table: (props: Record<string, unknown>) => <table data-testid={props['data-testid'] as string}>{props.children as React.ReactNode}</table>,
  TableHeader: (props: Record<string, unknown>) => <thead>{props.children as React.ReactNode}</thead>,
  TableBody: (props: Record<string, unknown>) => <tbody>{props.children as React.ReactNode}</tbody>,
  TableRow: (props: Record<string, unknown>) => <tr>{props.children as React.ReactNode}</tr>,
  TableHead: (props: Record<string, unknown>) => <th>{props.children as React.ReactNode}</th>,
  TableCell: (props: Record<string, unknown>) => <td>{props.children as React.ReactNode}</td>,
}));

vi.mock('../components/FindRecodeForm', () => ({
  FindRecodeForm: ({ onSearch }: { onSearch: (f: unknown) => void }) => (
    <button data-testid="mock-search-btn" onClick={() => onSearch({ accountCode: '4-0100' })}>
      Search
    </button>
  ),
}));

import { FindAndRecodePage } from '../routes/FindAndRecodePage';

const MOCK_RESULTS = [
  {
    id: 'tx-1',
    date: '2026-01-15',
    type: 'invoice',
    reference: 'INV-001',
    description: 'Web design',
    accountCode: '4-0100',
    accountName: 'Other Revenue',
    amount: 1500,
    taxRate: 15,
  },
  {
    id: 'tx-2',
    date: '2026-01-20',
    type: 'bill',
    reference: 'BILL-050',
    description: 'Office supplies',
    accountCode: '6-0100',
    accountName: 'Advertising',
    amount: -320,
    taxRate: 15,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockSearchData.length = 0;
  mockIsSearching = false;
});

describe('FindAndRecodePage', () => {
  it('renders page title', () => {
    render(<FindAndRecodePage />);
    expect(screen.getByText('Find & Recode')).toBeInTheDocument();
  });

  it('renders the search form', () => {
    render(<FindAndRecodePage />);
    expect(screen.getByTestId('mock-search-btn')).toBeInTheDocument();
  });

  it('shows loading state during search', async () => {
    mockIsSearching = true;
    render(<FindAndRecodePage />);

    // Trigger search
    await userEvent.click(screen.getByTestId('mock-search-btn'));

    expect(screen.getByTestId('search-loading')).toBeInTheDocument();
    expect(screen.getByText('Searching transactions...')).toBeInTheDocument();
  });

  it('shows empty state when no results found', async () => {
    render(<FindAndRecodePage />);

    await userEvent.click(screen.getByTestId('mock-search-btn'));

    expect(screen.getByTestId('search-empty')).toBeInTheDocument();
    expect(screen.getByText('No transactions found matching your criteria.')).toBeInTheDocument();
  });

  it('displays result count after search', async () => {
    mockSearchData.push(...MOCK_RESULTS);
    render(<FindAndRecodePage />);

    await userEvent.click(screen.getByTestId('mock-search-btn'));

    expect(screen.getByTestId('result-count')).toHaveTextContent('2 transactions found');
  });

  it('renders results table with transaction data', async () => {
    mockSearchData.push(...MOCK_RESULTS);
    render(<FindAndRecodePage />);

    await userEvent.click(screen.getByTestId('mock-search-btn'));

    expect(screen.getByTestId('results-table')).toBeInTheDocument();
    expect(screen.getByText('INV-001')).toBeInTheDocument();
    expect(screen.getByText('Web design')).toBeInTheDocument();
    expect(screen.getByText('BILL-050')).toBeInTheDocument();
  });

  it('renders checkboxes for selecting transactions', async () => {
    mockSearchData.push(...MOCK_RESULTS);
    render(<FindAndRecodePage />);

    await userEvent.click(screen.getByTestId('mock-search-btn'));

    expect(screen.getByTestId('select-all-checkbox')).toBeInTheDocument();
    expect(screen.getByTestId('select-tx-1')).toBeInTheDocument();
    expect(screen.getByTestId('select-tx-2')).toBeInTheDocument();
  });

  it('shows recode panel when transactions are selected', async () => {
    mockSearchData.push(...MOCK_RESULTS);
    render(<FindAndRecodePage />);

    await userEvent.click(screen.getByTestId('mock-search-btn'));

    // Select first transaction
    fireEvent.click(screen.getByTestId('select-tx-1'));

    expect(screen.getByTestId('recode-panel')).toBeInTheDocument();
    expect(screen.getByText(/Recode 1 Transaction/)).toBeInTheDocument();
  });

  it('select-all toggles all transactions', async () => {
    mockSearchData.push(...MOCK_RESULTS);
    render(<FindAndRecodePage />);

    await userEvent.click(screen.getByTestId('mock-search-btn'));

    // Select all
    fireEvent.click(screen.getByTestId('select-all-checkbox'));

    expect(screen.getByTestId('recode-panel')).toBeInTheDocument();
    expect(screen.getByText(/Recode 2 Transactions/)).toBeInTheDocument();
  });

  it('does not show recode panel before selection', async () => {
    mockSearchData.push(...MOCK_RESULTS);
    render(<FindAndRecodePage />);

    await userEvent.click(screen.getByTestId('mock-search-btn'));

    expect(screen.queryByTestId('recode-panel')).not.toBeInTheDocument();
  });
});
