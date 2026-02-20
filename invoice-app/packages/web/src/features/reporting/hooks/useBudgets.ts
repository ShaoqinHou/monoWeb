import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost, apiPut, apiDelete } from '../../../lib/api-helpers';
import { budgetKeys } from './budgetKeys';

// ── Types ────────────────────────────────────────────────────────────────────

export interface BudgetLine {
  id: string;
  budgetId: string;
  accountCode: string;
  accountName: string;
  month1: number;
  month2: number;
  month3: number;
  month4: number;
  month5: number;
  month6: number;
  month7: number;
  month8: number;
  month9: number;
  month10: number;
  month11: number;
  month12: number;
}

export interface Budget {
  id: string;
  name: string;
  financialYear: string;
  status: 'draft' | 'active' | 'archived';
  createdAt: string;
  lines?: BudgetLine[];
}

export interface CreateBudgetInput {
  name: string;
  financialYear: string;
  lines?: Array<{
    accountCode: string;
    accountName: string;
    month1?: number;
    month2?: number;
    month3?: number;
    month4?: number;
    month5?: number;
    month6?: number;
    month7?: number;
    month8?: number;
    month9?: number;
    month10?: number;
    month11?: number;
    month12?: number;
  }>;
}

export interface UpdateBudgetInput {
  name?: string;
  financialYear?: string;
  status?: 'draft' | 'active' | 'archived';
  lines?: Array<{
    accountCode: string;
    accountName: string;
    month1?: number;
    month2?: number;
    month3?: number;
    month4?: number;
    month5?: number;
    month6?: number;
    month7?: number;
    month8?: number;
    month9?: number;
    month10?: number;
    month11?: number;
    month12?: number;
  }>;
}

// ── Query Hooks ──────────────────────────────────────────────────────────────

/** Fetch all budgets */
export function useBudgets() {
  return useQuery({
    queryKey: budgetKeys.lists(),
    queryFn: () => apiFetch<Budget[]>('/budgets'),
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch a single budget by ID (includes lines) */
export function useBudget(id: string) {
  return useQuery({
    queryKey: budgetKeys.detail(id),
    queryFn: () => apiFetch<Budget>(`/budgets/${id}`),
    staleTime: 60 * 1000,
    enabled: !!id,
  });
}

// ── Mutation Hooks ──────────────────────────────────────────────────────────

/** Create a new budget */
export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBudgetInput) =>
      apiPost<Budget>('/budgets', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });
    },
  });
}

/** Update an existing budget */
export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateBudgetInput }) =>
      apiPut<Budget>(`/budgets/${id}`, updates),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: budgetKeys.detail(variables.id) });
      void queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });
    },
  });
}

/** Delete a budget */
export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/budgets/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });
    },
  });
}
