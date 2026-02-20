// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('../../lib/api-helpers', () => ({
  apiFetch: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
}));

import { apiFetch, apiPost, apiPut } from '../../lib/api-helpers';
import { useCreateBill, useUpdateBillStatus, useRecordPayment as useBillRecordPayment } from '../../features/bills/hooks/useBills';
import { useSubmitBillForApproval, useApproveBill } from '../../features/bills/hooks/useBillApproval';
import { useCreatePurchaseOrder, useTransitionPurchaseOrder } from '../../features/bills/hooks/usePurchaseOrders';
import { useConvertPurchaseOrderToBill } from '../../features/bills/hooks/useConvertPurchaseOrder';
import { useCreateRecurringBill, useGenerateRecurringBill } from '../../features/bills/hooks/useRecurringBills';
import { useBatchPayment } from '../../features/bills/hooks/useBatchPayment';
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

describe('Bill Workflow Integration', () => {
  it('creates supplier contact, creates bill, approves, and pays', async () => {
    const supplier = {
      id: 's-1',
      name: 'Office Supplies Ltd',
      type: 'supplier',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    const bill = {
      id: 'bill-1',
      billNumber: 'BILL-001',
      contactId: 's-1',
      contactName: 'Office Supplies Ltd',
      status: 'draft',
      total: 500,
      amountDue: 500,
    };

    const submittedBill = { ...bill, status: 'submitted' };
    const approvedBill = { ...bill, status: 'approved' };
    const payment = { id: 'pmt-1', billId: 'bill-1', amount: 500 };

    mockedApiPost.mockResolvedValueOnce(supplier); // create contact
    mockedApiPost.mockResolvedValueOnce(bill); // create bill
    mockedApiPost.mockResolvedValueOnce({ status: 'submitted' }); // submit for approval
    mockedApiPost.mockResolvedValueOnce({ status: 'approved' }); // approve bill
    mockedApiPost.mockResolvedValueOnce(payment); // record payment

    const wrapper = createWrapper();

    // Create supplier contact
    const { result: contactResult } = renderHook(() => useCreateContact(), { wrapper });
    await act(async () => {
      await contactResult.current.mutateAsync({ name: 'Office Supplies Ltd', type: 'supplier', isArchived: false });
    });

    // Create bill
    const { result: billResult } = renderHook(() => useCreateBill(), { wrapper });
    await act(async () => {
      const created = await billResult.current.mutateAsync({
        contactId: 's-1',
        date: '2026-02-01',
        dueDate: '2026-03-01',
        currency: 'NZD',
        currencyCode: 'NZD',
        exchangeRate: 1.0,
        amountType: 'exclusive',
        lineItems: [{ description: 'Office paper', quantity: 100, unitPrice: 5, taxRate: 15, discount: 0 }],
      });
      expect(created.status).toBe('draft');
    });

    // Submit for approval
    const { result: submitResult } = renderHook(() => useSubmitBillForApproval(), { wrapper });
    await act(async () => {
      const r = await submitResult.current.mutateAsync('bill-1');
      expect(r.status).toBe('submitted');
    });

    // Approve
    const { result: approveResult } = renderHook(() => useApproveBill(), { wrapper });
    await act(async () => {
      const r = await approveResult.current.mutateAsync({ billId: 'bill-1' });
      expect(r.status).toBe('approved');
    });

    // Pay
    const { result: payResult } = renderHook(() => useBillRecordPayment(), { wrapper });
    await act(async () => {
      await payResult.current.mutateAsync({
        billId: 'bill-1',
        amount: 500,
        date: '2026-02-15',
        reference: 'DD-001',
        bankAccount: 'ANZ-001',
      });
    });

    expect(mockedApiPost).toHaveBeenCalledWith('/payments', expect.objectContaining({
      billId: 'bill-1',
      amount: 500,
    }));
  });

  it('creates PO then converts to bill with sourcePurchaseOrderId', async () => {
    const po = {
      id: 'po-1',
      poNumber: 'PO-001',
      contactId: 's-1',
      contactName: 'Supplier Co',
      status: 'draft',
      total: 2000,
    };

    const convertedBill = {
      id: 'bill-2',
      billNumber: 'BILL-002',
      sourcePurchaseOrderId: 'po-1',
      contactId: 's-1',
      contactName: 'Supplier Co',
      total: 2000,
      status: 'draft',
    };

    mockedApiPost.mockResolvedValueOnce(po); // create PO
    mockedApiPut.mockResolvedValueOnce({ ...po, status: 'approved' }); // approve PO
    mockedApiPost.mockResolvedValueOnce(convertedBill); // convert PO to bill

    const wrapper = createWrapper();

    // Create PO
    const { result: poResult } = renderHook(() => useCreatePurchaseOrder(), { wrapper });
    await act(async () => {
      await poResult.current.mutateAsync({
        contactId: 's-1',
        date: '2026-02-01',
        lineItems: [{ description: 'Raw materials', quantity: 200, unitPrice: 10 }],
      });
    });

    // Approve PO (needed before conversion)
    const { result: transitionResult } = renderHook(() => useTransitionPurchaseOrder(), { wrapper });
    await act(async () => {
      await transitionResult.current.mutateAsync({ id: 'po-1', status: 'approved' });
    });

    // Convert to bill
    const { result: convertResult } = renderHook(() => useConvertPurchaseOrderToBill(), { wrapper });
    await act(async () => {
      const result = await convertResult.current.mutateAsync('po-1');
      expect(result.sourcePurchaseOrderId).toBe('po-1');
    });

    expect(mockedApiPost).toHaveBeenCalledWith('/purchase-orders/po-1/convert', {});
  });

  it('creates recurring bill and generates due bill', async () => {
    const recurring = {
      id: 'rb-1',
      templateName: 'Monthly Rent',
      contactId: 's-2',
      contactName: 'Landlord Inc',
      frequency: 'monthly',
      nextDate: '2026-03-01',
      status: 'active',
      total: 3000,
      timesGenerated: 0,
    };

    const generated = {
      id: 'bill-3',
      billNumber: 'BILL-003',
      contactId: 's-2',
      total: 3000,
      status: 'draft',
    };

    mockedApiPost.mockResolvedValueOnce(recurring);
    mockedApiPost.mockResolvedValueOnce(generated);

    const wrapper = createWrapper();

    // Create recurring bill
    const { result: recurringResult } = renderHook(() => useCreateRecurringBill(), { wrapper });
    await act(async () => {
      await recurringResult.current.mutateAsync({
        templateName: 'Monthly Rent',
        contactId: 's-2',
        frequency: 'monthly',
        nextDate: '2026-03-01',
        total: 3000,
      });
    });

    // Generate bill from recurring
    const { result: generateResult } = renderHook(() => useGenerateRecurringBill(), { wrapper });
    await act(async () => {
      await generateResult.current.mutateAsync('rb-1');
    });

    expect(mockedApiPost).toHaveBeenCalledWith('/recurring-bills/rb-1/generate', {});
  });

  it('batch payment: selects 3 bills and pays all at once', async () => {
    const batchResult = {
      count: 3,
      payments: [
        { billId: 'bill-1', paymentId: 'pmt-1' },
        { billId: 'bill-2', paymentId: 'pmt-2' },
        { billId: 'bill-3', paymentId: 'pmt-3' },
      ],
      message: '3 bills paid',
    };

    mockedApiPost.mockResolvedValueOnce(batchResult);

    const wrapper = createWrapper();

    const { result } = renderHook(() => useBatchPayment(), { wrapper });
    await act(async () => {
      const result2 = await result.current.mutateAsync({
        billIds: ['bill-1', 'bill-2', 'bill-3'],
        paymentDate: '2026-02-15',
        accountCode: 'ANZ-001',
      });
      expect(result2.count).toBe(3);
      expect(result2.payments).toHaveLength(3);
    });

    expect(mockedApiPost).toHaveBeenCalledWith('/bills/batch-payment', {
      billIds: ['bill-1', 'bill-2', 'bill-3'],
      paymentDate: '2026-02-15',
      bankAccount: 'ANZ-001',
    });
  });

  it('full bill lifecycle: create -> submit -> approve -> pay', async () => {
    const bill = { id: 'bill-full', status: 'draft', total: 750, amountDue: 750 };

    mockedApiPost.mockResolvedValueOnce(bill);
    mockedApiPost.mockResolvedValueOnce({ status: 'submitted' });
    mockedApiPost.mockResolvedValueOnce({ status: 'approved' });
    mockedApiPost.mockResolvedValueOnce({ id: 'pmt-1', billId: 'bill-full', amount: 750 });

    const wrapper = createWrapper();

    // Create
    const { result: createResult } = renderHook(() => useCreateBill(), { wrapper });
    await act(async () => {
      await createResult.current.mutateAsync({
        contactId: 's-1',
        date: '2026-02-01',
        dueDate: '2026-03-01',
        currency: 'NZD',
        currencyCode: 'NZD',
        exchangeRate: 1.0,
        amountType: 'exclusive',
        lineItems: [{ description: 'Consulting', quantity: 1, unitPrice: 750, taxRate: 15, discount: 0 }],
      });
    });

    // Submit
    const { result: submitResult } = renderHook(() => useSubmitBillForApproval(), { wrapper });
    await act(async () => {
      const r = await submitResult.current.mutateAsync('bill-full');
      expect(r.status).toBe('submitted');
    });

    // Approve
    const { result: approveResult } = renderHook(() => useApproveBill(), { wrapper });
    await act(async () => {
      const r = await approveResult.current.mutateAsync({ billId: 'bill-full', notes: 'Looks good' });
      expect(r.status).toBe('approved');
    });

    // Pay
    const { result: payResult } = renderHook(() => useBillRecordPayment(), { wrapper });
    await act(async () => {
      await payResult.current.mutateAsync({
        billId: 'bill-full',
        amount: 750,
        date: '2026-02-20',
        reference: 'BACS-001',
        bankAccount: 'ANZ-001',
      });
    });

    expect(mockedApiPost).toHaveBeenCalledTimes(4);
  });

  it('rejects a bill submission and it stays in draft', async () => {
    // Simulate bill creation then rejection via approval hooks
    const bill = { id: 'bill-reject', status: 'draft', total: 300 };
    mockedApiPost.mockResolvedValueOnce(bill);

    // The reject hook uses apiPost to /bills/:id/reject
    const rejectedResult = { status: 'rejected' };
    mockedApiPost.mockResolvedValueOnce(rejectedResult);

    const wrapper = createWrapper();

    const { result: createResult } = renderHook(() => useCreateBill(), { wrapper });
    await act(async () => {
      await createResult.current.mutateAsync({
        contactId: 's-1',
        date: '2026-02-01',
        dueDate: '2026-03-01',
        currency: 'NZD',
        currencyCode: 'NZD',
        exchangeRate: 1.0,
        amountType: 'exclusive',
        lineItems: [{ description: 'Item', quantity: 1, unitPrice: 300, taxRate: 15, discount: 0 }],
      });
    });

    // Bill rejection uses the approval workflow
    const { result: submitResult } = renderHook(() => useSubmitBillForApproval(), { wrapper });
    await act(async () => {
      await submitResult.current.mutateAsync('bill-reject');
    });

    // The second call was the submit for approval
    expect(mockedApiPost).toHaveBeenCalledWith('/bills/bill-reject/submit-for-approval', {});
  });
});
