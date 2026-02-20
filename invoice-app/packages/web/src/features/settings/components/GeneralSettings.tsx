import { useState, useEffect } from 'react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardFooter } from '../../../components/ui/Card';
import type { OrganizationSettings } from '../types';

interface GeneralSettingsProps {
  settings: OrganizationSettings;
  onSave: (updates: Partial<OrganizationSettings>) => void;
  saving?: boolean;
}

const MONTH_OPTIONS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export function GeneralSettings({ settings, onSave, saving }: GeneralSettingsProps) {
  const [name, setName] = useState(settings.name);
  const [industry, setIndustry] = useState(settings.industry);
  const [address, setAddress] = useState(settings.address);
  const [gstNumber, setGstNumber] = useState(settings.gstNumber);
  const [financialYearEnd, setFinancialYearEnd] = useState(
    String(settings.financialYearEnd),
  );

  useEffect(() => {
    setName(settings.name);
    setIndustry(settings.industry);
    setAddress(settings.address);
    setGstNumber(settings.gstNumber);
    setFinancialYearEnd(String(settings.financialYearEnd));
  }, [settings]);

  const handleSave = () => {
    onSave({
      name,
      industry,
      address,
      gstNumber,
      financialYearEnd: Number(financialYearEnd),
    });
  };

  return (
    <Card>
      <CardContent>
        <div className="space-y-4 py-2">
          <Input
            label="Organisation Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            inputId="org-name"
          />
          <Input
            label="Industry"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            inputId="industry"
          />
          <Input
            label="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            inputId="address"
          />
          <Input
            label="GST Number"
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value)}
            inputId="gst-number"
          />
          <Select
            label="Financial Year End"
            options={MONTH_OPTIONS}
            value={financialYearEnd}
            onChange={(e) => setFinancialYearEnd(e.target.value)}
            selectId="financial-year-end"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} loading={saving} data-testid="save-general">
          Save
        </Button>
      </CardFooter>
    </Card>
  );
}
