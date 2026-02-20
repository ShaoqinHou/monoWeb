import { Input } from '../../../components/ui/Input';
import { Combobox } from '../../../components/ui/Combobox';
import { Button } from '../../../components/ui/Button';
import { X, GripVertical } from 'lucide-react';
import { calcLineItem, formatCurrency } from '@xero-replica/shared';
import type { InvoiceAmountType } from '@xero-replica/shared';
import type { FormLineItem, DiscountType } from '../types';

interface InvoiceLineRowProps {
  line: FormLineItem;
  index: number;
  amountType: InvoiceAmountType;
  canRemove: boolean;
  onChange: (index: number, field: keyof FormLineItem, value: string | number) => void;
  onBatchChange?: (index: number, changes: Partial<FormLineItem>) => void;
  onRemove: (index: number) => void;
  items?: Array<{code: string; name: string; salePrice: number}>;
  onCreateNewItem?: () => void;
  hiddenCols?: Set<string>;
  onDragStart?: (index: number) => void;
  onDrop?: (index: number) => void;
  accountOptions?: Array<{ value: string; label: string }>;
  taxRateOptions?: Array<{ value: string; label: string }>;
  regionOptions?: Array<{ value: string; label: string }>;
  projectOptions?: Array<{ value: string; label: string }>;
  onCreateNewAccount?: () => void;
  onCreateNewTaxRate?: () => void;
  onCreateNewRegion?: () => void;
}

const DEFAULT_TAX_RATE_OPTIONS = [
  { value: '0', label: 'No Tax (0%)' },
  { value: '5', label: 'Reduced Rate (5%)' },
  { value: '10', label: 'Standard Low (10%)' },
  { value: '15', label: 'GST on Income (15%)' },
  { value: '20', label: 'Standard High (20%)' },
];

export function InvoiceLineRow({
  line,
  index,
  amountType,
  canRemove,
  onChange,
  onBatchChange,
  onRemove,
  items,
  onCreateNewItem,
  hiddenCols,
  onDragStart,
  onDrop,
  accountOptions = [],
  taxRateOptions,
  regionOptions = [],
  projectOptions = [],
  onCreateNewAccount,
  onCreateNewTaxRate,
  onCreateNewRegion,
}: InvoiceLineRowProps) {
  const resolvedTaxRateOptions = taxRateOptions && taxRateOptions.length > 0 ? taxRateOptions : DEFAULT_TAX_RATE_OPTIONS;
  // Convert fixed discount to equivalent % for calcLineItem
  const discountType: DiscountType = line.discountType ?? 'percent';
  const effectiveDiscountPct = discountType === 'fixed'
    ? (line.quantity * line.unitPrice > 0 ? (line.discount / (line.quantity * line.unitPrice)) * 100 : 0)
    : line.discount;

  const calc = calcLineItem(
    {
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      discount: effectiveDiscountPct,
      taxRate: line.taxRate,
    },
    amountType,
  );

  const lineTotal = calc.lineAmount + calc.taxAmount;

  return (
    <tr data-testid={`line-row-${index}`} className="border-b border-gray-100">
      <td
        className="py-2 w-8 cursor-grab"
        draggable
        onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart?.(index); }}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
        onDrop={() => onDrop?.(index)}
        data-testid={`line-drag-${index}`}
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </td>
      {!hiddenCols?.has('item') && (
      <td className="py-2 px-2 w-32">
        <Combobox
          options={(items ?? []).map(i => ({ value: i.code, label: i.code, description: i.name }))}
          value={line.itemCode ?? ''}
          onChange={(val) => {
            const match = items?.find(item => item.code === val);
            if (match && onBatchChange) {
              onBatchChange(index, { itemCode: val, description: match.name, unitPrice: match.salePrice });
            } else {
              onChange(index, 'itemCode', val);
            }
          }}
          onCreateNew={onCreateNewItem}
          placeholder="Item..."
          data-testid={`line-item-${index}`}
        />
      </td>
      )}
      <td className="py-2 pr-2">
        <Input
          value={line.description}
          onChange={(e) => onChange(index, 'description', e.target.value)}
          placeholder="Description"
          data-testid={`line-description-${index}`}
        />
      </td>
      <td className="py-2 px-2 w-24">
        <Input
          type="number"
          value={line.quantity}
          onChange={(e) => onChange(index, 'quantity', parseFloat(e.target.value) || 0)}
          min={0}
          step="1"
          data-testid={`line-qty-${index}`}
        />
      </td>
      <td className="py-2 px-2 w-32">
        <Input
          type="number"
          value={line.unitPrice}
          onChange={(e) => onChange(index, 'unitPrice', Math.max(0, parseFloat(e.target.value) || 0))}
          min={0}
          step="0.01"
          data-testid={`line-price-${index}`}
        />
      </td>
      {!hiddenCols?.has('discount') && (
      <td className="py-2 px-2 w-36">
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={line.discount}
            onChange={(e) => {
              let val = parseFloat(e.target.value) || 0;
              val = Math.max(0, val);
              if (discountType === 'percent') val = Math.min(100, val);
              onChange(index, 'discount', val);
            }}
            min={0}
            max={discountType === 'percent' ? 100 : undefined}
            step="0.01"
            data-testid={`line-discount-${index}`}
          />
          <button
            type="button"
            onClick={() => onChange(index, 'discountType', discountType === 'percent' ? 'fixed' : 'percent')}
            className="shrink-0 rounded border border-gray-200 px-1.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
            data-testid={`line-discount-type-${index}`}
          >
            {discountType === 'percent' ? '%' : '$'}
          </button>
        </div>
      </td>
      )}
      <td className="py-2 px-2 w-40">
        <Combobox
          options={accountOptions}
          value={line.accountCode}
          onChange={(val) => onChange(index, 'accountCode', val)}
          onCreateNew={onCreateNewAccount}
          placeholder="Account"
          data-testid={`line-account-${index}`}
        />
      </td>
      <td className="py-2 px-2 w-44">
        <Combobox
          options={resolvedTaxRateOptions}
          value={String(line.taxRate)}
          onChange={(val) => onChange(index, 'taxRate', parseFloat(val))}
          onCreateNew={onCreateNewTaxRate}
          placeholder="Tax rate"
          data-testid={`line-tax-${index}`}
        />
      </td>
      <td className="py-2 px-2 w-20 text-right text-sm text-gray-600" data-testid={`line-tax-amount-${index}`}>
        {formatCurrency(calc.taxAmount)}
      </td>
      {!hiddenCols?.has('region') && (
      <td className="py-2 px-2 w-28">
        <Combobox
          options={regionOptions}
          value={line.region ?? ''}
          onChange={(val) => onChange(index, 'region', val)}
          onCreateNew={onCreateNewRegion}
          placeholder="Region..."
          data-testid={`line-region-${index}`}
        />
      </td>
      )}
      {!hiddenCols?.has('project') && (
      <td className="py-2 px-2 w-28">
        <Combobox
          options={projectOptions}
          value={line.project ?? ''}
          onChange={(val) => onChange(index, 'project', val)}
          placeholder="Project..."
          data-testid={`line-project-${index}`}
        />
      </td>
      )}
      <td className="py-2 px-2 w-28 text-right font-medium" data-testid={`line-amount-${index}`}>
        {formatCurrency(lineTotal)}
      </td>
      <td className="py-2 pl-2 w-10">
        {canRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
            aria-label={`Remove line ${index + 1}`}
            data-testid={`line-remove-${index}`}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </td>
    </tr>
  );
}

export { DEFAULT_TAX_RATE_OPTIONS };
