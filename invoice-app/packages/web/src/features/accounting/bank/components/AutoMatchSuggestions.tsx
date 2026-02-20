import { useState } from 'react';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { useAutoMatchSuggestions, useApplyAutoMatch } from '../hooks/useAutoMatch';
import type { AutoMatchSuggestion } from '../hooks/useAutoMatch';

interface AutoMatchSuggestionsProps {
  transactionId: string;
}

type ConfidenceGroup = 'high' | 'medium' | 'low';

function getConfidenceGroup(confidence: number): ConfidenceGroup {
  if (confidence > 80) return 'high';
  if (confidence >= 50) return 'medium';
  return 'low';
}

function getConfidenceBadgeVariant(group: ConfidenceGroup) {
  switch (group) {
    case 'high':
      return 'success' as const;
    case 'medium':
      return 'warning' as const;
    case 'low':
      return 'error' as const;
  }
}

function getConfidenceLabel(group: ConfidenceGroup) {
  switch (group) {
    case 'high':
      return 'High Confidence (>80%)';
    case 'medium':
      return 'Medium Confidence (50-80%)';
    case 'low':
      return 'Low Confidence (<50%)';
  }
}

function groupByConfidence(suggestions: AutoMatchSuggestion[]): Record<ConfidenceGroup, AutoMatchSuggestion[]> {
  const groups: Record<ConfidenceGroup, AutoMatchSuggestion[]> = {
    high: [],
    medium: [],
    low: [],
  };
  for (const s of suggestions) {
    groups[getConfidenceGroup(s.confidence)].push(s);
  }
  return groups;
}

export function AutoMatchSuggestions({ transactionId }: AutoMatchSuggestionsProps) {
  const { data: suggestions, isLoading } = useAutoMatchSuggestions(transactionId);
  const applyMutation = useApplyAutoMatch();
  const [ignoredRules, setIgnoredRules] = useState<Set<string>>(new Set());

  if (isLoading) {
    return <div data-testid="auto-match-loading">Loading suggestions...</div>;
  }

  const activeSuggestions = (suggestions ?? []).filter((s) => !ignoredRules.has(s.ruleId));

  if (activeSuggestions.length === 0) {
    return <div data-testid="auto-match-empty">No auto-match suggestions</div>;
  }

  const grouped = groupByConfidence(activeSuggestions);

  const handleApply = (suggestion: AutoMatchSuggestion) => {
    applyMutation.mutate({ transactionId, ruleId: suggestion.ruleId });
  };

  const handleIgnore = (ruleId: string) => {
    setIgnoredRules((prev) => new Set(prev).add(ruleId));
  };

  return (
    <div data-testid="auto-match-suggestions">
      {(['high', 'medium', 'low'] as const).map((group) => {
        const items = grouped[group];
        if (items.length === 0) return null;
        return (
          <div key={group} className="mb-4" data-testid={`confidence-group-${group}`}>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              {getConfidenceLabel(group)}
            </h4>
            <div className="space-y-2">
              {items.map((suggestion) => (
                <div
                  key={suggestion.ruleId}
                  className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded border"
                  data-testid={`suggestion-${suggestion.ruleId}`}
                >
                  <Badge variant={getConfidenceBadgeVariant(group)}>
                    {suggestion.confidence}%
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{suggestion.ruleName}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      Matched: {suggestion.matchedField}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      Account: {suggestion.accountCode}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleApply(suggestion)}
                    loading={applyMutation.isPending}
                    data-testid={`apply-btn-${suggestion.ruleId}`}
                  >
                    Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleIgnore(suggestion.ruleId)}
                    data-testid={`ignore-btn-${suggestion.ruleId}`}
                  >
                    Ignore
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
