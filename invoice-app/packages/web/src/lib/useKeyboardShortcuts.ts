import { useEffect, useRef } from 'react';

interface Shortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  handler: () => void;
  description: string;
  category: 'navigation' | 'actions' | 'forms';
}

const registeredShortcuts: Shortcut[] = [];

function isInputElement(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
}

export function useKeyboardShortcut(shortcut: Omit<Shortcut, 'handler'> & { handler: () => void }) {
  const handlerRef = useRef(shortcut.handler);
  handlerRef.current = shortcut.handler;

  useEffect(() => {
    const entry: Shortcut = { ...shortcut, handler: () => handlerRef.current() };
    registeredShortcuts.push(entry);

    function onKeyDown(e: KeyboardEvent) {
      if (isInputElement(e.target)) return;

      const matchesCtrl = shortcut.ctrlKey ? (e.ctrlKey || e.metaKey) : true;
      const matchesShift = shortcut.shiftKey ? e.shiftKey : !e.shiftKey;
      const matchesAlt = shortcut.altKey ? e.altKey : !e.altKey;

      if (e.key.toLowerCase() === shortcut.key.toLowerCase() && matchesCtrl && matchesShift && matchesAlt) {
        e.preventDefault();
        handlerRef.current();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      const idx = registeredShortcuts.indexOf(entry);
      if (idx >= 0) registeredShortcuts.splice(idx, 1);
    };
  }, [shortcut.key, shortcut.ctrlKey, shortcut.metaKey, shortcut.shiftKey, shortcut.altKey]);
}

export function getRegisteredShortcuts(): Shortcut[] {
  return [...registeredShortcuts];
}

export type { Shortcut };
