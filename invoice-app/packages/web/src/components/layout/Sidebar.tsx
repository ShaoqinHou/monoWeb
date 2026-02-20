import { useState, useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import {
  Home,
  FileText,
  ShoppingCart,
  Users,
  BookOpen,
  BarChart3,
  Wallet,
  FolderKanban,
  Receipt,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface SubMenuItem {
  label: string;
  href: string;
  heading?: boolean;
}

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  children?: SubMenuItem[];
}

// Matches Xero's exact primary navigation structure
// See: .claude/workflow/design/xero-nav-structure.md
const navItems: NavItem[] = [
  // 1. Home (direct link, no submenu)
  { label: 'Home', icon: Home, href: '/' },
  // 2. Sales (dropdown — 8 items)
  {
    label: 'Sales',
    icon: FileText,
    href: '/sales',
    children: [
      { label: 'Sales overview', href: '/sales' },
      { label: 'Invoices', href: '/sales/invoices' },
      { label: 'Payment links', href: '/sales/payment-links' },
      { label: 'Online payments', href: '/settings/payment-services' },
      { label: 'Quotes', href: '/sales/quotes' },
      { label: 'Products and services', href: '/sales/products' },
      { label: 'Customers', href: '/contacts?tab=customers' },
      { label: 'Sales settings', href: '/settings?section=sales' },
    ],
  },
  // 3. Purchases (dropdown — 6 items)
  {
    label: 'Purchases',
    icon: ShoppingCart,
    href: '/purchases',
    children: [
      { label: 'Purchases overview', href: '/purchases' },
      { label: 'Bills', href: '/purchases/bills' },
      { label: 'Purchase orders', href: '/purchases/purchase-orders' },
      { label: 'Expenses', href: '/purchases/expenses' },
      { label: 'Suppliers', href: '/contacts?tab=suppliers' },
      { label: 'Purchases settings', href: '/settings?section=purchases' },
    ],
  },
  // 4. Reporting (dropdown — 11 items)
  {
    label: 'Reporting',
    icon: BarChart3,
    href: '/reporting',
    children: [
      { label: 'All reports', href: '/reporting' },
      { label: 'Favourite reports', href: '', heading: true },
      { label: 'Account Transactions', href: '/reporting/account-transactions' },
      { label: 'Aged Payables Summary', href: '/reporting/aged-payables' },
      { label: 'Aged Receivables Summary', href: '/reporting/aged-receivables' },
      { label: 'Balance Sheet', href: '/reporting/balance-sheet' },
      { label: 'GST Returns', href: '/tax/gst-returns' },
      { label: 'Profit and Loss', href: '/reporting/profit-and-loss' },
      { label: 'Short-term cash flow', href: '/reporting/cash-flow-forecast' },
      { label: 'Business snapshot', href: '/reporting/business-snapshot' },
      { label: 'Budgets', href: '/reporting/budgets' },
      { label: 'Trial Balance', href: '/reporting/trial-balance' },
      { label: 'Reporting settings', href: '/settings?section=reporting' },
    ],
  },
  // 5. Payroll (dropdown — 7 items)
  {
    label: 'Payroll',
    icon: Wallet,
    href: '/payroll',
    children: [
      { label: 'Payroll overview', href: '/payroll' },
      { label: 'Employee management', href: '', heading: true },
      { label: 'Employees', href: '/payroll/employees' },
      { label: 'Leave', href: '/payroll/leave-requests' },
      { label: 'Timesheets', href: '/payroll/timesheets' },
      { label: 'Payroll processing', href: '', heading: true },
      { label: 'Pay employees', href: '/payroll/pay-runs' },
      { label: 'Taxes and filings', href: '/payroll/taxes-filings' },
      { label: 'Reports', href: '/payroll/reports' },
      { label: 'Payroll settings', href: '/payroll/settings' },
    ],
  },
  // 6. Accounting (dropdown — 9 items)
  {
    label: 'Accounting',
    icon: BookOpen,
    href: '/accounting',
    children: [
      { label: 'Banking', href: '', heading: true },
      { label: 'Bank accounts', href: '/bank' },
      { label: 'Bank rules', href: '/accounting/bank-rules' },
      { label: 'Accounting tools', href: '', heading: true },
      { label: 'Chart of accounts', href: '/accounting/chart-of-accounts' },
      { label: 'Fixed assets', href: '/accounting/fixed-assets' },
      { label: 'Manual journals', href: '/accounting/manual-journals' },
      { label: 'Find and recode', href: '/accounting/find-and-recode' },
      { label: 'Assurance dashboard', href: '/accounting/assurance-dashboard' },
      { label: 'History and notes', href: '/accounting/history-and-notes' },
      { label: 'Accounting settings', href: '/settings?section=accounting' },
    ],
  },
  // 7. Tax (dropdown — 2 items)
  {
    label: 'Tax',
    icon: Receipt,
    href: '/tax',
    children: [
      { label: 'GST returns', href: '/tax/gst-returns' },
      { label: 'Tax rates', href: '/tax/tax-rates' },
      { label: 'Tax settings', href: '/settings?section=tax' },
    ],
  },
  // 8. Contacts (dropdown — 6 items)
  {
    label: 'Contacts',
    icon: Users,
    href: '/contacts',
    children: [
      { label: 'All contacts', href: '/contacts' },
      { label: 'Customers', href: '/contacts?tab=customers' },
      { label: 'Suppliers', href: '/contacts?tab=suppliers' },
      { label: 'Groups', href: '', heading: true },
      { label: 'Training Customers', href: '/contacts?group=training-customers' },
      { label: 'Contacts settings', href: '/settings?section=contacts' },
    ],
  },
  // 9. Projects (dropdown — 4 items)
  {
    label: 'Projects',
    icon: FolderKanban,
    href: '/projects',
    children: [
      { label: 'All projects', href: '/projects' },
      { label: 'Time entries', href: '/projects/time-entries' },
      { label: 'Staff time overview', href: '/projects/staff-time' },
      { label: 'Projects settings', href: '/settings?section=projects' },
    ],
  },
];

interface SidebarProps {
  activePath?: string;
  activeHref?: string;
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
}

export function Sidebar({ activePath = '/', activeHref = '/', collapsed = false, onToggle, mobileOpen }: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    // Auto-expand section that contains the active path
    const initial = new Set<string>();
    for (const item of navItems) {
      if (item.children) {
        const isChildActive = item.children.some((child) => {
          if (child.heading || child.href === '') return false;
          if (child.href.includes('?')) return child.href === activeHref;
          return child.href === activePath || (child.href !== item.href && activePath.startsWith(child.href) && child.href.startsWith(item.href));
        });
        if (isChildActive) {
          initial.add(item.label);
        }
      }
    }
    return initial;
  });

  const toggleSection = useCallback((label: string) => {
    setExpandedSections((prev) => {
      if (prev.has(label)) {
        return new Set<string>();
      }
      return new Set<string>([label]);
    });
  }, []);

  const isActive = (href: string) => {
    if (href === '/') return activePath === '/';
    return activePath.startsWith(href);
  };

  const mobileClasses = mobileOpen
    ? 'translate-x-0'
    : '-translate-x-full md:translate-x-0';

  return (
    <aside
      className={`${collapsed ? 'w-16' : 'w-56'} bg-[#1a2035] text-gray-300 min-h-[calc(100vh-3.5rem)] fixed top-14 left-0 overflow-y-auto transition-all duration-200 z-40 ${mobileClasses}`}
      role="navigation"
      aria-label="Main navigation"
    >
      <nav className="p-2">
        <ul className="space-y-0.5" role="list">
          {navItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedSections.has(item.label);
            const isSectionActive = isActive(item.href);

            return (
              <li key={item.label}>
                {hasChildren ? (
                  <>
                    <button
                      onClick={() => toggleSection(item.label)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                        isSectionActive
                          ? 'bg-white/15 text-white font-medium'
                          : 'hover:bg-white/10 hover:text-white'
                      }`}
                      aria-expanded={isExpanded}
                      aria-controls={`submenu-${item.label.toLowerCase()}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                      {!collapsed && (
                        <ChevronRight
                          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      )}
                    </button>
                    {isExpanded && !collapsed && (
                      <ul
                        id={`submenu-${item.label.toLowerCase()}`}
                        className="mt-0.5 ml-5 space-y-0.5"
                        role="list"
                      >
                        {item.children!.map((child) => {
                          if (child.heading) {
                            return (
                              <li key={`heading-${child.label}`} aria-hidden="true">
                                <span className="block pl-6 pr-3 pt-3 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                  {child.label}
                                </span>
                              </li>
                            );
                          }
                          const isChildActive = child.href.includes('?')
                            ? child.href === activeHref
                            : (child.href === activePath || (child.href !== '' && child.href !== item.href && activePath.startsWith(child.href) && child.href.startsWith(item.href)));
                          return (
                            <li key={child.href}>
                              <Link
                                to={child.href}
                                className={`block pl-6 pr-3 py-1.5 rounded text-sm transition-colors ${
                                  isChildActive
                                    ? 'bg-white/15 text-white font-medium'
                                    : 'hover:bg-white/10 hover:text-white'
                                }`}
                                aria-current={isChildActive ? 'page' : undefined}
                              >
                                {child.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                      isSectionActive
                        ? 'bg-white/15 text-white font-medium'
                        : 'hover:bg-white/10 hover:text-white'
                    }`}
                    aria-current={isSectionActive ? 'page' : undefined}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      {onToggle && (
        <div className="p-2 border-t border-white/10">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center p-2 rounded hover:bg-white/10 transition-colors"
            data-testid="sidebar-toggle"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      )}
    </aside>
  );
}

// Export for testing
export { navItems };
export type { NavItem, SubMenuItem };
