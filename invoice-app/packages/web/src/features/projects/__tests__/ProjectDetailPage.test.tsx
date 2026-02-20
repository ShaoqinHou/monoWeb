import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectDetailPage } from '../routes/ProjectsPage';
import type { ProjectDetail, TimeEntry } from '../types';

const MOCK_TIME_ENTRIES: TimeEntry[] = [
  {
    id: 'te-1', projectId: 'proj-1', projectName: 'Website Redesign',
    taskName: 'UI Design', staffName: 'Sarah Chen', date: '2026-02-14',
    duration: 480, description: 'Homepage wireframes', billable: true, hourlyRate: 150,
  },
  {
    id: 'te-2', projectId: 'proj-1', projectName: 'Website Redesign',
    taskName: 'Development', staffName: 'James Wilson', date: '2026-02-14',
    duration: 360, description: 'Frontend implementation', billable: true, hourlyRate: 150,
  },
  {
    id: 'te-6', projectId: 'proj-1', projectName: 'Website Redesign',
    taskName: 'Project Management', staffName: 'Sarah Chen', date: '2026-02-12',
    duration: 60, description: 'Sprint planning meeting', billable: false, hourlyRate: 150,
  },
];

const MOCK_PROJECT_DETAIL: ProjectDetail = {
  id: 'proj-1', name: 'Website Redesign', contactId: 'contact-1',
  contactName: 'Ridgeway University', status: 'in_progress', deadline: '2026-04-15',
  budgetHours: 200, budgetAmount: 30000, usedHours: 125, usedAmount: 18750,
  createdAt: '2025-11-01',
  totalHours: 15, totalCost: 2250, billableHours: 14,
  timesheets: MOCK_TIME_ENTRIES,
};

const MOCK_PROJECT_NO_BUDGET: ProjectDetail = {
  id: 'proj-4', name: 'Brand Strategy', contactId: 'contact-4',
  contactName: 'Petrie McLean', status: 'in_progress',
  usedHours: 40, usedAmount: 6000, createdAt: '2026-01-10',
  totalHours: 4.5, totalCost: 585, billableHours: 4.5,
  timesheets: [],
};

const MOCK_CONTACTS = [
  { id: 'contact-1', name: 'Ridgeway University', email: '', phone: '', type: 'customer', isArchived: false },
  { id: 'contact-4', name: 'Petrie McLean', email: '', phone: '', type: 'customer', isArchived: false },
];

function createMockFetch(projectData: ProjectDetail, timesheets: TimeEntry[]) {
  return vi.fn().mockImplementation((url: string) => {
    if (typeof url === 'string' && url.includes('/api/contacts')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: MOCK_CONTACTS }),
      } as Response);
    }
    if (typeof url === 'string' && url.includes('/api/timesheets')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: timesheets }),
      } as Response);
    }
    if (typeof url === 'string' && url.includes('/api/project-expenses')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: [] }),
      } as Response);
    }
    if (typeof url === 'string' && url.includes('/api/project-tasks')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: [] }),
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: projectData }),
    } as Response);
  });
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe('ProjectDetailPage', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('renders loading state initially', () => {
    globalThis.fetch = createMockFetch(MOCK_PROJECT_DETAIL, MOCK_TIME_ENTRIES);
    renderWithProviders(<ProjectDetailPage projectId="proj-1" />);
    expect(screen.getByTestId('project-detail-loading')).toBeInTheDocument();
  });

  it('renders the project name as page title', async () => {
    globalThis.fetch = createMockFetch(MOCK_PROJECT_DETAIL, MOCK_TIME_ENTRIES);
    renderWithProviders(<ProjectDetailPage projectId="proj-1" />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Website Redesign' })).toBeInTheDocument();
    });
  });

  it('renders breadcrumbs with Projects link', async () => {
    globalThis.fetch = createMockFetch(MOCK_PROJECT_DETAIL, MOCK_TIME_ENTRIES);
    renderWithProviders(<ProjectDetailPage projectId="proj-1" />);
    await waitFor(() => {
      expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument();
    });
    const projectsLink = screen.getByText('Projects').closest('a');
    expect(projectsLink).toBeInTheDocument();
    expect(projectsLink!.getAttribute('href')).toBe('/projects');
  });

  it('renders tabs: Overview, Tasks, Expenses, Time', async () => {
    globalThis.fetch = createMockFetch(MOCK_PROJECT_DETAIL, MOCK_TIME_ENTRIES);
    renderWithProviders(<ProjectDetailPage projectId="proj-1" />);
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument();
    });
    expect(screen.getByRole('tab', { name: 'Tasks' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Expenses' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Time' })).toBeInTheDocument();
  });

  it('shows Overview tab by default', async () => {
    globalThis.fetch = createMockFetch(MOCK_PROJECT_DETAIL, MOCK_TIME_ENTRIES);
    renderWithProviders(<ProjectDetailPage projectId="proj-1" />);
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
    });
  });

  it('renders project info in Overview tab', async () => {
    globalThis.fetch = createMockFetch(MOCK_PROJECT_DETAIL, MOCK_TIME_ENTRIES);
    renderWithProviders(<ProjectDetailPage projectId="proj-1" />);
    await waitFor(() => {
      expect(screen.getByText('Client')).toBeInTheDocument();
    });
    expect(screen.getByText('Ridgeway University')).toBeInTheDocument();
    expect(screen.getByText('Deadline')).toBeInTheDocument();
  });

  it('renders budget progress bar for budgeted project', async () => {
    globalThis.fetch = createMockFetch(MOCK_PROJECT_DETAIL, MOCK_TIME_ENTRIES);
    renderWithProviders(<ProjectDetailPage projectId="proj-1" />);
    await waitFor(() => {
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });

  it('renders financial summary in Overview tab', async () => {
    globalThis.fetch = createMockFetch(MOCK_PROJECT_DETAIL, MOCK_TIME_ENTRIES);
    renderWithProviders(<ProjectDetailPage projectId="proj-1" />);
    await waitFor(() => {
      expect(screen.getByText('Billable')).toBeInTheDocument();
    });
    expect(screen.getByText('Non-billable')).toBeInTheDocument();
    expect(screen.getByTestId('total-billable')).toBeInTheDocument();
  });

  it('switches to Time tab and shows time entries', async () => {
    globalThis.fetch = createMockFetch(MOCK_PROJECT_DETAIL, MOCK_TIME_ENTRIES);
    renderWithProviders(<ProjectDetailPage projectId="proj-1" />);
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Time' })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('tab', { name: 'Time' }));

    expect(screen.getByRole('tab', { name: 'Time' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('UI Design')).toBeInTheDocument();
    expect(screen.getByText('Development')).toBeInTheDocument();
  });

  it('switches to Tasks tab and shows task board or empty state', async () => {
    globalThis.fetch = createMockFetch(MOCK_PROJECT_DETAIL, MOCK_TIME_ENTRIES);
    renderWithProviders(<ProjectDetailPage projectId="proj-1" />);
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Tasks' })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('tab', { name: 'Tasks' }));
    expect(screen.getByRole('tab', { name: 'Tasks' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: 'Add Task' })).toBeInTheDocument();
  });

  it('switches to Expenses tab and shows expense list or empty state', async () => {
    globalThis.fetch = createMockFetch(MOCK_PROJECT_DETAIL, MOCK_TIME_ENTRIES);
    renderWithProviders(<ProjectDetailPage projectId="proj-1" />);
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Expenses' })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('tab', { name: 'Expenses' }));
    expect(screen.getByRole('tab', { name: 'Expenses' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: 'Add Expense' })).toBeInTheDocument();
  });

  it('shows not found when API returns error for project', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: false, error: 'Not found' }),
    } as Response);
    renderWithProviders(<ProjectDetailPage projectId="nonexistent" />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Project Not Found' })).toBeInTheDocument();
    });
  });

  it('renders budget hours used vs total', async () => {
    globalThis.fetch = createMockFetch(MOCK_PROJECT_DETAIL, MOCK_TIME_ENTRIES);
    renderWithProviders(<ProjectDetailPage projectId="proj-1" />);
    await waitFor(() => {
      expect(screen.getByText('125 / 200')).toBeInTheDocument();
    });
  });

  it('shows "No budget set" for projects without budget', async () => {
    globalThis.fetch = createMockFetch(MOCK_PROJECT_NO_BUDGET, []);
    renderWithProviders(<ProjectDetailPage projectId="proj-4" />);
    await waitFor(() => {
      expect(screen.getByText('No budget set')).toBeInTheDocument();
    });
  });

  it('renders Edit and Delete buttons', async () => {
    globalThis.fetch = createMockFetch(MOCK_PROJECT_DETAIL, MOCK_TIME_ENTRIES);
    renderWithProviders(<ProjectDetailPage projectId="proj-1" />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('shows inline Edit form when Edit button is clicked', async () => {
    globalThis.fetch = createMockFetch(MOCK_PROJECT_DETAIL, MOCK_TIME_ENTRIES);
    renderWithProviders(<ProjectDetailPage projectId="proj-1" />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    // Form renders inline — no dialog overlay
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Edit Project')).toBeInTheDocument();
    expect(screen.getByTestId('project-form-inline')).toBeInTheDocument();
  });
});
