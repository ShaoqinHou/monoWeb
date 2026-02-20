import { useState, useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { ReportHeader } from '../components/ReportHeader';
import { CashFlowForecast } from '../components/CashFlowForecast';
import type { CashFlowPeriod } from '../components/CashFlowForecast';
import { useCashFlowForecast } from '../hooks/useReports';
import { downloadCsv } from '../hooks/useExportCsv';
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  FileText,
  Receipt,
} from 'lucide-react';

const FORECAST_OPTIONS = [
  { value: '30', label: 'Next 30 days' },
  { value: '60', label: 'Next 60 days' },
  { value: '90', label: 'Next 90 days' },
];

const MOCK_WEEKLY_BREAKDOWN = [
  {
    week: 'This week',
    contacts: [
      { name: 'Acme Corp', invoicesDue: 5200, billsToPay: 0 },
      { name: 'Widget Co', invoicesDue: 3100, billsToPay: 0 },
    ],
    projectedBalance: 57000,
  },
  {
    week: 'Next week',
    contacts: [
      { name: 'Supplies Ltd', invoicesDue: 0, billsToPay: 4500 },
      { name: 'Tech Partners', invoicesDue: 8000, billsToPay: 0 },
    ],
    projectedBalance: 60500,
  },
  {
    week: 'Week 3',
    contacts: [
      { name: 'Office Depot', invoicesDue: 0, billsToPay: 2200 },
    ],
    projectedBalance: 58300,
  },
];

const MOCK_SUGGESTED_ACTIONS = {
  overdueInvoices: { count: 5, total: 12400 },
  overdueBills: { count: 3, total: 8200 },
};

function cashFlowToCsv(
  periods: CashFlowPeriod[],
  openingBalance: number,
  closingBalance: number,
): string {
  const lines: string[] = [
    'Period,Receivables (In),Payables (Out),Net Flow,Running Balance',
  ];
  for (const period of periods) {
    const label = period.label.includes(',') ? `"${period.label}"` : period.label;
    lines.push(
      `${label},${period.receivables.toFixed(2)},${period.payables.toFixed(2)},${period.netFlow.toFixed(2)},${period.runningBalance.toFixed(2)}`,
    );
  }
  lines.push(`Opening Balance,,,,${openingBalance.toFixed(2)}`);
  lines.push(`Closing Balance,,,,${closingBalance.toFixed(2)}`);
  return lines.join('\n');
}

export function CashFlowForecastPage() {
  const [days, setDays] = useState('30');
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(() => new Set());
  const { data: forecast, isLoading } = useCashFlowForecast(Number(days));

  const handleDaysChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setDays(e.target.value);
    },
    [],
  );

  const handleExport = useCallback(() => {
    if (!forecast) return;
    const csv = cashFlowToCsv(forecast.periods, forecast.openingBalance, forecast.closingBalance);
    downloadCsv(csv, `cash-flow-forecast-${days}days.csv`);
  }, [forecast, days]);

  function toggleWeek(week: string) {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(week)) {
        next.delete(week);
      } else {
        next.add(week);
      }
      return next;
    });
  }

  const subtitle = `Projected cash flow for the next ${days} days`;

  return (
    <PageContainer
      title="Cash Flow Forecast"
      breadcrumbs={[
        { label: 'Reports', href: '/reporting' },
        { label: 'Cash Flow Forecast' },
      ]}
    >
      <ReportHeader title="Cash Flow Forecast" subtitle={subtitle} onExport={handleExport}>
        <div className="w-44" data-testid="forecast-period-picker">
          <Select
            label="Forecast Period"
            selectId="forecast-period"
            options={FORECAST_OPTIONS}
            value={days}
            onChange={handleDaysChange}
          />
        </div>
      </ReportHeader>

      {isLoading && <p className="text-gray-500">Loading forecast...</p>}

      {forecast && (
        <>
          {/* Projection chart with Today marker */}
          <Card className="mb-6">
            <CardContent>
              <div className="relative" data-testid="projection-chart">
                <div className="h-48 bg-gray-50 rounded flex items-center justify-center relative">
                  <div className="text-sm text-gray-400">Cash flow projection chart</div>
                  {/* Today marker */}
                  <div
                    className="absolute top-0 bottom-0 left-1/4 w-px bg-red-500"
                    data-testid="today-marker"
                  />
                  <div className="absolute top-1 left-1/4 -translate-x-1/2 text-xs text-red-500 font-medium" data-testid="today-label">
                    Today
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Forecast table */}
          <Card className="mb-6">
            <CardContent>
              <CashFlowForecast
                periods={forecast.periods}
                openingBalance={forecast.openingBalance}
                closingBalance={forecast.closingBalance}
              />
            </CardContent>
          </Card>

          {/* Weekly breakdown with collapsible contact rows */}
          <Card className="mb-6" data-testid="weekly-breakdown">
            <CardContent>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Weekly Breakdown</h3>
              <div className="space-y-2">
                {MOCK_WEEKLY_BREAKDOWN.map((week) => {
                  const isExpanded = expandedWeeks.has(week.week);
                  return (
                    <div key={week.week} className="border border-gray-200 rounded-md">
                      <button
                        type="button"
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                        onClick={() => toggleWeek(week.week)}
                        data-testid={`week-toggle-${week.week.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="text-sm font-medium text-gray-900">{week.week}</span>
                        </div>
                        <span className="text-sm tabular-nums text-gray-600">
                          Projected: ${week.projectedBalance.toLocaleString()}
                        </span>
                      </button>
                      {isExpanded && (
                        <div className="border-t border-gray-100 px-4 py-2 space-y-1" data-testid={`week-contacts-${week.week.toLowerCase().replace(/\s+/g, '-')}`}>
                          {week.contacts.map((contact) => (
                            <div key={contact.name} className="flex items-center justify-between text-sm py-1">
                              <span className="text-gray-700">{contact.name}</span>
                              <div className="flex gap-4">
                                {contact.invoicesDue > 0 && (
                                  <span className="text-green-600 tabular-nums">
                                    Invoices due: ${contact.invoicesDue.toLocaleString()}
                                  </span>
                                )}
                                {contact.billsToPay > 0 && (
                                  <span className="text-red-600 tabular-nums">
                                    Bills to pay: ${contact.billsToPay.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Suggested actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="suggested-actions">
            <Card>
              <CardContent>
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Overdue invoices</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {MOCK_SUGGESTED_ACTIONS.overdueInvoices.count} invoices totalling ${MOCK_SUGGESTED_ACTIONS.overdueInvoices.total.toLocaleString()}
                    </p>
                    <Link
                      to="/sales/invoices"
                      className="mt-2 inline-flex items-center text-sm text-[#0078c8] hover:underline"
                      data-testid="action-overdue-invoices"
                    >
                      View overdue invoices
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-red-50 p-2 text-red-600">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Overdue bills</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {MOCK_SUGGESTED_ACTIONS.overdueBills.count} bills totalling ${MOCK_SUGGESTED_ACTIONS.overdueBills.total.toLocaleString()}
                    </p>
                    <Link
                      to="/purchases/bills"
                      className="mt-2 inline-flex items-center text-sm text-[#0078c8] hover:underline"
                      data-testid="action-overdue-bills"
                    >
                      View overdue bills
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </PageContainer>
  );
}
