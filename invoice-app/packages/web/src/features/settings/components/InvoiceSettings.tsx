import { useState, useEffect } from 'react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardFooter } from '../../../components/ui/Card';
import type { OrganizationSettings } from '../types';

interface InvoiceSettingsProps {
  settings: OrganizationSettings;
  onSave: (updates: Partial<OrganizationSettings>) => void;
  saving?: boolean;
}

const PAYMENT_TERMS_OPTIONS = [
  { value: '0', label: 'Due on Receipt' },
  { value: '7', label: 'Net 7' },
  { value: '15', label: 'Net 15' },
  { value: '30', label: 'Net 30' },
  { value: '60', label: 'Net 60' },
];

export function InvoiceSettings({ settings, onSave, saving }: InvoiceSettingsProps) {
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState(
    String(settings.defaultPaymentTerms),
  );
  const [invoicePrefix, setInvoicePrefix] = useState(settings.invoicePrefix);
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(
    String(settings.nextInvoiceNumber),
  );
  const [billPrefix, setBillPrefix] = useState(settings.billPrefix);
  const [nextBillNumber, setNextBillNumber] = useState(
    String(settings.nextBillNumber),
  );

  useEffect(() => {
    setDefaultPaymentTerms(String(settings.defaultPaymentTerms));
    setInvoicePrefix(settings.invoicePrefix);
    setNextInvoiceNumber(String(settings.nextInvoiceNumber));
    setBillPrefix(settings.billPrefix);
    setNextBillNumber(String(settings.nextBillNumber));
  }, [settings]);

  const handleSave = () => {
    onSave({
      defaultPaymentTerms: Number(defaultPaymentTerms),
      invoicePrefix,
      nextInvoiceNumber: Number(nextInvoiceNumber),
      billPrefix,
      nextBillNumber: Number(nextBillNumber),
    });
  };

  return (
    <Card>
      <CardContent>
        <div className="space-y-4 py-2">
          <Select
            label="Default Payment Terms"
            options={PAYMENT_TERMS_OPTIONS}
            value={defaultPaymentTerms}
            onChange={(e) => setDefaultPaymentTerms(e.target.value)}
            selectId="payment-terms"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Invoice Prefix"
              value={invoicePrefix}
              onChange={(e) => setInvoicePrefix(e.target.value)}
              inputId="invoice-prefix"
            />
            <Input
              label="Next Invoice Number"
              type="number"
              value={nextInvoiceNumber}
              onChange={(e) => setNextInvoiceNumber(e.target.value)}
              inputId="next-invoice-number"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Bill Prefix"
              value={billPrefix}
              onChange={(e) => setBillPrefix(e.target.value)}
              inputId="bill-prefix"
            />
            <Input
              label="Next Bill Number"
              type="number"
              value={nextBillNumber}
              onChange={(e) => setNextBillNumber(e.target.value)}
              inputId="next-bill-number"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} loading={saving} data-testid="save-invoice">
          Save
        </Button>
      </CardFooter>
    </Card>
  );
}
