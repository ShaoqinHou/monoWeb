import { useState, useMemo } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ReportHeader } from '../components/ReportHeader';
import { DateRangePicker } from '../components/DateRangePicker';
import { ReportTable } from '../components/ReportTable';
import { ComparisonTable } from '../components/ComparisonTable';
import { ProfitLossChart } from '../components/ProfitLossChart';
import { BasisToggle, type AccountingBasis } from '../components/BasisToggle';
import { useProfitAndLoss } from '../hooks/useReports';
import { usePnlComparison, type CompareMode } from '../hooks/useReportComparison';
import { useExportCsv } from '../hooks/useExportCsv';
import {
  Save,
  ChevronLeft,
  ChevronRight,
  LayoutList,
  Plus,
  Download,
  Filter,
  MoreHorizontal,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import type { DateRange, ReportSection } from '../types';
import type { ProfitAndLossReport } from '../types';

const PNL_COMMON_FORMATS = [
  'Budget Variance',
  'Current and previous 3 months',
  'Current financial year by month',
  'Current financial year by month \u2013 actual and budget',
  'Month to date comparison',
  'Year to date comparison',
  'Compare Region',
];

const COMPARE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'prior-period', label: '1 period ago' },
  { value: 'same-period-last-year', label: 'Same period last year' },
  { value: 'budget', label: 'Budget' },
];

const TRACKING_CATEGORIES = [
  'None',
  'Region',
  'Department',
  'Activity/Project',
];

function getDefaultDateRange(): DateRange {
  const year = new Date().getFullYear();
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

function buildPnlSections(report: ProfitAndLossReport): ReportSection[] {
  return [
    {
      rows: [
        { label: 'Trading Income', type: 'header' },
        ...report.revenue.map((item) => ({
          label: item.accountName,
          amount: item.amount,
          type: 'item' as const,
          drillDown: true,
        })),
        { label: 'Total Trading Income', amount: report.totalRevenue, type: 'total', drillDown: true },
      ],
    },
    {
      rows: [
        { label: 'Cost of Sales', type: 'header' },
        ...report.costOfSales.map((item) => ({
          label: item.accountName,
          amount: item.amount,
          type: 'item' as const,
          drillDown: true,
        })),
        { label: 'Total Cost of Sales', amount: report.totalCostOfSales, type: 'total', drillDown: true },
      ],
    },
    {
      rows: [
        { label: 'Gross Profit', amount: report.grossProfit, type: 'grand-total', drillDown: true },
      ],
    },
    {
      rows: [
        { label: 'Operating Expenses', type: 'header' },
        ...report.operatingExpenses.map((item) => ({
          label: item.accountName,
          amount: item.amount,
          type: 'item' as const,
          drillDown: true,
        })),
        { label: 'Total Operating Expenses', amount: report.totalOperatingExpenses, type: 'total', drillDown: true },
      ],
    },
    {
      rows: [
        { label: 'Net Profit', amount: report.netProfit, type: 'grand-total', drillDown: true },
      ],
    },
  ];
}

function formatDateRangeSubtitle(range: DateRange): string {
  const from = new Date(range.from + 'T00:00:00');
  const to = new Date(range.to + 'T00:00:00');
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-NZ', { month: 'short', year: 'numeric' });
  return `For: ${fmt(from)} - ${fmt(to)}`;
}

interface ReportSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

function ReportSidebar({ collapsed, onToggle }: ReportSidebarProps) {
  return (
    <div
      className={`border-r border-gray-200 bg-gray-50 transition-all ${
        collapsed ? 'w-10' : 'w-64'
      } flex-shrink-0`}
      data-testid="report-sidebar"
    >
      <div className="flex items-center justify-end p-2">
        <button
          type="button"
          onClick={onToggle}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          data-testid="sidebar-toggle-btn"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <span>Minimise</span>
              <ChevronLeft className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
      {!collapsed && (
        <nav className="px-3 pb-4" data-testid="sidebar-content">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            Xero standard report
          </p>
          <a
            href="/reporting/profit-and-loss"
            className="block text-sm font-semibold text-[#0078c8] mb-4"
            data-testid="sidebar-pnl-link"
          >
            Profit and Loss
          </a>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            Common formats
          </p>
          <ul className="space-y-1 mb-4" data-testid="sidebar-common-formats">
            {PNL_COMMON_FORMATS.map((fmt) => (
              <li key={fmt}>
                <button
                  type="button"
                  className="w-full text-left text-sm text-gray-700 hover:text-[#0078c8] hover:bg-gray-100 px-2 py-1 rounded"
                  data-testid={`sidebar-format-${fmt.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {fmt}
                </button>
              </li>
            ))}
          </ul>
          <a
            href="#learn-custom-report"
            className="text-sm text-[#0078c8] hover:underline flex items-center gap-1"
            data-testid="sidebar-learn-link"
          >
            Learn how to create a custom report
            <ExternalLink className="w-3 h-3" />
          </a>
        </nav>
      )}
    </div>
  );
}

export function ProfitAndLossPage() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);
  const [compareWith, setCompareWith] = useState('none');
  const [trackingCategory, setTrackingCategory] = useState('None');
  const [basis, setBasis] = useState<AccountingBasis>('accrual');
  const [reportTitle, setReportTitle] = useState('Profit and Loss');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [compactView, setCompactView] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const compareEnabled = compareWith !== 'none';
  const compareMode: CompareMode = (compareWith === 'none' ? 'prior-period' : compareWith) as CompareMode;

  const { data: report, isLoading } = useProfitAndLoss(dateRange, basis);
  const { data: comparison } = usePnlComparison(dateRange, compareMode, compareEnabled);

  const sections = useMemo(
    () => (report ? buildPnlSections(report) : []),
    [report],
  );

  const priorSections = useMemo(
    () => (comparison?.prior ? buildPnlSections(comparison.prior) : []),
    [comparison],
  );

  const handleExport = useExportCsv(sections, `profit-and-loss-${dateRange.from}-${dateRange.to}.csv`);

  const subtitle = formatDateRangeSubtitle(dateRange);

  return (
    <PageContainer
      title="Profit and Loss"
      breadcrumbs={[
        { label: 'Reports', href: '/reporting' },
        { label: 'Profit and Loss' },
      ]}
    >
      <div className="flex" data-testid="pnl-layout">
        {/* Sidebar */}
        <ReportSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <ReportHeader title={reportTitle} subtitle={subtitle} onExport={handleExport}>
            <div className="flex items-center gap-4 flex-wrap">
              <DateRangePicker value={dateRange} onChange={setDateRange} />
              <BasisToggle basis={basis} onChange={setBasis} />

              {/* Compare with dropdown */}
              <div className="flex items-center gap-2" data-testid="compare-with-control">
                <label htmlFor="compare-with-select" className="text-sm text-gray-700 whitespace-nowrap">
                  Compare with
                </label>
                <select
                  id="compare-with-select"
                  value={compareWith}
                  onChange={(e) => setCompareWith(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-700"
                  data-testid="compare-with-select"
                >
                  {COMPARE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Compare tracking categories */}
              <div className="flex items-center gap-2" data-testid="tracking-category-control">
                <label htmlFor="tracking-category-select" className="text-sm text-gray-700 whitespace-nowrap">
                  Tracking
                </label>
                <select
                  id="tracking-category-select"
                  value={trackingCategory}
                  onChange={(e) => setTrackingCategory(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-700"
                  data-testid="tracking-category-select"
                >
                  {TRACKING_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter button */}
              <Button variant="outline" size="sm" data-testid="filter-btn">
                <Filter className="w-4 h-4 mr-1" />
                Filter
              </Button>

              {/* More button */}
              <Button variant="outline" size="sm" data-testid="more-btn">
                <MoreHorizontal className="w-4 h-4 mr-1" />
                More
              </Button>

              {/* Update button */}
              <Button variant="primary" size="sm" data-testid="update-btn">
                <RefreshCw className="w-4 h-4 mr-1" />
                Update
              </Button>

              {/* Save as button */}
              <Button variant="outline" size="sm" data-testid="save-as-btn">
                <Save className="w-4 h-4 mr-1" />
                Save as
              </Button>
            </div>
          </ReportHeader>

          {/* Editable report title */}
          <div className="mb-4" data-testid="editable-title">
            {isEditingTitle ? (
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditingTitle(false);
                }}
                className="text-xl font-bold text-gray-900 border-b-2 border-[#0078c8] outline-none bg-transparent"
                autoFocus
                data-testid="title-input"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingTitle(true)}
                className="text-xl font-bold text-gray-900 hover:text-[#0078c8] cursor-pointer"
                data-testid="title-display"
              >
                {reportTitle}
              </button>
            )}
          </div>

          {isLoading && <p className="text-gray-500">Loading report...</p>}

          {report && (
            <Card>
              <CardContent>
                <ProfitLossChart data={report} />
                {compareEnabled && comparison ? (
                  <ComparisonTable
                    currentSections={sections}
                    priorSections={priorSections}
                  />
                ) : (
                  <ReportTable sections={sections} drillDownEnabled />
                )}
              </CardContent>
            </Card>
          )}

          {/* Footer toolbar */}
          <div
            className="mt-4 flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-md"
            data-testid="report-footer-toolbar"
          >
            <Button variant="outline" size="sm" data-testid="edit-layout-btn">
              <LayoutList className="w-4 h-4 mr-1" />
              Edit layout
            </Button>
            <Button variant="outline" size="sm" data-testid="insert-content-btn">
              <Plus className="w-4 h-4 mr-1" />
              Insert content
            </Button>
            <label
              className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
              data-testid="compact-view-switch"
            >
              <span>Compact view</span>
              <button
                type="button"
                role="switch"
                aria-checked={compactView}
                onClick={() => setCompactView(!compactView)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  compactView ? 'bg-[#0078c8]' : 'bg-gray-300'
                }`}
                data-testid="compact-view-toggle"
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    compactView ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </label>
            <Button variant="outline" size="sm" onClick={handleExport} data-testid="footer-export-btn">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
