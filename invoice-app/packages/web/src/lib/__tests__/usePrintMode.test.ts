// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePrintMode } from '../usePrintMode';

// jsdom doesn't implement matchMedia — provide a minimal stub
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe('usePrintMode', () => {
  it('returns false by default', () => {
    const { result } = renderHook(() => usePrintMode());
    expect(result.current.isPrinting).toBe(false);
  });

  it('responds to beforeprint event', () => {
    const { result } = renderHook(() => usePrintMode());
    act(() => {
      window.dispatchEvent(new Event('beforeprint'));
    });
    expect(result.current.isPrinting).toBe(true);
  });

  it('responds to afterprint event', () => {
    const { result } = renderHook(() => usePrintMode());
    act(() => {
      window.dispatchEvent(new Event('beforeprint'));
    });
    expect(result.current.isPrinting).toBe(true);
    act(() => {
      window.dispatchEvent(new Event('afterprint'));
    });
    expect(result.current.isPrinting).toBe(false);
  });
});
