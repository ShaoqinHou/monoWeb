import { Input } from '../../../components/ui/Input';
import { Combobox } from '../../../components/ui/Combobox';
import type { BillLineItemFormData } from '../types';

const DEFAULT_ACCOUNT_OPTIONS = [
  { value: '310', label: '310 - Bank Fees' },
  { value: '320', label: '320 - Cleaning' },
  { value: '325', label: '325 - Consulting & Accounting' },
  { value: '400', label: '400 - Computer Equipment' },
  { value: '404', label: '404 - Entertainment' },
  { value: '408', label: '408 - General Expenses' },
  { value: '412', label: '412 - Insurance' },
  { value: '416', label: '416 - Light, Power, Heating' },
  { value: '420', label: '420 - Motor Vehicle Expenses' },
  { value: '429', label: '429 - Office Expenses' },
  { value: '433', label: '433 - Printing & Stationery' },
  { value: '437', label: '437 - Rent' },
  { value: '441', label: '441 - Subscriptions' },
  { value: '445', label: '445 - Telephone & Internet' },
  { value: '680', label: '680 - Meals & Entertainment' },
  { value: '684', label: '684 - Travel - National' },
  { value: '685', label: '685 - Travel - International' },
];

const DEFAULT_TAX_RATE_OPTIONS = [
  { value: '0', label: 'No Tax (0%)' },
  { value: '9', label: 'GST on Imports (9%)' },
  { value: '15', label: 'GST on Expenses (15%)' },
];

interface BillLineRowProps {
  index: number;
  item: BillLineItemFormData;
  onChange: (index: number, field: keyof BillLineItemFormData, value: string | number) => void;
  onRemove: (index: number) => void;
  lineAmount: number;
  taxAmount: number;
  disabled?: boolean;
  accountOptions?: Array<{ value: string; label: string }>;
  taxRateOptions?: Array<{ value: string; label: string }>;
}

export function BillLineRow({
  index,
  item,
  onChange,
  onRemove,
  lineAmount,
  taxAmount,
  disabled = false,
  accountOptions,
  taxRateOptions,
}: BillLineRowProps) {
  const resolvedAccountOptions = accountOptions && accountOptions.length > 0 ? accountOptions : DEFAULT_ACCOUNT_OPTIONS;
  const resolvedTaxRateOptions = taxRateOptions && taxRateOptions.length > 0 ? taxRateOptions : DEFAULT_TAX_RATE_OPTIONS;

  return (
    <tr data-testid={`line-row-${index}`} className="border-b border-gray-200">
      <td className="px-2 py-1">
        <Input
          value={item.description}
          onChange={(e) => onChange(index, 'description', e.target.value)}
          placeholder="Description"
          disabled={disabled}
          data-testid={`line-description-${index}`}
        />
      </td>
      <td className="px-2 py-1 w-24">
        <Input
          type="number"
          value={String(item.quantity)}
          onChange={(e) => onChange(index, 'quantity', parseFloat(e.target.value) || 0)}
          min="0"
          step="1"
          disabled={disabled}
          data-testid={`line-quantity-${index}`}
        />
      </td>
      <td className="px-2 py-1 w-32">
        <Input
          type="number"
          value={String(item.unitPrice)}
          onChange={(e) => onChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
          min="0"
          step="0.01"
          disabled={disabled}
          data-testid={`line-unit-price-${index}`}
        />
      </td>
      <td className="px-2 py-1 w-20">
        <Input
          type="number"
          value={String(item.discount)}
          onChange={(e) => onChange(index, 'discount', parseFloat(e.target.value) || 0)}
          min="0"
          max="100"
          step="1"
          disabled={disabled}
          data-testid={`line-discount-${index}`}
        />
      </td>
      <td className="px-2 py-1 w-40">
        <Combobox
          options={resolvedAccountOptions}
          value={item.accountCode}
          onChange={(val) => onChange(index, 'accountCode', val)}
          placeholder="Account..."
          disabled={disabled}
          data-testid={`line-account-${index}`}
        />
      </td>
      <td className="px-2 py-1 w-44">
        <Combobox
          options={resolvedTaxRateOptions}
          value={String(item.taxRate)}
          onChange={(val) => onChange(index, 'taxRate', parseFloat(val))}
          disabled={disabled}
          data-testid={`line-tax-rate-${index}`}
        />
      </td>
      <td className="px-2 py-1 w-28 text-right text-sm" data-testid={`line-tax-amount-${index}`}>
        {taxAmount.toFixed(2)}
      </td>
      <td className="px-2 py-1 w-28 text-right text-sm font-medium" data-testid={`line-amount-${index}`}>
        {lineAmount.toFixed(2)}
      </td>
      <td className="px-2 py-1 w-12">
        {!disabled && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-red-500 hover:text-red-700 text-sm font-medium"
            data-testid={`line-remove-${index}`}
            aria-label={`Remove line ${index + 1}`}
          >
            X
          </button>
        )}
      </td>
    </tr>
  );
}
