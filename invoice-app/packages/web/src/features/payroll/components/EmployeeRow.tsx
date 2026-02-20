import { useNavigate } from '@tanstack/react-router';
import { TableRow, TableCell } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import type { Employee } from '../types';

interface EmployeeRowProps {
  employee: Employee;
  selected: boolean;
  onSelect: () => void;
}

function formatPayFrequency(freq: string): string {
  switch (freq) {
    case 'weekly': return 'Weekly';
    case 'fortnightly': return 'Fortnightly';
    case 'monthly': return 'Monthly';
    default: return freq;
  }
}

function formatEmploymentType(type?: string): string {
  switch (type) {
    case 'contractor': return 'Contractor';
    case 'employee':
    default: return 'Employee';
  }
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function EmployeeRow({ employee, selected, onSelect }: EmployeeRowProps) {
  const navigate = useNavigate();

  return (
    <TableRow
      data-testid={`employee-row-${employee.id}`}
      className="cursor-pointer"
      onClick={() => navigate({ to: '/payroll/employees/$employeeId', params: { employeeId: employee.id } })}
    >
      <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          aria-label={`Select ${employee.firstName} ${employee.lastName}`}
          data-testid={`select-employee-${employee.id}`}
        />
      </TableCell>
      <TableCell className="font-medium">{employee.firstName}</TableCell>
      <TableCell className="font-medium">{employee.lastName}</TableCell>
      <TableCell>
        {employee.email ? (
          employee.email
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-[#0078c8] p-0 h-auto"
            onClick={(e) => { e.stopPropagation(); }}
            data-testid={`add-email-${employee.id}`}
          >
            Add email
          </Button>
        )}
      </TableCell>
      <TableCell>{formatEmploymentType(employee.employmentType)}</TableCell>
      <TableCell>{formatPayFrequency(employee.payFrequency)}</TableCell>
      <TableCell>{formatDate(employee.nextPaymentDate)}</TableCell>
    </TableRow>
  );
}
