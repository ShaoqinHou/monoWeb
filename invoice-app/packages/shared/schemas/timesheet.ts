import { z } from 'zod';

export const TimesheetSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  employeeId: z.string().nullable().optional(),
  date: z.string(),
  hours: z.number().min(0),
  description: z.string(),
  isBillable: z.boolean(),
  isInvoiced: z.boolean(),
  hourlyRate: z.number().min(0),
  createdAt: z.string().optional(),
});

export const CreateTimesheetSchema = TimesheetSchema.omit({
  id: true,
  isInvoiced: true,
  createdAt: true,
}).extend({
  isBillable: z.boolean().default(true),
});

export const UpdateTimesheetSchema = CreateTimesheetSchema.partial();

export type Timesheet = z.infer<typeof TimesheetSchema>;
export type CreateTimesheet = z.infer<typeof CreateTimesheetSchema>;
export type UpdateTimesheet = z.infer<typeof UpdateTimesheetSchema>;
