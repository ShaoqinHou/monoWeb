// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { SearchResult } from '../../../lib/useGlobalSearch';

// Mock useNavigate from tanstack router
const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock the useGlobalSearch hook
const mockSetQuery = vi.fn();
const mockClearRecent = vi.fn();
const mockSearchState: {
  query: string;
  setQuery: typeof mockSetQuery;
  results: SearchResult[];
  isLoading: boolean;
  recentSearches: string[];
  clearRecent: typeof mockClearRecent;
} = {
  query: '',
  setQuery: mockSetQuery,
  results: [],
  isLoading: false,
  recentSearches: [],
  clearRecent: mockClearRecent,
};

vi.mock('../../../lib/useGlobalSearch', () => ({
  useGlobalSearch: () => mockSearchState,
}));

import { SearchOmnibar } from '../SearchOmnibar';

describe('SearchOmnibar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchState.query = '';
    mockSearchState.results = [];
    mockSearchState.isLoading = false;
    mockSearchState.recentSearches = [];
  });

  it('renders nothing when open is false', () => {
    const { container } = render(
      <SearchOmnibar open={false} onClose={vi.fn()} />,
    );
    // The overlay/dialog should not be visible
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('renders dialog when open is true', () => {
    render(<SearchOmnibar open={true} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows search input with placeholder', () => {
    render(<SearchOmnibar open={true} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText(/search/i);
    expect(input).toBeInTheDocument();
  });

  it('auto-focuses the search input when opened', () => {
    render(<SearchOmnibar open={true} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText(/search/i);
    expect(document.activeElement).toBe(input);
  });

  it('calls setQuery when typing in the input', () => {
    render(<SearchOmnibar open={true} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: 'Acme' } });
    expect(mockSetQuery).toHaveBeenCalledWith('Acme');
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<SearchOmnibar open={true} onClose={onClose} />);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when clicking the overlay backdrop', () => {
    const onClose = vi.fn();
    render(<SearchOmnibar open={true} onClose={onClose} />);
    const overlay = screen.getByTestId('search-overlay');
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it('shows recent searches when query is empty', () => {
    mockSearchState.recentSearches = ['Invoice 123', 'Acme Corp'];
    render(<SearchOmnibar open={true} onClose={vi.fn()} />);
    expect(screen.getByText('Recent Searches')).toBeInTheDocument();
    expect(screen.getByText('Invoice 123')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('shows clear button for recent searches', () => {
    mockSearchState.recentSearches = ['Invoice 123'];
    render(<SearchOmnibar open={true} onClose={vi.fn()} />);
    const clearBtn = screen.getByText('Clear');
    fireEvent.click(clearBtn);
    expect(mockClearRecent).toHaveBeenCalled();
  });

  it('clicking a recent search sets query', () => {
    mockSearchState.recentSearches = ['Acme Corp'];
    render(<SearchOmnibar open={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Acme Corp'));
    expect(mockSetQuery).toHaveBeenCalledWith('Acme Corp');
  });

  it('shows grouped results by type', () => {
    const results: SearchResult[] = [
      { id: 'c1', type: 'contact', title: 'Acme Corp', subtitle: 'Customer', href: '/contacts/c1' },
      { id: 'c2', type: 'contact', title: 'Beta Inc', subtitle: 'Supplier', href: '/contacts/c2' },
      { id: 'i1', type: 'invoice', title: 'INV-0001', subtitle: '$1,500.00 - Draft', href: '/sales/invoices/i1' },
    ];
    mockSearchState.results = results;
    mockSearchState.query = 'test';

    render(<SearchOmnibar open={true} onClose={vi.fn()} />);

    // Should have group headers
    expect(screen.getByText('Contacts')).toBeInTheDocument();
    expect(screen.getByText('Invoices')).toBeInTheDocument();

    // Should show individual results
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Beta Inc')).toBeInTheDocument();
    expect(screen.getByText('INV-0001')).toBeInTheDocument();
  });

  it('shows subtitles on result items', () => {
    mockSearchState.results = [
      { id: 'c1', type: 'contact', title: 'Acme Corp', subtitle: 'Customer', href: '/contacts/c1' },
    ];
    mockSearchState.query = 'acme';

    render(<SearchOmnibar open={true} onClose={vi.fn()} />);
    expect(screen.getByText('Customer')).toBeInTheDocument();
  });

  it('click on result navigates and closes', () => {
    const onClose = vi.fn();
    mockSearchState.results = [
      { id: 'i1', type: 'invoice', title: 'INV-0001', subtitle: '$1,500 - Draft', href: '/sales/invoices/i1' },
    ];
    mockSearchState.query = 'inv';

    render(<SearchOmnibar open={true} onClose={onClose} />);
    fireEvent.click(screen.getByText('INV-0001'));

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/sales/invoices/i1' });
    expect(onClose).toHaveBeenCalled();
  });

  it('shows "No results found" when query returns nothing', () => {
    mockSearchState.query = 'zzzznothing';
    mockSearchState.results = [];
    mockSearchState.isLoading = false;

    render(<SearchOmnibar open={true} onClose={vi.fn()} />);
    expect(screen.getByText(/no results/i)).toBeInTheDocument();
  });

  it('shows loading state while fetching', () => {
    mockSearchState.query = 'loading';
    mockSearchState.isLoading = true;

    render(<SearchOmnibar open={true} onClose={vi.fn()} />);
    expect(screen.getByText(/searching/i)).toBeInTheDocument();
  });

  it('navigates with keyboard: ArrowDown selects first, Enter navigates', () => {
    const onClose = vi.fn();
    mockSearchState.results = [
      { id: 'c1', type: 'contact', title: 'Acme Corp', subtitle: 'Customer', href: '/contacts/c1' },
      { id: 'i1', type: 'invoice', title: 'INV-0001', subtitle: '$1,500', href: '/sales/invoices/i1' },
    ];
    mockSearchState.query = 'test';

    render(<SearchOmnibar open={true} onClose={onClose} />);
    const dialog = screen.getByRole('dialog');

    // ArrowDown to select first item
    fireEvent.keyDown(dialog, { key: 'ArrowDown' });
    // Enter to navigate
    fireEvent.keyDown(dialog, { key: 'Enter' });

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/contacts/c1' });
    expect(onClose).toHaveBeenCalled();
  });

  it('navigates with keyboard: ArrowDown twice selects second item', () => {
    const onClose = vi.fn();
    mockSearchState.results = [
      { id: 'c1', type: 'contact', title: 'Acme Corp', subtitle: 'Customer', href: '/contacts/c1' },
      { id: 'i1', type: 'invoice', title: 'INV-0001', subtitle: '$1,500', href: '/sales/invoices/i1' },
    ];
    mockSearchState.query = 'test';

    render(<SearchOmnibar open={true} onClose={onClose} />);
    const dialog = screen.getByRole('dialog');

    fireEvent.keyDown(dialog, { key: 'ArrowDown' });
    fireEvent.keyDown(dialog, { key: 'ArrowDown' });
    fireEvent.keyDown(dialog, { key: 'Enter' });

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/sales/invoices/i1' });
  });

  it('ArrowUp wraps selection to last item', () => {
    const onClose = vi.fn();
    mockSearchState.results = [
      { id: 'c1', type: 'contact', title: 'Acme Corp', subtitle: 'Customer', href: '/contacts/c1' },
      { id: 'i1', type: 'invoice', title: 'INV-0001', subtitle: '$1,500', href: '/sales/invoices/i1' },
    ];
    mockSearchState.query = 'test';

    render(<SearchOmnibar open={true} onClose={onClose} />);
    const dialog = screen.getByRole('dialog');

    // ArrowUp from initial (-1) should wrap to last
    fireEvent.keyDown(dialog, { key: 'ArrowUp' });
    fireEvent.keyDown(dialog, { key: 'Enter' });

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/sales/invoices/i1' });
  });

  it('does not show recent searches section when there are none', () => {
    mockSearchState.recentSearches = [];
    render(<SearchOmnibar open={true} onClose={vi.fn()} />);
    expect(screen.queryByText('Recent Searches')).not.toBeInTheDocument();
  });

  it('shows bills group header for bill results', () => {
    mockSearchState.results = [
      { id: 'b1', type: 'bill', title: 'BILL-001', subtitle: '$800 - Unpaid', href: '/purchases/bills/b1' },
    ];
    mockSearchState.query = 'bill';

    render(<SearchOmnibar open={true} onClose={vi.fn()} />);
    expect(screen.getByText('Bills')).toBeInTheDocument();
    expect(screen.getByText('BILL-001')).toBeInTheDocument();
  });
});
