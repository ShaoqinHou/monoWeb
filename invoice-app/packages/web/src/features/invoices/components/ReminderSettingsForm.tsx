import { useState, useCallback } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardContent } from '../../../components/ui/Card';

export interface ReminderFormSettings {
  daysBeforeDue: number[];
  daysAfterDue: number[];
  templateText: string;
}

interface ReminderSettingsFormProps {
  initialSettings?: ReminderFormSettings;
  onSave: (settings: ReminderFormSettings) => void;
  isSaving?: boolean;
}

const DEFAULT_BEFORE = [7, 3, 1];
const DEFAULT_AFTER = [1, 7, 14];
const DEFAULT_TEMPLATE = 'This is a friendly reminder that your invoice is due soon. Please arrange payment at your earliest convenience.';

export function ReminderSettingsForm({
  initialSettings,
  onSave,
  isSaving = false,
}: ReminderSettingsFormProps) {
  const [daysBeforeDue, setDaysBeforeDue] = useState<number[]>(
    initialSettings?.daysBeforeDue ?? DEFAULT_BEFORE,
  );
  const [daysAfterDue, setDaysAfterDue] = useState<number[]>(
    initialSettings?.daysAfterDue ?? DEFAULT_AFTER,
  );
  const [templateText, setTemplateText] = useState(
    initialSettings?.templateText ?? DEFAULT_TEMPLATE,
  );

  const handleBeforeChange = useCallback((index: number, value: string) => {
    setDaysBeforeDue((prev) => {
      const next = [...prev];
      next[index] = Number(value) || 0;
      return next;
    });
  }, []);

  const handleAfterChange = useCallback((index: number, value: string) => {
    setDaysAfterDue((prev) => {
      const next = [...prev];
      next[index] = Number(value) || 0;
      return next;
    });
  }, []);

  const addBeforeDay = useCallback(() => {
    setDaysBeforeDue((prev) => [...prev, 1]);
  }, []);

  const addAfterDay = useCallback(() => {
    setDaysAfterDue((prev) => [...prev, 1]);
  }, []);

  const removeBeforeDay = useCallback((index: number) => {
    setDaysBeforeDue((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const removeAfterDay = useCallback((index: number) => {
    setDaysAfterDue((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = useCallback(() => {
    onSave({ daysBeforeDue, daysAfterDue, templateText });
  }, [daysBeforeDue, daysAfterDue, templateText, onSave]);

  return (
    <div className="space-y-6" data-testid="reminder-settings-form">
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Days Before Due Date</h3>
          <div className="space-y-2" data-testid="before-due-section">
            {daysBeforeDue.map((days, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  type="number"
                  value={String(days)}
                  onChange={(e) => handleBeforeChange(i, e.target.value)}
                  data-testid={`before-due-day-${i}`}
                  className="w-24"
                />
                <span className="text-sm text-gray-500">days before</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeBeforeDay(i)}
                  data-testid={`remove-before-${i}`}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={addBeforeDay}
              data-testid="add-before-day"
            >
              Add Reminder
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Days After Overdue</h3>
          <div className="space-y-2" data-testid="after-due-section">
            {daysAfterDue.map((days, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  type="number"
                  value={String(days)}
                  onChange={(e) => handleAfterChange(i, e.target.value)}
                  data-testid={`after-due-day-${i}`}
                  className="w-24"
                />
                <span className="text-sm text-gray-500">days after</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeAfterDay(i)}
                  data-testid={`remove-after-${i}`}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={addAfterDay}
              data-testid="add-after-day"
            >
              Add Reminder
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Reminder Message Template</h3>
          <textarea
            value={templateText}
            onChange={(e) => setTemplateText(e.target.value)}
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078c8]/20 focus:border-[#0078c8]"
            rows={4}
            data-testid="reminder-template-input"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={isSaving}
          loading={isSaving}
          data-testid="save-reminder-settings"
        >
          Save Reminder Settings
        </Button>
      </div>
    </div>
  );
}
