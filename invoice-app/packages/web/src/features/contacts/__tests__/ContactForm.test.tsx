// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { ContactForm } from '../components/ContactForm';

vi.mock('../../accounting/hooks/useAccounts', () => ({
  useAccounts: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock('../../accounting/hooks/useTaxRates', () => ({
  useTaxRates: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(() => vi.fn()),
  useParams: vi.fn(() => ({})),
}));

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: qc }, children);
  };
}

describe('ContactForm', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    isSubmitting: false,
    title: 'New Contact',
  };

  it('renders the dialog with title', () => {
    render(<ContactForm {...defaultProps} />, { wrapper: createWrapper() });
    expect(screen.getByText('New Contact')).toBeInTheDocument();
  });

  it('renders side navigation and contact details section by default', () => {
    render(<ContactForm {...defaultProps} />, { wrapper: createWrapper() });
    expect(screen.getByTestId('form-side-nav')).toBeInTheDocument();
    expect(screen.getByTestId('section-contact-details')).toBeInTheDocument();
    expect(screen.getByTestId('contact-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('contact-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('contact-phone-input')).toBeInTheDocument();
    expect(screen.getByTestId('contact-type-select')).toBeInTheDocument();
    expect(screen.getByTestId('contact-tax-input')).toBeInTheDocument();
  });

  it('renders Save and Cancel buttons', () => {
    render(<ContactForm {...defaultProps} />, { wrapper: createWrapper() });
    expect(screen.getByTestId('contact-form-save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ContactForm {...defaultProps} onClose={onClose} />, { wrapper: createWrapper() });

    await user.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('validates required name field', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ContactForm {...defaultProps} onSubmit={onSubmit} />, { wrapper: createWrapper() });

    await user.click(screen.getByTestId('contact-form-save'));

    await waitFor(() => {
      expect(screen.getByText('Contact name is required')).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ContactForm {...defaultProps} onSubmit={onSubmit} />, { wrapper: createWrapper() });

    await user.type(screen.getByTestId('contact-name-input'), 'Test Contact');
    await user.type(screen.getByTestId('contact-email-input'), 'not-an-email');

    await user.click(screen.getByTestId('contact-form-save'));

    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ContactForm {...defaultProps} onSubmit={onSubmit} />, { wrapper: createWrapper() });

    await user.type(screen.getByTestId('contact-name-input'), 'New Contact Name');
    await user.type(screen.getByTestId('contact-email-input'), 'new@example.com');
    await user.type(screen.getByTestId('contact-phone-input'), '555-9999');

    await user.click(screen.getByTestId('contact-form-save'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Contact Name',
          email: 'new@example.com',
          phone: '555-9999',
          type: 'customer',
        }),
      );
    });
  });

  it('pre-fills form when initialData is provided', () => {
    render(
      <ContactForm
        {...defaultProps}
        title="Edit Contact"
        initialData={{
          name: 'Existing Contact',
          email: 'existing@test.com',
          phone: '555-1111',
          type: 'supplier',
          taxNumber: 'NZ-99-999-999',
        }}
      />,
      { wrapper: createWrapper() },
    );

    const nameInput = screen.getByTestId('contact-name-input') as HTMLInputElement;
    expect(nameInput.value).toBe('Existing Contact');

    const emailInput = screen.getByTestId('contact-email-input') as HTMLInputElement;
    expect(emailInput.value).toBe('existing@test.com');

    const phoneInput = screen.getByTestId('contact-phone-input') as HTMLInputElement;
    expect(phoneInput.value).toBe('555-1111');

    const taxInput = screen.getByTestId('contact-tax-input') as HTMLInputElement;
    expect(taxInput.value).toBe('NZ-99-999-999');
  });

  it('does not render when open is false', () => {
    render(<ContactForm {...defaultProps} open={false} />, { wrapper: createWrapper() });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows loading state on save button when submitting', () => {
    render(<ContactForm {...defaultProps} isSubmitting={true} />, { wrapper: createWrapper() });
    const saveBtn = screen.getByTestId('contact-form-save');
    expect(saveBtn).toBeDisabled();
  });

  it('clears name error when user types', async () => {
    const user = userEvent.setup();
    render(<ContactForm {...defaultProps} />, { wrapper: createWrapper() });

    await user.click(screen.getByTestId('contact-form-save'));
    await waitFor(() => {
      expect(screen.getByText('Contact name is required')).toBeInTheDocument();
    });

    await user.type(screen.getByTestId('contact-name-input'), 'A');

    await waitFor(() => {
      expect(screen.queryByText('Contact name is required')).not.toBeInTheDocument();
    });
  });

  it('renders with "Edit Contact" title when editing', () => {
    render(<ContactForm {...defaultProps} title="Edit Contact" />, { wrapper: createWrapper() });
    expect(screen.getByText('Edit Contact')).toBeInTheDocument();
  });

  it('has label for Name field', () => {
    render(<ContactForm {...defaultProps} />, { wrapper: createWrapper() });
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('has label for Type field', () => {
    render(<ContactForm {...defaultProps} />, { wrapper: createWrapper() });
    expect(screen.getByLabelText('Type')).toBeInTheDocument();
  });

  it('shows primary person section with first/last name', () => {
    render(<ContactForm {...defaultProps} />, { wrapper: createWrapper() });
    expect(screen.getByText('Primary person')).toBeInTheDocument();
    expect(screen.getByTestId('primary-first-name')).toBeInTheDocument();
    expect(screen.getByTestId('primary-last-name')).toBeInTheDocument();
  });

  it('shows notes textarea with 4000 char counter', () => {
    render(<ContactForm {...defaultProps} />, { wrapper: createWrapper() });
    expect(screen.getByTestId('contact-notes')).toBeInTheDocument();
    expect(screen.getByText('0 / 4000')).toBeInTheDocument();
  });
});
