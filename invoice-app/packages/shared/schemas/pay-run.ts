import { z } from 'zod';

export const PayslipSchema = z.object({
  id: z.string(),
  payRunId: z.string(),
  employeeId: z.string(),
  grossPay: z.number(),
  paye: z.number(),
  kiwiSaverEmployee: z.number(),
  kiwiSaverEmployer: z.number(),
  netPay: z.number(),
});

export const PayRunSchema = z.object({
  id: z.string(),
  payPeriodStart: z.string(),
  payPeriodEnd: z.string(),
  payDate: z.string(),
  status: z.enum(['draft', 'posted']),
  totalGross: z.number(),
  totalTax: z.number(),
  totalNet: z.number(),
  payslips: z.array(PayslipSchema).optional(),
  createdAt: z.string().optional(),
});

export const CreatePayRunSchema = z.object({
  payPeriodStart: z.string(),
  payPeriodEnd: z.string(),
  payDate: z.string(),
  employeeIds: z.array(z.string()).min(1),
});

export type Payslip = z.infer<typeof PayslipSchema>;
export type PayRun = z.infer<typeof PayRunSchema>;
export type CreatePayRun = z.infer<typeof CreatePayRunSchema>;
