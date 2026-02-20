import { z } from 'zod';

export const JournalLineSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  accountName: z.string(),
  description: z.string(),
  debit: z.number().min(0),
  credit: z.number().min(0),
});

export const JournalSchema = z.object({
  id: z.string(),
  date: z.string(),
  narration: z.string().min(1),
  status: z.enum(['draft', 'posted', 'voided']),
  lines: z.array(JournalLineSchema).min(2),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CreateJournalSchema = z.object({
  date: z.string(),
  narration: z.string().min(1),
  status: z.enum(['draft', 'posted', 'voided']).default('draft'),
  lines: z.array(JournalLineSchema.omit({ id: true }).extend({ id: z.string().optional() })).min(2),
});

export const UpdateJournalSchema = CreateJournalSchema.partial();

export type JournalLine = z.infer<typeof JournalLineSchema>;
export type Journal = z.infer<typeof JournalSchema>;
export type CreateJournal = z.infer<typeof CreateJournalSchema>;
export type UpdateJournal = z.infer<typeof UpdateJournalSchema>;
