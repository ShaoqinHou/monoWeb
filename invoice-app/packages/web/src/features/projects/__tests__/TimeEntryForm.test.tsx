import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimeEntryForm } from '../components/TimeEntryForm';
import type { Project } from '../types';

const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-1', name: 'Website Redesign', contactName: 'Ridgeway University',
    status: 'in_progress', usedHours: 125, usedAmount: 18750, createdAt: '2025-11-01',
  },
  {
    id: 'proj-2', name: 'Mobile App Development', contactName: 'City Agency',
    status: 'in_progress', usedHours: 180, usedAmount: 27000, createdAt: '2025-12-15',
  },
  {
    id: 'proj-3', name: 'Annual Audit 2025', contactName: 'Marine Systems',
    status: 'completed', usedHours: 72, usedAmount: 10800, createdAt: '2025-09-01',
  },
  {
    id: 'proj-4', name: 'Brand Strategy', contactName: 'Petrie McLean',
    status: 'in_progress', usedHours: 40, usedAmount: 6000, createdAt: '2026-01-10',
  },
];

function renderForm(overrides: Partial<Parameters<typeof TimeEntryForm>[0]> = {}) {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    projects: MOCK_PROJECTS,
  };
  return render(<TimeEntryForm {...defaultProps} {...overrides} />);
}

describe('TimeEntryForm', () => {
  it('renders the dialog with Log Time title', () => {
    renderForm();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Log Time')).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    renderForm();
    expect(document.getElementById('te-project')).toBeInTheDocument();
    expect(document.getElementById('te-task')).toBeInTheDocument();
    expect(document.getElementById('te-staff')).toBeInTheDocument();
    expect(document.getElementById('te-date')).toBeInTheDocument();
    expect(document.getElementById('te-hours')).toBeInTheDocument();
    expect(document.getElementById('te-minutes')).toBeInTheDocument();
    expect(document.getElementById('te-description')).toBeInTheDocument();
    expect(document.getElementById('te-rate')).toBeInTheDocument();
    expect(document.getElementById('te-billable')).toBeInTheDocument();
  });

  it('renders Save and Cancel buttons', () => {
    renderForm();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('Project is required')).toBeInTheDocument();
    expect(screen.getByText('Task name is required')).toBeInTheDocument();
    expect(screen.getByText('Staff is required')).toBeInTheDocument();
    expect(screen.getByText('Duration must be greater than 0')).toBeInTheDocument();
  });

  it('validates that project is required', () => {
    renderForm();
    // Fill everything except project
    fireEvent.change(document.getElementById('te-task')!, { target: { value: 'Some task' } });
    fireEvent.change(document.getElementById('te-staff')!, { target: { value: 'Sarah Chen' } });
    fireEvent.change(document.getElementById('te-hours')!, { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('Project is required')).toBeInTheDocument();
    expect(screen.queryByText('Task name is required')).not.toBeInTheDocument();
  });

  it('validates that task name is required', () => {
    renderForm();
    fireEvent.change(document.getElementById('te-project')!, { target: { value: 'proj-1' } });
    fireEvent.change(document.getElementById('te-staff')!, { target: { value: 'Sarah Chen' } });
    fireEvent.change(document.getElementById('te-hours')!, { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('Task name is required')).toBeInTheDocument();
    expect(screen.queryByText('Project is required')).not.toBeInTheDocument();
  });

  it('validates that duration must be greater than 0', () => {
    renderForm();
    fireEvent.change(document.getElementById('te-project')!, { target: { value: 'proj-1' } });
    fireEvent.change(document.getElementById('te-task')!, { target: { value: 'Work' } });
    fireEvent.change(document.getElementById('te-staff')!, { target: { value: 'Sarah Chen' } });
    // Leave hours and minutes at 0
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('Duration must be greater than 0')).toBeInTheDocument();
  });

  it('calls onSubmit with form values when valid', () => {
    const onSubmit = vi.fn();
    renderForm({ onSubmit });

    fireEvent.change(document.getElementById('te-project')!, { target: { value: 'proj-1' } });
    fireEvent.change(document.getElementById('te-task')!, { target: { value: 'UI Design' } });
    fireEvent.change(document.getElementById('te-staff')!, { target: { value: 'Sarah Chen' } });
    fireEvent.change(document.getElementById('te-date')!, { target: { value: '2026-02-15' } });
    fireEvent.change(document.getElementById('te-hours')!, { target: { value: '3' } });
    fireEvent.change(document.getElementById('te-minutes')!, { target: { value: '30' } });
    fireEvent.change(document.getElementById('te-description')!, { target: { value: 'Mockups' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit).toHaveBeenCalledWith({
      projectId: 'proj-1',
      taskName: 'UI Design',
      staffName: 'Sarah Chen',
      date: '2026-02-15',
      hours: 3,
      minutes: 30,
      description: 'Mockups',
      billable: true,
      hourlyRate: 150,
    });
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    renderForm({ onClose });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('does not render when open is false', () => {
    renderForm({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('lists all projects in the project select', () => {
    renderForm();
    const select = document.getElementById('te-project') as HTMLSelectElement;
    const options = Array.from(select.options);
    // "Select project" + 4 mock projects
    expect(options.length).toBe(5);
    expect(options[1].text).toBe('Website Redesign');
    expect(options[2].text).toBe('Mobile App Development');
  });

  it('defaults billable checkbox to checked', () => {
    renderForm();
    const checkbox = document.getElementById('te-billable') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('can toggle billable checkbox', () => {
    renderForm();
    const checkbox = document.getElementById('te-billable') as HTMLInputElement;
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });

  it('uses defaultProjectId when provided', () => {
    renderForm({ defaultProjectId: 'proj-2' });
    const select = document.getElementById('te-project') as HTMLSelectElement;
    expect(select.value).toBe('proj-2');
  });
});
