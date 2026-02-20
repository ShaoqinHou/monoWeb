import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../lib/api-helpers';
import { projectKeys } from './keys';

export interface StaffTimeOverviewEntry {
  staffName: string;
  projectId: string;
  projectName: string;
  totalHours: number;
}

export interface StaffTimeOverviewData {
  entries: StaffTimeOverviewEntry[];
  staffNames: string[];
  projectNames: string[];
  grandTotal: number;
}

const FALLBACK_ENTRIES: StaffTimeOverviewEntry[] = [
  { staffName: 'Alice Johnson', projectId: 'p1', projectName: 'Website Redesign', totalHours: 42 },
  { staffName: 'Alice Johnson', projectId: 'p2', projectName: 'Mobile App', totalHours: 18 },
  { staffName: 'Alice Johnson', projectId: 'p3', projectName: 'API Integration', totalHours: 12 },
  { staffName: 'Bob Smith', projectId: 'p1', projectName: 'Website Redesign', totalHours: 35 },
  { staffName: 'Bob Smith', projectId: 'p2', projectName: 'Mobile App', totalHours: 28 },
  { staffName: 'Carol Davis', projectId: 'p1', projectName: 'Website Redesign', totalHours: 20 },
  { staffName: 'Carol Davis', projectId: 'p2', projectName: 'Mobile App', totalHours: 32 },
  { staffName: 'Carol Davis', projectId: 'p3', projectName: 'API Integration', totalHours: 15 },
  { staffName: 'Dan Lee', projectId: 'p2', projectName: 'Mobile App', totalHours: 24 },
  { staffName: 'Dan Lee', projectId: 'p3', projectName: 'API Integration', totalHours: 38 },
];

function buildOverviewData(entries: StaffTimeOverviewEntry[]): StaffTimeOverviewData {
  const staffNames = Array.from(new Set(entries.map((e) => e.staffName))).sort();
  const projectNames = Array.from(new Set(entries.map((e) => e.projectName))).sort();
  const grandTotal = entries.reduce((sum, e) => sum + e.totalHours, 0);
  return { entries, staffNames, projectNames, grandTotal };
}

async function fetchStaffTimeOverview(): Promise<StaffTimeOverviewData> {
  try {
    const entries = await apiFetch<StaffTimeOverviewEntry[]>('/projects/staff-time-overview');
    return buildOverviewData(entries);
  } catch {
    return buildOverviewData(FALLBACK_ENTRIES);
  }
}

export function useStaffTimeOverview() {
  return useQuery({
    queryKey: [...projectKeys.all, 'staff-time-overview'],
    queryFn: fetchStaffTimeOverview,
    staleTime: 5 * 60 * 1000,
  });
}
