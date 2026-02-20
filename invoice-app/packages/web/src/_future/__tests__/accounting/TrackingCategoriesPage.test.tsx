// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockCategories: Array<{ id: string; name: string; options: Array<{ id: string; name: string }>; createdAt: string }> = [];
let mockIsLoading = false;
const mockCreateMutate = vi.fn();
const mockDeleteMutate = vi.fn();

vi.mock('../hooks/useTrackingCategories', () => ({
  useTrackingCategories: () => ({
    data: mockCategories,
    isLoading: mockIsLoading,
  }),
  useCreateTrackingCategory: () => ({
    mutate: mockCreateMutate,
    isPending: false,
  }),
  useUpdateTrackingCategory: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useDeleteTrackingCategory: () => ({
    mutate: mockDeleteMutate,
    isPending: false,
  }),
}));

vi.mock('../../../components/layout/PageContainer', () => ({
  PageContainer: ({ children, title, actions }: { children: React.ReactNode; title: string; actions?: React.ReactNode }) => (
    <div data-testid="page-container">
      <h1>{title}</h1>
      {actions}
      {children}
    </div>
  ),
}));

vi.mock('../../../components/ui/Button', () => ({
  Button: (props: Record<string, unknown>) => (
    <button
      onClick={props.onClick as () => void}
      data-testid={props['data-testid'] as string}
      className={props.className as string}
    >
      {props.children as React.ReactNode}
    </button>
  ),
}));

vi.mock('../../../components/ui/Table', () => ({
  Table: (props: Record<string, unknown>) => <table data-testid={props['data-testid'] as string}>{props.children as React.ReactNode}</table>,
  TableHeader: (props: Record<string, unknown>) => <thead>{props.children as React.ReactNode}</thead>,
  TableBody: (props: Record<string, unknown>) => <tbody>{props.children as React.ReactNode}</tbody>,
  TableRow: (props: Record<string, unknown>) => <tr data-testid={props['data-testid'] as string}>{props.children as React.ReactNode}</tr>,
  TableHead: (props: Record<string, unknown>) => <th>{props.children as React.ReactNode}</th>,
  TableCell: (props: Record<string, unknown>) => <td>{props.children as React.ReactNode}</td>,
}));

vi.mock('../components/TrackingCategoryForm', () => ({
  TrackingCategoryForm: ({ onSubmit }: { onSubmit: (data: unknown) => void }) => (
    <div data-testid="tracking-category-form">
      <button data-testid="mock-submit-form" onClick={() => onSubmit({ name: 'Test', options: ['A'] })}>
        Submit
      </button>
    </div>
  ),
}));

import { TrackingCategoriesPage } from '../../../_future/components/accounting/TrackingCategoriesPage';

const MOCK_CATEGORIES = [
  {
    id: 'tc1',
    name: 'Region',
    options: [
      { id: 'o1', name: 'North' },
      { id: 'o2', name: 'South' },
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tc2',
    name: 'Department',
    options: [
      { id: 'o3', name: 'Engineering' },
    ],
    createdAt: '2024-02-01T00:00:00.000Z',
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockCategories.length = 0;
  mockIsLoading = false;
});

describe('TrackingCategoriesPage', () => {
  it('renders page title', () => {
    render(<TrackingCategoriesPage />);
    expect(screen.getByText('Tracking Categories')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockIsLoading = true;
    render(<TrackingCategoriesPage />);
    expect(screen.getByTestId('categories-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading tracking categories...')).toBeInTheDocument();
  });

  it('shows empty state when no categories', () => {
    render(<TrackingCategoriesPage />);
    expect(screen.getByTestId('categories-empty')).toBeInTheDocument();
    expect(screen.getByText(/No tracking categories found/)).toBeInTheDocument();
  });

  it('renders categories table with data', () => {
    mockCategories.push(...MOCK_CATEGORIES);
    render(<TrackingCategoriesPage />);
    expect(screen.getByTestId('categories-table')).toBeInTheDocument();
    expect(screen.getByText('Region')).toBeInTheDocument();
    expect(screen.getByText('North, South')).toBeInTheDocument();
    expect(screen.getByText('Department')).toBeInTheDocument();
  });

  it('renders edit and delete buttons for each category', () => {
    mockCategories.push(...MOCK_CATEGORIES);
    render(<TrackingCategoriesPage />);
    expect(screen.getByTestId('edit-category-tc1')).toBeInTheDocument();
    expect(screen.getByTestId('delete-category-tc1')).toBeInTheDocument();
    expect(screen.getByTestId('edit-category-tc2')).toBeInTheDocument();
  });

  it('shows New Category button', () => {
    render(<TrackingCategoriesPage />);
    expect(screen.getByTestId('new-category-btn')).toBeInTheDocument();
  });

  it('shows form when New Category button is clicked', async () => {
    const user = userEvent.setup();
    render(<TrackingCategoriesPage />);

    await user.click(screen.getByTestId('new-category-btn'));
    expect(screen.getByTestId('tracking-category-form')).toBeInTheDocument();
    expect(screen.getByText('New Tracking Category')).toBeInTheDocument();
  });

  it('calls delete mutation when delete is clicked', () => {
    mockCategories.push(...MOCK_CATEGORIES);
    render(<TrackingCategoriesPage />);

    fireEvent.click(screen.getByTestId('delete-category-tc1'));
    expect(mockDeleteMutate).toHaveBeenCalledWith('tc1');
  });

  it('shows edit form when edit is clicked', async () => {
    mockCategories.push(...MOCK_CATEGORIES);
    const user = userEvent.setup();
    render(<TrackingCategoriesPage />);

    await user.click(screen.getByTestId('edit-category-tc1'));
    expect(screen.getByText('Edit Tracking Category')).toBeInTheDocument();
    expect(screen.getByTestId('tracking-category-form')).toBeInTheDocument();
  });
});
