// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import {
  useContacts,
  useContact,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
  useContactInvoices,
  useContactBills,
  useContactActivity,
  useContactFinancialSummary,
} from '../hooks/useContacts';

const MOCK_CONTACTS = [
  {
    id: 'c1',
    name: 'Acme Corp',
    type: 'customer',
    email: 'acme@test.com',
    phone: '555-0100',
    outstandingBalance: 500,
    overdueBalance: 0,
    isArchived: false,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'c2',
    name: 'Bay Supplies',
    type: 'supplier',
    email: 'bay@test.com',
    phone: '555-0200',
    outstandingBalance: 0,
    overdueBalance: 0,
    isArchived: false,
    createdAt: '2025-02-01T00:00:00.000Z',
    updatedAt: '2025-02-01T00:00:00.000Z',
  },
];

function mockFetchSuccess(data: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ ok: true, data }),
  } as Response);
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useContacts hooks', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('useContacts', () => {
    it('fetches contacts list from /api/contacts', async () => {
      globalThis.fetch = mockFetchSuccess(MOCK_CONTACTS);

      const { result } = renderHook(() => useContacts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/contacts',
        expect.objectContaining({ headers: expect.any(Object) }),
      );
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data![0].name).toBe('Acme Corp');
    });

    it('filters contacts by search term client-side', async () => {
      globalThis.fetch = mockFetchSuccess(MOCK_CONTACTS);

      const { result } = renderHook(
        () => useContacts({ search: 'acme' }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data![0].name).toBe('Acme Corp');
    });

    it('filters contacts by type client-side', async () => {
      globalThis.fetch = mockFetchSuccess(MOCK_CONTACTS);

      const { result } = renderHook(
        () => useContacts({ type: 'supplier' }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data![0].name).toBe('Bay Supplies');
    });

    it('filters contacts by phone number', async () => {
      globalThis.fetch = mockFetchSuccess(MOCK_CONTACTS);

      const { result } = renderHook(
        () => useContacts({ search: '555-0200' }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data![0].name).toBe('Bay Supplies');
    });
  });

  describe('useContact', () => {
    it('fetches a single contact by id from /api/contacts/:id', async () => {
      globalThis.fetch = mockFetchSuccess(MOCK_CONTACTS[0]);

      const { result } = renderHook(() => useContact('c1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/contacts/c1',
        expect.objectContaining({ headers: expect.any(Object) }),
      );
      expect(result.current.data!.name).toBe('Acme Corp');
    });

    it('does not fetch when id is empty', () => {
      globalThis.fetch = mockFetchSuccess(null);

      const { result } = renderHook(() => useContact(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });
  });

  describe('useCreateContact', () => {
    it('posts to /api/contacts', async () => {
      const newContact = { ...MOCK_CONTACTS[0], id: 'c3', name: 'New Contact' };
      globalThis.fetch = mockFetchSuccess(newContact);

      const { result } = renderHook(() => useCreateContact(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        name: 'New Contact',
        type: 'customer',
        isArchived: false,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/contacts',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"name":"New Contact"'),
        }),
      );
    });
  });

  describe('useUpdateContact', () => {
    it('puts to /api/contacts/:id', async () => {
      const updated = { ...MOCK_CONTACTS[0], name: 'Updated' };
      globalThis.fetch = mockFetchSuccess(updated);

      const { result } = renderHook(() => useUpdateContact(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: 'c1', data: { name: 'Updated' } });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/contacts/c1',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"name":"Updated"'),
        }),
      );
    });
  });

  describe('useDeleteContact', () => {
    it('deletes at /api/contacts/:id', async () => {
      globalThis.fetch = mockFetchSuccess({ id: 'c1' });

      const { result } = renderHook(() => useDeleteContact(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('c1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/contacts/c1',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('useContactInvoices', () => {
    const MOCK_INVOICES = [
      {
        id: 'inv-1',
        invoiceNumber: 'INV-001',
        contactId: 'c1',
        contactName: 'Acme Corp',
        status: 'approved',
        amountType: 'exclusive',
        currency: 'NZD',
        date: '2025-07-15',
        dueDate: '2025-08-15',
        lineItems: [],
        subTotal: 500,
        totalTax: 75,
        total: 575,
        amountDue: 575,
        amountPaid: 0,
        createdAt: '2025-07-15T10:00:00.000Z',
        updatedAt: '2025-07-15T10:00:00.000Z',
      },
      {
        id: 'inv-2',
        invoiceNumber: 'INV-002',
        contactId: 'other-contact',
        contactName: 'Other',
        status: 'paid',
        amountType: 'exclusive',
        currency: 'NZD',
        date: '2025-06-01',
        dueDate: '2025-07-01',
        lineItems: [],
        subTotal: 1000,
        totalTax: 150,
        total: 1150,
        amountDue: 0,
        amountPaid: 1150,
        createdAt: '2025-06-01T10:00:00.000Z',
        updatedAt: '2025-07-01T10:00:00.000Z',
      },
    ];

    it('fetches invoices and filters by contactId', async () => {
      globalThis.fetch = mockFetchSuccess(MOCK_INVOICES);

      const { result } = renderHook(() => useContactInvoices('c1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/invoices',
        expect.objectContaining({ headers: expect.any(Object) }),
      );
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data![0].invoiceNumber).toBe('INV-001');
    });
  });

  describe('useContactBills', () => {
    const MOCK_BILLS = [
      {
        id: 'bill-1',
        billNumber: 'BILL-001',
        contactId: 'c1',
        contactName: 'Acme Corp',
        status: 'paid',
        amountType: 'exclusive',
        currency: 'NZD',
        date: '2025-05-10',
        dueDate: '2025-06-10',
        lineItems: [],
        subTotal: 350,
        totalTax: 52.5,
        total: 402.5,
        amountDue: 0,
        amountPaid: 402.5,
        createdAt: '2025-05-10T08:00:00.000Z',
        updatedAt: '2025-06-10T08:00:00.000Z',
      },
      {
        id: 'bill-2',
        billNumber: 'BILL-002',
        contactId: 'other',
        contactName: 'Other',
        status: 'draft',
        amountType: 'exclusive',
        currency: 'NZD',
        date: '2025-06-01',
        dueDate: '2025-07-01',
        lineItems: [],
        subTotal: 200,
        totalTax: 30,
        total: 230,
        amountDue: 230,
        amountPaid: 0,
        createdAt: '2025-06-01T10:00:00.000Z',
        updatedAt: '2025-06-01T10:00:00.000Z',
      },
    ];

    it('fetches bills and filters by contactId', async () => {
      globalThis.fetch = mockFetchSuccess(MOCK_BILLS);

      const { result } = renderHook(() => useContactBills('c1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/bills',
        expect.objectContaining({ headers: expect.any(Object) }),
      );
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data![0].billNumber).toBe('BILL-001');
    });
  });

  describe('useContactActivity', () => {
    it('combines invoices and bills into a sorted activity timeline', async () => {
      const INVOICES = [
        {
          id: 'inv-1',
          invoiceNumber: 'INV-001',
          contactId: 'c1',
          contactName: 'Acme Corp',
          status: 'paid',
          amountType: 'exclusive',
          currency: 'NZD',
          date: '2025-07-15',
          dueDate: '2025-08-15',
          lineItems: [],
          subTotal: 500,
          totalTax: 75,
          total: 575,
          amountDue: 0,
          amountPaid: 575,
          createdAt: '2025-07-15T10:00:00.000Z',
          updatedAt: '2025-07-15T10:00:00.000Z',
        },
      ];
      const BILLS = [
        {
          id: 'bill-1',
          billNumber: 'BILL-001',
          contactId: 'c1',
          contactName: 'Acme Corp',
          status: 'paid',
          amountType: 'exclusive',
          currency: 'NZD',
          date: '2025-08-01',
          dueDate: '2025-09-01',
          lineItems: [],
          subTotal: 200,
          totalTax: 30,
          total: 230,
          amountDue: 0,
          amountPaid: 230,
          createdAt: '2025-08-01T10:00:00.000Z',
          updatedAt: '2025-08-01T10:00:00.000Z',
        },
      ];

      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (url === '/api/invoices') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ ok: true, data: INVOICES }),
          } as Response);
        }
        if (url === '/api/bills') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ ok: true, data: BILLS }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, data: [] }),
        } as Response);
      });

      const { result } = renderHook(() => useContactActivity('c1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.data).toHaveLength(2);
      // Bill (Aug 1) should be before Invoice (Jul 15) — sorted descending
      expect(result.current.data[0].type).toBe('bill');
      expect(result.current.data[1].type).toBe('invoice');
    });
  });

  describe('useContactFinancialSummary', () => {
    it('computes totalInvoiced, totalBilled, outstanding, and overdue', async () => {
      const INVOICES = [
        {
          id: 'inv-1',
          invoiceNumber: 'INV-001',
          contactId: 'c1',
          contactName: 'Acme',
          status: 'approved',
          amountType: 'exclusive',
          currency: 'NZD',
          date: '2025-01-01',
          dueDate: '2024-12-01', // past due
          lineItems: [],
          subTotal: 500,
          totalTax: 75,
          total: 575,
          amountDue: 575,
          amountPaid: 0,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
        {
          id: 'inv-2',
          invoiceNumber: 'INV-002',
          contactId: 'c1',
          contactName: 'Acme',
          status: 'paid',
          amountType: 'exclusive',
          currency: 'NZD',
          date: '2025-06-01',
          dueDate: '2025-07-01',
          lineItems: [],
          subTotal: 1000,
          totalTax: 150,
          total: 1150,
          amountDue: 0,
          amountPaid: 1150,
          createdAt: '2025-06-01T00:00:00.000Z',
          updatedAt: '2025-06-01T00:00:00.000Z',
        },
      ];
      const BILLS = [
        {
          id: 'bill-1',
          billNumber: 'BILL-001',
          contactId: 'c1',
          contactName: 'Acme',
          status: 'paid',
          amountType: 'exclusive',
          currency: 'NZD',
          date: '2025-05-10',
          dueDate: '2025-06-10',
          lineItems: [],
          subTotal: 350,
          totalTax: 52.5,
          total: 402.5,
          amountDue: 0,
          amountPaid: 402.5,
          createdAt: '2025-05-10T00:00:00.000Z',
          updatedAt: '2025-05-10T00:00:00.000Z',
        },
      ];

      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (url === '/api/invoices') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ ok: true, data: INVOICES }),
          } as Response);
        }
        if (url === '/api/bills') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ ok: true, data: BILLS }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, data: [] }),
        } as Response);
      });

      const { result } = renderHook(() => useContactFinancialSummary('c1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // totalInvoiced = 575 + 1150 = 1725
      expect(result.current.data.totalInvoiced).toBe(1725);
      // totalBilled = 402.5
      expect(result.current.data.totalBilled).toBe(402.5);
      // outstanding = only INV-001 (approved, amountDue=575)
      expect(result.current.data.outstanding).toBe(575);
      // overdue = INV-001 is past due
      expect(result.current.data.overdue).toBe(575);
      expect(result.current.data.overdueCount).toBe(1);
    });
  });
});
