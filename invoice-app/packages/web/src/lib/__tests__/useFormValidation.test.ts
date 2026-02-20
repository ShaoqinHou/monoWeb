// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormValidation } from '../useFormValidation';

describe('useFormValidation', () => {
  it('starts with no touched fields', () => {
    const { result } = renderHook(() => useFormValidation());
    expect(result.current.isTouched('email')).toBe(false);
  });

  it('marks field as touched', () => {
    const { result } = renderHook(() => useFormValidation());
    act(() => { result.current.touchField('email'); });
    expect(result.current.isTouched('email')).toBe(true);
    expect(result.current.isTouched('name')).toBe(false);
  });

  it('resets all touched fields', () => {
    const { result } = renderHook(() => useFormValidation());
    act(() => {
      result.current.touchField('email');
      result.current.touchField('name');
    });
    expect(result.current.isTouched('email')).toBe(true);
    act(() => { result.current.resetTouched(); });
    expect(result.current.isTouched('email')).toBe(false);
    expect(result.current.isTouched('name')).toBe(false);
  });

  it('exposes touchedFields set', () => {
    const { result } = renderHook(() => useFormValidation());
    act(() => { result.current.touchField('x'); });
    expect(result.current.touchedFields.has('x')).toBe(true);
  });
});
