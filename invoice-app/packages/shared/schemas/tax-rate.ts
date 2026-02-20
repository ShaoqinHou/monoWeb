import { z } from 'zod';

export const TaxRateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  rate: z.number().min(0).max(100),
  isActive: z.boolean().default(true),
});

export type TaxRate = z.infer<typeof TaxRateSchema>;

export const NZ_TAX_RATES: Array<{ name: string; rate: number; isDefault: boolean }> = [
  { name: 'GST on Income', rate: 15, isDefault: true },
  { name: 'GST on Expenses', rate: 15, isDefault: true },
  { name: 'No GST', rate: 0, isDefault: false },
  { name: 'GST Free Income', rate: 0, isDefault: false },
  { name: 'GST Free Expenses', rate: 0, isDefault: false },
];
