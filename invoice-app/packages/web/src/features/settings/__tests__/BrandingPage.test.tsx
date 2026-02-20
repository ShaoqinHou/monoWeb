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

import { BrandingPage } from '../routes/BrandingPage';
import type { BrandingSettings } from '../hooks/useBranding';

const MOCK_BRANDING: BrandingSettings = {
  themes: [
    { id: 'default', name: 'Standard', logo: '', accentColor: '#0078c8', font: 'Arial' },
    { id: 'custom', name: 'Custom Blue', logo: '', accentColor: '#1e40af', font: 'Helvetica' },
  ],
  activeThemeId: 'default',
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

describe('BrandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockApiFetch.mockReturnValue(new Promise(() => {}));
    render(<BrandingPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Loading branding settings...')).toBeInTheDocument();
  });

  it('renders page title', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('not found'));
    render(<BrandingPage />, { wrapper: createWrapper() });
    expect(await screen.findByText('Invoice Branding')).toBeInTheDocument();
  });

  it('renders theme selector', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('not found'));
    render(<BrandingPage />, { wrapper: createWrapper() });

    expect(await screen.findByLabelText('Theme')).toBeInTheDocument();
  });

  it('renders theme name input', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('not found'));
    render(<BrandingPage />, { wrapper: createWrapper() });

    expect(await screen.findByLabelText('Theme Name')).toBeInTheDocument();
  });

  it('renders logo upload', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('not found'));
    render(<BrandingPage />, { wrapper: createWrapper() });

    expect(await screen.findByTestId('logo-upload')).toBeInTheDocument();
  });

  it('renders font selector', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('not found'));
    render(<BrandingPage />, { wrapper: createWrapper() });

    expect(await screen.findByLabelText('Font')).toBeInTheDocument();
  });

  it('renders Save Branding button', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('not found'));
    render(<BrandingPage />, { wrapper: createWrapper() });

    expect(await screen.findByTestId('save-branding')).toBeInTheDocument();
  });

  it('renders New Theme button', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('not found'));
    render(<BrandingPage />, { wrapper: createWrapper() });

    expect(await screen.findByTestId('create-theme')).toBeInTheDocument();
  });

  it('renders Delete Theme button', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('not found'));
    render(<BrandingPage />, { wrapper: createWrapper() });

    expect(await screen.findByTestId('delete-theme')).toBeInTheDocument();
  });

  it('renders preview section', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('not found'));
    render(<BrandingPage />, { wrapper: createWrapper() });

    expect(await screen.findByText('Preview')).toBeInTheDocument();
    expect(screen.getByTestId('branding-preview')).toBeInTheDocument();
  });

  it('renders accent color input', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('not found'));
    render(<BrandingPage />, { wrapper: createWrapper() });

    expect(await screen.findByLabelText('Accent Color')).toBeInTheDocument();
  });

  it('disables Delete when only one theme', async () => {
    // Default fallback has only one theme
    mockApiFetch.mockRejectedValueOnce(new Error('not found'));
    render(<BrandingPage />, { wrapper: createWrapper() });

    await screen.findByTestId('branding-preview');
    expect(screen.getByTestId('delete-theme')).toBeDisabled();
  });
});
