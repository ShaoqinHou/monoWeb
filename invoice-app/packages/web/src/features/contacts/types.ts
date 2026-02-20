import type { Contact } from '../../../../shared/schemas/contact';
import type { Invoice } from '../../../../shared/schemas/invoice';
import type { Bill } from '../../../../shared/schemas/bill';

export type ContactFilter = 'all' | 'customer' | 'supplier' | 'archived';

export interface ContactFilters {
  search: string;
  type: ContactFilter;
}

export interface ContactActivity {
  id: string;
  type: 'invoice' | 'bill' | 'payment';
  description: string;
  amount: number;
  date: string;
  status: 'paid' | 'unpaid' | 'overdue' | 'partial';
  number?: string;
}

export interface FinancialSummary {
  totalInvoiced: number;
  totalBilled: number;
  outstanding: number;
  overdue: number;
  overdueCount: number;
}

export type ContactStatusFilter = 'active' | 'archived' | 'all';

export interface MergeDecision {
  keepContactId: string;
  deleteContactId: string;
  fields: {
    name: 'source' | 'target';
    email: 'source' | 'target';
    phone: 'source' | 'target';
    address: 'source' | 'target';
  };
}

export interface TimelineEvent {
  id: string;
  type:
    | 'invoice_created'
    | 'invoice_paid'
    | 'bill_created'
    | 'bill_paid'
    | 'payment_received'
    | 'payment_made'
    | 'note_added'
    | 'contact_updated'
    | 'email_sent';
  date: string;
  description: string;
  amount?: number;
  status?: string;
  entityId?: string;
  entityHref?: string;
}

export interface StatementTransaction {
  date: string;
  type: 'invoice' | 'payment' | 'credit-note';
  number: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export type { Contact, Invoice, Bill };
