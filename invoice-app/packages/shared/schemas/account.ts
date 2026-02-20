import { z } from 'zod';

export const AccountType = z.enum([
  'revenue',
  'expense',
  'asset',
  'liability',
  'equity',
]);

export const TaxType = z.enum([
  'output',   // GST on Sales
  'input',    // GST on Purchases
  'none',     // No GST
]);

export const AccountSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  type: AccountType,
  taxType: TaxType.default('none'),
  description: z.string().optional(),
  isArchived: z.boolean().default(false),
});

export const CreateAccountSchema = AccountSchema.omit({
  id: true,
});

export const UpdateAccountSchema = CreateAccountSchema.partial();

export type Account = z.infer<typeof AccountSchema>;
export type CreateAccount = z.infer<typeof CreateAccountSchema>;
export type UpdateAccount = z.infer<typeof UpdateAccountSchema>;
