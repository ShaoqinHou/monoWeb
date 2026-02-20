// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeferredFilter } from '../useDeferredFilter';

describe('useDeferredFilter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDeferredFilter('hello'));
    expect(result.current).toBe('hello');
  });

  it('debounces rapid updates', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDeferredFilter(value, 300),
      { initialProps: { value: 'a' } }
    );

    rerender({ value: 'ab' });
    rerender({ value: 'abc' });
    expect(result.current).toBe('a'); // Still initial

    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe('abc'); // Settled to final
  });

  it('settles to final value after delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDeferredFilter(value, 200),
      { initialProps: { value: 'start' } }
    );

    rerender({ value: 'end' });
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toBe('end');
  });
});
