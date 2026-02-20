import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { formatCurrency } from '@shared/calc/currency';
import { cn } from '../../../lib/cn';

export interface CashFlowPeriod {
  label: string;
  receivables: number;
  payables: number;
  netFlow: number;
  runningBalance: number;
}

interface CashFlowForecastProps {
  periods: CashFlowPeriod[];
  openingBalance: number;
  closingBalance: number;
}

/**
 * Cash Flow Forecast report showing projected cash flows
 * based on outstanding receivables and payables.
 */
export function CashFlowForecast({
  periods,
  openingBalance,
  closingBalance,
}: CashFlowForecastProps) {
  const totalReceivables = periods.reduce((sum, p) => sum + p.receivables, 0);
  const totalPayables = periods.reduce((sum, p) => sum + p.payables, 0);
  const totalNetFlow = periods.reduce((sum, p) => sum + p.netFlow, 0);

  return (
    <div className="space-y-4" data-testid="cash-flow-forecast">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Opening Balance"
          value={openingBalance}
          variant="neutral"
        />
        <SummaryCard
          label="Net Cash Flow"
          value={totalNetFlow}
          variant={totalNetFlow >= 0 ? 'positive' : 'negative'}
        />
        <SummaryCard
          label="Projected Closing"
          value={closingBalance}
          variant={closingBalance >= 0 ? 'positive' : 'negative'}
        />
      </div>

      {/* Forecast table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Period</TableHead>
            <TableHead className="text-right">Receivables (In)</TableHead>
            <TableHead className="text-right">Payables (Out)</TableHead>
            <TableHead className="text-right">Net Flow</TableHead>
            <TableHead className="text-right">Running Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {periods.length === 0 ? (
            <TableRow>
              <td colSpan={5} className="px-4 py-8 text-center text-[#6b7280]">
                No forecast data available
              </td>
            </TableRow>
          ) : (
            <>
              {periods.map((period) => (
                <TableRow key={period.label}>
                  <TableCell className="font-medium">{period.label}</TableCell>
                  <TableCell className="text-right tabular-nums text-green-600">
                    {formatCurrency(period.receivables)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-red-600">
                    {formatCurrency(period.payables)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right tabular-nums font-medium',
                      period.netFlow >= 0 ? 'text-green-600' : 'text-red-600',
                    )}
                  >
                    {formatCurrency(period.netFlow)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right tabular-nums',
                      period.runningBalance >= 0 ? 'text-gray-900' : 'text-red-600',
                    )}
                  >
                    {formatCurrency(period.runningBalance)}
                  </TableCell>
                </TableRow>
              ))}

              {/* Totals row */}
              <TableRow className="border-t-2 border-gray-300 font-bold bg-gray-50">
                <TableCell>Total</TableCell>
                <TableCell className="text-right tabular-nums text-green-600">
                  {formatCurrency(totalReceivables)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-red-600">
                  {formatCurrency(totalPayables)}
                </TableCell>
                <TableCell
                  className={cn(
                    'text-right tabular-nums',
                    totalNetFlow >= 0 ? 'text-green-600' : 'text-red-600',
                  )}
                >
                  {formatCurrency(totalNetFlow)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(closingBalance)}
                </TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant: 'positive' | 'negative' | 'neutral';
}) {
  const colorClasses = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-900',
  };

  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-sm">
      <p className="text-sm text-[#6b7280]">{label}</p>
      <p className={cn('text-xl font-bold tabular-nums mt-1', colorClasses[variant])}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}
