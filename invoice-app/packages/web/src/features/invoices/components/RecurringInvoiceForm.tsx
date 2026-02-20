import { useState, useCallback, useMemo } from 'react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Combobox } from '../../../components/ui/Combobox';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import { Plus, Trash2 } from 'lucide-react';
import type { RecurringFrequency, CreateRecurringInvoice, UpdateRecurringInvoice } from '../hooks/useRecurringInvoices';

export interface RecurringLineItem {
  key: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount: number;
}

export interface RecurringInvoiceFormData {
  templateName: string;
  contactId: string;
  frequency: RecurringFrequency;
  nextDate: string;
  endDate: string;
  daysUntilDue: number;
  reference: string;
  lineItems: RecurringLineItem[];
}

interface RecurringInvoiceFormProps {
  contacts?: Array<{ value: string; label: string }>;
  initialData?: Partial<RecurringInvoiceFormData>;
  onSubmit: (data: RecurringInvoiceFormData) => void;
  isSaving?: boolean;
}

const FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'fortnightly', label: 'Fortnightly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'bimonthly', label: 'Bimonthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];


function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function createEmptyLine(): RecurringLineItem {
  return {
    key: crypto.randomUUID(),
    description: '',
    quantity: 1,
    unitPrice: 0,
    taxRate: 15,
    discount: 0,
  };
}

export function RecurringInvoiceForm({
  contacts = [],
  initialData,
  onSubmit,
  isSaving = false,
}: RecurringInvoiceFormProps) {
  const [templateName, setTemplateName] = useState(initialData?.templateName ?? '');
  const [contactId, setContactId] = useState(initialData?.contactId ?? '');
  const [frequency, setFrequency] = useState<RecurringFrequency>(
    initialData?.frequency ?? 'monthly',
  );
  const [nextDate, setNextDate] = useState(initialData?.nextDate ?? todayStr());
  const [endDate, setEndDate] = useState(initialData?.endDate ?? '');
  const [daysUntilDue, setDaysUntilDue] = useState(initialData?.daysUntilDue ?? 30);
  const [reference, setReference] = useState(initialData?.reference ?? '');
  const [lineItems, setLineItems] = useState<RecurringLineItem[]>(
    initialData?.lineItems ?? [createEmptyLine()],
  );

  const totals = useMemo(() => {
    let subTotal = 0;
    let totalTax = 0;
    for (const li of lineItems) {
      const lineAmount = li.quantity * li.unitPrice * (1 - li.discount / 100);
      subTotal += lineAmount;
      totalTax += lineAmount * (li.taxRate / 100);
    }
    return { subTotal, totalTax, total: subTotal + totalTax };
  }, [lineItems]);

  const getFormData = useCallback((): RecurringInvoiceFormData => {
    return {
      templateName,
      contactId,
      frequency,
      nextDate,
      endDate,
      daysUntilDue,
      reference,
      lineItems,
    };
  }, [templateName, contactId, frequency, nextDate, endDate, daysUntilDue, reference, lineItems]);

  const handleAddLine = () => {
    setLineItems((prev) => [...prev, createEmptyLine()]);
  };

  const handleRemoveLine = (key: string) => {
    setLineItems((prev) => prev.filter((li) => li.key !== key));
  };

  const handleLineChange = (key: string, field: keyof RecurringLineItem, value: string | number) => {
    setLineItems((prev) =>
      prev.map((li) => (li.key === key ? { ...li, [field]: value } : li)),
    );
  };

  return (
    <div className="space-y-6" data-testid="recurring-invoice-form">
      <Card>
        <CardContent className="space-y-6 p-6">
          {/* Template name + Contact */}
          <div className="grid grid-cols-2 gap-6">
            <Input
              label="Template Name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. Monthly Retainer"
              data-testid="form-template-name"
            />
            <Combobox
              label="Contact"
              options={contacts}
              value={contactId}
              onChange={(v) => setContactId(v)}
              placeholder="Select a contact..."
              data-testid="form-contact"
            />
          </div>

          {/* Schedule fields */}
          <div className="grid grid-cols-3 gap-6">
            <Select
              label="Frequency"
              options={FREQUENCY_OPTIONS}
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
              data-testid="form-frequency"
            />
            <Input
              label="Start / Next Invoice Date"
              type="date"
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
              data-testid="form-next-date"
            />
            <Input
              label="End Date (optional)"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              data-testid="form-end-date"
            />
          </div>

          <div className="grid grid-cols-3 gap-6">
            <Input
              label="Days Until Due"
              type="number"
              value={String(daysUntilDue)}
              onChange={(e) => setDaysUntilDue(parseInt(e.target.value, 10) || 0)}
              data-testid="form-days-until-due"
            />
            <Input
              label="Reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Optional reference"
              data-testid="form-reference"
            />
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Line Items</h3>
          <div className="space-y-2" data-testid="recurring-line-items">
            {/* Header row */}
            <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 uppercase px-1">
              <div className="col-span-4">Description</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-2 text-right">Unit Price</div>
              <div className="col-span-1 text-right">Tax %</div>
              <div className="col-span-1 text-right">Disc %</div>
              <div className="col-span-1 text-right">Amount</div>
              <div className="col-span-1" />
            </div>

            {lineItems.map((li, index) => {
              const lineAmount = li.quantity * li.unitPrice * (1 - li.discount / 100);
              return (
                <div
                  key={li.key}
                  className="grid grid-cols-12 gap-2 items-center"
                  data-testid={`recurring-line-row-${index}`}
                >
                  <div className="col-span-4">
                    <Input
                      value={li.description}
                      onChange={(e) => handleLineChange(li.key, 'description', e.target.value)}
                      placeholder="Description"
                      data-testid={`line-description-${index}`}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={String(li.quantity)}
                      onChange={(e) => handleLineChange(li.key, 'quantity', parseFloat(e.target.value) || 0)}
                      data-testid={`line-quantity-${index}`}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={String(li.unitPrice)}
                      onChange={(e) => handleLineChange(li.key, 'unitPrice', parseFloat(e.target.value) || 0)}
                      data-testid={`line-unit-price-${index}`}
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      value={String(li.taxRate)}
                      onChange={(e) => handleLineChange(li.key, 'taxRate', parseFloat(e.target.value) || 0)}
                      data-testid={`line-tax-rate-${index}`}
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      value={String(li.discount)}
                      onChange={(e) => handleLineChange(li.key, 'discount', parseFloat(e.target.value) || 0)}
                      data-testid={`line-discount-${index}`}
                    />
                  </div>
                  <div className="col-span-1 text-right text-sm font-medium">
                    {lineAmount.toFixed(2)}
                  </div>
                  <div className="col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(li.key)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      data-testid={`remove-line-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddLine}
              data-testid="add-line-button"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add a Line
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-end" data-testid="recurring-totals">
            <div className="w-72 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span data-testid="totals-subtotal">{totals.subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span data-testid="totals-tax">{totals.totalTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold">
                <span>Total</span>
                <span data-testid="totals-total">{totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3" data-testid="form-actions">
        <Button
          variant="primary"
          onClick={() => onSubmit(getFormData())}
          disabled={isSaving || !contactId || !templateName}
          loading={isSaving}
          data-testid="save-recurring-button"
        >
          Save Recurring Invoice
        </Button>
      </div>
    </div>
  );
}

export { FREQUENCY_OPTIONS };
