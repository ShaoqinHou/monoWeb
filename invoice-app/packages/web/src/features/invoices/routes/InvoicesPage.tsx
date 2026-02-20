import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Pagination } from '../../../components/patterns/Pagination';
import { usePagination } from '../../../lib/usePagination';
import { InvoiceStatusTabs } from '../components/InvoiceStatusTabs';
import { InvoiceList, type BulkActionType } from '../components/InvoiceList';
import { InvoiceDetail } from '../components/InvoiceDetail';
import { InvoiceForm } from '../components/InvoiceForm';
import { RecurringInvoiceList } from '../components/RecurringInvoiceList';
import { CreditNoteList } from '../components/CreditNoteList';
import {
  useInvoices,
  useInvoice,
  useCreateInvoice,
  useUpdateInvoice,
  useTransitionInvoice,
  useRecordPayment,
} from '../hooks/useInvoices';
import { useRecurringInvoices } from '../hooks/useRecurringInvoices';
import { useCreditNotes } from '../hooks/useCreditNotes';
import { useContacts } from '../../contacts/hooks/useContacts';
import { useAccounts } from '../../accounting/hooks/useAccounts';
import { useProjects } from '../../projects/hooks/useProjects';
import { useCurrencies } from '../../settings/hooks/useCurrencies';
import { useTrackingCategories } from '../../accounting/hooks/useTrackingCategories';
import { Plus, Search, ChevronDown, Upload, Download, Mail, Bell, CreditCard } from 'lucide-react';
import { NotImplemented } from '../../../components/patterns/NotImplemented';
import { showToast } from '../../dashboard/components/ToastContainer';
import { apiPut } from '../../../lib/api-helpers';
import { useTaxRates } from '../../accounting/hooks/useTaxRates';
import { useProductList } from '../hooks/useProductList';
import { canReceivePayment } from '@xero-replica/shared';
import type { Invoice, InvoiceStatusType, InvoiceFormData, RecurringSchedule } from '../types';

/* ════════════════════════════════════════════
   EXTRA_TABS — Repeating tab added to the invoice status tabs
   (Credit Notes are shown inline in All/Paid tabs per Xero's design)
   ════════════════════════════════════════════ */
const EXTRA_TABS = [
  { id: 'repeating', label: 'Repeating' },
];

/* ════════════════════════════════════════════
   InvoicesPage — List of all invoices with Repeating & Credit Notes tabs
   ════════════════════════════════════════════ */
export function InvoicesPage() {
  const { data: invoices = [], isLoading } = useInvoices();
  const { data: recurringItems = [], isLoading: isRecurringLoading } = useRecurringInvoices();
  const { data: creditNotes = [], isLoading: isCreditNotesLoading } = useCreditNotes();
  const transitionMutation = useTransitionInvoice();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advNumber, setAdvNumber] = useState('');
  const [advContact, setAdvContact] = useState('');
  const [advAmount, setAdvAmount] = useState('');
  const [advStartDate, setAdvStartDate] = useState('');
  const [advEndDate, setAdvEndDate] = useState('');
  const [advUnsentOnly, setAdvUnsentOnly] = useState(false);
  const [advIncludeDeleted, setAdvIncludeDeleted] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const navigate = useNavigate();

  // Client-side recurring schedules (stored locally, API can ignore for now)
  const [recurringMap] = useState<Map<string, RecurringSchedule>>(new Map());
  // Client-side credit note tracking
  const [creditNoteIds] = useState<Set<string>>(new Set());

  const filteredBySearch = useMemo(() => {
    if (!search.trim()) return invoices;
    const q = search.toLowerCase();
    return invoices.filter(
      (inv) =>
        inv.invoiceNumber?.toLowerCase().includes(q) ||
        inv.contactName.toLowerCase().includes(q) ||
        inv.reference?.toLowerCase().includes(q),
    );
  }, [invoices, search]);

  const handleInvoiceClick = (id: string) => {
    navigate({ to: '/sales/invoices/$invoiceId', params: { invoiceId: id } });
  };

  const handleRecurringItemClick = (id: string) => {
    // Navigate to a detail view — for now go back to invoices with the item selected
    // Once recurring detail routes exist under /sales/invoices, update this
    navigate({ to: '/sales/invoices/$invoiceId', params: { invoiceId: id } });
  };

  const handleCreditNoteClick = (id: string) => {
    // Navigate to a detail view — for now go to invoices detail
    navigate({ to: '/sales/invoices/$invoiceId', params: { invoiceId: id } });
  };

  const handleNewInvoice = () => {
    navigate({ to: '/sales/invoices/new' });
  };

  const handleNewRecurringInvoice = () => {
    navigate({ to: '/sales/invoices/new', search: { type: 'recurring' } });
    setShowNewMenu(false);
  };

  const handleNewCreditNote = () => {
    navigate({ to: '/sales/invoices/new', search: { type: 'credit-note' } });
    setShowNewMenu(false);
  };

  const handleBulkAction = useCallback(
    (action: BulkActionType, ids: string[]) => {
      if (action === 'approve') {
        for (const id of ids) {
          transitionMutation.mutate(
            { id, status: 'approved' },
            {
              onError: (err: Error) => showToast('error', err.message || 'Failed to approve invoice'),
            },
          );
        }
        showToast('success', `${ids.length} invoice${ids.length !== 1 ? 's' : ''} approved`);
      } else if (action === 'delete') {
        for (const id of ids) {
          transitionMutation.mutate(
            { id, status: 'voided' },
            {
              onError: (err: Error) => showToast('error', err.message || 'Failed to void invoice'),
            },
          );
        }
        showToast('success', `${ids.length} invoice${ids.length !== 1 ? 's' : ''} voided`);
      }
      // 'send' is a mock — just log for now
      if (action === 'send') {
        // Mock send: in production this would email the invoices
        showToast('success', `${ids.length} invoice${ids.length !== 1 ? 's' : ''} sent`);
      }
    },
    [transitionMutation],
  );

  /* ─── Extra tab content (Repeating / Credit Notes) ─── */
  const extraTabContent = useMemo(() => {
    if (activeTab === 'repeating') {
      return (
        <RecurringInvoiceList
          items={recurringItems}
          onItemClick={handleRecurringItemClick}
          isLoading={isRecurringLoading}
        />
      );
    }
    if (activeTab === 'credit-notes') {
      return (
        <CreditNoteList
          creditNotes={creditNotes}
          onCreditNoteClick={handleCreditNoteClick}
          isLoading={isCreditNotesLoading}
        />
      );
    }
    return null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, recurringItems, creditNotes, isRecurringLoading, isCreditNotesLoading]);

  return (
    <PageContainer
      title="Invoices"
      breadcrumbs={[{ label: 'Sales overview', href: '/sales' }, { label: 'Invoices' }]}
      actions={
        <div className="relative flex items-center gap-2">
          <Button onClick={handleNewInvoice} data-testid="new-invoice-button">
            <Plus className="h-4 w-4 mr-1" />
            New Invoice
          </Button>
          <NotImplemented label="Send Statements — not yet implemented">
            <Button variant="outline" onClick={() => {}} data-testid="send-statements-button">
              <Mail className="h-4 w-4 mr-1" />
              Send Statements
            </Button>
          </NotImplemented>
          <NotImplemented label="Import — not yet implemented">
            <Button variant="outline" onClick={() => {}} data-testid="import-invoices-button">
              <Upload className="h-4 w-4 mr-1" />
              Import
            </Button>
          </NotImplemented>
          <NotImplemented label="Export — not yet implemented">
            <Button variant="outline" onClick={() => {}} data-testid="export-invoices-button">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </NotImplemented>
          <Button
            variant="outline"
            onClick={() => setRemindersEnabled((v) => !v)}
            data-testid="invoice-reminders-toggle"
          >
            <Bell className="h-4 w-4 mr-1" />
            {remindersEnabled ? 'Reminders On' : 'Reminders Off'}
          </Button>
          <NotImplemented label="Online Payments — not yet implemented">
            <Button variant="outline" onClick={() => {}} data-testid="online-payments-button">
              <CreditCard className="h-4 w-4 mr-1" />
              Online Payments
            </Button>
          </NotImplemented>
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowNewMenu((prev) => !prev)}
              data-testid="new-menu-button"
              aria-label="More new options"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            {showNewMenu && (
              <div
                className="absolute right-0 top-full mt-1 w-56 rounded-md border border-gray-200 bg-white py-1 shadow-lg z-50"
                data-testid="new-menu-dropdown"
              >
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                  onClick={handleNewRecurringInvoice}
                  data-testid="new-recurring-invoice-button"
                >
                  New Repeating Invoice
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                  onClick={handleNewCreditNote}
                  data-testid="new-credit-note-button"
                >
                  New Credit Note
                </button>
              </div>
            )}
          </div>
        </div>
      }
    >
      {isLoading ? (
        <div className="py-12 text-center text-gray-500" data-testid="invoices-loading">
          Loading invoices...
        </div>
      ) : (
        <div className="space-y-4">
          <InvoiceStatusTabs
            invoices={filteredBySearch}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            extraTabs={EXTRA_TABS}
            extraTabContent={extraTabContent}
          >
            {(tabInvoices: Invoice[]) => (
              <InvoiceListWithPagination
                tabInvoices={tabInvoices}
                search={search}
                onSearchChange={setSearch}
                showAdvancedSearch={showAdvancedSearch}
                onToggleAdvanced={() => setShowAdvancedSearch((v) => !v)}
                advNumber={advNumber}
                onAdvNumberChange={setAdvNumber}
                advContact={advContact}
                onAdvContactChange={setAdvContact}
                advAmount={advAmount}
                onAdvAmountChange={setAdvAmount}
                advStartDate={advStartDate}
                onAdvStartDateChange={setAdvStartDate}
                advEndDate={advEndDate}
                onAdvEndDateChange={setAdvEndDate}
                advUnsentOnly={advUnsentOnly}
                onAdvUnsentOnlyChange={setAdvUnsentOnly}
                advIncludeDeleted={advIncludeDeleted}
                onAdvIncludeDeletedChange={setAdvIncludeDeleted}
                onInvoiceClick={handleInvoiceClick}
                recurringMap={recurringMap}
                creditNoteIds={creditNoteIds}
                onBulkAction={handleBulkAction}
              />
            )}
          </InvoiceStatusTabs>
        </div>
      )}
    </PageContainer>
  );
}

/* ════════════════════════════════════════════
   InvoiceListWithPagination — Search + Advanced Search + Paginated list
   ════════════════════════════════════════════ */
interface InvoiceListPaginatedProps {
  tabInvoices: Invoice[];
  search: string;
  onSearchChange: (v: string) => void;
  showAdvancedSearch: boolean;
  onToggleAdvanced: () => void;
  advNumber: string;
  onAdvNumberChange: (v: string) => void;
  advContact: string;
  onAdvContactChange: (v: string) => void;
  advAmount: string;
  onAdvAmountChange: (v: string) => void;
  advStartDate: string;
  onAdvStartDateChange: (v: string) => void;
  advEndDate: string;
  onAdvEndDateChange: (v: string) => void;
  advUnsentOnly: boolean;
  onAdvUnsentOnlyChange: (v: boolean) => void;
  advIncludeDeleted: boolean;
  onAdvIncludeDeletedChange: (v: boolean) => void;
  onInvoiceClick: (id: string) => void;
  recurringMap: Map<string, RecurringSchedule>;
  creditNoteIds: Set<string>;
  onBulkAction: (action: BulkActionType, ids: string[]) => void;
}

function InvoiceListWithPagination({
  tabInvoices,
  search,
  onSearchChange,
  showAdvancedSearch,
  onToggleAdvanced,
  advNumber,
  onAdvNumberChange,
  advContact,
  onAdvContactChange,
  advAmount,
  onAdvAmountChange,
  advStartDate,
  onAdvStartDateChange,
  advEndDate,
  onAdvEndDateChange,
  advUnsentOnly,
  onAdvUnsentOnlyChange,
  advIncludeDeleted,
  onAdvIncludeDeletedChange,
  onInvoiceClick,
  recurringMap,
  creditNoteIds,
  onBulkAction,
}: InvoiceListPaginatedProps) {
  const { page, pageSize, total, pageData, onChange } = usePagination(tabInvoices);

  return (
    <>
      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={advStartDate}
            onChange={(e) => onAdvStartDateChange(e.target.value)}
            data-testid="filter-start-date"
            className="w-40"
            aria-label="Start Date"
          />
          <Input
            type="date"
            value={advEndDate}
            onChange={(e) => onAdvEndDateChange(e.target.value)}
            data-testid="filter-end-date"
            className="w-40"
            aria-label="End Date"
          />
          <Input
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            startIcon={<Search className="h-4 w-4" />}
            data-testid="search-invoices"
            className="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleAdvanced}
            data-testid="toggle-advanced-search"
          >
            {showAdvancedSearch ? 'Hide Filters' : 'Advanced Search'}
          </Button>
        </div>
        {showAdvancedSearch && (
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4 space-y-3" data-testid="advanced-search-panel">
            <div className="grid grid-cols-4 gap-3">
              <Input
                label="Number / Reference"
                value={advNumber}
                onChange={(e) => onAdvNumberChange(e.target.value)}
                placeholder="INV-0001"
                data-testid="adv-number"
              />
              <Input
                label="Contact"
                value={advContact}
                onChange={(e) => onAdvContactChange(e.target.value)}
                placeholder="Contact name"
                data-testid="adv-contact"
              />
              <Input
                label="Amount"
                type="number"
                value={advAmount}
                onChange={(e) => onAdvAmountChange(e.target.value)}
                placeholder="0.00"
                data-testid="adv-amount"
              />
              <div />
            </div>
            <div className="grid grid-cols-4 gap-3">
              <Input
                label="Start Date"
                type="date"
                value={advStartDate}
                onChange={(e) => onAdvStartDateChange(e.target.value)}
                data-testid="adv-start-date"
              />
              <Input
                label="End Date"
                type="date"
                value={advEndDate}
                onChange={(e) => onAdvEndDateChange(e.target.value)}
                data-testid="adv-end-date"
              />
              <label className="flex items-center gap-2 pt-6 text-sm" data-testid="adv-unsent-only">
                <input
                  type="checkbox"
                  checked={advUnsentOnly}
                  onChange={(e) => onAdvUnsentOnlyChange(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Unsent Only
              </label>
              <label className="flex items-center gap-2 pt-6 text-sm" data-testid="adv-include-deleted">
                <input
                  type="checkbox"
                  checked={advIncludeDeleted}
                  onChange={(e) => onAdvIncludeDeletedChange(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Include Deleted &amp; Voided
              </label>
            </div>
          </div>
        )}
      </div>
      <InvoiceList
        invoices={pageData}
        onInvoiceClick={onInvoiceClick}
        recurringMap={recurringMap}
        creditNoteIds={creditNoteIds}
        onBulkAction={onBulkAction}
      />
      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onChange={onChange}
        className="mt-4"
      />
    </>
  );
}

/* ════════════════════════════════════════════
   InvoiceDetailPage — View a single invoice
   ════════════════════════════════════════════ */
export function InvoiceDetailPage() {
  const { invoiceId } = useParams({ from: '/sales/invoices/$invoiceId' });
  const navigate = useNavigate();
  const { data: invoice, isLoading } = useInvoice(invoiceId);
  const transitionMutation = useTransitionInvoice();
  const paymentMutation = useRecordPayment();
  const createMutation = useCreateInvoice();

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentReference, setPaymentReference] = useState('');

  const handleTransition = (newStatus: InvoiceStatusType) => {
    transitionMutation.mutate(
      { id: invoiceId, status: newStatus },
      {
        onSuccess: () => showToast('success', `Invoice ${newStatus}`),
        onError: (err: Error) => showToast('error', err.message || 'Failed to update status'),
      },
    );
  };

  const handleEdit = () => {
    navigate({ to: '/sales/invoices/$invoiceId/edit', params: { invoiceId } });
  };

  const handleCreateCreditNote = () => {
    if (!invoice) return;
    // Create a credit note as a negative invoice referencing the original
    createMutation.mutate(
      {
        contactId: invoice.contactId,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        reference: `CN for ${invoice.invoiceNumber}`,
        amountType: invoice.amountType,
        currency: invoice.currency,
        currencyCode: invoice.currency,
        exchangeRate: 1.0,
        lineItems: invoice.lineItems.map((li) => ({
          description: `Credit: ${li.description}`,
          quantity: li.quantity,
          unitPrice: -Math.abs(li.unitPrice),
          accountCode: li.accountCode,
          taxRate: li.taxRate,
          discount: li.discount,
        })),
      },
      {
        onSuccess: () => {
          showToast('success', 'Credit note created');
          navigate({ to: '/sales/invoices' });
        },
        onError: (err: Error) => {
          showToast('error', err.message || 'Failed to create credit note');
        },
      },
    );
  };

  const handleRecordPayment = () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;
    paymentMutation.mutate(
      {
        invoiceId,
        amount,
        date: paymentDate,
        reference: paymentReference || undefined,
      },
      {
        onSuccess: () => {
          showToast('success', 'Payment recorded');
          setShowPaymentForm(false);
          setPaymentAmount('');
          setPaymentReference('');
        },
        onError: (err: Error) => {
          showToast('error', err.message || 'Failed to record payment');
        },
      },
    );
  };

  if (isLoading) {
    return (
      <PageContainer title="Invoice" breadcrumbs={[{ label: 'Invoices', href: '/sales/invoices' }]}>
        <div className="py-12 text-center text-gray-500" data-testid="invoice-detail-loading">
          Loading invoice...
        </div>
      </PageContainer>
    );
  }

  if (!invoice) {
    return (
      <PageContainer title="Invoice" breadcrumbs={[{ label: 'Invoices', href: '/sales/invoices' }]}>
        <div className="py-12 text-center text-gray-500" data-testid="invoice-not-found">
          Invoice not found
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={invoice.invoiceNumber ?? 'Invoice'}
      breadcrumbs={[
        { label: 'Invoices', href: '/sales/invoices' },
        { label: invoice.invoiceNumber ?? invoiceId },
      ]}
    >
      <InvoiceDetail
        invoice={invoice}
        onTransition={handleTransition}
        onEdit={handleEdit}
        onCreateCreditNote={handleCreateCreditNote}
        isTransitioning={transitionMutation.isPending}
      />

      {/* Payment recording section */}
      {invoice.amountDue > 0 && canReceivePayment(invoice.status) && (
        <div className="mt-6" data-testid="payment-section">
          {!showPaymentForm ? (
            <Button
              variant="outline"
              onClick={() => setShowPaymentForm(true)}
              data-testid="record-payment-button"
            >
              Record Payment
            </Button>
          ) : (
            <div className="border rounded-md p-4 space-y-3" data-testid="payment-form">
              <h3 className="text-sm font-semibold text-gray-700">Record Payment</h3>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="Amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={String(invoice.amountDue)}
                  data-testid="payment-amount"
                />
                <Input
                  label="Date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  data-testid="payment-date"
                />
                <Input
                  label="Reference"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Optional"
                  data-testid="payment-reference"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={handleRecordPayment}
                  loading={paymentMutation.isPending}
                  disabled={!paymentAmount || paymentMutation.isPending}
                  data-testid="submit-payment-button"
                >
                  Save Payment
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowPaymentForm(false)}
                  data-testid="cancel-payment-button"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}

/* ════════════════════════════════════════════
   InvoiceEditPage — Edit an existing invoice
   ════════════════════════════════════════════ */
export function InvoiceEditPage() {
  const { invoiceId } = useParams({ from: '/sales/invoices/$invoiceId/edit' });
  const navigate = useNavigate();
  const { data: invoice, isLoading } = useInvoice(invoiceId);
  const updateMutation = useUpdateInvoice();
  const { data: contactsRaw = [] } = useContacts();
  const contactOptions = contactsRaw.map(c => ({ value: c.id, label: c.name }));
  const { data: products = [] } = useProductList();
  const items = products.map(p => ({ code: p.code, name: p.name, salePrice: p.salePrice }));
  const { data: accountsRaw = [] } = useAccounts();
  const accountOptions = accountsRaw.map(a => ({ value: a.code, label: `${a.code} - ${a.name}` }));
  const { data: projectsRaw = [] } = useProjects();
  const projectOptions = projectsRaw.map(p => ({ value: p.id, label: p.name }));
  const { data: currenciesRaw = [] } = useCurrencies();
  const currencyOptions = currenciesRaw.map(c => ({ value: c.code, label: `${c.code} - ${c.name}`, rate: c.rate }));
  const { data: trackingCatsRaw = [] } = useTrackingCategories();
  const regionOptions = trackingCatsRaw.flatMap(tc => tc.options.map(opt => ({ value: opt.name, label: opt.name })));
  const { data: taxRatesRaw = [] } = useTaxRates();
  const taxRateOptions = taxRatesRaw.map(tr => ({ value: String(tr.rate), label: tr.name }));

  const mapLineItems = (lineItems: InvoiceFormData['lineItems']) =>
    lineItems
      .filter(li => li.description.trim() || li.unitPrice > 0)
      .map((li) => ({
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        accountCode: li.accountCode,
        taxRate: li.taxRate,
        discount: li.discount,
        productId: li.itemCode || undefined,
      }));

  const handleSaveDraft = (data: InvoiceFormData) => {
    updateMutation.mutate(
      {
        id: invoiceId,
        data: {
          contactId: data.contactId,
          reference: data.reference,
          notes: data.notes,
          date: data.date,
          dueDate: data.dueDate,
          amountType: data.amountType,
          currency: data.currency,
          currencyCode: data.currency,
          exchangeRate: data.exchangeRate,
          lineItems: mapLineItems(data.lineItems),
        },
      },
      {
        onSuccess: () => {
          showToast('success', 'Invoice saved as draft');
          navigate({ to: '/sales/invoices/$invoiceId', params: { invoiceId } });
        },
        onError: (error) => {
          showToast('error', `Failed to save invoice: ${error.message}`);
        },
      },
    );
  };

  const handleSubmit = (data: InvoiceFormData) => {
    updateMutation.mutate(
      {
        id: invoiceId,
        data: {
          contactId: data.contactId,
          reference: data.reference,
          notes: data.notes,
          date: data.date,
          dueDate: data.dueDate,
          amountType: data.amountType,
          currency: data.currency,
          currencyCode: data.currency,
          exchangeRate: data.exchangeRate,
          lineItems: mapLineItems(data.lineItems),
        },
      },
      {
        onSuccess: async () => {
          try {
            await apiPut(`/invoices/${invoiceId}/status`, { status: 'submitted' });
            showToast('success', 'Invoice submitted for approval');
          } catch {
            showToast('warning', 'Invoice saved as draft (could not submit)');
          }
          navigate({ to: '/sales/invoices/$invoiceId', params: { invoiceId } });
        },
        onError: (error) => {
          showToast('error', `Failed to save invoice: ${error.message}`);
        },
      },
    );
  };

  const handleApproveEmail = (data: InvoiceFormData) => {
    updateMutation.mutate(
      {
        id: invoiceId,
        data: {
          contactId: data.contactId,
          reference: data.reference,
          notes: data.notes,
          date: data.date,
          dueDate: data.dueDate,
          amountType: data.amountType,
          currency: data.currency,
          currencyCode: data.currency,
          exchangeRate: data.exchangeRate,
          lineItems: mapLineItems(data.lineItems),
        },
      },
      {
        onSuccess: async () => {
          try {
            await apiPut(`/invoices/${invoiceId}/status`, { status: 'submitted' });
            await apiPut(`/invoices/${invoiceId}/status`, { status: 'approved' });
            showToast('success', `Invoice ${invoice?.invoiceNumber ?? ''} approved`);
          } catch {
            showToast('warning', 'Invoice saved (could not approve)');
          }
          navigate({ to: '/sales/invoices/$invoiceId', params: { invoiceId } });
        },
        onError: (error) => {
          showToast('error', `Failed to save invoice: ${error.message}`);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <PageContainer
        title="Edit Invoice"
        breadcrumbs={[
          { label: 'Invoices', href: '/sales/invoices' },
          { label: 'Edit' },
        ]}
      >
        <div className="py-12 text-center text-gray-500" data-testid="invoice-edit-loading">
          Loading invoice...
        </div>
      </PageContainer>
    );
  }

  if (!invoice) {
    return (
      <PageContainer
        title="Edit Invoice"
        breadcrumbs={[
          { label: 'Invoices', href: '/sales/invoices' },
          { label: 'Edit' },
        ]}
      >
        <div className="py-12 text-center text-gray-500" data-testid="invoice-not-found">
          Invoice not found
        </div>
      </PageContainer>
    );
  }

  const initialData: Partial<InvoiceFormData> = {
    contactId: invoice.contactId,
    contactName: invoice.contactName,
    reference: invoice.reference ?? '',
    notes: (invoice as Record<string, unknown>).notes as string ?? '',
    currency: invoice.currency ?? 'NZD',
    date: invoice.date,
    dueDate: invoice.dueDate,
    amountType: invoice.amountType as 'exclusive' | 'inclusive' | 'no_tax',
    lineItems: invoice.lineItems.map((li) => ({
      key: li.id,
      description: li.description,
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      accountCode: li.accountCode ?? '',
      taxRate: li.taxRate,
      discount: li.discount,
      discountType: 'percent' as const,
      itemCode: li.productId ?? '',
    })),
  };

  return (
    <PageContainer
      title="Edit Invoice"
      breadcrumbs={[
        { label: 'Invoices', href: '/sales/invoices' },
        { label: invoice.invoiceNumber ?? invoiceId },
        { label: 'Edit' },
      ]}
    >
      <InvoiceForm
        initialData={initialData}
        invoiceNumber={invoice.invoiceNumber}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        onApproveEmail={handleApproveEmail}
        isSaving={updateMutation.isPending}
        contacts={contactOptions}
        items={items}
        accountOptions={accountOptions}
        taxRateOptions={taxRateOptions}
        projectOptions={projectOptions}
        regionOptions={regionOptions}
        currencyOptions={currencyOptions}
      />
    </PageContainer>
  );
}

/* ════════════════════════════════════════════
   InvoiceCreatePage — New invoice / recurring / credit note
   ════════════════════════════════════════════ */
export function InvoiceCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateInvoice();
  const { data: contactsRaw = [] } = useContacts();
  const contactOptions = contactsRaw.map(c => ({ value: c.id, label: c.name }));
  const { data: products = [] } = useProductList();
  const items = products.map(p => ({ code: p.code, name: p.name, salePrice: p.salePrice }));
  const { data: accountsRaw = [] } = useAccounts();
  const accountOptions = accountsRaw.map(a => ({ value: a.code, label: `${a.code} - ${a.name}` }));
  const { data: projectsRaw = [] } = useProjects();
  const projectOptions = projectsRaw.map(p => ({ value: p.id, label: p.name }));
  const { data: currenciesRaw = [] } = useCurrencies();
  const currencyOptions = currenciesRaw.map(c => ({ value: c.code, label: `${c.code} - ${c.name}`, rate: c.rate }));
  const { data: trackingCatsRaw = [] } = useTrackingCategories();
  const regionOptions = trackingCatsRaw.flatMap(tc => tc.options.map(opt => ({ value: opt.name, label: opt.name })));
  const { data: taxRatesRaw = [] } = useTaxRates();
  const taxRateOptions = taxRatesRaw.map(tr => ({ value: String(tr.rate), label: tr.name }));

  // Read ?type= query param to determine which form to show
  const params = new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : '',
  );
  const createType = params.get('type'); // 'recurring' | 'credit-note' | null

  if (createType === 'recurring') {
    return <RecurringInvoiceCreateInline />;
  }

  if (createType === 'credit-note') {
    return <CreditNoteCreateInline />;
  }

  const mapLineItems = (lineItems: InvoiceFormData['lineItems']) =>
    lineItems
      .filter(li => li.description.trim() || li.unitPrice > 0)
      .map((li) => ({
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        accountCode: li.accountCode,
        taxRate: li.taxRate,
        discount: li.discount,
        productId: li.itemCode || undefined,
      }));

  const handleSaveDraft = (data: InvoiceFormData) => {
    createMutation.mutate(
      {
        contactId: data.contactId,
        date: data.date,
        dueDate: data.dueDate,
        reference: data.reference,
        notes: data.notes,
        amountType: data.amountType,
        currency: data.currency ?? 'NZD',
        currencyCode: data.currency ?? 'NZD',
        exchangeRate: data.exchangeRate ?? 1.0,
        lineItems: mapLineItems(data.lineItems),
      },
      {
        onSuccess: () => {
          showToast('success', 'Invoice saved as draft');
          navigate({ to: '/sales/invoices' });
        },
        onError: (error) => {
          showToast('error', `Failed to save invoice: ${error.message}`);
        },
      },
    );
  };

  const handleSubmit = (data: InvoiceFormData) => {
    createMutation.mutate(
      {
        contactId: data.contactId,
        date: data.date,
        dueDate: data.dueDate,
        reference: data.reference,
        notes: data.notes,
        amountType: data.amountType,
        currency: data.currency ?? 'NZD',
        currencyCode: data.currency ?? 'NZD',
        exchangeRate: data.exchangeRate ?? 1.0,
        lineItems: mapLineItems(data.lineItems),
      },
      {
        onSuccess: async (result) => {
          try {
            await apiPut(`/invoices/${result.id}/status`, { status: 'submitted' });
            showToast('success', `Invoice ${result.invoiceNumber} submitted for approval`);
          } catch {
            showToast('warning', `Invoice ${result.invoiceNumber} saved as draft (could not submit)`);
          }
          navigate({ to: '/sales/invoices' });
        },
        onError: (error) => {
          showToast('error', `Failed to create invoice: ${error.message}`);
        },
      },
    );
  };

  const handleApproveEmail = (data: InvoiceFormData) => {
    createMutation.mutate(
      {
        contactId: data.contactId,
        date: data.date,
        dueDate: data.dueDate,
        reference: data.reference,
        notes: data.notes,
        amountType: data.amountType,
        currency: data.currency ?? 'NZD',
        currencyCode: data.currency ?? 'NZD',
        exchangeRate: data.exchangeRate ?? 1.0,
        lineItems: mapLineItems(data.lineItems),
      },
      {
        onSuccess: async (result) => {
          try {
            await apiPut(`/invoices/${result.id}/status`, { status: 'submitted' });
            await apiPut(`/invoices/${result.id}/status`, { status: 'approved' });
            showToast('success', `Invoice ${result.invoiceNumber} approved`);
          } catch {
            showToast('warning', `Invoice ${result.invoiceNumber} saved (could not approve)`);
          }
          navigate({ to: '/sales/invoices' });
        },
        onError: (error) => {
          showToast('error', `Failed to create invoice: ${error.message}`);
        },
      },
    );
  };

  return (
    <PageContainer
      title="New Invoice"
      breadcrumbs={[
        { label: 'Invoices', href: '/sales/invoices' },
        { label: 'New Invoice' },
      ]}
    >
      <InvoiceForm
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        onApproveEmail={handleApproveEmail}
        isSaving={createMutation.isPending}
        contacts={contactOptions}
        items={items}
        accountOptions={accountOptions}
        taxRateOptions={taxRateOptions}
        projectOptions={projectOptions}
        regionOptions={regionOptions}
        currencyOptions={currencyOptions}
      />
    </PageContainer>
  );

}

/* ─── Inline create: Recurring Invoice ─── */
import { RecurringInvoiceForm } from '../components/RecurringInvoiceForm';
import type { RecurringInvoiceFormData } from '../components/RecurringInvoiceForm';
import { useCreateRecurringInvoice } from '../hooks/useRecurringInvoices';

function RecurringInvoiceCreateInline() {
  const navigate = useNavigate();
  const createMutation = useCreateRecurringInvoice();
  const { data: contactsRaw = [] } = useContacts();
  const contactOptions = contactsRaw.map(c => ({ value: c.id, label: c.name }));

  const handleSubmit = (data: RecurringInvoiceFormData) => {
    // Calculate totals from line items
    let subTotal = 0;
    let totalTax = 0;
    for (const li of data.lineItems) {
      const lineAmount = li.quantity * li.unitPrice * (1 - li.discount / 100);
      subTotal += lineAmount;
      totalTax += lineAmount * (li.taxRate / 100);
    }
    createMutation.mutate(
      {
        templateName: data.templateName,
        contactId: data.contactId,
        frequency: data.frequency,
        nextDate: data.nextDate,
        endDate: data.endDate || undefined,
        daysUntilDue: data.daysUntilDue,
        subTotal,
        totalTax,
        total: subTotal + totalTax,
      },
      {
        onSuccess: () => {
          showToast('success', 'Repeating invoice created');
          navigate({ to: '/sales/invoices' });
        },
        onError: (err: Error) => {
          showToast('error', err.message || 'Failed to create repeating invoice');
        },
      },
    );
  };

  return (
    <PageContainer
      title="New Repeating Invoice"
      breadcrumbs={[
        { label: 'Invoices', href: '/sales/invoices' },
        { label: 'New Repeating Invoice' },
      ]}
    >
      <RecurringInvoiceForm
        onSubmit={handleSubmit}
        isSaving={createMutation.isPending}
        contacts={contactOptions}
      />
    </PageContainer>
  );
}

/* ─── Inline create: Credit Note ─── */
import { CreditNoteForm } from '../components/CreditNoteForm';
import type { CreditNoteFormData } from '../components/CreditNoteForm';
import { useCreateCreditNote } from '../hooks/useCreditNotes';

function CreditNoteCreateInline() {
  const navigate = useNavigate();
  const createMutation = useCreateCreditNote();
  const { data: contactsRaw = [] } = useContacts();
  const contactOptions = contactsRaw.map(c => ({ value: c.id, label: c.name }));

  const handleSaveDraft = (data: CreditNoteFormData) => {
    createMutation.mutate(
      {
        type: data.type,
        contactId: data.contactId,
        date: data.date,
        subTotal: data.subTotal || undefined,
        totalTax: data.totalTax || undefined,
        total: data.total || undefined,
        linkedInvoiceId: data.linkedInvoiceId || undefined,
        linkedBillId: data.linkedBillId || undefined,
      },
      {
        onSuccess: () => {
          showToast('success', 'Credit note saved as draft');
          navigate({ to: '/sales/invoices' });
        },
        onError: (error) => {
          showToast('error', `Failed to save credit note: ${error.message}`);
        },
      },
    );
  };

  const handleSubmit = (data: CreditNoteFormData) => {
    createMutation.mutate(
      {
        type: data.type,
        contactId: data.contactId,
        date: data.date,
        subTotal: data.subTotal || undefined,
        totalTax: data.totalTax || undefined,
        total: data.total || undefined,
        linkedInvoiceId: data.linkedInvoiceId || undefined,
        linkedBillId: data.linkedBillId || undefined,
      },
      {
        onSuccess: async (result) => {
          try {
            await apiPut(`/credit-notes/${result.id}/status`, { status: 'submitted' });
            showToast('success', `Credit note ${result.creditNoteNumber} submitted for approval`);
          } catch {
            showToast('warning', `Credit note saved as draft (could not submit)`);
          }
          navigate({ to: '/sales/invoices' });
        },
        onError: (error) => {
          showToast('error', `Failed to create credit note: ${error.message}`);
        },
      },
    );
  };

  return (
    <PageContainer
      title="New Credit Note"
      breadcrumbs={[
        { label: 'Invoices', href: '/sales/invoices' },
        { label: 'New Credit Note' },
      ]}
    >
      <CreditNoteForm
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        isSaving={createMutation.isPending}
        contacts={contactOptions}
      />
    </PageContainer>
  );
}
