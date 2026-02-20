import { z } from 'zod';

export const EmployeeSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  position: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  startDate: z.string(),
  endDate: z.string().nullable().optional(),
  salary: z.number().min(0),
  payFrequency: z.enum(['weekly', 'fortnightly', 'monthly']),
  taxCode: z.string(),
  bankAccountNumber: z.string().nullable().optional(),
  irdNumber: z.string().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CreateEmployeeSchema = EmployeeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  isActive: z.boolean().default(true),
});

export const UpdateEmployeeSchema = CreateEmployeeSchema.partial();

export type Employee = z.infer<typeof EmployeeSchema>;
export type CreateEmployee = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployee = z.infer<typeof UpdateEmployeeSchema>;
