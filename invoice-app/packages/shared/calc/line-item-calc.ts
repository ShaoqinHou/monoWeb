import type { InvoiceAmountType } from '../schemas/invoice';

export interface LineItemCalcInput {
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
}

export interface LineItemCalcResult {
  lineAmount: number;
  taxAmount: number;
}

/**
 * Calculate line item amounts based on amount type.
 *
 * - exclusive: lineAmount = qty × price × (1 - discount%), taxAmount = lineAmount × taxRate%
 * - inclusive: total = qty × price × (1 - discount%), lineAmount = total / (1 + taxRate%), taxAmount = total - lineAmount
 * - no_tax: lineAmount = qty × price × (1 - discount%), taxAmount = 0
 */
export function calcLineItem(
  input: LineItemCalcInput,
  amountType: InvoiceAmountType = 'exclusive',
): LineItemCalcResult {
  const { quantity, unitPrice, discount, taxRate } = input;
  const discountMultiplier = 1 - discount / 100;
  const rawAmount = quantity * unitPrice * discountMultiplier;

  if (amountType === 'no_tax') {
    return {
      lineAmount: round2(rawAmount),
      taxAmount: 0,
    };
  }

  if (amountType === 'inclusive') {
    const taxDivisor = 1 + taxRate / 100;
    const lineAmount = rawAmount / taxDivisor;
    const taxAmount = rawAmount - lineAmount;
    return {
      lineAmount: round2(lineAmount),
      taxAmount: round2(taxAmount),
    };
  }

  // exclusive (default)
  const lineAmount = rawAmount;
  const taxAmount = rawAmount * (taxRate / 100);
  return {
    lineAmount: round2(lineAmount),
    taxAmount: round2(taxAmount),
  };
}

/** Round to 2 decimal places using banker's rounding */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
