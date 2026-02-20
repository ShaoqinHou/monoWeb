import { useState, useCallback, useMemo } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardContent } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { ReportHeader } from '../components/ReportHeader';
import { TrialBalanceReport } from '../components/TrialBalanceReport';
import type { TrialBalanceAccount } from '../components/TrialBalanceReport';
import { useTrialBalance } from '../hooks/useReports';
import { downloadCsv } from '../hooks/useExportCsv';

function getDefaultAsAtDate(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

function formatAsAtSubtitle(asAt: string): string {
  const date = new Date(asAt + 'T00:00:00');
  return `As at: ${date.toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
}

function trialBalanceToCsv(accounts: TrialBalanceAccount[]): string {
  const lines: string[] = ['Account Code,Account Name,Debit,Credit'];
  for (const account of accounts) {
    const code = account.accountCode.includes(',')
      ? `"${account.accountCode}"`
      : account.accountCode;
    const name = account.accountName.includes(',')
      ? `"${account.accountName}"`
      : account.accountName;
    lines.push(`${code},${name},${account.debit.toFixed(2)},${account.credit.toFixed(2)}`);
  }
  const totalDebit = accounts.reduce((sum, a) => sum + a.debit, 0);
  const totalCredit = accounts.reduce((sum, a) => sum + a.credit, 0);
  lines.push(`,,${totalDebit.toFixed(2)},${totalCredit.toFixed(2)}`);
  return lines.join('\n');
}

export function TrialBalancePage() {
  const [asAt, setAsAt] = useState(getDefaultAsAtDate);
  const { data: accounts, isLoading } = useTrialBalance(asAt);

  const resolvedAccounts = useMemo(() => accounts ?? [], [accounts]);

  const handleExport = useCallback(() => {
    const csv = trialBalanceToCsv(resolvedAccounts);
    downloadCsv(csv, `trial-balance-${asAt}.csv`);
  }, [resolvedAccounts, asAt]);

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setAsAt(e.target.value);
    },
    [],
  );

  const subtitle = formatAsAtSubtitle(asAt);

  return (
    <PageContainer
      title="Trial Balance"
      breadcrumbs={[
        { label: 'Reports', href: '/reporting' },
        { label: 'Trial Balance' },
      ]}
    >
      <ReportHeader title="Trial Balance" subtitle={subtitle} onExport={handleExport}>
        <div className="w-40" data-testid="as-at-date-picker">
          <Input
            label="As at"
            inputId="trial-balance-as-at"
            type="date"
            value={asAt}
            onChange={handleDateChange}
          />
        </div>
      </ReportHeader>

      {isLoading && <p className="text-gray-500">Loading report...</p>}

      {resolvedAccounts.length > 0 && (
        <Card>
          <CardContent>
            <TrialBalanceReport accounts={resolvedAccounts} asAt={subtitle.replace('As at: ', '')} />
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
