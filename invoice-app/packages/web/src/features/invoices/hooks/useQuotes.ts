import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost, apiPut } from '../../../lib/api-helpers';
import { quoteKeys } from './quoteKeys';

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'invoiced';

export interface Quote {
  id: string;
  quoteNumber: string;
  reference: string | null;
  contactId: string;
  contactName: string;
  status: QuoteStatus;
  title: string | null;
  summary: string | null;
  currency: string;
  date: string;
  expiryDate: string;
  subTotal: number;
  totalTax: number;
  total: number;
  convertedInvoiceId: string | null;
  createdAt: string;
  updatedAt: string;
  lineItems?: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    accountCode?: string;
    taxRate: number;
    taxAmount: number;
    lineAmount: number;
    discount: number;
  }>;
}

export interface CreateQuote {
  contactId: string;
  date: string;
  expiryDate: string;
  title?: string;
  summary?: string;
  reference?: string;
  currency?: string;
  lineItems?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    accountCode?: string;
    taxRate?: number;
    discount?: number;
  }>;
}

export interface UpdateQuote {
  contactId?: string;
  date?: string;
  expiryDate?: string;
  title?: string;
  summary?: string;
  reference?: string;
  lineItems?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    accountCode?: string;
    taxRate?: number;
    discount?: number;
  }>;
}

/** Fetch all quotes */
export function useQuotes() {
  return useQuery({
    queryKey: quoteKeys.lists(),
    queryFn: () => apiFetch<Quote[]>('/quotes'),
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch a single quote by ID */
export function useQuote(id: string) {
  return useQuery({
    queryKey: quoteKeys.detail(id),
    queryFn: () => apiFetch<Quote>(`/quotes/${id}`),
    staleTime: 60 * 1000,
    enabled: !!id,
  });
}

/** Create a new quote */
export function useCreateQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateQuote) => apiPost<Quote>('/quotes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
    },
  });
}

/** Update an existing quote */
export function useUpdateQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQuote }) =>
      apiPut<Quote>(`/quotes/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
    },
  });
}

/** Transition quote status */
export function useTransitionQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: QuoteStatus }) =>
      apiPut<Quote>(`/quotes/${id}/status`, { status }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
    },
  });
}

/** Convert an accepted quote to an invoice */
export function useConvertQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost<unknown>(`/quotes/${id}/convert`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
    },
  });
}
