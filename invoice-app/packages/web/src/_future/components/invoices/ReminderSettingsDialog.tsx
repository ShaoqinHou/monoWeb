import { useState, useCallback } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

export interface ReminderSettings {
  daysBeforeDue: number;
  daysAfterDue: number;
  templateText: string;
}

export interface ReminderSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (settings: ReminderSettings) => void;
  initialSettings?: ReminderSettings;
}

const DEFAULT_SETTINGS: ReminderSettings = {
  daysBeforeDue: 7,
  daysAfterDue: 1,
  templateText: 'This is a friendly reminder that your invoice is due soon.',
};

export function ReminderSettingsDialog({
  open,
  onClose,
  onSave,
  initialSettings,
}: ReminderSettingsDialogProps) {
  const [settings, setSettings] = useState<ReminderSettings>(
    initialSettings ?? DEFAULT_SETTINGS,
  );

  const handleSave = useCallback(() => {
    onSave(settings);
    onClose();
  }, [settings, onSave, onClose]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Payment Reminder Settings"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            data-testid="reminder-cancel-button"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            data-testid="reminder-save-button"
          >
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4" data-testid="reminder-settings-dialog">
        <Input
          label="Days before due date"
          type="number"
          value={String(settings.daysBeforeDue)}
          onChange={(e) =>
            setSettings((s) => ({ ...s, daysBeforeDue: Number(e.target.value) }))
          }
          data-testid="reminder-days-before"
        />
        <Input
          label="Days after due date"
          type="number"
          value={String(settings.daysAfterDue)}
          onChange={(e) =>
            setSettings((s) => ({ ...s, daysAfterDue: Number(e.target.value) }))
          }
          data-testid="reminder-days-after"
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#1a1a2e]">
            Reminder Template
          </label>
          <textarea
            value={settings.templateText}
            onChange={(e) =>
              setSettings((s) => ({ ...s, templateText: e.target.value }))
            }
            className="w-full rounded border border-[#e5e7eb] px-3 py-2 text-sm text-[#1a1a2e] focus:border-[#0078c8] focus:outline-none focus:ring-2 focus:ring-[#0078c8]/20"
            rows={4}
            data-testid="reminder-template-text"
          />
        </div>
      </div>
    </Dialog>
  );
}
