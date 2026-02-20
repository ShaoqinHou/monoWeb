import { useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import type { CreatePayRunInput } from '../types';

interface NewPayRunFormProps {
  onSubmit: (data: CreatePayRunInput) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function NewPayRunForm({ onSubmit, onCancel, loading = false }: NewPayRunFormProps) {
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [payDate, setPayDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ periodStart, periodEnd, payDate });
  };

  const isValid = periodStart && periodEnd && payDate;

  return (
    <form onSubmit={handleSubmit} data-testid="new-pay-run-form" className="space-y-4">
      <Input
        label="Period Start"
        type="date"
        value={periodStart}
        onChange={(e) => setPeriodStart(e.target.value)}
        required
      />
      <Input
        label="Period End"
        type="date"
        value={periodEnd}
        onChange={(e) => setPeriodEnd(e.target.value)}
        required
      />
      <Input
        label="Pay Date"
        type="date"
        value={payDate}
        onChange={(e) => setPayDate(e.target.value)}
        required
      />

      <div className="rounded border border-[#e5e7eb] p-3">
        <p className="text-sm font-medium text-[#1a1a2e] mb-1">
          Auto-generated payslips
        </p>
        <p className="text-xs text-[#6b7280]">
          All active employees will be included. Payslips with NZ PAYE and KiwiSaver
          calculations will be generated automatically by the server.
        </p>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={!isValid || loading} loading={loading}>
          Create Pay Run
        </Button>
      </div>
    </form>
  );
}
