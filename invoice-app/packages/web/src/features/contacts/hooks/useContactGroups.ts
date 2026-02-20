import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactGroupKeys } from './contactGroupKeys';
import { apiFetch, apiPost, apiPut, apiDelete } from '../../../lib/api-helpers';
import { showToast } from '../../dashboard/components/ToastContainer';

export interface ContactGroup {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface ContactGroupWithMembers extends ContactGroup {
  members: Array<{
    id: string;
    name: string;
    type: string;
    email: string | null;
  }>;
}

export function useContactGroups() {
  return useQuery({
    queryKey: contactGroupKeys.lists(),
    queryFn: () => apiFetch<ContactGroup[]>('/contact-groups'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useContactGroup(id: string) {
  return useQuery({
    queryKey: contactGroupKeys.detail(id),
    queryFn: () => apiFetch<ContactGroupWithMembers>(`/contact-groups/${id}`),
    staleTime: 60 * 1000,
    enabled: !!id,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      apiPost<ContactGroup>('/contact-groups', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactGroupKeys.lists() });
      showToast('success', 'Group created');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to create group');
    },
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string } }) =>
      apiPut<ContactGroup>(`/contact-groups/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: contactGroupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contactGroupKeys.detail(variables.id) });
      showToast('success', 'Group updated');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to update group');
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiDelete<{ id: string }>(`/contact-groups/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactGroupKeys.lists() });
      showToast('success', 'Group deleted');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to delete group');
    },
  });
}

export function useAddMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, contactId }: { groupId: string; contactId: string }) =>
      apiPost<{ id: string; groupId: string; contactId: string }>(
        `/contact-groups/${groupId}/members`,
        { contactId },
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: contactGroupKeys.detail(variables.groupId) });
      showToast('success', 'Member added');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to add member');
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, contactId }: { groupId: string; contactId: string }) =>
      apiDelete<{ groupId: string; contactId: string }>(
        `/contact-groups/${groupId}/members/${contactId}`,
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: contactGroupKeys.detail(variables.groupId) });
      showToast('success', 'Member removed');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to remove member');
    },
  });
}
