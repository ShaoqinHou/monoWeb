import { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Combobox } from '../../../components/ui/Combobox';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import { ChevronDown, Eye, MoreHorizontal } from 'lucide-react';
import { InvoiceLineItems, createEmptyLine } from './InvoiceLineItems';
import { InvoiceTotals } from './InvoiceTotals';
import { DeliveryAddressSelect } from './DeliveryAddressSelect';
import { BrandingThemeSelect } from './BrandingThemeSelect';
import { InvoiceAttachments } from './InvoiceAttachments';
import { INVOICE_NUMBER_PREFIX, DEFAULT_TAX_RATE, calcLineItem, formatCurrency } from '@xero-replica/shared';
import type { InvoiceAmountType } from '@xero-replica/shared';
import type { FormLineItem, InvoiceFormData, RecurringSchedule } from '../types';
import type { AttachedFile } from '../../../components/patterns/FileAttachment';

interface InvoiceFormProps {
  contacts?: Array<{ value: string; label: string }>;
  initialData?: Partial<InvoiceFormData>;
  invoiceNumber?: string;
  onSaveDraft: (data: InvoiceFormData) => void;
  onSubmit: (data: InvoiceFormData) => void;
  onSaveClose?: (data: InvoiceFormData) => void;
  onApproveEmail?: (data: InvoiceFormData) => void;
  onDelete?: () => void;
  onCopy?: () => void;
  isSaving?: boolean;
  items?: Array<{code: string; name: string; salePrice: number}>;
  accountOptions?: Array<{ value: string; label: string }>;
  taxRateOptions?: Array<{ value: string; label: string }>;
  projectOptions?: Array<{ value: string; label: string }>;
  regionOptions?: Array<{ value: string; label: string }>;
  currencyOptions?: Array<{ value: string; label: string; rate?: number }>;
  onCreateNewContact?: () => void;
  onCreateNewAccount?: () => void;
  onCreateNewTaxRate?: () => void;
  onCreateNewRegion?: () => void;
}

const FALLBACK_CURRENCY_OPTIONS = [
  { value: 'NZD', label: 'NZD - New Zealand Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'EUR', label: 'EUR - Euro' },
];

const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  NZD: 1.0,
  AUD: 0.93,
  USD: 0.62,
  GBP: 0.49,
  EUR: 0.57,
};

const AMOUNT_TYPE_OPTIONS = [
  { value: 'exclusive', label: 'Tax Exclusive' },
  { value: 'inclusive', label: 'Tax Inclusive' },
  { value: 'no_tax', label: 'No Tax' },
];

const RECURRING_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'fortnightly', label: 'Fortnightly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
];


function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function dueDateStr(days: number = 30): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function InvoiceForm({
  contacts = [],
  initialData,
  invoiceNumber,
  onSaveDraft,
  onSubmit,
  onSaveClose,
  onApproveEmail,
  onDelete,
  onCopy,
  isSaving = false,
  items,
  accountOptions,
  taxRateOptions,
  projectOptions,
  regionOptions,
  currencyOptions,
  onCreateNewContact,
  onCreateNewAccount,
  onCreateNewTaxRate,
  onCreateNewRegion,
}: InvoiceFormProps) {
  const [contactId, setContactId] = useState(initialData?.contactId ?? '');
  const [reference, setReference] = useState(initialData?.reference ?? '');
  const [currency, setCurrency] = useState(initialData?.currency ?? 'NZD');
  const [exchangeRate, setExchangeRate] = useState(initialData?.exchangeRate ?? 1.0);
  const [date, setDate] = useState(initialData?.date ?? todayStr());
  const [dueDate, setDueDate] = useState(initialData?.dueDate ?? dueDateStr(30));
  const [amountType, setAmountType] = useState<InvoiceAmountType>(
    initialData?.amountType ?? 'exclusive',
  );
  const [lineItems, setLineItems] = useState<FormLineItem[]>(
    initialData?.lineItems ?? [createEmptyLine()],
  );
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [recurring, setRecurring] = useState<RecurringSchedule>(
    initialData?.recurring ?? 'none',
  );
  const [deliveryAddressId, setDeliveryAddressId] = useState(initialData?.deliveryAddressId ?? '');
  const [brandingThemeId, setBrandingThemeId] = useState(initialData?.brandingThemeId ?? 'theme-default');
  const [expectedPaymentDate, setExpectedPaymentDate] = useState(initialData?.expectedPaymentDate ?? '');
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [onlinePayments, setOnlinePayments] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Click-outside for more-options menu
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) setMoreMenuOpen(false);
    }
    if (moreMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [moreMenuOpen]);

  const resolvedCurrencyOptions = currencyOptions && currencyOptions.length > 0
    ? currencyOptions
    : FALLBACK_CURRENCY_OPTIONS;

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
    // Try dynamic rate from currencyOptions first, then fallback
    const dynamicRate = currencyOptions?.find(c => c.value === newCurrency)?.rate;
    setExchangeRate(dynamicRate ?? DEFAULT_EXCHANGE_RATES[newCurrency] ?? 1.0);
  };

  const getFormData = useCallback((): InvoiceFormData => {
    const contact = contacts.find((c) => c.value === contactId);
    return {
      contactId,
      contactName: contact?.label ?? '',
      reference,
      currency,
      exchangeRate,
      date,
      dueDate,
      amountType,
      lineItems,
      notes,
      recurring,
      deliveryAddressId,
      brandingThemeId,
      expectedPaymentDate,
    };
  }, [contacts, contactId, reference, currency, exchangeRate, date, dueDate, amountType, lineItems, notes, recurring, deliveryAddressId, brandingThemeId, expectedPaymentDate]);

  const handleAmountTypeChange = (newType: string) => {
    setAmountType(newType as InvoiceAmountType);
    // When switching to no_tax, reset line tax rates to 0
    if (newType === 'no_tax') {
      setLineItems((prev) => prev.map((li) => ({ ...li, taxRate: 0 })));
    } else {
      setLineItems((prev) =>
        prev.map((li) => (li.taxRate === 0 ? { ...li, taxRate: DEFAULT_TAX_RATE } : li)),
      );
    }
  };

  const hasValidLineItems = lineItems.some(li => li.description.trim() || li.unitPrice > 0);

  return (
    <div className="space-y-6" data-testid="invoice-form">
      <Card>
        <CardContent className="space-y-6 p-6">
          {/* Contact + Invoice details */}
          <div className="grid grid-cols-2 gap-6">
            <Combobox
              label="Contact"
              options={contacts}
              value={contactId}
              onChange={(v) => setContactId(v)}
              onCreateNew={onCreateNewContact ?? (() => window.open('/contacts/new', '_blank'))}
              placeholder="Select a contact..."
              data-testid="form-contact"
            />
            <Input
              label="Invoice Number"
              value={invoiceNumber ?? `${INVOICE_NUMBER_PREFIX}AUTO`}
              disabled
              data-testid="form-invoice-number"
            />
          </div>

          <div className="grid grid-cols-3 gap-6">
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              data-testid="form-date"
            />
            <Input
              label="Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              data-testid="form-due-date"
            />
            <Input
              label="Reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Optional reference"
              data-testid="form-reference"
            />
          </div>

          {/* Delivery Address + Branding Theme */}
          {contactId && (
            <div className="grid grid-cols-2 gap-6">
              <DeliveryAddressSelect
                contactId={contactId}
                value={deliveryAddressId}
                onChange={setDeliveryAddressId}
              />
              <BrandingThemeSelect
                value={brandingThemeId}
                onChange={setBrandingThemeId}
              />
            </div>
          )}

          <div className="flex items-end gap-4">
            <div className="w-48">
              <Select
                label="Currency"
                options={resolvedCurrencyOptions}
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                data-testid="form-currency"
              />
            </div>
            <div className="w-48">
              <Select
                label="Amounts Are"
                options={AMOUNT_TYPE_OPTIONS}
                value={amountType}
                onChange={(e) => handleAmountTypeChange(e.target.value)}
                data-testid="form-amount-type"
              />
            </div>
            <div className="w-48">
              <Select
                label="Repeat"
                options={RECURRING_OPTIONS}
                value={recurring}
                onChange={(e) => setRecurring(e.target.value as RecurringSchedule)}
                data-testid="form-recurring"
              />
            </div>
            <div className="w-48">
              <Input
                label="Expected Payment"
                type="date"
                value={expectedPaymentDate}
                onChange={(e) => setExpectedPaymentDate(e.target.value)}
                data-testid="form-expected-payment-date"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Online payments</label>
            <button
              type="button"
              role="switch"
              aria-checked={onlinePayments}
              onClick={() => setOnlinePayments((v) => !v)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${onlinePayments ? 'bg-[#0078c8]' : 'bg-gray-200'}`}
              data-testid="form-online-payments"
            >
              <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${onlinePayments ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
            <span className="text-sm text-gray-500">{onlinePayments ? 'On' : 'Off'}</span>
          </div>
          {currency !== 'NZD' && (
            <div className="flex items-end gap-4">
              <div className="w-48">
                <Input
                  label="Exchange Rate"
                  type="number"
                  value={String(exchangeRate)}
                  onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1.0)}
                  data-testid="exchange-rate-input"
                  step="0.0001"
                  min="0.0001"
                />
              </div>
              <p className="text-sm text-gray-500 pb-2" data-testid="exchange-rate-info">
                1 NZD = {exchangeRate} {currency}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardContent className="p-6">
          <InvoiceLineItems
            lineItems={lineItems}
            amountType={amountType}
            onChange={setLineItems}
            items={items}
            onCreateNewItem={() => window.open('/sales/products/new', '_blank')}
            accountOptions={accountOptions}
            taxRateOptions={taxRateOptions}
            regionOptions={regionOptions}
            projectOptions={projectOptions}
            onCreateNewAccount={onCreateNewAccount ?? (() => window.open('/accounting/chart-of-accounts/new', '_blank'))}
            onCreateNewTaxRate={onCreateNewTaxRate ?? (() => window.open('/accounting/tax-rates/new', '_blank'))}
            onCreateNewRegion={onCreateNewRegion ?? (() => window.open('/settings/tracking-categories', '_blank'))}
          />
          {!hasValidLineItems && contactId && (
            <p className="text-sm text-red-500 mt-2" data-testid="line-items-error">
              At least one line item with a description or price is required
            </p>
          )}
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardContent className="p-6">
          <InvoiceTotals lineItems={lineItems} amountType={amountType} />
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardContent className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
          <textarea
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078c8]/20 focus:border-[#0078c8]"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes or payment instructions..."
            data-testid="form-notes"
          />
        </CardContent>
      </Card>

      {/* Attachments */}
      <Card>
        <CardContent className="p-6">
          <InvoiceAttachments
            files={attachments}
            onAdd={(file) => setAttachments((prev) => [...prev, file])}
            onRemove={(index) => setAttachments((prev) => prev.filter((_, i) => i !== index))}
          />
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="sticky bottom-0 z-10 bg-white border-t py-3 flex items-center justify-end gap-3" data-testid="form-actions">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPreview(true)}
          data-testid="preview-button"
        >
          <Eye className="h-4 w-4 mr-1" />
          Preview
        </Button>

        <Button
          variant="secondary"
          onClick={() => onSaveDraft(getFormData())}
          disabled={isSaving || !contactId || !hasValidLineItems}
          loading={isSaving}
          data-testid="save-draft-button"
        >
          Save as Draft
        </Button>

        {/* Save & Close dropdown */}
        <SaveDropdown
          onSaveClose={() => (onSaveClose ?? onSaveDraft)(getFormData())}
          disabled={isSaving || !contactId || !hasValidLineItems}
        />

        <Button
          variant="primary"
          onClick={() => onSubmit(getFormData())}
          disabled={isSaving || !contactId || !hasValidLineItems}
          loading={isSaving}
          data-testid="submit-button"
        >
          Submit for Approval
        </Button>

        {/* Approve & Email dropdown */}
        <ApproveDropdown
          onApproveEmail={() => (onApproveEmail ?? onSubmit)(getFormData())}
          disabled={isSaving || !contactId || !hasValidLineItems}
        />

        <div className="relative" ref={moreMenuRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMoreMenuOpen(!moreMenuOpen)}
            data-testid="more-invoice-options"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">More invoice options</span>
          </Button>
          {moreMenuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border rounded-md shadow-lg z-10 py-1 min-w-[140px]" data-testid="more-options-menu">
              <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                onClick={() => { window.print(); setMoreMenuOpen(false); }}
                data-testid="print-invoice"
              >
                Print
              </button>
              {onCopy && (
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                  onClick={() => { onCopy(); setMoreMenuOpen(false); }}
                  data-testid="copy-invoice"
                >
                  Copy to new invoice
                </button>
              )}
              {onDelete && (
                <button
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  onClick={() => { if (confirm('Delete this invoice?')) onDelete(); setMoreMenuOpen(false); }}
                  data-testid="delete-invoice"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stub 4: Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowPreview(false)} data-testid="invoice-preview-overlay">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto p-8" onClick={e => e.stopPropagation()} data-testid="invoice-preview-modal">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Invoice Preview</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)} data-testid="preview-close-button">
                X
              </Button>
            </div>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <div>
                  <p className="text-gray-500">To</p>
                  <p className="font-medium">{contacts?.find(c => c.value === contactId)?.label || '\u2014'}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500">Invoice #</p>
                  <p className="font-medium">{invoiceNumber || 'INV-AUTO'}</p>
                </div>
              </div>
              <div className="flex gap-8">
                <div>
                  <p className="text-gray-500">Date</p>
                  <p>{date}</p>
                </div>
                <div>
                  <p className="text-gray-500">Due Date</p>
                  <p>{dueDate}</p>
                </div>
                {reference && (
                  <div>
                    <p className="text-gray-500">Reference</p>
                    <p>{reference}</p>
                  </div>
                )}
              </div>
              <table className="w-full border-t">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b">
                    <th className="py-2">Description</th>
                    <th className="py-2 text-right">Qty</th>
                    <th className="py-2 text-right">Price</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.filter(li => li.description.trim() || li.unitPrice > 0).map((li, i) => {
                    const effectiveDiscountPct = li.discountType === 'percent'
                      ? li.discount
                      : (li.quantity * li.unitPrice > 0 ? (li.discount / (li.quantity * li.unitPrice)) * 100 : 0);
                    const calc = calcLineItem({ quantity: li.quantity, unitPrice: li.unitPrice, discount: effectiveDiscountPct, taxRate: li.taxRate }, amountType);
                    return (
                      <tr key={i} className="border-b">
                        <td className="py-2">{li.description}</td>
                        <td className="py-2 text-right">{li.quantity}</td>
                        <td className="py-2 text-right">{formatCurrency(li.unitPrice)}</td>
                        <td className="py-2 text-right">{formatCurrency(calc.lineAmount + calc.taxAmount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <InvoiceTotals lineItems={lineItems} amountType={amountType} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Save & Close Dropdown ─── */
function SaveDropdown({ onSaveClose, disabled }: { onSaveClose: () => void; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref} data-testid="save-close-dropdown">
      <Button
        variant="outline"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        data-testid="save-close-trigger"
      >
        Save &amp; Close
        <ChevronDown className="h-3 w-3 ml-1" />
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-md border bg-white py-1 shadow-lg" data-testid="save-close-menu">
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
            onClick={() => { onSaveClose(); setOpen(false); }}
            data-testid="save-close-option"
          >
            Save &amp; close
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
            onClick={() => setOpen(false)}
            data-testid="save-add-another-option"
          >
            Save &amp; add another
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Approve & Email Dropdown ─── */
function ApproveDropdown({ onApproveEmail, disabled }: { onApproveEmail: () => void; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref} data-testid="approve-email-dropdown">
      <Button
        variant="primary"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        data-testid="approve-email-trigger"
      >
        Approve &amp; email
        <ChevronDown className="h-3 w-3 ml-1" />
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 w-52 rounded-md border bg-white py-1 shadow-lg" data-testid="approve-email-menu">
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
            onClick={() => { onApproveEmail(); setOpen(false); }}
            data-testid="approve-email-option"
          >
            Approve &amp; email
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
            onClick={() => setOpen(false)}
            data-testid="approve-online-option"
          >
            Approve for sending online
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
            onClick={() => setOpen(false)}
            data-testid="approve-print-option"
          >
            Approve &amp; get link
          </button>
        </div>
      )}
    </div>
  );
}

export { AMOUNT_TYPE_OPTIONS, RECURRING_OPTIONS, FALLBACK_CURRENCY_OPTIONS, DEFAULT_EXCHANGE_RATES };
