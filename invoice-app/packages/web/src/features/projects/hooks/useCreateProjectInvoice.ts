import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../../../lib/api-helpers';
import { showToast } from '../../dashboard/components/ToastContainer';
import { projectKeys, timeEntryKeys } from './keys';

interface CreateProjectInvoiceInput {
  timeEntryIds: string[];
  expenseIds: string[];
}

interface CreatedInvoice {
  id: string;
  invoiceNumber: string;
  total: number;
  lineItemCount: number;
}

/** Create an invoice from selected unbilled time entries and expenses */
export function useCreateProjectInvoice(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectInvoiceInput) =>
      apiPost<CreatedInvoice>(`/projects/${projectId}/create-invoice`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: [...projectKeys.detail(projectId), 'unbilled'] });
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.all });
      showToast('success', 'Invoice created');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to create invoice'),
  });
}
