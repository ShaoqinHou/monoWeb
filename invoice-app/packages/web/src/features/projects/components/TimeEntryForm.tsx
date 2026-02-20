import { useState, type FormEvent } from 'react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Dialog } from '../../../components/ui/Dialog';
import type { TimeEntryFormValues } from '../types';
import type { Project } from '../types';

interface TimeEntryFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: TimeEntryFormValues) => void;
  projects: Project[];
  defaultProjectId?: string;
}

interface FormErrors {
  projectId?: string;
  taskName?: string;
  staffName?: string;
  date?: string;
  duration?: string;
}

const STAFF_OPTIONS = [
  { value: '', label: 'Select staff', disabled: true },
  { value: 'Sarah Chen', label: 'Sarah Chen' },
  { value: 'James Wilson', label: 'James Wilson' },
  { value: 'Emily Park', label: 'Emily Park' },
];

export function TimeEntryForm({
  open,
  onClose,
  onSubmit,
  projects,
  defaultProjectId,
}: TimeEntryFormProps) {
  const [projectId, setProjectId] = useState(defaultProjectId ?? '');
  const [taskName, setTaskName] = useState('');
  const [staffName, setStaffName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [description, setDescription] = useState('');
  const [billable, setBillable] = useState(true);
  const [hourlyRate, setHourlyRate] = useState(150);
  const [errors, setErrors] = useState<FormErrors>({});

  const projectOptions = [
    { value: '', label: 'Select project', disabled: true },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ];

  function validate(): FormErrors {
    const newErrors: FormErrors = {};
    if (!projectId) newErrors.projectId = 'Project is required';
    if (!taskName.trim()) newErrors.taskName = 'Task name is required';
    if (!staffName) newErrors.staffName = 'Staff is required';
    if (!date) newErrors.date = 'Date is required';
    if (hours === 0 && minutes === 0) newErrors.duration = 'Duration must be greater than 0';
    return newErrors;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const formErrors = validate();
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    onSubmit({
      projectId,
      taskName: taskName.trim(),
      staffName,
      date,
      hours,
      minutes,
      description: description.trim(),
      billable,
      hourlyRate,
    });

    // Reset form
    setProjectId(defaultProjectId ?? '');
    setTaskName('');
    setStaffName('');
    setDate(new Date().toISOString().split('T')[0]);
    setHours(0);
    setMinutes(0);
    setDescription('');
    setBillable(true);
    setHourlyRate(150);
    setErrors({});
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Log Time"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="time-entry-form">
            Save
          </Button>
        </>
      }
    >
      <form id="time-entry-form" onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Project"
          selectId="te-project"
          options={projectOptions}
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          error={errors.projectId}
        />

        <Input
          label="Task Name"
          inputId="te-task"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder="e.g. UI Design, Development"
          error={errors.taskName}
        />

        <Select
          label="Staff"
          selectId="te-staff"
          options={STAFF_OPTIONS}
          value={staffName}
          onChange={(e) => setStaffName(e.target.value)}
          error={errors.staffName}
        />

        <Input
          label="Date"
          inputId="te-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          error={errors.date}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Hours"
            inputId="te-hours"
            type="number"
            min={0}
            max={24}
            value={String(hours)}
            onChange={(e) => setHours(parseInt(e.target.value, 10) || 0)}
          />
          <Input
            label="Minutes"
            inputId="te-minutes"
            type="number"
            min={0}
            max={59}
            value={String(minutes)}
            onChange={(e) => setMinutes(parseInt(e.target.value, 10) || 0)}
          />
        </div>
        {errors.duration && (
          <p className="text-sm text-[#ef4444]" role="alert">
            {errors.duration}
          </p>
        )}

        <Input
          label="Description"
          inputId="te-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What did you work on?"
        />

        <Input
          label="Hourly Rate ($)"
          inputId="te-rate"
          type="number"
          min={0}
          value={String(hourlyRate)}
          onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="te-billable"
            checked={billable}
            onChange={(e) => setBillable(e.target.checked)}
            className="rounded border-[#e5e7eb] text-[#0078c8] focus:ring-[#0078c8]"
          />
          <label htmlFor="te-billable" className="text-sm text-[#1a1a2e]">
            Billable
          </label>
        </div>
      </form>
    </Dialog>
  );
}
