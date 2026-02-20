import { z } from 'zod';

export const ContactType = z.enum(['customer', 'supplier', 'customer_and_supplier']);

export const ContactSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Contact name is required'),
  type: ContactType,
  email: z.string().email().optional(),
  phone: z.string().optional(),
  taxNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankBSB: z.string().optional(),
  defaultAccountCode: z.string().optional(),
  defaultTaxRate: z.string().optional(),
  outstandingBalance: z.number().default(0),
  overdueBalance: z.number().default(0),
  isArchived: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateContactSchema = ContactSchema.omit({
  id: true,
  outstandingBalance: true,
  overdueBalance: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateContactSchema = CreateContactSchema.partial();

export type Contact = z.infer<typeof ContactSchema>;
export type CreateContact = z.infer<typeof CreateContactSchema>;
export type UpdateContact = z.infer<typeof UpdateContactSchema>;
