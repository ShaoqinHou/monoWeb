import type { CurrencyEntry } from '../hooks/useCurrencies';

interface CurrencyRateFormProps {
  currency: CurrencyEntry;
  onChange: (code: string, rate: number) => void;
}

export function CurrencyRateForm({ currency, onChange }: CurrencyRateFormProps) {
  return (
    <div className="flex items-center gap-4" data-testid={`currency-row-${currency.code}`}>
      <span className="w-16 text-sm font-semibold text-[#1a1a2e]">
        {currency.code}
      </span>
      <span className="flex-1 text-sm text-[#6b7280]">{currency.name}</span>
      <input
        type="number"
        step="0.01"
        min="0"
        value={currency.rate}
        onChange={(e) => onChange(currency.code, parseFloat(e.target.value) || 0)}
        className="w-28 rounded border border-[#e5e7eb] px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#0078c8]/20 focus:border-[#0078c8]"
        aria-label={`Exchange rate for ${currency.code}`}
        disabled={currency.code === 'NZD'}
      />
    </div>
  );
}
