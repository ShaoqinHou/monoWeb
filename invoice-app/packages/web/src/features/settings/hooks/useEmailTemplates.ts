import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPut } from '../../../lib/api-helpers';
import { settingsKeys } from './keys';

export interface EmailTemplate {
  type: 'invoice' | 'quote' | 'reminder' | 'purchase-order';
  subject: string;
  body: string;
}

const SETTING_KEY = 'email-templates';

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    type: 'invoice',
    subject: 'Invoice {invoiceNumber} from {organisationName}',
    body: 'Hi {contactName},\n\nHere is invoice {invoiceNumber} for {amount} due on {dueDate}.\n\nView your invoice online: {onlineUrl}\n\nRegards,\n{organisationName}',
  },
  {
    type: 'quote',
    subject: 'Quote {quoteNumber} from {organisationName}',
    body: 'Hi {contactName},\n\nPlease find attached quote {quoteNumber} for {amount}.\n\nThis quote is valid until {expiryDate}.\n\nRegards,\n{organisationName}',
  },
  {
    type: 'reminder',
    subject: 'Reminder: Invoice {invoiceNumber} is overdue',
    body: 'Hi {contactName},\n\nThis is a friendly reminder that invoice {invoiceNumber} for {amount} was due on {dueDate}.\n\nPlease arrange payment at your earliest convenience.\n\nRegards,\n{organisationName}',
  },
  {
    type: 'purchase-order',
    subject: 'Purchase Order {poNumber} from {organisationName}',
    body: 'Hi {contactName},\n\nPlease find attached purchase order {poNumber}.\n\nDelivery date: {deliveryDate}\n\nRegards,\n{organisationName}',
  },
];

export const EMAIL_TEMPLATE_VARIABLES = [
  '{contactName}',
  '{invoiceNumber}',
  '{quoteNumber}',
  '{poNumber}',
  '{amount}',
  '{dueDate}',
  '{expiryDate}',
  '{deliveryDate}',
  '{onlineUrl}',
  '{organisationName}',
];

export function useEmailTemplates() {
  return useQuery({
    queryKey: [...settingsKeys.all, 'email-templates'] as const,
    queryFn: async (): Promise<EmailTemplate[]> => {
      try {
        const entry = await apiFetch<{ key: string; value: string }>(`/settings/${SETTING_KEY}`);
        return JSON.parse(entry.value) as EmailTemplate[];
      } catch {
        return [...DEFAULT_TEMPLATES];
      }
    },
    staleTime: 60 * 1000,
  });
}

export function useSaveEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: EmailTemplate): Promise<EmailTemplate[]> => {
      // Load current from cache or defaults
      const current =
        queryClient.getQueryData<EmailTemplate[]>([...settingsKeys.all, 'email-templates']) ??
        [...DEFAULT_TEMPLATES];
      const updated = [...current];
      const idx = updated.findIndex((t) => t.type === template.type);
      if (idx >= 0) {
        updated[idx] = template;
      } else {
        updated.push(template);
      }
      await apiPut(`/settings/${SETTING_KEY}`, { value: JSON.stringify(updated) });
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([...settingsKeys.all, 'email-templates'], data);
    },
  });
}
