import { Badge, type BadgeVariant } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../../components/ui/Card';
import type { ProjectTask, TaskStatus } from '../hooks/useProjectTasks';

interface ProjectTaskListProps {
  tasks: ProjectTask[];
  onEditTask?: (task: ProjectTask) => void;
  onDeleteTask?: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onAddTask?: () => void;
}

const STATUS_VARIANT: Record<TaskStatus, BadgeVariant> = {
  todo: 'warning',
  in_progress: 'info',
  done: 'success',
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

const COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'done'];

function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  task: ProjectTask;
  onEdit?: (task: ProjectTask) => void;
  onDelete?: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
}) {
  return (
    <div
      className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm"
      data-testid={`task-card-${task.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-[#1a1a2e]">{task.name}</h4>
        <Badge variant={STATUS_VARIANT[task.status]}>
          {STATUS_LABEL[task.status]}
        </Badge>
      </div>
      {task.description && (
        <p className="text-xs text-[#6b7280] mt-1">{task.description}</p>
      )}
      <div className="flex items-center gap-3 mt-2 text-xs text-[#6b7280]">
        {task.estimatedHours != null && (
          <span data-testid={`task-estimate-${task.id}`}>
            Est: {task.estimatedHours}h
          </span>
        )}
        {task.actualHours > 0 && (
          <span data-testid={`task-actual-${task.id}`}>
            Actual: {task.actualHours}h
          </span>
        )}
        {task.dueDate && (
          <span data-testid={`task-due-${task.id}`}>
            Due: {new Date(task.dueDate).toLocaleDateString('en-NZ', {
              day: 'numeric',
              month: 'short',
            })}
          </span>
        )}
      </div>
      {(onEdit || onDelete || onStatusChange) && (
        <div className="flex gap-1 mt-2">
          {onStatusChange && task.status !== 'done' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const nextStatus: TaskStatus =
                  task.status === 'todo' ? 'in_progress' : 'done';
                onStatusChange(task.id, nextStatus);
              }}
              aria-label={`Advance ${task.name}`}
              data-testid={`advance-task-${task.id}`}
            >
              {task.status === 'todo' ? 'Start' : 'Complete'}
            </Button>
          )}
          {onEdit && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEdit(task)}
              aria-label={`Edit ${task.name}`}
            >
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(task.id)}
              aria-label={`Delete ${task.name}`}
            >
              Delete
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function ProjectTaskList({
  tasks,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onAddTask,
}: ProjectTaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12" data-testid="empty-tasks">
        <h3 className="text-base font-semibold text-[#1a1a2e] mb-1">No tasks yet</h3>
        <p className="text-[#6b7280] text-sm mb-4">Add tasks to track work items for this project.</p>
        {onAddTask && (
          <Button size="sm" onClick={onAddTask} data-testid="add-task-cta">
            Add Task
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
      data-testid="task-board"
    >
      {COLUMNS.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status);
        return (
          <Card key={status}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#1a1a2e]">
                  {STATUS_LABEL[status]}
                </h3>
                <span className="text-xs text-[#6b7280]" data-testid={`column-count-${status}`}>
                  {columnTasks.length}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2" data-testid={`column-${status}`}>
                {columnTasks.length === 0 ? (
                  <p className="text-xs text-[#6b7280] py-4 text-center">
                    No tasks
                  </p>
                ) : (
                  columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={onEditTask}
                      onDelete={onDeleteTask}
                      onStatusChange={onStatusChange}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
