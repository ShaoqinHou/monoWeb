import { useState, useEffect } from 'react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardFooter } from '../../../components/ui/Card';
import type { OrganizationSettings } from '../types';

interface TaxSettingsProps {
  settings: OrganizationSettings;
  onSave: (updates: Partial<OrganizationSettings>) => void;
  saving?: boolean;
}

const TAX_RATE_OPTIONS = [
  { value: '15', label: '15% GST' },
  { value: '0', label: '0% (No GST)' },
];

const FILING_FREQUENCY_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'bi-monthly', label: 'Bi-monthly (every 2 months)' },
  { value: 'six-monthly', label: 'Six-monthly' },
];

export function TaxSettings({ settings, onSave, saving }: TaxSettingsProps) {
  const [defaultTaxRate, setDefaultTaxRate] = useState(
    String(settings.defaultTaxRate),
  );
  const [gstNumber, setGstNumber] = useState(settings.gstNumber);
  const [gstFilingFrequency, setGstFilingFrequency] = useState(
    settings.gstFilingFrequency,
  );

  useEffect(() => {
    setDefaultTaxRate(String(settings.defaultTaxRate));
    setGstNumber(settings.gstNumber);
    setGstFilingFrequency(settings.gstFilingFrequency);
  }, [settings]);

  const handleSave = () => {
    onSave({
      defaultTaxRate: Number(defaultTaxRate),
      gstNumber,
      gstFilingFrequency,
    });
  };

  return (
    <Card>
      <CardContent>
        <div className="space-y-4 py-2">
          <Select
            label="Default Tax Rate"
            options={TAX_RATE_OPTIONS}
            value={defaultTaxRate}
            onChange={(e) => setDefaultTaxRate(e.target.value)}
            selectId="default-tax-rate"
          />
          <Input
            label="GST Registration Number"
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value)}
            inputId="gst-registration-number"
          />
          <Select
            label="Filing Frequency"
            options={FILING_FREQUENCY_OPTIONS}
            value={gstFilingFrequency}
            onChange={(e) =>
              setGstFilingFrequency(
                e.target.value as OrganizationSettings['gstFilingFrequency'],
              )
            }
            selectId="filing-frequency"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} loading={saving} data-testid="save-tax">
          Save
        </Button>
      </CardFooter>
    </Card>
  );
}
