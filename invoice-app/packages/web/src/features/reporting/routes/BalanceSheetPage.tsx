import { useState, useMemo } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ReportHeader } from '../components/ReportHeader';
import { DateRangePicker } from '../components/DateRangePicker';
import { ReportTable } from '../components/ReportTable';
import { ComparisonTable } from '../components/ComparisonTable';
import { PeriodCompareToggle } from '../components/PeriodCompareToggle';
import { useBalanceSheet } from '../hooks/useReports';
import { useBsComparison, type CompareMode } from '../hooks/useReportComparison';
import { useExportCsv } from '../hooks/useExportCsv';
import { formatCurrency } from '@shared/calc/currency';
import { CheckCircle2, XCircle, Save, ChevronDown } from 'lucide-react';
import type { DateRange, ReportSection } from '../types';
import type { BalanceSheetReport } from '../types';

const BS_COMMON_FORMATS = [
  'Monthly comparison',
  'Quarterly comparison',
  'Yearly comparison',
];

function getDefaultAsAtDate(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

function getDefaultDateRange(): DateRange {
  const asAt = getDefaultAsAtDate();
  return { from: asAt, to: asAt };
}

function buildBalanceSheetSections(report: BalanceSheetReport): ReportSection[] {
  return [
    {
      rows: [
        { label: 'Assets', type: 'header' },
        { label: 'Current Assets', type: 'header', indent: 1 },
        ...report.currentAssets.map((item) => ({
          label: item.accountName,
          amount: item.amount,
          type: 'item' as const,
          indent: 2,
        })),
        { label: 'Total Current Assets', amount: report.totalCurrentAssets, type: 'total', indent: 1 },
        { label: 'Fixed Assets', type: 'header', indent: 1 },
        ...report.fixedAssets.map((item) => ({
          label: item.accountName,
          amount: item.amount,
          type: 'item' as const,
          indent: 2,
        })),
        { label: 'Total Fixed Assets', amount: report.totalFixedAssets, type: 'total', indent: 1 },
        { label: 'Total Assets', amount: report.totalAssets, type: 'grand-total' },
      ],
    },
    {
      rows: [
        { label: 'Liabilities', type: 'header' },
        { label: 'Current Liabilities', type: 'header', indent: 1 },
        ...report.currentLiabilities.map((item) => ({
          label: item.accountName,
          amount: item.amount,
          type: 'item' as const,
          indent: 2,
        })),
        { label: 'Total Current Liabilities', amount: report.totalCurrentLiabilities, type: 'total', indent: 1 },
        { label: 'Total Liabilities', amount: report.totalLiabilities, type: 'grand-total' },
      ],
    },
    {
      rows: [
        { label: 'Equity', type: 'header' },
        ...report.equity.map((item) => ({
          label: item.accountName,
          amount: item.amount,
          type: 'item' as const,
          indent: 1,
        })),
        { label: 'Total Equity', amount: report.totalEquity, type: 'total' },
      ],
    },
    {
      rows: [
        {
          label: 'Total Liabilities and Equity',
          amount: report.totalLiabilitiesAndEquity,
          type: 'grand-total',
        },
      ],
    },
  ];
}

function formatAsAtSubtitle(asAt: string): string {
  const date = new Date(asAt + 'T00:00:00');
  return `As at: ${date.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

function BalanceVerification({ report }: { report: BalanceSheetReport }) {
  const balanced = Math.abs(report.totalAssets - report.totalLiabilitiesAndEquity) < 0.01;
  return (
    <div
      className={`flex items-center gap-2 p-3 rounded-md mb-4 ${
        balanced ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
      }`}
      data-testid="balance-verification"
    >
      {balanced ? (
        <CheckCircle2 className="w-5 h-5 text-green-600" />
      ) : (
        <XCircle className="w-5 h-5 text-red-600" />
      )}
      <span className="text-sm font-medium">
        Assets ({formatCurrency(report.totalAssets)}) {balanced ? '=' : '\u2260'} Liabilities + Equity ({formatCurrency(report.totalLiabilitiesAndEquity)})
      </span>
      {balanced ? (
        <span className="text-sm text-green-600 ml-1">Balanced</span>
      ) : (
        <span className="text-sm text-red-600 ml-1">
          Difference: {formatCurrency(report.totalAssets - report.totalLiabilitiesAndEquity)}
        </span>
      )}
    </div>
  );
}

export function BalanceSheetPage() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [compareMode, setCompareMode] = useState<CompareMode>('prior-period');
  const [reportTitle, setReportTitle] = useState('Balance Sheet');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showFormatsMenu, setShowFormatsMenu] = useState(false);
  const asAt = dateRange.to;
  const { data: report, isLoading } = useBalanceSheet(asAt);
  const { data: comparison } = useBsComparison(asAt, compareMode, compareEnabled);

  const sections = useMemo(
    () => (report ? buildBalanceSheetSections(report) : []),
    [report],
  );

  const priorSections = useMemo(
    () => (comparison?.prior ? buildBalanceSheetSections(comparison.prior) : []),
    [comparison],
  );

  const handleExport = useExportCsv(sections, `balance-sheet-${asAt}.csv`);

  const subtitle = formatAsAtSubtitle(asAt);

  return (
    <PageContainer
      title="Balance Sheet"
      breadcrumbs={[
        { label: 'Reports', href: '/reporting' },
        { label: 'Balance Sheet' },
      ]}
    >
      <ReportHeader title={reportTitle} subtitle={subtitle} onExport={handleExport}>
        <div className="flex items-center gap-4 flex-wrap">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <PeriodCompareToggle
            enabled={compareEnabled}
            onChange={setCompareEnabled}
            compareMode={compareMode}
            onCompareModeChange={setCompareMode}
          />
          {/* Save as button */}
          <Button variant="outline" size="sm" data-testid="save-as-btn">
            <Save className="w-4 h-4 mr-1" />
            Save as
          </Button>
          {/* Common Formats dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFormatsMenu(!showFormatsMenu)}
              data-testid="common-formats-btn"
            >
              Common Formats
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
            {showFormatsMenu && (
              <div
                className="absolute z-10 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg py-1"
                data-testid="common-formats-menu"
              >
                {BS_COMMON_FORMATS.map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowFormatsMenu(false)}
                    data-testid={`format-${fmt.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            )}
          </div>
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
        <>
          <BalanceVerification report={report} />
          <Card>
            <CardContent>
              {compareEnabled && comparison ? (
                <ComparisonTable
                  currentSections={sections}
                  priorSections={priorSections}
                />
              ) : (
                <ReportTable sections={sections} />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </PageContainer>
  );
}
