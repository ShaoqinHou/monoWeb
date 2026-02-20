// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactList } from '../components/ContactList';
import { ContactForm } from '../components/ContactForm';
import { ContactDetail } from '../components/ContactDetail';
import type { Contact, ContactFilter } from '../types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ─── Shared mock contacts ───────────────────────────────────────────────
const MOCK_CONTACTS: Contact[] = [
  {
    id: 'c1',
    name: 'Acme Corporation',
    type: 'customer',
    email: 'info@acme.com',
    phone: '555-0100',
    taxNumber: 'NZ-12-345-678',
    bankAccountName: 'Acme Corp Business',
    bankAccountNumber: '12-3456-7890123-00',
    defaultAccountCode: '200',
    outstandingBalance: 500,
    overdueBalance: 0,
    isArchived: false,
    createdAt: '2025-01-15T10:00:00.000Z',
    updatedAt: '2025-06-01T14:30:00.000Z',
  },
  {
    id: 'c2',
    name: 'Bay Supplies Ltd',
    type: 'supplier',
    email: 'orders@baysupply.co.nz',
    phone: '555-0200',
    outstandingBalance: 300,
    overdueBalance: 100,
    isArchived: false,
    createdAt: '2025-02-20T08:00:00.000Z',
    updatedAt: '2025-05-15T11:00:00.000Z',
  },
  {
    id: 'c3',
    name: 'City Services Group',
    type: 'customer_and_supplier',
    email: 'accounts@cityservices.com',
    phone: '555-0300',
    outstandingBalance: 750,
    overdueBalance: 250,
    isArchived: false,
    createdAt: '2025-03-10T09:30:00.000Z',
    updatedAt: '2025-07-01T16:45:00.000Z',
  },
];

const defaultListProps = {
  contacts: MOCK_CONTACTS,
  isLoading: false,
  onContactClick: vi.fn(),
  onSearch: vi.fn(),
  onFilterChange: vi.fn(),
  activeFilter: 'all' as ContactFilter,
  searchTerm: '',
};

// ─── Mock hooks for ContactDetail ───
vi.mock('../hooks/useContacts', () => ({
  useContacts: vi.fn(() => ({ data: [], isLoading: false })),
  useContact: vi.fn(() => ({ data: null, isLoading: false })),
  useCreateContact: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useUpdateContact: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useDeleteContact: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useArchiveContact: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useUnarchiveContact: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useContactActivity: vi.fn(() => ({ data: [], isLoading: false })),
  useContactFinancialSummary: vi.fn(() => ({ data: null, isLoading: false })),
}));

vi.mock('../../accounting/hooks/useAccounts', () => ({
  useAccounts: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock('../../accounting/hooks/useTaxRates', () => ({
  useTaxRates: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock('../hooks/useContactNotes', () => ({
  useContactNotes: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateNote: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useDeleteNote: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

vi.mock('../hooks/useContactTimeline', () => ({
  useContactTimeline: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock('../hooks/useContactStatement', () => ({
  useContactStatement: vi.fn(() => ({ data: [], isLoading: false })),
}));

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ContactList — Xero-style columns & features
// ═══════════════════════════════════════════════════════════════════════
describe('ContactList — Xero columns & features', () => {
  it('renders Xero column headers (Contact, You owe, They owe)', () => {
    render(<ContactList {...defaultListProps} />);
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('You owe')).toBeInTheDocument();
    expect(screen.getByText('They owe')).toBeInTheDocument();
  });

  it('renders initials circles for each contact', () => {
    render(<ContactList {...defaultListProps} />);
    expect(screen.getByTestId('contact-initials-c1')).toBeInTheDocument();
    expect(screen.getByTestId('contact-initials-c1').textContent).toBe('AC');
    expect(screen.getByTestId('contact-initials-c2').textContent).toBe('BL');
  });

  it('renders checkbox per row and select-all', () => {
    render(<ContactList {...defaultListProps} />);
    expect(screen.getByTestId('select-all-checkbox')).toBeInTheDocument();
    expect(screen.getByTestId('contact-checkbox-c1')).toBeInTheDocument();
    expect(screen.getByTestId('contact-checkbox-c2')).toBeInTheDocument();
  });

  it('selecting contacts updates selection status', async () => {
    const user = userEvent.setup();
    render(<ContactList {...defaultListProps} />);

    await user.click(screen.getByTestId('contact-checkbox-c1'));

    await waitFor(() => {
      expect(screen.getByTestId('selection-status')).toHaveTextContent('1 contact selected');
    });
  });

  it('renders bulk action buttons (Add to Group, Merge, Archive)', () => {
    render(<ContactList {...defaultListProps} />);
    expect(screen.getByTestId('bulk-add-to-group')).toBeInTheDocument();
    expect(screen.getByTestId('bulk-merge')).toBeInTheDocument();
    expect(screen.getByTestId('bulk-archive')).toBeInTheDocument();
  });

  it('sort button cycles through sort directions', async () => {
    const user = userEvent.setup();
    render(<ContactList {...defaultListProps} />);

    const sortBtn = screen.getByTestId('sort-name-btn');
    expect(sortBtn).toBeInTheDocument();

    // Initial state is already name/asc, clicking toggles to desc
    // Before click: Acme (c1) is first in asc order
    const rowsBefore = screen.getAllByTestId(/^contact-row-/);
    expect(rowsBefore[0].getAttribute('data-testid')).toBe('contact-row-c1'); // Acme first in asc

    // Click once = toggles to desc (City Services first)
    await user.click(sortBtn);
    const rowsAfter = screen.getAllByTestId(/^contact-row-/);
    expect(rowsAfter[0].getAttribute('data-testid')).toBe('contact-row-c3'); // City Services first in desc
  });

  it('renders pagination when contacts are present', () => {
    render(<ContactList {...defaultListProps} />);
    // Default page size is 25, with 3 contacts all should be on page 1
    expect(screen.getByText('1-3 of 3')).toBeInTheDocument();
  });

  it('renders row actions menu on click', async () => {
    const user = userEvent.setup();
    render(<ContactList {...defaultListProps} />);

    const actionsBtn = screen.getByTestId('contact-actions-c1');
    await user.click(actionsBtn);

    await waitFor(() => {
      expect(screen.getByTestId('contact-actions-menu-c1')).toBeInTheDocument();
    });
    expect(screen.getByText('View details')).toBeInTheDocument();
    expect(screen.getByText('Create invoice')).toBeInTheDocument();
  });

  it('does not render alphabet filter (removed to match Xero)', () => {
    render(<ContactList {...defaultListProps} />);
    expect(screen.queryByTestId('alphabet-filter')).not.toBeInTheDocument();
  });

  it('shows "0 contacts selected" when no contacts selected', () => {
    render(<ContactList {...defaultListProps} />);
    expect(screen.getByTestId('selection-status')).toHaveTextContent('0 contacts selected');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// ContactForm — Side navigation & sections
// ═══════════════════════════════════════════════════════════════════════
describe('ContactForm — Xero side navigation & sections', () => {
  const formProps = {
    open: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    isSubmitting: false,
    title: 'New Contact',
  };

  it('renders side navigation with all 5 sections', () => {
    render(<ContactForm {...formProps} />, { wrapper: createWrapper() });
    expect(screen.getByTestId('form-side-nav')).toBeInTheDocument();
    expect(screen.getByTestId('nav-contact-details')).toBeInTheDocument();
    expect(screen.getByTestId('nav-addresses')).toBeInTheDocument();
    expect(screen.getByTestId('nav-financial')).toBeInTheDocument();
    expect(screen.getByTestId('nav-sales-defaults')).toBeInTheDocument();
    expect(screen.getByTestId('nav-purchase-defaults')).toBeInTheDocument();
  });

  it('shows contact details section by default with primary person fields', () => {
    render(<ContactForm {...formProps} />, { wrapper: createWrapper() });
    expect(screen.getByTestId('section-contact-details')).toBeInTheDocument();
    expect(screen.getByTestId('primary-first-name')).toBeInTheDocument();
    expect(screen.getByTestId('primary-last-name')).toBeInTheDocument();
    expect(screen.getByTestId('primary-email')).toBeInTheDocument();
  });

  it('shows phone country/area/number split fields', () => {
    render(<ContactForm {...formProps} />, { wrapper: createWrapper() });
    expect(screen.getByTestId('phone-country')).toBeInTheDocument();
    expect(screen.getByTestId('phone-area')).toBeInTheDocument();
    expect(screen.getByTestId('phone-number')).toBeInTheDocument();
  });

  it('shows notes textarea with character counter', () => {
    render(<ContactForm {...formProps} />, { wrapper: createWrapper() });
    expect(screen.getByTestId('contact-notes')).toBeInTheDocument();
    expect(screen.getByTestId('notes-char-count')).toBeInTheDocument();
    expect(screen.getByTestId('notes-char-count').textContent).toBe('0 / 4000');
  });

  it('navigates to Addresses section and shows billing/delivery', async () => {
    const user = userEvent.setup();
    render(<ContactForm {...formProps} />, { wrapper: createWrapper() });

    await user.click(screen.getByTestId('nav-addresses'));
    expect(screen.getByTestId('section-addresses')).toBeInTheDocument();
    expect(screen.getByText('Billing address')).toBeInTheDocument();
    expect(screen.getByTestId('enter-address-manually')).toBeInTheDocument();
  });

  it('navigates to Financial section and shows bank + GST + currency', async () => {
    const user = userEvent.setup();
    render(<ContactForm {...formProps} />, { wrapper: createWrapper() });

    await user.click(screen.getByTestId('nav-financial'));
    expect(screen.getByTestId('section-financial')).toBeInTheDocument();
    expect(screen.getByTestId('financial-particulars')).toBeInTheDocument();
    expect(screen.getByTestId('financial-code')).toBeInTheDocument();
    expect(screen.getByTestId('gst-number')).toBeInTheDocument();
    expect(screen.getByTestId('currency-select')).toBeInTheDocument();
  });

  it('navigates to Sales defaults with all Xero fields', async () => {
    const user = userEvent.setup();
    render(<ContactForm {...formProps} />, { wrapper: createWrapper() });

    await user.click(screen.getByTestId('nav-sales-defaults'));
    expect(screen.getByTestId('section-sales-defaults')).toBeInTheDocument();
    expect(screen.getByTestId('invoice-due-date')).toBeInTheDocument();
    expect(screen.getByTestId('credit-limit')).toBeInTheDocument();
    expect(screen.getByTestId('block-new-invoices')).toBeInTheDocument();
    expect(screen.getByTestId('xero-network-key')).toBeInTheDocument();
    // Sales Account is a Combobox — verify via label text
    expect(screen.getByText('Sales Account')).toBeInTheDocument();
  });

  it('navigates to Purchase defaults with all fields', async () => {
    const user = userEvent.setup();
    render(<ContactForm {...formProps} />, { wrapper: createWrapper() });

    await user.click(screen.getByTestId('nav-purchase-defaults'));
    expect(screen.getByTestId('section-purchase-defaults')).toBeInTheDocument();
    expect(screen.getByTestId('bill-due-date')).toBeInTheDocument();
    expect(screen.getByTestId('purchase-amounts-are')).toBeInTheDocument();
    // Purchase Account, Purchase GST, and Region are Comboboxes — verify via label text
    expect(screen.getByText('Purchase Account')).toBeInTheDocument();
    expect(screen.getByText('Purchase GST')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// ContactDetail — Toolbar, Cash Flow, History & Notes
// ═══════════════════════════════════════════════════════════════════════
describe('ContactDetail — Xero toolbar & features', () => {
  const acmeContact = MOCK_CONTACTS[0];
  const detailProps = {
    contact: acmeContact,
    onEdit: vi.fn(),
  };

  it('renders toolbar with Edit, New, Actions buttons', () => {
    render(<ContactDetail {...detailProps} />, { wrapper: createWrapper() });
    expect(screen.getByTestId('contact-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('edit-contact-btn')).toBeInTheDocument();
    expect(screen.getByTestId('new-transaction-btn')).toBeInTheDocument();
    expect(screen.getByTestId('contact-actions-dropdown')).toBeInTheDocument();
  });

  it('renders cash flow chart card with graph/table toggle', () => {
    render(<ContactDetail {...detailProps} />, { wrapper: createWrapper() });
    expect(screen.getByTestId('cash-flow-card')).toBeInTheDocument();
    expect(screen.getByText('Cash out over 12 months')).toBeInTheDocument();
    expect(screen.getByTestId('chart-graph-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('chart-table-toggle')).toBeInTheDocument();
  });

  it('toggles from graph to table view', async () => {
    const user = userEvent.setup();
    render(<ContactDetail {...detailProps} />, { wrapper: createWrapper() });

    // Default is graph
    expect(screen.getByTestId('cash-flow-graph')).toBeInTheDocument();

    // Click table toggle
    await user.click(screen.getByTestId('chart-table-toggle'));
    expect(screen.getByTestId('cash-flow-table')).toBeInTheDocument();
  });

  it('renders History and notes section with toggle and add note', () => {
    render(<ContactDetail {...detailProps} />, { wrapper: createWrapper() });
    expect(screen.getByTestId('history-notes-section')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-history')).toBeInTheDocument();
    expect(screen.getByText('History and notes')).toBeInTheDocument();
    expect(screen.getByTestId('add-note-btn')).toBeInTheDocument();
    expect(screen.getByTestId('history-note-input')).toBeInTheDocument();
  });
});
