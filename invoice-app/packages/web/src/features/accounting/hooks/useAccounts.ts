import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost, apiPut, apiDelete } from '../../../lib/api-helpers';
import { accountingKeys } from './keys';
import type { AccountWithBalance, BankAccount, AccountGroup } from '../types';
import { ACCOUNT_TYPE_ORDER, ACCOUNT_TYPE_LABELS } from '../types';
import type { Account, CreateAccount, UpdateAccount } from '../../../../../shared/schemas/account';
import { showToast } from '../../dashboard/components/ToastContainer';

/** Fetch all accounts from API, enriched with balance (0 for now — no transactions table) */
export function useAccounts() {
  return useQuery({
    queryKey: accountingKeys.accounts(),
    queryFn: async (): Promise<AccountWithBalance[]> => {
      const accounts = await apiFetch<Account[]>('/accounts');
      return accounts.map((a) => ({ ...a, balance: 0 }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch a single account by id */
export function useAccount(id: string) {
  return useQuery({
    queryKey: accountingKeys.account(id),
    queryFn: async (): Promise<AccountWithBalance> => {
      const account = await apiFetch<Account>(`/accounts/${id}`);
      return { ...account, balance: 0 };
    },
    staleTime: 60 * 1000,
  });
}

/** Fetch accounts grouped by type */
export function useAccountGroups() {
  return useQuery({
    queryKey: [...accountingKeys.accounts(), 'grouped'],
    queryFn: async (): Promise<AccountGroup[]> => {
      const accounts = await apiFetch<Account[]>('/accounts');
      const withBalance: AccountWithBalance[] = accounts.map((a) => ({ ...a, balance: 0 }));

      const groups: AccountGroup[] = ACCOUNT_TYPE_ORDER
        .map((type) => ({
          type,
          label: ACCOUNT_TYPE_LABELS[type],
          accounts: withBalance
            .filter((a) => a.type === type)
            .sort((a, b) => a.code.localeCompare(b.code)),
        }))
        .filter((g) => g.accounts.length > 0);
      return groups;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch bank accounts — filters asset-type accounts from the accounts API */
export function useBankAccounts() {
  return useQuery({
    queryKey: accountingKeys.bankAccounts(),
    queryFn: async (): Promise<BankAccount[]> => {
      const accounts = await apiFetch<Account[]>('/accounts');
      return accounts
        .filter((a) => a.type === 'asset')
        .map((a) => ({
          id: a.id,
          name: a.name,
          accountNumber: a.code,
          balance: 0,
          recentTransactionCount: 0,
        }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Create a new account */
export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAccount): Promise<Account> => {
      return apiPost<Account>('/accounts', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountingKeys.accounts() });
      queryClient.invalidateQueries({ queryKey: accountingKeys.bankAccounts() });
      showToast('success', 'Account created');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to create account');
    },
  });
}

/** Update an existing account */
export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAccount }): Promise<Account> => {
      return apiPut<Account>(`/accounts/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountingKeys.accounts() });
      queryClient.invalidateQueries({ queryKey: accountingKeys.bankAccounts() });
      showToast('success', 'Account updated');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to update account');
    },
  });
}

/** Import accounts from CSV data via POST /api/accounts/import */
export interface ImportAccountRow {
  code: string;
  name: string;
  type: string;
  taxType?: string;
}

export interface ImportAccountsResult {
  imported: number;
  skipped: number;
  skippedDetails: Array<{ code: string; reason: string }>;
  message: string;
}

export function useImportAccounts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accounts: ImportAccountRow[]): Promise<ImportAccountsResult> => {
      return apiPost<ImportAccountsResult>('/accounts/import', { accounts });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: accountingKeys.accounts() });
      queryClient.invalidateQueries({ queryKey: accountingKeys.bankAccounts() });
      showToast('success', `Imported ${result.imported} account(s)`);
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to import accounts');
    },
  });
}

/** Delete an account */
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<{ id: string }> => {
      return apiDelete<{ id: string }>(`/accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountingKeys.accounts() });
      queryClient.invalidateQueries({ queryKey: accountingKeys.bankAccounts() });
      showToast('success', 'Account deleted');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to delete account');
    },
  });
}
