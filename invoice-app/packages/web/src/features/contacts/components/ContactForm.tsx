import { useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Combobox, type ComboboxOption } from '../../../components/ui/Combobox';
import { Button } from '../../../components/ui/Button';
import { Dialog } from '../../../components/ui/Dialog';
import { ContactPersonsList, type ContactPerson } from './ContactPersonsList';
import { DeliveryAddressForm, type DeliveryAddress } from './DeliveryAddressForm';
import { useAccounts } from '../../accounting/hooks/useAccounts';
import { useTaxRates } from '../../accounting/hooks/useTaxRates';
import type { Contact } from '../types';

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  type: 'customer' | 'supplier' | 'customer_and_supplier';
  taxNumber: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankBSB: string;
  defaultAccountCode: string;
  defaultTaxRate: string;
  // Primary person
  firstName: string;
  lastName: string;
  primaryEmail: string;
  // Additional people
  additionalPersons: ContactPerson[];
  // Phone fields
  phoneCountry: string;
  phoneArea: string;
  phoneNumber: string;
  // Notes
  notes: string;
  // Addresses
  billingAddress: string;
  billingAddressManual: boolean;
  deliveryAddresses: DeliveryAddress[];
  // Financial details
  financialParticulars: string;
  financialCode: string;
  financialReference: string;
  gstNumber: string;
  currency: string;
  // Sales defaults
  salesAccount: string;
  invoiceDueDate: string;
  salesAmountsAre: string;
  salesGst: string;
  salesDiscount: string;
  creditLimit: string;
  blockNewInvoices: boolean;
  brandingTheme: string;
  salesRegion: string;
  xeroNetworkKey: string;
  // Purchase defaults
  purchaseAccount: string;
  billDueDate: string;
  purchaseAmountsAre: string;
  purchaseGst: string;
  purchaseRegion: string;
}

interface ContactFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ContactFormData) => void;
  initialData?: Partial<ContactFormData>;
  isSubmitting?: boolean;
  title?: string;
}

const CONTACT_TYPE_OPTIONS = [
  { value: 'customer', label: 'Customer' },
  { value: 'supplier', label: 'Supplier' },
  { value: 'customer_and_supplier', label: 'Customer & Supplier' },
];

const AMOUNTS_ARE_OPTIONS = [
  { value: 'exclusive', label: 'Tax Exclusive' },
  { value: 'inclusive', label: 'Tax Inclusive' },
  { value: 'no_tax', label: 'No Tax' },
];

const CURRENCY_OPTIONS = [
  { value: 'NZD', label: 'NZD - New Zealand Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'EUR', label: 'EUR - Euro' },
];

const DUE_DATE_OPTIONS = [
  { value: '0', label: 'Due on Receipt' },
  { value: '7', label: 'Net 7' },
  { value: '15', label: 'Net 15' },
  { value: '20', label: 'Net 20' },
  { value: '30', label: 'Net 30' },
  { value: '60', label: 'Net 60' },
];

const BRANDING_THEME_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'special', label: 'Special' },
  { value: 'very-nice', label: 'Very Nice Quote' },
];

const DEFAULT_ACCOUNT_OPTIONS: ComboboxOption[] = [
  { value: '200', label: '200 - Sales', description: 'Revenue' },
  { value: '260', label: '260 - Other Revenue', description: 'Revenue' },
  { value: '400', label: '400 - Advertising', description: 'Expense' },
  { value: '404', label: '404 - Bank Fees', description: 'Expense' },
  { value: '408', label: '408 - Cleaning', description: 'Expense' },
  { value: '412', label: '412 - Consulting', description: 'Expense' },
  { value: '416', label: '416 - Depreciation', description: 'Expense' },
  { value: '420', label: '420 - Entertainment', description: 'Expense' },
  { value: '429', label: '429 - General Expenses', description: 'Expense' },
  { value: '461', label: '461 - Rent', description: 'Expense' },
];

const DEFAULT_TAX_RATE_OPTIONS: ComboboxOption[] = [
  { value: '15', label: '15% GST on Income' },
  { value: '15-expense', label: '15% GST on Expenses' },
  { value: '0', label: '0% No GST' },
  { value: 'exempt', label: 'GST Exempt' },
];

const REGION_OPTIONS: ComboboxOption[] = [
  { value: 'auckland', label: 'Auckland' },
  { value: 'wellington', label: 'Wellington' },
  { value: 'canterbury', label: 'Canterbury' },
  { value: 'waikato', label: 'Waikato' },
  { value: 'bay-of-plenty', label: 'Bay of Plenty' },
];

type FormSection = 'contact-details' | 'addresses' | 'financial' | 'sales-defaults' | 'purchase-defaults';

const SECTIONS: { id: FormSection; label: string }[] = [
  { id: 'contact-details', label: 'Contact details' },
  { id: 'addresses', label: 'Addresses' },
  { id: 'financial', label: 'Financial details' },
  { id: 'sales-defaults', label: 'Sales defaults' },
  { id: 'purchase-defaults', label: 'Purchase defaults' },
];

function getDefaultFormData(initial?: Partial<ContactFormData>): ContactFormData {
  return {
    name: initial?.name ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    type: initial?.type ?? 'customer',
    taxNumber: initial?.taxNumber ?? '',
    bankAccountName: initial?.bankAccountName ?? '',
    bankAccountNumber: initial?.bankAccountNumber ?? '',
    bankBSB: initial?.bankBSB ?? '',
    defaultAccountCode: initial?.defaultAccountCode ?? '',
    defaultTaxRate: initial?.defaultTaxRate ?? '',
    firstName: initial?.firstName ?? '',
    lastName: initial?.lastName ?? '',
    primaryEmail: initial?.primaryEmail ?? '',
    additionalPersons: initial?.additionalPersons ?? [],
    phoneCountry: initial?.phoneCountry ?? '+64',
    phoneArea: initial?.phoneArea ?? '',
    phoneNumber: initial?.phoneNumber ?? '',
    notes: initial?.notes ?? '',
    billingAddress: initial?.billingAddress ?? '',
    billingAddressManual: initial?.billingAddressManual ?? false,
    deliveryAddresses: initial?.deliveryAddresses ?? [],
    financialParticulars: initial?.financialParticulars ?? '',
    financialCode: initial?.financialCode ?? '',
    financialReference: initial?.financialReference ?? '',
    gstNumber: initial?.gstNumber ?? '',
    currency: initial?.currency ?? 'NZD',
    salesAccount: initial?.salesAccount ?? '',
    invoiceDueDate: initial?.invoiceDueDate ?? '30',
    salesAmountsAre: initial?.salesAmountsAre ?? 'exclusive',
    salesGst: initial?.salesGst ?? '',
    salesDiscount: initial?.salesDiscount ?? '',
    creditLimit: initial?.creditLimit ?? '',
    blockNewInvoices: initial?.blockNewInvoices ?? false,
    brandingTheme: initial?.brandingTheme ?? '',
    salesRegion: initial?.salesRegion ?? '',
    xeroNetworkKey: initial?.xeroNetworkKey ?? '',
    purchaseAccount: initial?.purchaseAccount ?? '',
    billDueDate: initial?.billDueDate ?? '30',
    purchaseAmountsAre: initial?.purchaseAmountsAre ?? 'exclusive',
    purchaseGst: initial?.purchaseGst ?? '',
    purchaseRegion: initial?.purchaseRegion ?? '',
  };
}

export function ContactForm({
  open,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
  title = 'New Contact',
}: ContactFormProps) {
  const navigate = useNavigate();
  const { data: accountsData } = useAccounts();
  const { data: taxRatesData } = useTaxRates();
  const [formData, setFormData] = useState<ContactFormData>(
    getDefaultFormData(initialData),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<FormSection>('contact-details');

  const resolvedAccountOptions: ComboboxOption[] = accountsData && accountsData.length > 0
    ? accountsData.map((a) => ({ value: a.code, label: `${a.code} - ${a.name}` }))
    : DEFAULT_ACCOUNT_OPTIONS;

  const resolvedTaxRateOptions: ComboboxOption[] = taxRatesData && taxRatesData.length > 0
    ? taxRatesData.map((tr) => ({ value: String(tr.rate), label: tr.name }))
    : DEFAULT_TAX_RATE_OPTIONS;

  function handleChange(field: keyof ContactFormData, value: unknown) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Contact name is required';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      className="max-w-4xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={isSubmitting}
            data-testid="contact-form-save"
          >
            Save
          </Button>
        </>
      }
    >
      <div className="flex gap-6" data-testid="contact-form">
        {/* Side Navigation */}
        <nav className="w-48 shrink-0 space-y-1" data-testid="form-side-nav">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              className={`w-full text-left px-3 py-2 rounded text-sm ${
                activeSection === section.id
                  ? 'bg-[#0078c8] text-white font-medium'
                  : 'text-[#6b7280] hover:bg-gray-100'
              }`}
              onClick={() => setActiveSection(section.id)}
              data-testid={`nav-${section.id}`}
            >
              {section.label}
            </button>
          ))}
        </nav>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-6 min-w-0">
          {/* Contact Details Section */}
          {activeSection === 'contact-details' && (
            <div className="space-y-4" data-testid="section-contact-details">
              <Input
                label="Name"
                placeholder="Contact name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                error={errors.name}
                inputId="contact-name"
                data-testid="contact-name-input"
                required
              />

              <Select
                label="Type"
                options={CONTACT_TYPE_OPTIONS}
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                selectId="contact-type"
                data-testid="contact-type-select"
              />

              {/* Primary Person */}
              <fieldset className="border border-[#e5e7eb] rounded-md p-4 space-y-3">
                <legend className="text-sm font-medium text-[#1a1a2e] px-2">Primary person</legend>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="First Name"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    inputId="primary-first-name"
                    data-testid="primary-first-name"
                  />
                  <Input
                    label="Last Name"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    inputId="primary-last-name"
                    data-testid="primary-last-name"
                  />
                </div>
                <Input
                  label="Email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.primaryEmail}
                  onChange={(e) => handleChange('primaryEmail', e.target.value)}
                  inputId="primary-email"
                  data-testid="primary-email"
                />
              </fieldset>

              {/* Additional People */}
              <fieldset className="border border-[#e5e7eb] rounded-md p-4">
                <legend className="text-sm font-medium text-[#1a1a2e] px-2">Additional people</legend>
                <ContactPersonsList
                  persons={formData.additionalPersons}
                  onChange={(persons) => handleChange('additionalPersons', persons)}
                />
              </fieldset>

              {/* Email (legacy) */}
              <Input
                label="Email"
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={errors.email}
                inputId="contact-email"
                data-testid="contact-email-input"
              />

              {/* Phone - split fields */}
              <fieldset className="border border-[#e5e7eb] rounded-md p-4 space-y-3">
                <legend className="text-sm font-medium text-[#1a1a2e] px-2">Phone</legend>
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    label="Country"
                    value={formData.phoneCountry}
                    onChange={(e) => handleChange('phoneCountry', e.target.value)}
                    inputId="phone-country"
                    data-testid="phone-country"
                    placeholder="+64"
                  />
                  <Input
                    label="Area"
                    value={formData.phoneArea}
                    onChange={(e) => handleChange('phoneArea', e.target.value)}
                    inputId="phone-area"
                    data-testid="phone-area"
                    placeholder="9"
                  />
                  <Input
                    label="Number"
                    value={formData.phoneNumber}
                    onChange={(e) => handleChange('phoneNumber', e.target.value)}
                    inputId="phone-number"
                    data-testid="phone-number"
                    placeholder="555 0100"
                  />
                </div>
              </fieldset>

              {/* Legacy phone field */}
              <Input
                label="Phone"
                type="tel"
                placeholder="555-0100"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                inputId="contact-phone"
                data-testid="contact-phone-input"
              />

              {/* Tax Number */}
              <Input
                label="Tax Number"
                placeholder="NZ-12-345-678"
                value={formData.taxNumber}
                onChange={(e) => handleChange('taxNumber', e.target.value)}
                inputId="contact-tax"
                data-testid="contact-tax-input"
              />

              {/* Notes */}
              <div className="space-y-1">
                <label htmlFor="contact-notes" className="block text-sm font-medium text-[#1a1a2e]">
                  Notes
                </label>
                <textarea
                  id="contact-notes"
                  className="w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-sm focus:border-[#0078c8] focus:outline-none focus:ring-1 focus:ring-[#0078c8]"
                  rows={4}
                  maxLength={4000}
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  data-testid="contact-notes"
                  placeholder="Add notes about this contact..."
                />
                <p className="text-xs text-[#6b7280] text-right" data-testid="notes-char-count">
                  {formData.notes.length} / 4000
                </p>
              </div>
            </div>
          )}

          {/* Addresses Section */}
          {activeSection === 'addresses' && (
            <div className="space-y-6" data-testid="section-addresses">
              {/* Billing Address */}
              <fieldset className="border border-[#e5e7eb] rounded-md p-4 space-y-3">
                <legend className="text-sm font-medium text-[#1a1a2e] px-2">Billing address</legend>
                {!formData.billingAddressManual ? (
                  <div>
                    <Input
                      label="Search address"
                      placeholder="Start typing an address..."
                      value={formData.billingAddress}
                      onChange={(e) => handleChange('billingAddress', e.target.value)}
                      inputId="billing-address-search"
                      data-testid="billing-address-search"
                    />
                    <button
                      type="button"
                      className="mt-2 text-sm text-[#0078c8] hover:underline"
                      onClick={() => handleChange('billingAddressManual', true)}
                      data-testid="enter-address-manually"
                    >
                      Enter address manually
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3" data-testid="manual-billing-address">
                    <Input
                      label="Address"
                      value={formData.billingAddress}
                      onChange={(e) => handleChange('billingAddress', e.target.value)}
                      inputId="billing-address-manual"
                      data-testid="billing-address-manual"
                    />
                    <button
                      type="button"
                      className="text-sm text-[#0078c8] hover:underline"
                      onClick={() => handleChange('billingAddressManual', false)}
                    >
                      Search address
                    </button>
                  </div>
                )}
              </fieldset>

              {/* Delivery Addresses */}
              <fieldset className="border border-[#e5e7eb] rounded-md p-4">
                <legend className="text-sm font-medium text-[#1a1a2e] px-2">Delivery address</legend>
                <DeliveryAddressForm
                  addresses={formData.deliveryAddresses}
                  onChange={(addrs) => handleChange('deliveryAddresses', addrs)}
                />
              </fieldset>
            </div>
          )}

          {/* Financial Details Section */}
          {activeSection === 'financial' && (
            <div className="space-y-4" data-testid="section-financial">
              <Input
                label="Bank Account Name"
                placeholder="Business Account"
                value={formData.bankAccountName}
                onChange={(e) => handleChange('bankAccountName', e.target.value)}
                inputId="contact-bank-name"
                data-testid="contact-bank-name-input"
              />
              <Input
                label="Bank Account Number"
                placeholder="12-3456-7890123-00"
                value={formData.bankAccountNumber}
                onChange={(e) => handleChange('bankAccountNumber', e.target.value)}
                inputId="contact-bank-number"
                data-testid="contact-bank-number-input"
              />
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="Particulars"
                  value={formData.financialParticulars}
                  onChange={(e) => handleChange('financialParticulars', e.target.value)}
                  inputId="financial-particulars"
                  data-testid="financial-particulars"
                />
                <Input
                  label="Code"
                  value={formData.financialCode}
                  onChange={(e) => handleChange('financialCode', e.target.value)}
                  inputId="financial-code"
                  data-testid="financial-code"
                />
                <Input
                  label="Reference"
                  value={formData.financialReference}
                  onChange={(e) => handleChange('financialReference', e.target.value)}
                  inputId="financial-reference"
                  data-testid="financial-reference"
                />
              </div>
              <Input
                label="Bank BSB"
                placeholder="012-345"
                value={formData.bankBSB}
                onChange={(e) => handleChange('bankBSB', e.target.value)}
                inputId="contact-bank-bsb"
                data-testid="contact-bank-bsb-input"
              />
              <Input
                label="GST Number"
                placeholder="123-456-789"
                value={formData.gstNumber}
                onChange={(e) => handleChange('gstNumber', e.target.value)}
                inputId="gst-number"
                data-testid="gst-number"
              />
              <Select
                label="Currency"
                options={CURRENCY_OPTIONS}
                value={formData.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                selectId="currency"
                data-testid="currency-select"
              />
            </div>
          )}

          {/* Sales Defaults Section */}
          {activeSection === 'sales-defaults' && (
            <div className="space-y-4" data-testid="section-sales-defaults">
              <Combobox
                label="Sales Account"
                placeholder="Search accounts..."
                options={resolvedAccountOptions}
                value={formData.salesAccount}
                onChange={(val) => handleChange('salesAccount', val)}
                onCreateNew={() => navigate({ to: '/accounting/chart-of-accounts/new' })}
                className="w-full"
              />
              <Select
                label="Invoice Due Date"
                options={DUE_DATE_OPTIONS}
                value={formData.invoiceDueDate}
                onChange={(e) => handleChange('invoiceDueDate', e.target.value)}
                selectId="invoice-due-date"
                data-testid="invoice-due-date"
              />
              <Select
                label="Amounts are"
                options={AMOUNTS_ARE_OPTIONS}
                value={formData.salesAmountsAre}
                onChange={(e) => handleChange('salesAmountsAre', e.target.value)}
                selectId="sales-amounts-are"
                data-testid="sales-amounts-are"
              />
              <Combobox
                label="Sales GST"
                placeholder="Search tax rates..."
                options={resolvedTaxRateOptions}
                value={formData.salesGst}
                onChange={(val) => handleChange('salesGst', val)}
                className="w-full"
              />
              <Input
                label="Discount"
                placeholder="0%"
                value={formData.salesDiscount}
                onChange={(e) => handleChange('salesDiscount', e.target.value)}
                inputId="sales-discount"
                data-testid="sales-discount"
              />
              <Input
                label="Credit Limit"
                placeholder="0.00"
                value={formData.creditLimit}
                onChange={(e) => handleChange('creditLimit', e.target.value)}
                inputId="credit-limit"
                data-testid="credit-limit"
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="block-new-invoices"
                  checked={formData.blockNewInvoices}
                  onChange={(e) => handleChange('blockNewInvoices', e.target.checked)}
                  className="h-4 w-4 rounded border-[#d1d5db] text-[#0078c8]"
                  data-testid="block-new-invoices"
                />
                <label htmlFor="block-new-invoices" className="text-sm text-[#1a1a2e]">
                  Block new invoices when credit limit is reached
                </label>
              </div>
              <Select
                label="Branding Theme"
                options={BRANDING_THEME_OPTIONS}
                value={formData.brandingTheme}
                onChange={(e) => handleChange('brandingTheme', e.target.value)}
                selectId="branding-theme"
                data-testid="branding-theme"
              />
              <Combobox
                label="Region"
                placeholder="Search regions..."
                options={REGION_OPTIONS}
                value={formData.salesRegion}
                onChange={(val) => handleChange('salesRegion', val)}
                className="w-full"
              />
              <Input
                label="Xero Network Key"
                value={formData.xeroNetworkKey}
                onChange={(e) => handleChange('xeroNetworkKey', e.target.value)}
                inputId="xero-network-key"
                data-testid="xero-network-key"
              />
              <Combobox
                label="Default Account Code"
                placeholder="Search accounts..."
                options={resolvedAccountOptions}
                value={formData.defaultAccountCode}
                onChange={(val) => handleChange('defaultAccountCode', val)}
                onCreateNew={() => navigate({ to: '/accounting/chart-of-accounts/new' })}
                className="w-full"
              />
              <Combobox
                label="Default Tax Rate"
                placeholder="Search tax rates..."
                options={resolvedTaxRateOptions}
                value={formData.defaultTaxRate}
                onChange={(val) => handleChange('defaultTaxRate', val)}
                className="w-full"
              />
            </div>
          )}

          {/* Purchase Defaults Section */}
          {activeSection === 'purchase-defaults' && (
            <div className="space-y-4" data-testid="section-purchase-defaults">
              <Combobox
                label="Purchase Account"
                placeholder="Search accounts..."
                options={resolvedAccountOptions}
                value={formData.purchaseAccount}
                onChange={(val) => handleChange('purchaseAccount', val)}
                onCreateNew={() => navigate({ to: '/accounting/chart-of-accounts/new' })}
                className="w-full"
              />
              <Select
                label="Bill Due Date"
                options={DUE_DATE_OPTIONS}
                value={formData.billDueDate}
                onChange={(e) => handleChange('billDueDate', e.target.value)}
                selectId="bill-due-date"
                data-testid="bill-due-date"
              />
              <Select
                label="Amounts are"
                options={AMOUNTS_ARE_OPTIONS}
                value={formData.purchaseAmountsAre}
                onChange={(e) => handleChange('purchaseAmountsAre', e.target.value)}
                selectId="purchase-amounts-are"
                data-testid="purchase-amounts-are"
              />
              <Combobox
                label="Purchase GST"
                placeholder="Search tax rates..."
                options={resolvedTaxRateOptions}
                value={formData.purchaseGst}
                onChange={(val) => handleChange('purchaseGst', val)}
                className="w-full"
              />
              <Combobox
                label="Region"
                placeholder="Search regions..."
                options={REGION_OPTIONS}
                value={formData.purchaseRegion}
                onChange={(val) => handleChange('purchaseRegion', val)}
                className="w-full"
              />
            </div>
          )}
        </form>
      </div>
    </Dialog>
  );
}
