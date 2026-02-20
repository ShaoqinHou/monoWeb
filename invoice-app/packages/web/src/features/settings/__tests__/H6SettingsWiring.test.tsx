// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// ─── Mock api-helpers ────────────────────────────────────────────────────────

const mockApiFetch = vi.fn();
const mockApiPut = vi.fn();

vi.mock('../../../lib/api-helpers', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  apiPost: vi.fn(),
  apiPut: (...args: unknown[]) => mockApiPut(...args),
  apiDelete: vi.fn(),
}));

// ─── Imports (after mocks) ──────────────────────────────────────────────────

import { ConnectedAppsPage } from '../routes/ConnectedAppsPage';
import { useActiveBranding } from '../hooks/useActiveBranding';
import { useEmailTemplate } from '../hooks/useEmailTemplate';

// ─── Test helpers ───────────────────────────────────────────────────────────

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

const DEFAULT_APPS = [
  { id: 'stripe', name: 'Stripe', description: 'Accept credit card and bank payments.', icon: 'S', connected: false },
  { id: 'xero-tax', name: 'Xero Tax', description: 'Prepare and file tax returns.', icon: 'XT', connected: true },
  { id: 'hubspot', name: 'HubSpot', description: 'Sync contacts and invoices with CRM.', icon: 'H', connected: true },
  { id: 'shopify', name: 'Shopify', description: 'Import Shopify sales as invoices.', icon: 'Sh', connected: false },
  { id: 'deputy', name: 'Deputy', description: 'Sync employee schedules.', icon: 'D', connected: false },
];

// ─── ConnectedAppsPage ──────────────────────────────────────────────────────

describe('ConnectedAppsPage (enhanced)', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
    mockApiPut.mockReset();
    // Return default apps from API
    mockApiFetch.mockResolvedValue(DEFAULT_APPS);
    mockApiPut.mockResolvedValue({ id: 'stripe', connected: true });
  });

  it('renders all five apps with proper names', async () => {
    render(<ConnectedAppsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Stripe')).toBeInTheDocument();
    });
    expect(screen.getByText('Xero Tax')).toBeInTheDocument();
    expect(screen.getByText('HubSpot')).toBeInTheDocument();
    expect(screen.getByText('Shopify')).toBeInTheDocument();
    expect(screen.getByText('Deputy')).toBeInTheDocument();
  });

  it('shows Connected badges for pre-connected apps', async () => {
    render(<ConnectedAppsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('badge-xero-tax')).toBeInTheDocument();
    });
    expect(screen.getByTestId('badge-xero-tax')).toHaveTextContent('Connected');
    expect(screen.getByTestId('badge-hubspot')).toHaveTextContent('Connected');
  });

  it('shows Disconnect button for connected apps', async () => {
    render(<ConnectedAppsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('toggle-app-xero-tax')).toBeInTheDocument();
    });
    expect(screen.getByTestId('toggle-app-xero-tax')).toHaveTextContent('Disconnect');
    expect(screen.getByTestId('toggle-app-stripe')).toHaveTextContent('Connect');
  });

  it('toggles app connection status via API', async () => {
    // After toggle, re-fetch should return updated data
    let stripeConnected = false;
    mockApiFetch.mockImplementation(() => {
      return Promise.resolve(
        DEFAULT_APPS.map((a) =>
          a.id === 'stripe' ? { ...a, connected: stripeConnected } : a,
        ),
      );
    });
    mockApiPut.mockImplementation((_path: string, body: { connected: boolean }) => {
      stripeConnected = body.connected;
      return Promise.resolve({ id: 'stripe', connected: body.connected });
    });

    render(<ConnectedAppsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('toggle-app-stripe')).toBeInTheDocument();
    });

    const stripeBtn = screen.getByTestId('toggle-app-stripe');
    expect(stripeBtn).toHaveTextContent('Connect');

    fireEvent.click(stripeBtn);

    // Optimistic update + re-fetch should show Disconnect
    await waitFor(() => {
      expect(stripeBtn).toHaveTextContent('Disconnect');
    });

    // Verify API was called
    expect(mockApiPut).toHaveBeenCalledWith('/connected-apps/stripe', { connected: true });
  });
});

// ─── useActiveBranding hook ─────────────────────────────────────────────────

describe('useActiveBranding hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default branding theme when no custom branding set', async () => {
    const { result } = renderHook(() => useActiveBranding(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.data).toMatchObject({
      accentColor: '#0078c8',
      font: 'Arial',
      themeName: 'Standard',
    }));
  });
});

// ─── useEmailTemplate hook ──────────────────────────────────────────────────

describe('useEmailTemplate hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns invoice template with variables replaced', async () => {
    const { result } = renderHook(
      () =>
        useEmailTemplate('invoice', {
          contactName: 'John Doe',
          invoiceNumber: 'INV-1042',
          amount: '$2,500.00',
          dueDate: '18 Mar 2026',
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.data).toMatchObject({
      subject: expect.stringContaining('INV-1042'),
      body: expect.stringContaining('John Doe'),
    }));
    expect(result.current.data!.body).toContain('$2,500.00');
    expect(result.current.data!.body).toContain('18 Mar 2026');
  });

  it('returns raw template when no variables provided', async () => {
    const { result } = renderHook(
      () => useEmailTemplate('invoice'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.data).toMatchObject({
      subject: expect.stringContaining('{invoiceNumber}'),
      body: expect.stringContaining('{contactName}'),
    }));
  });
});
