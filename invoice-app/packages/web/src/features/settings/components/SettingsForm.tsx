import { useState, useEffect } from 'react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader } from '../../../components/ui/Card';

interface SettingsFormProps {
  settings: Record<string, string>;
  onSave: (key: string, value: string) => void;
  saving?: boolean;
}

/** Standard org setting fields */
const SETTING_FIELDS = [
  { key: 'org_name', label: 'Organisation Name', placeholder: 'Your company name' },
  { key: 'country', label: 'Country', placeholder: 'NZ' },
  { key: 'tax_id', label: 'Tax ID / GST Number', placeholder: '123-456-789' },
  { key: 'industry', label: 'Industry', placeholder: 'Professional Services' },
  { key: 'base_currency', label: 'Base Currency', placeholder: 'NZD' },
  { key: 'financial_year_end', label: 'Financial Year End Month', placeholder: '3' },
  { key: 'default_payment_terms', label: 'Default Payment Terms (days)', placeholder: '30' },
  { key: 'contact_email', label: 'Contact Email', placeholder: 'info@example.com' },
  { key: 'contact_phone', label: 'Contact Phone', placeholder: '+64 0000 0000' },
];

export function SettingsForm({ settings, onSave, saving }: SettingsFormProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const field of SETTING_FIELDS) {
      initial[field.key] = settings[field.key] ?? '';
    }
    setValues(initial);
  }, [settings]);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (key: string) => {
    const value = values[key];
    if (value !== undefined) {
      onSave(key, value);
    }
  };

  const handleSaveAll = () => {
    for (const field of SETTING_FIELDS) {
      const value = values[field.key];
      if (value !== undefined && value !== (settings[field.key] ?? '')) {
        onSave(field.key, value);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-[#1a1a2e]">
          Organisation Settings
        </h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-4" data-testid="settings-form">
          {SETTING_FIELDS.map((field) => (
            <div key={field.key} className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label={field.label}
                  value={values[field.key] ?? ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  inputId={`setting-${field.key}`}
                  placeholder={field.placeholder}
                />
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleSave(field.key)}
                loading={saving}
                data-testid={`save-setting-${field.key}`}
              >
                Save
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSaveAll}
          loading={saving}
          data-testid="save-all-settings"
        >
          Save All Changes
        </Button>
      </CardFooter>
    </Card>
  );
}
