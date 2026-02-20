import { useState } from 'react';
import { PageContainer } from '../../../../components/layout/PageContainer';
import { Card, CardHeader, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead } from '../../../../components/ui/Table';
import { CashCodingRow } from '../components/CashCodingRow';
import { useBankAccounts, useBankTransactions } from '../hooks/useBank';
import { useUpdateBankTransaction } from '../hooks/useBankTransactions';
import { Select } from '../../../../components/ui/Select';
import { showToast } from '../../../dashboard/components/ToastContainer';

interface CodingEntry {
  accountCode: string;
  taxRate: string;
}

export function CashCodingPage() {
  const accountsQuery = useBankAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const transactionsQuery = useBankTransactions(selectedAccountId);
  const updateMutation = useUpdateBankTransaction();

  const [coding, setCoding] = useState<Record<string, CodingEntry>>({});

  const accounts = accountsQuery.data ?? [];
  const accountOptions = accounts.map((a) => ({
    value: a.id,
    label: `${a.name} (${a.accountNumber})`,
  }));

  const unreconciledTransactions = (transactionsQuery.data ?? []).filter(
    (t) => t.status === 'unmatched',
  );

  const handleCodingChange = (
    transactionId: string,
    field: 'accountCode' | 'taxRate',
    value: string,
  ) => {
    setCoding((prev) => ({
      ...prev,
      [transactionId]: {
        ...prev[transactionId],
        [field]: value,
      },
    }));
  };

  const codedCount = Object.values(coding).filter((c) => c.accountCode).length;

  const handleSaveAll = async () => {
    const entries = Object.entries(coding).filter(([, v]) => v.accountCode);

    try {
      for (const [txId, entry] of entries) {
        await updateMutation.mutateAsync({
          id: txId,
          category: entry.accountCode,
          isReconciled: true,
        });
      }

      setCoding({});
      showToast('success', 'Transactions coded successfully');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save transactions');
    }
  };

  return (
    <PageContainer
      title="Cash Coding"
      breadcrumbs={[
        { label: 'Bank', href: '/bank' },
        { label: 'Cash Coding' },
      ]}
    >
      <div className="space-y-6" data-testid="cash-coding-page">
        <Select
          label="Bank Account"
          options={accountOptions}
          value={selectedAccountId}
          onChange={(e) => {
            setSelectedAccountId(e.target.value);
            setCoding({});
          }}
          placeholder="Select a bank account"
          data-testid="cashcoding-account-select"
        />

        {selectedAccountId && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Unreconciled Transactions ({unreconciledTransactions.length})
                </h2>
                <Button
                  onClick={handleSaveAll}
                  disabled={codedCount === 0}
                  loading={updateMutation.isPending}
                  data-testid="cashcoding-save-all"
                >
                  Save All ({codedCount})
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {unreconciledTransactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Account Code</TableHead>
                      <TableHead>Tax Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unreconciledTransactions.map((tx) => (
                      <CashCodingRow
                        key={tx.id}
                        transaction={tx}
                        accountCode={coding[tx.id]?.accountCode ?? ''}
                        taxRate={coding[tx.id]?.taxRate ?? ''}
                        onChange={handleCodingChange}
                      />
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-6 text-center text-gray-500" data-testid="no-unreconciled">
                  All transactions are reconciled.
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </PageContainer>
  );
}
