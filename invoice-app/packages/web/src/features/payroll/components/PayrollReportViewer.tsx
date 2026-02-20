import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import type { PayrollReportData } from '../hooks/usePayrollReports';
import { Download, Printer } from 'lucide-react';

interface PayrollReportViewerProps {
  report: PayrollReportData;
}

function exportCSV(report: PayrollReportData) {
  const header = report.columns.join(',');
  const rows = report.rows.map((row) => row.map((cell) => `"${cell}"`).join(','));
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${report.type}-report.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function printReport() {
  window.print();
}

export function PayrollReportViewer({ report }: PayrollReportViewerProps) {
  return (
    <div className="space-y-4" data-testid="payroll-report-viewer">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#1a1a2e]">{report.title}</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCSV(report)}
            data-testid="export-csv-btn"
          >
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={printReport}
            data-testid="print-btn"
          >
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            {report.columns.map((col) => (
              <TableHead key={col}>{col}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {report.rows.length === 0 ? (
            <TableRow>
              <td colSpan={report.columns.length} className="px-4 py-8 text-center text-[#6b7280]">
                No data available for this report
              </td>
            </TableRow>
          ) : (
            report.rows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <TableCell key={cellIndex}>{cell}</TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
