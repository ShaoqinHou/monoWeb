// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// ── Mocks ───────────────────────────────────────────────────────────────────

const mockApiFetch = vi.fn();
const mockApiPost = vi.fn();

vi.mock('../../../../lib/api-helpers', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  apiPost: (...args: unknown[]) => mockApiPost(...args),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
}));

// ── Imports (after mocks) ───────────────────────────────────────────────────

import { AutoMatchSuggestions } from '../components/AutoMatchSuggestions';
import { CreateRuleFromTransaction } from '../components/CreateRuleFromTransaction';
import { SplitTransactionDialog } from '../components/SplitTransactionDialog';
import { BulkReconcileBar } from '../components/BulkReconcileBar';
import { ReconciliationSummary } from '../components/ReconciliationSummary';
import { validateSplitTotal, MAX_SPLIT_LINES } from '../hooks/useSplitTransaction';
import { generateRuleConditions } from '../hooks/useCreateRuleFromTransaction';
import { getReconciliationStatus } from '../hooks/useReconciliationSummary';
import type { AutoMatchSuggestion } from '../hooks/useAutoMatch';
import type { AccountReconciliationSummary } from '../hooks/useReconciliationSummary';

// ── Helpers ─────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

const mockSuggestions: AutoMatchSuggestion[] = [
  { ruleId: 'r1', ruleName: 'Office Supplies', accountCode: '400', confidence: 95, matchedField: 'description' },
  { ruleId: 'r2', ruleName: 'Rent Payment', accountCode: '410', confidence: 65, matchedField: 'amount' },
  { ruleId: 'r3', ruleName: 'Misc Expense', accountCode: '420', confidence: 30, matchedField: 'payee' },
];

const mockSummaries: AccountReconciliationSummary[] = [
  {
    accountId: 'acc-1',
    accountName: 'ANZ Business',
    statementBalance: 10000,
    xeroBalance: 10000,
    difference: 0,
    reconciledCount: 50,
    unreconciledCount: 0,
  },
  {
    accountId: 'acc-2',
    accountName: 'ASB Savings',
    statementBalance: 5000,
    xeroBalance: 4800,
    difference: 200,
    reconciledCount: 30,
    unreconciledCount: 10,
  },
  {
    accountId: 'acc-3',
    accountName: 'BNZ Cheque',
    statementBalance: 8000,
    xeroBalance: 7500,
    difference: 500,
    reconciledCount: 20,
    unreconciledCount: 25,
  },
];

beforeEach(() => {
  vi.restoreAllMocks();
  mockApiFetch.mockReset();
  mockApiPost.mockReset();
});

// ── 1. AutoMatchSuggestions ─────────────────────────────────────────────────

describe('AutoMatchSuggestions', () => {
  it('shows suggestions grouped by confidence level', async () => {
    mockApiFetch.mockResolvedValue(mockSuggestions);

    render(<AutoMatchSuggestions transactionId="tx-1" />, { wrapper: createWrapper() });

    // Wait for suggestions to load
    const container = await screen.findByTestId('auto-match-suggestions');
    expect(container).toBeInTheDocument();

    // Should have high, medium, low groups
    expect(screen.getByTestId('confidence-group-high')).toBeInTheDocument();
    expect(screen.getByTestId('confidence-group-medium')).toBeInTheDocument();
    expect(screen.getByTestId('confidence-group-low')).toBeInTheDocument();

    // High group has r1 (95%)
    const highGroup = screen.getByTestId('confidence-group-high');
    expect(within(highGroup).getByText('Office Supplies')).toBeInTheDocument();
    expect(within(highGroup).getByText('95%')).toBeInTheDocument();

    // Medium group has r2 (65%)
    const mediumGroup = screen.getByTestId('confidence-group-medium');
    expect(within(mediumGroup).getByText('Rent Payment')).toBeInTheDocument();

    // Low group has r3 (30%)
    const lowGroup = screen.getByTestId('confidence-group-low');
    expect(within(lowGroup).getByText('Misc Expense')).toBeInTheDocument();
  });

  it('calls apply mutation when Apply is clicked', async () => {
    mockApiFetch.mockResolvedValue(mockSuggestions);
    mockApiPost.mockResolvedValue({ success: true });

    render(<AutoMatchSuggestions transactionId="tx-1" />, { wrapper: createWrapper() });

    const applyBtn = await screen.findByTestId('apply-btn-r1');
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith(
        '/bank-transactions/tx-1/apply-rule',
        { ruleId: 'r1' },
      );
    });
  });

  it('removes suggestion when Ignore is clicked', async () => {
    mockApiFetch.mockResolvedValue(mockSuggestions);

    render(<AutoMatchSuggestions transactionId="tx-1" />, { wrapper: createWrapper() });

    await screen.findByTestId('auto-match-suggestions');
    expect(screen.getByTestId('suggestion-r1')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('ignore-btn-r1'));

    expect(screen.queryByTestId('suggestion-r1')).not.toBeInTheDocument();
  });

  it('shows empty state when no suggestions', async () => {
    mockApiFetch.mockResolvedValue([]);

    render(<AutoMatchSuggestions transactionId="tx-1" />, { wrapper: createWrapper() });

    const empty = await screen.findByTestId('auto-match-empty');
    expect(empty).toHaveTextContent('No auto-match suggestions');
  });
});

// ── 2. CreateRuleFromTransaction ────────────────────────────────────────────

describe('CreateRuleFromTransaction', () => {
  const transaction = {
    id: 'tx-1',
    date: '2026-02-10',
    description: 'Office Depot Supplies',
    amount: -150.00,
    status: 'unmatched' as const,
  };

  it('pre-fills form from transaction', () => {
    render(
      <CreateRuleFromTransaction transaction={transaction} open={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() },
    );

    // Dialog title
    expect(screen.getByText('Create Bank Rule')).toBeInTheDocument();

    // Pre-filled rule name
    const nameInput = screen.getByTestId('rule-name-input');
    expect(nameInput).toHaveValue('Rule for Office Depot Supplies');

    // Pre-generated conditions are visible
    expect(screen.getByTestId('condition-0')).toBeInTheDocument();

    // Match preview shows condition text
    const preview = screen.getByTestId('rule-preview');
    expect(preview).toHaveTextContent(/description.*contains.*Office Depot Supplies/);
  });

  it('generateRuleConditions creates conditions from transaction fields', () => {
    const conditions = generateRuleConditions({
      description: 'Rent Payment',
      amount: -1000,
      reference: 'REF-123',
    });

    expect(conditions).toHaveLength(3);
    expect(conditions[0]).toEqual({
      field: 'description',
      operator: 'contains',
      value: 'Rent Payment',
    });
    expect(conditions[1].field).toBe('amount');
    expect(conditions[1].operator).toBe('between');
    expect(conditions[2]).toEqual({
      field: 'reference',
      operator: 'contains',
      value: 'REF-123',
    });
  });
});

// ── 3. SplitTransactionDialog ───────────────────────────────────────────────

describe('SplitTransactionDialog', () => {
  it('validates that split total matches original amount', () => {
    const lines = [
      { accountCode: '400', amount: 60, taxRate: '15%', description: 'Part A' },
      { accountCode: '410', amount: 40, taxRate: '15%', description: 'Part B' },
    ];
    expect(validateSplitTotal(lines, 100)).toBeNull(); // valid

    const badLines = [
      { accountCode: '400', amount: 60, taxRate: '15%', description: 'Part A' },
      { accountCode: '410', amount: 30, taxRate: '15%', description: 'Part B' },
    ];
    const error = validateSplitTotal(badLines, 100);
    expect(error).toContain('does not match');
  });

  it('rejects more than MAX_SPLIT_LINES lines', () => {
    const tooManyLines = Array.from({ length: 11 }, (_, i) => ({
      accountCode: `${400 + i}`,
      amount: 10,
      taxRate: '15%',
      description: `Line ${i}`,
    }));
    const error = validateSplitTotal(tooManyLines, 110);
    expect(error).toContain(`Maximum ${MAX_SPLIT_LINES}`);
  });

  it('allows adding up to 10 split lines in the dialog', () => {
    render(
      <SplitTransactionDialog
        transactionId="tx-1"
        originalAmount={1000}
        open={true}
        onClose={vi.fn()}
      />,
      { wrapper: createWrapper() },
    );

    // Starts with 1 line
    expect(screen.getByTestId('split-line-0')).toBeInTheDocument();

    // Add lines up to 10
    const addBtn = screen.getByTestId('add-split-line-btn');
    for (let i = 0; i < 9; i++) {
      fireEvent.click(addBtn);
    }

    // Should have 10 lines
    expect(screen.getByTestId('split-line-9')).toBeInTheDocument();

    // Add button should be gone at 10
    expect(screen.queryByTestId('add-split-line-btn')).not.toBeInTheDocument();
  });

  it('shows validation error when totals do not match', () => {
    render(
      <SplitTransactionDialog
        transactionId="tx-1"
        originalAmount={100}
        open={true}
        onClose={vi.fn()}
      />,
      { wrapper: createWrapper() },
    );

    // The initial line has amount = originalAmount (100), so no error initially
    // Add a second line (amount 0) — this causes "cannot be zero" error
    fireEvent.click(screen.getByTestId('add-split-line-btn'));

    const errorEl = screen.getByTestId('split-validation-error');
    expect(errorEl).toBeInTheDocument();
  });
});

// ── 4. BulkReconcileBar ────────────────────────────────────────────────────

describe('BulkReconcileBar', () => {
  it('shows when items are selected with count and total', () => {
    render(
      <BulkReconcileBar
        selectedIds={['tx-1', 'tx-2', 'tx-3']}
        totalAmount={450.50}
        onClearSelection={vi.fn()}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByTestId('bulk-reconcile-bar')).toBeInTheDocument();
    expect(screen.getByTestId('bulk-selected-count')).toHaveTextContent('3 transactions selected');
    expect(screen.getByTestId('bulk-total-amount')).toHaveTextContent('Total: $450.50');
    expect(screen.getByTestId('reconcile-all-btn')).toBeInTheDocument();
    expect(screen.getByTestId('cancel-selection-btn')).toBeInTheDocument();
  });

  it('does not render when no items selected', () => {
    const { container } = render(
      <BulkReconcileBar
        selectedIds={[]}
        totalAmount={0}
        onClearSelection={vi.fn()}
      />,
      { wrapper: createWrapper() },
    );

    expect(container.innerHTML).toBe('');
  });

  it('calls bulk reconcile mutation when Reconcile All clicked', async () => {
    mockApiPost.mockResolvedValue({ reconciled: 3, failed: 0 });
    const onClear = vi.fn();

    render(
      <BulkReconcileBar
        selectedIds={['tx-1', 'tx-2', 'tx-3']}
        totalAmount={450.50}
        onClearSelection={onClear}
      />,
      { wrapper: createWrapper() },
    );

    fireEvent.click(screen.getByTestId('reconcile-all-btn'));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/bank-transactions/bulk-reconcile', {
        transactionIds: ['tx-1', 'tx-2', 'tx-3'],
      });
    });
  });

  it('calls onClearSelection when Cancel clicked', () => {
    const onClear = vi.fn();

    render(
      <BulkReconcileBar
        selectedIds={['tx-1']}
        totalAmount={100}
        onClearSelection={onClear}
      />,
      { wrapper: createWrapper() },
    );

    fireEvent.click(screen.getByTestId('cancel-selection-btn'));
    expect(onClear).toHaveBeenCalled();
  });
});

// ── 5. ReconciliationSummary ────────────────────────────────────────────────

describe('ReconciliationSummary', () => {
  it('shows per-account stats with balances and counts', async () => {
    mockApiFetch.mockResolvedValue(mockSummaries);

    render(<ReconciliationSummary />, { wrapper: createWrapper() });

    // Wait for data to load — find the first account element
    const acc1 = await screen.findByTestId('account-summary-acc-1');
    expect(within(acc1).getByText('ANZ Business')).toBeInTheDocument();
    expect(within(acc1).getByText(/Statement: \$10000\.00/)).toBeInTheDocument();
    expect(within(acc1).getByText(/Xero: \$10000\.00/)).toBeInTheDocument();
    expect(screen.getByTestId('reconciled-count-acc-1')).toHaveTextContent('50 reconciled');
    expect(screen.getByTestId('unreconciled-count-acc-1')).toHaveTextContent('0 unreconciled');

    // Third account: BNZ Cheque with discrepancy
    const acc3 = screen.getByTestId('account-summary-acc-3');
    expect(within(acc3).getByText('BNZ Cheque')).toBeInTheDocument();
    expect(screen.getByTestId('unreconciled-count-acc-3')).toHaveTextContent('25 unreconciled');
  });

  it('color-codes reconciliation status correctly', () => {
    // Fully reconciled
    const reconciled = getReconciliationStatus({
      accountId: 'a',
      accountName: 'A',
      statementBalance: 100,
      xeroBalance: 100,
      difference: 0,
      reconciledCount: 10,
      unreconciledCount: 0,
    });
    expect(reconciled).toBe('reconciled');

    // Partial (small difference, some unreconciled)
    const partial = getReconciliationStatus({
      accountId: 'b',
      accountName: 'B',
      statementBalance: 100,
      xeroBalance: 95,
      difference: 5,
      reconciledCount: 8,
      unreconciledCount: 2,
    });
    expect(partial).toBe('partial');

    // Large discrepancy
    const discrepancy = getReconciliationStatus({
      accountId: 'c',
      accountName: 'C',
      statementBalance: 10000,
      xeroBalance: 9000,
      difference: 1000,
      reconciledCount: 5,
      unreconciledCount: 20,
    });
    expect(discrepancy).toBe('discrepancy');
  });

  it('shows date range filter buttons', async () => {
    mockApiFetch.mockResolvedValue([]);

    render(<ReconciliationSummary />, { wrapper: createWrapper() });

    await screen.findByTestId('reconciliation-summary');

    expect(screen.getByTestId('date-filter-this-month')).toBeInTheDocument();
    expect(screen.getByTestId('date-filter-last-month')).toBeInTheDocument();
    expect(screen.getByTestId('date-filter-custom')).toBeInTheDocument();
  });
});
