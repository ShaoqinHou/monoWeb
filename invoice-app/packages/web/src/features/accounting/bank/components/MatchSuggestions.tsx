import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { formatCurrency } from '@shared/calc/currency';
import { useMatchSuggestions } from '../hooks/useMatchSuggestions';
import type { MatchSuggestionData } from '../types';

interface MatchSuggestionsProps {
  transactionId: string;
  onAccept: (suggestion: MatchSuggestionData) => void;
  isAccepting: boolean;
}

export function MatchSuggestions({ transactionId, onAccept, isAccepting }: MatchSuggestionsProps) {
  const { data: suggestions, isLoading } = useMatchSuggestions(transactionId);

  if (isLoading) {
    return <div data-testid="match-suggestions-loading">Loading suggestions...</div>;
  }

  if (!suggestions || suggestions.length === 0) {
    return <div data-testid="match-suggestions-empty">No match suggestions found</div>;
  }

  return (
    <div data-testid="match-suggestions-list" className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700 mb-2">
        Smart Match Suggestions ({suggestions.length})
      </h4>
      {suggestions.map((suggestion) => {
        const confidencePercent = Math.round(suggestion.confidence * 100);
        return (
          <div
            key={suggestion.id}
            className="flex items-center gap-3 px-3 py-2 bg-blue-50 rounded border border-blue-200"
            data-testid={`suggestion-${suggestion.id}`}
          >
            <Badge variant="info">
              {suggestion.type === 'invoice' ? 'Invoice' : 'Bill'}
            </Badge>
            <span className="text-sm font-medium text-gray-900">{suggestion.reference}</span>
            <span className="text-sm text-gray-500">{suggestion.contact}</span>
            <span className="text-sm font-medium text-gray-900">{formatCurrency(suggestion.amount)}</span>
            <span className="text-xs text-gray-400">{confidencePercent}% match</span>
            <Button
              size="sm"
              variant="primary"
              onClick={() => onAccept(suggestion)}
              loading={isAccepting}
              data-testid={`accept-btn-${suggestion.id}`}
            >
              Accept
            </Button>
          </div>
        );
      })}
    </div>
  );
}
