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

import { EmailTemplatesPage } from '../routes/EmailTemplatesPage';

describe('EmailTemplatesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockApiFetch.mockReturnValue(new Promise(() => {}));
    render(<EmailTemplatesPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Loading templates...')).toBeInTheDocument();
  });

  it('renders page title', async () => {
    // Simulate fallback to defaults
    mockApiFetch.mockRejectedValueOnce(new Error('not found'));
    render(<EmailTemplatesPage />, { wrapper: createWrapper() });
    expect(await screen.findByText('Email Templates')).toBeInTheDocument();
  });

  it('renders template type selector', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('not found'));
    render(<EmailTemplatesPage />, { wrapper: createWrapper() });

    expect(await screen.findByLabelText('Template Type')).toBeInTheDocument();
  });

  it('renders Save Template button', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('not found'));
    render(<EmailTemplatesPage />, { wrapper: createWrapper() });

    expect(await screen.findByTestId('save-template')).toBeInTheDocument();
  });

  it('renders subject and body fields after loading', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('not found'));
    render(<EmailTemplatesPage />, { wrapper: createWrapper() });

    expect(await screen.findByLabelText('Subject')).toBeInTheDocument();
    expect(screen.getByLabelText('Body')).toBeInTheDocument();
  });

  it('renders variable insert buttons', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('not found'));
    render(<EmailTemplatesPage />, { wrapper: createWrapper() });

    expect(await screen.findByText('Insert Variable:')).toBeInTheDocument();
    expect(screen.getByTestId('insert-var-{contactName}')).toBeInTheDocument();
    expect(screen.getByTestId('insert-var-{invoiceNumber}')).toBeInTheDocument();
  });
});

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
