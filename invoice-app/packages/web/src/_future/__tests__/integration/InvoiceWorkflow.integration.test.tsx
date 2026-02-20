// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock api-helpers
vi.mock('../../lib/api-helpers', () => ({
  apiFetch: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
}));

import { apiFetch, apiPost, apiPut } from '../../lib/api-helpers';
import { useInvoices, useCreateInvoice, useTransitionInvoice, useRecordPayment } from '../../features/invoices/hooks/useInvoices';
import { useCreateQuote, useQuotes } from '../../features/invoices/hooks/useQuotes';
import { useConvertQuoteToInvoice } from '../../features/invoices/hooks/useConvertQuote';
import { useCreateRecurringInvoice, useGenerateRecurringInvoice } from '../../features/invoices/hooks/useRecurringInvoices';
import { useCreateCreditNote, useApplyCreditNote } from '../../features/invoices/hooks/useCreditNotes';
import { useApplyCreditToInvoice } from '../../features/invoices/hooks/useApplyCreditToInvoice';
import { useCreateContact } from '../../features/contacts/hooks/useContacts';

const mockedApiFetch = vi.mocked(apiFetch);
const mockedApiPost = vi.mocked(apiPost);
const mockedApiPut = vi.mocked(apiPut);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Invoice Workflow Integration', () => {
  it('creates contact then creates invoice with line items and correct total', async () => {
    const contact = {
      id: 'c-1',
      name: 'Acme Corp',
      type: 'customer' as const,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    const invoice = {
      id: 'inv-1',
      invoiceNumber: 'INV-001',
      contactId: 'c-1',
      contactName: 'Acme Corp',
      status: 'draft',
      date: '2026-02-01',
      dueDate: '2026-03-01',
      lineItems: [
        { id: 'li-1', description: 'Widget A', quantity: 10, unitPrice: 50, taxRate: 15, taxAmount: 75, lineAmount: 500, discount: 0 },
        { id: 'li-2', description: 'Widget B', quantity: 5, unitPrice: 100, taxRate: 15, taxAmount: 75, lineAmount: 500, discount: 0 },
      ],
      subTotal: 1000,
      totalTax: 150,
      total: 1150,
      amountDue: 1150,
      amountPaid: 0,
      currency: 'NZD',
      createdAt: '2026-02-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
    };

    mockedApiPost.mockResolvedValueOnce(contact); // createContact
    mockedApiPost.mockResolvedValueOnce(invoice); // createInvoice

    const wrapper = createWrapper();

    // Step 1: Create contact
    const { result: contactResult } = renderHook(() => useCreateContact(), { wrapper });
    await act(async () => {
      await contactResult.current.mutateAsync({
        name: 'Acme Corp',
        type: 'customer',
        isArchived: false,
      });
    });

    expect(mockedApiPost).toHaveBeenCalledWith('/contacts', expect.objectContaining({ name: 'Acme Corp' }));

    // Step 2: Create invoice with line items
    const { result: invoiceResult } = renderHook(() => useCreateInvoice(), { wrapper });
    await act(async () => {
      const created = await invoiceResult.current.mutateAsync({
        contactId: 'c-1',
        date: '2026-02-01',
        dueDate: '2026-03-01',
        currency: 'NZD',
        currencyCode: 'NZD',
        exchangeRate: 1.0,
        amountType: 'exclusive',
        lineItems: [
          { description: 'Widget A', quantity: 10, unitPrice: 50, taxRate: 15, discount: 0 },
          { description: 'Widget B', quantity: 5, unitPrice: 100, taxRate: 15, discount: 0 },
        ],
      });
      expect(created.total).toBe(1150);
      expect(created.subTotal).toBe(1000);
    });
  });

  it('submits invoice for approval, approves, then marks as paid', async () => {
    const submittedInvoice = {
      id: 'inv-1',
      status: 'submitted',
      total: 500,
      amountDue: 500,
    };
    const approvedInvoice = {
      id: 'inv-1',
      status: 'approved',
      total: 500,
      amountDue: 500,
    };
    const paidResult = { id: 'pmt-1', invoiceId: 'inv-1', amount: 500 };

    mockedApiPut.mockResolvedValueOnce(submittedInvoice); // transition to submitted
    mockedApiPut.mockResolvedValueOnce(approvedInvoice); // transition to approved
    mockedApiPost.mockResolvedValueOnce(paidResult); // record payment

    const wrapper = createWrapper();

    // Submit for approval
    const { result: transitionResult } = renderHook(() => useTransitionInvoice(), { wrapper });
    await act(async () => {
      const r = await transitionResult.current.mutateAsync({ id: 'inv-1', status: 'submitted' });
      expect(r.status).toBe('submitted');
    });

    // Approve
    await act(async () => {
      const r = await transitionResult.current.mutateAsync({ id: 'inv-1', status: 'approved' });
      expect(r.status).toBe('approved');
    });

    // Record payment
    const { result: paymentResult } = renderHook(() => useRecordPayment(), { wrapper });
    await act(async () => {
      await paymentResult.current.mutateAsync({
        invoiceId: 'inv-1',
        amount: 500,
        date: '2026-02-15',
        reference: 'CHQ-001',
      });
    });

    expect(mockedApiPost).toHaveBeenCalledWith('/payments', expect.objectContaining({
      invoiceId: 'inv-1',
      amount: 500,
    }));
  });

  it('creates quote then converts to invoice with sourceQuoteId linked', async () => {
    const quote = {
      id: 'q-1',
      quoteNumber: 'QU-001',
      contactId: 'c-1',
      contactName: 'Acme Corp',
      status: 'draft',
      title: 'Widget Supply',
      total: 1000,
      date: '2026-02-01',
      expiryDate: '2026-03-01',
    };

    const convertedInvoice = {
      id: 'inv-2',
      invoiceNumber: 'INV-002',
      sourceQuoteId: 'q-1',
      contactId: 'c-1',
      contactName: 'Acme Corp',
      total: 1000,
      status: 'draft',
    };

    mockedApiPost.mockResolvedValueOnce(quote); // create quote
    mockedApiPost.mockResolvedValueOnce(convertedInvoice); // convert quote

    const wrapper = createWrapper();

    // Create quote
    const { result: quoteResult } = renderHook(() => useCreateQuote(), { wrapper });
    await act(async () => {
      await quoteResult.current.mutateAsync({
        contactId: 'c-1',
        date: '2026-02-01',
        expiryDate: '2026-03-01',
        title: 'Widget Supply',
      });
    });

    // Convert to invoice
    const { result: convertResult } = renderHook(() => useConvertQuoteToInvoice(), { wrapper });
    await act(async () => {
      const result = await convertResult.current.mutateAsync('q-1');
      expect(result.sourceQuoteId).toBe('q-1');
      expect(result.contactId).toBe('c-1');
    });

    expect(mockedApiPost).toHaveBeenCalledWith('/quotes/q-1/convert', {});
  });

  it('creates recurring invoice and generates a due invoice', async () => {
    const recurring = {
      id: 'ri-1',
      templateName: 'Monthly Hosting',
      contactId: 'c-1',
      contactName: 'Acme Corp',
      frequency: 'monthly',
      nextDate: '2026-03-01',
      status: 'active',
      total: 200,
      timesGenerated: 0,
    };

    const generatedInvoice = {
      id: 'inv-3',
      invoiceNumber: 'INV-003',
      contactId: 'c-1',
      total: 200,
      status: 'draft',
    };

    mockedApiPost.mockResolvedValueOnce(recurring); // create recurring
    mockedApiPost.mockResolvedValueOnce(generatedInvoice); // generate

    const wrapper = createWrapper();

    // Create recurring invoice
    const { result: recurringResult } = renderHook(() => useCreateRecurringInvoice(), { wrapper });
    await act(async () => {
      await recurringResult.current.mutateAsync({
        templateName: 'Monthly Hosting',
        contactId: 'c-1',
        frequency: 'monthly',
        nextDate: '2026-03-01',
        total: 200,
      });
    });

    // Generate invoice from recurring
    const { result: generateResult } = renderHook(() => useGenerateRecurringInvoice(), { wrapper });
    await act(async () => {
      await generateResult.current.mutateAsync('ri-1');
    });

    expect(mockedApiPost).toHaveBeenCalledWith('/recurring-invoices/ri-1/generate', {});
  });

  it('creates credit note and applies to invoice, reducing amountDue', async () => {
    const creditNote = {
      id: 'cn-1',
      creditNoteNumber: 'CN-001',
      type: 'sales',
      contactId: 'c-1',
      contactName: 'Acme Corp',
      status: 'draft',
      total: 200,
      remainingCredit: 200,
      date: '2026-02-01',
    };

    const applyCreditResult = {
      invoiceId: 'inv-1',
      creditNoteId: 'cn-1',
      amount: 200,
      newAmountDue: 800, // was 1000, now 800
      newRemainingCredit: 0,
    };

    mockedApiPost.mockResolvedValueOnce(creditNote); // create credit note
    mockedApiPost.mockResolvedValueOnce(applyCreditResult); // apply credit

    const wrapper = createWrapper();

    // Create credit note
    const { result: creditResult } = renderHook(() => useCreateCreditNote(), { wrapper });
    await act(async () => {
      await creditResult.current.mutateAsync({
        type: 'sales',
        contactId: 'c-1',
        date: '2026-02-01',
        total: 200,
      });
    });

    // Apply credit to invoice
    const { result: applyResult } = renderHook(() => useApplyCreditToInvoice(), { wrapper });
    await act(async () => {
      const result = await applyResult.current.mutateAsync({
        invoiceId: 'inv-1',
        creditNoteId: 'cn-1',
        amount: 200,
      });
      expect(result.newAmountDue).toBe(800);
      expect(result.newRemainingCredit).toBe(0);
    });
  });

  it('voids an invoice transitioning status correctly', async () => {
    const voidedInvoice = {
      id: 'inv-1',
      status: 'voided',
      total: 500,
      amountDue: 0,
    };

    mockedApiPut.mockResolvedValueOnce(voidedInvoice);

    const wrapper = createWrapper();

    const { result: transitionResult } = renderHook(() => useTransitionInvoice(), { wrapper });
    await act(async () => {
      const result = await transitionResult.current.mutateAsync({ id: 'inv-1', status: 'voided' });
      expect(result.status).toBe('voided');
      expect(result.amountDue).toBe(0);
    });

    expect(mockedApiPut).toHaveBeenCalledWith('/invoices/inv-1/status', { status: 'voided' });
  });

  it('lists invoices after creation reflects new invoice', async () => {
    const invoices = [
      { id: 'inv-1', invoiceNumber: 'INV-001', status: 'draft', total: 500 },
      { id: 'inv-2', invoiceNumber: 'INV-002', status: 'approved', total: 1000 },
    ];

    mockedApiFetch.mockResolvedValueOnce(invoices);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useInvoices(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0].invoiceNumber).toBe('INV-001');
  });

  it('full lifecycle: create -> submit -> approve -> partial pay -> full pay', async () => {
    const invoice = {
      id: 'inv-lifecycle',
      invoiceNumber: 'INV-100',
      status: 'draft',
      total: 1000,
      amountDue: 1000,
    };

    mockedApiPost.mockResolvedValueOnce(invoice); // create
    mockedApiPut.mockResolvedValueOnce({ ...invoice, status: 'submitted' }); // submit
    mockedApiPut.mockResolvedValueOnce({ ...invoice, status: 'approved' }); // approve
    mockedApiPost.mockResolvedValueOnce({ id: 'pmt-1', amount: 400 }); // partial pay
    mockedApiPost.mockResolvedValueOnce({ id: 'pmt-2', amount: 600 }); // full pay

    const wrapper = createWrapper();

    // Create
    const { result: createResult } = renderHook(() => useCreateInvoice(), { wrapper });
    await act(async () => {
      await createResult.current.mutateAsync({
        contactId: 'c-1',
        date: '2026-02-01',
        dueDate: '2026-03-01',
        currency: 'NZD',
        currencyCode: 'NZD',
        exchangeRate: 1.0,
        amountType: 'exclusive',
        lineItems: [{ description: 'Service', quantity: 1, unitPrice: 1000, taxRate: 15, discount: 0 }],
      });
    });

    // Submit
    const { result: transitionResult } = renderHook(() => useTransitionInvoice(), { wrapper });
    await act(async () => {
      const r = await transitionResult.current.mutateAsync({ id: 'inv-lifecycle', status: 'submitted' });
      expect(r.status).toBe('submitted');
    });

    // Approve
    await act(async () => {
      const r = await transitionResult.current.mutateAsync({ id: 'inv-lifecycle', status: 'approved' });
      expect(r.status).toBe('approved');
    });

    // Partial payment
    const { result: payResult } = renderHook(() => useRecordPayment(), { wrapper });
    await act(async () => {
      await payResult.current.mutateAsync({ invoiceId: 'inv-lifecycle', amount: 400, date: '2026-02-15' });
    });

    // Remaining payment
    await act(async () => {
      await payResult.current.mutateAsync({ invoiceId: 'inv-lifecycle', amount: 600, date: '2026-02-20' });
    });

    // Verify all API calls were made in order
    expect(mockedApiPost).toHaveBeenCalledTimes(3); // create + 2 payments
    expect(mockedApiPut).toHaveBeenCalledTimes(2); // submit + approve
  });
});
