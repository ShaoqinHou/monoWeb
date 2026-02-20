// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// ─── Mock api-helpers ────────────────────────────────────────────────────────

const mockApiFetch = vi.fn();
const mockApiPost = vi.fn();
const mockApiPut = vi.fn();

vi.mock('../../../lib/api-helpers', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  apiPost: (...args: unknown[]) => mockApiPost(...args),
  apiPut: (...args: unknown[]) => mockApiPut(...args),
  apiDelete: vi.fn(),
}));

vi.mock('@shared/calc/currency', () => ({
  formatCurrency: (amount: number) =>
    `$${amount.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
}));

// ─── Imports (after mocks) ──────────────────────────────────────────────────

import { LeaveTypeList } from '../components/LeaveTypeList';
import { LeaveTypeForm } from '../components/LeaveTypeForm';
import { useLeaveTypes, useCreateLeaveType, useDeleteLeaveType } from '../hooks/useLeaveTypes';
import type { LeaveType } from '../hooks/useLeaveTypes';

// ─── Test helpers ───────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const SAMPLE_LEAVE_TYPES: LeaveType[] = [
  { id: 'lt-annual', name: 'Annual Leave', paidLeave: true, showOnPayslip: true, defaultDaysPerYear: 20 },
  { id: 'lt-sick', name: 'Sick Leave', paidLeave: true, showOnPayslip: true, defaultDaysPerYear: 5 },
  { id: 'lt-unpaid', name: 'Leave Without Pay', paidLeave: false, showOnPayslip: true, defaultDaysPerYear: 0 },
];

const DEFAULT_LEAVE_TYPES: LeaveType[] = [
  { id: 'lt-annual', name: 'Annual Leave', paidLeave: true, showOnPayslip: true, defaultDaysPerYear: 20 },
  { id: 'lt-sick', name: 'Sick Leave', paidLeave: true, showOnPayslip: true, defaultDaysPerYear: 5 },
  { id: 'lt-bereavement', name: 'Bereavement Leave', paidLeave: true, showOnPayslip: true, defaultDaysPerYear: 3 },
  { id: 'lt-parental', name: 'Parental Leave', paidLeave: true, showOnPayslip: false, defaultDaysPerYear: 0 },
  { id: 'lt-unpaid', name: 'Leave Without Pay', paidLeave: false, showOnPayslip: true, defaultDaysPerYear: 0 },
];

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('LeaveTypeList', () => {
  it('renders all leave types', () => {
    render(
      <LeaveTypeList leaveTypes={SAMPLE_LEAVE_TYPES} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByText('Annual Leave')).toBeInTheDocument();
    expect(screen.getByText('Sick Leave')).toBeInTheDocument();
    expect(screen.getByText('Leave Without Pay')).toBeInTheDocument();
  });

  it('shows Paid/Unpaid badges', () => {
    render(
      <LeaveTypeList leaveTypes={SAMPLE_LEAVE_TYPES} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );
    const paidBadges = screen.getAllByText('Paid');
    expect(paidBadges.length).toBe(2); // Annual + Sick
    expect(screen.getByText('Unpaid')).toBeInTheDocument();
  });

  it('shows empty state when no leave types', () => {
    render(
      <LeaveTypeList leaveTypes={[]} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByTestId('leave-types-empty')).toBeInTheDocument();
  });

  it('calls onDelete when delete button clicked', () => {
    const onDelete = vi.fn();
    render(
      <LeaveTypeList leaveTypes={SAMPLE_LEAVE_TYPES} onEdit={vi.fn()} onDelete={onDelete} />,
    );
    fireEvent.click(screen.getByTestId('delete-leave-type-lt-annual'));
    expect(onDelete).toHaveBeenCalledWith('lt-annual');
  });
});

describe('LeaveTypeForm', () => {
  it('renders form fields', () => {
    render(<LeaveTypeForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText('Leave Type Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Default Days Per Year')).toBeInTheDocument();
    expect(screen.getByTestId('leave-type-paid')).toBeInTheDocument();
  });

  it('submits new leave type', () => {
    const onSubmit = vi.fn();
    render(<LeaveTypeForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Leave Type Name'), {
      target: { value: 'Family Leave' },
    });
    fireEvent.change(screen.getByLabelText('Default Days Per Year'), {
      target: { value: '10' },
    });
    fireEvent.click(screen.getByTestId('save-leave-type'));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Family Leave', defaultDaysPerYear: 10 }),
    );
  });

  it('pre-fills form when editing', () => {
    const existing: LeaveType = {
      id: 'lt-edit',
      name: 'Edit Leave',
      paidLeave: false,
      showOnPayslip: true,
      defaultDaysPerYear: 15,
    };
    render(<LeaveTypeForm leaveType={existing} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText('Leave Type Name')).toHaveValue('Edit Leave');
    expect(screen.getByLabelText('Default Days Per Year')).toHaveValue(15);
    expect(screen.getByTestId('leave-type-paid')).not.toBeChecked();
  });
});

describe('useLeaveTypes hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads leave types from API', async () => {
    mockApiFetch.mockResolvedValueOnce(DEFAULT_LEAVE_TYPES);
    const { result } = renderHook(() => useLeaveTypes(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data!.length).toBe(5);
    expect(result.current.data![0].name).toBe('Annual Leave');
  });

  it('useCreateLeaveType creates a new leave type via API', async () => {
    const newLeaveType: LeaveType = {
      id: 'lt-custom',
      name: 'Custom Leave',
      paidLeave: false,
      showOnPayslip: false,
      defaultDaysPerYear: 5,
    };
    mockApiPost.mockResolvedValueOnce(newLeaveType);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCreateLeaveType(), { wrapper });

    await act(async () => {
      result.current.mutate({
        name: 'Custom Leave',
        paidLeave: false,
        showOnPayslip: false,
        defaultDaysPerYear: 5,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
    expect(result.current.data!.name).toBe('Custom Leave');
    expect(mockApiPost).toHaveBeenCalledWith('/leave-types', {
      name: 'Custom Leave',
      paidLeave: false,
      showOnPayslip: false,
      defaultDaysPerYear: 5,
    });
  });
});

describe('EmployeeForm tax fields', () => {
  it('renders tax code dropdown with NZ tax codes', async () => {
    // Dynamically import to get the form with updated tax code Select
    const { EmployeeForm } = await import('../components/EmployeeForm');
    render(<EmployeeForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

    const taxSelect = screen.getByLabelText('Tax Code');
    expect(taxSelect).toBeInTheDocument();
    expect(taxSelect.tagName).toBe('SELECT');
  });

  it('renders IRD number input with placeholder', async () => {
    const { EmployeeForm } = await import('../components/EmployeeForm');
    render(<EmployeeForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

    const irdInput = screen.getByLabelText('IRD Number');
    expect(irdInput).toBeInTheDocument();
    expect(irdInput).toHaveAttribute('placeholder', 'XX-XXX-XXX');
  });
});
