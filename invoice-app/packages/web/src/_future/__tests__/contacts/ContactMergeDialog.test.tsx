// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactMergeDialog } from '../components/ContactMergeDialog';
import type { Contact } from '../types';

const SOURCE_CONTACT: Contact = {
  id: 'src-001',
  name: 'Acme Corp',
  type: 'customer',
  email: 'old@acme.com',
  phone: '555-0100',
  taxNumber: 'NZ-12-345-678',
  bankAccountName: 'Acme Old',
  bankAccountNumber: '12-3456-7890123-00',
  defaultAccountCode: '200',
  outstandingBalance: 500,
  overdueBalance: 0,
  isArchived: false,
  createdAt: '2025-01-15T10:00:00.000Z',
  updatedAt: '2025-06-01T14:30:00.000Z',
};

const TARGET_CONTACT: Contact = {
  id: 'tgt-002',
  name: 'Acme Corporation',
  type: 'customer',
  email: 'new@acme.com',
  phone: '555-0200',
  taxNumber: 'NZ-12-345-678',
  bankAccountName: 'Acme New',
  bankAccountNumber: '12-9999-7890123-00',
  defaultAccountCode: '200',
  outstandingBalance: 300,
  overdueBalance: 100,
  isArchived: false,
  createdAt: '2025-02-15T10:00:00.000Z',
  updatedAt: '2025-07-01T14:30:00.000Z',
};

describe('ContactMergeDialog', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    sourceContact: SOURCE_CONTACT,
    targetContact: TARGET_CONTACT,
    onMerge: vi.fn(),
    isMerging: false,
  };

  it('renders both contacts side-by-side', () => {
    render(<ContactMergeDialog {...defaultProps} />);
    expect(screen.getByTestId('merge-source')).toBeInTheDocument();
    expect(screen.getByTestId('merge-target')).toBeInTheDocument();
    // Source contact name appears in the source card
    const sourceCard = screen.getByTestId('merge-source');
    expect(sourceCard.textContent).toContain('Acme Corp');
    // Target contact name appears in the target card
    const targetCard = screen.getByTestId('merge-target');
    expect(targetCard.textContent).toContain('Acme Corporation');
  });

  it('does not render when open is false', () => {
    render(<ContactMergeDialog {...defaultProps} open={false} />);
    expect(screen.queryByTestId('merge-source')).not.toBeInTheDocument();
  });

  it('renders radio buttons for name field selection', () => {
    render(<ContactMergeDialog {...defaultProps} />);
    const nameRadios = screen.getAllByRole('radio', { name: /name/i });
    expect(nameRadios.length).toBeGreaterThanOrEqual(2);
  });

  it('renders radio buttons for email field selection', () => {
    render(<ContactMergeDialog {...defaultProps} />);
    const emailRadios = screen.getAllByRole('radio', { name: /email/i });
    expect(emailRadios.length).toBeGreaterThanOrEqual(2);
  });

  it('renders radio buttons for phone field selection', () => {
    render(<ContactMergeDialog {...defaultProps} />);
    const phoneRadios = screen.getAllByRole('radio', { name: /phone/i });
    expect(phoneRadios.length).toBeGreaterThanOrEqual(2);
  });

  it('shows merged preview section', () => {
    render(<ContactMergeDialog {...defaultProps} />);
    expect(screen.getByTestId('merge-preview')).toBeInTheDocument();
  });

  it('calls onMerge with correct decision when Merge is clicked', async () => {
    const onMerge = vi.fn();
    const user = userEvent.setup();
    render(<ContactMergeDialog {...defaultProps} onMerge={onMerge} />);

    // Click merge button (defaults: source values for all fields, keep=target)
    await user.click(screen.getByTestId('merge-confirm-btn'));

    expect(onMerge).toHaveBeenCalledTimes(1);
    const decision = onMerge.mock.calls[0][0];
    expect(decision).toHaveProperty('keepContactId');
    expect(decision).toHaveProperty('deleteContactId');
    expect(decision).toHaveProperty('fields');
    expect(decision.fields).toHaveProperty('name');
    expect(decision.fields).toHaveProperty('email');
    expect(decision.fields).toHaveProperty('phone');
  });

  it('disables merge button while merging', () => {
    render(<ContactMergeDialog {...defaultProps} isMerging={true} />);
    const mergeBtn = screen.getByTestId('merge-confirm-btn');
    expect(mergeBtn).toBeDisabled();
  });

  it('shows warning about reassigning invoices/bills', () => {
    render(<ContactMergeDialog {...defaultProps} />);
    expect(screen.getByTestId('merge-warning')).toBeInTheDocument();
    expect(screen.getByTestId('merge-warning').textContent).toMatch(/invoices|bills/i);
  });

  it('updates preview when radio button selection changes', async () => {
    const user = userEvent.setup();
    render(<ContactMergeDialog {...defaultProps} />);

    // Select target name
    const targetNameRadio = screen.getByTestId('radio-name-target');
    await user.click(targetNameRadio);

    const preview = screen.getByTestId('merge-preview');
    expect(preview.textContent).toContain('Acme Corporation');
  });

  it('calls onClose when cancel is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ContactMergeDialog {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
