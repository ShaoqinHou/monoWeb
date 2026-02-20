// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import {
  useProjects,
  useProject,
  useTimeEntries,
  useCreateProject,
  useCreateTimeEntry,
  useUpdateTimeEntry,
  useDeleteTimeEntry,
  useUpdateProject,
  useDeleteProject,
  useTimesheets,
  useCreateTimesheet,
  useUpdateTimesheet,
  useDeleteTimesheet,
} from '../hooks/useProjects';
import type { Project, ProjectDetail, TimeEntry } from '../types';

/* ─── Mock Data ─── */

const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Website Redesign',
    contactId: 'contact-1',
    contactName: 'Ridgeway University',
    status: 'in_progress',
    deadline: '2026-04-15',
    budgetHours: 200,
    budgetAmount: 30000,
    usedHours: 125,
    usedAmount: 18750,
    createdAt: '2025-11-01',
  },
  {
    id: 'proj-2',
    name: 'Mobile App Development',
    contactId: 'contact-2',
    contactName: 'City Agency',
    status: 'in_progress',
    deadline: '2026-06-30',
    budgetHours: 500,
    budgetAmount: 75000,
    usedHours: 180,
    usedAmount: 27000,
    createdAt: '2025-12-15',
  },
  {
    id: 'proj-3',
    name: 'Annual Audit 2025',
    contactId: 'contact-3',
    contactName: 'Marine Systems',
    status: 'completed',
    deadline: '2026-01-31',
    budgetHours: 80,
    budgetAmount: 12000,
    usedHours: 72,
    usedAmount: 10800,
    createdAt: '2025-09-01',
  },
  {
    id: 'proj-4',
    name: 'Brand Strategy',
    contactId: 'contact-4',
    contactName: 'Petrie McLean',
    status: 'in_progress',
    usedHours: 40,
    usedAmount: 6000,
    createdAt: '2026-01-10',
  },
];

const MOCK_TIME_ENTRIES: TimeEntry[] = [
  {
    id: 'te-1',
    projectId: 'proj-1',
    projectName: 'Website Redesign',
    taskName: 'UI Design',
    staffName: 'Sarah Chen',
    date: '2026-02-14',
    duration: 480,
    description: 'Homepage wireframes',
    billable: true,
    hourlyRate: 150,
  },
  {
    id: 'te-2',
    projectId: 'proj-1',
    projectName: 'Website Redesign',
    taskName: 'Development',
    staffName: 'James Wilson',
    date: '2026-02-14',
    duration: 360,
    description: 'Frontend implementation',
    billable: true,
    hourlyRate: 150,
  },
  {
    id: 'te-3',
    projectId: 'proj-2',
    projectName: 'Mobile App Development',
    taskName: 'API Integration',
    staffName: 'James Wilson',
    date: '2026-02-13',
    duration: 420,
    description: 'REST API endpoints',
    billable: true,
    hourlyRate: 150,
  },
];

const MOCK_PROJECT_DETAIL: ProjectDetail = {
  ...MOCK_PROJECTS[0],
  totalHours: 14,
  totalCost: 2100,
  billableHours: 14,
  timesheets: MOCK_TIME_ENTRIES.filter((e) => e.projectId === 'proj-1'),
};

/* ─── Helpers ─── */

function mockFetchSuccess(data: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ ok: true, data }),
  } as Response);
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

/* ─── Tests ─── */

describe('Projects query hooks', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('useProjects fetches from /api/projects', async () => {
    globalThis.fetch = mockFetchSuccess(MOCK_PROJECTS);

    const { result } = renderHook(() => useProjects(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/projects',
      expect.objectContaining({ headers: expect.any(Object) }),
    );
    expect(result.current.data).toHaveLength(4);
    expect(result.current.data![0].name).toBe('Website Redesign');
  });

  it('useProjects filters by status client-side', async () => {
    globalThis.fetch = mockFetchSuccess(MOCK_PROJECTS);

    const { result } = renderHook(() => useProjects('completed'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].name).toBe('Annual Audit 2025');
  });

  it('useProject fetches from /api/projects/:id', async () => {
    globalThis.fetch = mockFetchSuccess(MOCK_PROJECT_DETAIL);

    const { result } = renderHook(() => useProject('proj-1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/projects/proj-1',
      expect.objectContaining({ headers: expect.any(Object) }),
    );
    expect(result.current.data?.name).toBe('Website Redesign');
    expect(result.current.data?.totalHours).toBe(14);
    expect(result.current.data?.timesheets).toHaveLength(2);
  });

  it('useProject does not fetch when id is empty', () => {
    globalThis.fetch = mockFetchSuccess(null);

    const { result } = renderHook(() => useProject(''), { wrapper: createWrapper() });

    expect(result.current.isFetching).toBe(false);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('useTimesheets fetches from /api/timesheets', async () => {
    globalThis.fetch = mockFetchSuccess(MOCK_TIME_ENTRIES);

    const { result } = renderHook(() => useTimesheets(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/timesheets',
      expect.objectContaining({ headers: expect.any(Object) }),
    );
    expect(result.current.data).toHaveLength(3);
  });

  it('useTimesheets fetches with projectId filter', async () => {
    const proj1Entries = MOCK_TIME_ENTRIES.filter((e) => e.projectId === 'proj-1');
    globalThis.fetch = mockFetchSuccess(proj1Entries);

    const { result } = renderHook(() => useTimesheets('proj-1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/timesheets?projectId=proj-1',
      expect.objectContaining({ headers: expect.any(Object) }),
    );
    expect(result.current.data).toHaveLength(2);
  });

  it('useTimeEntries is an alias for useTimesheets', async () => {
    globalThis.fetch = mockFetchSuccess(MOCK_TIME_ENTRIES);

    const { result } = renderHook(() => useTimeEntries(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(3);
  });
});

describe('Projects mutation hooks', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('useCreateProject posts to /api/projects', async () => {
    const newProject = { ...MOCK_PROJECTS[0], id: 'proj-5', name: 'New Project' };
    globalThis.fetch = mockFetchSuccess(newProject);

    const { result } = renderHook(() => useCreateProject(), { wrapper: createWrapper() });

    result.current.mutate({
      name: 'New Project',
      status: 'in_progress',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/projects',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"name":"New Project"'),
      }),
    );
    expect(result.current.data?.name).toBe('New Project');
  });

  it('useUpdateProject puts to /api/projects/:id', async () => {
    const updated = { ...MOCK_PROJECTS[0], name: 'Updated Project' };
    globalThis.fetch = mockFetchSuccess(updated);

    const { result } = renderHook(() => useUpdateProject(), { wrapper: createWrapper() });

    result.current.mutate({ id: 'proj-1', data: { name: 'Updated Project' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/projects/proj-1',
      expect.objectContaining({
        method: 'PUT',
        body: expect.stringContaining('"name":"Updated Project"'),
      }),
    );
  });

  it('useDeleteProject deletes at /api/projects/:id', async () => {
    globalThis.fetch = mockFetchSuccess({ id: 'proj-1' });

    const { result } = renderHook(() => useDeleteProject(), { wrapper: createWrapper() });

    result.current.mutate('proj-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/projects/proj-1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('useCreateTimeEntry posts to /api/timesheets with converted duration', async () => {
    const newEntry: TimeEntry = {
      id: 'te-new',
      projectId: 'proj-1',
      projectName: 'Website Redesign',
      taskName: 'Testing',
      staffName: 'James Wilson',
      date: '2026-02-16',
      duration: 150,
      description: 'Unit tests',
      billable: true,
      hourlyRate: 150,
    };
    globalThis.fetch = mockFetchSuccess(newEntry);

    const { result } = renderHook(() => useCreateTimeEntry(), { wrapper: createWrapper() });

    result.current.mutate({
      projectId: 'proj-1',
      taskName: 'Testing',
      staffName: 'James Wilson',
      date: '2026-02-16',
      hours: 2,
      minutes: 30,
      description: 'Unit tests',
      billable: true,
      hourlyRate: 150,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/timesheets',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"duration":150'),
      }),
    );
    expect(result.current.data?.taskName).toBe('Testing');
  });

  it('useUpdateTimeEntry puts to /api/timesheets/:id', async () => {
    const updated: TimeEntry = {
      ...MOCK_TIME_ENTRIES[0],
      taskName: 'Updated Design',
      duration: 360,
    };
    globalThis.fetch = mockFetchSuccess(updated);

    const { result } = renderHook(() => useUpdateTimeEntry(), { wrapper: createWrapper() });

    result.current.mutate({
      id: 'te-1',
      values: { taskName: 'Updated Design', hours: 6, minutes: 0 },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/timesheets/te-1',
      expect.objectContaining({
        method: 'PUT',
        body: expect.stringContaining('"taskName":"Updated Design"'),
      }),
    );
  });

  it('useDeleteTimeEntry deletes at /api/timesheets/:id', async () => {
    globalThis.fetch = mockFetchSuccess({ id: 'te-1' });

    const { result } = renderHook(() => useDeleteTimeEntry(), { wrapper: createWrapper() });

    result.current.mutate('te-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/timesheets/te-1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('useCreateTimesheet posts raw CreateTimesheet to /api/timesheets', async () => {
    const newEntry: TimeEntry = {
      id: 'te-raw',
      projectId: 'proj-2',
      projectName: 'Mobile App',
      taskName: 'Coding',
      staffName: 'Emily Park',
      date: '2026-02-16',
      duration: 120,
      description: 'Feature work',
      billable: true,
      hourlyRate: 120,
    };
    globalThis.fetch = mockFetchSuccess(newEntry);

    const { result } = renderHook(() => useCreateTimesheet(), { wrapper: createWrapper() });

    result.current.mutate({
      projectId: 'proj-2',
      taskName: 'Coding',
      staffName: 'Emily Park',
      date: '2026-02-16',
      duration: 120,
      description: 'Feature work',
      billable: true,
      hourlyRate: 120,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/timesheets',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"duration":120'),
      }),
    );
  });

  it('useUpdateTimesheet puts raw UpdateTimesheet to /api/timesheets/:id', async () => {
    const updated: TimeEntry = { ...MOCK_TIME_ENTRIES[0], description: 'Updated desc' };
    globalThis.fetch = mockFetchSuccess(updated);

    const { result } = renderHook(() => useUpdateTimesheet(), { wrapper: createWrapper() });

    result.current.mutate({
      id: 'te-1',
      data: { description: 'Updated desc' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/timesheets/te-1',
      expect.objectContaining({
        method: 'PUT',
        body: expect.stringContaining('"description":"Updated desc"'),
      }),
    );
  });

  it('useDeleteTimesheet deletes at /api/timesheets/:id', async () => {
    globalThis.fetch = mockFetchSuccess({ id: 'te-2' });

    const { result } = renderHook(() => useDeleteTimesheet(), { wrapper: createWrapper() });

    result.current.mutate('te-2');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/timesheets/te-2',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
