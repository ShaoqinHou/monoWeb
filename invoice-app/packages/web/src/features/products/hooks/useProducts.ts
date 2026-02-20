import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost, apiPut, apiDelete } from '../../../lib/api-helpers';
import { productKeys } from './keys';
import type { Product, CreateProduct, UpdateProduct } from '@xero-replica/shared';

/** Fetch all products */
export function useProducts() {
  return useQuery({
    queryKey: productKeys.lists(),
    queryFn: () => apiFetch<Product[]>('/products'),
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch a single product by ID */
export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => apiFetch<Product>(`/products/${id}`),
    staleTime: 60 * 1000,
    enabled: !!id,
  });
}

/** Create a new product */
export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProduct) => apiPost<Product>('/products', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

/** Update an existing product */
export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProduct }) =>
      apiPut<Product>(`/products/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

/** Delete a product */
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}
