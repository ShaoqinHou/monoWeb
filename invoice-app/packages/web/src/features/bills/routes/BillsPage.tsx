import { useState, useCallback } from 'react';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { showToast } from '../../dashboard/components/ToastContainer';
import { MoreHorizontal } from 'lucide-react';
import { NotImplemented } from '../../../components/patterns/NotImplemented';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { BillList } from '../components/BillList';
import { BillDetail } from '../components/BillDetail';
import { BillForm } from '../components/BillForm';
import { RecurringBillList } from '../components/RecurringBillList';
import {
  useBills,
  useBill,
  useCreateBill,
  useUpdateBill,
  useUpdateBillStatus,
  useSuppliers,
  useBillPayments,
  useRecordPayment,
  useBulkApproveBills,
  useBulkDeleteBills,
} from '../hooks/useBills';
import { useRecurringBills } from '../hooks/useRecurringBills';
import { useSupplierCreditNotes } from '../hooks/useSupplierCreditNotes';
import { SupplierCreditNoteList } from '../components/SupplierCreditNoteList';
import { useAccounts } from '../../accounting/hooks/useAccounts';
import { useTaxRates } from '../../accounting/hooks/useTaxRates';
import { useCurrencies } from '../../settings/hooks/useCurrencies';
import type { Bill, BillStatusType, BillFormData, RecordPaymentData } from '../types';

// --- Top-level tab type for the BillsPage ---
type BillsPageTab = 'all' | 'draft' | 'awaiting_approval' | 'awaiting_payment' | 'paid' | 'repeating';

const BILLS_PAGE_TABS: { id: BillsPageTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'awaiting_approval', label: 'Awaiting approval' },
  { id: 'awaiting_payment', label: 'Awaiting payment' },
  { id: 'paid', label: 'Paid' },
  { id: 'repeating', label: 'Repeating' },
];

function filterBillsByTab(bills: Bill[], tab: BillsPageTab): Bill[] {
  switch (tab) {
    case 'all':
      return bills;
    case 'draft':
      return bills.filter((b) => b.status === 'draft');
    case 'awaiting_approval':
      return bills.filter((b) => b.status === 'submitted');
    case 'awaiting_payment':
      return bills.filter((b) => b.status === 'approved');
    case 'paid':
      return bills.filter((b) => b.status === 'paid');
    case 'repeating':
      return []; // Repeating tab shows RecurringBillList, not filtered bills
    default:
      return bills;
  }
}

// --- BillsPage (list) ---

export function BillsPage() {
  const { data: bills = [], isLoading: billsLoading } = useBills();
  const { data: recurringBills = [], isLoading: recurringLoading } = useRecurringBills();
  const bulkApproveMutation = useBulkApproveBills();
  const bulkDeleteMutation = useBulkDeleteBills();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<BillsPageTab>('all');
  const [showOverflow, setShowOverflow] = useState(false);

  const handleBillClick = useCallback((bill: Bill) => {
    navigate({ to: '/purchases/bills/$billId', params: { billId: bill.id } });
  }, [navigate]);

  const handleNewBill = useCallback(() => {
    navigate({ to: '/purchases/bills/new' });
  }, [navigate]);

  const handleNewRecurringBill = useCallback(() => {
    navigate({ to: '/purchases/bills/new', search: { type: 'recurring' } });
  }, [navigate]);

  const handleRecurringBillClick = useCallback(
    (id: string) => {
      navigate({ to: '/purchases/bills/$billId', params: { billId: id } });
    },
    [navigate],
  );

  const handleBulkApprove = useCallback(
    (ids: string[]) => {
      bulkApproveMutation.mutate(ids, {
        onSuccess: () => showToast('success', 'Bills approved'),
        onError: (err: Error) => showToast('error', err.message || 'Failed to approve bills'),
      });
    },
    [bulkApproveMutation],
  );

  const handleBulkDelete = useCallback(
    (ids: string[]) => {
      bulkDeleteMutation.mutate(ids, {
        onSuccess: () => showToast('success', 'Bills deleted'),
        onError: (err: Error) => showToast('error', err.message || 'Failed to delete bills'),
      });
    },
    [bulkDeleteMutation],
  );

  const isLoading = activeTab === 'repeating' ? recurringLoading : billsLoading;
  const filteredBills = filterBillsByTab(bills, activeTab);

  // Count for awaiting payment tab
  const awaitingPaymentCount = bills.filter((b) => b.status === 'approved').length;

  return (
    <PageContainer
      title="Bills"
      breadcrumbs={[{ label: 'Purchases overview', href: '/purchases' }]}
      actions={
        <div className="flex items-center gap-2">
          <Button onClick={handleNewBill} data-testid="new-bill-btn">
            New bill
          </Button>
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowOverflow(!showOverflow)}
              data-testid="bills-overflow-menu-btn"
              aria-label="More options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            {showOverflow && (
              <div
                className="absolute right-0 top-full mt-1 w-48 rounded-md border bg-white shadow-lg z-10"
                data-testid="bills-overflow-menu"
              >
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                  onClick={() => { handleNewRecurringBill(); setShowOverflow(false); }}
                  data-testid="bills-overflow-repeating"
                >
                  New Repeating Bill
                </button>
                <NotImplemented label="Import — not yet implemented">
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                    onClick={() => setShowOverflow(false)}
                    data-testid="bills-overflow-import"
                  >
                    Import
                  </button>
                </NotImplemented>
              </div>
            )}
          </div>
        </div>
      }
    >
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex gap-0 -mb-px" data-testid="bills-page-tabs" role="menubar">
          {BILLS_PAGE_TABS.map((tab) => {
            const showCount = tab.id === 'awaiting_payment' && awaitingPaymentCount > 0;
            return (
              <button
                key={tab.id}
                type="button"
                role="menuitem"
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab(tab.id)}
                data-testid={`bills-tab-${tab.id}`}
              >
                {tab.label}{showCount ? ` (${awaitingPaymentCount})` : ''}
              </button>
            );
          })}
        </nav>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-500" data-testid="bills-loading">
          Loading bills...
        </div>
      ) : activeTab === 'repeating' ? (
        <RecurringBillList
          items={recurringBills}
          onItemClick={handleRecurringBillClick}
          isLoading={recurringLoading}
          onNewRecurringBill={handleNewRecurringBill}
        />
      ) : (
        <BillList
          bills={filteredBills}
          onBillClick={handleBillClick}
          onBulkApprove={handleBulkApprove}
          onBulkDelete={handleBulkDelete}
          bulkApproveLoading={bulkApproveMutation.isPending}
          bulkDeleteLoading={bulkDeleteMutation.isPending}
        />
      )}
    </PageContainer>
  );
}

// --- BillDetailPage ---

interface BillDetailPageProps {
  billId?: string;
}

export function BillDetailPage({ billId: billIdProp }: BillDetailPageProps) {
  const routeParams = useSafeBillParams();
  const billId = billIdProp ?? routeParams ?? '';
  const { data: bill, isLoading } = useBill(billId);
  const { data: payments = [] } = useBillPayments(billId);
  const { data: suppliers = [] } = useSuppliers();
  const statusMutation = useUpdateBillStatus();
  const paymentMutation = useRecordPayment();
  const updateMutation = useUpdateBill();
  const navigate = useNavigate();
  const { data: accountsRaw = [] } = useAccounts();
  const accountOptions = accountsRaw.map(a => ({ value: a.code, label: `${a.code} - ${a.name}` }));
  const { data: taxRatesRaw = [] } = useTaxRates();
  const taxRateOptions = taxRatesRaw.map(tr => ({ value: String(tr.rate), label: tr.name }));
  const { data: currenciesRaw = [] } = useCurrencies();
  const currencyOptions = currenciesRaw.map(c => ({ value: c.code, label: `${c.code} - ${c.name}`, rate: c.rate }));

  // Inline edit mode — toggled via Edit button or ?edit=true search param
  const searchParams = useSafeSearch();
  const [isEditing, setIsEditing] = useState(searchParams?.edit === 'true');

  const handleStatusChange = useCallback(
    (newStatus: BillStatusType) => {
      if (!billId) return;
      statusMutation.mutate({ id: billId, status: newStatus }, {
        onSuccess: () => showToast('success', `Bill ${newStatus}`),
        onError: (err: Error) => showToast('error', err.message || 'Failed to update status'),
      });
    },
    [billId, statusMutation],
  );

  const handleRecordPayment = useCallback(
    (data: RecordPaymentData) => {
      paymentMutation.mutate(data, {
        onSuccess: () => showToast('success', 'Payment recorded'),
        onError: (err: Error) => showToast('error', err.message || 'Failed to record payment'),
      });
    },
    [paymentMutation],
  );

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleSaveEdit = useCallback(
    (data: BillFormData) => {
      updateMutation.mutate(
        {
          id: billId,
          data: {
            contactId: data.contactId,
            reference: data.reference || undefined,
            amountType: data.amountType,
            currency: data.currency,
            date: data.date,
            dueDate: data.dueDate,
            lineItems: data.lineItems.map((li) => ({
              description: li.description,
              quantity: li.quantity,
              unitPrice: li.unitPrice,
              accountCode: li.accountCode || undefined,
              taxRate: li.taxRate,
              discount: li.discount,
            })),
          },
        },
        {
          onSuccess: () => {
            showToast('success', 'Bill saved');
            setIsEditing(false);
          },
          onError: (error: Error) => {
            showToast('error', error.message || 'Failed to save bill');
          },
        },
      );
    },
    [billId, updateMutation],
  );

  if (isLoading) {
    return (
      <PageContainer title="Bill" breadcrumbs={[{ label: 'Bills', href: '/purchases/bills' }]}>
        <div className="py-12 text-center text-gray-500" data-testid="bill-loading">
          Loading bill...
        </div>
      </PageContainer>
    );
  }

  if (!bill) {
    return (
      <PageContainer title="Bill" breadcrumbs={[{ label: 'Bills', href: '/purchases/bills' }]}>
        <div className="py-12 text-center text-gray-500" data-testid="bill-not-found">
          Bill not found.
        </div>
      </PageContainer>
    );
  }

  // Inline edit mode
  if (isEditing) {
    const initialData: Partial<BillFormData> = {
      contactId: bill.contactId,
      reference: bill.reference ?? '',
      amountType: bill.amountType as 'exclusive' | 'inclusive' | 'no_tax',
      currency: bill.currency,
      date: bill.date,
      dueDate: bill.dueDate,
      lineItems: bill.lineItems.map((li) => ({
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        accountCode: li.accountCode ?? '',
        taxRate: li.taxRate,
        discount: li.discount,
      })),
    };

    return (
      <PageContainer
        title="Edit Bill"
        breadcrumbs={[
          { label: 'Bills', href: '/purchases/bills' },
          { label: bill.billNumber ?? billId },
          { label: 'Edit' },
        ]}
        actions={
          <Button
            variant="outline"
            onClick={handleCancelEdit}
            data-testid="bill-cancel-edit-btn"
          >
            Cancel
          </Button>
        }
      >
        <BillForm
          suppliers={suppliers}
          initialData={initialData}
          onSave={(data) => handleSaveEdit(data)}
          loading={updateMutation.isPending}
          accountOptions={accountOptions}
          taxRateOptions={taxRateOptions}
          currencyOptions={currencyOptions}
          onCreateNewSupplier={() => navigate({ to: '/contacts/new' })}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={bill.billNumber ?? 'Bill'}
      breadcrumbs={[
        { label: 'Bills', href: '/purchases/bills' },
        { label: bill.billNumber ?? billId },
      ]}
    >
      <BillDetail
        bill={bill}
        payments={payments}
        onStatusChange={handleStatusChange}
        onRecordPayment={handleRecordPayment}
        onEdit={handleEdit}
        loading={statusMutation.isPending}
        paymentLoading={paymentMutation.isPending}
      />
    </PageContainer>
  );
}

// --- BillCreatePage ---

export function BillCreatePage() {
  const { data: suppliers = [] } = useSuppliers();
  const createMutation = useCreateBill();
  const navigate = useNavigate();
  const { data: accountsRaw = [] } = useAccounts();
  const accountOptions = accountsRaw.map(a => ({ value: a.code, label: `${a.code} - ${a.name}` }));
  const { data: taxRatesRaw = [] } = useTaxRates();
  const taxRateOptions = taxRatesRaw.map(tr => ({ value: String(tr.rate), label: tr.name }));
  const { data: currenciesRaw = [] } = useCurrencies();
  const currencyOptions = currenciesRaw.map(c => ({ value: c.code, label: `${c.code} - ${c.name}`, rate: c.rate }));

  const handleSave = useCallback(
    (data: BillFormData, action: 'draft' | 'submit') => {
      const payload = {
        contactId: data.contactId,
        reference: data.reference || undefined,
        amountType: data.amountType,
        currency: data.currency,
        currencyCode: data.currency,
        exchangeRate: data.exchangeRate ?? 1.0,
        date: data.date,
        dueDate: data.dueDate,
        lineItems: data.lineItems.map((li) => ({
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          accountCode: li.accountCode || undefined,
          taxRate: li.taxRate,
          discount: li.discount,
        })),
      };

      createMutation.mutate(payload, {
        onSuccess: () => {
          showToast('success', 'Bill created');
          if (action === 'submit') {
            // TODO: also transition to submitted
          }
          navigate({ to: '/purchases/bills' });
        },
        onError: (error: Error) => {
          showToast('error', error.message || 'Failed to create bill');
        },
      });
    },
    [createMutation, navigate],
  );

  return (
    <PageContainer
      title="New Bill"
      breadcrumbs={[
        { label: 'Bills', href: '/purchases/bills' },
        { label: 'New Bill' },
      ]}
    >
      <BillForm
        suppliers={suppliers}
        onSave={handleSave}
        loading={createMutation.isPending}
        accountOptions={accountOptions}
        taxRateOptions={taxRateOptions}
        currencyOptions={currencyOptions}
        onCreateNewSupplier={() => navigate({ to: '/contacts/new' })}
      />
    </PageContainer>
  );
}

// Helper to safely extract billId from route params (may not exist if rendered outside router)
function useSafeBillParams(): string | undefined {
  try {
    const params = useParams({ from: '/purchases/bills/$billId' });
    return params.billId;
  } catch {
    return undefined;
  }
}

// Helper to safely extract search params
function useSafeSearch(): Record<string, string> | undefined {
  try {
    const search = useSearch({ from: '/purchases/bills/$billId' });
    return search as Record<string, string>;
  } catch {
    return undefined;
  }
}

/* ════════════════════════════════════════════
   Placeholder pages for purchases sub-routes
   (PurchaseOrdersPage and RecurringBillsPage
   have been moved to their own route files.)
   ════════════════════════════════════════════ */

export function PurchaseCreditNotesPage() {
  const { data: creditNotes = [], isLoading } = useSupplierCreditNotes();
  const navigate = useNavigate();

  const handleCreditNoteClick = useCallback((_id: string) => {
    // TODO: Wire when credit-note detail route is added
    navigate({ to: '/purchases' });
  }, [navigate]);

  const handleNewCreditNote = useCallback(() => {
    // TODO: Wire when credit-note create route is added
    navigate({ to: '/purchases' });
  }, [navigate]);

  return (
    <PageContainer
      title="Credit Notes"
      breadcrumbs={[{ label: 'Purchases', href: '/purchases' }, { label: 'Credit Notes' }]}
      actions={
        <Button onClick={handleNewCreditNote} data-testid="new-credit-note-btn">
          New Credit Note
        </Button>
      }
    >
      {isLoading ? (
        <div className="py-12 text-center text-gray-500" data-testid="purchase-credit-notes-loading">
          Loading credit notes...
        </div>
      ) : (
        <SupplierCreditNoteList
          creditNotes={creditNotes}
          onSelect={handleCreditNoteClick}
          onNewCreditNote={handleNewCreditNote}
        />
      )}
    </PageContainer>
  );
}
