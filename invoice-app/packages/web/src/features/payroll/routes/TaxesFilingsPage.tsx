import { useState, useMemo, useCallback } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
} from '../../../components/ui/Table';
import { TaxFilingRow } from '../components/TaxFilingRow';
import type { TaxFiling } from '../components/TaxFilingRow';
import { NotImplemented } from '../../../components/patterns/NotImplemented';

/** Mock filings for now -- will be replaced by API hook when endpoint exists */
const INITIAL_FILINGS: TaxFiling[] = [
  { id: 'tf-001', period: 'Jan 2026', dueDate: '2026-02-20', status: 'filed', amount: 6442.32, irdStatus: 'accepted' },
  { id: 'tf-002', period: 'Feb 2026', dueDate: '2026-03-20', status: 'draft', amount: 6442.32, irdStatus: 'pending' },
  { id: 'tf-003', period: 'Dec 2025', dueDate: '2026-01-20', status: 'filed', amount: 6442.32, irdStatus: 'accepted' },
  { id: 'tf-004', period: 'Nov 2025', dueDate: '2025-12-20', status: 'overdue', amount: 5800.00, irdStatus: 'pending' },
];

type SortKey = 'period' | 'dueDate' | 'status' | 'amount' | 'irdStatus';
type SortDir = 'asc' | 'desc';

export function TaxesFilingsPage() {
  const [filings, setFilings] = useState<TaxFiling[]>(INITIAL_FILINGS);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>('dueDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleFile = (id: string) => {
    setFilings((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, status: 'filed' as const, irdStatus: 'submitted' as const } : f,
      ),
    );
  };

  const handleToggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    setSelected((prev) => {
      if (prev.size === filings.length) return new Set();
      return new Set(filings.map((f) => f.id));
    });
  }, [filings]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedFilings = useMemo(() => {
    let result = [...filings];

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (f) =>
          f.period.toLowerCase().includes(lower) ||
          f.status.toLowerCase().includes(lower) ||
          f.irdStatus.toLowerCase().includes(lower),
      );
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'amount') {
        cmp = a.amount - b.amount;
      } else {
        const aVal = String(a[sortKey]);
        const bVal = String(b[sortKey]);
        cmp = aVal.localeCompare(bVal);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [filings, search, sortKey, sortDir]);

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return '';
    return sortDir === 'asc' ? ' \u25B2' : ' \u25BC';
  };

  return (
    <PageContainer
      title="Taxes & Filings"
      breadcrumbs={[{ label: 'Payroll', href: '/payroll' }, { label: 'Taxes & Filings' }]}
      actions={
        <NotImplemented label="Download File — not yet implemented">
          <Button
            size="sm"
            variant="outline"
            data-testid="download-file-btn"
            disabled={selected.size === 0}
            onClick={() => {}}
          >
            Download File
          </Button>
        </NotImplemented>
      }
    >
      <div data-testid="taxes-filings-page" className="space-y-4">
        {/* Search */}
        <div className="max-w-xs">
          <Input
            placeholder="Search filings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search filings"
            data-testid="filings-search"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={selected.size === filings.length && filings.length > 0}
                  onChange={handleToggleAll}
                  aria-label="Select all filings"
                  data-testid="select-all-checkbox"
                  className="rounded border-gray-300"
                />
              </TableHead>
              <TableHead>
                <button type="button" onClick={() => handleSort('period')} className="font-medium" data-testid="sort-period">
                  Period{sortIndicator('period')}
                </button>
              </TableHead>
              <TableHead>
                <button type="button" onClick={() => handleSort('dueDate')} className="font-medium" data-testid="sort-dueDate">
                  Due Date{sortIndicator('dueDate')}
                </button>
              </TableHead>
              <TableHead>
                <button type="button" onClick={() => handleSort('status')} className="font-medium" data-testid="sort-status">
                  Status{sortIndicator('status')}
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button type="button" onClick={() => handleSort('amount')} className="font-medium" data-testid="sort-amount">
                  Amount{sortIndicator('amount')}
                </button>
              </TableHead>
              <TableHead>
                <button type="button" onClick={() => handleSort('irdStatus')} className="font-medium" data-testid="sort-irdStatus">
                  IRD Status{sortIndicator('irdStatus')}
                </button>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedFilings.map((filing) => (
              <TaxFilingRow
                key={filing.id}
                filing={filing}
                onFile={handleFile}
                selected={selected.has(filing.id)}
                onToggleSelect={handleToggle}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </PageContainer>
  );
}
