import type { Account } from '../../../../shared/schemas/account';

/** Account with a computed balance for display */
export interface AccountWithBalance extends Account {
  balance: number;
  reportCode?: string;
}

/** Grouped accounts by type for the chart of accounts view */
export interface AccountGroup {
  type: Account['type'];
  label: string;
  accounts: AccountWithBalance[];
}

/** Bank account card data */
export interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  balance: number;
  recentTransactionCount: number;
}

/** Journal entry status */
export type JournalStatus = 'draft' | 'posted' | 'voided';

/** A single line in a journal entry */
export interface JournalLine {
  id: string;
  accountId: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
}

/** A complete journal entry */
export interface JournalEntry {
  id: string;
  date: string;
  narration: string;
  status: JournalStatus;
  lines: JournalLine[];
}

/** Display labels for account types */
export const ACCOUNT_TYPE_LABELS: Record<Account['type'], string> = {
  revenue: 'Revenue',
  expense: 'Expenses',
  asset: 'Assets',
  liability: 'Liabilities',
  equity: 'Equity',
};

/** Sort order for account type sections */
export const ACCOUNT_TYPE_ORDER: Account['type'][] = [
  'revenue',
  'expense',
  'asset',
  'liability',
  'equity',
];
