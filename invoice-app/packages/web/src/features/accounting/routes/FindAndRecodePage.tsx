import { useState, useCallback } from 'react';
import { showToast } from '../../dashboard/components/ToastContainer';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { FindRecodeForm } from '../components/FindRecodeForm';
import { useSearchTransactions, useRecodeTransactions } from '../hooks/useFindRecode';
import type { TransactionSearchFilters, TransactionResult } from '../hooks/useFindRecode';
import type { SelectOption } from '../../../components/ui/Select';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
  }).format(amount);
}

const TYPE_LABELS: Record<string, string> = {
  invoice: 'Invoice',
  bill: 'Bill',
  journal: 'Journal',
};

const TAX_RATE_OPTIONS: SelectOption[] = [
  { value: '', label: 'Keep existing' },
  { value: '0', label: '0% (No GST)' },
  { value: '15', label: '15% (GST)' },
];

export function FindAndRecodePage() {
  const [filters, setFilters] = useState<TransactionSearchFilters | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [newAccountCode, setNewAccountCode] = useState('');
  const [newTaxRate, setNewTaxRate] = useState('');

  const { data: results = [], isLoading: isSearching } = useSearchTransactions(filters);
  const recode = useRecodeTransactions();

  const handleSearch = useCallback((f: TransactionSearchFilters) => {
    setFilters(f);
    setSelected(new Set());
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selected.size === results.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(results.map((r: TransactionResult) => r.id)));
    }
  }, [selected.size, results]);

  const handleRecode = useCallback(() => {
    if (selected.size === 0 || !newAccountCode.trim()) return;
    recode.mutate(
      {
        transactionIds: Array.from(selected),
        newAccountCode: newAccountCode.trim(),
        newTaxRate: newTaxRate ? parseFloat(newTaxRate) : undefined,
      },
      {
        onSuccess: () => {
          setSelected(new Set());
          setNewAccountCode('');
          setNewTaxRate('');
          setFilters(null);
          showToast('success', 'Transactions recoded');
        },
        onError: (err: Error) => {
          showToast('error', err.message || 'Failed to recode transactions');
        },
      },
    );
  }, [selected, newAccountCode, newTaxRate, recode]);

  return (
    <PageContainer
      title="Find & Recode"
      breadcrumbs={[
        { label: 'Accounting', href: '/accounting' },
        { label: 'Find & Recode' },
      ]}
    >
      <div className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Search Transactions</h2>
          <FindRecodeForm onSearch={handleSearch} isLoading={isSearching} />
        </div>

        {filters && (
          <div className="space-y-4">
            {isSearching ? (
              <div className="py-8 text-center text-gray-500" data-testid="search-loading">
                Searching transactions...
              </div>
            ) : results.length === 0 ? (
              <div className="py-8 text-center text-gray-500" data-testid="search-empty">
                No transactions found matching your criteria.
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600" data-testid="result-count">
                    {results.length} transaction{results.length !== 1 ? 's' : ''} found
                  </p>
                  <span className="text-sm text-gray-500">
                    {selected.size} selected
                  </span>
                </div>

                <Table data-testid="results-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <input
                          type="checkbox"
                          checked={selected.size === results.length && results.length > 0}
                          onChange={toggleAll}
                          data-testid="select-all-checkbox"
                          className="rounded border-gray-300"
                        />
                      </TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((txn: TransactionResult) => (
                      <TableRow key={txn.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selected.has(txn.id)}
                            onChange={() => toggleSelect(txn.id)}
                            data-testid={`select-${txn.id}`}
                            className="rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell className="text-gray-500 whitespace-nowrap">{txn.date}</TableCell>
                        <TableCell>{TYPE_LABELS[txn.type] ?? txn.type}</TableCell>
                        <TableCell className="text-gray-500">{txn.reference}</TableCell>
                        <TableCell>{txn.description}</TableCell>
                        <TableCell>
                          <span className="text-gray-500">{txn.accountCode}</span>
                          {' '}
                          {txn.accountName}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(txn.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {selected.size > 0 && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4" data-testid="recode-panel">
                    <h3 className="mb-3 text-sm font-semibold text-gray-900">
                      Recode {selected.size} Transaction{selected.size !== 1 ? 's' : ''}
                    </h3>
                    <div className="flex items-end gap-4">
                      <Input
                        label="New Account Code"
                        placeholder="e.g. 4-0200"
                        value={newAccountCode}
                        onChange={(e) => setNewAccountCode(e.target.value)}
                        data-testid="recode-account-code"
                      />
                      <Select
                        label="New Tax Rate"
                        options={TAX_RATE_OPTIONS}
                        value={newTaxRate}
                        onChange={(e) => setNewTaxRate(e.target.value)}
                        data-testid="recode-tax-rate"
                      />
                      <Button
                        onClick={handleRecode}
                        loading={recode.isPending}
                        disabled={!newAccountCode.trim()}
                        data-testid="apply-recode-btn"
                      >
                        Apply Recode
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
