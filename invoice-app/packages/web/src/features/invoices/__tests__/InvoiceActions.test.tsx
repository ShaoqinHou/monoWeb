import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InvoiceActions } from '../components/InvoiceActions';
import type { InvoiceStatusType } from '../types';

describe('InvoiceActions', () => {
  it('renders action buttons for draft status', () => {
    render(<InvoiceActions status="draft" onTransition={vi.fn()} />);
    expect(screen.getByTestId('action-submitted')).toBeInTheDocument();
    expect(screen.getByTestId('action-voided')).toBeInTheDocument();
  });

  it('renders action buttons for submitted status', () => {
    render(<InvoiceActions status="submitted" onTransition={vi.fn()} />);
    expect(screen.getByTestId('action-approved')).toBeInTheDocument();
    expect(screen.getByTestId('action-draft')).toBeInTheDocument();
    expect(screen.getByTestId('action-voided')).toBeInTheDocument();
  });

  it('renders action buttons for approved status', () => {
    render(<InvoiceActions status="approved" onTransition={vi.fn()} />);
    expect(screen.getByTestId('action-paid')).toBeInTheDocument();
    expect(screen.getByTestId('action-voided')).toBeInTheDocument();
  });

  it('renders nothing for paid status (terminal)', () => {
    const { container } = render(<InvoiceActions status="paid" onTransition={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing for voided status (terminal)', () => {
    const { container } = render(<InvoiceActions status="voided" onTransition={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows confirmation dialog when action button is clicked', () => {
    render(<InvoiceActions status="draft" onTransition={vi.fn()} />);
    fireEvent.click(screen.getByTestId('action-submitted'));
    expect(screen.getByText('Confirm Status Change')).toBeInTheDocument();
  });

  it('calls onTransition when confirm is clicked', () => {
    const onTransition = vi.fn();
    render(<InvoiceActions status="draft" onTransition={onTransition} />);
    fireEvent.click(screen.getByTestId('action-submitted'));
    fireEvent.click(screen.getByTestId('confirm-transition'));
    expect(onTransition).toHaveBeenCalledWith('submitted');
  });

  it('closes dialog when Cancel is clicked without calling onTransition', () => {
    const onTransition = vi.fn();
    render(<InvoiceActions status="draft" onTransition={onTransition} />);
    fireEvent.click(screen.getByTestId('action-submitted'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(onTransition).not.toHaveBeenCalled();
    expect(screen.queryByText('Confirm Status Change')).not.toBeInTheDocument();
  });

  it('disables buttons when isPending is true', () => {
    render(<InvoiceActions status="draft" onTransition={vi.fn()} isPending={true} />);
    expect(screen.getByTestId('action-submitted')).toBeDisabled();
    expect(screen.getByTestId('action-voided')).toBeDisabled();
  });

  it('shows correct label text for "Submit for Approval"', () => {
    render(<InvoiceActions status="draft" onTransition={vi.fn()} />);
    expect(screen.getByTestId('action-submitted')).toHaveTextContent('Submit for Approval');
  });

  it('shows correct label text for "Approve"', () => {
    render(<InvoiceActions status="submitted" onTransition={vi.fn()} />);
    expect(screen.getByTestId('action-approved')).toHaveTextContent('Approve');
  });

  it('shows correct label text for "Mark as Paid"', () => {
    render(<InvoiceActions status="approved" onTransition={vi.fn()} />);
    expect(screen.getByTestId('action-paid')).toHaveTextContent('Mark as Paid');
  });

  it('shows destructive variant for void action button', () => {
    render(<InvoiceActions status="draft" onTransition={vi.fn()} />);
    const voidBtn = screen.getByTestId('action-voided');
    expect(voidBtn).toHaveTextContent('Void');
  });
});
