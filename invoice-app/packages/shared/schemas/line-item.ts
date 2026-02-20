import { z } from 'zod';

export const LineItemSchema = z.object({
  id: z.string().min(1),
  productId: z.string().optional(),
  description: z.string().default(''),
  quantity: z.number().min(0).default(1),
  unitPrice: z.number().default(0),
  accountCode: z.string().optional(),
  taxRate: z.number().min(0).max(100).default(15),
  taxAmount: z.number().default(0),
  lineAmount: z.number().default(0),
  discount: z.number().min(0).max(100).default(0),
});

export const CreateLineItemSchema = LineItemSchema.omit({
  id: true,
  taxAmount: true,
  lineAmount: true,
});

export type LineItem = z.infer<typeof LineItemSchema>;
export type CreateLineItem = z.infer<typeof CreateLineItemSchema>;
