// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ContactsPage } from '../routes/ContactsPage';

const MOCK_CONTACTS = [
  {
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
  },
  {
    id: 'd2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d',
    name: 'Bay Supplies Ltd',
    type: 'supplier',
    email: 'orders@baysupply.co.nz',
    phone: '555-0200',
    taxNumber: 'NZ-23-456-789',
    outstandingBalance: 0,
    overdueBalance: 0,
    isArchived: false,
    createdAt: '2025-02-20T08:00:00.000Z',
    updatedAt: '2025-05-15T11:00:00.000Z',
  },
  {
    id: 'e3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e',
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
  {
    id: 'f4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e8f',
    name: 'Demo Client Co',
    type: 'customer',
    email: 'demo@testclient.com',
    phone: '555-0400',
    outstandingBalance: 200,
    overdueBalance: 200,
    isArchived: false,
    createdAt: '2025-04-05T12:00:00.000Z',
    updatedAt: '2025-04-05T12:00:00.000Z',
  },
  {
    id: 'a5e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f9a',
    name: 'Eastern Traders',
    type: 'supplier',
    email: 'info@easterntraders.co.nz',
    phone: '555-0500',
    outstandingBalance: 1200,
    overdueBalance: 0,
    isArchived: false,
    createdAt: '2025-01-20T07:00:00.000Z',
    updatedAt: '2025-08-10T10:15:00.000Z',
  },
  {
    id: 'b6f7a8b9-c0d1-4e2f-3a4b-5c6d7e8f9a0b',
    name: 'Fern & Co Consulting',
    type: 'customer',
    email: 'hello@fernco.nz',
    phone: '555-0600',
    outstandingBalance: 0,
    overdueBalance: 0,
    isArchived: false,
    createdAt: '2025-05-01T15:00:00.000Z',
    updatedAt: '2025-05-01T15:00:00.000Z',
  },
];

// Mock TanStack Router hooks
const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({}),
  useRouterState: () => ({ location: { href: '/contacts', pathname: '/contacts', search: '' } }),
}));

let originalFetch: typeof globalThis.fetch;

function mockFetch() {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ ok: true, data: MOCK_CONTACTS }),
  } as Response);
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
  mockFetch();
  mockNavigate.mockReset();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('ContactsPage', () => {
  it('renders page title "Contacts"', async () => {
    render(<ContactsPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Contacts')).toBeInTheDocument();
  });

  it('renders the toolbar with New contact button and Actions menu dropdown', async () => {
    const user = userEvent.setup();
    render(<ContactsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('new-contact-btn')).toBeInTheDocument();
    expect(screen.getByTestId('actions-menu-btn')).toBeInTheDocument();
    // Open actions menu to verify dropdown items
    await user.click(screen.getByTestId('actions-menu-btn'));
    expect(screen.getByTestId('import-btn')).toBeInTheDocument();
    expect(screen.getByTestId('export-btn')).toBeInTheDocument();
    expect(screen.getByTestId('new-group-btn')).toBeInTheDocument();
  });

  it('renders search input', async () => {
    render(<ContactsPage />, { wrapper: createWrapper() });
    expect(screen.getByPlaceholderText('Search contacts...')).toBeInTheDocument();
  });

  it('renders Xero-style tabs (All, Customers, Suppliers, Archived, Groups, Smart Lists)', async () => {
    render(<ContactsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('tab-all')).toBeInTheDocument();
    expect(screen.getByTestId('tab-customers')).toBeInTheDocument();
    expect(screen.getByTestId('tab-suppliers')).toBeInTheDocument();
    expect(screen.getByTestId('tab-archived')).toBeInTheDocument();
    expect(screen.getByTestId('tab-groups')).toBeInTheDocument();
    expect(screen.getByTestId('tab-smart-lists')).toBeInTheDocument();
  });

  it('renders contacts table with data from API after loading', async () => {
    render(<ContactsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    });

    expect(screen.getByText('Bay Supplies Ltd')).toBeInTheDocument();
    expect(screen.getByText('City Services Group')).toBeInTheDocument();
    expect(screen.getByText('Demo Client Co')).toBeInTheDocument();
    expect(screen.getByText('Eastern Traders')).toBeInTheDocument();
    expect(screen.getByText('Fern & Co Consulting')).toBeInTheDocument();
  });

  it('renders contact emails in the Email Address column', async () => {
    render(<ContactsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('info@acme.com')).toBeInTheDocument();
    });

    expect(screen.getByText('orders@baysupply.co.nz')).toBeInTheDocument();
    expect(screen.getByText('accounts@cityservices.com')).toBeInTheDocument();
  });

  it('renders Xero-style table column headers (Contact, You owe, They owe)', async () => {
    render(<ContactsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Contact')).toBeInTheDocument();
    });

    expect(screen.getByText('You owe')).toBeInTheDocument();
    expect(screen.getByText('They owe')).toBeInTheDocument();
  });

  it('navigates to /contacts/new when "New contact" is clicked', async () => {
    const user = userEvent.setup();
    render(<ContactsPage />, { wrapper: createWrapper() });

    await user.click(screen.getByTestId('new-contact-btn'));

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/contacts/new' });
  });

  it('navigates to contact detail via router when contact name is clicked', async () => {
    const user = userEvent.setup();
    render(<ContactsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    });

    // Click on the contact name (which is in the name cell)
    await user.click(screen.getByText('Acme Corporation'));

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/contacts/$contactId',
      params: { contactId: 'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c' },
    });
  });

  it('calls fetch with /api/contacts on mount', async () => {
    render(<ContactsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/contacts',
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });

  it('does not render alphabet filter (removed to match Xero)', async () => {
    render(<ContactsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('alphabet-filter')).not.toBeInTheDocument();
  });
});
