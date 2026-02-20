import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { TableRow, TableCell } from '../../../../components/ui/Table';
import { formatCurrency } from '@shared/calc/currency';
import { MatchSuggestion } from './MatchSuggestion';
import type { BankTransaction, MatchSuggestionData } from '../types';

interface ReconciliationRowProps {
  transaction: BankTransaction;
  suggestions: MatchSuggestionData[];
  onMatch: (transactionId: string, suggestion: MatchSuggestionData) => void;
  onCreate: (transactionId: string) => void;
  isMatching: boolean;
  isCreating: boolean;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function ReconciliationRow({
  transaction,
  suggestions,
  onMatch,
  onCreate,
  isMatching,
  isCreating,
}: ReconciliationRowProps) {
  const isInflow = transaction.amount > 0;

  return (
    <>
      <TableRow data-testid={`transaction-row-${transaction.id}`}>
        <TableCell>{formatDate(transaction.date)}</TableCell>
        <TableCell className="font-medium">{transaction.description}</TableCell>
        <TableCell className="text-right">
          {isInflow ? (
            <span className="text-green-600">{formatCurrency(transaction.amount)}</span>
          ) : null}
        </TableCell>
        <TableCell className="text-right">
          {!isInflow ? (
            <span className="text-red-600">{formatCurrency(Math.abs(transaction.amount))}</span>
          ) : null}
        </TableCell>
        <TableCell>
          <Badge variant={transaction.status === 'matched' ? 'success' : 'warning'}>
            {transaction.status === 'matched' ? 'Matched' : 'Unmatched'}
          </Badge>
          {transaction.matchedTo && (
            <span className="ml-2 text-xs text-gray-500">
              {transaction.matchedTo.reference}
            </span>
          )}
        </TableCell>
        <TableCell>
          {transaction.status === 'unmatched' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCreate(transaction.id)}
              loading={isCreating}
              data-testid={`create-btn-${transaction.id}`}
            >
              Create
            </Button>
          )}
        </TableCell>
      </TableRow>

      {/* Suggestion row for unmatched transactions */}
      {transaction.status === 'unmatched' && suggestions.length > 0 && (
        <TableRow>
          <TableCell colSpan={6} className="bg-gray-50 py-2">
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Suggested matches</p>
              {suggestions.map((suggestion) => (
                <MatchSuggestion
                  key={suggestion.id}
                  suggestion={suggestion}
                  onMatch={(s) => onMatch(transaction.id, s)}
                  isMatching={isMatching}
                />
              ))}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
