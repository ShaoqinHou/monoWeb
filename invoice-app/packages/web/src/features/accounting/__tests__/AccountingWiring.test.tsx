// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import {
  useRunDepreciation,
  previewDepreciation,
  calculateDepreciation,
} from '../hooks/useDepreciation';
import type { DepreciationEntry } from '../hooks/useDepreciation';
import { useImportAccounts } from '../hooks/useAccounts';
import type { FixedAsset } from '../hooks/useFixedAssets';
import { DepreciationRunner } from '../components/DepreciationRunner';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  vi.restoreAllMocks();
});

function mockFetchOk(data: unknown) {
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ ok: true, data }),
  });
}

// ── Depreciation Runner Tests ──────────────────────────────────────────────

describe('calculateDepreciation', () => {
  it('calculates straight-line depreciation (cost * rate / 100 / 12)', () => {
    const asset: FixedAsset = {
      id: 'a1',
      name: 'Laptop',
      assetNumber: 'FA-0001',
      purchaseDate: '2025-01-01',
      purchasePrice: 2400,
      depreciationMethod: 'straight_line',
      depreciationRate: 25,
      currentValue: 2000,
      accumulatedDepreciation: 400,
      assetAccountCode: '1-1000',
      depreciationAccountCode: '6-2000',
      status: 'registered',
      disposalDate: null,
      disposalPrice: null,
      createdAt: '2025-01-01',
    };

    const result = calculateDepreciation(asset, '2026-02');
    expect(result).not.toBeNull();
    // 2400 * 25 / 100 / 12 = 50
    expect(result!.amount).toBe(50);
    expect(result!.debitAccount).toBe('6-2000');
    expect(result!.creditAccount).toBe('1-1000');
  });

  it('calculates diminishing value depreciation (currentValue * rate / 100 / 12)', () => {
    const asset: FixedAsset = {
      id: 'a2',
      name: 'Vehicle',
      assetNumber: 'FA-0002',
      purchaseDate: '2025-01-01',
      purchasePrice: 30000,
      depreciationMethod: 'diminishing_value',
      depreciationRate: 30,
      currentValue: 21000,
      accumulatedDepreciation: 9000,
      assetAccountCode: '1-2000',
      depreciationAccountCode: '6-3000',
      status: 'registered',
      disposalDate: null,
      disposalPrice: null,
      createdAt: '2025-01-01',
    };

    const result = calculateDepreciation(asset, '2026-02');
    expect(result).not.toBeNull();
    // 21000 * 30 / 100 / 12 = 525
    expect(result!.amount).toBe(525);
  });

  it('returns null for disposed assets', () => {
    const asset: FixedAsset = {
      id: 'a3',
      name: 'Old Printer',
      assetNumber: 'FA-0003',
      purchaseDate: '2020-01-01',
      purchasePrice: 500,
      depreciationMethod: 'straight_line',
      depreciationRate: 20,
      currentValue: 0,
      accumulatedDepreciation: 500,
      assetAccountCode: '1-1000',
      depreciationAccountCode: '6-2000',
      status: 'disposed',
      disposalDate: '2025-06-01',
      disposalPrice: 0,
      createdAt: '2020-01-01',
    };

    const result = calculateDepreciation(asset, '2026-02');
    expect(result).toBeNull();
  });
});

describe('previewDepreciation', () => {
  it('aggregates entries and total for multiple assets', () => {
    const assets: FixedAsset[] = [
      {
        id: 'a1', name: 'Laptop', assetNumber: 'FA-0001',
        purchaseDate: '2025-01-01', purchasePrice: 2400,
        depreciationMethod: 'straight_line', depreciationRate: 25,
        currentValue: 2000, accumulatedDepreciation: 400,
        assetAccountCode: '1-1000', depreciationAccountCode: '6-2000',
        status: 'registered', disposalDate: null, disposalPrice: null, createdAt: '2025-01-01',
      },
      {
        id: 'a2', name: 'Desk', assetNumber: 'FA-0002',
        purchaseDate: '2025-01-01', purchasePrice: 1200,
        depreciationMethod: 'straight_line', depreciationRate: 10,
        currentValue: 1100, accumulatedDepreciation: 100,
        assetAccountCode: '1-1000', depreciationAccountCode: '6-2000',
        status: 'registered', disposalDate: null, disposalPrice: null, createdAt: '2025-01-01',
      },
    ];

    const result = previewDepreciation(assets, '2026-02');
    expect(result.entries).toHaveLength(2);
    // Laptop: 2400*25/100/12 = 50, Desk: 1200*10/100/12 = 10
    expect(result.totalDepreciation).toBe(60);
  });
});

describe('useRunDepreciation', () => {
  it('sends POST to /api/fixed-assets/depreciate', async () => {
    mockFetchOk({
      journalId: 'j-1',
      assetsProcessed: 2,
      journalEntriesCreated: 4,
      message: 'Depreciation processed for 2 assets, 4 journal entries created',
    });

    const { result } = renderHook(() => useRunDepreciation(), {
      wrapper: createWrapper(),
    });

    const entries: DepreciationEntry[] = [
      { assetId: 'a1', assetName: 'Laptop', amount: 50, debitAccount: '6-2000', creditAccount: '1-1000', period: '2026-02' },
      { assetId: 'a2', assetName: 'Desk', amount: 10, debitAccount: '6-2000', creditAccount: '1-1000', period: '2026-02' },
    ];

    result.current.mutate({ period: '2026-02', entries });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/fixed-assets/depreciate',
      expect.objectContaining({ method: 'POST' }),
    );

    const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(callBody.period).toBe('2026-02');
    expect(callBody.entries).toHaveLength(2);

    expect(result.current.data!.assetsProcessed).toBe(2);
    expect(result.current.data!.message).toContain('Depreciation processed');
  });
});

// ── Import Chart of Accounts Tests ─────────────────────────────────────────

describe('useImportAccounts', () => {
  it('sends POST to /api/accounts/import with account data', async () => {
    mockFetchOk({
      imported: 3,
      skipped: 0,
      skippedDetails: [],
      message: '3 accounts imported',
    });

    const { result } = renderHook(() => useImportAccounts(), {
      wrapper: createWrapper(),
    });

    result.current.mutate([
      { code: '4-0100', name: 'Sales', type: 'revenue' },
      { code: '6-0100', name: 'Rent', type: 'expense' },
      { code: '1-0100', name: 'Cash', type: 'asset', taxType: 'none' },
    ]);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/accounts/import',
      expect.objectContaining({ method: 'POST' }),
    );

    const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(callBody.accounts).toHaveLength(3);
    expect(callBody.accounts[0].code).toBe('4-0100');

    expect(result.current.data!.imported).toBe(3);
    expect(result.current.data!.message).toContain('3 accounts imported');
  });

  it('reports skipped duplicates in result', async () => {
    mockFetchOk({
      imported: 2,
      skipped: 1,
      skippedDetails: [{ code: '4-0000', reason: 'Duplicate code' }],
      message: '2 accounts imported, 1 skipped (Duplicate code)',
    });

    const { result } = renderHook(() => useImportAccounts(), {
      wrapper: createWrapper(),
    });

    result.current.mutate([
      { code: '4-0000', name: 'Existing', type: 'revenue' },
      { code: '4-0200', name: 'New Sales', type: 'revenue' },
      { code: '6-0200', name: 'New Expense', type: 'expense' },
    ]);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data!.imported).toBe(2);
    expect(result.current.data!.skipped).toBe(1);
    expect(result.current.data!.skippedDetails[0].reason).toBe('Duplicate code');
  });
});

// ── DepreciationRunner Component Tests ─────────────────────────────────────

describe('DepreciationRunner component', () => {
  it('renders run depreciation button and opens dialog', () => {
    const assets: FixedAsset[] = [
      {
        id: 'a1', name: 'Laptop', assetNumber: 'FA-0001',
        purchaseDate: '2025-01-01', purchasePrice: 2400,
        depreciationMethod: 'straight_line', depreciationRate: 25,
        currentValue: 2000, accumulatedDepreciation: 400,
        assetAccountCode: '1-1000', depreciationAccountCode: '6-2000',
        status: 'registered', disposalDate: null, disposalPrice: null, createdAt: '2025-01-01',
      },
    ];

    const onRun = vi.fn();
    render(createElement(DepreciationRunner, { assets, onRun }));

    const btn = screen.getByTestId('run-depreciation-btn');
    expect(btn).toBeInTheDocument();
    expect(btn.textContent).toContain('Run Depreciation');

    fireEvent.click(btn);

    // After opening dialog, should show the depreciation preview table
    expect(screen.getByTestId('depreciation-preview-table')).toBeInTheDocument();
    expect(screen.getByTestId('total-depreciation')).toBeInTheDocument();
  });
});
