import { useEffect, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Search, User, FileText, ClipboardList, X, Loader2, Clock } from 'lucide-react';
import { useGlobalSearch } from '../../lib/useGlobalSearch';
import type { SearchResult } from '../../lib/useGlobalSearch';

export interface SearchOmnibarProps {
  open: boolean;
  onClose: () => void;
}

const TYPE_LABELS: Record<SearchResult['type'], string> = {
  contact: 'Contacts',
  invoice: 'Invoices',
  bill: 'Bills',
  quote: 'Quotes',
  'credit-note': 'Credit Notes',
  account: 'Accounts',
};

function TypeIcon({ type }: { type: SearchResult['type'] }) {
  switch (type) {
    case 'contact':
      return <User className="w-4 h-4 text-gray-400" />;
    case 'invoice':
      return <FileText className="w-4 h-4 text-blue-400" />;
    case 'bill':
      return <ClipboardList className="w-4 h-4 text-orange-400" />;
    default:
      return <FileText className="w-4 h-4 text-gray-400" />;
  }
}

function groupByType(results: SearchResult[]): Map<SearchResult['type'], SearchResult[]> {
  const groups = new Map<SearchResult['type'], SearchResult[]>();
  for (const result of results) {
    const existing = groups.get(result.type) || [];
    existing.push(result);
    groups.set(result.type, existing);
  }
  return groups;
}

export function SearchOmnibar({ open, onClose }: SearchOmnibarProps) {
  const { query, setQuery, results, isLoading, recentSearches, clearRecent } = useGlobalSearch();
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Flatten results for keyboard navigation
  const flatResults = results;

  // Auto-focus input when opened
  useEffect(() => {
    if (open) {
      setSelectedIndex(-1);
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    } else {
      setQuery('');
    }
  }, [open, setQuery]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  if (!open) {
    return null;
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => {
          if (flatResults.length === 0) return -1;
          return (prev + 1) % flatResults.length;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => {
          if (flatResults.length === 0) return -1;
          if (prev <= 0) return flatResults.length - 1;
          return prev - 1;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < flatResults.length) {
          const result = flatResults[selectedIndex];
          navigate({ to: result.href });
          onClose();
        }
        break;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    navigate({ to: result.href });
    onClose();
  };

  const handleRecentClick = (term: string) => {
    setQuery(term);
  };

  const grouped = groupByType(results);
  const hasQuery = query.length >= 2;
  const showNoResults = hasQuery && !isLoading && results.length === 0;
  const showRecent = !hasQuery && recentSearches.length > 0;

  // Track cumulative index for keyboard selection across groups
  let cumulativeIndex = 0;

  return (
    <div
      role="dialog"
      aria-label="Search"
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        data-testid="search-overlay"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Search Panel */}
      <div className="relative w-full max-w-xl bg-white rounded-lg shadow-2xl overflow-hidden z-10">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search invoices, contacts, bills..."
            className="flex-1 text-sm text-gray-900 placeholder-gray-400 bg-transparent outline-none"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded hover:bg-gray-100"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-mono text-gray-400 bg-gray-100 rounded border border-gray-200">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto">
          {/* Loading */}
          {isLoading && (
            <div className="flex items-center gap-2 px-4 py-8 text-sm text-gray-500 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching...
            </div>
          )}

          {/* No Results */}
          {showNoResults && (
            <div className="px-4 py-8 text-sm text-gray-500 text-center">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}

          {/* Recent Searches */}
          {showRecent && (
            <div className="py-2">
              <div className="flex items-center justify-between px-4 py-1.5">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Recent Searches
                </span>
                <button
                  onClick={clearRecent}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => handleRecentClick(term)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                >
                  <Clock className="w-4 h-4 text-gray-400" />
                  {term}
                </button>
              ))}
            </div>
          )}

          {/* Grouped Results */}
          {!isLoading && Array.from(grouped.entries()).map(([type, items]) => {
            const groupStart = cumulativeIndex;
            cumulativeIndex += items.length;

            return (
              <div key={type} className="py-1">
                <div className="px-4 py-1.5">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {TYPE_LABELS[type]}
                  </span>
                </div>
                {items.map((result, i) => {
                  const globalIdx = groupStart + i;
                  const isSelected = globalIdx === selectedIndex;

                  return (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors ${
                        isSelected ? 'bg-blue-50 text-blue-900' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      data-selected={isSelected}
                    >
                      <TypeIcon type={result.type} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{result.title}</div>
                        <div className="text-xs text-gray-500 truncate">{result.subtitle}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        {results.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
            <span>
              <kbd className="px-1 py-0.5 bg-gray-100 rounded border border-gray-200 font-mono">
                &uarr;&darr;
              </kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-gray-100 rounded border border-gray-200 font-mono">
                Enter
              </kbd>{' '}
              Open
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-gray-100 rounded border border-gray-200 font-mono">
                Esc
              </kbd>{' '}
              Close
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
