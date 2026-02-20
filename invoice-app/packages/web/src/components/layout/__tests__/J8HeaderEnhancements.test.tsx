// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock SearchOmnibar
vi.mock('../../patterns/SearchOmnibar', () => ({
  SearchOmnibar: ({ open }: { open: boolean }) => {
    if (!open) return null;
    return <div role="dialog" aria-label="Search" data-testid="search-omnibar" />;
  },
}));

// Mock CreateNewDropdown
vi.mock('../CreateNewDropdown', () => ({
  CreateNewDropdown: () => <div data-testid="create-new-dropdown"><button aria-label="Create new">New</button></div>,
}));

// Mock OrgSwitcher
vi.mock('../OrgSwitcher', () => ({
  OrgSwitcher: () => <div data-testid="org-switcher"><button aria-label="Switch organization">Demo Company (NZ)</button></div>,
}));

import { Header } from '../Header';

describe('Header user menu enhancements', () => {
  it('shows Account link in user menu dropdown', () => {
    render(<Header />);
    fireEvent.click(screen.getByTestId('user-menu-trigger'));
    expect(screen.getByTestId('user-menu-account')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
  });

  it('shows login history in user menu dropdown', () => {
    render(<Header />);
    fireEvent.click(screen.getByTestId('user-menu-trigger'));
    expect(screen.getByTestId('user-menu-login-history')).toBeInTheDocument();
    expect(screen.getByText('Last login')).toBeInTheDocument();
  });

  it('Account link points to /settings (full account settings not yet implemented)', () => {
    render(<Header />);
    fireEvent.click(screen.getByTestId('user-menu-trigger'));
    const accountLink = screen.getByTestId('user-menu-account');
    expect(accountLink.getAttribute('href')).toBe('/settings');
    expect(accountLink.getAttribute('title')).toBe('Account settings — not yet implemented');
  });
});

describe('CreateNewDropdown has 10 items in exact Xero order', () => {
  it('renders all 10 create options in correct order with CREATE NEW heading', async () => {
    // Import the real CreateNewDropdown (not the mock)
    vi.unmock('../CreateNewDropdown');
    const { CreateNewDropdown } = await import('../CreateNewDropdown');
    render(<CreateNewDropdown />);

    // Open the dropdown
    fireEvent.click(screen.getByLabelText('Create new'));

    const menu = screen.getByRole('menu');
    const items = menu.querySelectorAll('[role="menuitem"]');
    expect(items.length).toBe(10);

    // Verify "CREATE NEW" heading
    expect(screen.getByText('Create new', { selector: 'div' })).toBeInTheDocument();

    // Verify exact Xero order
    const labels = Array.from(items).map((el) => el.textContent);
    expect(labels).toEqual([
      'Invoice',
      'Payment link',
      'Bill',
      'Contact',
      'Quote',
      'Purchase order',
      'Manual journal',
      'Spend money',
      'Receive money',
      'Transfer money',
    ]);
  });
});
