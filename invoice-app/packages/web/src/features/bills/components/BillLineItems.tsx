import { useCallback, useMemo } from 'react';
import { Button } from '../../../components/ui/Button';
import { BillLineRow } from './BillLineRow';
import { calcLineItem } from '@shared/calc/line-item-calc';
import { calcInvoiceTotals } from '@shared/calc/invoice-calc';
import { BillTotals } from './BillTotals';
import type { BillLineItemFormData, InvoiceAmountType } from '../types';

interface BillLineItemsProps {
  lineItems: BillLineItemFormData[];
  amountType: InvoiceAmountType;
  currency?: string;
  onChange: (lineItems: BillLineItemFormData[]) => void;
  disabled?: boolean;
  accountOptions?: Array<{ value: string; label: string }>;
  taxRateOptions?: Array<{ value: string; label: string }>;
}

function emptyLineItem(): BillLineItemFormData {
  return {
    description: '',
    quantity: 1,
    unitPrice: 0,
    accountCode: '',
    taxRate: 15,
    discount: 0,
  };
}

export function BillLineItems({
  lineItems,
  amountType,
  currency = 'NZD',
  onChange,
  disabled = false,
  accountOptions,
  taxRateOptions,
}: BillLineItemsProps) {
  const handleFieldChange = useCallback(
    (index: number, field: keyof BillLineItemFormData, value: string | number) => {
      const updated = [...lineItems];
      updated[index] = { ...updated[index], [field]: value };
      onChange(updated);
    },
    [lineItems, onChange],
  );

  const handleRemove = useCallback(
    (index: number) => {
      const updated = lineItems.filter((_, i) => i !== index);
      onChange(updated);
    },
    [lineItems, onChange],
  );

  const handleAddLine = useCallback(() => {
    onChange([...lineItems, emptyLineItem()]);
  }, [lineItems, onChange]);

  const lineCalcs = useMemo(
    () =>
      lineItems.map((item) =>
        calcLineItem(
          {
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            taxRate: item.taxRate,
          },
          amountType,
        ),
      ),
    [lineItems, amountType],
  );

  const totals = useMemo(
    () =>
      calcInvoiceTotals(
        lineItems.map((item) => ({
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          taxRate: item.taxRate,
        })),
        amountType,
      ),
    [lineItems, amountType],
  );

  return (
    <div className="space-y-4" data-testid="bill-line-items">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-300 text-left text-xs font-semibold uppercase text-gray-500">
              <th className="px-2 py-2">Description</th>
              <th className="px-2 py-2 w-24">Qty</th>
              <th className="px-2 py-2 w-32">Unit Price</th>
              <th className="px-2 py-2 w-20">Disc %</th>
              <th className="px-2 py-2 w-40">Account</th>
              <th className="px-2 py-2 w-44">Tax Rate</th>
              <th className="px-2 py-2 w-28 text-right">Tax</th>
              <th className="px-2 py-2 w-28 text-right">Amount</th>
              <th className="px-2 py-2 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, index) => (
              <BillLineRow
                key={index}
                index={index}
                item={item}
                onChange={handleFieldChange}
                onRemove={handleRemove}
                lineAmount={lineCalcs[index]?.lineAmount ?? 0}
                taxAmount={lineCalcs[index]?.taxAmount ?? 0}
                disabled={disabled}
                accountOptions={accountOptions}
                taxRateOptions={taxRateOptions}
              />
            ))}
          </tbody>
        </table>
      </div>

      {!disabled && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddLine}
          data-testid="add-line-btn"
        >
          + Add Line
        </Button>
      )}

      <BillTotals
        subTotal={totals.subTotal}
        totalTax={totals.totalTax}
        total={totals.total}
        currency={currency}
      />
    </div>
  );
}
