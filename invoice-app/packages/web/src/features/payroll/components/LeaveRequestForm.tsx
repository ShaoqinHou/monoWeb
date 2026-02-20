import { useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Combobox } from '../../../components/ui/Combobox';
import { Button } from '../../../components/ui/Button';
import type { Employee } from '../types';
import type { CreateLeaveRequestInput, LeaveType } from '../hooks/useLeaveRequests';

interface LeaveRequestFormProps {
  employees: Employee[];
  onSubmit: (data: CreateLeaveRequestInput) => void;
  onCancel: () => void;
  loading?: boolean;
}

const LEAVE_TYPE_OPTIONS = [
  { value: '', label: 'Select leave type', disabled: true },
  { value: 'annual', label: 'Annual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'bereavement', label: 'Bereavement' },
  { value: 'parental', label: 'Parental Leave' },
  { value: 'unpaid', label: 'Unpaid Leave' },
];

export function LeaveRequestForm({ employees, onSubmit, onCancel, loading = false }: LeaveRequestFormProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');

  const employeeOptions = employees.map((emp) => ({
    value: emp.id,
    label: `${emp.firstName} ${emp.lastName}`,
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !leaveType || !startDate || !endDate || !hours) return;

    onSubmit({
      employeeId,
      leaveType: leaveType as LeaveType,
      startDate,
      endDate,
      hours: parseFloat(hours),
      notes: notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="leave-request-form">
      <Combobox
        label="Employee"
        options={employeeOptions}
        value={employeeId}
        onChange={(val) => setEmployeeId(val)}
        placeholder="Select employee"
        data-testid="employee-combobox"
      />

      <Select
        label="Leave Type"
        options={LEAVE_TYPE_OPTIONS}
        value={leaveType}
        onChange={(e) => setLeaveType(e.target.value)}
        aria-label="Select leave type"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <Input
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      <Input
        label="Hours"
        type="number"
        value={hours}
        onChange={(e) => setHours(e.target.value)}
        placeholder="e.g. 40"
      />

      <Input
        label="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Reason for leave..."
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Submit Request
        </Button>
      </div>
    </form>
  );
}
