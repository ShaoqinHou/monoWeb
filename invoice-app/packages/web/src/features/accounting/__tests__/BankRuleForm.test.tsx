// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BankRuleForm } from '../components/BankRuleForm';
import type { SelectOption } from '../../../components/ui/Select';

vi.mock('../../../components/ui/Combobox', () => ({
  Combobox: (props: Record<string, unknown>) => (
    <div>
      {props.label ? <label>{String(props.label)}</label> : null}
      <select
        value={props.value as string}
        onChange={(e) => (props.onChange as (v: string) => void)(e.target.value)}
        data-testid={props['data-testid'] as string}
      >
        {props.placeholder ? <option value="">{String(props.placeholder)}</option> : null}
        {(props.options as Array<{ value: string; label: string }>)?.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  ),
}));

const BANK_ACCOUNT_OPTIONS: SelectOption[] = [
  { value: 'bank-1', label: '1-0100 - Business Cheque Account' },
  { value: 'bank-2', label: '1-0200 - Savings Account' },
];

const ACCOUNT_CODE_OPTIONS: SelectOption[] = [
  { value: '6-0100', label: '6-0100 - Advertising' },
  { value: '6-0200', label: '6-0200 - Office Expenses' },
  { value: '6-0300', label: '6-0300 - Internet' },
];

describe('BankRuleForm', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  };

  // ── Fallback text inputs (no options provided) ─────────────────────────

  it('renders text inputs when no options are provided', () => {
    render(<BankRuleForm {...defaultProps} />);

    expect(screen.getByTestId('rule-account-input')).toBeInTheDocument();
    expect(screen.getByTestId('rule-allocate-code')).toBeInTheDocument();
  });

  it('renders text inputs when empty options are provided', () => {
    render(
      <BankRuleForm
        {...defaultProps}
        bankAccountOptions={[]}
        accountCodeOptions={[]}
      />,
    );

    expect(screen.getByTestId('rule-account-input')).toBeInTheDocument();
    expect(screen.getByTestId('rule-allocate-code')).toBeInTheDocument();
  });

  // ── Select dropdowns (options provided) ─────────────────────────────

  it('renders bank account select when bankAccountOptions are provided', () => {
    render(
      <BankRuleForm
        {...defaultProps}
        bankAccountOptions={BANK_ACCOUNT_OPTIONS}
      />,
    );

    expect(screen.getByTestId('rule-account-select')).toBeInTheDocument();
    expect(screen.queryByTestId('rule-account-input')).not.toBeInTheDocument();
  });

  it('renders account code select when accountCodeOptions are provided', () => {
    render(
      <BankRuleForm
        {...defaultProps}
        accountCodeOptions={ACCOUNT_CODE_OPTIONS}
      />,
    );

    expect(screen.getByTestId('rule-allocate-select')).toBeInTheDocument();
    expect(screen.queryByTestId('rule-allocate-code')).not.toBeInTheDocument();
  });

  it('renders bank account options in select dropdown', () => {
    render(
      <BankRuleForm
        {...defaultProps}
        bankAccountOptions={BANK_ACCOUNT_OPTIONS}
      />,
    );

    const select = screen.getByTestId('rule-account-select');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('1-0100 - Business Cheque Account')).toBeInTheDocument();
    expect(screen.getByText('1-0200 - Savings Account')).toBeInTheDocument();
  });

  it('renders account code options in select dropdown', () => {
    render(
      <BankRuleForm
        {...defaultProps}
        accountCodeOptions={ACCOUNT_CODE_OPTIONS}
      />,
    );

    const select = screen.getByTestId('rule-allocate-select');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('6-0100 - Advertising')).toBeInTheDocument();
    expect(screen.getByText('6-0200 - Office Expenses')).toBeInTheDocument();
    expect(screen.getByText('6-0300 - Internet')).toBeInTheDocument();
  });

  // ── Core form behavior ──────────────────────────────────────────────

  it('renders rule name input', () => {
    render(<BankRuleForm {...defaultProps} />);
    expect(screen.getByTestId('rule-name-input')).toBeInTheDocument();
  });

  it('renders match field and match type selects', () => {
    render(<BankRuleForm {...defaultProps} />);
    expect(screen.getByTestId('rule-match-field')).toBeInTheDocument();
    expect(screen.getByTestId('rule-match-type')).toBeInTheDocument();
  });

  it('renders match value input', () => {
    render(<BankRuleForm {...defaultProps} />);
    expect(screen.getByTestId('rule-match-value')).toBeInTheDocument();
  });

  it('submit button is disabled when form is empty', () => {
    render(<BankRuleForm {...defaultProps} />);
    const submitButton = screen.getByText('Save Rule');
    expect(submitButton).toBeDisabled();
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<BankRuleForm {...defaultProps} onCancel={onCancel} />);

    await user.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows loading state on submit button', () => {
    render(<BankRuleForm {...defaultProps} loading={true} />);
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('calls onSubmit with correct data using select dropdowns', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <BankRuleForm
        {...defaultProps}
        onSubmit={onSubmit}
        bankAccountOptions={BANK_ACCOUNT_OPTIONS}
        accountCodeOptions={ACCOUNT_CODE_OPTIONS}
      />,
    );

    // Fill rule name
    await user.type(screen.getByTestId('rule-name-input'), 'Office Supplies');

    // Select bank account
    await user.selectOptions(screen.getByTestId('rule-account-select'), 'bank-1');

    // Fill match value
    await user.type(screen.getByTestId('rule-match-value'), 'Staples');

    // Select allocate-to account
    await user.selectOptions(screen.getByTestId('rule-allocate-select'), '6-0200');

    // Submit
    await user.click(screen.getByText('Save Rule'));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Office Supplies',
      accountId: 'bank-1',
      matchField: 'description',
      matchType: 'contains',
      matchValue: 'Staples',
      allocateToAccountCode: '6-0200',
    });
  });

  it('calls onSubmit with correct data using text inputs (fallback)', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<BankRuleForm {...defaultProps} onSubmit={onSubmit} />);

    // Fill rule name
    await user.type(screen.getByTestId('rule-name-input'), 'Rent Payment');

    // Fill bank account ID
    await user.type(screen.getByTestId('rule-account-input'), 'bank-acc-1');

    // Fill match value
    await user.type(screen.getByTestId('rule-match-value'), 'RENT-MONTHLY');

    // Change match type
    await user.selectOptions(screen.getByTestId('rule-match-type'), 'equals');

    // Fill allocate-to code
    await user.type(screen.getByTestId('rule-allocate-code'), '6-0100');

    // Submit
    await user.click(screen.getByText('Save Rule'));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Rent Payment',
      accountId: 'bank-acc-1',
      matchField: 'description',
      matchType: 'equals',
      matchValue: 'RENT-MONTHLY',
      allocateToAccountCode: '6-0100',
    });
  });

  it('populates form with initialData', () => {
    render(
      <BankRuleForm
        {...defaultProps}
        initialData={{
          name: 'Existing Rule',
          accountId: 'bank-1',
          matchField: 'reference',
          matchType: 'equals',
          matchValue: 'REF-123',
          allocateToAccountCode: '6-0100',
        }}
        bankAccountOptions={BANK_ACCOUNT_OPTIONS}
        accountCodeOptions={ACCOUNT_CODE_OPTIONS}
      />,
    );

    expect(screen.getByTestId('rule-name-input')).toHaveValue('Existing Rule');
    expect(screen.getByTestId('rule-account-select')).toHaveValue('bank-1');
    expect(screen.getByTestId('rule-match-field')).toHaveValue('reference');
    expect(screen.getByTestId('rule-match-type')).toHaveValue('equals');
    expect(screen.getByTestId('rule-match-value')).toHaveValue('REF-123');
    expect(screen.getByTestId('rule-allocate-select')).toHaveValue('6-0100');
  });
});
