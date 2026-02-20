import { useState, useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ReportHeader } from '../components/ReportHeader';
import { AgedBucketChart } from '../components/AgedBucketChart';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { formatCurrency } from '@shared/calc/currency';
import { useAgedPayables } from '../hooks/useReports';
import { agedReportToCsv, downloadCsv } from '../hooks/useExportCsv';
import { Settings2, ExternalLink } from 'lucide-react';

const AGEING_BY_OPTIONS = ['Due Date', 'Bill Date', 'Created Date'];
const GROUPING_OPTIONS = ['None', 'Contact', 'Bill Status', 'Currency'];

export function AgedPayablesPage() {
  const { data: report, isLoading } = useAgedPayables();
  const [ageingPeriods, setAgeingPeriods] = useState(4);
  const [ageingInterval, setAgeingInterval] = useState('Month');
  const [ageingBy, setAgeingBy] = useState('Due Date');
  const [columnsSelected, setColumnsSelected] = useState(3);
  const [grouping, setGrouping] = useState('None');

  const handleExport = useCallback(() => {
    if (!report) return;
    const csv = agedReportToCsv(report.buckets, report.total);
    downloadCsv(csv, 'aged-payables.csv');
  }, [report]);

  const subtitle = `As at: ${new Date().toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;

  return (
    <PageContainer
      title="Aged Payables"
      breadcrumbs={[
        { label: 'Reports', href: '/reporting' },
        { label: 'Aged Payables' },
      ]}
    >
      <ReportHeader title="Aged Payables" subtitle={subtitle} onExport={handleExport}>
        <div className="flex items-center gap-4 flex-wrap">
          {/* Ageing Periods control */}
          <div className="flex items-center gap-2" data-testid="ageing-periods-control">
            <Settings2 className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Ageing Periods:</span>
            <select
              value={ageingPeriods}
              onChange={(e) => setAgeingPeriods(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
              data-testid="ageing-periods-select"
            >
              {[2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n} periods</option>
              ))}
            </select>
            <span className="text-sm text-gray-600">of</span>
            <select
              value={ageingInterval}
              onChange={(e) => setAgeingInterval(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
              data-testid="ageing-interval-select"
            >
              {['Week', 'Month', 'Quarter'].map((interval) => (
                <option key={interval} value={interval}>1 {interval}</option>
              ))}
            </select>
          </div>

          {/* Ageing By selector */}
          <div className="flex items-center gap-2" data-testid="ageing-by-control">
            <span className="text-sm text-gray-600">Ageing By:</span>
            <select
              value={ageingBy}
              onChange={(e) => setAgeingBy(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
              data-testid="ageing-by-select"
            >
              {AGEING_BY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Columns selector */}
          <div className="flex items-center gap-2" data-testid="columns-control">
            <span className="text-sm text-gray-600">Columns:</span>
            <Button variant="outline" size="sm" data-testid="columns-btn">
              {columnsSelected} columns selected
            </Button>
          </div>

          {/* Grouping/Summarising dropdown */}
          <div className="flex items-center gap-2" data-testid="grouping-control">
            <span className="text-sm text-gray-600">Grouping/Summarising:</span>
            <select
              value={grouping}
              onChange={(e) => setGrouping(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
              data-testid="grouping-select"
            >
              {GROUPING_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
      </ReportHeader>

      {isLoading && <p className="text-gray-500">Loading report...</p>}

      {report && (
        <>
          {/* Summary card */}
          <Card className="mb-6">
            <CardContent>
              <div className="flex items-center justify-between py-2">
                <span className="text-lg font-semibold text-gray-900">
                  Total Outstanding
                </span>
                <span
                  className="text-2xl font-bold text-gray-900"
                  data-testid="total-outstanding"
                >
                  {formatCurrency(report.total)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Chart */}
          <Card className="mb-6">
            <CardContent>
              <AgedBucketChart buckets={report.buckets} />
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="mb-6">
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aging Period</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Bills</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.buckets.map((bucket) => (
                    <TableRow key={bucket.label} data-testid={`bucket-row-${bucket.label}`}>
                      <TableCell className="font-medium">{bucket.label}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(bucket.amount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {bucket.count}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          to={`/bills?status=outstanding&aging=${encodeURIComponent(bucket.label)}` as string}
                          className="text-sm text-[#0078c8] hover:underline"
                          data-testid={`bucket-link-${bucket.label}`}
                        >
                          View bills
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Total row */}
                  <TableRow className="border-t-2 border-gray-300 font-bold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(report.total)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {report.buckets.reduce((sum, b) => sum + b.count, 0)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Related Reports */}
          <Card data-testid="related-reports">
            <CardContent>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Related Reports</h3>
              <div className="flex flex-col gap-2">
                <Link
                  to="/reporting/aged-receivables"
                  className="flex items-center gap-2 text-sm text-[#0078c8] hover:underline"
                  data-testid="related-aged-receivables"
                >
                  <ExternalLink className="w-3 h-3" />
                  Aged Receivables
                </Link>
                <Link
                  to="/reporting/profit-and-loss"
                  className="flex items-center gap-2 text-sm text-[#0078c8] hover:underline"
                  data-testid="related-profit-and-loss"
                >
                  <ExternalLink className="w-3 h-3" />
                  Profit and Loss
                </Link>
                <Link
                  to="/reporting/account-transactions"
                  className="flex items-center gap-2 text-sm text-[#0078c8] hover:underline"
                  data-testid="related-account-transactions"
                >
                  <ExternalLink className="w-3 h-3" />
                  Account Transactions
                </Link>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </PageContainer>
  );
}
