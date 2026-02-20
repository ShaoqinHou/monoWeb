import { useState, useEffect } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Combobox } from '../../../components/ui/Combobox';
import { Button } from '../../../components/ui/Button';
import { Dialog } from '../../../components/ui/Dialog';
import { PayItemList } from '../components/PayItemList';
import { showToast } from '../../dashboard/components/ToastContainer';
import { useApiSettings, useUpdateApiSetting } from '../../settings/hooks/useApiSettings';
import { usePayItems, useCreatePayItem, useUpdatePayItem, useDeletePayItem } from '../hooks/usePayItems';
import type { PayItem, PayItemType, PayItemRateType, CreatePayItemInput } from '../hooks/usePayItems';

// ── Payroll Settings Types ──────────────────────────────────────────────────

interface PayrollSettings {
  payCalendarFrequency: 'weekly' | 'fortnightly' | 'monthly';
  wagesExpenseAccount: string;
  payeLiabilityAccount: string;
  kiwiSaverAccount: string;
  filingFrequency: 'monthly' | 'twice-monthly';
  irdNumber: string;
}

const FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'fortnightly', label: 'Fortnightly' },
  { value: 'monthly', label: 'Monthly' },
];

const FILING_FREQUENCY_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'twice-monthly', label: 'Twice Monthly' },
];

const DEFAULT_SETTINGS: PayrollSettings = {
  payCalendarFrequency: 'monthly',
  wagesExpenseAccount: '200 - Wages & Salaries',
  payeLiabilityAccount: '820 - PAYE Payable',
  kiwiSaverAccount: '821 - KiwiSaver Payable',
  filingFrequency: 'monthly',
  irdNumber: '',
};

const SETTING_KEYS: (keyof PayrollSettings)[] = [
  'payCalendarFrequency',
  'wagesExpenseAccount',
  'payeLiabilityAccount',
  'kiwiSaverAccount',
  'filingFrequency',
  'irdNumber',
];

// ── Pay Item Form Types ─────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: 'earnings', label: 'Earnings' },
  { value: 'deduction', label: 'Deduction' },
  { value: 'reimbursement', label: 'Reimbursement' },
  { value: 'tax', label: 'Tax' },
];

const RATE_TYPE_OPTIONS = [
  { value: 'fixed', label: 'Fixed Amount' },
  { value: 'per_hour', label: 'Per Hour' },
  { value: 'percentage', label: 'Percentage' },
];

interface PayItemFormState {
  name: string;
  type: PayItemType;
  rateType: PayItemRateType;
  amount: string;
  accountCode: string;
  isDefault: boolean;
  isActive: boolean;
}

const INITIAL_FORM: PayItemFormState = {
  name: '',
  type: 'earnings',
  rateType: 'fixed',
  amount: '',
  accountCode: '',
  isDefault: false,
  isActive: true,
};

// ── Side Nav Sections ───────────────────────────────────────────────────────

type SettingsSection = 'organisation' | 'pay-frequencies' | 'holidays' | 'pay-items' | 'filing' | 'tracking';

const SECTIONS: { key: SettingsSection; label: string }[] = [
  { key: 'organisation', label: 'Organisation' },
  { key: 'pay-frequencies', label: 'Pay Frequencies' },
  { key: 'holidays', label: 'Holidays' },
  { key: 'pay-items', label: 'Pay Items' },
  { key: 'filing', label: 'Payroll Filing' },
  { key: 'tracking', label: 'Payroll Tracking' },
];

// ── Pay Items Section ───────────────────────────────────────────────────────

function PayItemsSection() {
  const { data: items, isLoading } = usePayItems();
  const createPayItem = useCreatePayItem();
  const updatePayItem = useUpdatePayItem();
  const deletePayItem = useDeletePayItem();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PayItem | null>(null);
  const [form, setForm] = useState<PayItemFormState>(INITIAL_FORM);

  // Suppress unused var warning — delete hook used for future delete button wiring
  void deletePayItem;

  const openCreate = () => {
    setEditingItem(null);
    setForm(INITIAL_FORM);
    setShowForm(true);
  };

  const openEdit = (item: PayItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      type: item.type,
      rateType: item.rateType,
      amount: String(item.amount),
      accountCode: item.accountCode ?? '',
      isDefault: item.isDefault,
      isActive: item.isActive,
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: CreatePayItemInput = {
      name: form.name,
      type: form.type,
      rateType: form.rateType,
      amount: parseFloat(form.amount) || 0,
      accountCode: form.accountCode || undefined,
      isDefault: form.isDefault,
      isActive: form.isActive,
    };

    if (editingItem) {
      updatePayItem.mutate(
        { id: editingItem.id, updates: data },
        {
          onSuccess: () => {
            setShowForm(false);
            showToast('success', 'Pay item updated');
          },
          onError: (err: Error) => showToast('error', err.message || 'Failed to update pay item'),
        },
      );
    } else {
      createPayItem.mutate(data, {
        onSuccess: () => {
          setShowForm(false);
          showToast('success', 'Pay item added');
        },
        onError: (err: Error) => showToast('error', err.message || 'Failed to add pay item'),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="text-[#6b7280]" data-testid="pay-items-loading">
        Loading pay items...
      </div>
    );
  }

  return (
    <div data-testid="payroll-settings-pay-items">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#1a1a2e]">Pay Items</h3>
        <Button size="sm" onClick={openCreate} data-testid="add-pay-item-btn">
          Add Pay Item
        </Button>
      </div>

      <PayItemList items={items ?? []} onEdit={openEdit} />

      <Dialog
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingItem ? 'Edit Pay Item' : 'Add Pay Item'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="pay-item-form"
              loading={createPayItem.isPending || updatePayItem.isPending}
            >
              {editingItem ? 'Save Changes' : 'Add Pay Item'}
            </Button>
          </>
        }
      >
        <form id="pay-item-form" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Select
            label="Type"
            options={TYPE_OPTIONS}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as PayItemType })}
          />
          <Select
            label="Rate Type"
            options={RATE_TYPE_OPTIONS}
            value={form.rateType}
            onChange={(e) => setForm({ ...form, rateType: e.target.value as PayItemRateType })}
          />
          <Input
            label="Amount"
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          <Input
            label="Account Code"
            value={form.accountCode}
            onChange={(e) => setForm({ ...form, accountCode: e.target.value })}
          />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                className="rounded border-gray-300"
              />
              Default
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded border-gray-300"
              />
              Active
            </label>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

// ── Organisation Section ─────────────────────────────────────────────────────

function OrganisationSection() {
  const { data: apiSettings, isLoading } = useApiSettings();
  const updateSetting = useUpdateApiSetting();
  const [settings, setSettings] = useState<PayrollSettings>(DEFAULT_SETTINGS);
  const [logoName, setLogoName] = useState('');

  useEffect(() => {
    if (apiSettings) {
      setSettings((prev) => {
        const next = { ...prev };
        for (const key of SETTING_KEYS) {
          const apiKey = `payroll.${key}`;
          if (apiSettings[apiKey]) {
            (next as Record<string, string>)[key] = apiSettings[apiKey];
          }
        }
        return next;
      });
    }
  }, [apiSettings]);

  const handleSave = async () => {
    for (const key of SETTING_KEYS) {
      const value = settings[key];
      if (value !== '') {
        updateSetting.mutate({ key: `payroll.${key}`, value: String(value) });
      }
    }
    showToast('success', 'Payroll settings saved');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoName(file.name);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl" data-testid="payroll-settings-organisation">
      {isLoading && (
        <p className="text-sm text-[#6b7280]">Loading settings...</p>
      )}

      {/* Company Logo */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-[#1a1a2e]">Company Logo</h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded bg-[#f3f4f6] flex items-center justify-center text-xs text-[#6b7280]">
              {logoName ? logoName.slice(0, 8) : 'No logo'}
            </div>
            <label className="cursor-pointer">
              <Button
                variant="outline"
                size="sm"
                data-testid="upload-logo-btn"
                onClick={() => document.getElementById('logo-upload-input')?.click()}
              >
                Upload Logo
              </Button>
              <input
                id="logo-upload-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
                data-testid="logo-upload-input"
              />
            </label>
            {logoName && <span className="text-sm text-[#6b7280]" data-testid="logo-filename">{logoName}</span>}
          </div>
        </CardContent>
      </Card>

      {/* Default Accounts */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-[#1a1a2e]">Default Accounts</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Combobox
              label="Bank Account"
              options={[
                { value: '090', label: '090: Business Bank Account' },
                { value: '091', label: '091: Savings Account' },
              ]}
              value={settings.wagesExpenseAccount.startsWith('090') ? '090' : settings.wagesExpenseAccount}
              onChange={(val) => setSettings((s) => ({ ...s, wagesExpenseAccount: val }))}
              placeholder="Search accounts..."
              data-testid="bank-account-combobox"
            />
            <Combobox
              label="Wages Expense Account"
              options={[
                { value: '477', label: '477: Salaries' },
                { value: '478', label: '478: Wages' },
                { value: '200', label: '200: Wages & Salaries' },
              ]}
              value={settings.wagesExpenseAccount}
              onChange={(val) => setSettings((s) => ({ ...s, wagesExpenseAccount: val }))}
              placeholder="Search accounts..."
              data-testid="wages-expense-combobox"
            />
            <Combobox
              label="PAYE Liability Account"
              options={[
                { value: '825', label: '825: PAYE Payable' },
                { value: '820', label: '820: PAYE Payable' },
              ]}
              value={settings.payeLiabilityAccount}
              onChange={(val) => setSettings((s) => ({ ...s, payeLiabilityAccount: val }))}
              placeholder="Search accounts..."
              data-testid="paye-liability-combobox"
            />
            <Combobox
              label="Wages Payable Account"
              options={[
                { value: '814', label: '814: Wages Payable - Payroll' },
                { value: '821', label: '821: KiwiSaver Payable' },
              ]}
              value={settings.kiwiSaverAccount}
              onChange={(val) => setSettings((s) => ({ ...s, kiwiSaverAccount: val }))}
              placeholder="Search accounts..."
              data-testid="wages-payable-combobox"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} data-testid="save-settings-btn">
          Save Settings
        </Button>
      </div>
    </div>
  );
}

// ── Pay Frequencies Section ──────────────────────────────────────────────────

function PayFrequenciesSection() {
  return (
    <div className="space-y-6 max-w-2xl" data-testid="payroll-settings-pay-frequencies">
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-[#1a1a2e]">Pay Calendar</h3>
        </CardHeader>
        <CardContent>
          <Select
            label="Pay Frequency"
            options={FREQUENCY_OPTIONS}
            value="monthly"
            onChange={() => {}}
            aria-label="Pay frequency"
          />
          <p className="mt-2 text-xs text-[#6b7280]">
            Set the default pay frequency for new employees.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Holidays Section ─────────────────────────────────────────────────────────

function HolidaysSection() {
  return (
    <div className="space-y-6 max-w-2xl" data-testid="payroll-settings-holidays">
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-[#1a1a2e]">Public Holidays</h3>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#6b7280]">
            Public holidays are automatically applied based on your region (New Zealand).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Payroll Filing Section ───────────────────────────────────────────────────

function PayrollFilingSection() {
  const [irdNumber, setIrdNumber] = useState('');
  const [employerSize, setEmployerSize] = useState('small');

  return (
    <div className="space-y-6 max-w-2xl" data-testid="payroll-settings-filing">
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-[#1a1a2e]">Payroll Filing</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              label="Employer IRD Number"
              value={irdNumber}
              onChange={(e) => setIrdNumber(e.target.value)}
              placeholder="e.g. 12-345-678"
              data-testid="employer-ird-number"
            />
            <Select
              label="Employer Size"
              options={[
                { value: 'small', label: 'Small (fewer than 50 employees)' },
                { value: 'medium', label: 'Medium (50-499 employees)' },
                { value: 'large', label: 'Large (500+ employees)' },
              ]}
              value={employerSize}
              onChange={(e) => setEmployerSize(e.target.value)}
              data-testid="employer-size"
            />
            <Select
              label="Filing Frequency"
              options={FILING_FREQUENCY_OPTIONS}
              value="monthly"
              onChange={() => {}}
              aria-label="Filing frequency"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Payroll Tracking Section ─────────────────────────────────────────────────

function PayrollTrackingSection() {
  const [employeeGroups, setEmployeeGroups] = useState('');
  const [timesheetCategories, setTimesheetCategories] = useState('');

  return (
    <div className="space-y-6 max-w-2xl" data-testid="payroll-settings-tracking">
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-[#1a1a2e]">Employee Groups</h3>
        </CardHeader>
        <CardContent>
          <Input
            label="Employee Groups"
            value={employeeGroups}
            onChange={(e) => setEmployeeGroups(e.target.value)}
            placeholder="e.g. Full-time, Part-time, Casual"
            data-testid="employee-groups-input"
          />
          <p className="mt-2 text-xs text-[#6b7280]">
            Comma-separated list of employee groups for reporting.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-[#1a1a2e]">Timesheet Categories</h3>
        </CardHeader>
        <CardContent>
          <Input
            label="Timesheet Categories"
            value={timesheetCategories}
            onChange={(e) => setTimesheetCategories(e.target.value)}
            placeholder="e.g. Regular, Overtime, Training"
            data-testid="timesheet-categories-input"
          />
          <p className="mt-2 text-xs text-[#6b7280]">
            Comma-separated list of timesheet categories.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export function PayrollSettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('organisation');

  return (
    <PageContainer
      title="Payroll Settings"
      breadcrumbs={[{ label: 'Payroll', href: '/payroll' }, { label: 'Settings' }]}
    >
      <div className="flex gap-8" data-testid="payroll-settings-page">
        {/* Side Nav */}
        <nav className="w-48 flex-shrink-0" data-testid="settings-side-nav">
          <ul className="space-y-1">
            {SECTIONS.map((section) => (
              <li key={section.key}>
                <button
                  type="button"
                  onClick={() => setActiveSection(section.key)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeSection === section.key
                      ? 'bg-[#0078c8] text-white'
                      : 'text-[#1a1a2e] hover:bg-[#f3f4f6]'
                  }`}
                  data-testid={`settings-nav-${section.key}`}
                  aria-current={activeSection === section.key ? 'page' : undefined}
                >
                  {section.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeSection === 'organisation' && <OrganisationSection />}
          {activeSection === 'pay-frequencies' && <PayFrequenciesSection />}
          {activeSection === 'holidays' && <HolidaysSection />}
          {activeSection === 'pay-items' && <PayItemsSection />}
          {activeSection === 'filing' && <PayrollFilingSection />}
          {activeSection === 'tracking' && <PayrollTrackingSection />}
        </div>
      </div>
    </PageContainer>
  );
}
