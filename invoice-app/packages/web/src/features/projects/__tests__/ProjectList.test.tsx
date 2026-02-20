import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectList } from '../components/ProjectList';
import type { Project } from '../types';

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
    contactName: 'Marine Systems', status: 'completed', deadline: '2026-01-31',
    budgetHours: 80, budgetAmount: 12000, usedHours: 72, usedAmount: 10800,
    createdAt: '2025-09-01',
  },
  {
    id: 'proj-4', name: 'Brand Strategy', contactId: 'contact-4',
    contactName: 'Petrie McLean', status: 'in_progress',
    usedHours: 40, usedAmount: 6000, createdAt: '2026-01-10',
  },
];

describe('ProjectList', () => {
  it('renders project cards for each project', () => {
    render(<ProjectList projects={MOCK_PROJECTS} />);
    expect(screen.getByTestId('project-list')).toBeInTheDocument();
    expect(screen.getByText('Website Redesign')).toBeInTheDocument();
    expect(screen.getByText('Mobile App Development')).toBeInTheDocument();
    expect(screen.getByText('Annual Audit 2025')).toBeInTheDocument();
    expect(screen.getByText('Brand Strategy')).toBeInTheDocument();
  });

  it('shows empty state when no projects', () => {
    render(<ProjectList projects={[]} />);
    expect(screen.getByTestId('empty-projects')).toBeInTheDocument();
    expect(screen.getByText('No projects yet')).toBeInTheDocument();
  });

  it('calls onProjectClick with project id when card is clicked', () => {
    const onProjectClick = vi.fn();
    render(<ProjectList projects={MOCK_PROJECTS} onProjectClick={onProjectClick} />);
    fireEvent.click(screen.getByTestId('project-card-proj-1'));
    expect(onProjectClick).toHaveBeenCalledWith('proj-1');
  });

  it('renders contact names on cards', () => {
    render(<ProjectList projects={MOCK_PROJECTS} />);
    expect(screen.getByText('Ridgeway University')).toBeInTheDocument();
    expect(screen.getByText('City Agency')).toBeInTheDocument();
    expect(screen.getByText('Marine Systems')).toBeInTheDocument();
  });

  it('renders status badges', () => {
    render(<ProjectList projects={MOCK_PROJECTS} />);
    const inProgressBadges = screen.getAllByText('In Progress');
    expect(inProgressBadges.length).toBe(3);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders progress bars for budgeted projects', () => {
    render(<ProjectList projects={MOCK_PROJECTS} />);
    const progressBars = screen.getAllByRole('progressbar');
    // proj-1 (200 hours), proj-2 (500 hours), proj-3 (80 hours) have budgets
    expect(progressBars.length).toBe(3);
  });

  it('shows budget amounts on cards', () => {
    render(<ProjectList projects={MOCK_PROJECTS} />);
    // Website Redesign: $18,750.00 / $30,000.00
    expect(screen.getByText(/\$18,750\.00/)).toBeInTheDocument();
    expect(screen.getByText(/\$30,000\.00/)).toBeInTheDocument();
  });

  it('renders a grid layout', () => {
    render(<ProjectList projects={MOCK_PROJECTS} />);
    const grid = screen.getByTestId('project-list');
    expect(grid.className).toContain('grid');
  });
});
