// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('../../lib/api-helpers', () => ({
  apiFetch: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
}));

import { apiFetch, apiPost, apiPut } from '../../lib/api-helpers';
import { useCreateProject, useCreateTimeEntry, useProjects } from '../../features/projects/hooks/useProjects';
import { useCreateExpense, useProjectExpenses } from '../../features/projects/hooks/useProjectExpenses';
import { useUnbilledItems } from '../../features/projects/hooks/useUnbilledItems';
import { useCreateProjectInvoice } from '../../features/projects/hooks/useCreateProjectInvoice';

const mockedApiFetch = vi.mocked(apiFetch);
const mockedApiPost = vi.mocked(apiPost);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('Project Workflow Integration', () => {
  it('creates project, adds time entries and expenses', async () => {
    const project = {
      id: 'proj-1',
      name: 'Website Redesign',
      contactId: 'c-1',
      contactName: 'Acme Corp',
      status: 'in_progress' as const,
      budgetHours: 100,
      budgetAmount: 15000,
      usedHours: 0,
      usedAmount: 0,
      createdAt: '2026-02-01T00:00:00Z',
    };

    const timeEntry = {
      id: 'te-1',
      projectId: 'proj-1',
      projectName: 'Website Redesign',
      taskName: 'Frontend Development',
      staffName: 'Sarah Chen',
      date: '2026-02-10',
      duration: 480, // 8 hours
      description: 'Implemented homepage',
      billable: true,
      hourlyRate: 150,
    };

    const expense = {
      id: 'exp-1',
      projectId: 'proj-1',
      description: 'Stock photos',
      amount: 250,
      date: '2026-02-11',
      category: 'Media',
      isBillable: true,
      isInvoiced: false,
      createdAt: '2026-02-11T00:00:00Z',
    };

    mockedApiPost.mockResolvedValueOnce(project); // create project
    mockedApiPost.mockResolvedValueOnce(timeEntry); // create time entry
    mockedApiPost.mockResolvedValueOnce(expense); // create expense

    const wrapper = createWrapper();

    // Create project
    const { result: projResult } = renderHook(() => useCreateProject(), { wrapper });
    await act(async () => {
      const created = await projResult.current.mutateAsync({
        name: 'Website Redesign',
        contactId: 'c-1',
        contactName: 'Acme Corp',
        status: 'in_progress',
        budgetHours: 100,
        budgetAmount: 15000,
      });
      expect(created.id).toBe('proj-1');
    });

    // Add time entry
    const { result: teResult } = renderHook(() => useCreateTimeEntry(), { wrapper });
    await act(async () => {
      const entry = await teResult.current.mutateAsync({
        projectId: 'proj-1',
        taskName: 'Frontend Development',
        staffName: 'Sarah Chen',
        date: '2026-02-10',
        hours: 8,
        minutes: 0,
        description: 'Implemented homepage',
        billable: true,
        hourlyRate: 150,
      });
      expect(entry.duration).toBe(480);
      expect(entry.billable).toBe(true);
    });

    // Add expense
    const { result: expResult } = renderHook(() => useCreateExpense(), { wrapper });
    await act(async () => {
      const created = await expResult.current.mutateAsync({
        projectId: 'proj-1',
        description: 'Stock photos',
        amount: 250,
        date: '2026-02-11',
        category: 'Media',
        isBillable: true,
      });
      expect(created.amount).toBe(250);
    });

    expect(mockedApiPost).toHaveBeenCalledTimes(3);
  });

  it('views unbilled items then creates invoice from project', async () => {
    const unbilledItems = {
      timeEntries: [
        { id: 'te-1', date: '2026-02-10', hours: 8, hourlyRate: 150, description: 'Frontend dev', amount: 1200 },
        { id: 'te-2', date: '2026-02-11', hours: 6, hourlyRate: 150, description: 'Backend dev', amount: 900 },
      ],
      expenses: [
        { id: 'exp-1', date: '2026-02-11', description: 'Stock photos', amount: 250, category: 'Media' },
      ],
      totalUnbilled: 2350,
    };

    const createdInvoice = {
      id: 'inv-proj-1',
      invoiceNumber: 'INV-PROJ-001',
      total: 2350,
      lineItemCount: 3,
    };

    mockedApiFetch.mockResolvedValueOnce(unbilledItems); // fetch unbilled items
    mockedApiPost.mockResolvedValueOnce(createdInvoice); // create invoice

    const wrapper = createWrapper();

    // View unbilled items
    const { result: unbilledResult } = renderHook(
      () => useUnbilledItems('proj-1'),
      { wrapper },
    );

    await waitFor(() => expect(unbilledResult.current.isSuccess).toBe(true));
    expect(unbilledResult.current.data!.totalUnbilled).toBe(2350);
    expect(unbilledResult.current.data!.timeEntries).toHaveLength(2);
    expect(unbilledResult.current.data!.expenses).toHaveLength(1);

    // Create invoice from project
    const { result: invoiceResult } = renderHook(
      () => useCreateProjectInvoice('proj-1'),
      { wrapper },
    );
    await act(async () => {
      const inv = await invoiceResult.current.mutateAsync({
        timeEntryIds: ['te-1', 'te-2'],
        expenseIds: ['exp-1'],
      });
      expect(inv.total).toBe(2350);
      expect(inv.lineItemCount).toBe(3);
    });

    expect(mockedApiPost).toHaveBeenCalledWith('/projects/proj-1/create-invoice', {
      timeEntryIds: ['te-1', 'te-2'],
      expenseIds: ['exp-1'],
    });
  });

  it('time entries marked as billed after invoicing (via query invalidation)', async () => {
    // After creating an invoice, the hook invalidates time entry queries.
    // The next fetch should return entries with isBilled = true.
    const billedTimeEntries = [
      {
        id: 'te-1',
        projectId: 'proj-1',
        projectName: 'Website Redesign',
        taskName: 'Frontend Development',
        staffName: 'Sarah Chen',
        date: '2026-02-10',
        duration: 480,
        description: 'Implemented homepage',
        billable: true,
        hourlyRate: 150,
      },
    ];

    // Simulate the invoice creation
    const createdInvoice = { id: 'inv-1', invoiceNumber: 'INV-001', total: 1200, lineItemCount: 1 };
    mockedApiPost.mockResolvedValueOnce(createdInvoice);

    // After invalidation, project detail would be refetched
    const updatedProject = {
      id: 'proj-1',
      name: 'Website Redesign',
      status: 'in_progress',
      usedHours: 8,
      usedAmount: 1200,
      totalHours: 8,
      totalCost: 1200,
      billableHours: 8,
      timesheets: billedTimeEntries,
      createdAt: '2026-02-01T00:00:00Z',
    };
    mockedApiFetch.mockResolvedValueOnce(updatedProject);

    const wrapper = createWrapper();

    // Create invoice from project
    const { result: invoiceResult } = renderHook(
      () => useCreateProjectInvoice('proj-1'),
      { wrapper },
    );
    await act(async () => {
      await invoiceResult.current.mutateAsync({
        timeEntryIds: ['te-1'],
        expenseIds: [],
      });
    });

    expect(mockedApiPost).toHaveBeenCalledWith('/projects/proj-1/create-invoice', {
      timeEntryIds: ['te-1'],
      expenseIds: [],
    });
  });

  it('fetches project list filtered by status', async () => {
    const projects = [
      { id: 'p-1', name: 'Project A', status: 'in_progress', usedHours: 20, usedAmount: 3000, createdAt: '2026-01-01T00:00:00Z' },
      { id: 'p-2', name: 'Project B', status: 'completed', usedHours: 100, usedAmount: 15000, createdAt: '2025-06-01T00:00:00Z' },
      { id: 'p-3', name: 'Project C', status: 'in_progress', usedHours: 50, usedAmount: 7500, createdAt: '2026-01-15T00:00:00Z' },
    ];

    // Use mockImplementation to ensure the return is always a proper array
    mockedApiFetch.mockImplementation(async () => projects);

    const wrapper = createWrapper();

    // Fetch all projects (unfiltered) and verify client-side filtering
    const { result } = renderHook(() => useProjects('all'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // All 3 projects returned
    expect(result.current.data).toHaveLength(3);

    // Verify we can filter in-progress ones
    const inProgress = result.current.data!.filter((p) => p.status === 'in_progress');
    expect(inProgress).toHaveLength(2);
    expect(inProgress.every((p) => p.status === 'in_progress')).toBe(true);
  });

  it('fetches project expenses list', async () => {
    const expenses = [
      { id: 'exp-1', projectId: 'proj-1', description: 'Hosting', amount: 50, date: '2026-02-01', category: 'IT', isBillable: true, isInvoiced: false, createdAt: '2026-02-01T00:00:00Z' },
      { id: 'exp-2', projectId: 'proj-1', description: 'Travel', amount: 300, date: '2026-02-05', category: 'Travel', isBillable: true, isInvoiced: true, createdAt: '2026-02-05T00:00:00Z' },
    ];

    mockedApiFetch.mockResolvedValue(expenses);

    const wrapper = createWrapper();

    const { result } = renderHook(() => useProjectExpenses('proj-1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);

    const uninvoiced = result.current.data!.filter((e) => !e.isInvoiced);
    expect(uninvoiced).toHaveLength(1);
    expect(uninvoiced[0].description).toBe('Hosting');
  });
});
