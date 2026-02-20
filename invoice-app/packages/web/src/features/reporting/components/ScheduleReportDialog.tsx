import { useState, useCallback } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';

interface ScheduleReportDialogProps {
  open: boolean;
  onClose: () => void;
  reportName: string;
}

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
];

const FORMAT_OPTIONS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'csv', label: 'CSV' },
  { value: 'xlsx', label: 'Excel (XLSX)' },
];

export function ScheduleReportDialog({ open, onClose, reportName }: ScheduleReportDialogProps) {
  const [frequency, setFrequency] = useState('monthly');
  const [email, setEmail] = useState('');
  const [format, setFormat] = useState('pdf');

  const handleSchedule = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Schedule: ${reportName}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSchedule} disabled={!email}>Schedule</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Select
          label="Frequency"
          selectId="schedule-frequency"
          options={FREQUENCY_OPTIONS}
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
        />
        <Input
          label="Recipient Email"
          inputId="schedule-email"
          type="email"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Select
          label="Format"
          selectId="schedule-format"
          options={FORMAT_OPTIONS}
          value={format}
          onChange={(e) => setFormat(e.target.value)}
        />
      </div>
    </Dialog>
  );
}
