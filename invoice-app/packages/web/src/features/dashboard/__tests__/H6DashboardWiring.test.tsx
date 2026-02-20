// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ─── Mock dependencies ──────────────────────────────────────────────────────

vi.mock('@shared/calc/currency', () => ({
  formatCurrency: (amount: number) =>
    `$${amount.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
}));

// ─── Imports ────────────────────────────────────────────────────────────────

import { OrgSwitcher } from '../../../components/layout/OrgSwitcher';

// ─── OrgSwitcher ────────────────────────────────────────────────────────────

describe('OrgSwitcher', () => {
  it('displays active org name "Demo Company (NZ)"', () => {
    render(<OrgSwitcher />);
    expect(screen.getByTestId('org-switcher-name')).toHaveTextContent('Demo Company (NZ)');
  });

  it('opens dropdown when clicked', () => {
    render(<OrgSwitcher />);
    fireEvent.click(screen.getByTestId('org-switcher-trigger'));
    expect(screen.getByTestId('org-switcher-menu')).toBeInTheDocument();
  });

  it('shows all three organizations in dropdown', () => {
    render(<OrgSwitcher />);
    fireEvent.click(screen.getByTestId('org-switcher-trigger'));
    const menu = screen.getByTestId('org-switcher-menu');
    expect(menu).toBeInTheDocument();
    // All three org options are present
    expect(screen.getByTestId('org-option-1')).toBeInTheDocument();
    expect(screen.getByTestId('org-option-2')).toBeInTheDocument();
    expect(screen.getByTestId('org-option-3')).toBeInTheDocument();
    expect(screen.getByText('My Business Ltd')).toBeInTheDocument();
    expect(screen.getByText('Test Organisation')).toBeInTheDocument();
  });

  it('shows lock icon on locked orgs', () => {
    render(<OrgSwitcher />);
    fireEvent.click(screen.getByTestId('org-switcher-trigger'));
    // The locked orgs should have lock icons (aria-label="Locked")
    const lockIcons = screen.getAllByLabelText('Locked');
    expect(lockIcons.length).toBe(2); // My Business Ltd + Test Organisation
  });

  it('shows tooltip on hover for locked org', () => {
    render(<OrgSwitcher />);
    fireEvent.click(screen.getByTestId('org-switcher-trigger'));

    // Hover on locked org
    fireEvent.mouseEnter(screen.getByTestId('org-option-2'));
    expect(screen.getByTestId('org-tooltip-2')).toHaveTextContent('Switch to this organisation');
  });

  it('hides tooltip on mouse leave', () => {
    render(<OrgSwitcher />);
    fireEvent.click(screen.getByTestId('org-switcher-trigger'));

    fireEvent.mouseEnter(screen.getByTestId('org-option-2'));
    expect(screen.getByTestId('org-tooltip-2')).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByTestId('org-option-2'));
    expect(screen.queryByTestId('org-tooltip-2')).not.toBeInTheDocument();
  });
});
