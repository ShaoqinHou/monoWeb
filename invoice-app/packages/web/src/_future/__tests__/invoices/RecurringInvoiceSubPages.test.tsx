// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ recurringId: 'rec-1' }),
}));

const mockUseRecurringInvoice = vi.fn();
const mockCreateMutate = vi.fn();
const mockUpdateMutate = vi.fn();
const mockGenerateMutate = vi.fn();

vi.mock('../hooks/useRecurringInvoices', () => ({
  useRecurringInvoices: () => ({ data: [], isLoading: false }),
  useRecurringInvoice: (...args: unknown[]) => mockUseRecurringInvoice(...args),
  useCreateRecurringInvoice: () => ({ mutate: mockCreateMutate, isPending: false }),
  useUpdateRecurringInvoice: () => ({ mutate: mockUpdateMutate, isPending: false }),
  useDeleteRecurringInvoice: () => ({ mutate: vi.fn(), isPending: false }),
  useGenerateRecurringInvoice: () => ({ mutate: mockGenerateMutate, isPending: false }),
}));

import {
  RecurringInvoiceDetailPage,
  RecurringInvoiceEditPage,
  RecurringInvoiceCreatePage,
} from '../../../_future/components/invoices/RecurringInvoiceSubPages';

const SAMPLE_RECURRING = {
  id: 'rec-1',
  templateName: 'Monthly Retainer',
  contactId: '00000000-0000-0000-0000-000000000101',
  contactName: 'Acme Corporation',
  frequency: 'monthly' as const,
  nextDate: '2024-02-01',
  endDate: null,
  daysUntilDue: 30,
  status: 'active' as const,
  subTotal: 5000,
  totalTax: 750,
  total: 5750,
  timesGenerated: 3,
  createdAt: '2024-01-01T00:00:00.000Z',
};

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

describe('RecurringInvoiceDetailPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockUpdateMutate.mockClear();
    mockGenerateMutate.mockClear();
    mockUseRecurringInvoice.mockReturnValue({
      data: SAMPLE_RECURRING,
      isLoading: false,
      error: null,
    });
  });

  it('renders loading state', () => {
    mockUseRecurringInvoice.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
    render(<RecurringInvoiceDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('recurring-detail-loading')).toBeInTheDocument();
  });

  it('renders not-found state when invoice is null', () => {
    mockUseRecurringInvoice.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });
    render(<RecurringInvoiceDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('recurring-not-found')).toBeInTheDocument();
  });

  it('renders the detail view with content', () => {
    render(<RecurringInvoiceDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('recurring-invoice-detail')).toBeInTheDocument();
  });

  it('shows the template name', () => {
    render(<RecurringInvoiceDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('detail-template-name')).toHaveTextContent('Monthly Retainer');
  });

  it('shows the contact name', () => {
    render(<RecurringInvoiceDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('detail-contact')).toHaveTextContent('Acme Corporation');
  });

  it('shows the status badge', () => {
    render(<RecurringInvoiceDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('recurring-status-badge')).toHaveTextContent('Active');
  });

  it('shows pause button for active invoice', () => {
    render(<RecurringInvoiceDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('pause-recurring-button')).toBeInTheDocument();
  });

  it('shows resume button for paused invoice', () => {
    mockUseRecurringInvoice.mockReturnValue({
      data: { ...SAMPLE_RECURRING, status: 'paused' },
      isLoading: false,
    });
    render(<RecurringInvoiceDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('resume-recurring-button')).toBeInTheDocument();
  });

  it('shows generate button for active invoice', () => {
    render(<RecurringInvoiceDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('generate-invoice-button')).toBeInTheDocument();
  });

  it('shows the schedule summary', () => {
    render(<RecurringInvoiceDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('schedule-summary')).toBeInTheDocument();
  });

  it('shows breadcrumbs', () => {
    render(<RecurringInvoiceDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Recurring Invoices')).toBeInTheDocument();
  });

  it('navigates to edit page when Edit is clicked', () => {
    render(<RecurringInvoiceDetailPage />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByTestId('edit-recurring-button'));
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/sales/recurring-invoices/$recurringId/edit',
      params: { recurringId: 'rec-1' },
    });
  });

  it('shows frequency detail', () => {
    render(<RecurringInvoiceDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('detail-frequency')).toHaveTextContent('monthly');
  });

  it('shows times generated', () => {
    render(<RecurringInvoiceDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('detail-times-generated')).toHaveTextContent('3');
  });

  it('does not show edit button for completed invoice', () => {
    mockUseRecurringInvoice.mockReturnValue({
      data: { ...SAMPLE_RECURRING, status: 'completed' },
      isLoading: false,
    });
    render(<RecurringInvoiceDetailPage />, { wrapper: createWrapper() });
    expect(screen.queryByTestId('edit-recurring-button')).not.toBeInTheDocument();
  });
});

describe('RecurringInvoiceCreatePage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockCreateMutate.mockClear();
  });

  it('renders the page title "New Recurring Invoice"', () => {
    render(<RecurringInvoiceCreatePage />, { wrapper: createWrapper() });
    const heading = screen.getByRole('heading', { name: 'New Recurring Invoice' });
    expect(heading).toBeInTheDocument();
  });

  it('renders the recurring invoice form', () => {
    render(<RecurringInvoiceCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('recurring-invoice-form')).toBeInTheDocument();
  });

  it('renders the frequency dropdown', () => {
    render(<RecurringInvoiceCreatePage />, { wrapper: createWrapper() });
    const frequencySelect = screen.getByTestId('form-frequency');
    expect(frequencySelect).toBeInTheDocument();
  });

  it('has frequency dropdown with correct options', () => {
    render(<RecurringInvoiceCreatePage />, { wrapper: createWrapper() });
    const frequencySelect = screen.getByTestId('form-frequency');
    expect(frequencySelect).toBeInTheDocument();
    // default is monthly
    expect(frequencySelect).toHaveValue('monthly');
  });

  it('renders breadcrumbs with "Recurring Invoices" link', () => {
    render(<RecurringInvoiceCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByText('Recurring Invoices')).toBeInTheDocument();
  });

  it('renders the contact selector', () => {
    render(<RecurringInvoiceCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('form-contact')).toBeInTheDocument();
  });

  it('renders the template name field', () => {
    render(<RecurringInvoiceCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('form-template-name')).toBeInTheDocument();
  });

  it('renders the next date field', () => {
    render(<RecurringInvoiceCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('form-next-date')).toBeInTheDocument();
  });

  it('renders the end date field', () => {
    render(<RecurringInvoiceCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('form-end-date')).toBeInTheDocument();
  });

  it('renders the line items section', () => {
    render(<RecurringInvoiceCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('recurring-line-items')).toBeInTheDocument();
  });

  it('renders the totals section', () => {
    render(<RecurringInvoiceCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('recurring-totals')).toBeInTheDocument();
  });

  it('renders Save button', () => {
    render(<RecurringInvoiceCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('save-recurring-button')).toBeInTheDocument();
  });
});

describe('RecurringInvoiceEditPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockUpdateMutate.mockClear();
    mockUseRecurringInvoice.mockReturnValue({
      data: SAMPLE_RECURRING,
      isLoading: false,
      error: null,
    });
  });

  it('renders loading state', () => {
    mockUseRecurringInvoice.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
    render(<RecurringInvoiceEditPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('recurring-edit-loading')).toBeInTheDocument();
  });

  it('renders not-found state', () => {
    mockUseRecurringInvoice.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });
    render(<RecurringInvoiceEditPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('recurring-not-found')).toBeInTheDocument();
  });

  it('loads and pre-fills the form with existing data', () => {
    render(<RecurringInvoiceEditPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('recurring-invoice-form')).toBeInTheDocument();
    // Template name pre-filled
    const templateInput = screen.getByTestId('form-template-name');
    expect(templateInput).toHaveValue('Monthly Retainer');
  });

  it('pre-fills the contact selector', () => {
    render(<RecurringInvoiceEditPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('form-contact')).toHaveValue('00000000-0000-0000-0000-000000000101');
  });

  it('pre-fills the frequency', () => {
    render(<RecurringInvoiceEditPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('form-frequency')).toHaveValue('monthly');
  });

  it('shows breadcrumbs with template name', () => {
    render(<RecurringInvoiceEditPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Recurring Invoices')).toBeInTheDocument();
    expect(screen.getByText('Monthly Retainer')).toBeInTheDocument();
  });

  it('renders the page title "Edit Recurring Invoice"', () => {
    render(<RecurringInvoiceEditPage />, { wrapper: createWrapper() });
    const heading = screen.getByRole('heading', { name: 'Edit Recurring Invoice' });
    expect(heading).toBeInTheDocument();
  });
});
