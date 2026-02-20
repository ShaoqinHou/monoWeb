// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SmartListBuilder } from '../components/SmartListBuilder';
import { ContactImportDialog } from '../components/ContactImportDialog';
import { ActivitySummaryCard } from '../components/ActivitySummaryCard';
import { DeliveryAddressForm, type DeliveryAddress } from '../components/DeliveryAddressForm';
import { ContactPersonsList, type ContactPerson } from '../components/ContactPersonsList';
import { SmartListsPage } from '../routes/SmartListsPage';
import { parseCsvText } from '../hooks/useContactImportExport';
import type { SmartListFilter } from '../hooks/useSmartLists';

// Mock the smart lists hooks so SmartListsPage doesn't require QueryClientProvider
vi.mock('../hooks/useSmartLists', () => ({
  useSmartLists: () => ({ data: [], isLoading: false }),
  useSaveSmartList: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteSmartList: () => ({ mutate: vi.fn(), isPending: false }),
}));

// Mock crypto.randomUUID for deterministic IDs
let uuidCounter = 0;
vi.stubGlobal('crypto', {
  randomUUID: () => `test-uuid-${++uuidCounter}`,
});

beforeEach(() => {
  uuidCounter = 0;
  localStorage.clear();
});

/* ─── SmartListBuilder ─── */
describe('SmartListBuilder', () => {
  it('renders empty builder with Add Filter button', () => {
    const onChange = vi.fn();
    render(<SmartListBuilder filters={[]} onChange={onChange} />);
    expect(screen.getByTestId('smart-list-builder')).toBeInTheDocument();
    expect(screen.getByTestId('add-filter-btn')).toBeInTheDocument();
  });

  it('adds a filter when Add Filter is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SmartListBuilder filters={[]} onChange={onChange} />);

    await user.click(screen.getByTestId('add-filter-btn'));

    expect(onChange).toHaveBeenCalledWith([
      { field: 'name', operator: 'contains', value: '' },
    ]);
  });

  it('renders existing filters with field, operator, and value', () => {
    const filters: SmartListFilter[] = [
      { field: 'name', operator: 'contains', value: 'Acme' },
      { field: 'outstandingBalance', operator: 'greaterThan', value: '500' },
    ];
    render(<SmartListBuilder filters={filters} onChange={vi.fn()} />);

    expect(screen.getByTestId('filter-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('filter-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('filter-remove-0')).toBeInTheDocument();
    expect(screen.getByTestId('filter-remove-1')).toBeInTheDocument();
  });

  it('removes a filter when Remove is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const filters: SmartListFilter[] = [
      { field: 'name', operator: 'contains', value: 'Acme' },
      { field: 'email', operator: 'equals', value: 'test@x.com' },
    ];
    render(<SmartListBuilder filters={filters} onChange={onChange} />);

    await user.click(screen.getByTestId('filter-remove-0'));

    expect(onChange).toHaveBeenCalledWith([
      { field: 'email', operator: 'equals', value: 'test@x.com' },
    ]);
  });
});

/* ─── ActivitySummaryCard ─── */
describe('ActivitySummaryCard', () => {
  it('renders 12-month summary card with totals', () => {
    render(<ActivitySummaryCard contactId="test-contact-1" />);

    expect(screen.getByTestId('activity-summary-card')).toBeInTheDocument();
    expect(screen.getByText('12-Month Activity Summary')).toBeInTheDocument();
    expect(screen.getByTestId('total-invoiced')).toBeInTheDocument();
    expect(screen.getByTestId('total-paid')).toBeInTheDocument();
    expect(screen.getByTestId('total-outstanding')).toBeInTheDocument();
  });

  it('renders 12 month rows', () => {
    render(<ActivitySummaryCard contactId="test-contact-1" />);
    const monthRows = screen.getAllByTestId('month-row');
    expect(monthRows).toHaveLength(12);
  });
});

/* ─── DeliveryAddressForm ─── */
describe('DeliveryAddressForm', () => {
  it('renders Add Delivery Address button with empty list', () => {
    render(<DeliveryAddressForm addresses={[]} onChange={vi.fn()} />);
    expect(screen.getByTestId('add-address-btn')).toBeInTheDocument();
  });

  it('adds an address and sets first as default', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DeliveryAddressForm addresses={[]} onChange={onChange} />);

    await user.click(screen.getByTestId('add-address-btn'));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({
        isDefault: true,
        country: 'New Zealand',
      }),
    ]);
  });

  it('renders existing addresses', () => {
    const addresses: DeliveryAddress[] = [
      {
        id: 'a1',
        label: 'Head Office',
        addressLine1: '123 Main St',
        addressLine2: '',
        city: 'Auckland',
        region: 'Auckland',
        postalCode: '1010',
        country: 'New Zealand',
        isDefault: true,
      },
    ];
    render(<DeliveryAddressForm addresses={addresses} onChange={vi.fn()} />);

    expect(screen.getByTestId('address-card-0')).toBeInTheDocument();
    expect(screen.getByTestId('default-badge-0')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Head Office')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument();
  });

  it('removes an address when Remove is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const addresses: DeliveryAddress[] = [
      {
        id: 'a1', label: 'Office', addressLine1: '', addressLine2: '',
        city: '', region: '', postalCode: '', country: 'NZ', isDefault: true,
      },
      {
        id: 'a2', label: 'Warehouse', addressLine1: '', addressLine2: '',
        city: '', region: '', postalCode: '', country: 'NZ', isDefault: false,
      },
    ];
    render(<DeliveryAddressForm addresses={addresses} onChange={onChange} />);

    await user.click(screen.getByTestId('remove-address-1'));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'a1', isDefault: true }),
    ]);
  });
});

/* ─── ContactPersonsList ─── */
describe('ContactPersonsList', () => {
  it('shows empty state when no persons', () => {
    render(<ContactPersonsList persons={[]} onChange={vi.fn()} />);
    expect(screen.getByTestId('no-persons')).toBeInTheDocument();
    expect(screen.getByText('No contact persons added yet.')).toBeInTheDocument();
  });

  it('adds a person when Add Person is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ContactPersonsList persons={[]} onChange={onChange} />);

    await user.click(screen.getByTestId('add-person-btn'));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: '',
      }),
    ]);
  });

  it('renders existing persons with all fields', () => {
    const persons: ContactPerson[] = [
      {
        id: 'p1',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        phone: '555-1234',
        role: 'Manager',
      },
    ];
    render(<ContactPersonsList persons={persons} onChange={vi.fn()} />);

    expect(screen.getByTestId('person-card-0')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Jane')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('555-1234')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Manager')).toBeInTheDocument();
  });

  it('removes a person when Remove is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const persons: ContactPerson[] = [
      { id: 'p1', firstName: 'A', lastName: 'B', email: '', phone: '', role: '' },
      { id: 'p2', firstName: 'C', lastName: 'D', email: '', phone: '', role: '' },
    ];
    render(<ContactPersonsList persons={persons} onChange={onChange} />);

    await user.click(screen.getByTestId('remove-person-0'));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'p2' }),
    ]);
  });
});

/* ─── ContactImportDialog ─── */
describe('ContactImportDialog', () => {
  it('renders upload step when opened', () => {
    render(<ContactImportDialog open={true} onClose={vi.fn()} />);
    expect(screen.getByText('Import Contacts')).toBeInTheDocument();
    expect(screen.getByTestId('upload-step')).toBeInTheDocument();
    expect(screen.getByTestId('csv-file-input')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ContactImportDialog open={false} onClose={vi.fn()} />);
    expect(screen.queryByText('Import Contacts')).not.toBeInTheDocument();
  });
});

/* ─── parseCsvText ─── */
describe('parseCsvText', () => {
  it('parses CSV text into contact rows', () => {
    const csv = 'Name,Email,Phone\nAcme Corp,acme@test.com,555-0100\nBay Ltd,bay@test.com,555-0200';
    const rows = parseCsvText(csv);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      name: 'Acme Corp',
      email: 'acme@test.com',
      phone: '555-0100',
      type: undefined,
      taxNumber: undefined,
    });
  });

  it('returns empty array for empty input', () => {
    expect(parseCsvText('')).toEqual([]);
    expect(parseCsvText('Name')).toEqual([]);
  });

  it('skips rows without a name', () => {
    const csv = 'Name,Email\n,bad@test.com\nGood Co,good@test.com';
    const rows = parseCsvText(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Good Co');
  });
});

/* ─── SmartListsPage ─── */
describe('SmartListsPage', () => {
  it('renders page with create form and saved lists section', () => {
    render(<SmartListsPage />);
    expect(screen.getByTestId('smart-lists-page')).toBeInTheDocument();
    expect(screen.getByText('Smart Lists')).toBeInTheDocument();
    expect(screen.getByText('Create Smart List')).toBeInTheDocument();
    expect(screen.getByText('Saved Lists')).toBeInTheDocument();
    expect(screen.getByTestId('no-smart-lists')).toBeInTheDocument();
  });

  it('shows validation error when saving without a name', async () => {
    const user = userEvent.setup();
    render(<SmartListsPage />);

    await user.click(screen.getByTestId('save-smart-list-btn'));
    expect(screen.getByText('List name is required')).toBeInTheDocument();
  });
});
