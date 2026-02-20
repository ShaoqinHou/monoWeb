import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost } from '../../../lib/api-helpers';
import { accountingKeys } from './keys';
import type { JournalEntry } from '../types';
import { showToast } from '../../dashboard/components/ToastContainer';

/** Fetch all journal entries from API */
export function useJournals() {
  return useQuery({
    queryKey: accountingKeys.journals(),
    queryFn: async (): Promise<JournalEntry[]> => {
      return apiFetch<JournalEntry[]>('/journals');
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch a single journal entry */
export function useJournal(id: string) {
  return useQuery({
    queryKey: accountingKeys.journal(id),
    queryFn: async (): Promise<JournalEntry> => {
      return apiFetch<JournalEntry>(`/journals/${id}`);
    },
    staleTime: 60 * 1000,
  });
}

/** Create a new journal entry */
export function useCreateJournal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: Omit<JournalEntry, 'id'>): Promise<JournalEntry> => {
      return apiPost<JournalEntry>('/journals', entry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountingKeys.journals() });
      showToast('success', 'Journal entry created');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to create journal entry');
    },
  });
}
