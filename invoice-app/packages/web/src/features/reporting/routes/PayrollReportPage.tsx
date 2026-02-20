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

interface PayrollRow {
  employee: string;
  grossPay: number;
  paye: number;
  kiwiSaver: number;
  netPay: number;
}

const PERIODS = ['Jan 2026', 'Feb 2026', 'Mar 2026'];

const MOCK_DATA: Record<string, PayrollRow[]> = {
  'Jan 2026': [
    { employee: 'John Smith', grossPay: 5200, paye: 1092, kiwiSaver: 156, netPay: 3952 },
    { employee: 'Sarah Johnson', grossPay: 6500, paye: 1495, kiwiSaver: 195, netPay: 4810 },
    { employee: 'Mike Williams', grossPay: 4800, paye: 960, kiwiSaver: 144, netPay: 3696 },
  ],
  'Feb 2026': [
    { employee: 'John Smith', grossPay: 5200, paye: 1092, kiwiSaver: 156, netPay: 3952 },
    { employee: 'Sarah Johnson', grossPay: 6500, paye: 1495, kiwiSaver: 195, netPay: 4810 },
    { employee: 'Mike Williams', grossPay: 4800, paye: 960, kiwiSaver: 144, netPay: 3696 },
  ],
  'Mar 2026': [
    { employee: 'John Smith', grossPay: 5400, paye: 1158, kiwiSaver: 162, netPay: 4080 },
    { employee: 'Sarah Johnson', grossPay: 6500, paye: 1495, kiwiSaver: 195, netPay: 4810 },
    { employee: 'Mike Williams', grossPay: 4800, paye: 960, kiwiSaver: 144, netPay: 3696 },
  ],
};

function getTotals(rows: PayrollRow[]) {
  return rows.reduce(
    (acc, r) => ({
      grossPay: acc.grossPay + r.grossPay,
      paye: acc.paye + r.paye,
      kiwiSaver: acc.kiwiSaver + r.kiwiSaver,
      netPay: acc.netPay + r.netPay,
    }),
    { grossPay: 0, paye: 0, kiwiSaver: 0, netPay: 0 },
  );
}

export function PayrollReportPage() {
  return (
    <PageContainer
      title="Payroll Summary"
      breadcrumbs={[
        { label: 'Reports', href: '/reporting' },
        { label: 'Payroll Summary' },
      ]}
    >
      <ReportHeader title="Payroll Summary" subtitle="Gross pay, PAYE, and KiwiSaver by period" />

      <div className="space-y-6">
        {PERIODS.map((period) => {
          const rows = MOCK_DATA[period] ?? [];
          const totals = getTotals(rows);
          return (
            <Card key={period}>
              <CardContent>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{period}</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead className="text-right">Gross Pay</TableHead>
                      <TableHead className="text-right">PAYE</TableHead>
                      <TableHead className="text-right">KiwiSaver</TableHead>
                      <TableHead className="text-right">Net Pay</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.employee}>
                        <TableCell>{row.employee}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(row.grossPay)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(row.paye)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(row.kiwiSaver)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(row.netPay)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold border-t-2 border-gray-300">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(totals.grossPay)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(totals.paye)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(totals.kiwiSaver)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(totals.netPay)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PageContainer>
  );
}
