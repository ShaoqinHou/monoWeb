import { Card, CardHeader, CardContent } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead } from '../../../../components/ui/Table';
import { ReconciliationRow } from './ReconciliationRow';
import { useMatchSuggestions, useReconcileTransaction, useCreateTransaction } from '../hooks/useBank';
import type { BankTransaction, MatchSuggestionData } from '../types';

interface BankTransactionListProps {
  transactions: BankTransaction[] | undefined;
  isLoading: boolean;
}

function TransactionRowWithSuggestions({ transaction }: { transaction: BankTransaction }) {
  const suggestionsQuery = useMatchSuggestions(
    transaction.status === 'unmatched' ? transaction.id : '',
    transaction.status === 'unmatched' ? transaction : undefined,
  );
  const reconcileMutation = useReconcileTransaction();
  const createMutation = useCreateTransaction();

  const handleMatch = (transactionId: string, suggestion: MatchSuggestionData) => {
    reconcileMutation.mutate({
      transactionId,
      matchType: suggestion.type,
      matchId: suggestion.id,
      matchReference: suggestion.reference,
      amount: suggestion.amount,
      date: transaction.date,
    });
  };

  const handleCreate = (transactionId: string) => {
    createMutation.mutate({ transactionId, action: 'create' });
  };

  return (
    <ReconciliationRow
      transaction={transaction}
      suggestions={suggestionsQuery.data ?? []}
      onMatch={handleMatch}
      onCreate={handleCreate}
      isMatching={reconcileMutation.isPending}
      isCreating={createMutation.isPending}
    />
  );
}

export function BankTransactionList({ transactions, isLoading }: BankTransactionListProps) {
  const unmatchedCount = transactions?.filter((t) => t.status === 'unmatched').length ?? 0;

  return (
    <Card data-testid="bank-transaction-list">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Bank Transactions</h2>
            {unmatchedCount > 0 && (
              <Badge variant="warning" data-testid="unreconciled-badge">
                {unmatchedCount} unreconciled
              </Badge>
            )}
          </div>
          {transactions && (
            <span className="text-sm text-gray-500">
              {unmatchedCount} unmatched of {transactions.length} transactions
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6" data-testid="transactions-loading">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between py-3">
                <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : transactions && transactions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Money In</TableHead>
                <TableHead className="text-right">Money Out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TransactionRowWithSuggestions
                  key={transaction.id}
                  transaction={transaction}
                />
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-6 text-center text-gray-500" data-testid="no-transactions">
            No transactions to reconcile
          </div>
        )}
      </CardContent>
    </Card>
  );
}
