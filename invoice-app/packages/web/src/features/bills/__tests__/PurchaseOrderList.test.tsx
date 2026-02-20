import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PurchaseOrderList } from '../components/PurchaseOrderList';
import type { PurchaseOrder } from '../hooks/usePurchaseOrders';

const uuid = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;

const SAMPLE_POS: PurchaseOrder[] = [
  {
    id: uuid(1),
    poNumber: 'PO-0001',
    reference: null,
    contactId: uuid(101),
    contactName: 'Office Supplies Ltd',
    status: 'draft',
    deliveryDate: '2026-02-28',
    deliveryAddress: null,
    currency: 'NZD',
    date: '2026-01-20',
    subTotal: 2500,
    totalTax: 375,
    total: 2875,
    convertedBillId: null,
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z',
  },
  {
    id: uuid(2),
    poNumber: 'PO-0002',
    reference: 'REQ-100',
    contactId: uuid(102),
    contactName: 'Tech Hardware Inc',
    status: 'approved',
    deliveryDate: '2026-03-15',
    deliveryAddress: '123 Main St',
    currency: 'NZD',
    date: '2026-02-01',
    subTotal: 8000,
    totalTax: 1200,
    total: 9200,
    convertedBillId: null,
    createdAt: '2026-02-01T09:00:00Z',
    updatedAt: '2026-02-01T09:00:00Z',
  },
  {
    id: uuid(3),
    poNumber: 'PO-0003',
    reference: null,
    contactId: uuid(103),
    contactName: 'Cleaning Services NZ',
    status: 'billed',
    deliveryDate: null,
    deliveryAddress: null,
    currency: 'NZD',
    date: '2026-01-10',
    subTotal: 500,
    totalTax: 75,
    total: 575,
    convertedBillId: uuid(301),
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-15T14:00:00Z',
  },
];

describe('PurchaseOrderList', () => {
  it('renders the PO table', () => {
    render(<PurchaseOrderList purchaseOrders={SAMPLE_POS} onPurchaseOrderClick={vi.fn()} />);
    expect(screen.getByTestId('po-list-table')).toBeInTheDocument();
  });

  it('renders table header columns', () => {
    render(<PurchaseOrderList purchaseOrders={SAMPLE_POS} onPurchaseOrderClick={vi.fn()} />);
    expect(screen.getByText('Number')).toBeInTheDocument();
    expect(screen.getByText('Supplier')).toBeInTheDocument();
    expect(screen.getByText('Reference')).toBeInTheDocument();
    expect(screen.getByText('Date raised')).toBeInTheDocument();
    expect(screen.getByText('Delivery date')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders all PO rows', () => {
    render(<PurchaseOrderList purchaseOrders={SAMPLE_POS} onPurchaseOrderClick={vi.fn()} />);
    SAMPLE_POS.forEach((po) => {
      expect(screen.getByTestId(`po-row-${po.id}`)).toBeInTheDocument();
    });
  });

  it('displays PO numbers', () => {
    render(<PurchaseOrderList purchaseOrders={SAMPLE_POS} onPurchaseOrderClick={vi.fn()} />);
    expect(screen.getByText('PO-0001')).toBeInTheDocument();
    expect(screen.getByText('PO-0002')).toBeInTheDocument();
    expect(screen.getByText('PO-0003')).toBeInTheDocument();
  });

  it('displays supplier names', () => {
    render(<PurchaseOrderList purchaseOrders={SAMPLE_POS} onPurchaseOrderClick={vi.fn()} />);
    expect(screen.getByText('Office Supplies Ltd')).toBeInTheDocument();
    expect(screen.getByText('Tech Hardware Inc')).toBeInTheDocument();
  });

  it('calls onPurchaseOrderClick when a row is clicked', () => {
    const onClick = vi.fn();
    render(<PurchaseOrderList purchaseOrders={SAMPLE_POS.slice(0, 1)} onPurchaseOrderClick={onClick} />);
    fireEvent.click(screen.getByTestId(`po-row-${SAMPLE_POS[0].id}`));
    expect(onClick).toHaveBeenCalledWith(SAMPLE_POS[0].id);
  });

  it('shows empty state when no POs', () => {
    render(<PurchaseOrderList purchaseOrders={[]} onPurchaseOrderClick={vi.fn()} />);
    expect(screen.getByTestId('po-list-empty')).toBeInTheDocument();
    expect(screen.getByText('No purchase orders yet')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<PurchaseOrderList purchaseOrders={[]} onPurchaseOrderClick={vi.fn()} isLoading />);
    expect(screen.getByTestId('po-list-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading purchase orders...')).toBeInTheDocument();
  });

  it('renders status badges', () => {
    render(<PurchaseOrderList purchaseOrders={SAMPLE_POS} onPurchaseOrderClick={vi.fn()} />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Billed')).toBeInTheDocument();
  });

  it('shows dash for missing delivery date and reference', () => {
    render(<PurchaseOrderList purchaseOrders={[SAMPLE_POS[2]]} onPurchaseOrderClick={vi.fn()} />);
    // SAMPLE_POS[2] has null reference and null deliveryDate — both show as '-'
    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });
});
