// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectTaskList } from '../components/ProjectTaskList';
import type { ProjectTask } from '../hooks/useProjectTasks';

const MOCK_TASKS: ProjectTask[] = [
  {
    id: 'task-1',
    projectId: 'proj-1',
    name: 'Design mockups',
    description: 'Create wireframes for main pages',
    status: 'todo',
    assigneeId: null,
    estimatedHours: 8,
    actualHours: 0,
    dueDate: '2026-03-01',
    createdAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'task-2',
    projectId: 'proj-1',
    name: 'Implement frontend',
    description: 'Build React components',
    status: 'in_progress',
    assigneeId: 'emp-1',
    estimatedHours: 40,
    actualHours: 15,
    dueDate: '2026-03-15',
    createdAt: '2026-02-05T10:00:00Z',
  },
  {
    id: 'task-3',
    projectId: 'proj-1',
    name: 'Write documentation',
    description: null,
    status: 'done',
    assigneeId: null,
    estimatedHours: 4,
    actualHours: 3,
    dueDate: null,
    createdAt: '2026-02-10T10:00:00Z',
  },
];

describe('ProjectTaskList', () => {
  it('renders task board with three columns', () => {
    render(<ProjectTaskList tasks={MOCK_TASKS} />);
    expect(screen.getByTestId('task-board')).toBeInTheDocument();
    // Column headers + badge labels may duplicate text; check columns exist via test ids
    expect(screen.getByTestId('column-todo')).toBeInTheDocument();
    expect(screen.getByTestId('column-in_progress')).toBeInTheDocument();
    expect(screen.getByTestId('column-done')).toBeInTheDocument();
  });

  it('renders all task cards', () => {
    render(<ProjectTaskList tasks={MOCK_TASKS} />);
    expect(screen.getByTestId('task-card-task-1')).toBeInTheDocument();
    expect(screen.getByTestId('task-card-task-2')).toBeInTheDocument();
    expect(screen.getByTestId('task-card-task-3')).toBeInTheDocument();
  });

  it('shows empty state when no tasks', () => {
    render(<ProjectTaskList tasks={[]} />);
    expect(screen.getByTestId('empty-tasks')).toBeInTheDocument();
    expect(screen.getByText('No tasks yet')).toBeInTheDocument();
  });

  it('places tasks in correct columns', () => {
    render(<ProjectTaskList tasks={MOCK_TASKS} />);
    const todoColumn = screen.getByTestId('column-todo');
    const inProgressColumn = screen.getByTestId('column-in_progress');
    const doneColumn = screen.getByTestId('column-done');

    expect(todoColumn).toContainElement(screen.getByTestId('task-card-task-1'));
    expect(inProgressColumn).toContainElement(screen.getByTestId('task-card-task-2'));
    expect(doneColumn).toContainElement(screen.getByTestId('task-card-task-3'));
  });

  it('shows column counts', () => {
    render(<ProjectTaskList tasks={MOCK_TASKS} />);
    expect(screen.getByTestId('column-count-todo')).toHaveTextContent('1');
    expect(screen.getByTestId('column-count-in_progress')).toHaveTextContent('1');
    expect(screen.getByTestId('column-count-done')).toHaveTextContent('1');
  });

  it('displays task descriptions', () => {
    render(<ProjectTaskList tasks={MOCK_TASKS} />);
    expect(screen.getByText('Create wireframes for main pages')).toBeInTheDocument();
    expect(screen.getByText('Build React components')).toBeInTheDocument();
  });

  it('shows estimated hours', () => {
    render(<ProjectTaskList tasks={MOCK_TASKS} />);
    expect(screen.getByTestId('task-estimate-task-1')).toHaveTextContent('Est: 8h');
    expect(screen.getByTestId('task-estimate-task-2')).toHaveTextContent('Est: 40h');
  });

  it('shows actual hours when greater than zero', () => {
    render(<ProjectTaskList tasks={MOCK_TASKS} />);
    expect(screen.getByTestId('task-actual-task-2')).toHaveTextContent('Actual: 15h');
    expect(screen.getByTestId('task-actual-task-3')).toHaveTextContent('Actual: 3h');
    expect(screen.queryByTestId('task-actual-task-1')).not.toBeInTheDocument();
  });

  it('shows due dates when set', () => {
    render(<ProjectTaskList tasks={MOCK_TASKS} />);
    expect(screen.getByTestId('task-due-task-1')).toBeInTheDocument();
    expect(screen.queryByTestId('task-due-task-3')).not.toBeInTheDocument();
  });

  it('renders advance button for todo tasks', () => {
    const onStatusChange = vi.fn();
    render(
      <ProjectTaskList tasks={MOCK_TASKS} onStatusChange={onStatusChange} />,
    );
    const startBtn = screen.getByTestId('advance-task-task-1');
    expect(startBtn).toHaveTextContent('Start');
    fireEvent.click(startBtn);
    expect(onStatusChange).toHaveBeenCalledWith('task-1', 'in_progress');
  });

  it('renders complete button for in_progress tasks', () => {
    const onStatusChange = vi.fn();
    render(
      <ProjectTaskList tasks={MOCK_TASKS} onStatusChange={onStatusChange} />,
    );
    const completeBtn = screen.getByTestId('advance-task-task-2');
    expect(completeBtn).toHaveTextContent('Complete');
    fireEvent.click(completeBtn);
    expect(onStatusChange).toHaveBeenCalledWith('task-2', 'done');
  });

  it('does not render advance button for done tasks', () => {
    const onStatusChange = vi.fn();
    render(
      <ProjectTaskList tasks={MOCK_TASKS} onStatusChange={onStatusChange} />,
    );
    expect(screen.queryByTestId('advance-task-task-3')).not.toBeInTheDocument();
  });

  it('calls onEditTask when Edit is clicked', () => {
    const onEditTask = vi.fn();
    render(
      <ProjectTaskList tasks={MOCK_TASKS} onEditTask={onEditTask} />,
    );
    fireEvent.click(screen.getByLabelText('Edit Design mockups'));
    expect(onEditTask).toHaveBeenCalledWith(MOCK_TASKS[0]);
  });

  it('calls onDeleteTask when Delete is clicked', () => {
    const onDeleteTask = vi.fn();
    render(
      <ProjectTaskList tasks={MOCK_TASKS} onDeleteTask={onDeleteTask} />,
    );
    fireEvent.click(screen.getByLabelText('Delete Design mockups'));
    expect(onDeleteTask).toHaveBeenCalledWith('task-1');
  });
});
