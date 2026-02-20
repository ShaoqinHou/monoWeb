import { formatCurrency } from '@shared/calc/currency';

interface BillTotalsProps {
  subTotal: number;
  totalTax: number;
  total: number;
  currency?: string;
  amountPaid?: number;
  amountDue?: number;
}

export function BillTotals({
  subTotal,
  totalTax,
  total,
  currency = 'NZD',
  amountPaid,
  amountDue,
}: BillTotalsProps) {
  return (
    <div className="flex justify-end" data-testid="bill-totals">
      <div className="w-72 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span data-testid="bill-subtotal">{formatCurrency(subTotal, currency)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tax</span>
          <span data-testid="bill-tax">{formatCurrency(totalTax, currency)}</span>
        </div>
        <div className="flex justify-between border-t pt-2 font-semibold">
          <span>Total</span>
          <span data-testid="bill-total">{formatCurrency(total, currency)}</span>
        </div>
        {amountPaid !== undefined && amountPaid > 0 && (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Amount Paid</span>
              <span data-testid="bill-amount-paid">{formatCurrency(amountPaid, currency)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span className="text-gray-600">Amount Due</span>
              <span data-testid="bill-amount-due">
                {formatCurrency(amountDue ?? total - amountPaid, currency)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
