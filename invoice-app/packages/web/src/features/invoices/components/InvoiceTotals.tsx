import { calcInvoiceTotals, calcAmountDue, formatCurrency } from '@xero-replica/shared';
import type { InvoiceAmountType } from '@xero-replica/shared';
import type { FormLineItem } from '../types';

interface InvoiceTotalsProps {
  lineItems: FormLineItem[];
  amountType: InvoiceAmountType;
  amountPaid?: number;
  currency?: string;
}

export function InvoiceTotals({
  lineItems,
  amountType,
  amountPaid = 0,
  currency = 'NZD',
}: InvoiceTotalsProps) {
  const items = lineItems.map((li) => ({
    quantity: li.quantity,
    unitPrice: li.unitPrice,
    discount: li.discount,
    taxRate: li.taxRate,
  }));

  const totals = calcInvoiceTotals(items, amountType);
  const amountDue = calcAmountDue(totals.total, amountPaid);

  return (
    <div className="flex justify-end" data-testid="invoice-totals">
      <div className="w-72 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span data-testid="totals-subtotal">{formatCurrency(totals.subTotal, currency)}</span>
        </div>
        {amountType !== 'no_tax' && (
          <div className="flex justify-between">
            <span className="text-gray-600">
              {amountType === 'inclusive' ? 'Includes Tax' : 'Tax'}
            </span>
            <span data-testid="totals-tax">{formatCurrency(totals.totalTax, currency)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold">
          <span>Total</span>
          <span data-testid="totals-total">{formatCurrency(totals.total, currency)}</span>
        </div>
        {amountPaid > 0 && (
          <>
            <div className="flex justify-between text-gray-600">
              <span>Paid</span>
              <span data-testid="totals-paid">{formatCurrency(amountPaid, currency)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-base">
              <span>Amount Due</span>
              <span data-testid="totals-amount-due">{formatCurrency(amountDue, currency)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
