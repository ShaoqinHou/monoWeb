// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ContactDetailPage } from '../routes/ContactsPage';

const ACME_CONTACT = {
  id: 'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
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
};

const CITY_CONTACT = {
  id: 'e3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e',
  name: 'City Services Group',
  type: 'customer_and_supplier',
  email: 'accounts@cityservices.com',
  phone: '555-0300',
  taxNumber: 'NZ-34-567-890',
  bankAccountName: 'City Services',
  bankAccountNumber: '06-0987-6543210-00',
  defaultAccountCode: '200',
  outstandingBalance: 750,
  overdueBalance: 250,
  isArchived: false,
  createdAt: '2025-03-10T09:30:00.000Z',
  updatedAt: '2025-07-01T16:45:00.000Z',
};

const MOCK_INVOICES = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-001',
    contactId: ACME_CONTACT.id,
    contactName: 'Acme Corporation',
    status: 'approved',
    amountType: 'exclusive',
    currency: 'NZD',
    date: '2025-07-15',
    dueDate: '2025-08-15',
    lineItems: [],
    subTotal: 500,
    totalTax: 75,
    total: 575,
    amountDue: 575,
    amountPaid: 0,
    createdAt: '2025-07-15T10:00:00.000Z',
    updatedAt: '2025-07-15T10:00:00.000Z',
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-002',
    contactId: ACME_CONTACT.id,
    contactName: 'Acme Corporation',
    status: 'paid',
    amountType: 'exclusive',
    currency: 'NZD',
    date: '2025-06-01',
    dueDate: '2025-07-01',
    lineItems: [],
    subTotal: 1000,
    totalTax: 150,
    total: 1150,
    amountDue: 0,
    amountPaid: 1150,
    createdAt: '2025-06-01T10:00:00.000Z',
    updatedAt: '2025-07-01T10:00:00.000Z',
  },
];

const MOCK_BILLS = [
  {
    id: 'bill-1',
    billNumber: 'BILL-001',
    contactId: ACME_CONTACT.id,
    contactName: 'Acme Corporation',
    status: 'paid',
    amountType: 'exclusive',
    currency: 'NZD',
    date: '2025-05-10',
    dueDate: '2025-06-10',
    lineItems: [],
    subTotal: 350,
    totalTax: 52.5,
    total: 402.5,
    amountDue: 0,
    amountPaid: 402.5,
    createdAt: '2025-05-10T08:00:00.000Z',
    updatedAt: '2025-06-10T08:00:00.000Z',
  },
];

// Mock TanStack Router hooks
const mockNavigate = vi.fn();
let mockContactId = ACME_CONTACT.id;

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ contactId: mockContactId }),
}));

let originalFetch: typeof globalThis.fetch;

/**
 * Smart mock fetch that routes based on URL:
 * /api/contacts/:id  -> contact
 * /api/invoices      -> invoices
 * /api/bills         -> bills
 */
function mockFetchForDetail(
  contact: typeof ACME_CONTACT,
  invoices = MOCK_INVOICES,
  bills = MOCK_BILLS,
) {
  globalThis.fetch = vi.fn().mockImplementation((url: string) => {
    if (url.startsWith('/api/contacts/')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: contact }),
      } as Response);
    }
    if (url === '/api/invoices') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: invoices }),
      } as Response);
    }
    if (url === '/api/bills') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: bills }),
      } as Response);
    }
    // fallback
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: null }),
    } as Response);
  });
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

beforeEach(() => {
  originalFetch = globalThis.fetch;
  mockContactId = ACME_CONTACT.id;
  mockFetchForDetail(ACME_CONTACT);
  mockNavigate.mockReset();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('ContactDetailPage', () => {
  it('displays contact info card with name', async () => {
    render(<ContactDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('contact-info-card')).toBeInTheDocument();
    });
    const card = screen.getByTestId('contact-info-card');
    expect(card.textContent).toContain('Acme Corporation');
  });

  it('fetches from /api/contacts/:id', async () => {
    render(<ContactDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('contact-info-card')).toBeInTheDocument();
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      `/api/contacts/${ACME_CONTACT.id}`,
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });

  it('displays contact email in the info card', async () => {
    render(<ContactDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('contact-email')).toBeInTheDocument();
    });
    expect(screen.getByTestId('contact-email').textContent).toContain('info@acme.com');
  });

  it('displays contact phone in the info card', async () => {
    render(<ContactDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('contact-phone')).toBeInTheDocument();
    });
    expect(screen.getByTestId('contact-phone').textContent).toContain('555-0100');
  });

  it('displays contact tax number', async () => {
    render(<ContactDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('contact-tax-number')).toBeInTheDocument();
    });
    expect(screen.getByText('Tax: NZ-12-345-678')).toBeInTheDocument();
  });

  it('displays outstanding balance', async () => {
    render(<ContactDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('contact-outstanding')).toBeInTheDocument();
    });
    expect(screen.getByTestId('contact-outstanding').textContent).toContain('$500');
  });

  it('displays overdue balance for contacts with overdue amount', async () => {
    mockContactId = CITY_CONTACT.id;
    mockFetchForDetail(CITY_CONTACT, [], []);

    render(<ContactDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('contact-overdue')).toBeInTheDocument();
    });
    expect(screen.getByTestId('contact-overdue').textContent).toContain('$250');
  });

  it('displays bank account name when available', async () => {
    render(<ContactDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('contact-bank-account')).toBeInTheDocument();
    });
    expect(screen.getByTestId('contact-bank-account').textContent).toContain('Acme Corp Business');
  });

  it('displays type badge', async () => {
    render(<ContactDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('contact-info-card')).toBeInTheDocument();
    });

    const card = screen.getByTestId('contact-info-card');
    expect(card.textContent).toContain('Customer');
  });

  it('shows tabs: Details, Activity, Financial', async () => {
    render(<ContactDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Details' })).toBeInTheDocument();
    });

    expect(screen.getByRole('tab', { name: 'Activity' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Financial' })).toBeInTheDocument();
  });

  it('has an edit button that navigates to /contacts/:id/edit', async () => {
    const user = userEvent.setup();
    render(<ContactDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('edit-contact-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('edit-contact-btn'));

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/contacts/$contactId/edit',
      params: { contactId: ACME_CONTACT.id },
    });
  });

  it('has a delete button that shows confirmation dialog', async () => {
    const user = userEvent.setup();
    render(<ContactDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('delete-contact-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('delete-contact-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('delete-confirm-message')).toBeInTheDocument();
    });
    expect(screen.getByTestId('confirm-delete-btn')).toBeInTheDocument();
  });

  it('calls DELETE API and navigates on delete confirm', async () => {
    const user = userEvent.setup();

    // Use smart routing mock — DELETE will also match /api/contacts/:id
    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, data: { id: ACME_CONTACT.id } }),
        } as Response);
      }
      if (typeof url === 'string' && url.startsWith('/api/contacts/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, data: ACME_CONTACT }),
        } as Response);
      }
      if (url === '/api/invoices') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, data: MOCK_INVOICES }),
        } as Response);
      }
      if (url === '/api/bills') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, data: MOCK_BILLS }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: null }),
      } as Response);
    });
    globalThis.fetch = fetchMock;

    render(<ContactDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('delete-contact-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('delete-contact-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('confirm-delete-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('confirm-delete-btn'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/contacts/${ACME_CONTACT.id}`,
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/contacts' });
    });
  });

  it('has a back button that navigates to /contacts', async () => {
    const user = userEvent.setup();
    render(<ContactDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('back-to-contacts')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('back-to-contacts'));

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/contacts' });
  });

  it('displays "Customer & Supplier" badge for dual-type contacts', async () => {
    mockContactId = CITY_CONTACT.id;
    mockFetchForDetail(CITY_CONTACT, [], []);

    render(<ContactDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('contact-info-card')).toBeInTheDocument();
    });

    const card = screen.getByTestId('contact-info-card');
    expect(card.textContent).toContain('Customer & Supplier');
  });

  // ─── New tests for Activity Tab ───

  it('shows activity timeline with invoices and bills when Activity tab is clicked', async () => {
    const user = userEvent.setup();
    render(<ContactDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Activity' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'Activity' }));

    await waitFor(() => {
      expect(screen.getByTestId('activity-timeline')).toBeInTheDocument();
    });

    // Should show both invoices and the bill
    expect(screen.getByText('Invoice INV-001')).toBeInTheDocument();
    expect(screen.getByText('Invoice INV-002')).toBeInTheDocument();
    expect(screen.getByText('Bill BILL-001')).toBeInTheDocument();
  });

  it('shows empty activity state when contact has no invoices or bills', async () => {
    const user = userEvent.setup();
    mockFetchForDetail(ACME_CONTACT, [], []);

    render(<ContactDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Activity' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'Activity' }));

    await waitFor(() => {
      expect(screen.getByTestId('activity-empty')).toBeInTheDocument();
    });
  });

  // ─── New tests for Financial Tab ───

  it('shows financial summary when Financial tab is clicked', async () => {
    const user = userEvent.setup();
    render(<ContactDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Financial' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'Financial' }));

    await waitFor(() => {
      expect(screen.getByTestId('financial-summary')).toBeInTheDocument();
    });

    // Total Invoiced = 575 + 1150 = 1725
    expect(screen.getByTestId('total-invoiced').textContent).toContain('$1,725.00');

    // Total Billed = 402.50
    expect(screen.getByTestId('total-billed').textContent).toContain('$402.50');
  });

  it('shows outstanding amount in financial summary', async () => {
    const user = userEvent.setup();
    render(<ContactDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Financial' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'Financial' }));

    await waitFor(() => {
      expect(screen.getByTestId('total-outstanding')).toBeInTheDocument();
    });

    // Only INV-001 is outstanding (approved, amountDue=575)
    expect(screen.getByTestId('total-outstanding').textContent).toContain('$575.00');
  });

  // ─── Details tab test ───

  it('shows details tab content by default with all contact fields', async () => {
    render(<ContactDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('details-tab-content')).toBeInTheDocument();
    });

    const details = screen.getByTestId('details-tab-content');
    expect(details.textContent).toContain('Customer');
    expect(details.textContent).toContain('info@acme.com');
    expect(details.textContent).toContain('555-0100');
    expect(details.textContent).toContain('NZ-12-345-678');
    expect(details.textContent).toContain('Acme Corp Business');
    expect(details.textContent).toContain('12-3456-7890123-00');
    expect(details.textContent).toContain('200');
  });
});
