// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BatchInvoiceDialog } from '../components/BatchInvoiceDialog';
import { BatchCreditNoteDialog } from '../components/BatchCreditNoteDialog';
import { BatchActionsToolbar, type BatchAction } from '../components/BatchActionsToolbar';
import { BatchPrintDialog } from '../components/BatchPrintDialog';
import type { BatchInvoiceContact } from '../hooks/useBatchCreateInvoices';
import type { CreditableInvoice } from '../components/BatchCreditNoteDialog';
import type { PrintableItem } from '../components/BatchPrintDialog';

// Mock api-helpers
vi.mock('../../../lib/api-helpers', () => ({
  apiFetch: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
}));

import { apiPost } from '../../../lib/api-helpers';

const mockedApiPost = vi.mocked(apiPost);

const uuid = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;

const createQueryWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const SAMPLE_CONTACTS: BatchInvoiceContact[] = [
  { id: uuid(1), name: 'Acme Corporation' },
  { id: uuid(2), name: 'Bay Industries Ltd' },
  { id: uuid(3), name: 'Creative Solutions NZ' },
];

const SAMPLE_INVOICES: CreditableInvoice[] = [
  { id: uuid(10), invoiceNumber: 'INV-0010', contactName: 'Acme Corp', total: 1000, amountDue: 800 },
  { id: uuid(11), invoiceNumber: 'INV-0011', contactName: 'Bay Industries', total: 500, amountDue: 500 },
];

const SAMPLE_PRINTABLE: PrintableItem[] = [
  { id: uuid(20), documentNumber: 'INV-0020', contactName: 'Acme Corp', total: 1150 },
  { id: uuid(21), documentNumber: 'INV-0021', contactName: 'Bay Industries', total: 575 },
];

describe('BatchInvoiceDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has 4 steps visible in step indicator', () => {
    const Wrapper = createQueryWrapper();
    render(
      <Wrapper>
        <BatchInvoiceDialog open={true} onClose={vi.fn()} availableContacts={SAMPLE_CONTACTS} />
      </Wrapper>
    );

    // All 4 step badges should be visible
    expect(screen.getByText('1. Contacts')).toBeTruthy();
    expect(screen.getByText('2. Details')).toBeTruthy();
    expect(screen.getByText('3. Preview')).toBeTruthy();
    expect(screen.getByText('4. Creating')).toBeTruthy();
  });

  it('shows contact list with search and checkboxes', () => {
    const Wrapper = createQueryWrapper();
    render(
      <Wrapper>
        <BatchInvoiceDialog open={true} onClose={vi.fn()} availableContacts={SAMPLE_CONTACTS} />
      </Wrapper>
    );

    expect(screen.getByText('Acme Corporation')).toBeTruthy();
    expect(screen.getByText('Bay Industries Ltd')).toBeTruthy();
    expect(screen.getByText('Creative Solutions NZ')).toBeTruthy();
    expect(screen.getByPlaceholderText('Search contacts...')).toBeTruthy();
  });

  it('creates one invoice per selected contact', async () => {
    mockedApiPost.mockResolvedValueOnce({
      createdIds: [uuid(50), uuid(51)],
      failedContacts: [],
    });

    const Wrapper = createQueryWrapper();
    render(
      <Wrapper>
        <BatchInvoiceDialog open={true} onClose={vi.fn()} availableContacts={SAMPLE_CONTACTS} />
      </Wrapper>
    );

    // Select 2 contacts
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]); // Acme
    fireEvent.click(checkboxes[1]); // Bay

    expect(screen.getByText('2 contact(s) selected')).toBeTruthy();

    // Step 2: Details
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Step 2: Invoice Details')).toBeTruthy();

    // Step 3: Preview
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText(/2 invoice\(s\) will be created/)).toBeTruthy();

    // Step 4: Create All
    fireEvent.click(screen.getByText('Create All'));

    await waitFor(() => {
      expect(screen.getByTestId('batch-result')).toBeTruthy();
      expect(screen.getByText('2 invoice(s) created')).toBeTruthy();
    });

    expect(mockedApiPost).toHaveBeenCalledWith('/invoices/batch-create', expect.objectContaining({
      contacts: expect.arrayContaining([
        expect.objectContaining({ name: 'Acme Corporation' }),
        expect.objectContaining({ name: 'Bay Industries Ltd' }),
      ]),
    }));
  });
});

describe('BatchCreditNoteDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows invoices with outstanding balance and credit options', () => {
    const Wrapper = createQueryWrapper();
    render(
      <Wrapper>
        <BatchCreditNoteDialog open={true} onClose={vi.fn()} invoices={SAMPLE_INVOICES} />
      </Wrapper>
    );

    expect(screen.getByText('INV-0010')).toBeTruthy();
    expect(screen.getByText('INV-0011')).toBeTruthy();
    expect(screen.getByText('Outstanding: $800.00')).toBeTruthy();
    expect(screen.getByText('Outstanding: $500.00')).toBeTruthy();
  });

  it('calculates total credit amount with full and partial', async () => {
    mockedApiPost.mockResolvedValueOnce({
      createdIds: [uuid(60), uuid(61)],
      failed: [],
    });

    const Wrapper = createQueryWrapper();
    render(
      <Wrapper>
        <BatchCreditNoteDialog open={true} onClose={vi.fn()} invoices={SAMPLE_INVOICES} />
      </Wrapper>
    );

    // Click Preview to see totals
    fireEvent.click(screen.getByText('Preview'));

    // Both default to full credit: 800 + 500 = 1300
    expect(screen.getByText('Total credit: $1300.00')).toBeTruthy();
  });
});

describe('BatchActionsToolbar', () => {
  const actions: BatchAction[] = [
    { id: 'delete', label: 'Delete Selected', variant: 'destructive', requiresConfirmation: true },
    { id: 'archive', label: 'Archive Selected', variant: 'secondary' },
  ];

  it('does not render when no items selected', () => {
    render(
      <BatchActionsToolbar selectedCount={0} actions={actions} onAction={vi.fn()} />
    );
    expect(screen.queryByTestId('batch-actions-toolbar')).toBeNull();
  });

  it('renders when items are selected with action buttons', () => {
    render(
      <BatchActionsToolbar selectedCount={5} actions={actions} onAction={vi.fn()} />
    );
    expect(screen.getByTestId('batch-actions-toolbar')).toBeTruthy();
    expect(screen.getByText('5 items selected')).toBeTruthy();
    expect(screen.getByText('Delete Selected')).toBeTruthy();
    expect(screen.getByText('Archive Selected')).toBeTruthy();
  });

  it('shows confirmation dialog for destructive actions', async () => {
    const onAction = vi.fn();
    render(
      <BatchActionsToolbar selectedCount={3} actions={actions} onAction={onAction} />
    );

    // Click delete — should show confirmation
    fireEvent.click(screen.getByTestId('batch-action-delete'));
    expect(screen.getByText('Confirm Action')).toBeTruthy();
    expect(screen.getByText(/Are you sure you want to delete selected 3 items/)).toBeTruthy();

    // Confirm
    fireEvent.click(screen.getByTestId('confirm-batch-action'));
    expect(onAction).toHaveBeenCalledWith('delete');
  });

  it('calls onAction directly for non-confirmation actions', () => {
    const onAction = vi.fn();
    render(
      <BatchActionsToolbar selectedCount={2} actions={actions} onAction={onAction} />
    );

    fireEvent.click(screen.getByTestId('batch-action-archive'));
    expect(onAction).toHaveBeenCalledWith('archive');
  });
});

describe('BatchPrintDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows selected documents with estimated pages', () => {
    const Wrapper = createQueryWrapper();
    render(
      <Wrapper>
        <BatchPrintDialog
          open={true}
          onClose={vi.fn()}
          items={SAMPLE_PRINTABLE}
          entityType="invoices"
        />
      </Wrapper>
    );

    expect(screen.getByText('INV-0020')).toBeTruthy();
    expect(screen.getByText('INV-0021')).toBeTruthy();
    expect(screen.getByText('2 documents selected for printing')).toBeTruthy();
    expect(screen.getByText('Estimated pages: 2')).toBeTruthy();
  });

  it('triggers print on Print All click', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    mockedApiPost.mockResolvedValueOnce({
      documents: SAMPLE_PRINTABLE,
      estimatedPages: 2,
    });

    const Wrapper = createQueryWrapper();
    render(
      <Wrapper>
        <BatchPrintDialog
          open={true}
          onClose={vi.fn()}
          items={SAMPLE_PRINTABLE}
          entityType="invoices"
        />
      </Wrapper>
    );

    fireEvent.click(screen.getByTestId('batch-print-button'));

    await waitFor(() => {
      expect(printSpy).toHaveBeenCalled();
    });

    printSpy.mockRestore();
  });
});
