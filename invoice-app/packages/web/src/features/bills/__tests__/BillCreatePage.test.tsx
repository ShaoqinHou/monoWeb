import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BillCreatePage } from '../routes/BillsPage';

const MOCK_CONTACTS = [
  {
    id: 'c001',
    name: 'Office Supplies Ltd',
    type: 'supplier',
    outstandingBalance: 0,
    overdueBalance: 0,
    isArchived: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'c002',
    name: 'Wellington Power Co',
    type: 'supplier',
    outstandingBalance: 0,
    overdueBalance: 0,
    isArchived: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'c003',
    name: 'Cloud Services NZ',
    type: 'customer_and_supplier',
    outstandingBalance: 0,
    overdueBalance: 0,
    isArchived: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'c004',
    name: 'Customer Only Corp',
    type: 'customer',
    outstandingBalance: 0,
    overdueBalance: 0,
    isArchived: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockFetchContacts() {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ ok: true, data: MOCK_CONTACTS }),
  });
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

describe('BillCreatePage', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('renders the page title', () => {
    mockFetchContacts();
    render(<BillCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByRole('heading', { level: 1, name: 'New Bill' })).toBeInTheDocument();
  });

  it('renders breadcrumbs', () => {
    mockFetchContacts();
    render(<BillCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByText('Bills')).toBeInTheDocument();
  });

  it('renders the bill form', async () => {
    mockFetchContacts();
    render(<BillCreatePage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('bill-form')).toBeInTheDocument();
  });

  it('fetches suppliers from /api/contacts and filters to suppliers', async () => {
    mockFetchContacts();
    render(<BillCreatePage />, { wrapper: createWrapper() });
    // Wait for form to load, then open the supplier combobox to see options
    const supplierInput = await screen.findByTestId('bill-supplier-select');
    fireEvent.click(supplierInput);
    // Suppliers + customer_and_supplier should appear, customer-only should not
    expect(await screen.findByRole('option', { name: 'Office Supplies Ltd' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Wellington Power Co' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Cloud Services NZ' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Customer Only Corp' })).not.toBeInTheDocument();
  });

  it('renders Save as Draft button', async () => {
    mockFetchContacts();
    render(<BillCreatePage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('save-draft-btn')).toHaveTextContent('Save as Draft');
  });

  it('renders Submit button', async () => {
    mockFetchContacts();
    render(<BillCreatePage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('submit-bill-btn')).toHaveTextContent('Submit');
  });

  it('renders line items editor', async () => {
    mockFetchContacts();
    render(<BillCreatePage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('bill-line-items')).toBeInTheDocument();
  });

  it('renders date inputs', async () => {
    mockFetchContacts();
    render(<BillCreatePage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('bill-date-input')).toBeInTheDocument();
    expect(screen.getByTestId('bill-due-date-input')).toBeInTheDocument();
  });

  it('renders amount type selector', async () => {
    mockFetchContacts();
    render(<BillCreatePage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('bill-amount-type-select')).toBeInTheDocument();
  });

  it('renders reference input', async () => {
    mockFetchContacts();
    render(<BillCreatePage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('bill-reference-input')).toBeInTheDocument();
  });
});
