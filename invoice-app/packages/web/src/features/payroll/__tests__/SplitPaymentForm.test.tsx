// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const mockApiFetch = vi.fn();
const mockApiPut = vi.fn();

vi.mock('../../../lib/api-helpers', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  apiPut: (...args: unknown[]) => mockApiPut(...args),
}));

import { SplitPaymentForm } from '../components/SplitPaymentForm';
import type { SplitPaymentConfig } from '../hooks/useSplitPayments';

const SAMPLE_CONFIG: SplitPaymentConfig = {
  employeeId: 'emp-001',
  accounts: [
    { bankAccount: '01-0102-0123456-00', type: 'fixed', amount: 0, isPrimary: true },
    { bankAccount: '02-0205-0654321-00', type: 'fixed', amount: 1000, isPrimary: false },
  ],
};

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

describe('SplitPaymentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockApiFetch.mockReturnValue(new Promise(() => {}));
    render(<SplitPaymentForm employeeId="emp-001" />, { wrapper: createWrapper() });
    expect(screen.getByTestId('split-payment-loading')).toBeInTheDocument();
  });

  it('renders form after loading', async () => {
    mockApiFetch.mockResolvedValueOnce(SAMPLE_CONFIG);
    render(<SplitPaymentForm employeeId="emp-001" />, { wrapper: createWrapper() });

    expect(await screen.findByTestId('split-payment-form')).toBeInTheDocument();
    expect(screen.getByText('Split Payment Configuration')).toBeInTheDocument();
  });

  it('renders existing accounts', async () => {
    mockApiFetch.mockResolvedValueOnce(SAMPLE_CONFIG);
    render(<SplitPaymentForm employeeId="emp-001" />, { wrapper: createWrapper() });

    await screen.findByTestId('split-payment-form');
    expect(screen.getByTestId('split-account-0')).toBeInTheDocument();
    expect(screen.getByTestId('split-account-1')).toBeInTheDocument();
  });

  it('renders "Add Account" button when under max', async () => {
    mockApiFetch.mockResolvedValueOnce(SAMPLE_CONFIG);
    render(<SplitPaymentForm employeeId="emp-001" />, { wrapper: createWrapper() });

    await screen.findByTestId('split-payment-form');
    expect(screen.getByTestId('add-account-btn')).toBeInTheDocument();
  });

  it('adds an account when Add Account is clicked', async () => {
    const user = userEvent.setup();
    mockApiFetch.mockResolvedValueOnce(SAMPLE_CONFIG);
    render(<SplitPaymentForm employeeId="emp-001" />, { wrapper: createWrapper() });

    await screen.findByTestId('split-payment-form');
    await user.click(screen.getByTestId('add-account-btn'));

    expect(screen.getByTestId('split-account-2')).toBeInTheDocument();
  });

  it('hides Add Account when at max accounts (3)', async () => {
    const user = userEvent.setup();
    const threeAccounts: SplitPaymentConfig = {
      employeeId: 'emp-001',
      accounts: [
        { bankAccount: '01-0102-0123456-00', type: 'fixed', amount: 0, isPrimary: true },
        { bankAccount: '02-0205-0654321-00', type: 'fixed', amount: 1000, isPrimary: false },
        { bankAccount: '03-0305-0111111-00', type: 'percentage', amount: 10, isPrimary: false },
      ],
    };
    mockApiFetch.mockResolvedValueOnce(threeAccounts);
    render(<SplitPaymentForm employeeId="emp-001" />, { wrapper: createWrapper() });

    await screen.findByTestId('split-payment-form');
    expect(screen.queryByTestId('add-account-btn')).not.toBeInTheDocument();
  });

  it('removes a secondary account', async () => {
    const user = userEvent.setup();
    mockApiFetch.mockResolvedValueOnce(SAMPLE_CONFIG);
    render(<SplitPaymentForm employeeId="emp-001" />, { wrapper: createWrapper() });

    await screen.findByTestId('split-payment-form');
    await user.click(screen.getByTestId('remove-account-1'));

    expect(screen.queryByTestId('split-account-1')).not.toBeInTheDocument();
  });

  it('shows validation error when split exceeds net pay', async () => {
    const user = userEvent.setup();
    mockApiFetch.mockResolvedValueOnce(SAMPLE_CONFIG);
    render(<SplitPaymentForm employeeId="emp-001" netPay={500} />, { wrapper: createWrapper() });

    await screen.findByTestId('split-payment-form');
    // Change secondary account amount to exceed net pay
    const amountInput = screen.getByLabelText('Account 1 amount');
    fireEvent.change(amountInput, { target: { value: '600' } });

    expect(screen.getByTestId('split-validation-error')).toBeInTheDocument();
  });

  it('renders Save button', async () => {
    mockApiFetch.mockResolvedValueOnce(SAMPLE_CONFIG);
    render(<SplitPaymentForm employeeId="emp-001" />, { wrapper: createWrapper() });

    await screen.findByTestId('split-payment-form');
    expect(screen.getByTestId('save-split-btn')).toBeInTheDocument();
  });
});
