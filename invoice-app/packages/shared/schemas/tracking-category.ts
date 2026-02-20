import { z } from 'zod';

export const TrackingOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  isActive: z.boolean().default(true),
});

export const CreateTrackingCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  options: z.array(TrackingOptionSchema).default([]),
});

export const UpdateTrackingCategorySchema = CreateTrackingCategorySchema.partial();

export const TrackingCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  options: z.array(TrackingOptionSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TrackingOption = z.infer<typeof TrackingOptionSchema>;
export type TrackingCategory = z.infer<typeof TrackingCategorySchema>;
export type CreateTrackingCategory = z.infer<typeof CreateTrackingCategorySchema>;
export type UpdateTrackingCategory = z.infer<typeof UpdateTrackingCategorySchema>;
