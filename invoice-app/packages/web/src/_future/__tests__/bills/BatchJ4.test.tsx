// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BatchStatusChangeDialog, type StatusChangeItem } from '../components/BatchStatusChangeDialog';
import { getValidTargetStatuses, BILL_STATUS_TRANSITIONS } from '../hooks/useBatchStatusChange';

// Mock api-helpers
vi.mock('../../../lib/api-helpers', () => ({
  apiFetch: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
}));

import { apiPost } from '../../../lib/api-helpers';

const mockedApiPost = vi.mocked(apiPost);

const uuid = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;

const createQueryWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const SAMPLE_ITEMS: StatusChangeItem[] = [
  { id: uuid(1), reference: 'BILL-001', currentStatus: 'draft', contactName: 'Supplier A' },
  { id: uuid(2), reference: 'BILL-002', currentStatus: 'draft', contactName: 'Supplier B' },
  { id: uuid(3), reference: 'BILL-003', currentStatus: 'draft', contactName: 'Supplier C' },
];

describe('BatchStatusChangeDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows valid status transitions for selected items', () => {
    const Wrapper = createQueryWrapper();
    render(
      <Wrapper>
        <BatchStatusChangeDialog open={true} onClose={vi.fn()} items={SAMPLE_ITEMS} />
      </Wrapper>
    );

    // Draft bills can go to submitted or voided
    expect(screen.getByText('Submitted')).toBeTruthy();
    expect(screen.getByText('Voided')).toBeTruthy();
    // Should show all items
    expect(screen.getByText('BILL-001')).toBeTruthy();
    expect(screen.getByText('BILL-002')).toBeTruthy();
    expect(screen.getByText('BILL-003')).toBeTruthy();
  });

  it('applies status change to all selected bills', async () => {
    mockedApiPost.mockResolvedValueOnce({
      succeeded: [
        { id: uuid(1), newStatus: 'submitted' },
        { id: uuid(2), newStatus: 'submitted' },
        { id: uuid(3), newStatus: 'submitted' },
      ],
      failed: [],
    });

    const Wrapper = createQueryWrapper();
    render(
      <Wrapper>
        <BatchStatusChangeDialog open={true} onClose={vi.fn()} items={SAMPLE_ITEMS} />
      </Wrapper>
    );

    // Select "Submitted" from dropdown
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'submitted' } });

    // Click Apply
    fireEvent.click(screen.getByTestId('apply-status-change'));

    await waitFor(() => {
      expect(screen.getByTestId('status-change-result')).toBeTruthy();
      expect(screen.getByText('3 updated successfully')).toBeTruthy();
    });

    expect(mockedApiPost).toHaveBeenCalledWith('/bills/batch-status-change', {
      billIds: [uuid(1), uuid(2), uuid(3)],
      targetStatus: 'submitted',
    });
  });

  it('shows no transitions for terminal statuses', () => {
    const paidItems: StatusChangeItem[] = [
      { id: uuid(4), reference: 'BILL-004', currentStatus: 'paid', contactName: 'Supplier D' },
    ];

    const Wrapper = createQueryWrapper();
    render(
      <Wrapper>
        <BatchStatusChangeDialog open={true} onClose={vi.fn()} items={paidItems} />
      </Wrapper>
    );

    expect(screen.getByText('No valid status transitions available for the selected items.')).toBeTruthy();
  });
});

describe('getValidTargetStatuses', () => {
  it('returns intersection of valid transitions', () => {
    // draft -> [submitted, voided], submitted -> [approved, draft, voided]
    // intersection: [voided]
    const result = getValidTargetStatuses(['draft', 'submitted']);
    expect(result).toEqual(['voided']);
  });

  it('returns all transitions for single status', () => {
    const result = getValidTargetStatuses(['draft']);
    expect(result).toEqual(['submitted', 'voided']);
  });

  it('returns empty for terminal statuses', () => {
    expect(getValidTargetStatuses(['paid'])).toEqual([]);
    expect(getValidTargetStatuses(['voided'])).toEqual([]);
  });

  it('returns empty for empty input', () => {
    expect(getValidTargetStatuses([])).toEqual([]);
  });
});

describe('BILL_STATUS_TRANSITIONS', () => {
  it('defines transitions for all bill statuses', () => {
    expect(BILL_STATUS_TRANSITIONS.draft).toContain('submitted');
    expect(BILL_STATUS_TRANSITIONS.submitted).toContain('approved');
    expect(BILL_STATUS_TRANSITIONS.approved).toContain('paid');
    expect(BILL_STATUS_TRANSITIONS.paid).toEqual([]);
    expect(BILL_STATUS_TRANSITIONS.voided).toEqual([]);
  });
});
