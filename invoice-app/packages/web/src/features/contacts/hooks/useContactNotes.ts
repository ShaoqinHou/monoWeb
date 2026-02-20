import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactNoteKeys } from './contactNoteKeys';
import { apiFetch, apiPost, apiDelete } from '../../../lib/api-helpers';
import { showToast } from '../../dashboard/components/ToastContainer';

export interface ContactNote {
  id: string;
  contactId: string;
  content: string;
  createdAt: string;
}

export function useContactNotes(contactId: string) {
  return useQuery({
    queryKey: contactNoteKeys.list(contactId),
    queryFn: () => apiFetch<ContactNote[]>(`/contact-groups/notes/${contactId}`),
    staleTime: 60 * 1000,
    enabled: !!contactId,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contactId, content }: { contactId: string; content: string }) =>
      apiPost<ContactNote>(`/contact-groups/notes/${contactId}`, { content }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: contactNoteKeys.list(variables.contactId) });
      showToast('success', 'Note added');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to add note');
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contactId, noteId }: { contactId: string; noteId: string }) =>
      apiDelete<{ id: string }>(`/contact-groups/notes/${contactId}/${noteId}`),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: contactNoteKeys.list(variables.contactId) });
      showToast('success', 'Note deleted');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to delete note');
    },
  });
}
