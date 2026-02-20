import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { contactKeys } from './keys';
import { apiFetch, apiPost, apiPut, apiDelete } from '../../../lib/api-helpers';
import { showToast } from '../../dashboard/components/ToastContainer';
import type { Contact, CreateContact, UpdateContact } from '@shared/schemas/contact';
import type { Invoice } from '@shared/schemas/invoice';
import type { Bill } from '@shared/schemas/bill';
import type { ContactActivity, FinancialSummary } from '../types';

export function useContacts(filters?: { search?: string; type?: string }) {
  return useQuery({
    queryKey: contactKeys.list(filters ?? {}),
    queryFn: () => apiFetch<Contact[]>('/contacts'),
    select: (data) => {
      let results = data;

      if (filters?.search) {
        const term = filters.search.toLowerCase();
        results = results.filter(
          (c) =>
            c.name.toLowerCase().includes(term) ||
            (c.email && c.email.toLowerCase().includes(term)) ||
            (c.phone && c.phone.toLowerCase().includes(term)),
        );
      }

      if (filters?.type && filters.type !== 'all') {
        if (filters.type === 'archived') {
          results = results.filter((c) => c.isArchived);
        } else {
          // For non-archived tabs, exclude archived contacts
          results = results.filter((c) => !c.isArchived);
          results = results.filter((c) => {
            if (filters.type === 'customer') {
              return c.type === 'customer' || c.type === 'customer_and_supplier';
            }
            if (filters.type === 'supplier') {
              return c.type === 'supplier' || c.type === 'customer_and_supplier';
            }
            return true;
          });
        }
      }

      return results;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useContact(id: string) {
  return useQuery({
    queryKey: contactKeys.detail(id),
    queryFn: () => apiFetch<Contact>(`/contacts/${id}`),
    staleTime: 60 * 1000,
    enabled: !!id,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateContact) =>
      apiPost<Contact>('/contacts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      showToast('success', 'Contact created');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to create contact');
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContact }) =>
      apiPut<Contact>(`/contacts/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: contactKeys.detail(variables.id),
      });
      showToast('success', 'Contact updated');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to update contact');
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiDelete<{ id: string }>(`/contacts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      showToast('success', 'Contact deleted');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to delete contact');
    },
  });
}

/* ─── Contact Invoices ─── */
export function useContactInvoices(contactId: string) {
  return useQuery({
    queryKey: contactKeys.invoices(contactId),
    queryFn: () => apiFetch<Invoice[]>('/invoices'),
    select: (data) => data.filter((inv) => inv.contactId === contactId),
    staleTime: 60 * 1000,
    enabled: !!contactId,
  });
}

/* ─── Contact Bills ─── */
export function useContactBills(contactId: string) {
  return useQuery({
    queryKey: contactKeys.bills(contactId),
    queryFn: () => apiFetch<Bill[]>('/bills'),
    select: (data) => data.filter((bill) => bill.contactId === contactId),
    staleTime: 60 * 1000,
    enabled: !!contactId,
  });
}

/* ─── Activity Timeline (combined invoices + bills, sorted by date) ─── */
function invoiceToActivity(inv: Invoice): ContactActivity {
  const isOverdue =
    inv.status !== 'paid' &&
    inv.status !== 'voided' &&
    inv.amountDue > 0 &&
    new Date(inv.dueDate) < new Date();
  const isPaid = inv.status === 'paid';
  const isPartial = inv.amountPaid > 0 && inv.amountDue > 0;

  let status: ContactActivity['status'] = 'unpaid';
  if (isPaid) status = 'paid';
  else if (isOverdue) status = 'overdue';
  else if (isPartial) status = 'partial';

  return {
    id: `inv-${inv.id}`,
    type: 'invoice',
    description: `Invoice ${inv.invoiceNumber ?? inv.id.slice(0, 8)}`,
    amount: inv.total,
    date: inv.date,
    status,
    number: inv.invoiceNumber,
  };
}

function billToActivity(bill: Bill): ContactActivity {
  const isOverdue =
    bill.status !== 'paid' &&
    bill.status !== 'voided' &&
    bill.amountDue > 0 &&
    new Date(bill.dueDate) < new Date();
  const isPaid = bill.status === 'paid';
  const isPartial = bill.amountPaid > 0 && bill.amountDue > 0;

  let status: ContactActivity['status'] = 'unpaid';
  if (isPaid) status = 'paid';
  else if (isOverdue) status = 'overdue';
  else if (isPartial) status = 'partial';

  return {
    id: `bill-${bill.id}`,
    type: 'bill',
    description: `Bill ${bill.billNumber ?? bill.id.slice(0, 8)}`,
    amount: bill.total,
    date: bill.date,
    status,
    number: bill.billNumber,
  };
}

export function useContactActivity(contactId: string) {
  const invoicesQuery = useContactInvoices(contactId);
  const billsQuery = useContactBills(contactId);

  const activities = useMemo<ContactActivity[]>(() => {
    const invActivities = (invoicesQuery.data ?? []).map(invoiceToActivity);
    const billActivities = (billsQuery.data ?? []).map(billToActivity);
    return [...invActivities, ...billActivities].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [invoicesQuery.data, billsQuery.data]);

  return {
    data: activities,
    isLoading: invoicesQuery.isLoading || billsQuery.isLoading,
    isError: invoicesQuery.isError || billsQuery.isError,
  };
}

/* ─── Archive / Unarchive ─── */
export function useArchiveContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiPut<Contact>(`/contacts/${id}`, { isArchived: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      showToast('success', 'Contact archived');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to archive contact');
    },
  });
}

export function useUnarchiveContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiPut<Contact>(`/contacts/${id}`, { isArchived: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      showToast('success', 'Contact unarchived');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to unarchive contact');
    },
  });
}

/* ─── Financial Summary ─── */
export function useContactFinancialSummary(contactId: string): {
  data: FinancialSummary;
  isLoading: boolean;
} {
  const invoicesQuery = useContactInvoices(contactId);
  const billsQuery = useContactBills(contactId);

  const summary = useMemo<FinancialSummary>(() => {
    const invoices = invoicesQuery.data ?? [];
    const bills = billsQuery.data ?? [];

    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalBilled = bills.reduce((sum, bill) => sum + bill.total, 0);
    const outstanding = invoices
      .filter((inv) => inv.status !== 'paid' && inv.status !== 'voided')
      .reduce((sum, inv) => sum + inv.amountDue, 0);

    const now = new Date();
    const overdueInvoices = invoices.filter(
      (inv) =>
        inv.status !== 'paid' &&
        inv.status !== 'voided' &&
        inv.amountDue > 0 &&
        new Date(inv.dueDate) < now,
    );
    const overdue = overdueInvoices.reduce((sum, inv) => sum + inv.amountDue, 0);

    return {
      totalInvoiced,
      totalBilled,
      outstanding,
      overdue,
      overdueCount: overdueInvoices.length,
    };
  }, [invoicesQuery.data, billsQuery.data]);

  return {
    data: summary,
    isLoading: invoicesQuery.isLoading || billsQuery.isLoading,
  };
}
