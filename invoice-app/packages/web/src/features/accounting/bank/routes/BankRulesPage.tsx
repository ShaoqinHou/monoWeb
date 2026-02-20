import { useState, useCallback } from 'react';
import { PageContainer } from '../../../../components/layout/PageContainer';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { NotImplemented } from '../../../../components/patterns/NotImplemented';

interface BankRule {
  id: string;
  name: string;
  condition: string;
  order: number;
}

type RuleTab = 'spend' | 'receive' | 'transfer';

const TAB_LABELS: Record<RuleTab, string> = {
  spend: 'Spend money rules',
  receive: 'Receive money rules',
  transfer: 'Transfer money rules',
};

// Placeholder rules for demo
const DEMO_RULES: Record<RuleTab, BankRule[]> = {
  spend: [
    { id: 'r1', name: 'Office Supplies', condition: 'Contains "Staples"', order: 1 },
    { id: 'r2', name: 'Internet Subscription', condition: 'Contains "ISP"', order: 2 },
  ],
  receive: [
    { id: 'r3', name: 'Client Payment', condition: 'Contains "Invoice"', order: 1 },
  ],
  transfer: [],
};

export function BankRulesPage() {
  const [activeTab, setActiveTab] = useState<RuleTab>('spend');
  const [search, setSearch] = useState('');
  const [rules, setRules] = useState<Record<RuleTab, BankRule[]>>(DEMO_RULES);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const filteredRules = rules[activeTab].filter((rule) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return rule.name.toLowerCase().includes(q) || rule.condition.toLowerCase().includes(q);
  });

  const handleClearSearch = () => setSearch('');

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    setRules((prev) => {
      const tabRules = [...prev[activeTab]];
      const [moved] = tabRules.splice(dragIndex, 1);
      tabRules.splice(index, 0, moved);
      // Reassign order numbers
      const reordered = tabRules.map((r, i) => ({ ...r, order: i + 1 }));
      return { ...prev, [activeTab]: reordered };
    });
    setDragIndex(index);
  }, [dragIndex, activeTab]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
  }, []);

  return (
    <PageContainer
      title="Bank rules"
      breadcrumbs={[
        { label: 'Bank accounts', href: '/bank' },
        { label: 'Bank rules' },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <NotImplemented label="Reconcile — not yet implemented">
            <Button variant="outline" size="sm" data-testid="reconcile-btn">Reconcile</Button>
          </NotImplemented>
          <NotImplemented label="Create rule — not yet implemented">
            <Button variant="primary" size="sm" data-testid="create-rule-btn">Create rule</Button>
          </NotImplemented>
        </div>
      }
    >
      <div className="space-y-4" data-testid="bank-rules-page">
        {/* Help banner */}
        <div
          className="rounded-md border border-blue-200 bg-blue-50 p-4"
          data-testid="bank-rules-help-banner"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900">
                Automate your bank reconciliation
              </h3>
              <p className="mt-1 text-sm text-blue-700">
                Bank rules automatically categorize transactions as they come in. Set conditions to
                match transaction descriptions and assign accounts, tax rates, and tracking categories.
              </p>
              <a
                href="#bank-rules-video"
                className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline"
                data-testid="bank-rules-video-link"
              >
                Watch video: How bank rules work
              </a>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200" data-testid="bank-rules-tabs">
          <nav className="-mb-px flex gap-6">
            {(Object.keys(TAB_LABELS) as RuleTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap border-b-2 pb-3 text-sm font-medium ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
                data-testid={`tab-${tab}`}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </nav>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2" data-testid="bank-rules-search">
          <div className="flex-1">
            <Input
              placeholder="Search bank rules by name or condition"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="bank-rules-search-input"
            />
          </div>
          {search && (
            <Button
              variant="outline"
              onClick={handleClearSearch}
              data-testid="bank-rules-search-clear"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Rules list with drag-and-drop reorder */}
        <div className="space-y-1" data-testid="bank-rules-list">
          {filteredRules.length === 0 && (
            <div className="py-8 text-center text-sm text-gray-500" data-testid="no-rules">
              No {TAB_LABELS[activeTab].toLowerCase()} found.
            </div>
          )}
          {filteredRules.map((rule, index) => (
            <div
              key={rule.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 rounded-md border border-gray-200 bg-white px-4 py-3 ${
                dragIndex === index ? 'opacity-50' : ''
              }`}
              data-testid={`rule-row-${rule.id}`}
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600"
                data-testid={`rule-badge-${rule.id}`}
              >
                {rule.order}
              </span>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                <div className="text-xs text-gray-500">{rule.condition}</div>
              </div>
              <span className="cursor-grab text-gray-400" data-testid={`rule-drag-${rule.id}`}>
                &#x2630;
              </span>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
