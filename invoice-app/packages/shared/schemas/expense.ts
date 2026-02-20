import { z } from 'zod';

export const ExpenseStatus = z.enum([
  'draft',
  'submitted',
  'approved',
  'reimbursed',
  'declined',
]);

export const CreateExpenseSchema = z.object({
  employeeId: z.string().min(1).optional(),
  contactId: z.string().min(1).optional(),
  date: z.string(),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0),
  taxRate: z.number().default(15),
  category: z.string().optional(),
  receiptUrl: z.string().optional(),
  accountCode: z.string().optional(),
  notes: z.string().optional(),
  mileageKm: z.number().optional(),
  mileageRate: z.number().optional(),
});

export const UpdateExpenseSchema = CreateExpenseSchema.partial();

export const ExpenseSchema = z.object({
  id: z.string().min(1),
  employeeId: z.string().min(1).nullable(),
  contactId: z.string().min(1).nullable(),
  date: z.string(),
  description: z.string(),
  amount: z.number(),
  taxRate: z.number(),
  taxAmount: z.number(),
  total: z.number(),
  category: z.string().nullable(),
  receiptUrl: z.string().nullable(),
  status: ExpenseStatus.default('draft'),
  accountCode: z.string().nullable(),
  notes: z.string().nullable(),
  mileageKm: z.number().nullable(),
  mileageRate: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Expense = z.infer<typeof ExpenseSchema>;
export type CreateExpense = z.infer<typeof CreateExpenseSchema>;
export type UpdateExpense = z.infer<typeof UpdateExpenseSchema>;
export type ExpenseStatusType = z.infer<typeof ExpenseStatus>;
