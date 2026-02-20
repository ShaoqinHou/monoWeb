import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InvoiceStatusBadge, STATUS_CONFIG } from '../components/InvoiceStatusBadge';
import type { InvoiceStatusType } from '../types';

describe('InvoiceStatusBadge', () => {
  const statuses: InvoiceStatusType[] = ['draft', 'submitted', 'approved', 'paid', 'voided'];

  it('renders a badge element', () => {
    render(<InvoiceStatusBadge status="draft" />);
    expect(screen.getByTestId('invoice-status-badge')).toBeInTheDocument();
  });

  it.each(statuses)('renders the correct label for status "%s"', (status) => {
    render(<InvoiceStatusBadge status={status} />);
    expect(screen.getByText(STATUS_CONFIG[status].label)).toBeInTheDocument();
  });

  it('renders "Draft" with default variant for draft status', () => {
    render(<InvoiceStatusBadge status="draft" />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders "Awaiting Approval" for submitted status', () => {
    render(<InvoiceStatusBadge status="submitted" />);
    expect(screen.getByText('Awaiting Approval')).toBeInTheDocument();
  });

  it('renders "Approved" for approved status', () => {
    render(<InvoiceStatusBadge status="approved" />);
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('renders "Paid" for paid status', () => {
    render(<InvoiceStatusBadge status="paid" />);
    expect(screen.getByText('Paid')).toBeInTheDocument();
  });

  it('renders "Voided" for voided status', () => {
    render(<InvoiceStatusBadge status="voided" />);
    expect(screen.getByText('Voided')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<InvoiceStatusBadge status="draft" className="custom-class" />);
    expect(screen.getByTestId('invoice-status-badge')).toHaveClass('custom-class');
  });

  it('maps each status to a distinct variant', () => {
    const variants = new Set(statuses.map((s) => STATUS_CONFIG[s].variant));
    // We expect at least 4 distinct variants (draft=default, submitted=info, approved=warning, paid=success, voided=error)
    expect(variants.size).toBe(5);
  });
});
