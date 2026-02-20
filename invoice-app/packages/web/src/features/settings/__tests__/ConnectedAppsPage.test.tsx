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

import { ConnectedAppsPage } from '../routes/ConnectedAppsPage';

const MOCK_APPS = [
  { id: 'hubspot', name: 'HubSpot', description: 'CRM integration', icon: 'HS', connected: true },
  { id: 'slack', name: 'Slack', description: 'Team notifications', icon: 'SL', connected: false },
  { id: 'stripe', name: 'Stripe', description: 'Payment processing', icon: 'ST', connected: true },
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

describe('ConnectedAppsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockApiFetch.mockReturnValue(new Promise(() => {}));
    render(<ConnectedAppsPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Loading connected apps...')).toBeInTheDocument();
  });

  it('renders page title', async () => {
    mockApiFetch.mockResolvedValueOnce(MOCK_APPS);
    render(<ConnectedAppsPage />, { wrapper: createWrapper() });
    expect(await screen.findByText('Connected Apps')).toBeInTheDocument();
  });

  it('renders all apps', async () => {
    mockApiFetch.mockResolvedValueOnce(MOCK_APPS);
    render(<ConnectedAppsPage />, { wrapper: createWrapper() });

    expect(await screen.findByText('HubSpot')).toBeInTheDocument();
    expect(screen.getByText('Slack')).toBeInTheDocument();
    expect(screen.getByText('Stripe')).toBeInTheDocument();
  });

  it('renders app descriptions', async () => {
    mockApiFetch.mockResolvedValueOnce(MOCK_APPS);
    render(<ConnectedAppsPage />, { wrapper: createWrapper() });

    expect(await screen.findByText('CRM integration')).toBeInTheDocument();
    expect(screen.getByText('Team notifications')).toBeInTheDocument();
    expect(screen.getByText('Payment processing')).toBeInTheDocument();
  });

  it('shows "Connected" badge for connected apps', async () => {
    mockApiFetch.mockResolvedValueOnce(MOCK_APPS);
    render(<ConnectedAppsPage />, { wrapper: createWrapper() });

    await screen.findByText('HubSpot');
    expect(screen.getByTestId('badge-hubspot')).toBeInTheDocument();
    expect(screen.getByTestId('badge-stripe')).toBeInTheDocument();
  });

  it('shows "Disconnect" for connected apps', async () => {
    mockApiFetch.mockResolvedValueOnce(MOCK_APPS);
    render(<ConnectedAppsPage />, { wrapper: createWrapper() });

    await screen.findByText('HubSpot');
    expect(screen.getByTestId('toggle-app-hubspot')).toHaveTextContent('Disconnect');
    expect(screen.getByTestId('toggle-app-stripe')).toHaveTextContent('Disconnect');
  });

  it('shows "Connect" for disconnected apps', async () => {
    mockApiFetch.mockResolvedValueOnce(MOCK_APPS);
    render(<ConnectedAppsPage />, { wrapper: createWrapper() });

    await screen.findByText('Slack');
    expect(screen.getByTestId('toggle-app-slack')).toHaveTextContent('Connect');
  });

  it('renders connected apps list container', async () => {
    mockApiFetch.mockResolvedValueOnce(MOCK_APPS);
    render(<ConnectedAppsPage />, { wrapper: createWrapper() });

    await screen.findByText('HubSpot');
    expect(screen.getByTestId('connected-apps-list')).toBeInTheDocument();
  });

  it('renders app icons', async () => {
    mockApiFetch.mockResolvedValueOnce(MOCK_APPS);
    render(<ConnectedAppsPage />, { wrapper: createWrapper() });

    await screen.findByText('HubSpot');
    expect(screen.getByText('HS')).toBeInTheDocument();
    expect(screen.getByText('SL')).toBeInTheDocument();
    expect(screen.getByText('ST')).toBeInTheDocument();
  });

  it('toggles app connection on button click', async () => {
    const user = userEvent.setup();
    mockApiFetch.mockResolvedValueOnce(MOCK_APPS);
    mockApiPut.mockResolvedValueOnce({ ...MOCK_APPS[1], connected: true });
    render(<ConnectedAppsPage />, { wrapper: createWrapper() });

    await screen.findByText('Slack');
    await user.click(screen.getByTestId('toggle-app-slack'));

    expect(mockApiPut).toHaveBeenCalledWith('/connected-apps/slack', { connected: true });
  });
});
