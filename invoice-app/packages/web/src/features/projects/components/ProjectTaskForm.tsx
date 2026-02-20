import { useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardFooter } from '../../../components/ui/Card';

interface ProjectTaskFormValues {
  name: string;
  description: string;
  assigneeId: string;
  estimatedHours: number | null;
  dueDate: string;
}

interface ProjectTaskFormProps {
  initialValues?: Partial<ProjectTaskFormValues>;
  onSubmit: (values: ProjectTaskFormValues) => void;
  onCancel?: () => void;
  loading?: boolean;
}

export function ProjectTaskForm({
  initialValues,
  onSubmit,
  onCancel,
  loading,
}: ProjectTaskFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [assigneeId, setAssigneeId] = useState(initialValues?.assigneeId ?? '');
  const [estimatedHours, setEstimatedHours] = useState(
    initialValues?.estimatedHours != null ? String(initialValues.estimatedHours) : '',
  );
  const [dueDate, setDueDate] = useState(initialValues?.dueDate ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      description,
      assigneeId,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
      dueDate,
    });
  };

  return (
    <form onSubmit={handleSubmit} data-testid="task-form">
      <Card>
        <CardContent>
          <div className="space-y-4 py-2">
            <Input
              label="Task Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              inputId="task-name"
              required
            />
            <Input
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              inputId="task-description"
            />
            <Input
              label="Assignee"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              inputId="task-assignee"
              placeholder="Employee ID or name"
            />
            <Input
              label="Estimated Hours"
              type="number"
              step="0.5"
              min="0"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              inputId="task-estimated-hours"
            />
            <Input
              label="Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              inputId="task-due-date"
            />
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex gap-2">
            <Button type="submit" loading={loading} data-testid="save-task">
              Save
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                data-testid="cancel-task"
              >
                Cancel
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </form>
  );
}

export type { ProjectTaskFormValues };
