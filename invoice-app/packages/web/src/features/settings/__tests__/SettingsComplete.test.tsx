// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ─── Mock api-helpers ────────────────────────────────────────────────────────

const mockApiFetch = vi.fn();
const mockApiPut = vi.fn();

vi.mock('../../../lib/api-helpers', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  apiPost: vi.fn(),
  apiPut: (...args: unknown[]) => mockApiPut(...args),
  apiDelete: vi.fn(),
}));

// Pages
import { PaymentServicesPage } from '../routes/PaymentServicesPage';
import { EmailTemplatesPage } from '../routes/EmailTemplatesPage';
import { CurrenciesPage } from '../routes/CurrenciesPage';
import { BrandingPage } from '../routes/BrandingPage';
import { ConnectedAppsPage } from '../routes/ConnectedAppsPage';

// Components
import { EmailTemplateEditor } from '../components/EmailTemplateEditor';
import { CurrencyRateForm } from '../components/CurrencyRateForm';
import { BrandingPreview } from '../components/BrandingPreview';
import { InviteUserDialog } from '../components/InviteUserDialog';

const DEFAULT_CURRENCIES = [
  { code: 'NZD', name: 'New Zealand Dollar', rate: 1.0, enabled: true },
  { code: 'AUD', name: 'Australian Dollar', rate: 0.93, enabled: true },
  { code: 'USD', name: 'US Dollar', rate: 0.61, enabled: true },
  { code: 'GBP', name: 'British Pound', rate: 0.48, enabled: false },
  { code: 'EUR', name: 'Euro', rate: 0.56, enabled: false },
  { code: 'JPY', name: 'Japanese Yen', rate: 91.5, enabled: false },
  { code: 'CAD', name: 'Canadian Dollar', rate: 0.83, enabled: false },
  { code: 'SGD', name: 'Singapore Dollar', rate: 0.82, enabled: false },
];

const DEFAULT_APPS = [
  { id: 'stripe', name: 'Stripe', description: 'Accept credit card and bank payments.', icon: 'S', connected: false },
  { id: 'xero-tax', name: 'Xero Tax', description: 'Prepare and file tax returns.', icon: 'XT', connected: true },
  { id: 'hubspot', name: 'HubSpot', description: 'Sync contacts and invoices with CRM.', icon: 'H', connected: true },
  { id: 'shopify', name: 'Shopify', description: 'Import Shopify sales as invoices.', icon: 'Sh', connected: false },
  { id: 'deputy', name: 'Deputy', description: 'Sync employee schedules.', icon: 'D', connected: false },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

beforeEach(() => {
  localStorage.clear();
  mockApiFetch.mockReset();
  mockApiPut.mockReset();
  // Default: return currencies for currencies API, apps for connected-apps
  mockApiFetch.mockImplementation((path: string) => {
    if (path === '/currencies') return Promise.resolve(DEFAULT_CURRENCIES);
    if (path === '/connected-apps') return Promise.resolve(DEFAULT_APPS);
    // For settings key lookups (payment services, etc.)
    return Promise.reject({ ok: false, error: 'Not found' });
  });
  mockApiPut.mockResolvedValue({ ok: true });
});

afterEach(() => {
  mockApiFetch.mockReset();
  mockApiPut.mockReset();
});

/* ─────────────────────────────────────────
   PaymentServicesPage
   ───────────────────────────────────────── */
describe('PaymentServicesPage', () => {
  beforeEach(() => {
    // Payment services page uses the settings API for its own key
    mockApiFetch.mockImplementation((path: string) => {
      if (path === '/settings/payment-services') {
        return Promise.reject({ ok: false, error: 'Not found' });
      }
      return Promise.reject({ ok: false, error: 'Not found' });
    });
  });

  it('renders all three payment services', async () => {
    render(<PaymentServicesPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Stripe')).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.getByText('GoCardless')).toBeInTheDocument();
    expect(screen.getByText('PayPal')).toBeInTheDocument();
  });

  it('PayPal starts enabled, Stripe starts disabled', async () => {
    render(<PaymentServicesPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('toggle-paypal')).toBeInTheDocument();
    }, { timeout: 3000 });
    const paypalToggle = screen.getByTestId('toggle-paypal');
    const stripeToggle = screen.getByTestId('toggle-stripe');
    expect(paypalToggle).toHaveAttribute('aria-checked', 'true');
    expect(stripeToggle).toHaveAttribute('aria-checked', 'false');
  });

  it('toggles Stripe on when clicked', async () => {
    render(<PaymentServicesPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('toggle-stripe')).toBeInTheDocument();
    }, { timeout: 3000 });
    const stripeToggle = screen.getByTestId('toggle-stripe');
    expect(stripeToggle).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(stripeToggle);
    expect(stripeToggle).toHaveAttribute('aria-checked', 'true');
  });
});

/* ─────────────────────────────────────────
   EmailTemplatesPage
   ───────────────────────────────────────── */
describe('EmailTemplatesPage', () => {
  it('renders the page with template type selector', async () => {
    render(<EmailTemplatesPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByLabelText('Template Type')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows invoice template subject by default', async () => {
    render(<EmailTemplatesPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByLabelText('Subject')).toBeInTheDocument();
    }, { timeout: 3000 });
    const subjectInput = screen.getByLabelText('Subject') as HTMLInputElement;
    expect(subjectInput.value).toContain('{invoiceNumber}');
  });

  it('has a Save Template button', async () => {
    render(<EmailTemplatesPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('save-template')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

/* ─────────────────────────────────────────
   CurrenciesPage
   ───────────────────────────────────────── */
describe('CurrenciesPage', () => {
  it('renders currency list after loading', async () => {
    render(<CurrenciesPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('New Zealand Dollar')).toBeInTheDocument();
    });
    expect(screen.getByText('Australian Dollar')).toBeInTheDocument();
    expect(screen.getByText('US Dollar')).toBeInTheDocument();
    expect(screen.getByText('British Pound')).toBeInTheDocument();
  });

  it('NZD toggle is disabled (base currency)', async () => {
    render(<CurrenciesPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('toggle-currency-NZD')).toBeInTheDocument();
    });
    expect(screen.getByTestId('toggle-currency-NZD')).toBeDisabled();
  });

  it('NZD rate input is disabled', async () => {
    render(<CurrenciesPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByLabelText('Exchange rate for NZD')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Exchange rate for NZD')).toBeDisabled();
  });
});

/* ─────────────────────────────────────────
   BrandingPage
   ───────────────────────────────────────── */
describe('BrandingPage', () => {
  it('renders branding editor after loading', async () => {
    render(<BrandingPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByLabelText('Theme Name')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows Save Branding and New Theme buttons', async () => {
    render(<BrandingPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('save-branding')).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.getByTestId('create-theme')).toBeInTheDocument();
  });

  it('renders branding preview', async () => {
    render(<BrandingPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('branding-preview')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

/* ─────────────────────────────────────────
   ConnectedAppsPage
   ───────────────────────────────────────── */
describe('ConnectedAppsPage', () => {
  it('renders all five connected apps', async () => {
    render(<ConnectedAppsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Stripe')).toBeInTheDocument();
    });
    expect(screen.getByText('Xero Tax')).toBeInTheDocument();
    expect(screen.getByText('HubSpot')).toBeInTheDocument();
    expect(screen.getByText('Shopify')).toBeInTheDocument();
    expect(screen.getByText('Deputy')).toBeInTheDocument();
  });

  it('toggles an app when button is clicked', async () => {
    // After toggle, re-fetch should return updated data
    let stripeConnected = false;
    mockApiFetch.mockImplementation((path: string) => {
      if (path === '/connected-apps') {
        return Promise.resolve(
          DEFAULT_APPS.map((a) =>
            a.id === 'stripe' ? { ...a, connected: stripeConnected } : a,
          ),
        );
      }
      if (path === '/currencies') return Promise.resolve(DEFAULT_CURRENCIES);
      return Promise.reject({ ok: false, error: 'Not found' });
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
    await waitFor(() => {
      expect(stripeBtn).toHaveTextContent('Disconnect');
    });
  });
});

/* ─────────────────────────────────────────
   EmailTemplateEditor (component)
   ───────────────────────────────────────── */
describe('EmailTemplateEditor', () => {
  it('renders subject and body fields', () => {
    const onChange = () => {};
    render(
      <EmailTemplateEditor
        subject="Test Subject"
        body="Test Body"
        onChange={onChange}
        variables={['{name}']}
      />,
    );
    expect(screen.getByLabelText('Subject')).toHaveValue('Test Subject');
    expect(screen.getByLabelText('Body')).toHaveValue('Test Body');
  });

  it('renders variable insertion buttons', () => {
    const onChange = () => {};
    render(
      <EmailTemplateEditor
        subject=""
        body=""
        onChange={onChange}
        variables={['{contactName}', '{amount}']}
      />,
    );
    expect(screen.getByText('{contactName}')).toBeInTheDocument();
    expect(screen.getByText('{amount}')).toBeInTheDocument();
  });
});

/* ─────────────────────────────────────────
   BrandingPreview (component)
   ───────────────────────────────────────── */
describe('BrandingPreview', () => {
  it('renders with accent color and font', () => {
    render(
      <BrandingPreview logo="" accentColor="#ff0000" font="Georgia" />,
    );
    const preview = screen.getByTestId('branding-preview');
    expect(preview).toHaveStyle({ fontFamily: 'Georgia' });
    expect(screen.getByText('INVOICE')).toHaveStyle({ color: '#ff0000' });
  });

  it('shows "No Logo" placeholder when logo is empty', () => {
    render(
      <BrandingPreview logo="" accentColor="#0078c8" font="Arial" />,
    );
    expect(screen.getByText('No Logo')).toBeInTheDocument();
  });
});

/* ─────────────────────────────────────────
   InviteUserDialog (component)
   ───────────────────────────────────────── */
describe('InviteUserDialog', () => {
  it('renders dialog when open', () => {
    render(
      <InviteUserDialog open={true} onClose={() => {}} onInvite={() => {}} />,
    );
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Role')).toBeInTheDocument();
    expect(screen.getByTestId('send-invite')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <InviteUserDialog open={false} onClose={() => {}} onInvite={() => {}} />,
    );
    expect(screen.queryByLabelText('Email Address')).not.toBeInTheDocument();
  });
});
