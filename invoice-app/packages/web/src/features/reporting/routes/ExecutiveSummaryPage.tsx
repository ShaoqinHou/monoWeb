import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardContent, CardHeader } from '../../../components/ui/Card';
import { ReportHeader } from '../components/ReportHeader';
import { formatCurrency } from '@shared/calc/currency';

const MOCK_PNL = {
  totalRevenue: 247500,
  totalCostOfSales: 82500,
  grossProfit: 165000,
  totalOperatingExpenses: 80700,
  netProfit: 84300,
};

const MOCK_BALANCE_SHEET = {
  totalCurrentAssets: 91590,
  totalFixedAssets: 45000,
  totalAssets: 136590,
  totalCurrentLiabilities: 21400,
  totalLiabilities: 21400,
  totalEquity: 115190,
};

const MOCK_CASH = {
  openingBalance: 48200,
  closingBalance: 52840,
  netChange: 4640,
};

interface SummaryLineProps {
  label: string;
  value: number;
  bold?: boolean;
  indent?: boolean;
}

function SummaryLine({ label, value, bold, indent }: SummaryLineProps) {
  return (
    <div className={`flex justify-between py-1 ${bold ? 'font-bold border-t border-gray-300 pt-2' : ''} ${indent ? 'pl-4' : ''}`}>
      <span className="text-gray-700">{label}</span>
      <span className="tabular-nums text-gray-900">{formatCurrency(value)}</span>
    </div>
  );
}

export function ExecutiveSummaryPage() {
  const now = new Date();
  const subtitle = `For the year ended ${now.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <PageContainer
      title="Executive Summary"
      breadcrumbs={[
        { label: 'Reports', href: '/reporting' },
        { label: 'Executive Summary' },
      ]}
    >
      <ReportHeader title="Executive Summary" subtitle={subtitle} />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Profit & Loss Summary</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-1" data-testid="pnl-summary">
              <SummaryLine label="Total Revenue" value={MOCK_PNL.totalRevenue} />
              <SummaryLine label="Cost of Sales" value={MOCK_PNL.totalCostOfSales} indent />
              <SummaryLine label="Gross Profit" value={MOCK_PNL.grossProfit} bold />
              <SummaryLine label="Operating Expenses" value={MOCK_PNL.totalOperatingExpenses} indent />
              <SummaryLine label="Net Profit" value={MOCK_PNL.netProfit} bold />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Balance Sheet Summary</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-1" data-testid="bs-summary">
              <SummaryLine label="Current Assets" value={MOCK_BALANCE_SHEET.totalCurrentAssets} />
              <SummaryLine label="Fixed Assets" value={MOCK_BALANCE_SHEET.totalFixedAssets} />
              <SummaryLine label="Total Assets" value={MOCK_BALANCE_SHEET.totalAssets} bold />
              <SummaryLine label="Total Liabilities" value={MOCK_BALANCE_SHEET.totalLiabilities} />
              <SummaryLine label="Total Equity" value={MOCK_BALANCE_SHEET.totalEquity} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Cash Position</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-1" data-testid="cash-summary">
              <SummaryLine label="Opening Balance" value={MOCK_CASH.openingBalance} />
              <SummaryLine label="Net Change" value={MOCK_CASH.netChange} />
              <SummaryLine label="Closing Balance" value={MOCK_CASH.closingBalance} bold />
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
