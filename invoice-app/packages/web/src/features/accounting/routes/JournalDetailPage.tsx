import { useParams, useNavigate } from '@tanstack/react-router';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { useJournal } from '../hooks/useJournals';
import type { JournalLine } from '../types';

function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 2,
  });
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: 'bg-yellow-100 text-yellow-800',
    posted: 'bg-green-100 text-green-800',
    voided: 'bg-gray-100 text-gray-600',
  };

  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}
      data-testid="journal-status"
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function JournalDetailPage() {
  const { journalId } = useParams({ from: '/accounting/manual-journals/$journalId' });
  const navigate = useNavigate();
  const { data: journal, isLoading, error } = useJournal(journalId);

  if (isLoading) {
    return (
      <PageContainer
        title="Journal Entry"
        breadcrumbs={[
          { label: 'Accounting', href: '/accounting' },
          { label: 'Manual journals', href: '/accounting/manual-journals' },
          { label: 'Loading...' },
        ]}
      >
        <p className="text-gray-500" data-testid="journal-loading">Loading journal...</p>
      </PageContainer>
    );
  }

  if (error || !journal) {
    return (
      <PageContainer
        title="Journal Not Found"
        breadcrumbs={[
          { label: 'Accounting', href: '/accounting' },
          { label: 'Manual journals', href: '/accounting/manual-journals' },
          { label: 'Not Found' },
        ]}
      >
        <p className="text-gray-500" data-testid="journal-not-found">
          The requested journal entry could not be found.
        </p>
      </PageContainer>
    );
  }

  const totalDebits = journal.lines.reduce((sum: number, l: JournalLine) => sum + l.debit, 0);
  const totalCredits = journal.lines.reduce((sum: number, l: JournalLine) => sum + l.credit, 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  return (
    <PageContainer
      title="Journal Entry"
      breadcrumbs={[
        { label: 'Accounting', href: '/accounting' },
        { label: 'Manual journals', href: '/accounting/manual-journals' },
        { label: journal.narration || `Journal #${journal.id}` },
      ]}
      actions={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate({ to: '/accounting/manual-journals' })}>
            Back to Journals
          </Button>
          <Button variant="outline">Print / Export</Button>
          <Button variant="destructive">Reverse</Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Journal header info */}
        <div className="rounded-lg border border-gray-200 bg-white p-6" data-testid="journal-header">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Date</p>
              <p className="text-sm text-gray-900" data-testid="journal-date">{journal.date}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Journal Number</p>
              <p className="text-sm text-gray-900" data-testid="journal-number">{journal.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <StatusBadge status={journal.status} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Narration</p>
              <p className="text-sm text-gray-900" data-testid="journal-narration">
                {journal.narration || 'No description'}
              </p>
            </div>
          </div>
        </div>

        {/* Journal lines table */}
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200" data-testid="journal-lines-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Account
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Debit
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Credit
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {journal.lines.map((line: JournalLine) => (
                <tr key={line.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {line.accountName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {line.description || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                    {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                    {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={2} className="px-6 py-3 text-sm font-semibold text-gray-900">
                  Totals
                </td>
                <td className="whitespace-nowrap px-6 py-3 text-right text-sm font-semibold text-gray-900" data-testid="total-debits">
                  {formatCurrency(totalDebits)}
                </td>
                <td className="whitespace-nowrap px-6 py-3 text-right text-sm font-semibold text-gray-900" data-testid="total-credits">
                  {formatCurrency(totalCredits)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Balance warning */}
        {!isBalanced && (
          <div
            className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
            data-testid="unbalanced-warning"
          >
            Warning: This journal entry is unbalanced. Total debits ({formatCurrency(totalDebits)}) do
            not equal total credits ({formatCurrency(totalCredits)}).
          </div>
        )}
      </div>
    </PageContainer>
  );
}
