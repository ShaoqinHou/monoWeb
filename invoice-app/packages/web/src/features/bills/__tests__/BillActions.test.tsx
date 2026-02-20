import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BillActions } from '../components/BillActions';

describe('BillActions', () => {
  it('shows Submit and Void buttons for draft bills', () => {
    const onChange = vi.fn();
    render(<BillActions status="draft" onStatusChange={onChange} />);
    expect(screen.getByTestId('bill-action-submitted')).toHaveTextContent('Submit');
    expect(screen.getByTestId('bill-action-voided')).toHaveTextContent('Void');
  });

  it('shows Edit button for draft bills when onEdit provided', () => {
    const onChange = vi.fn();
    const onEdit = vi.fn();
    render(<BillActions status="draft" onStatusChange={onChange} onEdit={onEdit} />);
    expect(screen.getByTestId('bill-edit-btn')).toBeInTheDocument();
  });

  it('does not show Edit button when onEdit not provided', () => {
    const onChange = vi.fn();
    render(<BillActions status="draft" onStatusChange={onChange} />);
    expect(screen.queryByTestId('bill-edit-btn')).not.toBeInTheDocument();
  });

  it('shows Approve, Revert to Draft, and Void buttons for submitted bills', () => {
    const onChange = vi.fn();
    render(<BillActions status="submitted" onStatusChange={onChange} />);
    expect(screen.getByTestId('bill-action-approved')).toHaveTextContent('Approve');
    expect(screen.getByTestId('bill-action-draft')).toHaveTextContent('Revert to Draft');
    expect(screen.getByTestId('bill-action-voided')).toHaveTextContent('Void');
  });

  it('shows Mark as Paid and Void buttons for approved bills', () => {
    const onChange = vi.fn();
    render(<BillActions status="approved" onStatusChange={onChange} />);
    expect(screen.getByTestId('bill-action-paid')).toHaveTextContent('Mark as Paid');
    expect(screen.getByTestId('bill-action-voided')).toHaveTextContent('Void');
  });

  it('shows no action buttons for paid bills', () => {
    const onChange = vi.fn();
    const { container } = render(<BillActions status="paid" onStatusChange={onChange} />);
    // paid is terminal — no actions at all, component returns null
    expect(container.innerHTML).toBe('');
  });

  it('shows no action buttons for voided bills', () => {
    const onChange = vi.fn();
    const { container } = render(<BillActions status="voided" onStatusChange={onChange} />);
    expect(container.innerHTML).toBe('');
  });

  it('calls onStatusChange when Submit is clicked', () => {
    const onChange = vi.fn();
    render(<BillActions status="draft" onStatusChange={onChange} />);
    fireEvent.click(screen.getByTestId('bill-action-submitted'));
    expect(onChange).toHaveBeenCalledWith('submitted');
  });

  it('calls onStatusChange when Approve is clicked', () => {
    const onChange = vi.fn();
    render(<BillActions status="submitted" onStatusChange={onChange} />);
    fireEvent.click(screen.getByTestId('bill-action-approved'));
    expect(onChange).toHaveBeenCalledWith('approved');
  });

  it('calls onStatusChange when Mark as Paid is clicked', () => {
    const onChange = vi.fn();
    render(<BillActions status="approved" onStatusChange={onChange} />);
    fireEvent.click(screen.getByTestId('bill-action-paid'));
    expect(onChange).toHaveBeenCalledWith('paid');
  });

  it('calls onEdit when Edit is clicked', () => {
    const onChange = vi.fn();
    const onEdit = vi.fn();
    render(<BillActions status="draft" onStatusChange={onChange} onEdit={onEdit} />);
    fireEvent.click(screen.getByTestId('bill-edit-btn'));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('disables buttons when loading', () => {
    const onChange = vi.fn();
    render(<BillActions status="draft" onStatusChange={onChange} loading={true} />);
    expect(screen.getByTestId('bill-action-submitted')).toBeDisabled();
    expect(screen.getByTestId('bill-action-voided')).toBeDisabled();
  });
});
