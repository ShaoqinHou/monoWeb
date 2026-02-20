import { useState, useEffect } from 'react';
import { Dialog } from '../ui/Dialog';
import { getRegisteredShortcuts, type Shortcut } from '../../lib/useKeyboardShortcuts';

function formatKey(shortcut: Shortcut): string {
  const parts: string[] = [];
  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.shiftKey) parts.push('Shift');
  if (shortcut.altKey) parts.push('Alt');
  parts.push(shortcut.key.toUpperCase());
  return parts.join('+');
}

const BUILT_IN_SHORTCUTS: Array<{ key: string; description: string; category: string }> = [
  { key: 'Ctrl+K', description: 'Open search', category: 'navigation' },
  { key: 'Ctrl+N', description: 'Create new item', category: 'actions' },
  { key: 'Ctrl+S', description: 'Save current form', category: 'forms' },
  { key: 'Escape', description: 'Close dialog / overlay', category: 'navigation' },
  { key: '?', description: 'Show keyboard shortcuts', category: 'navigation' },
];

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      }
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const dynamicShortcuts = getRegisteredShortcuts();
  const allShortcuts = [
    ...BUILT_IN_SHORTCUTS,
    ...dynamicShortcuts.map(s => ({ key: formatKey(s), description: s.description, category: s.category })),
  ];

  const categories = ['navigation', 'actions', 'forms'];

  return (
    <Dialog open={open} onClose={() => setOpen(false)} title="Keyboard Shortcuts" className="max-w-lg">
      <div className="space-y-4">
        {categories.map(cat => {
          const shortcuts = allShortcuts.filter(s => s.category === cat);
          if (shortcuts.length === 0) return null;
          return (
            <div key={cat}>
              <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2 capitalize">{cat}</h3>
              <div className="space-y-1">
                {shortcuts.map(s => (
                  <div key={s.key} className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-700">{s.description}</span>
                    <kbd className="px-2 py-0.5 text-xs font-mono bg-gray-100 rounded border border-gray-200 text-gray-600">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Dialog>
  );
}
