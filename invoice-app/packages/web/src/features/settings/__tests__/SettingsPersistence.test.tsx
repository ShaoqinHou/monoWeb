// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaymentServicesPage } from '../routes/PaymentServicesPage';
import { EmailTemplatesPage } from '../routes/EmailTemplatesPage';
import { BrandingPage } from '../routes/BrandingPage';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: Record<string, unknown>) => (
    <a href={to as string} {...rest}>{children as React.ReactNode}</a>
  ),
  useNavigate: () => vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

const WAIT_OPTS = { timeout: 3000 };

describe('PaymentServicesPage persistence', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('loads payment services from API on mount', async () => {
    const savedServices = [
      { id: 'stripe', name: 'Stripe', description: 'Cards', enabled: true },
      { id: 'gocardless', name: 'GoCardless', description: 'DD', enabled: false },
      { id: 'paypal', name: 'PayPal', description: 'PayPal', enabled: false },
    ];
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          ok: true,
          data: { key: 'payment-services', value: JSON.stringify(savedServices) },
        }),
    });

    render(<PaymentServicesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      const toggle = screen.getByTestId('toggle-stripe');
      expect(toggle.getAttribute('aria-checked')).toBe('true');
    }, WAIT_OPTS);
    const paypalToggle = screen.getByTestId('toggle-paypal');
    expect(paypalToggle.getAttribute('aria-checked')).toBe('false');
  });

  it('saves toggle state to API when toggled', async () => {
    // Return 404 for initial load (triggers defaults), then success for PUT
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ ok: false, error: 'Setting not found' }),
      })
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: { key: 'payment-services', value: '[]' } }),
      });
    globalThis.fetch = fetchMock;

    render(<PaymentServicesPage />, { wrapper: createWrapper() });

    // Wait for defaults to render
    await waitFor(() => {
      expect(screen.getByTestId('toggle-stripe')).toBeInTheDocument();
    }, WAIT_OPTS);

    const user = userEvent.setup();
    await user.click(screen.getByTestId('toggle-stripe'));

    // Verify PUT was called
    await waitFor(() => {
      const putCalls = fetchMock.mock.calls.filter(
        (call: unknown[]) =>
          typeof call[1] === 'object' &&
          (call[1] as RequestInit).method === 'PUT',
      );
      expect(putCalls.length).toBeGreaterThan(0);
    }, WAIT_OPTS);
  });
});

describe('EmailTemplatesPage persistence', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('loads templates from API on mount', async () => {
    const savedTemplates = [
      { type: 'invoice', subject: 'Custom Invoice Subject', body: 'Custom body' },
      { type: 'quote', subject: 'Quote', body: 'Quote body' },
      { type: 'reminder', subject: 'Reminder', body: 'Reminder body' },
      { type: 'purchase-order', subject: 'PO', body: 'PO body' },
    ];
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          ok: true,
          data: { key: 'email-templates', value: JSON.stringify(savedTemplates) },
        }),
    });

    render(<EmailTemplatesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox');
      const subjectInput = inputs.find(
        (input) => (input as HTMLInputElement).value === 'Custom Invoice Subject',
      );
      expect(subjectInput).toBeInTheDocument();
    }, WAIT_OPTS);
  });

  it('saves template to API when save button clicked', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ ok: false, error: 'Setting not found' }),
      })
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: { key: 'email-templates', value: '[]' } }),
      });
    globalThis.fetch = fetchMock;

    render(<EmailTemplatesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('save-template')).toBeInTheDocument();
    }, WAIT_OPTS);

    const user = userEvent.setup();
    await user.click(screen.getByTestId('save-template'));

    await waitFor(() => {
      const putCalls = fetchMock.mock.calls.filter(
        (call: unknown[]) =>
          typeof call[1] === 'object' &&
          (call[1] as RequestInit).method === 'PUT',
      );
      expect(putCalls.length).toBeGreaterThan(0);
    }, WAIT_OPTS);
  });
});

describe('BrandingPage persistence', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('loads branding from API on mount', async () => {
    const savedBranding = {
      themes: [
        { id: 'custom', name: 'My Theme', logo: '', accentColor: '#ff0000', font: 'Georgia' },
      ],
      activeThemeId: 'custom',
    };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          ok: true,
          data: { key: 'branding', value: JSON.stringify(savedBranding) },
        }),
    });

    render(<BrandingPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      const colorInput = document.getElementById('accent-color') as HTMLInputElement;
      expect(colorInput).toBeInTheDocument();
      expect(colorInput.value).toBe('#ff0000');
    }, WAIT_OPTS);
  });

  it('saves branding to API when save button clicked', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ ok: false, error: 'Setting not found' }),
      })
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: { key: 'branding', value: '{}' } }),
      });
    globalThis.fetch = fetchMock;

    render(<BrandingPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('save-branding')).toBeInTheDocument();
    }, WAIT_OPTS);

    const user = userEvent.setup();
    await user.click(screen.getByTestId('save-branding'));

    await waitFor(() => {
      const putCalls = fetchMock.mock.calls.filter(
        (call: unknown[]) =>
          typeof call[1] === 'object' &&
          (call[1] as RequestInit).method === 'PUT',
      );
      expect(putCalls.length).toBeGreaterThan(0);
    }, WAIT_OPTS);
  });
});
