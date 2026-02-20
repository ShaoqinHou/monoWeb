// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock TanStack Router Link as a plain <a> for unit tests
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: any) => <a href={to} {...rest}>{children}</a>,
}));

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
  CreateNewDropdown: () => <div data-testid="create-new-dropdown">New</div>,
}));

// Mock OrgSwitcher
vi.mock('../OrgSwitcher', () => ({
  OrgSwitcher: () => <div data-testid="org-switcher">Demo Company (NZ)</div>,
}));

import { Sidebar } from '../Sidebar';
import { Header } from '../Header';
import { MobileOverlay } from '../MobileOverlay';

// Test Sidebar collapsed behavior
describe('Sidebar Responsive', () => {
  it('renders in collapsed mode with narrow width', () => {
    const { container } = render(<Sidebar activePath="/" collapsed={true} onToggle={vi.fn()} />);
    const aside = container.querySelector('aside');
    expect(aside?.className).toContain('w-16');
  });

  it('renders in expanded mode with normal width', () => {
    const { container } = render(<Sidebar activePath="/" collapsed={false} onToggle={vi.fn()} />);
    const aside = container.querySelector('aside');
    expect(aside?.className).toContain('w-56');
  });

  it('toggle button calls onToggle', () => {
    const onToggle = vi.fn();
    render(<Sidebar activePath="/" collapsed={false} onToggle={onToggle} />);
    const toggleBtn = screen.getByTestId('sidebar-toggle');
    fireEvent.click(toggleBtn);
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('hides text labels when collapsed', () => {
    render(<Sidebar activePath="/" collapsed={true} onToggle={vi.fn()} />);
    // Home text should not be visible when collapsed (it's a link with icon only)
    expect(screen.queryByText('Home')).toBeNull();
  });

  it('shows text labels when expanded', () => {
    render(<Sidebar activePath="/" collapsed={false} onToggle={vi.fn()} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('does not render toggle button when onToggle not provided', () => {
    render(<Sidebar activePath="/" />);
    expect(screen.queryByTestId('sidebar-toggle')).not.toBeInTheDocument();
  });

  it('applies mobile translate class when mobileOpen is false', () => {
    const { container } = render(<Sidebar activePath="/" mobileOpen={false} />);
    const aside = container.querySelector('aside');
    expect(aside?.className).toContain('-translate-x-full');
  });

  it('removes mobile translate class when mobileOpen is true', () => {
    const { container } = render(<Sidebar activePath="/" mobileOpen={true} />);
    const aside = container.querySelector('aside');
    expect(aside?.className).toContain('translate-x-0');
    expect(aside?.className).not.toContain('-translate-x-full');
  });
});

// Test Header hamburger
describe('Header Responsive', () => {
  it('renders hamburger menu button when onMenuClick provided', () => {
    render(<Header onMenuClick={vi.fn()} />);
    const hamburger = screen.getByTestId('hamburger-menu');
    expect(hamburger).toBeInTheDocument();
  });

  it('hamburger calls onMenuClick', () => {
    const onMenuClick = vi.fn();
    render(<Header onMenuClick={onMenuClick} />);
    fireEvent.click(screen.getByTestId('hamburger-menu'));
    expect(onMenuClick).toHaveBeenCalledOnce();
  });

  it('does not render hamburger when onMenuClick not provided', () => {
    render(<Header />);
    expect(screen.queryByTestId('hamburger-menu')).not.toBeInTheDocument();
  });
});

// Test MobileOverlay
describe('MobileOverlay', () => {
  it('renders when open', () => {
    render(<MobileOverlay open={true} onClose={vi.fn()} />);
    expect(screen.getByTestId('mobile-overlay')).toBeInTheDocument();
  });

  it('hidden when closed', () => {
    render(<MobileOverlay open={false} onClose={vi.fn()} />);
    expect(screen.queryByTestId('mobile-overlay')).not.toBeInTheDocument();
  });

  it('calls onClose when clicked', () => {
    const onClose = vi.fn();
    render(<MobileOverlay open={true} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('mobile-overlay'));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
