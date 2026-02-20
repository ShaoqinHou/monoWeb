import { useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import type { Employee, CreateEmployeeInput } from '../types';

interface EmployeeFormProps {
  employee?: Employee;
  onSubmit: (data: CreateEmployeeInput) => void;
  onCancel: () => void;
  loading?: boolean;
}

const PAY_FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'fortnightly', label: 'Fortnightly' },
  { value: 'monthly', label: 'Monthly' },
];

const TAX_CODE_OPTIONS = [
  { value: 'M', label: 'M - Primary employment' },
  { value: 'ME', label: 'ME - Primary with student loan' },
  { value: 'SB', label: 'SB - Secondary 10.5%' },
  { value: 'S', label: 'S - Secondary 17.5%' },
  { value: 'SH', label: 'SH - Secondary 30%' },
  { value: 'ST', label: 'ST - Secondary 33%' },
  { value: 'SA', label: 'SA - Secondary 39%' },
  { value: 'CAE', label: 'CAE - Casual agricultural' },
  { value: 'EDW', label: 'EDW - Election day worker' },
  { value: 'ND', label: 'ND - No notification' },
];

const KIWISAVER_OPTIONS = [
  { value: '0', label: 'Not enrolled' },
  { value: '3', label: '3%' },
  { value: '4', label: '4%' },
  { value: '6', label: '6%' },
  { value: '8', label: '8%' },
  { value: '10', label: '10%' },
];

/** Format IRD number as XX-XXX-XXX while typing */
function formatIrdNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
}

/** Mask IRD for display: XX-XXX-XXX -> **-***-XXX (show last 3) */
function maskIrdNumber(ird: string): string {
  const digits = ird.replace(/\D/g, '');
  if (digits.length < 8) return ird;
  return `**-***-${digits.slice(5)}`;
}

export function EmployeeForm({ employee, onSubmit, onCancel, loading = false }: EmployeeFormProps) {
  const [formData, setFormData] = useState({
    firstName: employee?.firstName ?? '',
    lastName: employee?.lastName ?? '',
    email: employee?.email ?? '',
    position: employee?.position ?? '',
    startDate: employee?.startDate ?? '',
    salary: employee?.salary ? String(employee.salary) : '',
    payFrequency: employee?.payFrequency ?? 'monthly' as Employee['payFrequency'],
    status: employee?.status ?? 'active' as Employee['status'],
    taxCode: employee?.taxCode ?? 'M',
    irdNumber: employee?.irdNumber ?? '',
    kiwiSaverRate: employee?.kiwiSaverRate != null ? String(employee.kiwiSaverRate) : '3',
    bankAccount: employee?.bankAccount ?? '',
  });
  const [irdFocused, setIrdFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      position: formData.position,
      startDate: formData.startDate,
      salary: Number(formData.salary),
      payFrequency: formData.payFrequency,
      status: formData.status,
      taxCode: formData.taxCode,
      irdNumber: formData.irdNumber || undefined,
      kiwiSaverRate: Number(formData.kiwiSaverRate),
      bankAccount: formData.bankAccount || undefined,
    });
  };

  const isValid =
    formData.firstName &&
    formData.lastName &&
    formData.email &&
    formData.position &&
    formData.startDate &&
    formData.salary &&
    Number(formData.salary) > 0;

  return (
    <form onSubmit={handleSubmit} data-testid="employee-form" className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First Name"
          value={formData.firstName}
          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          required
        />
        <Input
          label="Last Name"
          value={formData.lastName}
          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          required
        />
      </div>
      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
      />
      <Input
        label="Position"
        value={formData.position}
        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Start Date"
          type="date"
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          required
        />
        <Input
          label="Annual Salary"
          type="number"
          value={formData.salary}
          onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Pay Frequency"
          options={PAY_FREQUENCY_OPTIONS}
          value={formData.payFrequency}
          onChange={(e) =>
            setFormData({ ...formData, payFrequency: e.target.value as Employee['payFrequency'] })
          }
        />
        <Select
          label="Tax Code"
          options={TAX_CODE_OPTIONS}
          value={formData.taxCode}
          onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
          selectId="tax-code"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="IRD Number"
          value={irdFocused ? formatIrdNumber(formData.irdNumber) : (formData.irdNumber ? maskIrdNumber(formData.irdNumber) : '')}
          onChange={(e) => setFormData({ ...formData, irdNumber: formatIrdNumber(e.target.value) })}
          onFocus={() => setIrdFocused(true)}
          onBlur={() => setIrdFocused(false)}
          placeholder="XX-XXX-XXX"
          inputId="ird-number"
          data-testid="ird-number-input"
        />
        <Select
          label="KiwiSaver Rate"
          options={KIWISAVER_OPTIONS}
          value={formData.kiwiSaverRate}
          onChange={(e) => setFormData({ ...formData, kiwiSaverRate: e.target.value })}
        />
      </div>
      <Input
        label="Bank Account"
        value={formData.bankAccount}
        onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
        placeholder="XX-XXXX-XXXXXXX-XXX"
      />

      <div className="sticky bottom-0 z-10 bg-white border-t py-3 flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={!isValid || loading} loading={loading}>
          {employee ? 'Save Changes' : 'Add Employee'}
        </Button>
      </div>
    </form>
  );
}
