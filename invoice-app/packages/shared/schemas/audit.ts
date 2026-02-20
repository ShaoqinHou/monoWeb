import { z } from 'zod';

export const AuditEntrySchema = z.object({
  id: z.string().min(1),
  entityType: z.enum(['invoice', 'bill', 'contact', 'quote', 'credit-note', 'purchase-order', 'payment', 'account', 'journal']),
  entityId: z.string(),
  action: z.enum(['created', 'updated', 'deleted', 'status_changed', 'payment_recorded', 'sent', 'voided', 'approved']),
  userId: z.string().default('system'),
  userName: z.string().default('Demo User'),
  timestamp: z.string(),
  changes: z.array(z.object({
    field: z.string(),
    oldValue: z.string().nullable(),
    newValue: z.string().nullable(),
  })).default([]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type AuditEntry = z.infer<typeof AuditEntrySchema>;

export const CreateAuditEntrySchema = AuditEntrySchema.omit({ id: true });

export type CreateAuditEntry = z.infer<typeof CreateAuditEntrySchema>;
