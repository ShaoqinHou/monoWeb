import { useState, useMemo } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { showToast } from '../../dashboard/components/ToastContainer';
import { Search, Lock } from 'lucide-react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import type { SelectOption } from '../../../components/ui/Select';
import { Tabs, TabList, Tab, TabPanel } from '../../../components/ui/Tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { Pagination } from '../../../components/patterns/Pagination';
import { SortableHeader } from '../../../components/patterns/SortableHeader';
import type { SortDirection } from '../../../components/patterns/SortableHeader';
import type { ComboboxOption } from '../../../components/ui/Combobox';
import { AccountList } from '../components/AccountList';
import { BankAccountCard } from '../components/BankAccountCard';
import { JournalEntryList } from '../components/JournalEntryList';
import { JournalEntryForm } from '../components/JournalEntryForm';
import { isSystemAccount } from '../components/SystemAccountBadge';
import { NotImplemented } from '../../../components/patterns/NotImplemented';
import { useAccountGroups, useAccounts, useBankAccounts, useCreateAccount } from '../hooks/useAccounts';
import { useJournals, useCreateJournal } from '../hooks/useJournals';
import { usePagination } from '../../../lib/usePagination';
import { formatCurrency } from '../../../../../shared/calc/currency';
import type { JournalStatus, AccountWithBalance } from '../types';

/** Account type filter tabs for Chart of Accounts */
const COA_TABS = [
  { id: 'all', label: 'All Accounts' },
  { id: 'asset', label: 'Assets' },
  { id: 'liability', label: 'Liabilities' },
  { id: 'equity', label: 'Equity' },
  { id: 'expense', label: 'Expenses' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'archive', label: 'Archive' },
] as const;

type CoaTabId = (typeof COA_TABS)[number]['id'];

/** Chart of Accounts page */
export function ChartOfAccountsPage() {
  const { data: groups, isLoading, error } = useAccountGroups();
  const [activeTab, setActiveTab] = useState<CoaTabId>('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [coaSortField, setCoaSortField] = useState<string>('code');
  const [coaSortDir, setCoaSortDir] = useState<SortDirection>('asc');

  const handleCoaSort = (field: string, direction: SortDirection) => {
    setCoaSortField(field);
    setCoaSortDir(direction);
  };

  const filteredGroups = useMemo(() => {
    if (!groups) return undefined;
    let result = groups;
    if (activeTab === 'archive') {
      result = result
        .map((g) => ({
          ...g,
          accounts: g.accounts.filter((a) => a.isArchived),
        }))
        .filter((g) => g.accounts.length > 0);
    } else if (activeTab !== 'all') {
      result = result.filter((g) => g.type === activeTab);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result
        .map((g) => ({
          ...g,
          accounts: g.accounts.filter(
            (a) =>
              a.code.toLowerCase().includes(q) ||
              a.name.toLowerCase().includes(q),
          ),
        }))
        .filter((g) => g.accounts.length > 0);
    }
    return result;
  }, [groups, activeTab, search]);

  /** Flat list of accounts for pagination, with sorting applied */
  const allAccounts = useMemo(() => {
    if (!filteredGroups) return [];
    const flat = filteredGroups.flatMap((g) => g.accounts);
    return [...flat].sort((a, b) => {
      let aVal: string;
      let bVal: string;
      switch (coaSortField) {
        case 'name': aVal = a.name; bVal = b.name; break;
        case 'type': aVal = a.type; bVal = b.type; break;
        case 'taxRate': aVal = a.taxType; bVal = b.taxType; break;
        case 'reportCode': aVal = a.reportCode ?? ''; bVal = b.reportCode ?? ''; break;
        case 'code':
        default: aVal = a.code; bVal = b.code; break;
      }
      const cmp = aVal.localeCompare(bVal);
      return coaSortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredGroups, coaSortField, coaSortDir]);

  const pagination = usePagination(allAccounts, { defaultPageSize: 50 });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === allAccounts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allAccounts.map((a) => a.id)));
    }
  };

  return (
    <PageContainer
      title="Chart of accounts"
      breadcrumbs={[
        { label: 'Settings', href: '/settings' },
        { label: 'Chart of accounts' },
      ]}
      actions={
        <Link to="/accounting/chart-of-accounts/new">
          <Button>Add Account</Button>
        </Link>
      }
    >
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2" data-testid="coa-toolbar">
        <NotImplemented label="Add Bank Account — not yet implemented">
          <Button variant="outline" size="sm" data-testid="coa-add-bank">Add Bank Account</Button>
        </NotImplemented>
        <NotImplemented label="Print PDF — not yet implemented">
          <Button variant="outline" size="sm" data-testid="coa-print-pdf">Print PDF</Button>
        </NotImplemented>
        <NotImplemented label="Import — not yet implemented">
          <Button variant="outline" size="sm" data-testid="coa-import">Import</Button>
        </NotImplemented>
        <NotImplemented label="Export — not yet implemented">
          <Button variant="outline" size="sm" data-testid="coa-export">Export</Button>
        </NotImplemented>
        <NotImplemented label="Edit Report Code Mappings — not yet implemented">
          <Button variant="outline" size="sm" data-testid="coa-edit-report-codes">Edit Report Code Mappings</Button>
        </NotImplemented>
      </div>

      {/* Bulk actions */}
      <div className="mb-4 flex flex-wrap items-center gap-2" data-testid="coa-bulk-actions">
        <NotImplemented label="Delete accounts — not yet implemented">
          <Button variant="outline" size="sm" disabled={selectedIds.size === 0} data-testid="coa-delete">Delete</Button>
        </NotImplemented>
        <NotImplemented label="Archive accounts — not yet implemented">
          <Button variant="outline" size="sm" disabled={selectedIds.size === 0} data-testid="coa-archive">Archive</Button>
        </NotImplemented>
        <NotImplemented label="Change Tax Rate — not yet implemented">
          <Button variant="outline" size="sm" disabled={selectedIds.size === 0} data-testid="coa-change-tax">Change Tax Rate</Button>
        </NotImplemented>
        {selectedIds.size === 0 && (
          <span className="text-sm text-gray-500" data-testid="coa-no-selection-text">No accounts selected</span>
        )}
        {selectedIds.size > 0 && (
          <span className="text-sm text-gray-700" data-testid="coa-selection-count">{selectedIds.size} account{selectedIds.size !== 1 ? 's' : ''} selected</span>
        )}
      </div>

      {/* Search */}
      <div className="mb-4 flex max-w-sm items-center gap-2" data-testid="coa-search">
        <Input
          placeholder="Search accounts"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startIcon={<Search className="h-4 w-4" />}
          data-testid="coa-search-input"
        />
        <Button variant="outline" size="sm" data-testid="coa-search-btn">Search</Button>
      </div>

      <Tabs defaultTab="all" onChange={(id) => setActiveTab(id as CoaTabId)}>
        <TabList>
          {COA_TABS.map((tab) => (
            <Tab key={tab.id} tabId={tab.id} data-testid={`coa-tab-${tab.id}`}>
              {tab.label}
            </Tab>
          ))}
        </TabList>

        {COA_TABS.map((tab) => (
          <TabPanel key={tab.id} tabId={tab.id}>
            {isLoading && <p className="text-gray-500">Loading accounts...</p>}
            {error && <p className="text-red-600">Failed to load accounts.</p>}
            {filteredGroups && (
              <>
                <Table data-testid="coa-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <input
                          type="checkbox"
                          checked={allAccounts.length > 0 && selectedIds.size === allAccounts.length}
                          onChange={toggleSelectAll}
                          aria-label="Select all accounts"
                          data-testid="coa-select-all"
                        />
                      </TableHead>
                      <SortableHeader
                        label="Code"
                        field="code"
                        currentSort={coaSortField}
                        currentDirection={coaSortDir}
                        onSort={handleCoaSort}
                        data-testid="coa-sort-code"
                      />
                      <SortableHeader
                        label="Name"
                        field="name"
                        currentSort={coaSortField}
                        currentDirection={coaSortDir}
                        onSort={handleCoaSort}
                        data-testid="coa-sort-name"
                      />
                      <SortableHeader
                        label="Type"
                        field="type"
                        currentSort={coaSortField}
                        currentDirection={coaSortDir}
                        onSort={handleCoaSort}
                        data-testid="coa-sort-type"
                      />
                      <SortableHeader
                        label="Tax Rate"
                        field="taxRate"
                        currentSort={coaSortField}
                        currentDirection={coaSortDir}
                        onSort={handleCoaSort}
                        data-testid="coa-sort-tax-rate"
                      />
                      <SortableHeader
                        label="Report Code"
                        field="reportCode"
                        currentSort={coaSortField}
                        currentDirection={coaSortDir}
                        onSort={handleCoaSort}
                        data-testid="coa-sort-report-code"
                      />
                      <TableHead className="text-right">YTD</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagination.pageData.length === 0 ? (
                      <TableRow>
                        <td colSpan={7} className="px-4 py-12 text-center" data-testid="coa-empty">
                          <h3 className="text-lg font-medium text-gray-900">No accounts match your search</h3>
                          <p className="mt-1 text-sm text-gray-500">Try a different search term or clear the filter</p>
                        </td>
                      </TableRow>
                    ) : (
                      pagination.pageData.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="w-10">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(account.id)}
                              onChange={() => toggleSelect(account.id)}
                              aria-label={`Select ${account.name}`}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-sm text-gray-500">
                            {account.code}
                          </TableCell>
                          <TableCell className="font-medium">
                            <span className="inline-flex items-center gap-2">
                              {account.name}
                              {isSystemAccount(account.code) && (
                                <Lock className="h-3 w-3 text-[#6b7280]" data-testid={`lock-${account.id}`} />
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="capitalize">{account.type}</TableCell>
                          <TableCell>{account.taxType === 'none' ? 'No Tax' : account.taxType === 'output' ? 'GST on Sales' : 'GST on Purchases'}</TableCell>
                          <TableCell>{account.reportCode ?? '-'}</TableCell>
                          <TableCell className="text-right font-mono">
                            <a
                              href={`/reporting/account-transactions?account=${account.id}`}
                              className="text-[#0078c8] hover:underline"
                              data-testid={`ytd-link-${account.id}`}
                            >
                              {formatCurrency(account.balance)}
                            </a>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                <Pagination
                  page={pagination.page}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onChange={pagination.onChange}
                  data-testid="coa-pagination"
                />
              </>
            )}
          </TabPanel>
        ))}
      </Tabs>
    </PageContainer>
  );
}

const ACCOUNT_TYPE_OPTIONS: SelectOption[] = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'expense', label: 'Expense' },
  { value: 'asset', label: 'Asset' },
  { value: 'liability', label: 'Liability' },
  { value: 'equity', label: 'Equity' },
];

const TAX_TYPE_OPTIONS: SelectOption[] = [
  { value: 'none', label: 'No Tax' },
  { value: 'output', label: 'GST on Sales (Output)' },
  { value: 'input', label: 'GST on Purchases (Input)' },
];

/** Chart of Accounts — Create new account */
export function ChartOfAccountsCreatePage() {
  const navigate = useNavigate();
  const createAccount = useCreateAccount();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('revenue');
  const [taxType, setTaxType] = useState('none');
  const [description, setDescription] = useState('');

  const isValid = code.trim().length > 0 && name.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createAccount.mutate(
      {
        code: code.trim(),
        name: name.trim(),
        type: type as 'revenue' | 'expense' | 'asset' | 'liability' | 'equity',
        taxType: taxType as 'output' | 'input' | 'none',
        description: description.trim() || undefined,
        isArchived: false,
      },
      {
        onSuccess: () => {
          showToast('success', 'Account created');
          navigate({ to: '/accounting/chart-of-accounts' });
        },
        onError: (err) => {
          showToast('error', err.message || 'Failed to create account');
        },
      },
    );
  };

  return (
    <PageContainer
      title="New Account"
      breadcrumbs={[
        { label: 'Accounting', href: '/accounting' },
        { label: 'Chart of Accounts', href: '/accounting/chart-of-accounts' },
        { label: 'New Account' },
      ]}
    >
      <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6">

        <Input
          label="Account Code"
          id="account-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. 4-0000"
          required
        />

        <Input
          label="Account Name"
          id="account-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sales"
          required
        />

        <Select
          label="Account Type"
          id="account-type"
          options={ACCOUNT_TYPE_OPTIONS}
          value={type}
          onChange={(e) => setType(e.target.value)}
        />

        <Select
          label="Tax Type"
          id="tax-type"
          options={TAX_TYPE_OPTIONS}
          value={taxType}
          onChange={(e) => setTaxType(e.target.value)}
        />

        <Input
          label="Description"
          id="account-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
        />

        <div className="sticky bottom-0 z-10 bg-white border-t py-3 flex gap-4">
          <Button type="submit" disabled={!isValid || createAccount.isPending}>
            {createAccount.isPending ? 'Creating...' : 'Create Account'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate({ to: '/accounting/chart-of-accounts' })}
          >
            Cancel
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}

/** Bank Accounts page */
export function BankAccountsPage() {
  const { data: bankAccounts, isLoading, error } = useBankAccounts();
  const [showAddBankForm, setShowAddBankForm] = useState(false);

  return (
    <PageContainer
      title="Bank Accounts"
      breadcrumbs={[
        { label: 'Accounting', href: '/accounting' },
        { label: 'Bank Accounts' },
      ]}
      actions={
        <Button onClick={() => setShowAddBankForm(true)} data-testid="add-bank-account-btn">
          Add Bank Account
        </Button>
      }
    >
      {showAddBankForm && (
        <Card className="mb-4">
          <CardContent>
            <div className="flex items-center justify-between py-2">
              <p className="text-sm text-[#6b7280]">Bank account connection — coming soon</p>
              <Button variant="ghost" size="sm" onClick={() => setShowAddBankForm(false)}>Dismiss</Button>
            </div>
          </CardContent>
        </Card>
      )}
      {isLoading && <p className="text-gray-500">Loading bank accounts...</p>}
      {error && <p className="text-red-600">Failed to load bank accounts.</p>}
      {bankAccounts && bankAccounts.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {bankAccounts.map((account) => (
            <BankAccountCard key={account.id} account={account} />
          ))}
        </div>
      )}
      {bankAccounts && bankAccounts.length === 0 && (
        <div className="py-12 text-center" data-testid="bank-accounts-empty">
          <h3 className="text-lg font-medium text-gray-900">No bank accounts yet</h3>
          <p className="mt-1 text-sm text-gray-500">Connect a bank account to start reconciling transactions</p>
        </div>
      )}
    </PageContainer>
  );
}

/** Journal status filter tabs */
const JOURNAL_TABS = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'posted', label: 'Posted' },
  { id: 'voided', label: 'Voided' },
  { id: 'repeating', label: 'Repeating' },
  { id: 'archive', label: 'Archive' },
] as const;

type JournalTabId = (typeof JOURNAL_TABS)[number]['id'];

/** Manual Journals page */
export function ManualJournalsPage() {
  const { data: journals, isLoading, error } = useJournals();
  const { data: accounts } = useAccounts();
  const createJournal = useCreateJournal();
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<JournalTabId>('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [journalSortField, setJournalSortField] = useState<string>('date');
  const [journalSortDir, setJournalSortDir] = useState<SortDirection>('desc');

  const handleJournalSort = (field: string, direction: SortDirection) => {
    setJournalSortField(field);
    setJournalSortDir(direction);
  };

  const filteredJournals = useMemo(() => {
    if (!journals) return undefined;
    let result = journals;
    if (activeTab !== 'all' && activeTab !== 'repeating' && activeTab !== 'archive') {
      result = result.filter((j) => j.status === (activeTab as JournalStatus));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((j) => j.narration.toLowerCase().includes(q));
    }
    if (dateFrom) {
      result = result.filter((j) => j.date >= dateFrom);
    }
    if (dateTo) {
      result = result.filter((j) => j.date <= dateTo);
    }
    return result;
  }, [journals, activeTab, search, dateFrom, dateTo]);

  const sortedJournals = useMemo(() => {
    const list = filteredJournals ?? [];
    return [...list].sort((a, b) => {
      let cmp = 0;
      switch (journalSortField) {
        case 'narration': cmp = a.narration.localeCompare(b.narration); break;
        case 'debit': {
          const aDebit = a.lines.reduce((s, l) => s + l.debit, 0);
          const bDebit = b.lines.reduce((s, l) => s + l.debit, 0);
          cmp = aDebit - bDebit;
          break;
        }
        case 'credit': {
          const aCredit = a.lines.reduce((s, l) => s + l.credit, 0);
          const bCredit = b.lines.reduce((s, l) => s + l.credit, 0);
          cmp = aCredit - bCredit;
          break;
        }
        case 'date':
        default: cmp = a.date.localeCompare(b.date); break;
      }
      return journalSortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredJournals, journalSortField, journalSortDir]);

  const journalPagination = usePagination(sortedJournals);

  const itemCount = filteredJournals?.length ?? 0;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!filteredJournals) return;
    if (selectedIds.size === filteredJournals.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredJournals.map((j) => j.id)));
    }
  };

  const accountOptions: ComboboxOption[] = (accounts ?? []).map((a) => ({
    value: a.id,
    label: `${a.code} - ${a.name}`,
  }));

  const handleSubmit = (data: {
    date: string;
    narration: string;
    autoReversingDate?: string;
    isCashBasis?: boolean;
    status: 'draft' | 'posted';
    lines: Array<{
      accountId: string;
      description: string;
      debit: number;
      credit: number;
    }>;
  }) => {
    const accountMap = new Map((accounts ?? []).map((a) => [a.id, a.name]));
    createJournal.mutate(
      {
        date: data.date,
        narration: data.narration,
        status: data.status,
        lines: data.lines.map((l, i) => ({
          ...l,
          id: `new-${i}`,
          accountName: accountMap.get(l.accountId) ?? '',
        })),
      },
      {
        onSuccess: () => {
          setShowForm(false);
          showToast('success', 'Journal entry created');
        },
        onError: (err: Error) => {
          showToast('error', err.message || 'Failed to create journal entry');
        },
      },
    );
  };

  return (
    <PageContainer
      title="Manual journals"
      breadcrumbs={[
        { label: 'Accounting', href: '/accounting' },
        { label: 'Manual journals' },
      ]}
      actions={
        !showForm ? (
          <Button onClick={() => setShowForm(true)}>New Journal</Button>
        ) : undefined
      }
    >
      {showForm && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">New Journal Entry</h2>
          <JournalEntryForm
            accountOptions={accountOptions}
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
            loading={createJournal.isPending}
          />
        </div>
      )}

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2" data-testid="journal-toolbar">
        <NotImplemented label="Repeating journals — not yet implemented">
          <Link to="/accounting/manual-journals" className="text-sm text-blue-600 hover:underline" data-testid="journal-new-repeating">New Repeating Journal</Link>
        </NotImplemented>
        <NotImplemented label="Import journals — not yet implemented">
          <Link to="/accounting/manual-journals" className="text-sm text-blue-600 hover:underline" data-testid="journal-import">Import</Link>
        </NotImplemented>
        <NotImplemented label="Archive journals — not yet implemented">
          <Button variant="outline" size="sm" disabled={selectedIds.size === 0} data-testid="journal-archive">Archive</Button>
        </NotImplemented>
        <NotImplemented label="Void journals — not yet implemented">
          <Button variant="outline" size="sm" disabled={selectedIds.size === 0} data-testid="journal-void">Void</Button>
        </NotImplemented>
        <span className="text-sm text-gray-500" data-testid="journal-selection-info">
          {selectedIds.size === 0 ? 'No items selected' : `${selectedIds.size} item${selectedIds.size === 1 ? '' : 's'} selected`}
        </span>
      </div>

      {/* Date range filters + search */}
      <div className="mb-4 flex flex-wrap items-center gap-2" data-testid="journal-filters">
        <Input
          type="date"
          placeholder="Start date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          data-testid="journal-date-from"
        />
        <Input
          type="date"
          placeholder="End date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          data-testid="journal-date-to"
        />
        <div className="max-w-xs">
          <Input
            placeholder="Search journals"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startIcon={<Search className="h-4 w-4" />}
            data-testid="journal-search-input"
          />
        </div>
      </div>

      <Tabs defaultTab="all" onChange={(id) => setActiveTab(id as JournalTabId)}>
        <TabList>
          {JOURNAL_TABS.map((tab) => (
            <Tab key={tab.id} tabId={tab.id} data-testid={`journal-tab-${tab.id}`}>
              {tab.label}
            </Tab>
          ))}
        </TabList>

        {JOURNAL_TABS.map((tab) => (
          <TabPanel key={tab.id} tabId={tab.id}>
            {isLoading && <p className="text-gray-500">Loading journals...</p>}
            {error && <p className="text-red-600">Failed to load journals.</p>}
            {filteredJournals && (
              <>
                <div className="mb-2 text-sm text-[#6b7280]" data-testid="journal-item-count">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </div>
                <Table data-testid="journal-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <input
                          type="checkbox"
                          checked={filteredJournals.length > 0 && selectedIds.size === filteredJournals.length}
                          onChange={toggleSelectAll}
                          aria-label="Select all journals"
                          data-testid="journal-select-all"
                        />
                      </TableHead>
                      <SortableHeader
                        label="Narration"
                        field="narration"
                        currentSort={journalSortField}
                        currentDirection={journalSortDir}
                        onSort={handleJournalSort}
                        data-testid="journal-sort-narration"
                      />
                      <SortableHeader
                        label="Date"
                        field="date"
                        currentSort={journalSortField}
                        currentDirection={journalSortDir}
                        onSort={handleJournalSort}
                        data-testid="journal-sort-date"
                      />
                      <SortableHeader
                        label="Debit NZD"
                        field="debit"
                        currentSort={journalSortField}
                        currentDirection={journalSortDir}
                        onSort={handleJournalSort}
                        className="text-right"
                        data-testid="journal-sort-debit"
                      />
                      <SortableHeader
                        label="Credit NZD"
                        field="credit"
                        currentSort={journalSortField}
                        currentDirection={journalSortDir}
                        onSort={handleJournalSort}
                        className="text-right"
                        data-testid="journal-sort-credit"
                      />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredJournals.length === 0 ? (
                      <TableRow>
                        <td colSpan={5} className="px-4 py-12 text-center" data-testid="journals-empty">
                          <h3 className="text-lg font-medium text-gray-900">No journal entries yet</h3>
                          <p className="mt-1 text-sm text-gray-500">Record manual journal entries for adjustments</p>
                          <div className="mt-4">
                            <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
                              New Journal
                            </Button>
                          </div>
                        </td>
                      </TableRow>
                    ) : (
                      journalPagination.pageData.map((journal) => {
                        const totalDebit = journal.lines.reduce((sum, l) => sum + l.debit, 0);
                        const totalCredit = journal.lines.reduce((sum, l) => sum + l.credit, 0);
                        return (
                          <TableRow key={journal.id}>
                            <TableCell className="w-10">
                              <input
                                type="checkbox"
                                checked={selectedIds.has(journal.id)}
                                onChange={() => toggleSelect(journal.id)}
                                aria-label={`Select ${journal.narration}`}
                              />
                            </TableCell>
                            <TableCell>{journal.narration}</TableCell>
                            <TableCell className="whitespace-nowrap">{journal.date}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(totalDebit)}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(totalCredit)}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                <Pagination
                  page={journalPagination.page}
                  pageSize={journalPagination.pageSize}
                  total={journalPagination.total}
                  onChange={journalPagination.onChange}
                  data-testid="journal-pagination"
                />
              </>
            )}
          </TabPanel>
        ))}
      </Tabs>
    </PageContainer>
  );
}
