import { useState } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { formatCurrency } from '@shared/calc/currency';
import { useYearEndSummary, getTaxYearOptions } from '../hooks/useYearEndSummary';
import { Download } from 'lucide-react';

const TAX_YEAR_OPTIONS = getTaxYearOptions();

function exportCSV(data: ReturnType<typeof useYearEndSummary>['data']) {
  if (!data) return;
  const header = 'Employee,Gross Pay,PAYE,KiwiSaver (Employee),KiwiSaver (Employer),Student Loan,Net Pay';
  const rows = data.employees.map((emp) =>
    [emp.employeeName, emp.grossPay, emp.paye, emp.kiwiSaverEmployee, emp.kiwiSaverEmployer, emp.studentLoan, emp.netPay].join(','),
  );
  const totalRow = ['TOTAL', data.totals.grossPay, data.totals.paye, data.totals.kiwiSaverEmployee, data.totals.kiwiSaverEmployer, data.totals.studentLoan, data.totals.netPay].join(',');
  const csv = [header, ...rows, totalRow].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `year-end-summary-${data.taxYear}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function YearEndSummaryPage() {
  const [selectedYear, setSelectedYear] = useState(TAX_YEAR_OPTIONS[0]?.value ?? '2025');
  const { data, isLoading } = useYearEndSummary(selectedYear);

  return (
    <PageContainer
      title="Year End Summary"
      breadcrumbs={[{ label: 'Payroll', href: '/payroll' }, { label: 'Year End Summary' }]}
    >
      <div className="space-y-4" data-testid="year-end-summary-page">
        <div className="flex items-end gap-4">
          <div className="w-72">
            <Select
              label="Tax Year (April - March)"
              options={TAX_YEAR_OPTIONS}
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              aria-label="Select tax year"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCSV(data)}
            disabled={!data || data.employees.length === 0}
            data-testid="export-csv-btn"
          >
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        </div>

        {isLoading ? (
          <div className="text-[#6b7280]" data-testid="year-end-loading">Loading summary...</div>
        ) : !data || data.employees.length === 0 ? (
          <div className="text-[#6b7280] py-8 text-center">
            No pay run data for the selected tax year
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee Name</TableHead>
                <TableHead className="text-right">Gross Pay</TableHead>
                <TableHead className="text-right">PAYE</TableHead>
                <TableHead className="text-right">KiwiSaver (Employee)</TableHead>
                <TableHead className="text-right">KiwiSaver (Employer)</TableHead>
                <TableHead className="text-right">Student Loan</TableHead>
                <TableHead className="text-right">Net Pay</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.employees.map((emp) => (
                <TableRow key={emp.employeeId} data-testid={`year-row-${emp.employeeId}`}>
                  <TableCell className="font-medium">{emp.employeeName}</TableCell>
                  <TableCell className="text-right">{formatCurrency(emp.grossPay)}</TableCell>
                  <TableCell className="text-right text-red-600">{formatCurrency(emp.paye)}</TableCell>
                  <TableCell className="text-right text-red-600">{formatCurrency(emp.kiwiSaverEmployee)}</TableCell>
                  <TableCell className="text-right text-red-600">{formatCurrency(emp.kiwiSaverEmployer)}</TableCell>
                  <TableCell className="text-right text-red-600">{formatCurrency(emp.studentLoan)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(emp.netPay)}</TableCell>
                </TableRow>
              ))}
              {/* Summary Totals Row */}
              <TableRow className="bg-[#f8f9fa] font-semibold" data-testid="year-end-totals">
                <TableCell className="font-bold">Total</TableCell>
                <TableCell className="text-right">{formatCurrency(data.totals.grossPay)}</TableCell>
                <TableCell className="text-right text-red-600">{formatCurrency(data.totals.paye)}</TableCell>
                <TableCell className="text-right text-red-600">{formatCurrency(data.totals.kiwiSaverEmployee)}</TableCell>
                <TableCell className="text-right text-red-600">{formatCurrency(data.totals.kiwiSaverEmployer)}</TableCell>
                <TableCell className="text-right text-red-600">{formatCurrency(data.totals.studentLoan)}</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(data.totals.netPay)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </div>
    </PageContainer>
  );
}
