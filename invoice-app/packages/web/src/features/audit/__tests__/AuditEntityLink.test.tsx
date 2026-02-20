// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuditEntityLink, getEntityHref } from '../components/AuditEntityLink';

vi.mock('@tanstack/react-router', () => ({
  Link: (props: { to: string; children: React.ReactNode; className?: string }) => (
    <a href={props.to} className={props.className}>{props.children}</a>
  ),
}));

describe('AuditEntityLink', () => {
  it('renders an entity link with entity type label', () => {
    render(<AuditEntityLink entityType="invoice" entityId="inv-001" />);
    const link = screen.getByTestId('entity-link');
    expect(link).toBeInTheDocument();
    expect(link.textContent).toContain('invoice');
  });

  it('renders an anchor pointing to the correct invoice path', () => {
    render(<AuditEntityLink entityType="invoice" entityId="inv-001" />);
    const anchor = screen.getByTestId('entity-link').querySelector('a');
    expect(anchor?.getAttribute('href')).toBe('/sales/invoices/inv-001');
  });

  it('renders correct path for bill entity', () => {
    render(<AuditEntityLink entityType="bill" entityId="bill-001" />);
    const anchor = screen.getByTestId('entity-link').querySelector('a');
    expect(anchor?.getAttribute('href')).toBe('/purchases/bills/bill-001');
  });

  it('renders correct path for contact entity', () => {
    render(<AuditEntityLink entityType="contact" entityId="c-001" />);
    const anchor = screen.getByTestId('entity-link').querySelector('a');
    expect(anchor?.getAttribute('href')).toBe('/contacts/c-001');
  });

  it('renders correct path for quote entity', () => {
    render(<AuditEntityLink entityType="quote" entityId="q-001" />);
    const anchor = screen.getByTestId('entity-link').querySelector('a');
    expect(anchor?.getAttribute('href')).toBe('/sales/quotes/q-001');
  });

  it('renders correct path for credit-note entity', () => {
    render(<AuditEntityLink entityType="credit-note" entityId="cn-001" />);
    const anchor = screen.getByTestId('entity-link').querySelector('a');
    expect(anchor?.getAttribute('href')).toBe('/sales/credit-notes/cn-001');
  });

  it('renders correct path for purchase-order entity', () => {
    render(<AuditEntityLink entityType="purchase-order" entityId="po-001" />);
    const anchor = screen.getByTestId('entity-link').querySelector('a');
    expect(anchor?.getAttribute('href')).toBe('/purchases/purchase-orders/po-001');
  });

  it('renders correct path for account entity', () => {
    render(<AuditEntityLink entityType="account" entityId="acc-001" />);
    const anchor = screen.getByTestId('entity-link').querySelector('a');
    expect(anchor?.getAttribute('href')).toBe('/accounting/chart-of-accounts/acc-001/edit');
  });

  it('renders correct path for journal entity', () => {
    render(<AuditEntityLink entityType="journal" entityId="j-001" />);
    const anchor = screen.getByTestId('entity-link').querySelector('a');
    expect(anchor?.getAttribute('href')).toBe('/accounting/manual-journals/j-001');
  });

  it('renders # for unknown entity type', () => {
    render(<AuditEntityLink entityType="unknown" entityId="x-001" />);
    const anchor = screen.getByTestId('entity-link').querySelector('a');
    expect(anchor?.getAttribute('href')).toBe('#');
  });

  it('formats hyphenated entity type as spaced label', () => {
    render(<AuditEntityLink entityType="credit-note" entityId="cn-001" />);
    expect(screen.getByTestId('entity-link').textContent).toContain('credit note');
  });

  it('calls onClick handler when clicked', () => {
    const onClick = vi.fn();
    render(<AuditEntityLink entityType="invoice" entityId="inv-001" onClick={onClick} />);
    fireEvent.click(screen.getByTestId('entity-link'));
    expect(onClick).toHaveBeenCalledWith('invoice', 'inv-001');
  });

  it('renders entity id in the link text', () => {
    render(<AuditEntityLink entityType="invoice" entityId="inv-001" />);
    expect(screen.getByTestId('entity-link').textContent).toContain('inv-001');
  });
});

describe('getEntityHref', () => {
  it('returns correct path for invoice', () => {
    expect(getEntityHref('invoice', 'inv-1')).toBe('/sales/invoices/inv-1');
  });

  it('returns correct path for bill', () => {
    expect(getEntityHref('bill', 'b-1')).toBe('/purchases/bills/b-1');
  });

  it('returns correct path for contact', () => {
    expect(getEntityHref('contact', 'c-1')).toBe('/contacts/c-1');
  });

  it('returns # for unknown type', () => {
    expect(getEntityHref('foo', 'x')).toBe('#');
  });
});
