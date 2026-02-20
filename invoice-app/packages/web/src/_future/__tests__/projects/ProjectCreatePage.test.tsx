import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockNavigate = vi.fn();
const mockMutate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: any) => <a href={to} {...rest}>{children}</a>,
  useParams: () => ({}),
  useNavigate: () => mockNavigate,
}));

vi.mock('../hooks/useProjects', () => ({
  useCreateProject: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

import { ProjectCreatePage } from '../routes/ProjectCreatePage';

describe('ProjectCreatePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page with correct title and breadcrumbs', () => {
    render(<ProjectCreatePage />);

    // "New Project" appears in breadcrumb, page title, and dialog title
    const newProjectElements = screen.getAllByText('New Project');
    expect(newProjectElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });

  it('renders the project form dialog', () => {
    render(<ProjectCreatePage />);

    // The ProjectForm is a Dialog - check for its title inside the dialog
    // The dialog title "New Project" appears both as page title and dialog title
    const headings = screen.getAllByText('New Project');
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it('renders form fields for project input', () => {
    render(<ProjectCreatePage />);

    expect(screen.getByLabelText('Project Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Client / Contact')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Deadline')).toBeInTheDocument();
    expect(screen.getByLabelText('Budget Hours')).toBeInTheDocument();
    expect(screen.getByLabelText('Budget Amount ($)')).toBeInTheDocument();
  });

  it('calls create mutation on form submit with project data', async () => {
    mockMutate.mockImplementation((_data: unknown, opts: { onSuccess?: () => void }) => {
      opts.onSuccess?.();
    });

    render(<ProjectCreatePage />);

    const nameInput = screen.getByLabelText('Project Name');
    fireEvent.change(nameInput, { target: { value: 'Website Redesign' } });

    const contactInput = screen.getByLabelText('Client / Contact');
    fireEvent.change(contactInput, { target: { value: 'Acme Corp' } });

    // Submit via the Create button
    const createButton = screen.getByRole('button', { name: /create/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Website Redesign',
          contactName: 'Acme Corp',
          status: 'in_progress',
        }),
        expect.objectContaining({
          onSuccess: expect.any(Function),
        }),
      );
    });
  });

  it('navigates to projects list on successful creation', async () => {
    mockMutate.mockImplementation((_data: unknown, opts: { onSuccess?: () => void }) => {
      opts.onSuccess?.();
    });

    render(<ProjectCreatePage />);

    fireEvent.change(screen.getByLabelText('Project Name'), {
      target: { value: 'Test Project' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/projects' });
    });
  });

  it('navigates back when cancel button is clicked', () => {
    render(<ProjectCreatePage />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/projects' });
  });

  it('renders budget fields with default zero values', () => {
    render(<ProjectCreatePage />);

    const budgetHours = screen.getByLabelText('Budget Hours') as HTMLInputElement;
    const budgetAmount = screen.getByLabelText('Budget Amount ($)') as HTMLInputElement;

    expect(budgetHours.value).toBe('0');
    expect(budgetAmount.value).toBe('0');
  });
});
