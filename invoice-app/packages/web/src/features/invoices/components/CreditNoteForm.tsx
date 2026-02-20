import { useState, useCallback } from 'react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Combobox } from '../../../components/ui/Combobox';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import type { CreditNoteType } from '../hooks/useCreditNotes';

export interface CreditNoteFormData {
  type: CreditNoteType;
  contactId: string;
  contactName: string;
  date: string;
  subTotal: number;
  totalTax: number;
  total: number;
  linkedInvoiceId: string;
  linkedBillId: string;
}

interface CreditNoteFormProps {
  contacts?: Array<{ value: string; label: string }>;
  initialData?: Partial<CreditNoteFormData>;
  creditNoteNumber?: string;
  onSaveDraft: (data: CreditNoteFormData) => void;
  onSubmit: (data: CreditNoteFormData) => void;
  isSaving?: boolean;
}

const TYPE_OPTIONS = [
  { value: 'sales', label: 'Sales Credit Note' },
  { value: 'purchase', label: 'Purchase Credit Note' },
];


function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function CreditNoteForm({
  contacts = [],
  initialData,
  creditNoteNumber,
  onSaveDraft,
  onSubmit,
  isSaving = false,
}: CreditNoteFormProps) {
  const [type, setType] = useState<CreditNoteType>(initialData?.type ?? 'sales');
  const [contactId, setContactId] = useState(initialData?.contactId ?? '');
  const [date, setDate] = useState(initialData?.date ?? todayStr());
  const [subTotal, setSubTotal] = useState(String(initialData?.subTotal ?? ''));
  const [totalTax, setTotalTax] = useState(String(initialData?.totalTax ?? ''));
  const [total, setTotal] = useState(String(initialData?.total ?? ''));
  const [linkedInvoiceId, setLinkedInvoiceId] = useState(initialData?.linkedInvoiceId ?? '');
  const [linkedBillId, setLinkedBillId] = useState(initialData?.linkedBillId ?? '');

  const getFormData = useCallback((): CreditNoteFormData => {
    const contact = contacts.find((c) => c.value === contactId);
    return {
      type,
      contactId,
      contactName: contact?.label ?? '',
      date,
      subTotal: parseFloat(subTotal) || 0,
      totalTax: parseFloat(totalTax) || 0,
      total: parseFloat(total) || 0,
      linkedInvoiceId,
      linkedBillId,
    };
  }, [contacts, type, contactId, date, subTotal, totalTax, total, linkedInvoiceId, linkedBillId]);

  return (
    <div className="space-y-6" data-testid="credit-note-form">
      <Card>
        <CardContent className="space-y-6 p-6">
          {/* Type + Contact */}
          <div className="grid grid-cols-3 gap-6">
            <Select
              label="Type"
              options={TYPE_OPTIONS}
              value={type}
              onChange={(e) => setType(e.target.value as CreditNoteType)}
              data-testid="form-type"
            />
            <Combobox
              label="Contact"
              options={contacts}
              value={contactId}
              onChange={(v) => setContactId(v)}
              placeholder="Select a contact..."
              data-testid="form-contact"
            />
            <Input
              label="Credit Note Number"
              value={creditNoteNumber ?? 'CN-AUTO'}
              disabled
              data-testid="form-credit-note-number"
            />
          </div>

          {/* Date */}
          <div className="grid grid-cols-3 gap-6">
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              data-testid="form-date"
            />
            <Input
              label="Linked Invoice ID"
              value={linkedInvoiceId}
              onChange={(e) => setLinkedInvoiceId(e.target.value)}
              placeholder="Optional invoice ID"
              data-testid="form-linked-invoice"
            />
            <Input
              label="Linked Bill ID"
              value={linkedBillId}
              onChange={(e) => setLinkedBillId(e.target.value)}
              placeholder="Optional bill ID"
              data-testid="form-linked-bill"
            />
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-3 gap-6">
            <Input
              label="Subtotal"
              type="number"
              value={subTotal}
              onChange={(e) => setSubTotal(e.target.value)}
              placeholder="0.00"
              data-testid="form-subtotal"
            />
            <Input
              label="Total Tax"
              type="number"
              value={totalTax}
              onChange={(e) => setTotalTax(e.target.value)}
              placeholder="0.00"
              data-testid="form-total-tax"
            />
            <Input
              label="Total"
              type="number"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              placeholder="0.00"
              data-testid="form-total"
            />
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3" data-testid="form-actions">
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
          Submit for Approval
        </Button>
      </div>
    </div>
  );
}

export { TYPE_OPTIONS };
