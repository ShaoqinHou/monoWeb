// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock api-helpers
const mockApiFetch = vi.fn();
const mockApiPut = vi.fn();

vi.mock('../../../lib/api-helpers', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  apiPost: vi.fn(),
  apiPut: (...args: unknown[]) => mockApiPut(...args),
  apiDelete: vi.fn(),
}));

import {
  useOrganizationSettings,
  useUserProfile,
  useSaveSettings,
  DEFAULT_SETTINGS,
} from '../hooks/useSettings';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('Settings query hooks', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
    mockApiPut.mockReset();
  });

  it('useOrganizationSettings returns defaults when API returns empty object', async () => {
    mockApiFetch.mockResolvedValue({});

    const { result } = renderHook(() => useOrganizationSettings(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.name).toBe('Demo Company (NZ)');
    expect(result.current.data?.defaultTaxRate).toBe(15);
  });

  it('useOrganizationSettings reads from API when organization key exists', async () => {
    const stored = { ...DEFAULT_SETTINGS, name: 'Custom Company' };
    mockApiFetch.mockResolvedValue({ organization: JSON.stringify(stored) });

    const { result } = renderHook(() => useOrganizationSettings(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.name).toBe('Custom Company');
  });

  it('useOrganizationSettings falls back to defaults on API error', async () => {
    mockApiFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useOrganizationSettings(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.name).toBe('Demo Company (NZ)');
  });

  it('useUserProfile returns mock user', async () => {
    const { result } = renderHook(() => useUserProfile(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.name).toBe('Demo User');
    expect(result.current.data?.email).toBe('demo@xero.com');
  });
});

describe('Settings mutation hooks', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
    mockApiPut.mockReset();
  });

  it('useSaveSettings calls API with merged settings', async () => {
    // Return empty settings initially
    mockApiFetch.mockResolvedValue({});
    mockApiPut.mockResolvedValue({ key: 'organization', value: '{}' });

    const wrapper = createWrapper();

    // First fetch so the query cache has data
    const { result: settingsResult } = renderHook(() => useOrganizationSettings(), { wrapper });
    await waitFor(() => expect(settingsResult.current.isSuccess).toBe(true));

    // Then save
    const { result: saveResult } = renderHook(() => useSaveSettings(), { wrapper });
    saveResult.current.mutate({ name: 'Saved Company' });

    await waitFor(() => expect(saveResult.current.isSuccess).toBe(true));
    expect(saveResult.current.data?.name).toBe('Saved Company');

    // Verify API was called
    expect(mockApiPut).toHaveBeenCalledWith(
      '/settings/organization',
      expect.objectContaining({
        value: expect.stringContaining('Saved Company'),
      }),
    );
    // Other defaults should be preserved
    expect(saveResult.current.data?.defaultTaxRate).toBe(15);
  });

  it('useSaveSettings merges partial updates', async () => {
    // Pre-populate with custom data
    const initial = { ...DEFAULT_SETTINGS, name: 'Original Corp', industry: 'Tech' };
    mockApiFetch.mockResolvedValue({ organization: JSON.stringify(initial) });
    mockApiPut.mockResolvedValue({ key: 'organization', value: '{}' });

    const wrapper = createWrapper();

    // First fetch so the query cache has data
    const { result: settingsResult } = renderHook(() => useOrganizationSettings(), { wrapper });
    await waitFor(() => expect(settingsResult.current.isSuccess).toBe(true));

    // Then save partial update
    const { result: saveResult } = renderHook(() => useSaveSettings(), { wrapper });
    saveResult.current.mutate({ industry: 'Finance' });

    await waitFor(() => expect(saveResult.current.isSuccess).toBe(true));
    expect(saveResult.current.data?.industry).toBe('Finance');
    // name should be preserved from the query cache
    expect(saveResult.current.data?.name).toBe('Original Corp');
  });
});
