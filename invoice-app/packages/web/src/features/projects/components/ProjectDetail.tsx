import { useState } from 'react';
import { Tabs, TabList, Tab, TabPanel } from '../../../components/ui/Tabs';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { formatCurrency } from '../../../../../shared/calc/currency';
import { showToast } from '../../dashboard/components/ToastContainer';
import { ProjectProgress } from './ProjectProgress';
import { TimeEntryList } from './TimeEntryList';
import { ProjectExpenseList } from './ProjectExpenseList';
import { ProjectExpenseForm, type ProjectExpenseFormValues } from './ProjectExpenseForm';
import { ProjectTaskList } from './ProjectTaskList';
import { ProjectTaskForm, type ProjectTaskFormValues } from './ProjectTaskForm';
import { useProjectExpenses, useCreateExpense, useDeleteExpense } from '../hooks/useProjectExpenses';
import { useProjectTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../hooks/useProjectTasks';
import type { Project, TimeEntry } from '../types';

interface ProjectDetailProps {
  project: Project;
  timeEntries: TimeEntry[];
  projectId: string;
}

export function ProjectDetail({ project, timeEntries, projectId }: ProjectDetailProps) {
  const totalBillable = timeEntries
    .filter((e) => e.billable)
    .reduce((sum, e) => sum + (e.duration / 60) * e.hourlyRate, 0);

  const totalNonBillable = timeEntries
    .filter((e) => !e.billable)
    .reduce((sum, e) => sum + (e.duration / 60) * e.hourlyRate, 0);

  const totalHoursLogged = timeEntries.reduce((sum, e) => sum + e.duration / 60, 0);

  /* ─── Expenses ─── */
  const { data: expenses, isLoading: expensesLoading } = useProjectExpenses(projectId);
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const handleCreateExpense = (values: ProjectExpenseFormValues) => {
    createExpense.mutate(
      {
        projectId,
        description: values.description,
        amount: values.amount,
        date: values.date,
        category: values.category || undefined,
        isBillable: values.isBillable,
      },
      {
        onSuccess: () => setShowExpenseForm(false),
        onError: (err: Error) => showToast('error', err.message || 'Failed to add expense'),
      },
    );
  };

  /* ─── Tasks ─── */
  const { data: tasks, isLoading: tasksLoading } = useProjectTasks(projectId);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [showTaskForm, setShowTaskForm] = useState(false);

  const handleCreateTask = (values: ProjectTaskFormValues) => {
    createTask.mutate(
      {
        projectId,
        name: values.name,
        description: values.description || undefined,
        assigneeId: values.assigneeId || undefined,
        estimatedHours: values.estimatedHours ?? undefined,
        dueDate: values.dueDate || undefined,
      },
      {
        onSuccess: () => setShowTaskForm(false),
        onError: (err: Error) => showToast('error', err.message || 'Failed to create task'),
      },
    );
  };

  return (
    <Tabs defaultTab="overview">
      <TabList>
        <Tab tabId="overview">Overview</Tab>
        <Tab tabId="tasks">Tasks</Tab>
        <Tab tabId="expenses">Expenses</Tab>
        <Tab tabId="time">Time</Tab>
      </TabList>

      {/* Overview Tab */}
      <TabPanel tabId="overview">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project Info */}
          <Card>
            <CardContent>
              <h3 className="text-sm font-semibold text-[#6b7280] uppercase tracking-wide mb-4">
                Project Info
              </h3>
              <dl className="space-y-3">
                {project.contactName && (
                  <div className="flex justify-between">
                    <dt className="text-sm text-[#6b7280]">Client</dt>
                    <dd className="text-sm text-[#1a1a2e] font-medium">{project.contactName}</dd>
                  </div>
                )}
                {project.deadline && (
                  <div className="flex justify-between">
                    <dt className="text-sm text-[#6b7280]">Deadline</dt>
                    <dd className="text-sm text-[#1a1a2e]">
                      {new Date(project.deadline).toLocaleDateString('en-NZ', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-sm text-[#6b7280]">Created</dt>
                  <dd className="text-sm text-[#1a1a2e]">
                    {new Date(project.createdAt).toLocaleDateString('en-NZ', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Budget / Progress */}
          <Card>
            <CardContent>
              <h3 className="text-sm font-semibold text-[#6b7280] uppercase tracking-wide mb-4">
                Budget
              </h3>
              {project.budgetHours != null && project.budgetHours > 0 ? (
                <div className="space-y-4">
                  <ProjectProgress
                    used={project.usedHours}
                    budget={project.budgetHours}
                    label="Hours"
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6b7280]">Hours used</span>
                    <span className="text-[#1a1a2e]">
                      {project.usedHours} / {project.budgetHours}
                    </span>
                  </div>
                  {project.budgetAmount != null && (
                    <ProjectProgress
                      used={project.usedAmount}
                      budget={project.budgetAmount}
                      label="Amount"
                    />
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6b7280]">Hours logged</span>
                    <span className="text-[#1a1a2e]">{totalHoursLogged.toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-[#6b7280]">No budget set</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card className="md:col-span-2">
            <CardContent>
              <h3 className="text-sm font-semibold text-[#6b7280] uppercase tracking-wide mb-4">
                Financial Summary
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-[#6b7280]">Billable</p>
                  <p className="text-lg font-semibold text-[#1a1a2e]" data-testid="total-billable">
                    {formatCurrency(totalBillable)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#6b7280]">Non-billable</p>
                  <p className="text-lg font-semibold text-[#1a1a2e]" data-testid="total-non-billable">
                    {formatCurrency(totalNonBillable)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#6b7280]">Total</p>
                  <p className="text-lg font-semibold text-[#1a1a2e]" data-testid="total-amount">
                    {formatCurrency(totalBillable + totalNonBillable)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabPanel>

      {/* Tasks Tab */}
      <TabPanel tabId="tasks">
        <div className="mb-4 flex justify-end">
          <Button size="sm" onClick={() => setShowTaskForm(true)}>
            Add Task
          </Button>
        </div>
        {tasksLoading ? (
          <div className="text-[#6b7280]" data-testid="tasks-loading">Loading tasks...</div>
        ) : (
          <ProjectTaskList
            tasks={tasks ?? []}
            onAddTask={() => setShowTaskForm(true)}
            onDeleteTask={(id) =>
              deleteTask.mutate(id, {
                onError: (err: Error) => showToast('error', err.message || 'Failed to delete task'),
              })
            }
            onStatusChange={(taskId, status) =>
              updateTask.mutate(
                { id: taskId, data: { status } },
                {
                  onError: (err: Error) => showToast('error', err.message || 'Failed to update task'),
                },
              )
            }
          />
        )}
        {showTaskForm && (
          <div className="mt-4">
            <ProjectTaskForm
              onSubmit={handleCreateTask}
              onCancel={() => setShowTaskForm(false)}
              loading={createTask.isPending}
            />
          </div>
        )}
      </TabPanel>

      {/* Expenses Tab */}
      <TabPanel tabId="expenses">
        <div className="mb-4 flex justify-end">
          <Button size="sm" onClick={() => setShowExpenseForm(true)}>
            Add Expense
          </Button>
        </div>
        {expensesLoading ? (
          <div className="text-[#6b7280]" data-testid="expenses-loading">Loading expenses...</div>
        ) : (
          <ProjectExpenseList
            expenses={expenses ?? []}
            onAddExpense={() => setShowExpenseForm(true)}
            onDelete={(id) =>
              deleteExpense.mutate(id, {
                onError: (err: Error) => showToast('error', err.message || 'Failed to delete expense'),
              })
            }
          />
        )}
        {showExpenseForm && (
          <div className="mt-4">
            <ProjectExpenseForm
              onSubmit={handleCreateExpense}
              onCancel={() => setShowExpenseForm(false)}
              loading={createExpense.isPending}
            />
          </div>
        )}
      </TabPanel>

      {/* Time Tab */}
      <TabPanel tabId="time">
        <TimeEntryList entries={timeEntries} showProject={false} />
      </TabPanel>
    </Tabs>
  );
}
