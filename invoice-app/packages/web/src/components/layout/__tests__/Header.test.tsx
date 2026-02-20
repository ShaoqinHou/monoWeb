// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock SearchOmnibar to avoid pulling in real hook dependencies
vi.mock('../../patterns/SearchOmnibar', () => ({
  SearchOmnibar: ({ open, onClose }: { open: boolean; onClose: () => void }) => {
    if (!open) return null;
    return (
      <div role="dialog" aria-label="Search" data-testid="search-omnibar">
        <button onClick={onClose}>Close</button>
      </div>
    );
  },
}));

// Mock CreateNewDropdown
vi.mock('../CreateNewDropdown', () => ({
  CreateNewDropdown: () => (
    <div data-testid="create-new-dropdown">
      <button aria-label="Create new">New</button>
    </div>
  ),
}));

// Mock OrgSwitcher
vi.mock('../OrgSwitcher', () => ({
  OrgSwitcher: () => (
    <div data-testid="org-switcher">
      <button aria-label="Switch organization">Demo Company (NZ)</button>
    </div>
  ),
}));

import { Header } from '../Header';

describe('Header', () => {
  it('renders the app logo and name', () => {
    render(<Header />);
    expect(screen.getByText('Xero Replica')).toBeInTheDocument();
    expect(screen.getByText('XR')).toBeInTheDocument();
  });

  it('renders the OrgSwitcher component', () => {
    render(<Header />);
    expect(screen.getByTestId('org-switcher')).toBeInTheDocument();
    expect(screen.getByLabelText('Switch organization')).toBeInTheDocument();
  });

  it('renders the CreateNewDropdown component', () => {
    render(<Header />);
    expect(screen.getByTestId('create-new-dropdown')).toBeInTheDocument();
    expect(screen.getByLabelText('Create new')).toBeInTheDocument();
  });

  it('renders search button', () => {
    render(<Header />);
    expect(screen.getByLabelText('Search')).toBeInTheDocument();
  });

  it('renders notifications button', () => {
    render(<Header />);
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
  });

  it('renders user menu button', () => {
    render(<Header />);
    expect(screen.getByLabelText('User menu')).toBeInTheDocument();
  });

  it('has banner role', () => {
    render(<Header />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('search button opens the omnibar', () => {
    render(<Header />);
    // Omnibar should not be visible initially
    expect(screen.queryByTestId('search-omnibar')).not.toBeInTheDocument();

    // Click the search button
    fireEvent.click(screen.getByLabelText('Search'));

    // Omnibar should now be visible
    expect(screen.getByTestId('search-omnibar')).toBeInTheDocument();
  });

  it('Ctrl+K opens the omnibar', () => {
    render(<Header />);
    expect(screen.queryByTestId('search-omnibar')).not.toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

    expect(screen.getByTestId('search-omnibar')).toBeInTheDocument();
  });

  it('renders SearchOmnibar component (initially closed)', () => {
    render(<Header />);
    // The omnibar is rendered but hidden (open=false returns null)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('user menu opens on click and shows profile, settings, logout', () => {
    render(<Header />);

    // User menu dropdown should not be visible initially
    expect(screen.queryByTestId('user-menu')).not.toBeInTheDocument();

    // Click user menu trigger
    fireEvent.click(screen.getByTestId('user-menu-trigger'));

    // Dropdown should now be visible
    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    expect(screen.getByTestId('user-menu-profile')).toBeInTheDocument();
    expect(screen.getByTestId('user-menu-account')).toBeInTheDocument();
    expect(screen.getByTestId('user-menu-logout')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Log out')).toBeInTheDocument();
  });

  it('user menu closes when clicking a menu item', () => {
    render(<Header />);

    fireEvent.click(screen.getByTestId('user-menu-trigger'));
    expect(screen.getByTestId('user-menu')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('user-menu-profile'));
    expect(screen.queryByTestId('user-menu')).not.toBeInTheDocument();
  });

  it('user menu displays user info', () => {
    render(<Header />);

    fireEvent.click(screen.getByTestId('user-menu-trigger'));
    expect(screen.getByText('Demo User')).toBeInTheDocument();
    expect(screen.getByText('demo@example.com')).toBeInTheDocument();
  });

  it('renders hamburger menu button when onMenuClick is provided', () => {
    const onMenuClick = vi.fn();
    render(<Header onMenuClick={onMenuClick} />);

    const hamburger = screen.getByTestId('hamburger-menu');
    expect(hamburger).toBeInTheDocument();

    fireEvent.click(hamburger);
    expect(onMenuClick).toHaveBeenCalledOnce();
  });

  it('does not render hamburger menu button when onMenuClick is not provided', () => {
    render(<Header />);
    expect(screen.queryByTestId('hamburger-menu')).not.toBeInTheDocument();
  });
});
