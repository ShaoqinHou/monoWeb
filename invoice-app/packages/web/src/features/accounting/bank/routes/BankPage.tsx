import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { PageContainer } from '../../../../components/layout/PageContainer';
import { Card, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { BankAccountSelector } from '../components/BankAccountSelector';
import { BankTransactionList } from '../components/BankTransactionList';
import { ImportDialog } from '../components/ImportDialog';
import { ImportWizard } from '../components/ImportWizard';
import { useBankAccounts, useBankTransactions, useStatementBalance } from '../hooks/useBank';
import { formatCurrency } from '@shared/calc/currency';

export function BankReconciliationPage() {
  const accountsQuery = useBankAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [manageOpenId, setManageOpenId] = useState<string | null>(null);
  const transactionsQuery = useBankTransactions(selectedAccountId);
  const balanceQuery = useStatementBalance(selectedAccountId);

  // Auto-select first account when loaded
  useEffect(() => {
    if (accountsQuery.data && accountsQuery.data.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accountsQuery.data[0].id);
    }
  }, [accountsQuery.data, selectedAccountId]);

  // Enrich selected account with computed statement balance
  const enrichedAccounts = accountsQuery.data?.map((acc) => {
    if (acc.id === selectedAccountId && balanceQuery.data !== undefined) {
      return { ...acc, statementBalance: balanceQuery.data };
    }
    return acc;
  });

  const accounts = accountsQuery.data ?? [];
  const unmatchedCount = transactionsQuery.data?.filter((t) => t.status === 'unmatched').length ?? 0;
  const totalTransactionCount = transactionsQuery.data?.length ?? 0;

  return (
    <PageContainer
      title="Bank accounts"
      breadcrumbs={[{ label: 'Bank accounts' }]}
    >
      <div className="space-y-6">
        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between" data-testid="bank-toolbar">
          <Link to="/accounting/bank-rules" className="text-sm font-medium text-blue-600 hover:underline" data-testid="manage-bank-rules-link">
            Manage bank rules
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" data-testid="add-bank-account-btn" onClick={() => setWizardOpen(true)}>
              Add bank account
            </Button>
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setActionsOpen((v) => !v)}
                data-testid="additional-actions-btn"
              >
                Additional actions
              </Button>
              {actionsOpen && (
                <div
                  className="absolute right-0 z-10 mt-1 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
                  data-testid="additional-actions-dropdown"
                >
                  <Link
                    to="/bank/cash-coding"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Cash Coding
                  </Link>
                  <Link
                    to="/bank/reconciliation-report"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Reconciliation Report
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Bank Overview Section ── */}
        <div data-testid="bank-overview">
          {/* Account summary cards */}
          {accountsQuery.isLoading && (
            <div className="text-sm text-gray-500">Loading accounts...</div>
          )}

          {accounts.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="account-cards">
              {accounts.map((account) => {
                const isSelected = selectedAccountId === account.id;
                const cardUnmatched = isSelected ? unmatchedCount : 0;
                const hasTransactions = isSelected && totalTransactionCount > 0;
                return (
                  <Card key={account.id} data-testid={`account-card-${account.id}`}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <Link
                            to="/bank"
                            title="Bank account detail — not yet implemented"
                            className="text-base font-semibold text-[#0078c8] hover:underline"
                            data-testid={`account-name-link-${account.id}`}
                          >
                            {account.name}
                          </Link>
                          <div className="mt-0.5 text-sm text-gray-500" data-testid={`account-number-${account.id}`}>
                            {account.accountNumber}
                          </div>
                        </div>
                        <div className="relative">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setManageOpenId(manageOpenId === account.id ? null : account.id)}
                            data-testid={`manage-menu-toggle-${account.id}`}
                            aria-label={`Manage ${account.name}`}
                          >
                            Manage
                          </Button>
                          {manageOpenId === account.id && (
                            <div
                              className="absolute right-0 z-10 mt-1 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
                              data-testid={`manage-menu-${account.id}`}
                            >
                              <button
                                type="button"
                                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => {
                                  setSelectedAccountId(account.id);
                                  setImportOpen(true);
                                  setManageOpenId(null);
                                }}
                              >
                                Import a bank statement
                              </button>
                              <button
                                type="button"
                                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                              >
                                Bank statement settings
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Reconcile button */}
                      <div className="mt-3">
                        <Button
                          variant="primary"
                          className="w-full text-sm"
                          onClick={() => setSelectedAccountId(account.id)}
                          data-testid={`reconcile-btn-${account.id}`}
                        >
                          Reconcile {cardUnmatched} items
                        </Button>
                      </div>

                      {/* Balance table */}
                      <div className="mt-3 space-y-1 text-sm" data-testid={`balance-table-${account.id}`}>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Balance in Xero</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(account.balance)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500" data-testid={`statement-balance-label-${account.id}`}>
                            Statement balance
                          </span>
                          <span className="font-semibold text-gray-900">{formatCurrency(account.statementBalance)}</span>
                        </div>
                      </div>

                      {/* Empty account state */}
                      {isSelected && !hasTransactions && !transactionsQuery.isLoading && (
                        <div className="mt-3 text-center" data-testid={`no-transactions-${account.id}`}>
                          <p className="text-sm text-gray-500">No transactions imported</p>
                          <Button
                            variant="outline"
                            className="mt-2 text-xs"
                            onClick={() => {
                              setSelectedAccountId(account.id);
                              setImportOpen(true);
                            }}
                            data-testid={`import-statement-btn-${account.id}`}
                          >
                            Import a bank statement
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Quick action buttons */}
          <div className="mt-4 flex flex-wrap gap-3" data-testid="bank-actions">
            <Link to="/bank/spend">
              <Button variant="outline" data-testid="action-spend">
                Spend Money
              </Button>
            </Link>
            <Link to="/bank/receive">
              <Button variant="outline" data-testid="action-receive">
                Receive Money
              </Button>
            </Link>
            <Link to="/bank/transfer">
              <Button variant="outline" data-testid="action-transfer">
                Transfer Money
              </Button>
            </Link>
            <Link to="/bank/cash-coding">
              <Button variant="outline" data-testid="action-cash-coding">
                Cash Coding
              </Button>
            </Link>
            <Link to="/bank/reconciliation-report">
              <Button variant="outline" data-testid="action-report">
                Reconciliation Report
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Reconciliation Section ── */}
        <div data-testid="bank-reconciliation-section">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Reconciliation</h2>

          {/* Header row with import button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {unmatchedCount > 0 && (
                <span
                  className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-800"
                  data-testid="page-unreconciled-badge"
                >
                  {unmatchedCount} to reconcile
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setWizardOpen(true)}
                disabled={!selectedAccountId}
                data-testid="smart-import-btn"
              >
                Smart Import
              </Button>
              <Button
                variant="primary"
                onClick={() => setImportOpen(true)}
                disabled={!selectedAccountId}
                data-testid="import-btn"
              >
                Import Transactions
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <BankAccountSelector
              accounts={enrichedAccounts}
              selectedAccountId={selectedAccountId}
              onAccountChange={setSelectedAccountId}
              isLoading={accountsQuery.isLoading}
            />
          </div>

          {/* Statement balance card */}
          {selectedAccountId && balanceQuery.data !== undefined && (
            <div
              className="mt-4 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm"
              data-testid="statement-balance"
            >
              <span className="text-gray-500">Computed Statement Balance: </span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(balanceQuery.data)}
              </span>
            </div>
          )}

          {accountsQuery.isError && (
            <div className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-700" data-testid="accounts-error">
              Failed to load bank accounts. Please try again.
            </div>
          )}

          {accountsQuery.data && accountsQuery.data.length === 0 && (
            <div className="mt-4 rounded-md bg-gray-50 p-6 text-center text-gray-500" data-testid="no-accounts">
              No bank accounts found. Add an asset-type account in Accounting to get started.
            </div>
          )}

          {selectedAccountId && (
            <div className="mt-4">
              <BankTransactionList
                transactions={transactionsQuery.data}
                isLoading={transactionsQuery.isLoading}
              />
            </div>
          )}
        </div>

        {/* Import dialog (simple) */}
        <ImportDialog
          open={importOpen}
          onClose={() => setImportOpen(false)}
          accountId={selectedAccountId}
        />

        {/* Import wizard (smart multi-step) */}
        <ImportWizard
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          accountId={selectedAccountId}
        />
      </div>
    </PageContainer>
  );
}
