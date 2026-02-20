import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, ChevronDown } from 'lucide-react';

interface CreateOption {
  label: string;
  href: string;
  group: 'sales' | 'purchases' | 'accounting' | 'banking' | 'contacts';
}

// Exact Xero "Create New" dropdown order
const CREATE_OPTIONS: CreateOption[] = [
  { label: 'Invoice', href: '/sales/invoices/new', group: 'sales' },
  { label: 'Payment link', href: '/sales/payment-links', group: 'sales' },
  { label: 'Bill', href: '/purchases/bills/new', group: 'purchases' },
  { label: 'Contact', href: '/contacts/new', group: 'contacts' },
  { label: 'Quote', href: '/sales/quotes/new', group: 'sales' },
  { label: 'Purchase order', href: '/purchases/purchase-orders/new', group: 'purchases' },
  { label: 'Manual journal', href: '/accounting/manual-journals', group: 'accounting' },
  { label: 'Spend money', href: '/bank/spend', group: 'banking' },
  { label: 'Receive money', href: '/bank/receive', group: 'banking' },
  { label: 'Transfer money', href: '/bank/transfer', group: 'banking' },
];

export function CreateNewDropdown() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={toggle}
        className="inline-flex items-center gap-1.5 rounded-md bg-[#0078c8] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#006bb3] transition-colors"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Create new"
      >
        <Plus className="h-4 w-4" />
        <span>New</span>
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full mt-1 w-52 rounded-md border border-[#e5e7eb] bg-white py-1 shadow-lg z-[60]"
          role="menu"
          data-testid="create-new-menu"
        >
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Create new
          </div>
          {CREATE_OPTIONS.map((opt, idx) => {
            const prevGroup = idx > 0 ? CREATE_OPTIONS[idx - 1].group : null;
            const showDivider = prevGroup !== null && prevGroup !== opt.group;
            return (
              <div key={opt.label}>
                {showDivider && (
                  <div className="my-1 border-t border-[#e5e7eb]" role="separator" />
                )}
                <a
                  href={opt.href}
                  className="block px-4 py-2 text-sm text-[#1a1a2e] hover:bg-gray-50 transition-colors"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  data-testid={`create-option-${opt.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {opt.label}
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
