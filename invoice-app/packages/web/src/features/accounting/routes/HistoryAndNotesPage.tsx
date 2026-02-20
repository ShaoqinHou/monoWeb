import { useState, useMemo } from 'react';
import { Download, Search } from 'lucide-react';
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
import type { SelectOption } from '../../../components/ui/Select';

/** History entry types */
type HistoryType = 'login' | 'invoice' | 'payment' | 'journal' | 'contact' | 'settings';

interface HistoryEntry {
  id: string;
  date: string;
  user: string;
  type: HistoryType;
  detail: string;
}

/** Mock history data */
const MOCK_HISTORY: HistoryEntry[] = [
  { id: 'h1', date: '2026-02-17 14:30', user: 'John Smith', type: 'login', detail: 'Logged in from 192.168.1.1' },
  { id: 'h2', date: '2026-02-17 14:25', user: 'Jane Doe', type: 'invoice', detail: 'Created invoice INV-0042' },
  { id: 'h3', date: '2026-02-17 13:10', user: 'John Smith', type: 'payment', detail: 'Recorded payment of $1,500.00' },
  { id: 'h4', date: '2026-02-16 16:45', user: 'Jane Doe', type: 'journal', detail: 'Posted manual journal JE-0015' },
  { id: 'h5', date: '2026-02-16 10:00', user: 'Bob Wilson', type: 'contact', detail: 'Updated contact ABC Ltd' },
  { id: 'h6', date: '2026-02-15 09:30', user: 'John Smith', type: 'settings', detail: 'Changed organisation financial year end' },
  { id: 'h7', date: '2026-02-14 11:20', user: 'Jane Doe', type: 'invoice', detail: 'Voided invoice INV-0038' },
  { id: 'h8', date: '2026-02-13 15:00', user: 'Bob Wilson', type: 'payment', detail: 'Recorded payment of $3,200.00' },
];

const USER_OPTIONS: SelectOption[] = [
  { value: '', label: 'All users' },
  { value: 'John Smith', label: 'John Smith' },
  { value: 'Jane Doe', label: 'Jane Doe' },
  { value: 'Bob Wilson', label: 'Bob Wilson' },
];

const TYPE_OPTIONS: SelectOption[] = [
  { value: '', label: 'All types' },
  { value: 'login', label: 'Login' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'payment', label: 'Payment' },
  { value: 'journal', label: 'Journal' },
  { value: 'contact', label: 'Contact' },
  { value: 'settings', label: 'Settings' },
];

const TYPE_LABELS: Record<HistoryType, string> = {
  login: 'Login',
  invoice: 'Invoice',
  payment: 'Payment',
  journal: 'Journal',
  contact: 'Contact',
  settings: 'Settings',
};

export function HistoryAndNotesPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHistory = useMemo(() => {
    let result = MOCK_HISTORY;

    if (startDate) {
      result = result.filter((h) => h.date >= startDate);
    }
    if (endDate) {
      result = result.filter((h) => h.date <= endDate + ' 23:59');
    }
    if (userFilter) {
      result = result.filter((h) => h.user === userFilter);
    }
    if (typeFilter) {
      result = result.filter((h) => h.type === typeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((h) => h.detail.toLowerCase().includes(q));
    }

    return result;
  }, [startDate, endDate, userFilter, typeFilter, searchQuery]);

  return (
    <PageContainer
      title="History and Notes"
      breadcrumbs={[
        { label: 'Accounting', href: '/accounting/chart-of-accounts' },
        { label: 'History and Notes' },
      ]}
      actions={
        <Button variant="outline" size="sm" data-testid="history-export">
          <Download className="mr-1 h-4 w-4" />
          Export
        </Button>
      }
    >
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-4" data-testid="history-filters">
        <div>
          <Input
            label="Start date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            data-testid="history-start-date"
          />
        </div>
        <div>
          <Input
            label="End date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            data-testid="history-end-date"
          />
        </div>
        <div className="min-w-[160px]">
          <Select
            label="User"
            options={USER_OPTIONS}
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            data-testid="history-user-filter"
          />
        </div>
        <div className="min-w-[160px]">
          <Select
            label="Type"
            options={TYPE_OPTIONS}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            data-testid="history-type-filter"
          />
        </div>
        <div className="min-w-[200px]">
          <Input
            label="Search in results"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startIcon={<Search className="h-4 w-4" />}
            data-testid="history-search"
          />
        </div>
      </div>

      {/* Result count */}
      <div className="mb-2 text-sm text-[#6b7280]" data-testid="history-result-count">
        Showing {filteredHistory.length} {filteredHistory.length === 1 ? 'result' : 'results'}
      </div>

      {/* History table */}
      <Table data-testid="history-table">
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Detail</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredHistory.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-[#6b7280]">
                No history entries match your filters.
              </TableCell>
            </TableRow>
          ) : (
            filteredHistory.map((entry) => (
              <TableRow key={entry.id} data-testid={`history-row-${entry.id}`}>
                <TableCell className="whitespace-nowrap">{entry.date}</TableCell>
                <TableCell>{entry.user}</TableCell>
                <TableCell>{TYPE_LABELS[entry.type]}</TableCell>
                <TableCell>{entry.detail}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </PageContainer>
  );
}
