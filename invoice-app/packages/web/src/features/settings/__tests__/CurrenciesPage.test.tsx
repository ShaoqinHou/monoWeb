// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const mockApiFetch = vi.fn();
const mockApiPut = vi.fn();

vi.mock('../../../lib/api-helpers', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  apiPut: (...args: unknown[]) => mockApiPut(...args),
}));

vi.mock('../../../components/layout/PageContainer', () => ({
  PageContainer: ({ children, title }: { children: ReactNode; title: string }) => (
    <div data-testid="page-container">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

import { CurrenciesPage } from '../routes/CurrenciesPage';
import type { CurrencyEntry } from '../hooks/useCurrencies';

const MOCK_CURRENCIES: CurrencyEntry[] = [
  { code: 'NZD', name: 'New Zealand Dollar', rate: 1, enabled: true },
  { code: 'USD', name: 'US Dollar', rate: 0.62, enabled: true },
  { code: 'AUD', name: 'Australian Dollar', rate: 0.93, enabled: true },
  { code: 'GBP', name: 'British Pound', rate: 0.48, enabled: false },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('CurrenciesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockApiFetch.mockReturnValue(new Promise(() => {}));
    render(<CurrenciesPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Loading currencies...')).toBeInTheDocument();
  });

  it('renders page title', async () => {
    mockApiFetch.mockResolvedValueOnce(MOCK_CURRENCIES);
    render(<CurrenciesPage />, { wrapper: createWrapper() });
    expect(await screen.findByText('Currencies')).toBeInTheDocument();
  });

  it('renders base currency info', async () => {
    mockApiFetch.mockResolvedValueOnce(MOCK_CURRENCIES);
    render(<CurrenciesPage />, { wrapper: createWrapper() });

    expect(await screen.findByText(/Base currency:/)).toBeInTheDocument();
  });

  it('renders all currency names', async () => {
    mockApiFetch.mockResolvedValueOnce(MOCK_CURRENCIES);
    render(<CurrenciesPage />, { wrapper: createWrapper() });

    expect(await screen.findByText('New Zealand Dollar')).toBeInTheDocument();
    expect(screen.getByText('US Dollar')).toBeInTheDocument();
    expect(screen.getByText('Australian Dollar')).toBeInTheDocument();
    expect(screen.getByText('British Pound')).toBeInTheDocument();
  });

  it('renders currency rows with data-testid', async () => {
    mockApiFetch.mockResolvedValueOnce(MOCK_CURRENCIES);
    render(<CurrenciesPage />, { wrapper: createWrapper() });

    expect(await screen.findByTestId('currency-row-NZD')).toBeInTheDocument();
    expect(screen.getByTestId('currency-row-USD')).toBeInTheDocument();
    expect(screen.getByTestId('currency-row-AUD')).toBeInTheDocument();
    expect(screen.getByTestId('currency-row-GBP')).toBeInTheDocument();
  });

  it('renders rate inputs', async () => {
    mockApiFetch.mockResolvedValueOnce(MOCK_CURRENCIES);
    render(<CurrenciesPage />, { wrapper: createWrapper() });

    await screen.findByTestId('currency-row-USD');
    expect(screen.getByLabelText('Exchange rate for USD')).toHaveValue(0.62);
    expect(screen.getByLabelText('Exchange rate for AUD')).toHaveValue(0.93);
  });

  it('disables NZD rate input', async () => {
    mockApiFetch.mockResolvedValueOnce(MOCK_CURRENCIES);
    render(<CurrenciesPage />, { wrapper: createWrapper() });

    await screen.findByTestId('currency-row-NZD');
    expect(screen.getByLabelText('Exchange rate for NZD')).toBeDisabled();
  });

  it('renders enable/disable toggles', async () => {
    mockApiFetch.mockResolvedValueOnce(MOCK_CURRENCIES);
    render(<CurrenciesPage />, { wrapper: createWrapper() });

    await screen.findByTestId('currency-row-USD');
    expect(screen.getByTestId('toggle-currency-USD')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-currency-GBP')).toBeInTheDocument();
  });

  it('disables NZD toggle', async () => {
    mockApiFetch.mockResolvedValueOnce(MOCK_CURRENCIES);
    render(<CurrenciesPage />, { wrapper: createWrapper() });

    await screen.findByTestId('currency-row-NZD');
    expect(screen.getByTestId('toggle-currency-NZD')).toBeDisabled();
  });

  it('calls rate update API when rate changes', async () => {
    mockApiFetch.mockResolvedValueOnce(MOCK_CURRENCIES);
    mockApiPut.mockResolvedValue({});
    render(<CurrenciesPage />, { wrapper: createWrapper() });

    await screen.findByTestId('currency-row-USD');
    fireEvent.change(screen.getByLabelText('Exchange rate for USD'), { target: { value: '0.65' } });

    await waitFor(() => {
      expect(mockApiPut).toHaveBeenCalledWith('/currencies/USD', { rate: 0.65 });
    });
  });

  it('calls toggle API when enable switch clicked', async () => {
    const user = userEvent.setup();
    mockApiFetch.mockResolvedValueOnce(MOCK_CURRENCIES);
    mockApiPut.mockResolvedValue({});
    render(<CurrenciesPage />, { wrapper: createWrapper() });

    await screen.findByTestId('currency-row-GBP');
    await user.click(screen.getByTestId('toggle-currency-GBP'));

    await waitFor(() => {
      expect(mockApiPut).toHaveBeenCalledWith('/currencies/GBP', { enabled: true });
    });
  });
});
