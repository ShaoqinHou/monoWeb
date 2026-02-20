import { z } from 'zod';
import { LineItemSchema, CreateLineItemSchema } from './line-item';

export const InvoiceStatus = z.enum([
  'draft',
  'submitted',
  'approved',
  'paid',
  'voided',
]);

export const InvoiceAmountType = z.enum([
  'exclusive',   // Amounts are tax exclusive (add tax on top)
  'inclusive',    // Amounts are tax inclusive (tax is embedded)
  'no_tax',      // No tax applied
]);

export const InvoiceSchema = z.object({
  id: z.string().min(1),
  invoiceNumber: z.string().optional(),
  reference: z.string().optional(),
  contactId: z.string().min(1),
  contactName: z.string().default(''),
  status: InvoiceStatus.default('draft'),
  amountType: InvoiceAmountType.default('exclusive'),
  currency: z.string().default('NZD'),
  date: z.string(),
  dueDate: z.string(),
  lineItems: z.array(LineItemSchema).default([]),
  subTotal: z.number().default(0),
  totalTax: z.number().default(0),
  total: z.number().default(0),
  amountDue: z.number().default(0),
  amountPaid: z.number().default(0),
  notes: z.string().optional(),
  sourceQuoteId: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateInvoiceSchema = z.object({
  contactId: z.string().min(1),
  reference: z.string().optional(),
  notes: z.string().optional(),
  amountType: InvoiceAmountType.default('exclusive'),
  currency: z.string().default('NZD'),
  currencyCode: z.string().default('NZD'),
  exchangeRate: z.number().positive().default(1.0),
  date: z.string(),
  dueDate: z.string(),
  lineItems: z.array(CreateLineItemSchema).min(1, 'At least one line item required'),
});

export const UpdateInvoiceSchema = CreateInvoiceSchema.partial();

export type Invoice = z.infer<typeof InvoiceSchema>;
export type CreateInvoice = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoice = z.infer<typeof UpdateInvoiceSchema>;
export type InvoiceStatusType = z.infer<typeof InvoiceStatus>;
export type InvoiceAmountType = z.infer<typeof InvoiceAmountType>;
