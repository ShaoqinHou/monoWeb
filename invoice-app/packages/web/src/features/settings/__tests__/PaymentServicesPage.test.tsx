// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

import { PaymentServicesPage } from '../routes/PaymentServicesPage';

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

describe('PaymentServicesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockApiFetch.mockReturnValue(new Promise(() => {}));
    render(<PaymentServicesPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Loading payment services...')).toBeInTheDocument();
  });

  it('renders page title', async () => {
    // Simulate API error to use defaults
    mockApiFetch.mockRejectedValueOnce(new Error('not found'));
    render(<PaymentServicesPage />, { wrapper: createWrapper() });

    expect(await screen.findByText('Payment Services')).toBeInTheDocument();
  });

  it('renders all three default services', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('not found'));
    render(<PaymentServicesPage />, { wrapper: createWrapper() });

    expect(await screen.findByText('Stripe')).toBeInTheDocument();
    expect(screen.getByText('GoCardless')).toBeInTheDocument();
    expect(screen.getByText('PayPal')).toBeInTheDocument();
  });

  it('renders service descriptions', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('not found'));
    render(<PaymentServicesPage />, { wrapper: createWrapper() });

    expect(await screen.findByText(/Accept credit card payments/)).toBeInTheDocument();
    expect(screen.getByText(/Collect recurring payments/)).toBeInTheDocument();
    expect(screen.getByText(/Accept payments via PayPal/)).toBeInTheDocument();
  });

  it('renders toggle switches for each service', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('not found'));
    render(<PaymentServicesPage />, { wrapper: createWrapper() });

    await screen.findByText('Stripe');
    expect(screen.getByTestId('toggle-stripe')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-gocardless')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-paypal')).toBeInTheDocument();
  });

  it('renders Configure buttons', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('not found'));
    render(<PaymentServicesPage />, { wrapper: createWrapper() });

    await screen.findByText('Stripe');
    expect(screen.getByTestId('configure-stripe')).toBeInTheDocument();
    expect(screen.getByTestId('configure-gocardless')).toBeInTheDocument();
    expect(screen.getByTestId('configure-paypal')).toBeInTheDocument();
  });

  it('disables Configure button for disabled services', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('not found'));
    render(<PaymentServicesPage />, { wrapper: createWrapper() });

    await screen.findByText('Stripe');
    // Stripe is disabled by default
    expect(screen.getByTestId('configure-stripe')).toBeDisabled();
    // PayPal is enabled by default
    expect(screen.getByTestId('configure-paypal')).not.toBeDisabled();
  });

  it('toggles a service when switch clicked', async () => {
    const user = userEvent.setup();
    mockApiFetch.mockRejectedValueOnce(new Error('not found'));
    mockApiPut.mockResolvedValue({});
    render(<PaymentServicesPage />, { wrapper: createWrapper() });

    await screen.findByText('Stripe');

    // Toggle Stripe on
    await user.click(screen.getByTestId('toggle-stripe'));
    // After toggle, the Configure button should be enabled
    expect(screen.getByTestId('configure-stripe')).not.toBeDisabled();
  });
});
