import type { InvoiceAmountType } from '../schemas/invoice';
import { calcLineItem, round2 } from './line-item-calc';

export interface InvoiceLineInput {
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
}

export interface InvoiceTotals {
  subTotal: number;
  totalTax: number;
  total: number;
}

/**
 * Calculate invoice/bill totals from line items.
 * subTotal = sum of lineAmounts
 * totalTax = sum of taxAmounts
 * total = subTotal + totalTax (exclusive) or sum of raw amounts (inclusive)
 */
export function calcInvoiceTotals(
  lineItems: InvoiceLineInput[],
  amountType: InvoiceAmountType = 'exclusive',
): InvoiceTotals {
  let subTotal = 0;
  let totalTax = 0;

  for (const item of lineItems) {
    const result = calcLineItem(item, amountType);
    subTotal += result.lineAmount;
    totalTax += result.taxAmount;
  }

  subTotal = round2(subTotal);
  totalTax = round2(totalTax);
  const total = round2(subTotal + totalTax);

  return { subTotal, totalTax, total };
}

/**
 * Calculate amount due after payments.
 */
export function calcAmountDue(total: number, amountPaid: number): number {
  return round2(total - amountPaid);
}
