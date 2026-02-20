import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { formatCurrency } from '@shared/calc/currency';
import type { MatchSuggestionData } from '../types';

interface MatchSuggestionProps {
  suggestion: MatchSuggestionData;
  onMatch: (suggestion: MatchSuggestionData) => void;
  isMatching: boolean;
}

export function MatchSuggestion({ suggestion, onMatch, isMatching }: MatchSuggestionProps) {
  const confidencePercent = Math.round(suggestion.confidence * 100);

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 bg-blue-50 rounded border border-blue-200"
      data-testid={`match-suggestion-${suggestion.id}`}
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
        onClick={() => onMatch(suggestion)}
        loading={isMatching}
        data-testid={`match-btn-${suggestion.id}`}
      >
        Match
      </Button>
    </div>
  );
}
