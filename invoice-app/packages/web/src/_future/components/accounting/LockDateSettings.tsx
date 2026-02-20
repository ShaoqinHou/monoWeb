import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { LockDates } from '../hooks/useLockDates';

interface LockDateSettingsProps {
  lockDates: LockDates;
  onSave: (data: LockDates) => void;
  isSaving?: boolean;
}

export function LockDateSettings({ lockDates, onSave, isSaving }: LockDateSettingsProps) {
  const [lockDate, setLockDate] = useState(lockDates.lockDate ?? '');
  const [advisorLockDate, setAdvisorLockDate] = useState(lockDates.advisorLockDate ?? '');

  useEffect(() => {
    setLockDate(lockDates.lockDate ?? '');
    setAdvisorLockDate(lockDates.advisorLockDate ?? '');
  }, [lockDates]);

  const handleSave = () => {
    onSave({
      lockDate: lockDate || null,
      advisorLockDate: advisorLockDate || null,
    });
  };

  return (
    <div className="space-y-6" data-testid="lock-date-settings">
      <div>
        <h3 className="text-lg font-semibold text-[#1a1a2e]">Lock Dates</h3>
        <p className="text-sm text-[#6b7280] mt-1">
          Prevent changes to transactions on or before the lock date.
        </p>
      </div>

      <div className="space-y-4">
        <Input
          label="Lock Date"
          type="date"
          value={lockDate}
          onChange={(e) => setLockDate(e.target.value)}
          helperText="No one can edit transactions on or before this date"
          data-testid="lock-date-input"
        />

        <Input
          label="Advisor Lock Date"
          type="date"
          value={advisorLockDate}
          onChange={(e) => setAdvisorLockDate(e.target.value)}
          helperText="Only advisors can edit transactions on or before this date"
          data-testid="advisor-lock-date-input"
        />
      </div>

      <Button
        variant="primary"
        onClick={handleSave}
        loading={isSaving}
        data-testid="save-lock-dates-btn"
      >
        Save Lock Dates
      </Button>
    </div>
  );
}
