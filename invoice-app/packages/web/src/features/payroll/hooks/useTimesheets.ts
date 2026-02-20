import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost, apiPut } from '../../../lib/api-helpers';
import { showToast } from '../../dashboard/components/ToastContainer';
import { timesheetKeys } from './timesheetKeys';

// ── Types ────────────────────────────────────────────────────────────────────

export interface TimesheetEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  weekStart: string;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
  total: number;
  status: 'draft' | 'submitted' | 'approved';
}

export interface CreateTimesheetInput {
  employeeId: string;
  weekStart: string;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

export interface UpdateTimesheetInput {
  monday?: number;
  tuesday?: number;
  wednesday?: number;
  thursday?: number;
  friday?: number;
  saturday?: number;
  sunday?: number;
  status?: 'draft' | 'submitted' | 'approved';
}

// ── Query Hooks ──────────────────────────────────────────────────────────────

/** Fetch timesheets for a given week.
 * Note: The API returns project-based timesheets. This hook transforms them
 * into the weekly grid format expected by the TimesheetGrid component.
 */
export function useTimesheets(weekStart: string) {
  return useQuery({
    queryKey: timesheetKeys.week(weekStart),
    queryFn: async (): Promise<TimesheetEntry[]> => {
      // The /timesheets API returns project-based entries; aggregate by employee into weekly grid
      const raw = await apiFetch<Array<{ id: string; employeeId: string; date: string; hours: number; description: string }>>('/timesheets');
      const weekStartDate = new Date(weekStart + 'T00:00:00');
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 7);

      // Filter to entries within this week
      const weekEntries = raw.filter((e) => {
        const d = new Date(e.date + 'T00:00:00');
        return d >= weekStartDate && d < weekEndDate;
      });

      // Group by employeeId
      const byEmployee = new Map<string, typeof weekEntries>();
      for (const e of weekEntries) {
        const arr = byEmployee.get(e.employeeId ?? 'unknown') ?? [];
        arr.push(e);
        byEmployee.set(e.employeeId ?? 'unknown', arr);
      }

      // Convert to TimesheetEntry format
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
      const results: TimesheetEntry[] = [];
      for (const [empId, entries] of byEmployee) {
        const row: TimesheetEntry = {
          id: `ts-${empId}-${weekStart}`,
          employeeId: empId,
          employeeName: empId, // Will show employee ID if name not available
          weekStart,
          monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0,
          total: 0,
          status: 'draft',
        };
        for (const e of entries) {
          const d = new Date(e.date + 'T00:00:00');
          const dayIdx = d.getDay();
          const dayKey = dayNames[dayIdx];
          (row as Record<string, number | string>)[dayKey] = ((row as Record<string, number>)[dayKey] ?? 0) + e.hours;
        }
        row.total = row.monday + row.tuesday + row.wednesday + row.thursday + row.friday + row.saturday + row.sunday;
        results.push(row);
      }
      return results;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!weekStart,
  });
}

// ── Mutation Hooks ──────────────────────────────────────────────────────────

/** Create a new timesheet entry */
export function useCreateTimesheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTimesheetInput) =>
      apiPost<TimesheetEntry>('/timesheets', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timesheetKeys.lists() });
      showToast('success', 'Timesheet created');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to create timesheet'),
  });
}

/** Update an existing timesheet entry */
export function useUpdateTimesheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateTimesheetInput }) =>
      apiPut<TimesheetEntry>(`/timesheets/${id}`, updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timesheetKeys.lists() });
      showToast('success', 'Timesheet updated');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to update timesheet'),
  });
}
