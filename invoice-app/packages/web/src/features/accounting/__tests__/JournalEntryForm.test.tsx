// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JournalEntryForm } from '../components/JournalEntryForm';
import type { ComboboxOption } from '../../../components/ui/Combobox';

const ACCOUNT_OPTIONS: ComboboxOption[] = [
  { value: '1', label: '4-0000 - Sales' },
  { value: '2', label: '6-0100 - Advertising' },
  { value: '3', label: '1-0000 - Bank Account' },
];

async function selectAccount(user: ReturnType<typeof userEvent.setup>, testId: string, label: string) {
  const input = screen.getByTestId(testId);
  await user.click(input);
  await user.click(screen.getByText(label));
}

describe('JournalEntryForm', () => {
  const defaultProps = {
    accountOptions: ACCOUNT_OPTIONS,
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  };

  it('renders date and narration inputs', () => {
    render(<JournalEntryForm {...defaultProps} />);

    expect(screen.getByLabelText('Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Narration')).toBeInTheDocument();
  });

  it('renders at least 2 journal lines by default', () => {
    render(<JournalEntryForm {...defaultProps} />);

    expect(screen.getByTestId('line-account-0')).toBeInTheDocument();
    expect(screen.getByTestId('line-account-1')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<JournalEntryForm {...defaultProps} />);

    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Debit')).toBeInTheDocument();
    expect(screen.getByText('Credit')).toBeInTheDocument();
  });

  it('can add a new line', async () => {
    const user = userEvent.setup();
    render(<JournalEntryForm {...defaultProps} />);

    await user.click(screen.getByText('+ Add Line'));

    expect(screen.getByTestId('line-account-2')).toBeInTheDocument();
  });

  it('can remove a line when more than 2 lines exist', async () => {
    const user = userEvent.setup();
    render(<JournalEntryForm {...defaultProps} />);

    // Add a third line
    await user.click(screen.getByText('+ Add Line'));
    expect(screen.getByTestId('line-account-2')).toBeInTheDocument();

    // Remove the third line
    await user.click(screen.getByLabelText('Remove line 3'));
    expect(screen.queryByTestId('line-account-2')).not.toBeInTheDocument();
  });

  it('cannot remove lines when only 2 remain', () => {
    render(<JournalEntryForm {...defaultProps} />);

    const removeButtons = screen.getAllByLabelText(/Remove line/);
    removeButtons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it('shows total debits and credits', async () => {
    const user = userEvent.setup();
    render(<JournalEntryForm {...defaultProps} />);

    const debitInput = screen.getByLabelText('Line 1 debit');
    await user.type(debitInput, '500');

    expect(screen.getByTestId('total-debits')).toHaveTextContent('$500.00');
  });

  it('validates that debits equal credits', async () => {
    const user = userEvent.setup();
    render(<JournalEntryForm {...defaultProps} />);

    // Select an account for line 1 via Combobox
    await selectAccount(user, 'line-account-0', '4-0000 - Sales');

    // Enter mismatched amounts
    const debitInput = screen.getByLabelText('Line 1 debit');
    await user.type(debitInput, '500');

    // Should show validation error
    expect(screen.getByText('Debits and credits must be equal')).toBeInTheDocument();
  });

  it('does not show validation error when balanced', async () => {
    const user = userEvent.setup();
    render(<JournalEntryForm {...defaultProps} />);

    // Select accounts via Combobox
    await selectAccount(user, 'line-account-0', '4-0000 - Sales');
    await selectAccount(user, 'line-account-1', '6-0100 - Advertising');

    // Enter balanced amounts
    await user.type(screen.getByLabelText('Line 1 debit'), '500');
    await user.type(screen.getByLabelText('Line 2 credit'), '500');

    expect(screen.queryByText('Debits and credits must be equal')).not.toBeInTheDocument();
  });

  it('renders "Save as draft" and "Post" buttons', () => {
    render(<JournalEntryForm {...defaultProps} />);

    expect(screen.getByTestId('save-draft-btn')).toBeInTheDocument();
    expect(screen.getByTestId('post-btn')).toBeInTheDocument();
  });

  it('"Save as draft" button is disabled when form is incomplete', () => {
    render(<JournalEntryForm {...defaultProps} />);

    expect(screen.getByTestId('save-draft-btn')).toBeDisabled();
  });

  it('"Post" button is disabled when form is incomplete', () => {
    render(<JournalEntryForm {...defaultProps} />);

    expect(screen.getByTestId('post-btn')).toBeDisabled();
  });

  it('calls onSubmit with status=draft when "Save as draft" clicked', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<JournalEntryForm {...defaultProps} onSubmit={onSubmit} />);

    // Fill date
    await user.type(screen.getByLabelText('Date'), '2024-01-15');

    // Fill narration
    await user.type(screen.getByLabelText('Narration'), 'Test journal');

    // Fill line 1
    await selectAccount(user, 'line-account-0', '4-0000 - Sales');
    await user.type(screen.getByLabelText('Line 1 description'), 'Debit entry');
    await user.type(screen.getByLabelText('Line 1 debit'), '1000');

    // Fill line 2
    await selectAccount(user, 'line-account-1', '1-0000 - Bank Account');
    await user.type(screen.getByLabelText('Line 2 description'), 'Credit entry');
    await user.type(screen.getByLabelText('Line 2 credit'), '1000');

    // Save as draft
    await user.click(screen.getByTestId('save-draft-btn'));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      date: '2024-01-15',
      narration: 'Test journal',
      status: 'draft',
      lines: [
        { accountId: '1', description: 'Debit entry', debit: 1000, credit: 0 },
        { accountId: '3', description: 'Credit entry', debit: 0, credit: 1000 },
      ],
    }));
  }, 15000);

  it('calls onSubmit with status=posted when "Post" clicked', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<JournalEntryForm {...defaultProps} onSubmit={onSubmit} />);

    // Fill date
    await user.type(screen.getByLabelText('Date'), '2024-01-15');
    await user.type(screen.getByLabelText('Narration'), 'Post journal');

    // Fill line 1
    await selectAccount(user, 'line-account-0', '4-0000 - Sales');
    await user.type(screen.getByLabelText('Line 1 debit'), '200');

    // Fill line 2
    await selectAccount(user, 'line-account-1', '1-0000 - Bank Account');
    await user.type(screen.getByLabelText('Line 2 credit'), '200');

    await user.click(screen.getByTestId('post-btn'));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      status: 'posted',
    }));
  }, 15000);

  it('calls onCancel when Cancel is clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<JournalEntryForm {...defaultProps} onCancel={onCancel} />);

    await user.click(screen.getByText('Cancel'));

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows loading state on submit buttons', () => {
    render(<JournalEntryForm {...defaultProps} loading={true} />);

    expect(screen.getByTestId('save-draft-btn')).toBeDisabled();
    expect(screen.getByTestId('post-btn')).toBeDisabled();
  });

  it('renders auto reversing date field', () => {
    render(<JournalEntryForm {...defaultProps} />);
    expect(screen.getByLabelText('Auto Reversing Date (optional)')).toBeInTheDocument();
  });

  it('renders cash basis checkbox', () => {
    render(<JournalEntryForm {...defaultProps} />);
    expect(screen.getByLabelText('Show journal on cash basis reports')).toBeInTheDocument();
  });

  it('shows difference indicator', () => {
    render(<JournalEntryForm {...defaultProps} />);
    expect(screen.getByTestId('balance-indicator')).toBeInTheDocument();
  });
});
