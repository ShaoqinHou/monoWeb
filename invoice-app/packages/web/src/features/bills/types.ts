import type { Bill, BillStatusType, CreateBill } from '@shared/schemas/bill';
import type { LineItem, CreateLineItem } from '@shared/schemas/line-item';
import type { InvoiceAmountType } from '@shared/schemas/invoice';

export type { Bill, BillStatusType, CreateBill, LineItem, CreateLineItem, InvoiceAmountType };

// --- Recurring bills (client-side) ---

export type RecurrenceFrequency = 'none' | 'weekly' | 'monthly' | 'quarterly' | 'annually';

export const RECURRENCE_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
];

export function computeNextRecurrence(date: string, frequency: RecurrenceFrequency): string | null {
  if (frequency === 'none') return null;
  const d = new Date(date);
  switch (frequency) {
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'quarterly':
      d.setMonth(d.getMonth() + 3);
      break;
    case 'annually':
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d.toISOString().slice(0, 10);
}

// --- Payment tracking ---

export interface BillPayment {
  id: string;
  billId: string;
  amount: number;
  date: string;
  reference: string;
  bankAccount: string;
  createdAt: string;
}

export interface RecordPaymentData {
  billId: string;
  amount: number;
  date: string;
  reference: string;
  bankAccount: string;
}

// --- Form data ---

export interface BillFormData {
  contactId: string;
  reference: string;
  amountType: InvoiceAmountType;
  currency: string;
  exchangeRate: number;
  date: string;
  dueDate: string;
  lineItems: BillLineItemFormData[];
  recurrence: RecurrenceFrequency;
}

export interface BillLineItemFormData {
  description: string;
  quantity: number;
  unitPrice: number;
  accountCode: string;
  taxRate: number;
  discount: number;
}

export type BillStatusTab = 'all' | BillStatusType | 'overdue';

export interface BillStatusCount {
  all: number;
  draft: number;
  submitted: number;
  approved: number;
  paid: number;
  overdue: number;
  voided: number;
}

export const STATUS_TAB_LABELS: Record<BillStatusTab, string> = {
  all: 'All',
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  paid: 'Paid',
  overdue: 'Overdue',
  voided: 'Voided',
};
