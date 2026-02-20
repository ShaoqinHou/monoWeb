import { z } from 'zod';

export const PaymentSchema = z.object({
  id: z.string().min(1),
  invoiceId: z.string().min(1).optional(),
  billId: z.string().min(1).optional(),
  amount: z.number().positive('Amount must be positive'),
  date: z.string(),
  reference: z.string().optional(),
  accountCode: z.string().optional(),
  createdAt: z.string().datetime(),
});

export const CreatePaymentSchema = PaymentSchema.omit({
  id: true,
  createdAt: true,
}).refine(
  (data) => data.invoiceId || data.billId,
  { message: 'Payment must be linked to an invoice or bill' }
);

export type Payment = z.infer<typeof PaymentSchema>;
