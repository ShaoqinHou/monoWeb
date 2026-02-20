import { z } from 'zod';

export const CreateProductSchema = z.object({
  code: z.string().min(1, 'Product code is required'),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  purchasePrice: z.number().default(0),
  salePrice: z.number().default(0),
  accountCode: z.string().optional(),
  taxRate: z.number().default(15),
  isTracked: z.boolean().default(false),
  quantityOnHand: z.number().default(0),
  isSold: z.boolean().default(true),
  isPurchased: z.boolean().default(true),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export const ProductSchema = z.object({
  id: z.string().min(1),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  purchasePrice: z.number(),
  salePrice: z.number(),
  accountCode: z.string().nullable(),
  taxRate: z.number(),
  isTracked: z.boolean(),
  quantityOnHand: z.number(),
  isSold: z.boolean(),
  isPurchased: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const StockAdjustmentSchema = z.object({
  quantity: z.number(),
  reason: z.enum(['stock_take', 'damaged', 'returned', 'other']),
  notes: z.string().optional(),
});

export const StockMovementSchema = z.object({
  id: z.string(),
  productId: z.string(),
  type: z.enum(['invoice', 'bill', 'adjustment']),
  quantity: z.number(),
  reason: z.string().nullable(),
  notes: z.string().nullable(),
  referenceId: z.string().nullable(),
  createdAt: z.string(),
});

export type Product = z.infer<typeof ProductSchema>;
export type CreateProduct = z.infer<typeof CreateProductSchema>;
export type UpdateProduct = z.infer<typeof UpdateProductSchema>;
export type StockAdjustment = z.infer<typeof StockAdjustmentSchema>;
export type StockMovement = z.infer<typeof StockMovementSchema>;
