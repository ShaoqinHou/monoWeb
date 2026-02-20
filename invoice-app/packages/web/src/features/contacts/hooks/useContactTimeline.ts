import { useMemo } from 'react';
import { useContactInvoices, useContactBills } from './useContacts';
import type { TimelineEvent } from '../types';
import type { Invoice } from '@shared/schemas/invoice';
import type { Bill } from '@shared/schemas/bill';

function invoiceToTimelineEvents(inv: Invoice): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // Invoice created
  events.push({
    id: `inv-created-${inv.id}`,
    type: 'invoice_created',
    date: inv.date,
    description: `Invoice ${inv.invoiceNumber ?? inv.id.slice(0, 8)} created`,
    amount: inv.total,
    status: inv.status,
    entityId: inv.id,
  });

  // Invoice paid
  if (inv.status === 'paid') {
    events.push({
      id: `inv-paid-${inv.id}`,
      type: 'invoice_paid',
      date: inv.updatedAt,
      description: `Invoice ${inv.invoiceNumber ?? inv.id.slice(0, 8)} paid`,
      amount: inv.total,
      status: 'paid',
      entityId: inv.id,
    });
  }

  return events;
}

function billToTimelineEvents(bill: Bill): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // Bill created
  events.push({
    id: `bill-created-${bill.id}`,
    type: 'bill_created',
    date: bill.date,
    description: `Bill ${bill.billNumber ?? bill.id.slice(0, 8)} created`,
    amount: bill.total,
    status: bill.status,
    entityId: bill.id,
  });

  // Bill paid
  if (bill.status === 'paid') {
    events.push({
      id: `bill-paid-${bill.id}`,
      type: 'bill_paid',
      date: bill.updatedAt,
      description: `Bill ${bill.billNumber ?? bill.id.slice(0, 8)} paid`,
      amount: bill.total,
      status: 'paid',
      entityId: bill.id,
    });
  }

  return events;
}

export function useContactTimeline(contactId: string): {
  data: TimelineEvent[];
  isLoading: boolean;
} {
  const invoicesQuery = useContactInvoices(contactId);
  const billsQuery = useContactBills(contactId);

  const events = useMemo<TimelineEvent[]>(() => {
    const invoices = invoicesQuery.data ?? [];
    const bills = billsQuery.data ?? [];

    const invEvents = invoices.flatMap(invoiceToTimelineEvents);
    const billEvents = bills.flatMap(billToTimelineEvents);

    return [...invEvents, ...billEvents].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [invoicesQuery.data, billsQuery.data]);

  return {
    data: events,
    isLoading: invoicesQuery.isLoading || billsQuery.isLoading,
  };
}
