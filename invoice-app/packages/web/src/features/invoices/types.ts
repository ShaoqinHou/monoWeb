import type { Invoice, InvoiceStatusType, LineItem, CreateLineItem } from '@xero-replica/shared';

/** Filter options for the invoices list */
export interface InvoiceFilters {
  status?: InvoiceStatusType | 'all' | 'overdue';
  search?: string;
}

/** Discount type: percentage or fixed dollar amount */
export type DiscountType = 'percent' | 'fixed';

/** A line item in the form editor (has a local key for React list rendering) */
export interface FormLineItem {
  key: string;
  description: string;
  quantity: number;
  unitPrice: number;
  accountCode: string;
  taxRate: number;
  discount: number;
  discountType: DiscountType;
  itemCode?: string;     // Product/item code
  region?: string;       // Tracking category 1
  project?: string;      // Tracking category 2 or project link
}

/** Recurring schedule options */
export type RecurringSchedule = 'none' | 'weekly' | 'fortnightly' | 'monthly' | 'quarterly';

/** Form data for create/edit invoice */
export interface InvoiceFormData {
  contactId: string;
  contactName: string;
  reference: string;
  currency: string;
  exchangeRate: number;
  date: string;
  dueDate: string;
  amountType: 'exclusive' | 'inclusive' | 'no_tax';
  lineItems: FormLineItem[];
  notes: string;
  recurring: RecurringSchedule;
  deliveryAddressId: string;
  brandingThemeId: string;
  expectedPaymentDate: string;
}

/** Status tab definition */
export interface StatusTab {
  id: string;
  label: string;
  count: number;
}

/** Credit note linked to an original invoice */
export interface CreditNote {
  id: string;
  originalInvoiceId: string;
  invoiceNumber: string;
  contactName: string;
  total: number;
  date: string;
  currency: string;
}

/** Re-export for convenience */
export type { Invoice, InvoiceStatusType, LineItem, CreateLineItem };
