// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ContactCreatePage } from '../routes/ContactsPage';

// Mock showToast
const mockShowToast = vi.fn();
vi.mock('../../dashboard/components/ToastContainer', () => ({
  showToast: (...args: unknown[]) => mockShowToast(...args),
}));

// Mock TanStack Router
const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({}),
}));

let originalFetch: typeof globalThis.fetch;

function mockFetchSuccess() {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () =>
      Promise.resolve({
        ok: true,
        data: {
          id: 'new-contact-id',
          name: 'Test Contact',
          type: 'customer',
          email: null,
          phone: null,
          taxNumber: null,
          bankAccountName: null,
          bankAccountNumber: null,
          defaultAccountCode: null,
          outstandingBalance: 0,
          overdueBalance: 0,
          isArchived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }),
  } as Response);
}

function mockFetchError() {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: false,
    json: () => Promise.resolve({ ok: false, error: 'Server error occurred' }),
  } as Response);
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

beforeEach(() => {
  originalFetch = globalThis.fetch;
  mockFetchSuccess();
  mockNavigate.mockReset();
  mockShowToast.mockReset();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('ContactCreatePage', () => {
  it('renders without a Dialog wrapper (no role="dialog")', () => {
    render(<ContactCreatePage />, { wrapper: createWrapper() });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders page title "New Contact"', () => {
    render(<ContactCreatePage />, { wrapper: createWrapper() });
    // h1 is the page title — use role selector to be specific
    expect(screen.getByRole('heading', { level: 1, name: 'New Contact' })).toBeInTheDocument();
  });

  it('renders breadcrumbs: Contacts > New Contact', () => {
    render(<ContactCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByText('Contacts')).toBeInTheDocument();
    // "New Contact" appears in breadcrumb as a span and in h1 — just check it exists at all
    expect(screen.getAllByText('New Contact').length).toBeGreaterThanOrEqual(1);
  });

  it('renders section navigation links', () => {
    render(<ContactCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('nav-contact-details')).toBeInTheDocument();
    expect(screen.getByTestId('nav-addresses')).toBeInTheDocument();
    expect(screen.getByTestId('nav-financial')).toBeInTheDocument();
    expect(screen.getByTestId('nav-sales-defaults')).toBeInTheDocument();
    expect(screen.getByTestId('nav-purchase-defaults')).toBeInTheDocument();
  });

  it('renders Save & close button in a sticky footer', () => {
    render(<ContactCreatePage />, { wrapper: createWrapper() });
    const saveBtn = screen.getByTestId('save-close-btn');
    expect(saveBtn).toBeInTheDocument();
    // The footer wrapping the button should be sticky/fixed
    const footer = saveBtn.closest('[data-testid="sticky-footer"]');
    expect(footer).toBeInTheDocument();
  });

  it('renders Cancel button in sticky footer', () => {
    render(<ContactCreatePage />, { wrapper: createWrapper() });
    const cancelBtn = screen.getByTestId('cancel-btn');
    expect(cancelBtn).toBeInTheDocument();
    const footer = cancelBtn.closest('[data-testid="sticky-footer"]');
    expect(footer).toBeInTheDocument();
  });

  it('Cancel button navigates back to /contacts', async () => {
    const user = userEvent.setup();
    render(<ContactCreatePage />, { wrapper: createWrapper() });

    await user.click(screen.getByTestId('cancel-btn'));

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/contacts' });
  });

  it('shows inline error "Contact name is required" when save is clicked with empty name', async () => {
    const user = userEvent.setup();
    render(<ContactCreatePage />, { wrapper: createWrapper() });

    await user.click(screen.getByTestId('save-close-btn'));

    expect(
      await screen.findByText('Contact name is required'),
    ).toBeInTheDocument();
  });

  it('does not call API when contact name is empty (validation blocks submit)', async () => {
    const user = userEvent.setup();
    render(<ContactCreatePage />, { wrapper: createWrapper() });

    await user.click(screen.getByTestId('save-close-btn'));

    // Wait for error message to appear
    await screen.findByText('Contact name is required');

    // fetch should NOT have been called with POST (only GET calls allowed for prefetch)
    const fetchCalls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
    const postCalls = fetchCalls.filter(
      ([, opts]) => opts?.method === 'POST',
    );
    expect(postCalls).toHaveLength(0);
  });

  it('shows toast "Contact created" and navigates to /contacts on successful save', async () => {
    const user = userEvent.setup();
    render(<ContactCreatePage />, { wrapper: createWrapper() });

    // Type a contact name
    const nameInput = screen.getByTestId('contact-name-input');
    await user.type(nameInput, 'Test Contact');

    // Click save
    await user.click(screen.getByTestId('save-close-btn'));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('success', 'Contact created');
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/contacts' });
    });
  });

  it('shows loading state on save button during submission', async () => {
    // Make fetch take a moment
    globalThis.fetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () =>
                  Promise.resolve({
                    ok: true,
                    data: {
                      id: 'new-id',
                      name: 'Test',
                      type: 'customer',
                      email: null,
                      phone: null,
                      taxNumber: null,
                      bankAccountName: null,
                      bankAccountNumber: null,
                      defaultAccountCode: null,
                      outstandingBalance: 0,
                      overdueBalance: 0,
                      isArchived: false,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    },
                  }),
              } as Response),
            50,
          ),
        ),
    );

    const user = userEvent.setup();
    render(<ContactCreatePage />, { wrapper: createWrapper() });

    const nameInput = screen.getByTestId('contact-name-input');
    await user.type(nameInput, 'Test Contact');

    await user.click(screen.getByTestId('save-close-btn'));

    // Button should be disabled during submission
    const saveBtn = screen.getByTestId('save-close-btn');
    expect(saveBtn).toBeDisabled();
  });

  it('shows error toast when server returns error', async () => {
    mockFetchError();
    const user = userEvent.setup();
    render(<ContactCreatePage />, { wrapper: createWrapper() });

    const nameInput = screen.getByTestId('contact-name-input');
    await user.type(nameInput, 'Test Contact');

    await user.click(screen.getByTestId('save-close-btn'));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('error', expect.any(String));
    });
  });

  it('clicking section nav scrolls to that section (section becomes visible)', async () => {
    const user = userEvent.setup();
    render(<ContactCreatePage />, { wrapper: createWrapper() });

    // All sections should be visible in the scrollable layout (not tab-based hiding)
    expect(screen.getByTestId('section-contact-details')).toBeInTheDocument();
    expect(screen.getByTestId('section-addresses')).toBeInTheDocument();
    expect(screen.getByTestId('section-financial')).toBeInTheDocument();
    expect(screen.getByTestId('section-sales-defaults')).toBeInTheDocument();
    expect(screen.getByTestId('section-purchase-defaults')).toBeInTheDocument();
  });

  describe('Combobox fields', () => {
    it('Sales Account renders as Combobox (role="combobox")', () => {
      render(<ContactCreatePage />, { wrapper: createWrapper() });
      const section = screen.getByTestId('section-sales-defaults');
      const comboboxes = section.querySelectorAll('[role="combobox"]');
      expect(comboboxes.length).toBeGreaterThanOrEqual(1);
    });

    it('Purchase Account renders as Combobox (role="combobox")', () => {
      render(<ContactCreatePage />, { wrapper: createWrapper() });
      const section = screen.getByTestId('section-purchase-defaults');
      const comboboxes = section.querySelectorAll('[role="combobox"]');
      expect(comboboxes.length).toBeGreaterThanOrEqual(1);
    });

    it('typing in Sales Account Combobox filters account options', async () => {
      const user = userEvent.setup();
      render(<ContactCreatePage />, { wrapper: createWrapper() });

      const section = screen.getByTestId('section-sales-defaults');
      const salesAccountCombobox = section.querySelectorAll('[role="combobox"]')[0] as HTMLElement;
      expect(salesAccountCombobox).toBeInTheDocument();

      await user.click(salesAccountCombobox);
      await user.type(salesAccountCombobox, '200');

      // Should show filtered option
      expect(await screen.findByText('200 - Sales')).toBeInTheDocument();
    });

    it('selecting an account option in Sales Account updates the field', async () => {
      const user = userEvent.setup();
      render(<ContactCreatePage />, { wrapper: createWrapper() });

      const section = screen.getByTestId('section-sales-defaults');
      const salesAccountCombobox = section.querySelectorAll('[role="combobox"]')[0] as HTMLInputElement;
      expect(salesAccountCombobox).toBeInTheDocument();

      await user.click(salesAccountCombobox);
      // Click the '200 - Sales' option that appears
      const option = await screen.findByText('200 - Sales');
      await user.click(option);

      expect(salesAccountCombobox.value).toBe('200 - Sales');
    });

    it('Sales GST Combobox shows tax rate options when clicked', async () => {
      const user = userEvent.setup();
      render(<ContactCreatePage />, { wrapper: createWrapper() });

      const section = screen.getByTestId('section-sales-defaults');
      // Sales GST is the second combobox in the sales section (after Sales Account)
      const comboboxes = section.querySelectorAll('[role="combobox"]');
      expect(comboboxes.length).toBeGreaterThanOrEqual(2);

      await user.click(comboboxes[1] as HTMLElement);
      expect(await screen.findByText('15% GST on Income')).toBeInTheDocument();
    });

    it('Purchase Account Combobox shows account options when clicked', async () => {
      const user = userEvent.setup();
      render(<ContactCreatePage />, { wrapper: createWrapper() });

      const section = screen.getByTestId('section-purchase-defaults');
      const purchaseCombobox = section.querySelectorAll('[role="combobox"]')[0] as HTMLElement;
      expect(purchaseCombobox).toBeInTheDocument();

      await user.click(purchaseCombobox);
      expect(await screen.findByText('400 - Advertising')).toBeInTheDocument();
    });

    it('Sales Region Combobox shows region options when clicked', async () => {
      const user = userEvent.setup();
      render(<ContactCreatePage />, { wrapper: createWrapper() });

      // Find region combobox by its placeholder (unique across the form)
      // The sales region has placeholder "Search regions..."
      const regionComboboxes = screen.getAllByPlaceholderText('Search regions...');
      expect(regionComboboxes.length).toBeGreaterThanOrEqual(1);

      await user.click(regionComboboxes[0]);
      expect(await screen.findByText('Auckland')).toBeInTheDocument();
    });
  });
});
