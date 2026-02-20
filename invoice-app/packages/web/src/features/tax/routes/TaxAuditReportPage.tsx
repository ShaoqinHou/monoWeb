import { useState, useCallback, useMemo } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { TaxAuditTable } from '../components/TaxAuditTable';
import { useTaxAuditReport } from '../hooks/useTaxAuditReport';
import type { TaxAuditFilters } from '../hooks/useTaxAuditReport';
import { downloadCsv } from '../../../lib/downloadCsv';

const TAX_RATE_OPTIONS = [
  { value: '', label: 'All Tax Rates' },
  { value: '15%', label: '15% GST' },
  { value: '0%', label: '0% Zero-rated' },
];

const ACCOUNT_OPTIONS = [
  { value: '', label: 'All Accounts' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Office Expenses', label: 'Office Expenses' },
  { value: 'IT Expenses', label: 'IT Expenses' },
  { value: 'Zero-rated Sales', label: 'Zero-rated Sales' },
  { value: 'Insurance', label: 'Insurance' },
  { value: 'Cleaning', label: 'Cleaning' },
];

function getDefaultFilters(): TaxAuditFilters {
  const now = new Date();
  const year = now.getFullYear();
  return {
    dateFrom: `${year}-01-01`,
    dateTo: `${year}-12-31`,
  };
}

/**
 * Tax Audit Report page showing detailed tax transaction breakdown
 * with filters for date range, tax rate, and account.
 */
export function TaxAuditReportPage() {
  const [filters, setFilters] = useState<TaxAuditFilters>(getDefaultFilters);
  const { transactions, totals, isLoading } = useTaxAuditReport(filters);

  const handleDateFromChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilters((f) => ({ ...f, dateFrom: e.target.value }));
    },
    [],
  );

  const handleDateToChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilters((f) => ({ ...f, dateTo: e.target.value }));
    },
    [],
  );

  const handleTaxRateChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilters((f) => ({ ...f, taxRate: e.target.value || undefined }));
    },
    [],
  );

  const handleAccountChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilters((f) => ({ ...f, account: e.target.value || undefined }));
    },
    [],
  );

  const csvContent = useMemo(() => {
    const header = 'Date,Type,Reference,Contact,Net,Tax,Gross';
    const rows = transactions.map(
      (tx) =>
        `${tx.date},${tx.type},${tx.reference},"${tx.contact}",${tx.netAmount.toFixed(2)},${tx.taxAmount.toFixed(2)},${tx.grossAmount.toFixed(2)}`,
    );
    const totalRow = `,,,,${totals.totalNet.toFixed(2)},${totals.totalTax.toFixed(2)},${totals.totalGross.toFixed(2)}`;
    return [header, ...rows, totalRow].join('\n');
  }, [transactions, totals]);

  const handleExportCsv = useCallback(() => {
    downloadCsv(csvContent, 'tax-audit-report.csv');
  }, [csvContent]);

  return (
    <PageContainer
      title="Tax Audit Report"
      breadcrumbs={[
        { label: 'Accounting', href: '/accounting' },
        { label: 'Tax', href: '/tax' },
        { label: 'Tax Audit Report' },
      ]}
      actions={
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExportCsv}
          data-testid="export-csv-button"
        >
          Export CSV
        </Button>
      }
    >
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-6" data-testid="tax-audit-filters">
        <div className="w-40">
          <Input
            label="From"
            inputId="audit-date-from"
            type="date"
            value={filters.dateFrom}
            onChange={handleDateFromChange}
          />
        </div>
        <div className="w-40">
          <Input
            label="To"
            inputId="audit-date-to"
            type="date"
            value={filters.dateTo}
            onChange={handleDateToChange}
          />
        </div>
        <div className="w-44">
          <Select
            label="Tax Rate"
            selectId="audit-tax-rate"
            options={TAX_RATE_OPTIONS}
            value={filters.taxRate ?? ''}
            onChange={handleTaxRateChange}
          />
        </div>
        <div className="w-44">
          <Select
            label="Account"
            selectId="audit-account"
            options={ACCOUNT_OPTIONS}
            value={filters.account ?? ''}
            onChange={handleAccountChange}
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-gray-500" data-testid="loading-indicator">Loading tax audit data...</p>
      ) : (
        <TaxAuditTable transactions={transactions} totals={totals} />
      )}
    </PageContainer>
  );
}
