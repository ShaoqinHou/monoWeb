import { PageContainer } from '../../../../components/layout/PageContainer';
import { Card, CardHeader, CardContent } from '../../../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../components/ui/Table';
import { useBankAccounts, useBankTransactions } from '../hooks/useBank';
import { formatCurrency } from '@shared/calc/currency';

interface AccountSummary {
  accountId: string;
  accountName: string;
  totalReconciled: number;
  totalUnreconciled: number;
  reconciledCount: number;
  unreconciledCount: number;
}

function AccountTransactionsSummary({ accountId, accountName }: { accountId: string; accountName: string }) {
  const transactionsQuery = useBankTransactions(accountId);
  const transactions = transactionsQuery.data ?? [];

  const reconciled = transactions.filter((t) => t.status === 'matched');
  const unreconciled = transactions.filter((t) => t.status === 'unmatched');

  const totalReconciled = reconciled.reduce((sum, t) => sum + t.amount, 0);
  const totalUnreconciled = unreconciled.reduce((sum, t) => sum + t.amount, 0);

  return (
    <TableRow data-testid={`report-row-${accountId}`}>
      <TableCell className="font-medium">{accountName}</TableCell>
      <TableCell className="text-right">{reconciled.length}</TableCell>
      <TableCell className="text-right">{formatCurrency(totalReconciled)}</TableCell>
      <TableCell className="text-right">{unreconciled.length}</TableCell>
      <TableCell className="text-right">{formatCurrency(totalUnreconciled)}</TableCell>
    </TableRow>
  );
}

export function ReconciliationReportPage() {
  const accountsQuery = useBankAccounts();
  const accounts = accountsQuery.data ?? [];

  return (
    <PageContainer
      title="Reconciliation Report"
      breadcrumbs={[
        { label: 'Bank', href: '/bank' },
        { label: 'Reconciliation Report' },
      ]}
    >
      <div data-testid="reconciliation-report-page">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Reconciliation Summary</h2>
          </CardHeader>
          <CardContent className="p-0">
            {accounts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Reconciled Count</TableHead>
                    <TableHead className="text-right">Reconciled Total</TableHead>
                    <TableHead className="text-right">Unreconciled Count</TableHead>
                    <TableHead className="text-right">Unreconciled Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <AccountTransactionsSummary
                      key={account.id}
                      accountId={account.id}
                      accountName={account.name}
                    />
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-6 text-center text-gray-500" data-testid="no-accounts">
                No bank accounts found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
