import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BillList } from '../components/BillList';
import type { Bill } from '../types';

function makeBill(overrides: Partial<Bill> = {}): Bill {
  return {
    id: 'b001',
    billNumber: 'BILL-0001',
    reference: 'PO-001',
    contactId: 'c001',
    contactName: 'Test Supplier',
    status: 'draft',
    amountType: 'exclusive',
    currency: 'NZD',
    date: '2024-06-01',
    dueDate: '2024-07-01',
    lineItems: [],
    subTotal: 100,
    totalTax: 15,
    total: 115,
    amountDue: 115,
    amountPaid: 0,
    createdAt: '2024-06-01T00:00:00.000Z',
    updatedAt: '2024-06-01T00:00:00.000Z',
    ...overrides,
  };
}

const BILLS: Bill[] = [
  makeBill({ id: 'b1', billNumber: 'BILL-0001', status: 'draft', contactName: 'Alpha Corp' }),
  makeBill({ id: 'b2', billNumber: 'BILL-0002', status: 'submitted', contactName: 'Beta Ltd' }),
  makeBill({ id: 'b3', billNumber: 'BILL-0003', status: 'approved', contactName: 'Gamma Inc' }),
  makeBill({ id: 'b4', billNumber: 'BILL-0004', status: 'paid', contactName: 'Delta Co', amountDue: 0, amountPaid: 115 }),
  makeBill({
    id: 'b5',
    billNumber: 'BILL-0005',
    status: 'approved',
    contactName: 'Epsilon NZ',
    dueDate: '2020-01-01',
    amountDue: 50,
  }),
  makeBill({ id: 'b6', billNumber: 'BILL-0006', status: 'voided', contactName: 'Zeta Group' }),
];

describe('BillList', () => {
  it('renders the bill table with headers', () => {
    render(<BillList bills={BILLS} />);
    expect(screen.getByText('From')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Reference')).toBeInTheDocument();
    // "Date" and "Due date" also appear in the date-type filter select
    const dateHeaders = screen.getAllByText('Due date');
    expect(dateHeaders.length).toBeGreaterThanOrEqual(1);
  });

  it('renders all bills by default', () => {
    render(<BillList bills={BILLS} />);
    // Bill rows are identified by testid since bill number is not a visible column
    expect(screen.getByTestId('bill-row-b1')).toBeInTheDocument();
    expect(screen.getByTestId('bill-row-b2')).toBeInTheDocument();
    expect(screen.getByTestId('bill-row-b3')).toBeInTheDocument();
    expect(screen.getByTestId('bill-row-b4')).toBeInTheDocument();
    expect(screen.getByTestId('bill-row-b5')).toBeInTheDocument();
    expect(screen.getByTestId('bill-row-b6')).toBeInTheDocument();
  });

  it('filters by search query', () => {
    render(<BillList bills={BILLS} />);
    const searchInput = screen.getByPlaceholderText('Enter a contact, amount, or reference');
    fireEvent.change(searchInput, { target: { value: 'Alpha' } });
    expect(screen.getByTestId('bill-row-b1')).toBeInTheDocument();
    expect(screen.queryByTestId('bill-row-b2')).not.toBeInTheDocument();
  });

  it('shows empty state when no bills match', () => {
    render(<BillList bills={BILLS} />);
    const searchInput = screen.getByPlaceholderText('Enter a contact, amount, or reference');
    fireEvent.change(searchInput, { target: { value: 'nonexistent12345' } });
    expect(screen.getByText('No bills yet')).toBeInTheDocument();
  });

  it('calls onBillClick when a row is clicked', () => {
    const onClick = vi.fn();
    render(<BillList bills={[BILLS[0]]} onBillClick={onClick} />);
    // Click on the contact name in the row
    fireEvent.click(screen.getByText('Alpha Corp'));
    expect(onClick).toHaveBeenCalledWith(BILLS[0]);
  });

  it('renders the search input', () => {
    render(<BillList bills={[]} />);
    expect(screen.getByPlaceholderText('Enter a contact, amount, or reference')).toBeInTheDocument();
  });

  it('searches by bill number', () => {
    render(<BillList bills={BILLS} />);
    const searchInput = screen.getByPlaceholderText('Enter a contact, amount, or reference');
    fireEvent.change(searchInput, { target: { value: 'BILL-0003' } });
    expect(screen.getByTestId('bill-row-b3')).toBeInTheDocument();
    expect(screen.queryByTestId('bill-row-b1')).not.toBeInTheDocument();
  });

  it('searches by reference', () => {
    render(<BillList bills={BILLS} />);
    const searchInput = screen.getByPlaceholderText('Enter a contact, amount, or reference');
    fireEvent.change(searchInput, { target: { value: 'PO-001' } });
    // All bills have PO-001 reference by default in our test data
    expect(screen.getByTestId('bill-row-b1')).toBeInTheDocument();
  });
});
