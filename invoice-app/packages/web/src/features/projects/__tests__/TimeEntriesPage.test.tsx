import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TimeEntriesPage } from '../routes/ProjectsPage';
import type { Project, TimeEntry } from '../types';

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
];

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
    id: 'te-3', projectId: 'proj-2', projectName: 'Mobile App Development',
    taskName: 'API Integration', staffName: 'James Wilson', date: '2026-02-13',
    duration: 420, description: 'REST API endpoints', billable: true, hourlyRate: 150,
  },
  {
    id: 'te-5', projectId: 'proj-3', projectName: 'Annual Audit 2025',
    taskName: 'Document Review', staffName: 'Sarah Chen', date: '2026-01-20',
    duration: 300, description: 'Q4 review', billable: true, hourlyRate: 150,
  },
  {
    id: 'te-6', projectId: 'proj-1', projectName: 'Website Redesign',
    taskName: 'Project Management', staffName: 'Sarah Chen', date: '2026-02-12',
    duration: 60, description: 'Sprint planning', billable: false, hourlyRate: 150,
  },
];

function createMockFetch() {
  return vi.fn().mockImplementation((url: string) => {
    if (typeof url === 'string' && url.includes('/api/timesheets')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: MOCK_TIME_ENTRIES }),
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: MOCK_PROJECTS }),
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

describe('TimeEntriesPage', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    globalThis.fetch = createMockFetch();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('renders loading state initially', () => {
    renderWithProviders(<TimeEntriesPage />);
    expect(screen.getByTestId('time-entries-loading')).toBeInTheDocument();
  });

  it('renders the page title', async () => {
    renderWithProviders(<TimeEntriesPage />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Time Entries' })).toBeInTheDocument();
    });
  });

  it('renders breadcrumbs', async () => {
    renderWithProviders(<TimeEntriesPage />);
    await waitFor(() => {
      expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument();
    });
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });

  it('renders the time entry table with all entries', async () => {
    renderWithProviders(<TimeEntriesPage />);
    await waitFor(() => {
      expect(screen.getByText('Date')).toBeInTheDocument();
    });
    expect(screen.getByText('Project')).toBeInTheDocument();
    expect(screen.getByText('Task')).toBeInTheDocument();
    expect(screen.getByText('Staff')).toBeInTheDocument();
    expect(screen.getByText('Duration')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('shows time entries from all projects by default', async () => {
    renderWithProviders(<TimeEntriesPage />);
    await waitFor(() => {
      expect(screen.getAllByText('Website Redesign').length).toBeGreaterThan(1);
    });
    expect(screen.getAllByText('Mobile App Development').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Annual Audit 2025').length).toBeGreaterThan(0);
  });

  it('renders the Log Time button', async () => {
    renderWithProviders(<TimeEntriesPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Log Time' })).toBeInTheDocument();
    });
  });

  it('renders the project filter select', async () => {
    renderWithProviders(<TimeEntriesPage />);
    await waitFor(() => {
      const select = document.getElementById('te-project-filter') as HTMLSelectElement;
      expect(select).toBeInTheDocument();
      expect(select.value).toBe('');
    });
  });

  it('shows billable and non-billable badges', async () => {
    renderWithProviders(<TimeEntriesPage />);
    await waitFor(() => {
      const billableBadges = screen.getAllByText('Billable');
      expect(billableBadges.length).toBeGreaterThan(0);
    });
    const nonBillableBadges = screen.getAllByText('Non-billable');
    expect(nonBillableBadges.length).toBeGreaterThan(0);
  });

  it('shows staff names', async () => {
    renderWithProviders(<TimeEntriesPage />);
    await waitFor(() => {
      expect(screen.getAllByText('Sarah Chen').length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText('James Wilson').length).toBeGreaterThan(0);
  });

  it('opens Log Time form dialog when button is clicked', async () => {
    renderWithProviders(<TimeEntriesPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Log Time' })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Log Time' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Log Time', { selector: 'h2' })).toBeInTheDocument();
  });

  it('renders time entry summary bar', async () => {
    renderWithProviders(<TimeEntriesPage />);
    await waitFor(() => {
      expect(screen.getByTestId('time-entry-summary')).toBeInTheDocument();
    });
    expect(screen.getByTestId('summary-total-hours')).toBeInTheDocument();
    expect(screen.getByTestId('summary-billable-hours')).toBeInTheDocument();
    expect(screen.getByTestId('summary-total-cost')).toBeInTheDocument();
  });

  it('renders Delete buttons for time entries', async () => {
    renderWithProviders(<TimeEntriesPage />);
    await waitFor(() => {
      expect(screen.getByText('UI Design')).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByText('Delete');
    expect(deleteButtons.length).toBe(MOCK_TIME_ENTRIES.length);
  });
});
