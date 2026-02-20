// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcut, getRegisteredShortcuts } from '../useKeyboardShortcuts';

describe('useKeyboardShortcut', () => {
  it('fires handler on matching keypress', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut({
      key: 'n',
      ctrlKey: true,
      handler,
      description: 'Create new',
      category: 'actions',
    }));

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', ctrlKey: true, bubbles: true }));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('does not fire when key does not match', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut({
      key: 'n',
      ctrlKey: true,
      handler,
      description: 'Create new',
      category: 'actions',
    }));

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', ctrlKey: true, bubbles: true }));
    expect(handler).not.toHaveBeenCalled();
  });

  it('does not fire when typing in input field', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut({
      key: 'n',
      ctrlKey: true,
      handler,
      description: 'Create new',
      category: 'actions',
    }));

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', ctrlKey: true, bubbles: true }));
    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it('registers shortcut in global list', () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcut({
      key: 's',
      ctrlKey: true,
      handler,
      description: 'Save',
      category: 'forms',
    }));

    const shortcuts = getRegisteredShortcuts();
    expect(shortcuts.some(s => s.key === 's' && s.description === 'Save')).toBe(true);
    unmount();
  });

  it('unregisters on unmount', () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcut({
      key: 'z',
      handler,
      description: 'Test',
      category: 'actions',
    }));

    unmount();
    const shortcuts = getRegisteredShortcuts();
    expect(shortcuts.some(s => s.key === 'z' && s.description === 'Test')).toBe(false);
  });
});
