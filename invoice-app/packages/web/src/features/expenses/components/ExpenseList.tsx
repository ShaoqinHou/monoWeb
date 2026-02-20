import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { SortableHeader } from '../../../components/patterns/SortableHeader';
import { Pagination } from '../../../components/patterns/Pagination';
import { usePagination } from '../../../lib/usePagination';
import { ExpenseStatusBadge } from './ExpenseStatusBadge';
import type { Expense } from '@xero-replica/shared';

interface ExpenseListProps {
  expenses: Expense[];
  onSelect: (id: string) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
  }).format(amount);
}

export function ExpenseList({ expenses, onSelect }: ExpenseListProps) {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: string, direction: 'asc' | 'desc') => {
    setSortField(field);
    setSortDir(direction);
  };

  const sortedExpenses = sortField
    ? [...expenses].sort((a, b) => {
        let result = 0;
        if (sortField === 'date') {
          result = a.date.localeCompare(b.date);
        } else if (sortField === 'description') {
          result = (a.description ?? '').localeCompare(b.description ?? '');
        } else if (sortField === 'category') {
          result = (a.category ?? '').localeCompare(b.category ?? '');
        } else if (sortField === 'amount') {
          result = a.amount - b.amount;
        } else if (sortField === 'total') {
          result = a.total - b.total;
        }
        return sortDir === 'asc' ? result : -result;
      })
    : expenses;

  const pagination = usePagination(sortedExpenses);

  if (expenses.length === 0) {
    return (
      <div className="py-12 text-center" data-testid="expense-list-empty">
        <h3 className="text-lg font-medium text-gray-900">No expenses yet</h3>
        <p className="mt-1 text-sm text-gray-500">Submit expenses for review and approval</p>
        <div className="mt-4">
          <Button variant="primary" size="sm" onClick={() => navigate({ to: '/purchases/expenses/new' })}>
            New Expense
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
    <Table data-testid="expense-list-table">
      <TableHeader>
        <TableRow>
          <SortableHeader label="Date" field="date" currentSort={sortField} currentDirection={sortDir} onSort={handleSort} />
          <SortableHeader label="Description" field="description" currentSort={sortField} currentDirection={sortDir} onSort={handleSort} />
          <SortableHeader label="Category" field="category" currentSort={sortField} currentDirection={sortDir} onSort={handleSort} />
          <SortableHeader label="Amount" field="amount" currentSort={sortField} currentDirection={sortDir} onSort={handleSort} className="text-right" />
          <SortableHeader label="Total" field="total" currentSort={sortField} currentDirection={sortDir} onSort={handleSort} className="text-right" />
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pagination.pageData.map((expense) => (
          <TableRow
            key={expense.id}
            className="cursor-pointer"
            onClick={() => onSelect(expense.id)}
            data-testid={`expense-row-${expense.id}`}
          >
            <TableCell>{expense.date}</TableCell>
            <TableCell className="font-medium">{expense.description}</TableCell>
            <TableCell>{expense.category ?? '-'}</TableCell>
            <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
            <TableCell className="text-right">{formatCurrency(expense.total)}</TableCell>
            <TableCell>
              <ExpenseStatusBadge status={expense.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    <Pagination
      page={pagination.page}
      pageSize={pagination.pageSize}
      total={pagination.total}
      onChange={pagination.onChange}
    />
    </>
  );
}
