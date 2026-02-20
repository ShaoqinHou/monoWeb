import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ReportHeader } from '../components/ReportHeader';
import { formatCurrency } from '@shared/calc/currency';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Pencil,
  Printer,
  ExternalLink,
} from 'lucide-react';
import type { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  trend?: 'up' | 'down';
  trendLabel?: string;
  drillDownHref?: string;
}

type AccountingBasis = 'accrual' | 'cash';

const MOCK_DATA = {
  profitLoss: { revenue: 247500, expenses: 163200, netProfit: 84300, changePercent: 28.1 },
  income: { total: 247500, changePercent: 12.5 },
  expensesTotal: { total: 163200, changePercent: -3.2 },
  netProfitMargin: 34.1,
  grossProfitMargin: 52.8,
  largestExpenses: [
    { name: 'Salaries & Wages', amount: 82400 },
    { name: 'Office Rent', amount: 36000 },
    { name: 'Marketing', amount: 18500 },
    { name: 'Software & Subscriptions', amount: 12300 },
    { name: 'Professional Services', amount: 8900 },
  ],
  balanceSheetSummary: { assets: 325000, liabilities: 142000, equity: 183000 },
  cashBalance: 52840,
  avgTimeToGetPaid: 28,
  avgTimeToPay: 35,
};

function MetricCard({ label, value, icon, trend, trendLabel, drillDownHref }: MetricCardProps) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900" data-testid={`kpi-${label.toLowerCase().replace(/\s+/g, '-')}`}>
              {formatCurrency(value)}
            </p>
            {trend && trendLabel && (
              <div className={`mt-1 flex items-center gap-1 text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                <span>{trendLabel}</span>
              </div>
            )}
          </div>
          <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
            {icon}
          </div>
        </div>
        {drillDownHref && (
          <Link
            to={drillDownHref}
            className="mt-2 flex items-center gap-1 text-xs text-[#0078c8] hover:underline"
            data-testid={`drill-down-${label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <ExternalLink className="w-3 h-3" />
            Drill down to report
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

export function BusinessSnapshotPage() {
  const [basis, setBasis] = useState<AccountingBasis>('accrual');
  const [showFinancialRatios, setShowFinancialRatios] = useState(false);
  const now = new Date();
  const subtitle = `As at ${now.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <PageContainer
      title="Business Snapshot"
      breadcrumbs={[
        { label: 'Reports', href: '/reporting' },
        { label: 'Business Snapshot' },
      ]}
    >
      <ReportHeader title="Business Snapshot" subtitle={subtitle}>
        <div className="flex items-center gap-3" data-testid="snapshot-toolbar">
          <Button variant="outline" size="sm" data-testid="edit-metrics-btn">
            <Pencil className="w-4 h-4 mr-1" />
            Edit metrics
          </Button>
          <Button variant="outline" size="sm" data-testid="print-btn">
            <Printer className="w-4 h-4 mr-1" />
            Print
          </Button>
          <div className="flex items-center gap-1 border border-gray-300 rounded-md overflow-hidden" data-testid="basis-selector">
            <button
              type="button"
              className={`px-3 py-1 text-sm ${basis === 'accrual' ? 'bg-[#0078c8] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setBasis('accrual')}
              data-testid="basis-accrual"
            >
              Accrual
            </button>
            <button
              type="button"
              className={`px-3 py-1 text-sm ${basis === 'cash' ? 'bg-[#0078c8] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setBasis('cash')}
              data-testid="basis-cash"
            >
              Cash
            </button>
          </div>
        </div>
      </ReportHeader>

      {/* Section 1: Profitability */}
      <div className="mb-8" data-testid="section-profitability">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Profitability</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="kpi-grid">
          <MetricCard
            label="Profit or Loss"
            value={MOCK_DATA.profitLoss.netProfit}
            icon={<DollarSign className="w-5 h-5" />}
            trend="up"
            trendLabel={`${MOCK_DATA.profitLoss.changePercent}% vs prior year`}
            drillDownHref="/reporting/profit-and-loss"
          />
          <MetricCard
            label="Income"
            value={MOCK_DATA.income.total}
            icon={<TrendingUp className="w-5 h-5" />}
            trend="up"
            trendLabel={`${MOCK_DATA.income.changePercent}% vs prior year`}
            drillDownHref="/reporting/profit-and-loss"
          />
          <MetricCard
            label="Expenses"
            value={MOCK_DATA.expensesTotal.total}
            icon={<TrendingDown className="w-5 h-5" />}
            trend="down"
            trendLabel={`${MOCK_DATA.expensesTotal.changePercent}% vs prior year`}
            drillDownHref="/reporting/profit-and-loss"
          />
        </div>
      </div>

      {/* Section 2: Efficiency */}
      <div className="mb-8" data-testid="section-efficiency">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Efficiency</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Net profit margin */}
          <Card>
            <CardContent>
              <p className="text-sm font-medium text-gray-500">Net profit margin</p>
              <p className="mt-1 text-2xl font-bold text-gray-900" data-testid="net-profit-margin">
                {MOCK_DATA.netProfitMargin}%
              </p>
            </CardContent>
          </Card>
          {/* Gross profit margin donut placeholder */}
          <Card>
            <CardContent>
              <p className="text-sm font-medium text-gray-500">Gross profit margin</p>
              <div className="mt-2 flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-full border-4 border-[#0078c8] flex items-center justify-center"
                  data-testid="gross-profit-donut"
                >
                  <span className="text-sm font-bold">{MOCK_DATA.grossProfitMargin}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Largest operating expenses table */}
          <Card>
            <CardContent>
              <p className="text-sm font-medium text-gray-500 mb-2">Largest operating expenses</p>
              <div className="space-y-1" data-testid="largest-expenses">
                {MOCK_DATA.largestExpenses.map((exp) => (
                  <div key={exp.name} className="flex justify-between text-sm">
                    <span className="text-gray-700">{exp.name}</span>
                    <span className="tabular-nums text-gray-900 font-medium">{formatCurrency(exp.amount)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section 3: Financial Position */}
      <div className="mb-8" data-testid="section-financial-position">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Financial Position</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Balance sheet summary donut */}
          <Card>
            <CardContent>
              <p className="text-sm font-medium text-gray-500 mb-2">Balance sheet summary</p>
              <div className="space-y-1" data-testid="balance-sheet-summary">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Assets</span>
                  <span className="tabular-nums font-medium">{formatCurrency(MOCK_DATA.balanceSheetSummary.assets)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Liabilities</span>
                  <span className="tabular-nums font-medium">{formatCurrency(MOCK_DATA.balanceSheetSummary.liabilities)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Equity</span>
                  <span className="tabular-nums font-medium">{formatCurrency(MOCK_DATA.balanceSheetSummary.equity)}</span>
                </div>
              </div>
              <Link
                to="/reporting/balance-sheet"
                className="mt-2 flex items-center gap-1 text-xs text-[#0078c8] hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Drill down to report
              </Link>
            </CardContent>
          </Card>
          {/* Cash balance */}
          <MetricCard
            label="Cash balance"
            value={MOCK_DATA.cashBalance}
            icon={<Wallet className="w-5 h-5" />}
            drillDownHref="/reporting/cash-flow-forecast"
          />
          {/* Avg time to get paid */}
          <Card>
            <CardContent>
              <p className="text-sm font-medium text-gray-500">Average time to get paid</p>
              <p className="mt-1 text-2xl font-bold text-gray-900" data-testid="avg-time-to-get-paid">
                {MOCK_DATA.avgTimeToGetPaid} days
              </p>
              <Link
                to="/reporting/aged-receivables"
                className="mt-2 flex items-center gap-1 text-xs text-[#0078c8] hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Drill down to report
              </Link>
            </CardContent>
          </Card>
          {/* Avg time to pay suppliers */}
          <Card>
            <CardContent>
              <p className="text-sm font-medium text-gray-500">Average time to pay suppliers</p>
              <p className="mt-1 text-2xl font-bold text-gray-900" data-testid="avg-time-to-pay">
                {MOCK_DATA.avgTimeToPay} days
              </p>
              <Link
                to="/reporting/aged-payables"
                className="mt-2 flex items-center gap-1 text-xs text-[#0078c8] hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Drill down to report
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Show financial ratios toggle */}
      <div className="flex items-center gap-2 pt-4 border-t border-gray-200" data-testid="financial-ratios-toggle-row">
        <button
          type="button"
          role="switch"
          aria-checked={showFinancialRatios}
          aria-label="Show financial ratios"
          onClick={() => setShowFinancialRatios((v) => !v)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
            showFinancialRatios ? 'bg-[#0078c8]' : 'bg-gray-300'
          }`}
          data-testid="show-financial-ratios-switch"
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
              showFinancialRatios ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
        <span
          className="text-sm text-gray-700 cursor-pointer select-none"
          onClick={() => setShowFinancialRatios((v) => !v)}
        >
          Show financial ratios
        </span>
      </div>
    </PageContainer>
  );
}
