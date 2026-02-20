import { useState, useEffect } from 'react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardFooter } from '../../../components/ui/Card';
import type { OrganizationSettings } from '../types';

interface FinancialSettingsProps {
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

const CURRENCY_OPTIONS = [
  { value: 'NZD', label: 'NZD - New Zealand Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'EUR', label: 'EUR - Euro' },
];

const TAX_REGISTRATION_OPTIONS = [
  { value: 'GST', label: 'GST Registered' },
  { value: 'NONE', label: 'Not Registered' },
];

export function FinancialSettings({ settings, onSave, saving }: FinancialSettingsProps) {
  const [financialYearEnd, setFinancialYearEnd] = useState(String(settings.financialYearEnd));
  const [baseCurrency, setBaseCurrency] = useState(settings.baseCurrency);
  const [taxRegistration, setTaxRegistration] = useState(settings.taxRegistration);
  const [lockDate, setLockDate] = useState(settings.lockDate);
  const [defaultSalesAccount, setDefaultSalesAccount] = useState(settings.defaultSalesAccount);
  const [defaultPurchasesAccount, setDefaultPurchasesAccount] = useState(settings.defaultPurchasesAccount);

  useEffect(() => {
    setFinancialYearEnd(String(settings.financialYearEnd));
    setBaseCurrency(settings.baseCurrency);
    setTaxRegistration(settings.taxRegistration);
    setLockDate(settings.lockDate);
    setDefaultSalesAccount(settings.defaultSalesAccount);
    setDefaultPurchasesAccount(settings.defaultPurchasesAccount);
  }, [settings]);

  const handleSave = () => {
    onSave({
      financialYearEnd: Number(financialYearEnd),
      baseCurrency,
      taxRegistration,
      lockDate,
      defaultSalesAccount,
      defaultPurchasesAccount,
    });
  };

  return (
    <Card>
      <CardContent>
        <div className="space-y-4 py-2">
          <Select
            label="Financial Year End"
            options={MONTH_OPTIONS}
            value={financialYearEnd}
            onChange={(e) => setFinancialYearEnd(e.target.value)}
            selectId="fin-year-end"
          />
          <Select
            label="Base Currency"
            options={CURRENCY_OPTIONS}
            value={baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value)}
            selectId="base-currency"
          />
          <Select
            label="Tax Registration"
            options={TAX_REGISTRATION_OPTIONS}
            value={taxRegistration}
            onChange={(e) => setTaxRegistration(e.target.value)}
            selectId="tax-registration"
          />
          <Input
            label="Lock Date"
            type="date"
            value={lockDate}
            onChange={(e) => setLockDate(e.target.value)}
            inputId="lock-date"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Default Sales Account"
              value={defaultSalesAccount}
              onChange={(e) => setDefaultSalesAccount(e.target.value)}
              inputId="default-sales-account"
            />
            <Input
              label="Default Purchases Account"
              value={defaultPurchasesAccount}
              onChange={(e) => setDefaultPurchasesAccount(e.target.value)}
              inputId="default-purchases-account"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} loading={saving} data-testid="save-financial">
          Save
        </Button>
      </CardFooter>
    </Card>
  );
}
