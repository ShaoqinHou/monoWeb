// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock recharts
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-barchart">{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock @shared/calc/currency
vi.mock('@shared/calc/currency', () => ({
  formatCurrency: (val: number) => `$${val.toFixed(2)}`,
}));

vi.mock('../../../components/ui/Card', () => ({
  Card: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="card" {...props}>{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../../components/ui/Badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

// ── ProjectCard with contact initials ──

describe('ProjectCard with contact initials', () => {
  it('renders contact initials avatar', async () => {
    vi.mock('./ProjectProgress', () => ({
      ProjectProgress: () => <div />,
    }));

    const { ProjectCard } = await import('../components/ProjectCard');
    render(
      <ProjectCard
        project={{
          id: 'p1',
          name: 'Website Redesign',
          contactName: 'John Smith',
          status: 'in_progress',
          usedHours: 20,
          usedAmount: 2000,
          budgetHours: 40,
          budgetAmount: 5000,
          createdAt: '2024-01-01',
        }}
      />,
    );

    // Should show "JS" initials
    expect(screen.getByTestId('project-contact-initials-p1')).toBeInTheDocument();
    expect(screen.getByTestId('project-contact-initials-p1').textContent).toBe('JS');
  });

  it('renders estimate vs spent label', async () => {
    const { ProjectCard } = await import('../components/ProjectCard');
    render(
      <ProjectCard
        project={{
          id: 'p2',
          name: 'Mobile App',
          contactName: 'Jane Doe',
          status: 'completed',
          usedHours: 100,
          usedAmount: 10000,
          budgetAmount: 15000,
          createdAt: '2024-01-01',
        }}
      />,
    );

    expect(screen.getByTestId('project-estimate-spent-p2')).toBeInTheDocument();
    expect(screen.getByText('Estimate vs Spent')).toBeInTheDocument();
  });
});

// ── StaffTimeOverviewPage with bar chart and staff cards ──

describe('StaffTimeOverviewPage enhancements', () => {
  it('renders chargeable chart and staff cards when data available', async () => {
    vi.mock('../hooks/useStaffTimeOverview', () => ({
      useStaffTimeOverview: () => ({
        data: {
          entries: [
            { projectName: 'Website', staffName: 'Alice B', totalHours: 40 },
            { projectName: 'Website', staffName: 'Bob C', totalHours: 30 },
          ],
          staffNames: ['Alice B', 'Bob C'],
          projectNames: ['Website'],
          grandTotal: 70,
        },
        isLoading: false,
      }),
    }));

    const { StaffTimeOverviewPage } = await import('../routes/StaffTimeOverviewPage');
    render(<StaffTimeOverviewPage />);

    expect(screen.getByText('Staff Time Overview')).toBeInTheDocument();
    expect(screen.getByTestId('staff-chargeable-chart')).toBeInTheDocument();
    expect(screen.getByTestId('staff-cards')).toBeInTheDocument();
    expect(screen.getByTestId('staff-time-grid')).toBeInTheDocument();
    expect(screen.getByText('Chargeable vs Non-chargeable')).toBeInTheDocument();
  });
});
