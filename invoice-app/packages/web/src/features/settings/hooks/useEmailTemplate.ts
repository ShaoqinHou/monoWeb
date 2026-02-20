import { useEmailTemplates } from './useEmailTemplates';
import type { EmailTemplate } from './useEmailTemplates';

export interface ResolvedEmailTemplate {
  subject: string;
  body: string;
  rawTemplate: EmailTemplate;
}

export interface TemplateVariables {
  contactName?: string;
  invoiceNumber?: string;
  quoteNumber?: string;
  poNumber?: string;
  amount?: string;
  dueDate?: string;
  expiryDate?: string;
  deliveryDate?: string;
  onlineUrl?: string;
  organisationName?: string;
}

function resolveTemplate(
  template: EmailTemplate,
  variables: TemplateVariables,
): ResolvedEmailTemplate {
  let subject = template.subject;
  let body = template.body;

  const replacements: Record<string, string | undefined> = {
    '{contactName}': variables.contactName,
    '{invoiceNumber}': variables.invoiceNumber,
    '{quoteNumber}': variables.quoteNumber,
    '{poNumber}': variables.poNumber,
    '{amount}': variables.amount,
    '{dueDate}': variables.dueDate,
    '{expiryDate}': variables.expiryDate,
    '{deliveryDate}': variables.deliveryDate,
    '{onlineUrl}': variables.onlineUrl,
    '{organisationName}': variables.organisationName ?? 'Demo Company (NZ)',
  };

  for (const [placeholder, value] of Object.entries(replacements)) {
    if (value != null) {
      subject = subject.replaceAll(placeholder, value);
      body = body.replaceAll(placeholder, value);
    }
  }

  return { subject, body, rawTemplate: template };
}

/**
 * Fetch an email template by type and optionally resolve variables.
 * Used by EmailComposeDialog to auto-fill subject and body.
 */
export function useEmailTemplate(
  type: EmailTemplate['type'],
  variables?: TemplateVariables,
): { data: ResolvedEmailTemplate | undefined; isLoading: boolean } {
  const { data: templates, isLoading } = useEmailTemplates();

  if (!templates) {
    return { data: undefined, isLoading };
  }

  const template = templates.find((t) => t.type === type);
  if (!template) {
    return { data: undefined, isLoading: false };
  }

  if (variables) {
    return { data: resolveTemplate(template, variables), isLoading: false };
  }

  return {
    data: { subject: template.subject, body: template.body, rawTemplate: template },
    isLoading: false,
  };
}
