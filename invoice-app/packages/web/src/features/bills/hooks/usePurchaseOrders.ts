import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost, apiPut } from '../../../lib/api-helpers';
import { purchaseOrderKeys } from './purchaseOrderKeys';

export type PurchaseOrderStatus = 'draft' | 'submitted' | 'approved' | 'billed' | 'closed';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  reference: string | null;
  contactId: string;
  contactName: string;
  status: PurchaseOrderStatus;
  deliveryDate: string | null;
  deliveryAddress: string | null;
  currency: string;
  date: string;
  subTotal: number;
  totalTax: number;
  total: number;
  convertedBillId: string | null;
  createdAt: string;
  updatedAt: string;
  lineItems?: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    taxAmount: number;
    lineAmount: number;
    discount: number;
    accountCode?: string;
  }>;
}

export interface CreatePurchaseOrder {
  contactId: string;
  date: string;
  deliveryDate?: string;
  deliveryAddress?: string;
  reference?: string;
  currency?: string;
  lineItems?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
    discount?: number;
    accountCode?: string;
  }>;
}

export interface UpdatePurchaseOrder {
  contactId?: string;
  date?: string;
  deliveryDate?: string;
  deliveryAddress?: string;
  reference?: string;
  lineItems?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
    discount?: number;
    accountCode?: string;
  }>;
}

/** Fetch all purchase orders */
export function usePurchaseOrders() {
  return useQuery({
    queryKey: purchaseOrderKeys.lists(),
    queryFn: () => apiFetch<PurchaseOrder[]>('/purchase-orders'),
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch a single purchase order */
export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: purchaseOrderKeys.detail(id),
    queryFn: () => apiFetch<PurchaseOrder>(`/purchase-orders/${id}`),
    staleTime: 60 * 1000,
    enabled: !!id,
  });
}

/** Create a new purchase order */
export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePurchaseOrder) => apiPost<PurchaseOrder>('/purchase-orders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
    },
  });
}

/** Update a purchase order */
export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePurchaseOrder }) =>
      apiPut<PurchaseOrder>(`/purchase-orders/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
    },
  });
}

/** Transition purchase order status */
export function useTransitionPurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PurchaseOrderStatus }) =>
      apiPut<PurchaseOrder>(`/purchase-orders/${id}/status`, { status }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
    },
  });
}

/** Approve a submitted purchase order */
export function useApprovePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiPut<PurchaseOrder>(`/purchase-orders/${id}/approve`, {}),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
    },
  });
}

/** Reject a submitted purchase order */
export function useRejectPurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiPut<PurchaseOrder>(`/purchase-orders/${id}/reject`, {}),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
    },
  });
}

/** Convert an approved purchase order to a bill */
export function useConvertPurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost<unknown>(`/purchase-orders/${id}/convert`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
    },
  });
}
