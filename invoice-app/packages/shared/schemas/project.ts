import { z } from 'zod';

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  contactId: z.string().nullable().optional(),
  contactName: z.string().nullable().optional(),
  status: z.enum(['in_progress', 'completed', 'closed']),
  deadline: z.string().nullable().optional(),
  estimatedBudget: z.number().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CreateProjectSchema = ProjectSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: z.enum(['in_progress', 'completed', 'closed']).default('in_progress'),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

export type Project = z.infer<typeof ProjectSchema>;
export type CreateProject = z.infer<typeof CreateProjectSchema>;
export type UpdateProject = z.infer<typeof UpdateProjectSchema>;
