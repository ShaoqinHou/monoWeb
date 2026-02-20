// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SettingsPage } from '../routes/SettingsPage';

// Mock TanStack Router — Link renders as a plain <a> with href
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: Record<string, unknown>) => (
    <a href={to as string} {...rest}>{children as React.ReactNode}</a>
  ),
  useRouterState: () => ({ location: { href: '/settings', pathname: '/settings', search: '' } }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
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

describe('SettingsPage', () => {
  it('renders the page title "Settings"', () => {
    render(<SettingsPage />, { wrapper: createWrapper() });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Settings');
  });

  it('renders the settings hub with 9 Xero-aligned sections', () => {
    render(<SettingsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('settings-hub')).toBeInTheDocument();

    // Xero-aligned sections
    expect(screen.getByTestId('settings-section-general')).toBeInTheDocument();
    expect(screen.getByTestId('settings-section-sales')).toBeInTheDocument();
    expect(screen.getByTestId('settings-section-purchases')).toBeInTheDocument();
    expect(screen.getByTestId('settings-section-reporting')).toBeInTheDocument();
    expect(screen.getByTestId('settings-section-payroll')).toBeInTheDocument();
    expect(screen.getByTestId('settings-section-accounting')).toBeInTheDocument();
    expect(screen.getByTestId('settings-section-tax')).toBeInTheDocument();
    expect(screen.getByTestId('settings-section-contacts')).toBeInTheDocument();
    expect(screen.getByTestId('settings-section-projects')).toBeInTheDocument();
  });

  it('renders 20+ settings links', () => {
    render(<SettingsPage />, { wrapper: createWrapper() });
    const allLinks = screen.getByTestId('settings-hub').querySelectorAll('[data-testid^="settings-link-"]');
    expect(allLinks.length).toBeGreaterThanOrEqual(20);
  });

  it('has organisation details link', () => {
    render(<SettingsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('settings-link-organisation-details')).toBeInTheDocument();
    expect(screen.getByTestId('settings-link-organisation-details')).toHaveAttribute('href', '/settings');
  });

  it('has invoice settings link in Sales section', () => {
    render(<SettingsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('settings-link-invoice-settings')).toBeInTheDocument();
  });

  it('has users link in General section', () => {
    render(<SettingsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('settings-link-users')).toBeInTheDocument();
    expect(screen.getByTestId('settings-link-users')).toHaveAttribute('href', '/settings/users');
  });

  it('has tracking categories and currencies in Accounting section', () => {
    render(<SettingsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('settings-link-tracking-categories')).toBeInTheDocument();
    expect(screen.getByTestId('settings-link-currencies')).toBeInTheDocument();
  });

  it('has tax rates link in Tax section', () => {
    render(<SettingsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('settings-link-tax-rates')).toBeInTheDocument();
    expect(screen.getByTestId('settings-link-tax-rates')).toHaveAttribute('href', '/tax/tax-rates');
  });

  it('has payment services link in Sales section', () => {
    render(<SettingsPage />, { wrapper: createWrapper() });
    const link = screen.getByTestId('settings-link-online-payments');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/settings/payment-services');
  });

  it('has payroll settings link in Payroll section', () => {
    render(<SettingsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('settings-link-payroll-settings')).toBeInTheDocument();
  });

  it('has "Looking for user settings?" footer', () => {
    render(<SettingsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('user-settings-footer')).toBeInTheDocument();
    expect(screen.getByTestId('user-settings-footer')).toHaveTextContent('Looking for user settings?');
  });
});
