export type AccountingBasis = 'accrual' | 'cash';

interface BasisToggleProps {
  basis: AccountingBasis;
  onChange: (basis: AccountingBasis) => void;
}

export function BasisToggle({ basis, onChange }: BasisToggleProps) {
  return (
    <div className="inline-flex rounded-md border border-gray-300" data-testid="basis-toggle" role="radiogroup" aria-label="Accounting basis">
      <button
        type="button"
        role="radio"
        aria-checked={basis === 'accrual'}
        className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-l-md ${
          basis === 'accrual'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
        onClick={() => onChange('accrual')}
      >
        Accrual
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={basis === 'cash'}
        className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-r-md ${
          basis === 'cash'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
        onClick={() => onChange('cash')}
      >
        Cash
      </button>
    </div>
  );
}
