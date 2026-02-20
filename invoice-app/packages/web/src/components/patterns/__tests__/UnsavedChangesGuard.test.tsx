// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { UnsavedChangesGuard } from '../UnsavedChangesGuard';

describe('UnsavedChangesGuard', () => {
  it('does not add beforeunload when not dirty', () => {
    const spy = vi.spyOn(window, 'addEventListener');
    render(<UnsavedChangesGuard isDirty={false} />);
    const beforeUnloadCalls = spy.mock.calls.filter(c => c[0] === 'beforeunload');
    expect(beforeUnloadCalls.length).toBe(0);
    spy.mockRestore();
  });

  it('adds beforeunload when dirty', () => {
    const spy = vi.spyOn(window, 'addEventListener');
    render(<UnsavedChangesGuard isDirty={true} />);
    const beforeUnloadCalls = spy.mock.calls.filter(c => c[0] === 'beforeunload');
    expect(beforeUnloadCalls.length).toBe(1);
    spy.mockRestore();
  });

  it('removes beforeunload on unmount', () => {
    const spy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<UnsavedChangesGuard isDirty={true} />);
    unmount();
    const beforeUnloadCalls = spy.mock.calls.filter(c => c[0] === 'beforeunload');
    expect(beforeUnloadCalls.length).toBe(1);
    spy.mockRestore();
  });
});
