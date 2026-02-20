import { useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import type { LeaveType } from '../hooks/useLeaveTypes';

interface LeaveTypeFormProps {
  leaveType?: LeaveType;
  onSubmit: (data: Omit<LeaveType, 'id'>) => void;
  onCancel: () => void;
}

export function LeaveTypeForm({ leaveType, onSubmit, onCancel }: LeaveTypeFormProps) {
  const [name, setName] = useState(leaveType?.name ?? '');
  const [paidLeave, setPaidLeave] = useState(leaveType?.paidLeave ?? true);
  const [showOnPayslip, setShowOnPayslip] = useState(leaveType?.showOnPayslip ?? true);
  const [defaultDaysPerYear, setDefaultDaysPerYear] = useState(
    leaveType?.defaultDaysPerYear != null ? String(leaveType.defaultDaysPerYear) : '0',
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      paidLeave,
      showOnPayslip,
      defaultDaysPerYear: Number(defaultDaysPerYear) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="leave-type-form">
      <Input
        label="Leave Type Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        inputId="leave-type-name"
      />
      <Input
        label="Default Days Per Year"
        type="number"
        value={defaultDaysPerYear}
        onChange={(e) => setDefaultDaysPerYear(e.target.value)}
        inputId="leave-type-days"
      />
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={paidLeave}
            onChange={(e) => setPaidLeave(e.target.checked)}
            data-testid="leave-type-paid"
          />
          Paid Leave
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showOnPayslip}
            onChange={(e) => setShowOnPayslip(e.target.checked)}
            data-testid="leave-type-show-payslip"
          />
          Show on Payslip
        </label>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={!name.trim()} data-testid="save-leave-type">
          {leaveType ? 'Update' : 'Add Leave Type'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
