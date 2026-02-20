// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  PurchaseOrderCreatePage,
  PurchaseOrderDetailPage,
} from '../routes/PurchaseOrderSubPages';
import type { PurchaseOrder } from '../hooks/usePurchaseOrders';

const DRAFT_PO: PurchaseOrder = {
  id: 'po-1',
  poNumber: 'PO-0001',
  reference: 'REF-001',
  contactId: 'c001',
  contactName: 'Acme Supplies',
  status: 'draft',
  deliveryDate: '2024-07-15',
  deliveryAddress: '123 Main St, Wellington',
  currency: 'NZD',
  date: '2024-06-01',
  subTotal: 500.00,
  totalTax: 75.00,
  total: 575.00,
  convertedBillId: null,
  createdAt: '2024-06-01T09:00:00.000Z',
  updatedAt: '2024-06-01T09:00:00.000Z',
  lineItems: [
    {
      id: 'li-001',
      description: 'Widget A',
      quantity: 10,
      unitPrice: 50.00,
      taxRate: 15,
      taxAmount: 75.00,
      lineAmount: 500.00,
      discount: 0,
    },
  ],
};

const APPROVED_PO: PurchaseOrder = {
  ...DRAFT_PO,
  id: 'po-2',
  poNumber: 'PO-0002',
  status: 'approved',
};

const BILLED_PO: PurchaseOrder = {
  ...DRAFT_PO,
  id: 'po-3',
  poNumber: 'PO-0003',
  status: 'billed',
  convertedBillId: 'b-999',
};

// --- Mocks ---

let mockOrderId = 'po-1';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: Record<string, unknown>) => {
    const { className, ...otherProps } = rest as { className?: string; [k: string]: unknown };
    return <a href={String(to)} className={className} {...otherProps}>{children as React.ReactNode}</a>;
  },
  useParams: () => ({ orderId: mockOrderId }),
  useNavigate: () => vi.fn(),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockFetchPO(po: PurchaseOrder | null) {
  if (po) {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, data: po }),
    });
  } else {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 404,
      json: async () => ({ ok: false, error: 'Not found' }),
    });
  }
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

// ═══════════════════════════════════════
// PurchaseOrderDetailPage
// ═══════════════════════════════════════

describe('PurchaseOrderDetailPage', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockOrderId = 'po-1';
  });

  it('renders loading state initially', () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<PurchaseOrderDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('po-detail-loading')).toHaveTextContent('Loading purchase order...');
  });

  it('renders not found for missing PO', async () => {
    mockFetchPO(null);
    render(<PurchaseOrderDetailPage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('po-not-found')).toHaveTextContent('Purchase order not found');
  });

  it('renders PO number as page title', async () => {
    mockFetchPO(DRAFT_PO);
    render(<PurchaseOrderDetailPage />, { wrapper: createWrapper() });
    expect(await screen.findByRole('heading', { level: 1, name: 'PO-0001' })).toBeInTheDocument();
  });

  it('renders breadcrumbs with Purchase Orders link', async () => {
    mockFetchPO(DRAFT_PO);
    render(<PurchaseOrderDetailPage />, { wrapper: createWrapper() });
    expect(await screen.findByText('Purchase Orders')).toBeInTheDocument();
  });

  it('renders PO detail component', async () => {
    mockFetchPO(DRAFT_PO);
    render(<PurchaseOrderDetailPage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('po-detail')).toBeInTheDocument();
  });

  it('renders supplier name', async () => {
    mockFetchPO(DRAFT_PO);
    render(<PurchaseOrderDetailPage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('po-contact')).toHaveTextContent('Acme Supplies');
  });

  it('renders PO number', async () => {
    mockFetchPO(DRAFT_PO);
    render(<PurchaseOrderDetailPage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('po-number')).toHaveTextContent('PO-0001');
  });

  it('renders date', async () => {
    mockFetchPO(DRAFT_PO);
    render(<PurchaseOrderDetailPage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('po-date')).toHaveTextContent('2024-06-01');
  });

  it('renders delivery date', async () => {
    mockFetchPO(DRAFT_PO);
    render(<PurchaseOrderDetailPage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('po-delivery-date')).toHaveTextContent('2024-07-15');
  });

  it('renders reference', async () => {
    mockFetchPO(DRAFT_PO);
    render(<PurchaseOrderDetailPage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('po-reference')).toHaveTextContent('REF-001');
  });

  it('renders delivery address', async () => {
    mockFetchPO(DRAFT_PO);
    render(<PurchaseOrderDetailPage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('po-delivery-address')).toHaveTextContent('123 Main St, Wellington');
  });

  it('renders status badge for draft PO', async () => {
    mockFetchPO(DRAFT_PO);
    render(<PurchaseOrderDetailPage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('po-status-badge')).toHaveTextContent('Draft');
  });

  it('renders approve button for draft PO', async () => {
    mockFetchPO(DRAFT_PO);
    render(<PurchaseOrderDetailPage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('po-approve-btn')).toHaveTextContent('Approve');
  });

  it('renders send button for draft PO', async () => {
    mockFetchPO(DRAFT_PO);
    render(<PurchaseOrderDetailPage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('po-send-btn')).toHaveTextContent('Send');
  });

  it('renders edit button for draft PO', async () => {
    mockFetchPO(DRAFT_PO);
    render(<PurchaseOrderDetailPage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('po-edit-btn')).toHaveTextContent('Edit');
  });

  it('renders convert-to-bill button for approved PO', async () => {
    mockOrderId = 'po-2';
    mockFetchPO(APPROVED_PO);
    render(<PurchaseOrderDetailPage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('po-convert-btn')).toHaveTextContent('Convert to Bill');
  });

  it('does not render approve/send buttons for approved PO', async () => {
    mockOrderId = 'po-2';
    mockFetchPO(APPROVED_PO);
    render(<PurchaseOrderDetailPage />, { wrapper: createWrapper() });
    await screen.findByTestId('po-detail');
    expect(screen.queryByTestId('po-send-btn')).not.toBeInTheDocument();
  });

  it('shows converted bill info for billed PO', async () => {
    mockOrderId = 'po-3';
    mockFetchPO(BILLED_PO);
    render(<PurchaseOrderDetailPage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('po-converted-bill')).toHaveTextContent('b-999');
  });

  it('renders line items', async () => {
    mockFetchPO(DRAFT_PO);
    render(<PurchaseOrderDetailPage />, { wrapper: createWrapper() });
    expect(await screen.findByText('Widget A')).toBeInTheDocument();
  });

  it('renders totals', async () => {
    mockFetchPO(DRAFT_PO);
    render(<PurchaseOrderDetailPage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('po-subtotal')).toHaveTextContent('NZD 500.00');
    expect(screen.getByTestId('po-tax')).toHaveTextContent('NZD 75.00');
    expect(screen.getByTestId('po-total')).toHaveTextContent('NZD 575.00');
  });

  it('clicking Edit button switches to inline edit mode with form', async () => {
    mockFetchPO(DRAFT_PO);
    render(<PurchaseOrderDetailPage />, { wrapper: createWrapper() });

    // Wait for detail to load
    const editBtn = await screen.findByTestId('po-edit-btn');
    fireEvent.click(editBtn);

    // Should now show the PO form in edit mode
    expect(await screen.findByTestId('po-form')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Edit Purchase Order' })).toBeInTheDocument();
  });

  it('inline edit shows Cancel button that returns to detail view', async () => {
    mockFetchPO(DRAFT_PO);
    render(<PurchaseOrderDetailPage />, { wrapper: createWrapper() });

    const editBtn = await screen.findByTestId('po-edit-btn');
    fireEvent.click(editBtn);

    // Should show Cancel button
    const cancelBtn = await screen.findByTestId('po-cancel-edit-btn');
    expect(cancelBtn).toHaveTextContent('Cancel');

    // Click cancel to go back to detail view
    fireEvent.click(cancelBtn);

    // Should show detail again
    expect(await screen.findByTestId('po-detail')).toBeInTheDocument();
  });

  it('inline edit pre-fills supplier name', async () => {
    mockFetchPO(DRAFT_PO);
    render(<PurchaseOrderDetailPage />, { wrapper: createWrapper() });

    const editBtn = await screen.findByTestId('po-edit-btn');
    fireEvent.click(editBtn);

    const input = await screen.findByTestId('po-supplier-input');
    expect(input).toHaveValue('Acme Supplies');
  });

  it('inline edit pre-fills order date', async () => {
    mockFetchPO(DRAFT_PO);
    render(<PurchaseOrderDetailPage />, { wrapper: createWrapper() });

    const editBtn = await screen.findByTestId('po-edit-btn');
    fireEvent.click(editBtn);

    const input = await screen.findByTestId('po-date-input');
    expect(input).toHaveValue('2024-06-01');
  });
});

// ═══════════════════════════════════════
// PurchaseOrderCreatePage
// ═══════════════════════════════════════

describe('PurchaseOrderCreatePage', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('renders "New Purchase Order" as page title', () => {
    render(<PurchaseOrderCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByRole('heading', { level: 1, name: 'New Purchase Order' })).toBeInTheDocument();
  });

  it('renders breadcrumbs', () => {
    render(<PurchaseOrderCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByText('Purchase Orders')).toBeInTheDocument();
  });

  it('renders the PO form', () => {
    render(<PurchaseOrderCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('po-form')).toBeInTheDocument();
  });

  it('renders supplier input (empty)', () => {
    render(<PurchaseOrderCreatePage />, { wrapper: createWrapper() });
    const input = screen.getByTestId('po-supplier-input');
    expect(input).toHaveValue('');
  });

  it('renders reference input (empty)', () => {
    render(<PurchaseOrderCreatePage />, { wrapper: createWrapper() });
    const input = screen.getByTestId('po-reference-input');
    expect(input).toHaveValue('');
  });

  it('renders Save as Draft button', () => {
    render(<PurchaseOrderCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('po-save-draft-btn')).toHaveTextContent('Save as Draft');
  });

  it('renders Submit button', () => {
    render(<PurchaseOrderCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('po-submit-btn')).toHaveTextContent('Submit');
  });

  it('renders line items editor', () => {
    render(<PurchaseOrderCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('bill-line-items')).toBeInTheDocument();
  });

  it('renders delivery address input', () => {
    render(<PurchaseOrderCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('po-delivery-address-input')).toBeInTheDocument();
  });

  it('renders date inputs', () => {
    render(<PurchaseOrderCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('po-date-input')).toBeInTheDocument();
    expect(screen.getByTestId('po-delivery-date-input')).toBeInTheDocument();
  });
});
