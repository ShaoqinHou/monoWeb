import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CreditNoteList } from '../components/CreditNoteList';
import type { CreditNote } from '../hooks/useCreditNotes';

const uuid = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;

const SAMPLE_CREDIT_NOTES: CreditNote[] = [
  {
    id: uuid(1),
    creditNoteNumber: 'CN-0001',
    type: 'sales',
    contactId: uuid(101),
    contactName: 'Acme Corporation',
    linkedInvoiceId: null,
    linkedBillId: null,
    status: 'draft',
    date: '2026-02-01',
    subTotal: 500,
    totalTax: 75,
    total: 575,
    remainingCredit: 575,
    createdAt: '2026-02-01T10:00:00Z',
  },
  {
    id: uuid(2),
    creditNoteNumber: 'CN-0002',
    type: 'purchase',
    contactId: uuid(102),
    contactName: 'Bay Industries',
    linkedInvoiceId: null,
    linkedBillId: uuid(201),
    status: 'approved',
    date: '2026-02-05',
    subTotal: 200,
    totalTax: 30,
    total: 230,
    remainingCredit: 230,
    createdAt: '2026-02-05T09:00:00Z',
  },
  {
    id: uuid(3),
    creditNoteNumber: 'CN-0003',
    type: 'sales',
    contactId: uuid(103),
    contactName: 'Creative Solutions',
    linkedInvoiceId: uuid(301),
    linkedBillId: null,
    status: 'applied',
    date: '2026-02-10',
    subTotal: 1000,
    totalTax: 150,
    total: 1150,
    remainingCredit: 0,
    createdAt: '2026-02-10T08:00:00Z',
  },
];

describe('CreditNoteList', () => {
  it('renders the credit note table', () => {
    render(<CreditNoteList creditNotes={SAMPLE_CREDIT_NOTES} onCreditNoteClick={vi.fn()} />);
    expect(screen.getByTestId('credit-note-list-table')).toBeInTheDocument();
  });

  it('renders table header columns', () => {
    render(<CreditNoteList creditNotes={SAMPLE_CREDIT_NOTES} onCreditNoteClick={vi.fn()} />);
    expect(screen.getByText('Number')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Remaining')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders all credit note rows', () => {
    render(<CreditNoteList creditNotes={SAMPLE_CREDIT_NOTES} onCreditNoteClick={vi.fn()} />);
    SAMPLE_CREDIT_NOTES.forEach((cn) => {
      expect(screen.getByTestId(`credit-note-row-${cn.id}`)).toBeInTheDocument();
    });
  });

  it('displays credit note numbers', () => {
    render(<CreditNoteList creditNotes={SAMPLE_CREDIT_NOTES} onCreditNoteClick={vi.fn()} />);
    expect(screen.getByText('CN-0001')).toBeInTheDocument();
    expect(screen.getByText('CN-0002')).toBeInTheDocument();
    expect(screen.getByText('CN-0003')).toBeInTheDocument();
  });

  it('displays contact names', () => {
    render(<CreditNoteList creditNotes={SAMPLE_CREDIT_NOTES} onCreditNoteClick={vi.fn()} />);
    expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    expect(screen.getByText('Bay Industries')).toBeInTheDocument();
  });

  it('calls onCreditNoteClick when a row is clicked', () => {
    const onClick = vi.fn();
    render(<CreditNoteList creditNotes={SAMPLE_CREDIT_NOTES.slice(0, 1)} onCreditNoteClick={onClick} />);
    fireEvent.click(screen.getByTestId(`credit-note-row-${SAMPLE_CREDIT_NOTES[0].id}`));
    expect(onClick).toHaveBeenCalledWith(SAMPLE_CREDIT_NOTES[0].id);
  });

  it('shows empty state when no credit notes', () => {
    render(<CreditNoteList creditNotes={[]} onCreditNoteClick={vi.fn()} />);
    expect(screen.getByTestId('credit-note-list-empty')).toBeInTheDocument();
    expect(screen.getByText('No credit notes found')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<CreditNoteList creditNotes={[]} onCreditNoteClick={vi.fn()} isLoading />);
    expect(screen.getByTestId('credit-note-list-loading')).toBeInTheDocument();
  });

  it('renders status badges', () => {
    render(<CreditNoteList creditNotes={SAMPLE_CREDIT_NOTES} onCreditNoteClick={vi.fn()} />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Applied')).toBeInTheDocument();
  });
});
