import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Dialog } from '../../../components/ui/Dialog';
import {
  useKiwiSaver,
  useUpdateKiwiSaver,
  KIWISAVER_EMPLOYEE_RATES,
  KIWISAVER_EMPLOYER_RATE,
} from '../hooks/useKiwiSaver';
import type { KiwiSaverEmployeeRate } from '../hooks/useKiwiSaver';

interface KiwiSaverSettingsProps {
  employeeId: string;
}

const RATE_OPTIONS = KIWISAVER_EMPLOYEE_RATES.map((rate) => ({
  value: String(rate),
  label: `${rate}%`,
}));

export function KiwiSaverSettings({ employeeId }: KiwiSaverSettingsProps) {
  const { data: settings, isLoading } = useKiwiSaver(employeeId);
  const updateMutation = useUpdateKiwiSaver();
  const [showOptOutDialog, setShowOptOutDialog] = useState(false);

  if (isLoading || !settings) {
    return <div data-testid="kiwisaver-loading">Loading KiwiSaver settings...</div>;
  }

  const handleRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rate = parseInt(e.target.value, 10) as KiwiSaverEmployeeRate;
    updateMutation.mutate({ employeeId, employeeRate: rate });
  };

  const handleOptOutToggle = () => {
    if (!settings.optedOut) {
      setShowOptOutDialog(true);
    } else {
      updateMutation.mutate({ employeeId, optedOut: false });
    }
  };

  const confirmOptOut = () => {
    updateMutation.mutate({ employeeId, optedOut: true });
    setShowOptOutDialog(false);
  };

  return (
    <div className="space-y-6" data-testid="kiwisaver-settings">
      <h3 className="text-lg font-semibold text-[#1a1a2e]">KiwiSaver Settings</h3>
      <p className="text-sm text-[#6b7280]">
        Employee: <span className="font-medium text-[#1a1a2e]">{settings.employeeName}</span>
      </p>

      {/* Employee Contribution Rate */}
      <div className="max-w-xs">
        <Select
          label="Employee Contribution Rate"
          options={RATE_OPTIONS}
          value={String(settings.employeeRate)}
          onChange={handleRateChange}
          disabled={settings.optedOut}
          aria-label="Employee contribution rate"
        />
      </div>

      {/* Employer Rate (info only) */}
      <div className="rounded border border-[#e5e7eb] bg-[#f8f9fa] p-4">
        <p className="text-sm text-[#6b7280]">
          Employer Contribution Rate: <span className="font-semibold text-[#1a1a2e]">{KIWISAVER_EMPLOYER_RATE}%</span>
          <span className="ml-2 text-xs">(fixed by legislation)</span>
        </p>
      </div>

      {/* ESCT Rate */}
      <div className="rounded border border-[#e5e7eb] bg-[#f8f9fa] p-4">
        <p className="text-sm text-[#6b7280]">
          ESCT Rate: <span className="font-semibold text-[#1a1a2e]" data-testid="esct-rate">{settings.esctRate}%</span>
          <span className="ml-2 text-xs">(based on annual salary of ${settings.annualSalary.toLocaleString('en-NZ')})</span>
        </p>
      </div>

      {/* Opt-out Toggle */}
      <div className="flex items-center gap-4">
        <Button
          variant={settings.optedOut ? 'primary' : 'destructive'}
          size="sm"
          onClick={handleOptOutToggle}
          data-testid="kiwisaver-opt-out-btn"
        >
          {settings.optedOut ? 'Opt Back In' : 'Opt Out of KiwiSaver'}
        </Button>
        {settings.optedOut && (
          <span className="text-sm font-medium text-red-600" data-testid="opted-out-badge">Opted Out</span>
        )}
      </div>

      {/* Opt-out Confirmation Dialog */}
      <Dialog
        open={showOptOutDialog}
        onClose={() => setShowOptOutDialog(false)}
        title="Confirm KiwiSaver Opt-Out"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setShowOptOutDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={confirmOptOut} data-testid="confirm-opt-out-btn">
              Confirm Opt-Out
            </Button>
          </>
        }
      >
        <p className="text-sm text-[#6b7280]">
          Are you sure you want to opt out of KiwiSaver for {settings.employeeName}?
          This will stop both employee and employer contributions. The employee can opt back in at any time.
        </p>
      </Dialog>
    </div>
  );
}
