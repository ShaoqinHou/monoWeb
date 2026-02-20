import { z } from 'zod';
import { LineItemSchema, CreateLineItemSchema } from './line-item';
import { InvoiceAmountType } from './invoice';

export const BillStatus = z.enum([
  'draft',
  'submitted',
  'approved',
  'paid',
  'voided',
]);

export const BillSchema = z.object({
  id: z.string().min(1),
  billNumber: z.string().optional(),
  reference: z.string().optional(),
  contactId: z.string().min(1),
  contactName: z.string().default(''),
  status: BillStatus.default('draft'),
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
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateBillSchema = z.object({
  contactId: z.string().min(1),
  reference: z.string().optional(),
  amountType: InvoiceAmountType.default('exclusive'),
  currency: z.string().default('NZD'),
  currencyCode: z.string().default('NZD'),
  exchangeRate: z.number().positive().default(1.0),
  date: z.string(),
  dueDate: z.string(),
  lineItems: z.array(CreateLineItemSchema).min(1, 'At least one line item required'),
});

export const UpdateBillSchema = CreateBillSchema.partial();

export type Bill = z.infer<typeof BillSchema>;
export type CreateBill = z.infer<typeof CreateBillSchema>;
export type UpdateBill = z.infer<typeof UpdateBillSchema>;
export type BillStatusType = z.infer<typeof BillStatus>;
