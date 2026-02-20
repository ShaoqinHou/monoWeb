import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../../../lib/api-helpers';
import { invoiceKeys } from './keys';
import type { FormLineItem } from '../types';

export interface BatchInvoiceTemplate {
  date: string;
  dueDate: string;
  reference: string;
  currency: string;
  amountType: 'exclusive' | 'inclusive' | 'no_tax';
  lineItems: FormLineItem[];
  notes: string;
}

export interface BatchInvoiceContact {
  id: string;
  name: string;
}

export interface BatchCreateRequest {
  template: BatchInvoiceTemplate;
  contacts: BatchInvoiceContact[];
}

export interface BatchCreateResult {
  createdIds: string[];
  failedContacts: Array<{ contactId: string; error: string }>;
}

/** Create one invoice per contact from a shared template */
export function useBatchCreateInvoices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: BatchCreateRequest) =>
      apiPost<BatchCreateResult>('/invoices/batch-create', request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}
