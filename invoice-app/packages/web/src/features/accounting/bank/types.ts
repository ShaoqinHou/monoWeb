/** Shape returned by GET /api/bank-transactions */
export interface ApiBankTransaction {
  id: string;
  accountId: string;
  date: string;
  description: string;
  reference: string | null;
  amount: number;
  isReconciled: boolean;
  matchedInvoiceId: string | null;
  matchedBillId: string | null;
  matchedPaymentId: string | null;
  category: string | null;
  createdAt: string;
}

/** Frontend-friendly transaction view */
export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number; // positive = in, negative = out
  status: 'matched' | 'unmatched';
  matchedTo?: { type: 'invoice' | 'bill'; id: string; reference: string };
}

export interface BankAccount {
  id: string;
  name: string;
  accountNumber: string; // account code from API
  balance: number;
  statementBalance: number;
}

export interface MatchSuggestionData {
  type: 'invoice' | 'bill';
  id: string;
  reference: string;
  amount: number;
  contact: string;
  confidence: number; // 0-1
}

export interface ReconcileParams {
  transactionId: string;
  matchType: 'invoice' | 'bill';
  matchId: string;
  matchReference: string;
  amount: number;
  date: string;
}

/** Parameters for CSV/manual import */
export interface ImportTransactionRow {
  date: string;
  description: string;
  amount: number;
  reference?: string;
}

export interface ImportParams {
  accountId: string;
  transactions: ImportTransactionRow[];
}

export interface ImportResult {
  imported: number;
}
