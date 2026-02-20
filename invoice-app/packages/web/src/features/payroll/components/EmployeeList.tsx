import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
} from '../../../components/ui/Table';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { EmployeeRow } from './EmployeeRow';
import { Search } from 'lucide-react';
import { usePagination } from '../../../lib/usePagination';
import { Pagination } from '../../../components/patterns/Pagination';
import type { Employee } from '../types';

interface EmployeeListProps {
  employees: Employee[];
}

type SortField = 'firstName' | 'lastName' | 'email' | 'employmentType' | 'payFrequency' | 'nextPaymentDate';
type SortDir = 'asc' | 'desc';

export function EmployeeList({ employees }: EmployeeListProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const filtered = useMemo(() => {
    let result = employees;

    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        (emp) =>
          `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(query) ||
          emp.email.toLowerCase().includes(query),
      );
    }

    if (sortField) {
      result = [...result].sort((a, b) => {
        const aVal = (a[sortField] ?? '').toString().toLowerCase();
        const bVal = (b[sortField] ?? '').toString().toLowerCase();
        const cmp = aVal.localeCompare(bVal);
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [employees, search, sortField, sortDir]);

  const pagination = usePagination(filtered);

  const allSelected = filtered.length > 0 && filtered.every((emp) => selectedIds.has(emp.id));

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((emp) => emp.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortableHeader = (label: string, field: SortField) => (
    <Button
      variant="ghost"
      size="sm"
      className="p-0 h-auto font-medium text-xs uppercase tracking-wider"
      onClick={() => handleSort(field)}
      aria-label={`Sort by ${label}`}
    >
      {label}
      {sortField === field && (sortDir === 'asc' ? ' \u25B2' : ' \u25BC')}
    </Button>
  );

  return (
    <div className="space-y-4" data-testid="employee-list">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startIcon={<Search className="h-4 w-4" />}
            aria-label="Search"
          />
        </div>
        <Button variant="outline" size="sm" data-testid="invite-xero-me-btn">
          Invite to Xero Me
        </Button>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleSelectAll}
                aria-label="Select all employees"
                data-testid="select-all-employees"
              />
            </TableHead>
            <TableHead>{sortableHeader('First name', 'firstName')}</TableHead>
            <TableHead>{sortableHeader('Last name', 'lastName')}</TableHead>
            <TableHead>{sortableHeader('Email', 'email')}</TableHead>
            <TableHead>{sortableHeader('Employment type', 'employmentType')}</TableHead>
            <TableHead>{sortableHeader('Pay frequency', 'payFrequency')}</TableHead>
            <TableHead>{sortableHeader('Next payment date', 'nextPaymentDate')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <td colSpan={7} className="px-4 py-12 text-center" data-testid="employee-list-empty">
                <h3 className="text-lg font-medium text-gray-900">No employees yet</h3>
                <p className="mt-1 text-sm text-gray-500">Add employees to start running payroll</p>
                <div className="mt-4">
                  <Button variant="primary" size="sm" onClick={() => navigate({ to: '/payroll/employees/new' })}>
                    Add Employee
                  </Button>
                </div>
              </td>
            </TableRow>
          ) : (
            pagination.pageData.map((emp) => (
              <EmployeeRow
                key={emp.id}
                employee={emp}
                selected={selectedIds.has(emp.id)}
                onSelect={() => handleSelectOne(emp.id)}
              />
            ))
          )}
        </TableBody>
      </Table>

      <Pagination
        page={pagination.page}
        pageSize={pagination.pageSize}
        total={pagination.total}
        onChange={pagination.onChange}
      />

      {/* Footer */}
      <div className="text-sm text-[#6b7280]" data-testid="employee-list-footer">
        Showing {filtered.length} {filtered.length === 1 ? 'employee' : 'employees'}
      </div>
    </div>
  );
}
