// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockMutate = vi.fn();
const mockReset = vi.fn();
const mockUseImportTransactions = vi.fn();

vi.mock('../hooks/useImportTransactions', () => ({
  useImportTransactions: (...args: unknown[]) => mockUseImportTransactions(...args),
}));

import { BankFeedSetup } from '../components/BankFeedSetup';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('BankFeedSetup', () => {
  beforeEach(() => {
    mockMutate.mockClear();
    mockReset.mockClear();
    mockUseImportTransactions.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
      reset: mockReset,
    });
  });

  it('renders upload step initially', () => {
    render(<BankFeedSetup accountId="acc-1" />, { wrapper: createWrapper() });

    expect(screen.getByTestId('setup-upload')).toBeInTheDocument();
    expect(screen.getByText('Import Bank Transactions')).toBeInTheDocument();
    expect(screen.getByTestId('csv-file-input')).toBeInTheDocument();
  });

  it('shows bank select dropdown', () => {
    render(<BankFeedSetup accountId="acc-1" />, { wrapper: createWrapper() });

    expect(screen.getByText('Select your bank')).toBeInTheDocument();
  });

  it('renders file input that accepts csv', () => {
    render(<BankFeedSetup accountId="acc-1" />, { wrapper: createWrapper() });

    const fileInput = screen.getByTestId('csv-file-input');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput.getAttribute('accept')).toBe('.csv,.ofx');
  });
});
