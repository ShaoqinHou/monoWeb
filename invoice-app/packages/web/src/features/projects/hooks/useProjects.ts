import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost, apiPut, apiDelete } from '../../../lib/api-helpers';
import { showToast } from '../../dashboard/components/ToastContainer';
import type {
  Project,
  ProjectDetail,
  ProjectStatus,
  TimeEntry,
  CreateProject,
  UpdateProject,
  CreateTimesheet,
  UpdateTimesheet,
  TimeEntryFormValues,
} from '../types';
import { projectKeys, timeEntryKeys } from './keys';

/* ─── Project Query Hooks ─── */

/** Fetch all projects, optionally filtered by status */
export function useProjects(statusFilter?: ProjectStatus | 'all') {
  return useQuery({
    queryKey: projectKeys.list({ status: statusFilter ?? 'all' }),
    queryFn: () => apiFetch<Project[]>('/projects'),
    select: (data) => {
      if (!statusFilter || statusFilter === 'all') return data;
      return data.filter((p) => p.status === statusFilter);
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch a single project by ID (includes timesheets + summary) */
export function useProject(projectId: string) {
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => apiFetch<ProjectDetail>(`/projects/${projectId}`),
    staleTime: 60 * 1000,
    enabled: !!projectId,
  });
}

/* ─── Project Mutation Hooks ─── */

/** Create a new project */
export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProject) => apiPost<Project>('/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      showToast('success', 'Project created');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to create project'),
  });
}

/** Update an existing project */
export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProject }) =>
      apiPut<Project>(`/projects/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      showToast('success', 'Project updated');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to update project'),
  });
}

/** Delete a project */
export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<{ id: string }>(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      showToast('success', 'Project deleted');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to delete project'),
  });
}

/* ─── Timesheet Query Hooks ─── */

/** Fetch timesheets, optionally filtered by project */
export function useTimesheets(projectId?: string) {
  return useQuery({
    queryKey: projectId
      ? timeEntryKeys.byProject(projectId)
      : timeEntryKeys.lists(),
    queryFn: () => {
      const path = projectId
        ? `/timesheets?projectId=${encodeURIComponent(projectId)}`
        : '/timesheets';
      return apiFetch<TimeEntry[]>(path);
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Alias for backward compat with existing pages */
export const useTimeEntries = useTimesheets;

/* ─── Timesheet Mutation Hooks ─── */

/** Create a new timesheet entry */
export function useCreateTimesheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTimesheet) =>
      apiPost<TimeEntry>('/timesheets', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      showToast('success', 'Time entry created');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to create time entry'),
  });
}

/** Convenience wrapper: converts TimeEntryFormValues to CreateTimesheet */
export function useCreateTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: TimeEntryFormValues) => {
      const data: CreateTimesheet = {
        projectId: values.projectId,
        taskName: values.taskName,
        staffName: values.staffName,
        date: values.date,
        duration: values.hours * 60 + values.minutes,
        description: values.description,
        billable: values.billable,
        hourlyRate: values.hourlyRate,
      };
      return apiPost<TimeEntry>('/timesheets', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      showToast('success', 'Time entry created');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to create time entry'),
  });
}

/** Update an existing timesheet entry */
export function useUpdateTimesheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTimesheet }) =>
      apiPut<TimeEntry>(`/timesheets/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      showToast('success', 'Time entry updated');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to update time entry'),
  });
}

/** Convenience wrapper: converts form values to update payload */
export function useUpdateTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<TimeEntryFormValues> }) => {
      const data: UpdateTimesheet = {};
      if (values.taskName != null) data.taskName = values.taskName;
      if (values.staffName != null) data.staffName = values.staffName;
      if (values.date != null) data.date = values.date;
      if (values.hours != null || values.minutes != null) {
        data.duration = (values.hours ?? 0) * 60 + (values.minutes ?? 0);
      }
      if (values.description != null) data.description = values.description;
      if (values.billable != null) data.billable = values.billable;
      if (values.hourlyRate != null) data.hourlyRate = values.hourlyRate;
      return apiPut<TimeEntry>(`/timesheets/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      showToast('success', 'Time entry updated');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to update time entry'),
  });
}

/** Delete a timesheet entry */
export function useDeleteTimesheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<{ id: string }>(`/timesheets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      showToast('success', 'Time entry deleted');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to delete time entry'),
  });
}

/** Alias for backward compat */
export function useDeleteTimeEntry() {
  return useDeleteTimesheet();
}
