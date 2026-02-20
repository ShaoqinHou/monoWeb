import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { formatCurrency } from '@shared/calc/currency';
import type { TaxSummary } from '../types';

interface TaxSummaryCardProps {
  summary: TaxSummary;
}

interface SummaryRowProps {
  label: string;
  value: number;
  testId: string;
  bold?: boolean;
  highlight?: boolean;
}

function SummaryRow({ label, value, testId, bold, highlight }: SummaryRowProps) {
  return (
    <div
      className={`flex items-center justify-between py-3 ${
        bold ? 'border-t-2 border-gray-300 font-semibold' : 'border-b border-gray-100'
      } ${highlight ? 'text-lg' : ''}`}
      data-testid={testId}
    >
      <span className="text-gray-700">{label}</span>
      <span className="text-gray-900 tabular-nums">{formatCurrency(value)}</span>
    </div>
  );
}

/**
 * Shows tax collected (output) vs tax paid (input) vs net GST payable.
 */
export function TaxSummaryCard({ summary }: TaxSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">Tax Summary</h3>
      </CardHeader>
      <CardContent>
        <SummaryRow
          label="Tax Collected (Output Tax)"
          value={summary.taxCollected}
          testId="tax-collected"
        />
        <SummaryRow
          label="Tax Paid (Input Tax)"
          value={summary.taxPaid}
          testId="tax-paid"
        />
        <SummaryRow
          label="Net GST Payable"
          value={summary.netGSTPayable}
          testId="net-gst-payable"
          bold
          highlight
        />
        <div className="mt-2 text-sm text-gray-500" data-testid="period-count">
          Based on {summary.periodCount} filing period{summary.periodCount !== 1 ? 's' : ''}
        </div>
      </CardContent>
    </Card>
  );
}
