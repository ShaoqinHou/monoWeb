import { useState, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Search } from 'lucide-react';
import type { Budget } from '../hooks/useBudgets';

interface BudgetListProps {
  budgets: Budget[];
  onSelect?: (budget: Budget) => void;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
];

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  archived: 'bg-yellow-100 text-yellow-700',
};

export function BudgetList({ budgets, onSelect }: BudgetListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    let result = budgets;

    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(query) ||
          b.financialYear.toLowerCase().includes(query),
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((b) => b.status === statusFilter);
    }

    return result;
  }, [budgets, search, statusFilter]);

  return (
    <div className="space-y-4" data-testid="budget-list">
      {/* Filters */}
      <div className="flex items-end gap-4">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Search budgets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startIcon={<Search className="h-4 w-4" />}
            aria-label="Search budgets"
          />
        </div>
        <div className="w-48">
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          />
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Financial Year</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <td colSpan={3} className="px-4 py-12 text-center">
                <p className="text-base font-medium text-gray-900">No budgets found</p>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter to find what you&apos;re looking for.</p>
              </td>
            </TableRow>
          ) : (
            filtered.map((budget) => (
              <TableRow
                key={budget.id}
                className={onSelect ? 'cursor-pointer' : ''}
                onClick={() => onSelect?.(budget)}
              >
                <TableCell className="font-medium">{budget.name}</TableCell>
                <TableCell>{budget.financialYear}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      STATUS_COLORS[budget.status] ?? 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
