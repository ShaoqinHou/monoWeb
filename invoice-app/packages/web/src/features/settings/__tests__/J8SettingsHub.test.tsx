// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock @tanstack/react-router
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [key: string]: unknown }) => (
    <a href={to} {...props}>{children}</a>
  ),
  useRouterState: () => ({ location: { href: '/settings', pathname: '/settings', search: '' } }),
}));

// Mock PageContainer
vi.mock('../../../components/layout/PageContainer', () => ({
  PageContainer: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="page-container">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

// Mock Card
vi.mock('../../../components/ui/Card', () => ({
  Card: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="card" {...props}>{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock Badge
vi.mock('../../../components/ui/Badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

// Mock Button
vi.mock('../../../components/ui/Button', () => ({
  Button: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <button {...props}>{children}</button>
  ),
}));

// Mock InviteUserDialog
vi.mock('../components/InviteUserDialog', () => ({
  InviteUserDialog: () => null,
}));

import { SettingsPage } from '../routes/SettingsPage';

describe('SettingsPage hub layout', () => {
  it('renders 9 Xero-aligned settings sections', () => {
    render(<SettingsPage />);

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByTestId('settings-hub')).toBeInTheDocument();

    // Xero-aligned sections matching Xero capture
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
    render(<SettingsPage />);

    // Count settings-link-* test IDs
    const allLinks = screen.getByTestId('settings-hub').querySelectorAll('[data-testid^="settings-link-"]');
    expect(allLinks.length).toBeGreaterThanOrEqual(20);
  });

  it('renders key links in correct sections', () => {
    render(<SettingsPage />);

    expect(screen.getByTestId('settings-link-organisation-details')).toBeInTheDocument();
    expect(screen.getByTestId('settings-link-invoice-settings')).toBeInTheDocument();
    expect(screen.getByTestId('settings-link-users')).toBeInTheDocument();
    expect(screen.getByTestId('settings-link-tracking-categories')).toBeInTheDocument();
    expect(screen.getByTestId('settings-link-currencies')).toBeInTheDocument();
    expect(screen.getByTestId('settings-link-payroll-settings')).toBeInTheDocument();
    expect(screen.getByTestId('settings-link-tax-rates')).toBeInTheDocument();
  });
});
