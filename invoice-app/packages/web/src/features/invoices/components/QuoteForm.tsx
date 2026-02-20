import { useState, useCallback } from 'react';
import { Input } from '../../../components/ui/Input';
import { Combobox } from '../../../components/ui/Combobox';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import { InvoiceLineItems, createEmptyLine } from './InvoiceLineItems';
import { InvoiceTotals } from './InvoiceTotals';
import { DEFAULT_TAX_RATE } from '@xero-replica/shared';
import type { InvoiceAmountType } from '@xero-replica/shared';
import type { FormLineItem } from '../types';

export interface QuoteFormData {
  contactId: string;
  contactName: string;
  title: string;
  summary: string;
  reference: string;
  date: string;
  expiryDate: string;
  amountType: 'exclusive' | 'inclusive' | 'no_tax';
  lineItems: FormLineItem[];
  currency?: string;
  brandingThemeId?: string;
  projectId?: string;
  terms?: string;
}

interface QuoteFormProps {
  contacts?: Array<{ value: string; label: string }>;
  items?: Array<{ code: string; name: string; salePrice: number }>;
  accountOptions?: Array<{ value: string; label: string }>;
  projectOptions?: Array<{ value: string; label: string }>;
  regionOptions?: Array<{ value: string; label: string }>;
  currencyOptions?: Array<{ value: string; label: string }>;
  taxRateOptions?: Array<{ value: string; label: string }>;
  onCreateNewContact?: () => void;
  initialData?: Partial<QuoteFormData>;
  quoteNumber?: string;
  onSaveDraft: (data: QuoteFormData) => void;
  onSubmit: (data: QuoteFormData) => void;
  isSaving?: boolean;
}

const AMOUNT_TYPE_OPTIONS = [
  { value: 'exclusive', label: 'Tax Exclusive' },
  { value: 'inclusive', label: 'Tax Inclusive' },
  { value: 'no_tax', label: 'No Tax' },
];

const FALLBACK_CURRENCY_OPTIONS = [
  { value: 'NZD', label: 'New Zealand Dollar' },
  { value: 'AUD', label: 'Australian Dollar' },
  { value: 'USD', label: 'US Dollar' },
  { value: 'GBP', label: 'British Pound' },
  { value: 'EUR', label: 'Euro' },
];

const BRANDING_THEME_OPTIONS = [
  { value: 'theme-default', label: 'Standard' },
  { value: 'theme-orange', label: 'Very orange invoice!' },
];

const TAX_MODE_OPTIONS = [
  { value: 'exclusive', label: 'Tax exclusive' },
  { value: 'inclusive', label: 'Tax inclusive' },
  { value: 'no_tax', label: 'No tax' },
];


function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function expiryDateStr(days: number = 30): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function QuoteForm({
  contacts = [],
  items,
  accountOptions,
  projectOptions = [],
  regionOptions,
  currencyOptions,
  taxRateOptions,
  onCreateNewContact,
  initialData,
  quoteNumber,
  onSaveDraft,
  onSubmit,
  isSaving = false,
}: QuoteFormProps) {
  const resolvedCurrencyOptions = currencyOptions && currencyOptions.length > 0 ? currencyOptions : FALLBACK_CURRENCY_OPTIONS;
  const [contactId, setContactId] = useState(initialData?.contactId ?? '');
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [summary, setSummary] = useState(initialData?.summary ?? '');
  const [reference, setReference] = useState(initialData?.reference ?? '');
  const [date, setDate] = useState(initialData?.date ?? todayStr());
  const [expiryDate, setExpiryDate] = useState(initialData?.expiryDate ?? expiryDateStr(30));
  const [amountType, setAmountType] = useState<InvoiceAmountType>(
    initialData?.amountType ?? 'exclusive',
  );
  const [lineItems, setLineItems] = useState<FormLineItem[]>(
    initialData?.lineItems ?? [createEmptyLine()],
  );
  const [currency, setCurrency] = useState(initialData?.currency ?? 'NZD');
  const [brandingThemeId, setBrandingThemeId] = useState(initialData?.brandingThemeId ?? 'theme-default');
  const [projectId, setProjectId] = useState(initialData?.projectId ?? '');
  const [terms, setTerms] = useState(initialData?.terms ?? '');

  const getFormData = useCallback((): QuoteFormData => {
    const contact = contacts.find((c) => c.value === contactId);
    return {
      contactId,
      contactName: contact?.label ?? '',
      title,
      summary,
      reference,
      date,
      expiryDate,
      amountType,
      lineItems,
      currency,
      brandingThemeId,
      projectId,
      terms,
    };
  }, [contacts, contactId, title, summary, reference, date, expiryDate, amountType, lineItems, currency, brandingThemeId, projectId, terms]);

  const handleAmountTypeChange = (newType: string) => {
    setAmountType(newType as InvoiceAmountType);
    if (newType === 'no_tax') {
      setLineItems((prev) => prev.map((li) => ({ ...li, taxRate: 0 })));
    } else {
      setLineItems((prev) =>
        prev.map((li) => (li.taxRate === 0 ? { ...li, taxRate: DEFAULT_TAX_RATE } : li)),
      );
    }
  };

  return (
    <div className="space-y-6" data-testid="quote-form">
      <Card>
        <CardContent className="space-y-6 p-6">
          {/* Contact + Quote details */}
          <div className="grid grid-cols-2 gap-6">
            <Combobox
              label="Contact"
              options={contacts}
              value={contactId}
              onChange={(v) => setContactId(v)}
              placeholder="Select a contact..."
              onCreateNew={onCreateNewContact ?? (() => window.open('/contacts/new', '_blank'))}
              data-testid="form-contact"
            />
            <Input
              label="Quote Number"
              value={quoteNumber ?? 'QU-AUTO'}
              disabled
              data-testid="form-quote-number"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Quote title"
              data-testid="form-title"
            />
            <Input
              label="Reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Optional reference"
              data-testid="form-reference"
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
              label="Expiry Date"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              data-testid="form-expiry-date"
            />
            <Combobox
              label="Tax"
              options={TAX_MODE_OPTIONS}
              value={amountType}
              onChange={(v) => handleAmountTypeChange(v)}
              data-testid="form-amount-type"
            />
          </div>

          <div className="grid grid-cols-3 gap-6">
            <Combobox
              label="Currency"
              options={resolvedCurrencyOptions}
              value={currency}
              onChange={(v) => setCurrency(v)}
              data-testid="form-currency"
            />
            <Combobox
              label="Branding theme"
              options={BRANDING_THEME_OPTIONS}
              value={brandingThemeId}
              onChange={(v) => setBrandingThemeId(v)}
              data-testid="form-branding-theme"
            />
            <Combobox
              label="Project"
              options={projectOptions}
              value={projectId}
              onChange={(v) => setProjectId(v)}
              placeholder="Select a project..."
              data-testid="form-project"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Summary</label>
            <textarea
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078c8]/20 focus:border-[#0078c8]"
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief summary for the quote..."
              data-testid="form-summary"
            />
          </div>
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
            onCreateNewAccount={() => window.open('/accounting/chart-of-accounts/new', '_blank')}
            onCreateNewRegion={() => window.open('/settings/tracking-categories', '_blank')}
          />
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardContent className="p-6">
          <InvoiceTotals lineItems={lineItems} amountType={amountType} />
        </CardContent>
      </Card>

      {/* Terms */}
      <Card>
        <CardContent className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Terms</label>
          <textarea
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078c8]/20 focus:border-[#0078c8]"
            rows={3}
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            placeholder="Add payment terms..."
            data-testid="form-terms"
          />
          <p className="mt-1 text-xs text-gray-400">To set and reuse terms, edit your branding theme in Invoice settings</p>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="sticky bottom-0 z-10 bg-white border-t py-3 flex items-center justify-end gap-3" data-testid="form-actions">
        <Button
          variant="secondary"
          onClick={() => onSaveDraft(getFormData())}
          disabled={isSaving || !contactId}
          loading={isSaving}
          data-testid="save-draft-button"
        >
          Save as Draft
        </Button>
        <Button
          variant="primary"
          onClick={() => onSubmit(getFormData())}
          disabled={isSaving || !contactId}
          loading={isSaving}
          data-testid="submit-button"
        >
          Send Quote
        </Button>
      </div>
    </div>
  );
}

export { AMOUNT_TYPE_OPTIONS, FALLBACK_CURRENCY_OPTIONS as CURRENCY_OPTIONS, BRANDING_THEME_OPTIONS, TAX_MODE_OPTIONS };
