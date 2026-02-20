// @stub - 3 hardcoded orgs, only 1 unlocked. No multi-org backend.
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Lock } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  active: boolean;
  locked: boolean;
}

const ORGS: Organization[] = [
  { id: '1', name: 'Demo Company (NZ)', active: true, locked: false },
  { id: '2', name: 'My Business Ltd', active: false, locked: true },
  { id: '3', name: 'Test Organisation', active: false, locked: true },
];

export function OrgSwitcher() {
  const [open, setOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentOrg = ORGS.find((o) => o.active) ?? ORGS[0];

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
    <div ref={containerRef} className="relative" data-testid="org-switcher">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 px-3 py-1.5 rounded hover:bg-white/10 transition-colors text-sm font-medium text-white"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Switch organization"
        data-testid="org-switcher-trigger"
      >
        <span data-testid="org-switcher-name">{currentOrg.name}</span>
        <ChevronDown className="w-4 h-4 opacity-70" />
      </button>
      {open && (
        <div
          className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-72 rounded-md border border-[#e5e7eb] bg-white py-1 shadow-lg z-50"
          role="listbox"
          aria-label="Organizations"
          data-testid="org-switcher-menu"
        >
          {ORGS.map((org) => (
            <div key={org.id} className="relative">
              <button
                className="flex w-full items-center justify-between px-4 py-2.5 text-sm text-[#1a1a2e] hover:bg-gray-50 transition-colors"
                role="option"
                aria-selected={org.active}
                onClick={() => {
                  if (!org.locked) {
                    setOpen(false);
                  }
                }}
                onMouseEnter={() => org.locked ? setHoveredId(org.id) : undefined}
                onMouseLeave={() => setHoveredId(null)}
                data-testid={`org-option-${org.id}`}
              >
                <div className="flex items-center gap-2">
                  <span className={org.locked ? 'text-[#6b7280]' : ''}>{org.name}</span>
                  {org.locked && (
                    <Lock className="h-3.5 w-3.5 text-[#6b7280]" aria-label="Locked" />
                  )}
                </div>
                {org.active && <Check className="h-4 w-4 text-[#14b8a6]" />}
              </button>
              {org.locked && hoveredId === org.id && (
                <div
                  className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 text-xs bg-[#1a1a2e] text-white rounded shadow-lg whitespace-nowrap z-50"
                  data-testid={`org-tooltip-${org.id}`}
                >
                  Switch to this organisation
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
