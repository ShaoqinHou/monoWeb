import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { formatCurrency } from '@shared/calc/currency';
import type { Employee } from '../types';

interface EmployeeDetailProps {
  employee: Employee;
  onEdit: () => void;
  onDelete: () => void;
  deleting?: boolean;
}

export function EmployeeDetail({ employee, onEdit, onDelete, deleting = false }: EmployeeDetailProps) {
  const statusVariant = employee.status === 'active' ? 'success' : 'default';
  const statusLabel = employee.status === 'active' ? 'Active' : 'Inactive';

  return (
    <div className="space-y-6" data-testid="employee-detail">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0078c8]/10 text-[#0078c8] text-lg font-bold">
            {employee.firstName[0]}{employee.lastName[0]}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#1a1a2e]">
              {employee.firstName} {employee.lastName}
            </h2>
            <p className="text-sm text-[#6b7280]">{employee.position}</p>
          </div>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            loading={deleting}
            disabled={deleting}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent>
            <h3 className="text-sm font-semibold text-[#1a1a2e] mb-3">Personal Information</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[#6b7280]">Email</dt>
                <dd className="font-medium">{employee.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#6b7280]">Start Date</dt>
                <dd className="font-medium">{formatDate(employee.startDate)}</dd>
              </div>
              {employee.bankAccount && (
                <div className="flex justify-between">
                  <dt className="text-[#6b7280]">Bank Account</dt>
                  <dd className="font-medium">{employee.bankAccount}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h3 className="text-sm font-semibold text-[#1a1a2e] mb-3">Salary &amp; Tax</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[#6b7280]">Annual Salary</dt>
                <dd className="font-medium">{formatCurrency(employee.salary)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#6b7280]">Pay Frequency</dt>
                <dd className="font-medium capitalize">{employee.payFrequency}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#6b7280]">Tax Code</dt>
                <dd className="font-medium">{employee.taxCode}</dd>
              </div>
              {employee.irdNumber && (
                <div className="flex justify-between">
                  <dt className="text-[#6b7280]">IRD Number</dt>
                  <dd className="font-medium" data-testid="employee-ird">
                    **-***-{employee.irdNumber.replace(/\D/g, '').slice(5)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-[#6b7280]">KiwiSaver Rate</dt>
                <dd className="font-medium">
                  {employee.kiwiSaverRate != null ? `${employee.kiwiSaverRate}%` : 'Not enrolled'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
