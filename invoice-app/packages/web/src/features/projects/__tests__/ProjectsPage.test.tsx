// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectsPage } from '../routes/ProjectsPage';
import type { Project } from '../types';

const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({}),
  Link: ({ children, to, ...rest }: { children: React.ReactNode; to: string; [key: string]: unknown }) =>
    <a href={to} {...rest}>{children}</a>,
}));

const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-1', name: 'Website Redesign', contactId: 'contact-1',
    contactName: 'Ridgeway University', status: 'in_progress', deadline: '2026-04-15',
    budgetHours: 200, budgetAmount: 30000, usedHours: 125, usedAmount: 18750,
    createdAt: '2025-11-01',
  },
  {
    id: 'proj-2', name: 'Mobile App Development', contactId: 'contact-2',
    contactName: 'City Agency', status: 'in_progress', deadline: '2026-06-30',
    budgetHours: 500, budgetAmount: 75000, usedHours: 180, usedAmount: 27000,
    createdAt: '2025-12-15',
  },
  {
    id: 'proj-3', name: 'Annual Audit 2025', contactId: 'contact-3',
    contactName: 'Marine Systems', status: 'closed', deadline: '2026-01-31',
    budgetHours: 80, budgetAmount: 12000, usedHours: 72, usedAmount: 10800,
    createdAt: '2025-09-01',
  },
  {
    id: 'proj-4', name: 'Brand Strategy', contactId: 'contact-4',
    contactName: 'Petrie McLean', status: 'in_progress',
    usedHours: 40, usedAmount: 6000, createdAt: '2026-01-10',
  },
  {
    id: 'proj-5', name: 'New Branding', contactId: 'contact-5',
    contactName: 'Draft Corp', status: 'draft',
    usedHours: 0, usedAmount: 0, createdAt: '2026-02-01',
  },
];

const MOCK_CONTACTS = [
  { id: 'contact-1', name: 'Ridgeway University', email: '', phone: '', type: 'customer', isArchived: false },
  { id: 'contact-2', name: 'City Agency', email: '', phone: '', type: 'customer', isArchived: false },
  { id: 'contact-3', name: 'Marine Systems', email: '', phone: '', type: 'customer', isArchived: false },
  { id: 'contact-4', name: 'Petrie McLean', email: '', phone: '', type: 'customer', isArchived: false },
  { id: 'contact-5', name: 'Draft Corp', email: '', phone: '', type: 'customer', isArchived: false },
];

function mockFetchSuccess(data: unknown) {
  return vi.fn().mockImplementation((url: string) => {
    let responseData = data;
    if (typeof url === 'string' && url.includes('/contacts')) {
      responseData = MOCK_CONTACTS;
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: responseData }),
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

describe('ProjectsPage', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetchSuccess(MOCK_PROJECTS);
    mockNavigate.mockClear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('renders loading state initially', () => {
    renderWithProviders(<ProjectsPage />);
    expect(screen.getByTestId('projects-loading')).toBeInTheDocument();
  });

  it('renders the page title', async () => {
    renderWithProviders(<ProjectsPage />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Projects' })).toBeInTheDocument();
    });
  });

  it('renders status tabs instead of dropdown', async () => {
    renderWithProviders(<ProjectsPage />);
    await waitFor(() => {
      expect(screen.getByTestId('status-tabs')).toBeInTheDocument();
    });
    expect(screen.getByTestId('tab-draft')).toBeInTheDocument();
    expect(screen.getByTestId('tab-in_progress')).toBeInTheDocument();
    expect(screen.getByTestId('tab-closed')).toBeInTheDocument();
  });

  it('defaults to "In progress" tab and shows only in_progress projects', async () => {
    renderWithProviders(<ProjectsPage />);
    await waitFor(() => {
      expect(screen.getByText('Website Redesign')).toBeInTheDocument();
    });
    // in_progress tab is active by default
    const inProgressTab = screen.getByTestId('tab-in_progress');
    expect(inProgressTab.getAttribute('aria-selected')).toBe('true');
    // should show in_progress projects
    expect(screen.getByText('Mobile App Development')).toBeInTheDocument();
    expect(screen.getByText('Brand Strategy')).toBeInTheDocument();
    // should NOT show closed/draft projects
    expect(screen.queryByText('Annual Audit 2025')).not.toBeInTheDocument();
    expect(screen.queryByText('New Branding')).not.toBeInTheDocument();
  });

  it('shows tab counts', async () => {
    renderWithProviders(<ProjectsPage />);
    await waitFor(() => {
      expect(screen.getByTestId('tab-in_progress')).toBeInTheDocument();
    });
    expect(screen.getByTestId('tab-in_progress').textContent).toContain('(3)');
    expect(screen.getByTestId('tab-closed').textContent).toContain('(1)');
    expect(screen.getByTestId('tab-draft').textContent).toContain('(1)');
  });

  it('renders search box with dynamic placeholder', async () => {
    renderWithProviders(<ProjectsPage />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search in progress projects')).toBeInTheDocument();
    });
  });

  it('renders "All projects" button with count', async () => {
    renderWithProviders(<ProjectsPage />);
    await waitFor(() => {
      expect(screen.getByTestId('all-projects-btn')).toBeInTheDocument();
    });
    expect(screen.getByTestId('all-projects-btn').textContent).toContain('All projects (5)');
  });

  it('renders Contact filter dropdown', async () => {
    renderWithProviders(<ProjectsPage />);
    await waitFor(() => {
      expect(screen.getByTestId('contact-filter')).toBeInTheDocument();
    });
  });

  it('renders "More options" button next to "New project"', async () => {
    renderWithProviders(<ProjectsPage />);
    await waitFor(() => {
      expect(screen.getByTestId('page-more-options-btn')).toBeInTheDocument();
    });
  });

  it('renders the New project button', async () => {
    renderWithProviders(<ProjectsPage />);
    await waitFor(() => {
      expect(screen.getByTestId('new-project-btn')).toBeInTheDocument();
    });
  });

  it('shows client names on project cards', async () => {
    renderWithProviders(<ProjectsPage />);
    await waitFor(() => {
      // Contact names appear both on cards and in the contact filter dropdown
      const ridgeway = screen.getAllByText('Ridgeway University');
      expect(ridgeway.length).toBeGreaterThan(0);
    });
    const cityAgency = screen.getAllByText('City Agency');
    expect(cityAgency.length).toBeGreaterThan(0);
  });

  it('switches tabs and filters projects', async () => {
    renderWithProviders(<ProjectsPage />);
    await waitFor(() => {
      expect(screen.getByText('Website Redesign')).toBeInTheDocument();
    });
    // Click closed tab
    fireEvent.click(screen.getByTestId('tab-closed'));
    await waitFor(() => {
      expect(screen.getByText('Annual Audit 2025')).toBeInTheDocument();
    });
    // Should no longer show in_progress projects
    expect(screen.queryByText('Website Redesign')).not.toBeInTheDocument();
  });

  it('clicking "All projects" button shows all projects', async () => {
    renderWithProviders(<ProjectsPage />);
    await waitFor(() => {
      expect(screen.getByTestId('all-projects-btn')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('all-projects-btn'));
    await waitFor(() => {
      expect(screen.getByText('Website Redesign')).toBeInTheDocument();
    });
    expect(screen.getByText('Annual Audit 2025')).toBeInTheDocument();
    expect(screen.getByText('New Branding')).toBeInTheDocument();
  });

  it('search filters projects by name', async () => {
    renderWithProviders(<ProjectsPage />);
    await waitFor(() => {
      expect(screen.getByText('Website Redesign')).toBeInTheDocument();
    });
    const searchInput = screen.getByPlaceholderText('Search in progress projects');
    fireEvent.change(searchInput, { target: { value: 'mobile' } });
    await waitFor(() => {
      expect(screen.getByText('Mobile App Development')).toBeInTheDocument();
    });
    expect(screen.queryByText('Website Redesign')).not.toBeInTheDocument();
  });

  it('shows pagination footer with item counts', async () => {
    renderWithProviders(<ProjectsPage />);
    await waitFor(() => {
      // The shared Pagination component shows "1-3 of 3" style text
      expect(screen.getByText(/1-3 of 3/)).toBeInTheDocument();
    });
  });

  it('clicking "New project" navigates to /projects/new (no dialog)', async () => {
    renderWithProviders(<ProjectsPage />);
    await waitFor(() => {
      expect(screen.getByTestId('new-project-btn')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('new-project-btn'));
    // No dialog overlay should appear — navigation is triggered instead
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/projects/new' });
  });

  it('renders project cards as card grid (not table)', async () => {
    renderWithProviders(<ProjectsPage />);
    await waitFor(() => {
      expect(screen.getByTestId('project-list')).toBeInTheDocument();
    });
    const list = screen.getByTestId('project-list');
    expect(list.className).toContain('grid');
  });
});
