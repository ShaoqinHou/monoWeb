import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockNavigate = vi.fn();
const mockMutate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: any) => <a href={to} {...rest}>{children}</a>,
  useParams: () => ({ accountId: 'acc-1' }),
  useNavigate: () => mockNavigate,
}));

const mockShowToast = vi.fn();
vi.mock('../../dashboard/components/ToastContainer', () => ({
  showToast: (...args: unknown[]) => mockShowToast(...args),
}));

const mockUseAccount = vi.fn();
const mockUseUpdateAccount = vi.fn();

vi.mock('../hooks/useAccounts', () => ({
  useAccount: (...args: unknown[]) => mockUseAccount(...args),
  useUpdateAccount: () => mockUseUpdateAccount(),
}));

// Must import after mocks are defined
import { ChartOfAccountsEditPage } from '../routes/ChartOfAccountsEditPage';

describe('ChartOfAccountsEditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUpdateAccount.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
  });

  it('shows loading state while fetching account', () => {
    mockUseAccount.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(<ChartOfAccountsEditPage />);
    expect(screen.getByTestId('edit-account-loading')).toHaveTextContent('Loading account...');
  });

  it('shows not-found state when account is missing', () => {
    mockUseAccount.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });

    render(<ChartOfAccountsEditPage />);
    expect(screen.getByTestId('edit-account-not-found')).toHaveTextContent(
      'The requested account could not be found.',
    );
  });

  it('shows not-found state when there is a load error', () => {
    mockUseAccount.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
    });

    render(<ChartOfAccountsEditPage />);
    expect(screen.getByTestId('edit-account-not-found')).toBeInTheDocument();
  });

  it('pre-fills form with existing account data', () => {
    mockUseAccount.mockReturnValue({
      data: {
        id: 'acc-1',
        code: '4-1000',
        name: 'Sales Revenue',
        type: 'revenue',
        taxType: 'output',
        description: 'Main sales account',
        balance: 0,
      },
      isLoading: false,
      error: null,
    });

    render(<ChartOfAccountsEditPage />);

    expect(screen.getByDisplayValue('4-1000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sales Revenue')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Main sales account')).toBeInTheDocument();
  });

  it('renders the edit form with correct breadcrumbs', () => {
    mockUseAccount.mockReturnValue({
      data: {
        id: 'acc-1',
        code: '4-1000',
        name: 'Sales Revenue',
        type: 'revenue',
        taxType: 'output',
        description: '',
        balance: 0,
      },
      isLoading: false,
      error: null,
    });

    render(<ChartOfAccountsEditPage />);

    expect(screen.getByText('Edit Account')).toBeInTheDocument();
    expect(screen.getByText('Edit: Sales Revenue')).toBeInTheDocument();
    expect(screen.getByTestId('edit-account-form')).toBeInTheDocument();
  });

  it('calls update mutation on form submit', async () => {
    mockMutate.mockImplementation((_data: unknown, opts: { onSuccess?: () => void }) => {
      opts.onSuccess?.();
    });

    mockUseAccount.mockReturnValue({
      data: {
        id: 'acc-1',
        code: '4-1000',
        name: 'Sales Revenue',
        type: 'revenue',
        taxType: 'output',
        description: '',
        balance: 0,
      },
      isLoading: false,
      error: null,
    });

    render(<ChartOfAccountsEditPage />);

    const nameInput = screen.getByDisplayValue('Sales Revenue');
    fireEvent.change(nameInput, { target: { value: 'Updated Sales' } });

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        {
          id: 'acc-1',
          data: expect.objectContaining({
            code: '4-1000',
            name: 'Updated Sales',
            type: 'revenue',
            taxType: 'output',
          }),
        },
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        }),
      );
    });
  });

  it('navigates back on successful save', async () => {
    mockMutate.mockImplementation((_data: unknown, opts: { onSuccess?: () => void }) => {
      opts.onSuccess?.();
    });

    mockUseAccount.mockReturnValue({
      data: {
        id: 'acc-1',
        code: '4-1000',
        name: 'Sales Revenue',
        type: 'revenue',
        taxType: 'output',
        description: '',
        balance: 0,
      },
      isLoading: false,
      error: null,
    });

    render(<ChartOfAccountsEditPage />);

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/accounting/chart-of-accounts' });
    });
  });

  it('shows error message on mutation failure', async () => {
    mockMutate.mockImplementation((_data: unknown, opts: { onError?: (err: Error) => void }) => {
      opts.onError?.(new Error('Failed to update'));
    });

    mockUseAccount.mockReturnValue({
      data: {
        id: 'acc-1',
        code: '4-1000',
        name: 'Sales Revenue',
        type: 'revenue',
        taxType: 'output',
        description: '',
        balance: 0,
      },
      isLoading: false,
      error: null,
    });

    render(<ChartOfAccountsEditPage />);

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('error', 'Failed to update');
    });
  });

  it('navigates back on cancel button click', () => {
    mockUseAccount.mockReturnValue({
      data: {
        id: 'acc-1',
        code: '4-1000',
        name: 'Sales Revenue',
        type: 'revenue',
        taxType: 'output',
        description: '',
        balance: 0,
      },
      isLoading: false,
      error: null,
    });

    render(<ChartOfAccountsEditPage />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/accounting/chart-of-accounts' });
  });

  it('disables submit when required fields are empty', () => {
    mockUseAccount.mockReturnValue({
      data: {
        id: 'acc-1',
        code: '',
        name: '',
        type: 'revenue',
        taxType: 'none',
        description: '',
        balance: 0,
      },
      isLoading: false,
      error: null,
    });

    render(<ChartOfAccountsEditPage />);

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    expect(submitButton).toBeDisabled();
  });

  it('passes accountId to useAccount hook', () => {
    mockUseAccount.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(<ChartOfAccountsEditPage />);
    expect(mockUseAccount).toHaveBeenCalledWith('acc-1');
  });
});
