import { z } from 'zod';

export const BankTransactionSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  date: z.string(),
  description: z.string(),
  reference: z.string().nullable().optional(),
  amount: z.number(),
  isReconciled: z.boolean(),
  matchedInvoiceId: z.string().nullable().optional(),
  matchedBillId: z.string().nullable().optional(),
  matchedPaymentId: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  createdAt: z.string().optional(),
});

export const CreateBankTransactionSchema = BankTransactionSchema.omit({
  id: true,
  isReconciled: true,
  matchedInvoiceId: true,
  matchedBillId: true,
  matchedPaymentId: true,
  createdAt: true,
});

export const ImportBankTransactionsSchema = z.object({
  accountId: z.string(),
  transactions: z.array(z.object({
    date: z.string(),
    description: z.string(),
    amount: z.number(),
    reference: z.string().optional(),
  })),
});

export type BankTransaction = z.infer<typeof BankTransactionSchema>;
export type CreateBankTransaction = z.infer<typeof CreateBankTransactionSchema>;
export type ImportBankTransactions = z.infer<typeof ImportBankTransactionsSchema>;
