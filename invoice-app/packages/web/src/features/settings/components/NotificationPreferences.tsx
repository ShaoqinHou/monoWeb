import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { showToast } from '../../dashboard/components/ToastContainer';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  type NotificationPreferences as NotifPrefs,
} from '../hooks/useNotificationPreferences';

interface ToggleRowProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  testId: string;
  children?: React.ReactNode;
}

function ToggleRow({ label, checked, onChange, testId, children }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#e5e7eb]" data-testid={testId}>
      <div className="flex-1">
        <span className="text-sm font-medium text-[#1a1a2e]">{label}</span>
        {children && checked && (
          <div className="mt-2">{children}</div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0078c8] ${
          checked ? 'bg-[#0078c8]' : 'bg-gray-200'
        }`}
        data-testid={`${testId}-toggle`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

interface ThresholdInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  testId: string;
}

function ThresholdInput({ label, value, onChange, testId }: ThresholdInputProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-[#6b7280]">{label}</label>
      <input
        type="number"
        min={1}
        max={90}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-16 rounded border border-[#e5e7eb] px-2 py-1 text-sm"
        data-testid={testId}
      />
      <span className="text-xs text-[#6b7280]">days</span>
    </div>
  );
}

export function NotificationPreferences() {
  const { data: prefs, isLoading } = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();
  const [local, setLocal] = useState<NotifPrefs | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (prefs && !local) {
      setLocal({ ...prefs });
    }
  }, [prefs, local]);

  if (isLoading || !local) {
    return <p data-testid="loading">Loading...</p>;
  }

  const update = (patch: Partial<NotifPrefs>) => {
    setLocal((prev) => (prev ? { ...prev, ...patch } : prev));
    setSaved(false);
  };

  const handleSave = () => {
    if (local) {
      updatePrefs.mutate(local, {
        onSuccess: () => {
          setSaved(true);
          showToast('success', 'Notification preferences saved');
        },
        onError: (err: Error) => {
          showToast('error', err.message || 'Failed to save notification preferences');
        },
      });
    }
  };

  return (
    <div data-testid="notification-preferences">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#1a1a2e]">Notification Preferences</h2>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          loading={updatePrefs.isPending}
          data-testid="save-preferences"
        >
          Save
        </Button>
      </div>

      <div className="space-y-0">
        <ToggleRow
          label="Overdue invoice reminders"
          checked={local.overdueReminders}
          onChange={(v) => update({ overdueReminders: v })}
          testId="pref-overdue-reminders"
        >
          <ThresholdInput
            label="Alert after"
            value={local.overdueReminderDays}
            onChange={(v) => update({ overdueReminderDays: v })}
            testId="pref-overdue-days"
          />
        </ToggleRow>

        <ToggleRow
          label="Payment confirmations"
          checked={local.paymentConfirmations}
          onChange={(v) => update({ paymentConfirmations: v })}
          testId="pref-payment-confirmations"
        />

        <ToggleRow
          label="Quote expiry alerts"
          checked={local.quoteExpiryAlerts}
          onChange={(v) => update({ quoteExpiryAlerts: v })}
          testId="pref-quote-expiry"
        >
          <ThresholdInput
            label="Alert before"
            value={local.quoteExpiryDaysBefore}
            onChange={(v) => update({ quoteExpiryDaysBefore: v })}
            testId="pref-quote-days"
          />
        </ToggleRow>

        <ToggleRow
          label="Bill due alerts"
          checked={local.billDueAlerts}
          onChange={(v) => update({ billDueAlerts: v })}
          testId="pref-bill-due"
        >
          <ThresholdInput
            label="Alert before"
            value={local.billDueDaysBefore}
            onChange={(v) => update({ billDueDaysBefore: v })}
            testId="pref-bill-days"
          />
        </ToggleRow>

        <ToggleRow
          label="Bank feed updates"
          checked={local.bankFeedUpdates}
          onChange={(v) => update({ bankFeedUpdates: v })}
          testId="pref-bank-feed"
        />
      </div>

      {/* Saved marker used by automated tests — toast is the visible indicator */}
      {saved && <span className="sr-only" data-testid="preferences-saved" aria-live="polite" />}
    </div>
  );
}
