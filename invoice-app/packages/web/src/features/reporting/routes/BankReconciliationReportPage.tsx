import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardContent } from '../../../components/ui/Card';
import { ReportHeader } from '../components/ReportHeader';
import { formatCurrency } from '@shared/calc/currency';
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHeader,
  TableHead,
} from '../../../components/ui/Table';

interface BankReconciliationRow {
  account: string;
  reconciledTotal: number;
  unreconciledTotal: number;
  difference: number;
}

const MOCK_RECON: BankReconciliationRow[] = [
  { account: 'Business Cheque Account', reconciledTotal: 42350, unreconciledTotal: 3280, difference: 39070 },
  { account: 'Business Savings Account', reconciledTotal: 18500, unreconciledTotal: 0, difference: 18500 },
  { account: 'Credit Card', reconciledTotal: 8750, unreconciledTotal: 1240, difference: 7510 },
  { account: 'PayPal', reconciledTotal: 3200, unreconciledTotal: 560, difference: 2640 },
];

export function BankReconciliationReportPage() {
  const now = new Date();
  const subtitle = `As at ${now.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  const totalReconciled = MOCK_RECON.reduce((s, r) => s + r.reconciledTotal, 0);
  const totalUnreconciled = MOCK_RECON.reduce((s, r) => s + r.unreconciledTotal, 0);
  const totalDifference = MOCK_RECON.reduce((s, r) => s + r.difference, 0);

  return (
    <PageContainer
      title="Bank Reconciliation"
      breadcrumbs={[
        { label: 'Reports', href: '/reporting' },
        { label: 'Bank Reconciliation' },
      ]}
    >
      <ReportHeader title="Bank Reconciliation" subtitle={subtitle} />

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bank Account</TableHead>
                <TableHead className="text-right">Reconciled</TableHead>
                <TableHead className="text-right">Unreconciled</TableHead>
                <TableHead className="text-right">Difference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_RECON.map((row) => (
                <TableRow key={row.account}>
                  <TableCell>{row.account}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(row.reconciledTotal)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(row.unreconciledTotal)}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{formatCurrency(row.difference)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold border-t-2 border-gray-300">
                <TableCell>Total</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(totalReconciled)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(totalUnreconciled)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(totalDifference)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
