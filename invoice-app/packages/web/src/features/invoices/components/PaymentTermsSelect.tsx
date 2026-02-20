import { useCallback } from 'react';

export interface PaymentTermsPreset {
  label: string;
  days: number;
}

export const PAYMENT_TERMS_PRESETS: PaymentTermsPreset[] = [
  { label: 'Due on Receipt', days: 0 },
  { label: 'Net 7', days: 7 },
  { label: 'Net 14', days: 14 },
  { label: 'Net 30', days: 30 },
  { label: 'Net 60', days: 60 },
  { label: 'Net 90', days: 90 },
];

export interface PaymentTermsSelectProps {
  value: number;
  onChange: (days: number, dueDate: string) => void;
  invoiceDate: string;
  className?: string;
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export function PaymentTermsSelect({
  value,
  onChange,
  invoiceDate,
  className,
}: PaymentTermsSelectProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const days = Number(e.target.value);
      const dueDate = addDays(invoiceDate, days);
      onChange(days, dueDate);
    },
    [invoiceDate, onChange],
  );

  return (
    <div className={className} data-testid="payment-terms-select">
      <label
        htmlFor="payment-terms"
        className="text-sm font-medium text-[#1a1a2e]"
      >
        Payment Terms
      </label>
      <select
        id="payment-terms"
        value={value}
        onChange={handleChange}
        className="mt-1 w-full appearance-none rounded border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1a1a2e] focus:border-[#0078c8] focus:outline-none focus:ring-2 focus:ring-[#0078c8]/20"
        data-testid="payment-terms-dropdown"
      >
        {PAYMENT_TERMS_PRESETS.map((preset) => (
          <option key={preset.days} value={preset.days}>
            {preset.label}
          </option>
        ))}
      </select>
    </div>
  );
}
