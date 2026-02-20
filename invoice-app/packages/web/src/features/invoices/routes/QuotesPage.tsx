import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { QuoteList } from '../components/QuoteList';
import { useQuotes } from '../hooks/useQuotes';
import { Search, Zap, SlidersHorizontal } from 'lucide-react';

const TAB_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'declined', label: 'Declined' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'invoiced', label: 'Invoiced' },
] as const;

export function QuotesPage() {
  const { data: quotes = [], isLoading } = useQuotes();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const q of quotes) {
      counts[q.status] = (counts[q.status] ?? 0) + 1;
    }
    return counts;
  }, [quotes]);

  const filteredQuotes = useMemo(() => {
    let result = quotes;
    if (activeTab !== 'all') {
      result = result.filter((q) => q.status === activeTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (quote) =>
          quote.quoteNumber?.toLowerCase().includes(q) ||
          quote.contactName.toLowerCase().includes(q),
      );
    }
    return result;
  }, [quotes, search, activeTab]);

  const handleQuoteClick = (id: string) => {
    navigate({ to: '/sales/quotes/$quoteId', params: { quoteId: id } });
  };

  const handleNewQuote = () => {
    navigate({ to: '/sales/quotes/new' });
  };

  return (
    <PageContainer
      title="Quotes"
      breadcrumbs={[{ label: 'Sales overview', href: '/sales' }, { label: 'Quotes' }]}
      actions={
        <div className="flex items-center gap-2">
          <a
            href="/sales/quotes/new"
            onClick={(e) => { e.preventDefault(); handleNewQuote(); }}
            className="inline-flex items-center rounded-md bg-[#0078c8] px-4 py-2 text-sm font-medium text-white hover:bg-[#005fa3]"
            data-testid="new-quote-button"
          >
            New quote
          </a>
          <Button variant="outline" size="sm" data-testid="shortcuts-button">
            <Zap className="h-4 w-4 mr-1" />
            Shortcuts
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Tabs */}
        <div
          className="flex border-b border-gray-200"
          role="tablist"
          aria-label="Quote status tabs"
          data-testid="quote-tabs"
        >
          {TAB_OPTIONS.map((tab) => {
            const count = tab.value === 'all' ? quotes.length : (statusCounts[tab.value] ?? 0);
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                role="tab"
                aria-selected={isActive}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                  isActive
                    ? 'border-[#0078c8] text-[#0078c8]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab(tab.value)}
                data-testid={`quote-tab-${tab.value}`}
              >
                {tab.label}
                {tab.value !== 'all' && (
                  <span className="ml-1 text-xs text-gray-400">({count})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startIcon={<Search className="h-4 w-4" />}
            data-testid="search-quotes"
            className="max-w-sm"
          />
          <Button variant="outline" size="sm" data-testid="quote-filter-button">
            <SlidersHorizontal className="h-4 w-4 mr-1" />
            Filter
          </Button>
        </div>

        <QuoteList
          quotes={filteredQuotes}
          onQuoteClick={handleQuoteClick}
          isLoading={isLoading}
        />
      </div>
    </PageContainer>
  );
}
