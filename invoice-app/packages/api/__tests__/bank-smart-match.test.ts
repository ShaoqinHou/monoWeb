import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDb } from '../src/db/test-helpers';
import { createApp } from '../src/app';
import type { Db } from '../src/db/index';

let db: Db;
let cleanup: () => void;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  ({ db, cleanup } = createTestDb());
  app = createApp(db);
});

afterEach(() => cleanup());

async function createContact(name: string) {
  const res = await app.request('/api/contacts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, type: 'customer' }),
  });
  return (await res.json()).data;
}

/** Create an invoice via the proper route and approve it */
async function createApprovedInvoice(contactId: string, amount: number, invoiceNumber?: string) {
  // Create the invoice with a line item matching the desired total (tax exclusive)
  const res = await app.request('/api/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contactId,
      date: '2024-01-01',
      dueDate: '2024-01-31',
      amountType: 'no_tax',
      lineItems: [
        { description: 'Service', quantity: 1, unitPrice: amount, taxRate: 0, discount: 0 },
      ],
    }),
  });
  const { data: inv } = await res.json();

  // Transition: draft -> submitted
  await app.request(`/api/invoices/${inv.id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'submitted' }),
  });

  // Transition: submitted -> approved
  await app.request(`/api/invoices/${inv.id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'approved' }),
  });

  return inv;
}

async function createApprovedBill(contactId: string, contactName: string, amount: number) {
  // Create a bill
  const res = await app.request('/api/bills', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contactId,
      date: '2024-01-01',
      dueDate: '2024-01-31',
      amountType: 'no_tax',
      lineItems: [
        { description: 'Supply', quantity: 1, unitPrice: amount, taxRate: 0, discount: 0 },
      ],
    }),
  });
  const { data: bill } = await res.json();

  // Transition: draft -> submitted -> approved
  await app.request(`/api/bills/${bill.id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'submitted' }),
  });

  await app.request(`/api/bills/${bill.id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'approved' }),
  });

  return bill;
}

async function createTransaction(accountId: string, amount: number, description: string = '') {
  const res = await app.request('/api/bank-transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId, date: '2024-01-15', amount, description }),
  });
  return (await res.json()).data;
}

describe('Bank Smart Match Suggestions', () => {
  it('GET /suggestions returns matches by amount for inflow', async () => {
    const contact = await createContact('Acme Corp');
    await createApprovedInvoice(contact.id, 1000);
    const tx = await createTransaction('acc-1', 1000, 'Payment received');

    const res = await app.request(`/api/bank-transactions/${tx.id}/suggestions`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].type).toBe('invoice');
    expect(body.data[0].amount).toBe(1000);
    expect(body.data[0].confidence).toBeGreaterThan(0);
  });

  it('GET /suggestions returns matches by contact name in description', async () => {
    const contact = await createContact('Widget Co');
    await createApprovedInvoice(contact.id, 500);
    const tx = await createTransaction('acc-1', 490, 'Payment from Widget Co ref 123');

    const res = await app.request(`/api/bank-transactions/${tx.id}/suggestions`);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(0);
    // Should have higher confidence due to name match + close amount
    expect(body.data[0].confidence).toBeGreaterThan(0.5);
  });

  it('GET /suggestions returns bill matches for outflow', async () => {
    const contact = await createContact('Supplier Inc');
    await createApprovedBill(contact.id, 'Supplier Inc', 750);
    const tx = await createTransaction('acc-1', -750, 'Supplier Inc payment');

    const res = await app.request(`/api/bank-transactions/${tx.id}/suggestions`);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].type).toBe('bill');
    expect(body.data[0].amount).toBe(750);
  });

  it('GET /suggestions returns 404 for missing transaction', async () => {
    const res = await app.request('/api/bank-transactions/nonexistent/suggestions');
    expect(res.status).toBe(404);
  });

  it('GET /suggestions returns empty for reconciled transaction', async () => {
    const contact = await createContact('Acme Corp');
    await createApprovedInvoice(contact.id, 500);
    const tx = await createTransaction('acc-1', 500, 'Payment');

    // Reconcile it
    await app.request(`/api/bank-transactions/${tx.id}/reconcile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'Income' }),
    });

    const res = await app.request(`/api/bank-transactions/${tx.id}/suggestions`);
    const body = await res.json();
    expect(body.data).toEqual([]);
  });

  it('GET /suggestions limits to top 5', async () => {
    const contact = await createContact('Many Inc');
    for (let i = 0; i < 8; i++) {
      await createApprovedInvoice(contact.id, 100 + i);
    }
    const tx = await createTransaction('acc-1', 100, 'Many Inc payment');

    const res = await app.request(`/api/bank-transactions/${tx.id}/suggestions`);
    const body = await res.json();
    expect(body.data.length).toBeLessThanOrEqual(5);
  });
});

describe('Bank Bulk Reconcile', () => {
  it('POST /bulk-reconcile reconciles multiple transactions', async () => {
    const tx1 = await createTransaction('acc-1', 100, 'Payment 1');
    const tx2 = await createTransaction('acc-1', 200, 'Payment 2');
    const tx3 = await createTransaction('acc-1', 300, 'Payment 3');

    const res = await app.request('/api/bank-transactions/bulk-reconcile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionIds: [tx1.id, tx2.id, tx3.id] }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.reconciled).toBe(3);
    expect(body.data.failed).toBe(0);

    // Verify all are reconciled
    const checkRes = await app.request(`/api/bank-transactions/${tx1.id}`);
    const checkBody = await checkRes.json();
    expect(checkBody.data.isReconciled).toBe(true);
  });

  it('POST /bulk-reconcile skips already reconciled', async () => {
    const tx1 = await createTransaction('acc-1', 100, 'Payment 1');

    // Reconcile first
    await app.request(`/api/bank-transactions/${tx1.id}/reconcile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'Income' }),
    });

    const tx2 = await createTransaction('acc-1', 200, 'Payment 2');

    const res = await app.request('/api/bank-transactions/bulk-reconcile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionIds: [tx1.id, tx2.id] }),
    });
    const body = await res.json();
    expect(body.data.reconciled).toBe(1);
    expect(body.data.failed).toBe(1);
  });

  it('POST /bulk-reconcile returns 400 for empty array', async () => {
    const res = await app.request('/api/bank-transactions/bulk-reconcile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionIds: [] }),
    });
    expect(res.status).toBe(400);
  });
});
