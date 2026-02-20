import { useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Combobox } from '../../../components/ui/Combobox';
import { Button } from '../../../components/ui/Button';
import { Dialog } from '../../../components/ui/Dialog';
import type { Project, CreateProject, ProjectStatus } from '../types';

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CreateProject) => void;
  project?: Project;
  contacts?: Array<{ value: string; label: string }>;
  /** When 'inline', renders form fields directly without Dialog wrapper */
  mode?: 'dialog' | 'inline';
}

interface FormErrors {
  name?: string;
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'closed', label: 'Closed' },
];

export function ProjectForm({ open, onClose, onSubmit, project, contacts, mode = 'dialog' }: ProjectFormProps) {
  const isEdit = !!project;
  const navigate = useNavigate();
  const [name, setName] = useState(project?.name ?? '');
  const [contactId, setContactId] = useState(project?.contactId ?? '');
  const [contactName, setContactName] = useState(project?.contactName ?? '');
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? 'in_progress');
  const [deadline, setDeadline] = useState(project?.deadline ?? '');
  const [budgetHours, setBudgetHours] = useState(project?.budgetHours ?? 0);
  const [budgetAmount, setBudgetAmount] = useState(project?.budgetAmount ?? 0);
  const [errors, setErrors] = useState<FormErrors>({});

  function validate(): FormErrors {
    const newErrors: FormErrors = {};
    if (!name.trim()) newErrors.name = 'Project name is required';
    return newErrors;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const formErrors = validate();
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    onSubmit({
      name: name.trim(),
      contactId: contactId || undefined,
      contactName: contactName.trim() || undefined,
      status,
      deadline: deadline || undefined,
      budgetHours: budgetHours > 0 ? budgetHours : undefined,
      budgetAmount: budgetAmount > 0 ? budgetAmount : undefined,
    });

    if (!isEdit) {
      setName('');
      setContactId('');
      setContactName('');
      setStatus('in_progress');
      setDeadline('');
      setBudgetHours(0);
      setBudgetAmount(0);
      setErrors({});
    }
    onClose();
  }

  const formFields = (
    <form id="project-form" onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Project Name"
        inputId="pf-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Website Redesign"
        error={errors.name}
      />

      {contacts && contacts.length > 0 ? (
        <Combobox
          label="Client / Contact"
          options={contacts}
          value={contactId}
          onChange={(selectedId) => {
            setContactId(selectedId);
            const match = contacts.find((c) => c.value === selectedId);
            setContactName(match ? match.label : '');
          }}
          placeholder="Search contacts..."
          onCreateNew={() => navigate({ to: '/contacts/new' })}
          data-testid="pf-contact"
        />
      ) : (
        <Input
          label="Client / Contact"
          inputId="pf-contact"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          placeholder="e.g. Acme Corp"
        />
      )}

      <Select
        label="Status"
        selectId="pf-status"
        options={STATUS_OPTIONS}
        value={status}
        onChange={(e) => setStatus(e.target.value as ProjectStatus)}
      />

      <Input
        label="Deadline"
        inputId="pf-deadline"
        type="date"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Budget Hours"
          inputId="pf-budget-hours"
          type="number"
          min={0}
          value={String(budgetHours)}
          onChange={(e) => setBudgetHours(parseFloat(e.target.value) || 0)}
        />
        <Input
          label="Budget Amount ($)"
          inputId="pf-budget-amount"
          type="number"
          min={0}
          value={String(budgetAmount)}
          onChange={(e) => setBudgetAmount(parseFloat(e.target.value) || 0)}
        />
      </div>
    </form>
  );

  if (mode === 'inline') {
    return (
      <div data-testid="project-form-inline" className="space-y-4">
        {formFields}
        <div className="flex items-center justify-end gap-2 py-3 border-t border-[#e5e7eb] sticky bottom-0 z-10 bg-white">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="project-form">
            {isEdit ? 'Save' : 'Create'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Project' : 'New Project'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="project-form">
            {isEdit ? 'Save' : 'Create'}
          </Button>
        </>
      }
    >
      {formFields}
    </Dialog>
  );
}
