// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock TanStack Router Link as a plain <a> for unit tests
vi.mock('@tanstack/react-router', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Link: ({ to, children, ...rest }: any) => <a href={to} {...rest}>{children}</a>,
}));

import { Sidebar, navItems } from '../Sidebar';

describe('Sidebar', () => {
  describe('navigation items', () => {
    it('renders all 9 top-level nav items', () => {
      render(<Sidebar />);
      const expectedLabels = [
        'Home', 'Sales', 'Purchases', 'Reporting',
        'Payroll', 'Accounting', 'Tax', 'Contacts', 'Projects',
      ];
      for (const label of expectedLabels) {
        expect(screen.getByText(label)).toBeInTheDocument();
      }
    });

    it('has navigation role with label', () => {
      render(<Sidebar />);
      expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
    });

    it('renders Home as simple anchor tag', () => {
      render(<Sidebar />);
      const homeLink = screen.getByText('Home').closest('a');
      expect(homeLink).toBeInTheDocument();
      expect(homeLink!.getAttribute('href')).toBe('/');
    });

    it('renders expandable items as buttons', () => {
      render(<Sidebar />);
      const expandableLabels = ['Sales', 'Purchases', 'Reporting', 'Payroll', 'Accounting', 'Tax', 'Contacts', 'Projects'];
      for (const label of expandableLabels) {
        const button = screen.getByText(label).closest('button');
        expect(button).toBeInTheDocument();
      }
    });
  });

  describe('active state', () => {
    it('highlights Home when activePath is /', () => {
      render(<Sidebar activePath="/" />);
      const homeLink = screen.getByText('Home').closest('a');
      expect(homeLink!.className).toContain('bg-white/15');
      expect(homeLink!.className).toContain('text-white');
    });

    it('sets aria-current on active link', () => {
      render(<Sidebar activePath="/" />);
      const homeLink = screen.getByText('Home').closest('a');
      expect(homeLink!.getAttribute('aria-current')).toBe('page');
    });

    it('highlights Sales section when activePath starts with /sales', () => {
      render(<Sidebar activePath="/sales/invoices" />);
      const salesButton = screen.getByText('Sales').closest('button');
      expect(salesButton!.className).toContain('bg-white/15');
    });

    it('highlights active submenu item', () => {
      render(<Sidebar activePath="/sales/invoices" />);
      const invoicesLink = screen.getByText('Invoices').closest('a');
      expect(invoicesLink!.className).toContain('bg-white/15');
      expect(invoicesLink!.getAttribute('aria-current')).toBe('page');
    });
  });

  describe('submenu expand/collapse', () => {
    it('submenus are collapsed by default when not active', () => {
      render(<Sidebar activePath="/" />);
      expect(screen.queryByText('Invoices')).toBeNull();
    });

    it('auto-expands section containing active path', () => {
      render(<Sidebar activePath="/sales/invoices" />);
      expect(screen.getByText('Invoices')).toBeInTheDocument();
      expect(screen.getByText('Sales overview')).toBeInTheDocument();
    });

    it('expands submenu on click', () => {
      render(<Sidebar activePath="/" />);
      expect(screen.queryByText('Invoices')).toBeNull();

      const salesButton = screen.getByText('Sales').closest('button')!;
      fireEvent.click(salesButton);

      expect(screen.getByText('Sales overview')).toBeInTheDocument();
      expect(screen.getByText('Invoices')).toBeInTheDocument();
      expect(screen.getByText('Payment links')).toBeInTheDocument();
      expect(screen.getByText('Online payments')).toBeInTheDocument();
      expect(screen.getByText('Quotes')).toBeInTheDocument();
      expect(screen.getByText('Products and services')).toBeInTheDocument();
      // "Customers" is a child of Sales — only Sales is expanded here
      expect(screen.getByText('Customers')).toBeInTheDocument();
      expect(screen.getByText('Sales settings')).toBeInTheDocument();
    });

    it('collapses submenu on second click', () => {
      render(<Sidebar activePath="/" />);
      const salesButton = screen.getByText('Sales').closest('button')!;

      fireEvent.click(salesButton);
      expect(screen.getByText('Invoices')).toBeInTheDocument();

      fireEvent.click(salesButton);
      expect(screen.queryByText('Invoices')).toBeNull();
    });

    it('sets aria-expanded correctly', () => {
      render(<Sidebar activePath="/" />);
      const salesButton = screen.getByText('Sales').closest('button')!;

      expect(salesButton.getAttribute('aria-expanded')).toBe('false');

      fireEvent.click(salesButton);
      expect(salesButton.getAttribute('aria-expanded')).toBe('true');

      fireEvent.click(salesButton);
      expect(salesButton.getAttribute('aria-expanded')).toBe('false');
    });

    it('expanding one section collapses the previously expanded section (exclusive accordion)', () => {
      render(<Sidebar activePath="/" />);

      fireEvent.click(screen.getByText('Sales').closest('button')!);
      expect(screen.getByText('Invoices')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Accounting').closest('button')!);
      expect(screen.queryByText('Invoices')).toBeNull();
      expect(screen.getByText('Chart of accounts')).toBeInTheDocument();
    });

    it('renders correct submenu items for Accounting with section headings', () => {
      render(<Sidebar activePath="/" />);
      fireEvent.click(screen.getByText('Accounting').closest('button')!);

      // Section headings
      expect(screen.getByText('Banking')).toBeInTheDocument();
      expect(screen.getByText('Accounting tools')).toBeInTheDocument();

      // Banking section items
      expect(screen.getByText('Bank accounts')).toBeInTheDocument();
      expect(screen.getByText('Bank rules')).toBeInTheDocument();

      // Accounting tools section items
      expect(screen.getByText('Chart of accounts')).toBeInTheDocument();
      expect(screen.getByText('Fixed assets')).toBeInTheDocument();
      expect(screen.getByText('Manual journals')).toBeInTheDocument();
      expect(screen.getByText('Find and recode')).toBeInTheDocument();
      expect(screen.getByText('Assurance dashboard')).toBeInTheDocument();
      expect(screen.getByText('History and notes')).toBeInTheDocument();
      expect(screen.getByText('Accounting settings')).toBeInTheDocument();
    });

    it('renders correct submenu items for Payroll with section headings', () => {
      render(<Sidebar activePath="/" />);
      fireEvent.click(screen.getByText('Payroll').closest('button')!);

      expect(screen.getByText('Payroll overview')).toBeInTheDocument();

      // Section headings
      expect(screen.getByText('Employee management')).toBeInTheDocument();
      expect(screen.getByText('Payroll processing')).toBeInTheDocument();

      // Employee management items
      expect(screen.getByText('Employees')).toBeInTheDocument();
      expect(screen.getByText('Leave')).toBeInTheDocument();
      expect(screen.getByText('Timesheets')).toBeInTheDocument();

      // Payroll processing items
      expect(screen.getByText('Pay employees')).toBeInTheDocument();
      expect(screen.getByText('Taxes and filings')).toBeInTheDocument();
      expect(screen.getByText('Payroll settings')).toBeInTheDocument();
    });

    it('renders correct submenu items for Purchases', () => {
      render(<Sidebar activePath="/" />);
      fireEvent.click(screen.getByText('Purchases').closest('button')!);

      expect(screen.getByText('Purchases overview')).toBeInTheDocument();
      expect(screen.getByText('Bills')).toBeInTheDocument();
      expect(screen.getByText('Purchase orders')).toBeInTheDocument();
      expect(screen.getByText('Expenses')).toBeInTheDocument();
      // Only Purchases is expanded, so "Suppliers" is unique here
      expect(screen.getByText('Suppliers')).toBeInTheDocument();
      expect(screen.getByText('Purchases settings')).toBeInTheDocument();
    });

    it('renders correct submenu items for Reporting with Favourite Reports heading', () => {
      render(<Sidebar activePath="/" />);
      fireEvent.click(screen.getByText('Reporting').closest('button')!);

      expect(screen.getByText('All reports')).toBeInTheDocument();
      // Section heading
      expect(screen.getByText('Favourite reports')).toBeInTheDocument();
      // Favourite reports items
      expect(screen.getByText('Account Transactions')).toBeInTheDocument();
      expect(screen.getByText('Aged Payables Summary')).toBeInTheDocument();
      expect(screen.getByText('Aged Receivables Summary')).toBeInTheDocument();
      expect(screen.getByText('Balance Sheet')).toBeInTheDocument();
      expect(screen.getByText('GST Returns')).toBeInTheDocument();
      expect(screen.getByText('Profit and Loss')).toBeInTheDocument();
      expect(screen.getByText('Short-term cash flow')).toBeInTheDocument();
      expect(screen.getByText('Business snapshot')).toBeInTheDocument();
      expect(screen.getByText('Reporting settings')).toBeInTheDocument();
    });

    it('renders correct submenu items for Tax', () => {
      render(<Sidebar activePath="/" />);
      fireEvent.click(screen.getByText('Tax').closest('button')!);

      expect(screen.getByText('GST returns')).toBeInTheDocument();
      expect(screen.getByText('Tax settings')).toBeInTheDocument();
    });

    it('renders correct submenu items for Contacts with Groups heading', () => {
      render(<Sidebar activePath="/" />);
      fireEvent.click(screen.getByText('Contacts').closest('button')!);

      expect(screen.getByText('All contacts')).toBeInTheDocument();
      // "Customers" and "Suppliers" appear in Contacts children too,
      // but only Contacts is expanded here so they are unique
      expect(screen.getByText('Customers')).toBeInTheDocument();
      expect(screen.getByText('Suppliers')).toBeInTheDocument();
      // Groups section heading and items
      expect(screen.getByText('Groups')).toBeInTheDocument();
      expect(screen.getByText('Training Customers')).toBeInTheDocument();
      expect(screen.getByText('Contacts settings')).toBeInTheDocument();
    });

    it('renders correct submenu items for Projects', () => {
      render(<Sidebar activePath="/" />);
      fireEvent.click(screen.getByText('Projects').closest('button')!);

      expect(screen.getByText('All projects')).toBeInTheDocument();
      expect(screen.getByText('Time entries')).toBeInTheDocument();
      expect(screen.getByText('Staff time overview')).toBeInTheDocument();
      expect(screen.getByText('Projects settings')).toBeInTheDocument();
    });
  });

  describe('nav item data', () => {
    it('exports navItems with 9 entries', () => {
      expect(navItems).toHaveLength(9);
    });

    it('8 items have children submenus', () => {
      const withChildren = navItems.filter((item) => item.children && item.children.length > 0);
      expect(withChildren).toHaveLength(8);
    });

    it('1 item is a simple link without children', () => {
      const withoutChildren = navItems.filter((item) => !item.children || item.children.length === 0);
      expect(withoutChildren).toHaveLength(1);
    });
  });
});
