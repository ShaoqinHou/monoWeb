import { useMemo } from 'react';
import { useContactInvoices, useContactBills } from './useContacts';
import type { StatementTransaction } from '../types';
import type { Invoice } from '@shared/schemas/invoice';
import type { Bill } from '@shared/schemas/bill';

function invoiceToStatementTransaction(inv: Invoice): StatementTransaction {
  // Paid invoices show as credits, unpaid as debits
  if (inv.status === 'paid') {
    return {
      date: inv.date,
      type: 'payment',
      number: inv.invoiceNumber ?? inv.id.slice(0, 8),
      description: `Payment for Invoice ${inv.invoiceNumber ?? inv.id.slice(0, 8)}`,
      debit: 0,
      credit: inv.total,
      balance: 0, // calculated later
    };
  }

  return {
    date: inv.date,
    type: 'invoice',
    number: inv.invoiceNumber ?? inv.id.slice(0, 8),
    description: `Invoice ${inv.invoiceNumber ?? inv.id.slice(0, 8)}`,
    debit: inv.total,
    credit: 0,
    balance: 0, // calculated later
  };
}

function billToStatementTransaction(bill: Bill): StatementTransaction {
  if (bill.status === 'paid') {
    return {
      date: bill.date,
      type: 'payment',
      number: bill.billNumber ?? bill.id.slice(0, 8),
      description: `Payment for Bill ${bill.billNumber ?? bill.id.slice(0, 8)}`,
      debit: 0,
      credit: bill.total,
      balance: 0,
    };
  }

  return {
    date: bill.date,
    type: 'invoice',
    number: bill.billNumber ?? bill.id.slice(0, 8),
    description: `Bill ${bill.billNumber ?? bill.id.slice(0, 8)}`,
    debit: bill.total,
    credit: 0,
    balance: 0,
  };
}

export function useContactStatement(
  contactId: string,
  dateRange: { start: string; end: string },
): {
  data: StatementTransaction[];
  isLoading: boolean;
} {
  const invoicesQuery = useContactInvoices(contactId);
  const billsQuery = useContactBills(contactId);

  const data = useMemo<StatementTransaction[]>(() => {
    const invoices = invoicesQuery.data ?? [];
    const bills = billsQuery.data ?? [];

    const invTxns = invoices.map(invoiceToStatementTransaction);
    const billTxns = bills.map(billToStatementTransaction);

    // Combine, filter by date range, sort by date ascending
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    const all = [...invTxns, ...billTxns]
      .filter((t) => {
        const d = new Date(t.date);
        return d >= startDate && d <= endDate;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    let balance = 0;
    for (const txn of all) {
      balance += txn.debit - txn.credit;
      txn.balance = balance;
    }

    return all;
  }, [invoicesQuery.data, billsQuery.data, dateRange.start, dateRange.end]);

  return {
    data,
    isLoading: invoicesQuery.isLoading || billsQuery.isLoading,
  };
}
