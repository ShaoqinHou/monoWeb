import { useState } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { PAYROLL_REPORTS, usePayrollReport } from '../hooks/usePayrollReports';
import type { PayrollReportType, DateRange } from '../hooks/usePayrollReports';
import { PayrollReportViewer } from '../components/PayrollReportViewer';
import { FileText } from 'lucide-react';

export function PayrollReportsPage() {
  const [selectedReport, setSelectedReport] = useState<PayrollReportType | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [startDate, setStartDate] = useState('2025-04-01');
  const [endDate, setEndDate] = useState('2026-03-31');

  const { data: reportData, isLoading } = usePayrollReport(selectedReport, dateRange);

  const handleRunReport = (type: PayrollReportType) => {
    setSelectedReport(type);
    setDateRange({ start: startDate, end: endDate });
  };

  return (
    <PageContainer
      title="Payroll Reports"
      breadcrumbs={[{ label: 'Payroll', href: '/payroll' }, { label: 'Reports' }]}
    >
      <div className="space-y-6" data-testid="payroll-reports-page">
        {/* Date Range */}
        <div className="flex items-end gap-4">
          <div className="w-48">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              aria-label="Report start date"
            />
          </div>
          <div className="w-48">
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              aria-label="Report end date"
            />
          </div>
        </div>

        {/* Report List */}
        <div className="grid gap-4">
          {PAYROLL_REPORTS.map((report) => (
            <div
              key={report.type}
              className="flex items-center justify-between rounded border border-[#e5e7eb] p-4"
              data-testid={`report-card-${report.type}`}
            >
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-[#0078c8] mt-0.5" />
                <div>
                  <h4 className="font-medium text-[#1a1a2e]">{report.name}</h4>
                  <p className="text-sm text-[#6b7280]">{report.description}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRunReport(report.type)}
                data-testid={`run-report-${report.type}`}
              >
                Run Report
              </Button>
            </div>
          ))}
        </div>

        {/* Report Output */}
        {isLoading && (
          <div className="text-[#6b7280]" data-testid="report-loading">
            Generating report...
          </div>
        )}

        {reportData && !isLoading && (
          <PayrollReportViewer report={reportData} />
        )}
      </div>
    </PageContainer>
  );
}
