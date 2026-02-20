// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { UndoReconciliationButton } from '../components/UndoReconciliationButton';
import { BankFeedStatus } from '../components/BankFeedStatus';
import { BankFeedSetup } from '../components/BankFeedSetup';
import { useUndoReconciliation } from '../hooks/useUndoReconciliation';

// ── Mock api-helpers ────────────────────────────────────────────────────────

vi.mock('../../../../lib/api-helpers', () => ({
  apiPut: vi.fn().mockResolvedValue({
    id: 'tx-1',
    isReconciled: false,
    matchedInvoiceId: null,
    matchedBillId: null,
  }),
}));

// ── Helpers ─────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.useFakeTimers();
});

// ── UndoReconciliation Hook ─────────────────────────────────────────────────

describe('useUndoReconciliation', () => {
  it('calls apiPut with correct endpoint and body', async () => {
    vi.useRealTimers();
    const { apiPut } = await import('../../../../lib/api-helpers');
    const { result } = renderHook(() => useUndoReconciliation(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync('tx-123');
    });

    expect(apiPut).toHaveBeenCalledWith('/bank-transactions/tx-123', {
      isReconciled: false,
      matchedInvoiceId: null,
      matchedBillId: null,
      category: null,
    });
  });
});

// ── UndoReconciliationButton ────────────────────────────────────────────────

describe('UndoReconciliationButton', () => {
  it('renders Undo button', () => {
    render(
      <UndoReconciliationButton transactionId="tx-1" />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText('Undo')).toBeInTheDocument();
  });

  it('shows confirm dialog when clicked', async () => {
    render(
      <UndoReconciliationButton transactionId="tx-1" transactionDescription="Office Supplies" />,
      { wrapper: createWrapper() },
    );

    fireEvent.click(screen.getByText('Undo'));
    // Dialog title + confirm button both say "Undo Reconciliation"
    const undoElements = screen.getAllByText('Undo Reconciliation');
    expect(undoElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/Are you sure/)).toBeInTheDocument();
    expect(screen.getByText(/Office Supplies/)).toBeInTheDocument();
  });

  it('shows Cancel and Undo Reconciliation buttons in dialog', () => {
    render(
      <UndoReconciliationButton transactionId="tx-1" />,
      { wrapper: createWrapper() },
    );

    fireEvent.click(screen.getByText('Undo'));
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    // The dialog has a destructive "Undo Reconciliation" button
    const confirmBtns = screen.getAllByText('Undo Reconciliation');
    expect(confirmBtns.length).toBeGreaterThan(0);
  });
});

// ── BankFeedStatus ──────────────────────────────────────────────────────────

describe('BankFeedStatus', () => {
  it('shows connected status with green dot', () => {
    render(
      <BankFeedStatus
        bankName="ANZ"
        isConnected={true}
        lastSyncTime="2026-02-16T10:00:00Z"
      />,
    );
    expect(screen.getByText('ANZ')).toBeInTheDocument();
    expect(screen.getByText(/Connected/)).toBeInTheDocument();
    expect(screen.getByText(/Last sync/)).toBeInTheDocument();

    const dot = screen.getByTestId('feed-status-dot');
    expect(dot.className).toContain('bg-green-500');
  });

  it('shows Refresh button when connected', () => {
    render(
      <BankFeedStatus bankName="ASB" isConnected={true} />,
    );
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('does not show Refresh button when disconnected', () => {
    render(
      <BankFeedStatus bankName="BNZ" isConnected={false} />,
    );
    expect(screen.queryByText('Refresh')).toBeNull();
    expect(screen.getByText(/Disconnected/)).toBeInTheDocument();
  });
});

// ── BankFeedSetup ───────────────────────────────────────────────────────────

describe('BankFeedSetup', () => {
  it('renders bank selection dropdown with NZ banks', () => {
    render(<BankFeedSetup accountId="acc-1" />, { wrapper: createWrapper() });
    expect(screen.getByText('Import Bank Transactions')).toBeInTheDocument();
    expect(screen.getByText('Select your bank')).toBeInTheDocument();

    // Check dropdown has bank options
    const options = screen.getAllByRole('option');
    const labels = options.map((o) => o.textContent);
    expect(labels).toContain('ANZ');
    expect(labels).toContain('ASB');
    expect(labels).toContain('BNZ');
    expect(labels).toContain('Westpac');
    expect(labels).toContain('Kiwibank');
  });

  it('shows upload step with file input initially', () => {
    render(<BankFeedSetup accountId="acc-1" />, { wrapper: createWrapper() });
    expect(screen.getByTestId('setup-upload')).toBeInTheDocument();
    expect(screen.getByTestId('csv-file-input')).toBeInTheDocument();
  });

  it('shows CSV file input that accepts csv and ofx', () => {
    render(<BankFeedSetup accountId="acc-1" />, { wrapper: createWrapper() });
    const fileInput = screen.getByTestId('csv-file-input');
    expect(fileInput.getAttribute('accept')).toBe('.csv,.ofx');
  });
});
