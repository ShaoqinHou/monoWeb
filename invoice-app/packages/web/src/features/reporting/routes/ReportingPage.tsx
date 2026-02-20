import { useState, useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import {
  BarChart3,
  FileSpreadsheet,
  Clock,
  CreditCard,
  Receipt,
  LayoutDashboard,
  Users,
  Landmark,
  PiggyBank,
  Search,
  Star,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Briefcase,
  Calculator,
  ArrowLeftRight,
} from 'lucide-react';
import type { ReportCardInfo } from '../types';
import type { ReactNode } from 'react';

type XeroCategory =
  | 'favourites'
  | 'financial-performance'
  | 'financial-statements'
  | 'payables-receivables'
  | 'payroll'
  | 'projects'
  | 'reconciliations'
  | 'taxes-balances'
  | 'transactions';

interface ExtendedReportCard extends ReportCardInfo {
  xeroCategory: XeroCategory;
}

const CATEGORY_ORDER: XeroCategory[] = [
  'favourites',
  'financial-performance',
  'financial-statements',
  'payables-receivables',
  'payroll',
  'projects',
  'reconciliations',
  'taxes-balances',
  'transactions',
];

const XERO_CATEGORY_LABELS: Record<XeroCategory, string> = {
  'favourites': 'Favourites',
  'financial-performance': 'Financial performance',
  'financial-statements': 'Financial statements',
  'payables-receivables': 'Payables and receivables',
  'payroll': 'Payroll',
  'projects': 'Projects',
  'reconciliations': 'Reconciliations',
  'taxes-balances': 'Taxes and balances',
  'transactions': 'Transactions',
};

const XERO_CATEGORY_ICONS: Record<XeroCategory, ReactNode> = {
  'favourites': <Star className="w-5 h-5 text-[#f59e0b]" />,
  'financial-performance': <BarChart3 className="w-5 h-5 text-[#0078c8]" />,
  'financial-statements': <FileSpreadsheet className="w-5 h-5 text-[#0078c8]" />,
  'payables-receivables': <ArrowLeftRight className="w-5 h-5 text-[#14b8a6]" />,
  'payroll': <Users className="w-5 h-5 text-[#ec4899]" />,
  'projects': <Briefcase className="w-5 h-5 text-[#8b5cf6]" />,
  'reconciliations': <Landmark className="w-5 h-5 text-[#10b981]" />,
  'taxes-balances': <Calculator className="w-5 h-5 text-[#f97316]" />,
  'transactions': <Receipt className="w-5 h-5 text-[#6b7280]" />,
};

const REPORT_CARDS: ExtendedReportCard[] = [
  // --- Financial performance ---
  {
    title: 'Business Snapshot',
    description: 'Key financial metrics and trends at a glance',
    href: '/reporting/business-snapshot',
    category: 'overview',
    xeroCategory: 'financial-performance',
  },
  {
    title: 'Executive Summary',
    description: 'High-level P&L, balance sheet, and cash position summary',
    href: '/reporting/executive-summary',
    category: 'overview',
    xeroCategory: 'financial-performance',
  },
  {
    title: 'Budgets',
    description: 'Create and compare budgets against actuals',
    href: '/reporting/budgets',
    category: 'budgets',
    xeroCategory: 'financial-performance',
  },

  // --- Financial statements ---
  {
    title: 'Profit and Loss',
    description: 'Shows revenue, expenses, and net profit over a period',
    href: '/reporting/profit-and-loss',
    category: 'financial',
    xeroCategory: 'financial-statements',
  },
  {
    title: 'Balance Sheet',
    description: 'Shows assets, liabilities, and equity at a point in time',
    href: '/reporting/balance-sheet',
    category: 'financial',
    xeroCategory: 'financial-statements',
  },
  {
    title: 'Trial Balance',
    description: 'All accounts with debit and credit balances at a point in time',
    href: '/reporting/trial-balance',
    category: 'financial',
    xeroCategory: 'financial-statements',
  },
  {
    title: 'Cash Flow Forecast',
    description: 'Projected cash inflows and outflows over the coming weeks',
    href: '/reporting/cash-flow-forecast',
    category: 'financial',
    xeroCategory: 'financial-statements',
  },

  // --- Payables and receivables ---
  {
    title: 'Aged Receivables',
    description: 'Outstanding customer invoices grouped by age',
    href: '/reporting/aged-receivables',
    category: 'receivables',
    xeroCategory: 'payables-receivables',
  },
  {
    title: 'Aged Payables',
    description: 'Outstanding supplier bills grouped by age',
    href: '/reporting/aged-payables',
    category: 'payables',
    xeroCategory: 'payables-receivables',
  },

  // --- Payroll ---
  {
    title: 'Payroll Report',
    description: 'Gross pay, PAYE, KiwiSaver, and net pay by period',
    href: '/reporting/payroll-report',
    category: 'payroll',
    xeroCategory: 'payroll',
  },

  // --- Reconciliations ---
  {
    title: 'Bank Reconciliation',
    description: 'Reconciled vs unreconciled totals for each bank account',
    href: '/reporting/bank-reconciliation',
    category: 'bank',
    xeroCategory: 'reconciliations',
  },

  // --- Taxes and balances ---
  {
    title: 'GST Return',
    description: 'GST collected and paid for a tax period',
    href: '/tax/gst-returns',
    category: 'tax',
    xeroCategory: 'taxes-balances',
  },

  // --- Transactions ---
  {
    title: 'Account Transactions',
    description: 'Detailed transactions for a specific account over a period',
    href: '/reporting/account-transactions',
    category: 'tax',
    xeroCategory: 'transactions',
  },
];

function groupByXeroCategory(cards: ExtendedReportCard[]) {
  const groups: Record<string, ExtendedReportCard[]> = {};
  for (const card of cards) {
    if (!groups[card.xeroCategory]) {
      groups[card.xeroCategory] = [];
    }
    groups[card.xeroCategory].push(card);
  }
  return groups;
}

export function ReportingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDescriptions, setShowDescriptions] = useState(true);
  const [favourites, setFavourites] = useState<Set<string>>(
    () => new Set(['Profit and Loss', 'Balance Sheet']),
  );
  const [collapsedCategories, setCollapsedCategories] = useState<Set<XeroCategory>>(
    () => new Set(),
  );

  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return REPORT_CARDS;
    const q = searchQuery.toLowerCase();
    return REPORT_CARDS.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  const favouriteCards: ExtendedReportCard[] = useMemo(
    () => filteredCards.filter((c) => favourites.has(c.title)),
    [filteredCards, favourites],
  );

  const groups = useMemo(() => groupByXeroCategory(filteredCards), [filteredCards]);

  function toggleFavourite(title: string) {
    setFavourites((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  }

  function toggleCategory(cat: XeroCategory) {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }

  function renderReportCard(card: ExtendedReportCard) {
    const isFav = favourites.has(card.title);
    return (
      <div key={card.title} className="relative group/card">
        <Link
          to={card.href}
          className="block group"
          data-testid={`report-card-${card.title.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <Card className="h-full transition-shadow group-hover:shadow-md">
            <CardContent className="flex items-start gap-3">
              <div className="mt-0.5">
                <FileSpreadsheet className="w-8 h-8 text-[#0078c8]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 group-hover:text-[#0078c8] transition-colors">
                  {card.title}
                </h3>
                {showDescriptions && (
                  <p className="text-sm text-gray-500 mt-1">
                    {card.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
        {/* Favourite button */}
        <button
          type="button"
          className="absolute top-3 right-10 p-1 rounded hover:bg-gray-100"
          onClick={(e) => {
            e.preventDefault();
            toggleFavourite(card.title);
          }}
          aria-label={isFav ? `Unfavourite ${card.title}` : `Favourite ${card.title}`}
          data-testid={`favourite-btn-${card.title.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <Star
            className={`w-4 h-4 ${isFav ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`}
          />
        </button>
        {/* More options button */}
        <button
          type="button"
          className="absolute top-3 right-3 p-1 rounded hover:bg-gray-100"
          aria-label={`More options for ${card.title}`}
          data-testid={`more-options-${card.title.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    );
  }

  return (
    <PageContainer title="Reports">
      {/* Search and controls toolbar */}
      <div className="flex items-center gap-4 mb-6" data-testid="reports-toolbar">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Find a report"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0078c8] focus:border-transparent"
            data-testid="report-search"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer" data-testid="show-descriptions-toggle">
          <input
            type="checkbox"
            checked={showDescriptions}
            onChange={(e) => setShowDescriptions(e.target.checked)}
            className="rounded border-gray-300"
          />
          Show descriptions
        </label>
      </div>

      {/* Favourites section */}
      {favouriteCards.length > 0 && (
        <div className="mb-8" data-testid="favourites-section">
          <button
            type="button"
            onClick={() => toggleCategory('favourites')}
            className="flex items-center gap-2 text-lg font-semibold text-gray-700 mb-3 hover:text-gray-900"
          >
            {collapsedCategories.has('favourites') ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {XERO_CATEGORY_ICONS['favourites']}
            {XERO_CATEGORY_LABELS['favourites']}
          </button>
          {!collapsedCategories.has('favourites') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {favouriteCards.map(renderReportCard)}
            </div>
          )}
        </div>
      )}

      {/* Category sections */}
      {CATEGORY_ORDER.filter((cat) => cat !== 'favourites').map((category) => {
        const cards = groups[category];
        if (!cards || cards.length === 0) return null;
        const isCollapsed = collapsedCategories.has(category);
        return (
          <div key={category} className="mb-8" data-testid={`category-${category}`}>
            <button
              type="button"
              onClick={() => toggleCategory(category)}
              className="flex items-center gap-2 text-lg font-semibold text-gray-700 mb-3 hover:text-gray-900"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              {XERO_CATEGORY_ICONS[category]}
              {XERO_CATEGORY_LABELS[category]}
            </button>
            {!isCollapsed && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map(renderReportCard)}
              </div>
            )}
          </div>
        );
      })}
    </PageContainer>
  );
}

// Re-export sub-pages so router can import all from this file
export { ProfitAndLossPage } from './ProfitAndLossPage';
export { BalanceSheetPage } from './BalanceSheetPage';
export { AgedReceivablesPage } from './AgedReceivablesPage';
export { AgedPayablesPage } from './AgedPayablesPage';
export { TrialBalancePage } from './TrialBalancePage';
export { CashFlowForecastPage } from './CashFlowForecastPage';
export { AccountTransactionsPage } from './AccountTransactionsPage';
export { BusinessSnapshotPage } from './BusinessSnapshotPage';
export { BudgetsPage } from './BudgetsPage';
export { ExecutiveSummaryPage } from './ExecutiveSummaryPage';
export { PayrollReportPage } from './PayrollReportPage';
export { BankReconciliationReportPage } from './BankReconciliationReportPage';
