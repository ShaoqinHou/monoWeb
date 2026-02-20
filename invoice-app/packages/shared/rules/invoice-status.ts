import type { InvoiceStatusType } from '../schemas/invoice';

/**
 * Valid status transitions for invoices and bills.
 * Same state machine for both — they follow identical lifecycle.
 */
const STATUS_TRANSITIONS: Record<InvoiceStatusType, InvoiceStatusType[]> = {
  draft: ['submitted', 'voided'],
  submitted: ['approved', 'draft', 'voided'],
  approved: ['paid', 'voided'],
  paid: [],     // Terminal state — no transitions out
  voided: [],   // Terminal state — no transitions out
};

/**
 * Check if a status transition is valid.
 */
export function canTransition(from: InvoiceStatusType, to: InvoiceStatusType): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Get all valid next statuses from current status.
 */
export function nextStatuses(current: InvoiceStatusType): InvoiceStatusType[] {
  return STATUS_TRANSITIONS[current] ?? [];
}

/**
 * Check if a document is editable (only drafts can be edited).
 */
export function isEditable(status: InvoiceStatusType): boolean {
  return status === 'draft';
}

/**
 * Check if a document can receive payments.
 */
export function canReceivePayment(status: InvoiceStatusType): boolean {
  return status === 'approved';
}
