// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactForm } from '../components/ContactForm';
import { ContactDetail } from '../components/ContactDetail';
import { ContactImportDialog } from '../components/ContactImportDialog';
import { SmartListBuilder } from '../components/SmartListBuilder';
import { parseCsvText } from '../hooks/useContactImportExport';
import { applySmartListFilters } from '../hooks/useSmartListQuery';
import type { SmartListFilter } from '../hooks/useSmartLists';
import type { Contact } from '../../../../../shared/schemas/contact';

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: () => 'test-uuid-1',
});

// Mock hooks used by ContactDetail
vi.mock('../hooks/useContacts', () => ({
  useContacts: () => ({ data: [], isLoading: false }),
  useContact: () => ({ data: null, isLoading: false }),
  useContactActivity: () => ({ data: [], isLoading: false, isError: false }),
  useContactFinancialSummary: () => ({
    data: { totalInvoiced: 0, totalBilled: 0, outstanding: 0, overdue: 0, overdueCount: 0 },
    isLoading: false,
  }),
}));

vi.mock('../hooks/useContactNotes', () => ({
  useContactNotes: () => ({ data: [], isLoading: false }),
  useCreateNote: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteNote: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../hooks/useContactTimeline', () => ({
  useContactTimeline: () => ({ data: [], isLoading: false }),
}));

vi.mock('../hooks/useContactStatement', () => ({
  useContactStatement: () => ({ data: [], isLoading: false }),
}));

vi.mock('../../../../../shared/calc/currency', () => ({
  formatCurrency: (n: number) => `$${n.toFixed(2)}`,
}));

beforeEach(() => {
  localStorage.clear();
});

function makeContact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: 'c-1',
    name: 'Test Contact',
    type: 'customer',
    email: 'test@example.com',
    phone: '555-0100',
    taxNumber: 'NZ-12-345',
    bankAccountName: 'Business Cheque',
    bankAccountNumber: '12-3456-7890123-00',
    bankBSB: '012-345',
    defaultAccountCode: '200',
    defaultTaxRate: '15% GST on Income',
    outstandingBalance: 1500,
    overdueBalance: 300,
    isArchived: false,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-06-01T00:00:00.000Z',
    ...overrides,
  };
}

/* ─── Feature 1: Smart List Filters ─── */
describe('Smart List Filters - useSmartListQuery', () => {
  const contacts: Contact[] = [
    makeContact({ id: 'c-1', name: 'Acme Corp', type: 'customer', outstandingBalance: 500, overdueBalance: 100 }),
    makeContact({ id: 'c-2', name: 'Bay Ltd', type: 'supplier', outstandingBalance: 200, overdueBalance: 0 }),
    makeContact({ id: 'c-3', name: 'Acme Holdings', type: 'customer_and_supplier', outstandingBalance: 0, overdueBalance: 0, isArchived: true }),
  ];

  it('filters by name (contains)', () => {
    const filters: SmartListFilter[] = [
      { field: 'name', operator: 'contains', value: 'Acme' },
    ];
    const result = applySmartListFilters(contacts, filters);
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.id)).toEqual(['c-1', 'c-3']);
  });

  it('filters by contact type (equals)', () => {
    const filters: SmartListFilter[] = [
      { field: 'contactType', operator: 'equals', value: 'supplier' },
    ];
    const result = applySmartListFilters(contacts, filters);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Bay Ltd');
  });

  it('filters by outstanding balance (greaterThan)', () => {
    const filters: SmartListFilter[] = [
      { field: 'outstandingBalance', operator: 'greaterThan', value: '100' },
    ];
    const result = applySmartListFilters(contacts, filters);
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.id)).toEqual(['c-1', 'c-2']);
  });

  it('applies multiple filters with AND logic', () => {
    const filters: SmartListFilter[] = [
      { field: 'name', operator: 'contains', value: 'Acme' },
      { field: 'outstandingBalance', operator: 'greaterThan', value: '100' },
    ];
    const result = applySmartListFilters(contacts, filters);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Acme Corp');
  });

  it('returns all contacts when no filters', () => {
    const result = applySmartListFilters(contacts, []);
    expect(result).toHaveLength(3);
  });

  it('filters by isArchived', () => {
    const filters: SmartListFilter[] = [
      { field: 'isArchived', operator: 'equals', value: 'true' },
    ];
    const result = applySmartListFilters(contacts, filters);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Acme Holdings');
  });
});

/* ─── Feature 2: CSV Import ─── */
describe('CSV Import Pipeline', () => {
  it('parseCsvText handles quoted values and maps columns', () => {
    const csv = '"Name","Email","Phone","Type"\n"Acme Corp","acme@test.com","555-0100","customer"\n"Bay Ltd","bay@test.com","555-0200","supplier"';
    const rows = parseCsvText(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      name: 'Acme Corp',
      email: 'acme@test.com',
      phone: '555-0100',
      type: 'customer',
      taxNumber: undefined,
    });
    expect(rows[1].name).toBe('Bay Ltd');
    expect(rows[1].type).toBe('supplier');
  });

  it('ContactImportDialog shows upload step and file input', () => {
    render(<ContactImportDialog open={true} onClose={vi.fn()} />);
    expect(screen.getByTestId('upload-step')).toBeInTheDocument();
    expect(screen.getByTestId('csv-file-input')).toBeInTheDocument();
  });

  it('ContactImportDialog calls onImport with parsed rows', async () => {
    const onImport = vi.fn();
    const onClose = vi.fn();
    render(<ContactImportDialog open={true} onClose={onClose} onImport={onImport} />);

    // Simulate file upload
    const csvContent = 'Name,Email,Phone\nAlice,alice@test.com,111\nBob,bob@test.com,222';
    const file = new File([csvContent], 'contacts.csv', { type: 'text/csv' });

    const input = screen.getByTestId('csv-file-input') as HTMLInputElement;
    await userEvent.upload(input, file);

    // Should advance to mapping step
    await waitFor(() => {
      expect(screen.getByTestId('mapping-step')).toBeInTheDocument();
    });

    // Confirm mapping
    await userEvent.click(screen.getByTestId('mapping-confirm-btn'));

    // Should show preview with 2 rows
    await waitFor(() => {
      expect(screen.getByTestId('preview-step')).toBeInTheDocument();
      expect(screen.getByTestId('preview-row-0')).toBeInTheDocument();
      expect(screen.getByTestId('preview-row-1')).toBeInTheDocument();
    });

    // Confirm import
    await userEvent.click(screen.getByTestId('import-confirm-btn'));

    expect(onImport).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Alice' }),
        expect.objectContaining({ name: 'Bob' }),
      ]),
    );
  });
});

/* ─── Feature 3: Contact Default Tax/Account Codes ─── */
describe('Contact Default Tax Rate and Account Code', () => {
  it('ContactForm renders defaultTaxRate and defaultAccountCode fields', () => {
    render(
      <ContactForm
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByTestId('contact-account-code-input')).toBeInTheDocument();
    expect(screen.getByTestId('contact-tax-rate-input')).toBeInTheDocument();
  });

  it('ContactForm submits defaultTaxRate and defaultAccountCode values', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <ContactForm
        open={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByTestId('contact-name-input'), 'Tax Test');
    await user.type(screen.getByTestId('contact-account-code-input'), '400');
    await user.type(screen.getByTestId('contact-tax-rate-input'), '15% GST');
    await user.click(screen.getByTestId('contact-form-save'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Tax Test',
          defaultAccountCode: '400',
          defaultTaxRate: '15% GST',
        }),
      );
    });
  });

  it('ContactForm pre-fills defaultTaxRate and defaultAccountCode from initialData', () => {
    render(
      <ContactForm
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        initialData={{
          name: 'Existing',
          defaultAccountCode: '200',
          defaultTaxRate: '15% GST on Income',
        }}
      />,
    );

    const accountInput = screen.getByTestId('contact-account-code-input') as HTMLInputElement;
    expect(accountInput.value).toBe('200');

    const taxRateInput = screen.getByTestId('contact-tax-rate-input') as HTMLInputElement;
    expect(taxRateInput.value).toBe('15% GST on Income');
  });
});

/* ─── Feature 4: Contact Bank Account Details ─── */
describe('Contact Bank Account Details', () => {
  it('ContactForm renders bankBSB field', () => {
    render(
      <ContactForm
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByTestId('contact-bank-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('contact-bank-number-input')).toBeInTheDocument();
    expect(screen.getByTestId('contact-bank-bsb-input')).toBeInTheDocument();
  });

  it('ContactForm submits bank details including BSB', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <ContactForm
        open={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByTestId('contact-name-input'), 'Bank Test');
    await user.type(screen.getByTestId('contact-bank-name-input'), 'Business Cheque');
    await user.type(screen.getByTestId('contact-bank-number-input'), '12-3456-789');
    await user.type(screen.getByTestId('contact-bank-bsb-input'), '012-345');
    await user.click(screen.getByTestId('contact-form-save'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          bankAccountName: 'Business Cheque',
          bankAccountNumber: '12-3456-789',
          bankBSB: '012-345',
        }),
      );
    });
  });

  it('ContactDetail shows Bank Details card when bank data exists', () => {
    const contact = makeContact();
    render(<ContactDetail contact={contact} onEdit={vi.fn()} />);

    expect(screen.getByTestId('bank-details-card')).toBeInTheDocument();
    expect(screen.getByTestId('bank-detail-name')).toHaveTextContent('Business Cheque');
    expect(screen.getByTestId('bank-detail-number')).toHaveTextContent('12-3456-7890123-00');
    expect(screen.getByTestId('bank-detail-bsb')).toHaveTextContent('012-345');
  });

  it('ContactDetail hides Bank Details card when no bank data', () => {
    const contact = makeContact({
      bankAccountName: undefined,
      bankAccountNumber: undefined,
      bankBSB: undefined,
    });
    render(<ContactDetail contact={contact} onEdit={vi.fn()} />);

    expect(screen.queryByTestId('bank-details-card')).not.toBeInTheDocument();
  });
});
