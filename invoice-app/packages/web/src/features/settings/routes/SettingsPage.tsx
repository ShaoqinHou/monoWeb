import { useState, useEffect } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { InviteUserDialog } from '../components/InviteUserDialog';

/* ================================================================
   Users page -- mock user list for demo
   ================================================================ */

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'invited';
  isCurrent: boolean;
}

const INITIAL_USERS: MockUser[] = [
  {
    id: 'u1',
    name: 'Demo User',
    email: 'demo@xero.com',
    role: 'Advisor',
    status: 'active',
    isCurrent: true,
  },
  {
    id: 'u2',
    name: 'Sarah Chen',
    email: 'sarah.chen@example.com',
    role: 'Admin',
    status: 'active',
    isCurrent: false,
  },
  {
    id: 'u3',
    name: 'James Wilson',
    email: 'j.wilson@example.com',
    role: 'Standard',
    status: 'active',
    isCurrent: false,
  },
  {
    id: 'u4',
    name: 'Emily Taylor',
    email: 'emily.t@example.com',
    role: 'Read Only',
    status: 'invited',
    isCurrent: false,
  },
];

export function UsersPage() {
  const [users, setUsers] = useState<MockUser[]>(INITIAL_USERS);
  const [showInvite, setShowInvite] = useState(false);

  const handleInvite = (email: string, role: string) => {
    const newUser: MockUser = {
      id: `u${Date.now()}`,
      name: email.split('@')[0],
      email,
      role,
      status: 'invited',
      isCurrent: false,
    };
    setUsers((prev) => [...prev, newUser]);
  };

  return (
    <PageContainer
      title="Users"
      breadcrumbs={[{ label: 'Settings', href: '/settings' }, { label: 'Users' }]}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#6b7280]">
          Manage users who have access to your organisation.
        </p>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowInvite(true)}
          data-testid="invite-user-btn"
        >
          Invite User
        </Button>
      </div>

      <div className="space-y-3" data-testid="users-list">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent>
              <div className="flex items-center justify-between py-1" data-testid={`user-row-${user.id}`}>
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0078c8]/10 text-[#0078c8] text-sm font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#1a1a2e]">
                        {user.name}
                      </span>
                      {user.isCurrent && (
                        <Badge variant="info" data-testid="current-user-badge">You</Badge>
                      )}
                      {user.status === 'invited' && (
                        <Badge variant="warning" data-testid={`invited-badge-${user.id}`}>Invited</Badge>
                      )}
                    </div>
                    <p className="text-sm text-[#6b7280]">{user.email}</p>
                  </div>
                </div>
                <span className="text-sm text-[#6b7280]" data-testid={`user-role-${user.id}`}>
                  {user.role}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <InviteUserDialog
        open={showInvite}
        onClose={() => setShowInvite(false)}
        onInvite={handleInvite}
      />
    </PageContainer>
  );
}

/* ================================================================
   Settings Hub — 9 sections with 20+ links (matches Xero layout)
   ================================================================ */

interface SettingsLink {
  label: string;
  href: string;
  description: string;
}

interface SettingsSection {
  title: string;
  icon: string;
  links: SettingsLink[];
}

const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    title: 'General',
    icon: '',
    links: [
      { label: 'Organisation details', href: '/settings', description: "Update your organisation's name, logo, or contact information" },
      { label: 'Users', href: '/settings/users', description: 'Invite new users, manage permissions, or delete current users' },
      { label: 'Connected apps', href: '/settings/connected-apps', description: 'Add and manage the apps connected to your organisation' },
      { label: 'Email settings', href: '/settings/email-templates', description: 'Set a reply-to email address and name, or edit email templates' },
    ],
  },
  {
    title: 'Sales',
    icon: '',
    links: [
      { label: 'Invoice settings', href: '/settings/branding', description: 'Manage default settings, invoice reminders, and branding themes (templates for invoices, quotes, purchase orders etc.)' },
      { label: 'Online payments', href: '/settings/payment-services', description: 'Add and manage payment options for customers to pay you online' },
    ],
  },
  {
    title: 'Purchases',
    icon: '',
    links: [
      { label: 'Xero to Xero', href: '/settings', description: 'Connect with customers and suppliers who use Xero to exchange invoices and bills directly' },
      { label: 'Expense settings', href: '/settings', description: 'Manage users, accounts for expense and mileage claims, and labels' },
    ],
  },
  {
    title: 'Reporting',
    icon: '',
    links: [
      { label: 'Reporting preferences', href: '/settings', description: 'Update reporting method and display preferences for all reports' },
      { label: 'Report codes', href: '/settings', description: 'Map the chart of accounts to practice-wide report codes' },
      { label: 'Report fields', href: '/settings', description: 'Manage report fields to auto-populate client information into adviser reports' },
    ],
  },
  {
    title: 'Payroll',
    icon: '',
    links: [
      { label: 'Payroll settings', href: '/payroll/settings', description: 'Manage payroll account details, pay frequencies, pay items, holidays, and more' },
    ],
  },
  {
    title: 'Accounting',
    icon: '',
    links: [
      { label: 'Financial settings', href: '/settings', description: 'Update financial year end, tax settings, lock dates, and time zone' },
      { label: 'Currencies', href: '/settings/currencies', description: 'Manage the currencies your organisation uses' },
      { label: 'Chart of accounts', href: '/accounting/chart-of-accounts', description: 'Manage accounts used to categorise your transactions' },
      { label: 'Fixed asset settings', href: '/accounting/fixed-assets', description: 'Manage asset types, accounts, and default depreciation methods' },
      { label: 'Tracking categories', href: '/settings/tracking-categories', description: 'Set up tracking categories to see how different areas of your business are performing' },
      { label: 'Conversion balances', href: '/settings', description: 'Update the opening balances of your accounts in Xero' },
      { label: 'Export accounting data', href: '/settings', description: 'Export data from Xero to import into other systems' },
    ],
  },
  {
    title: 'Tax',
    icon: '',
    links: [
      { label: 'Tax rates', href: '/tax/tax-rates', description: 'Add and manage tax rates' },
      { label: 'GST settings', href: '/tax/gst-returns', description: 'Update your tax return settings' },
    ],
  },
  {
    title: 'Contacts',
    icon: '',
    links: [
      { label: 'Custom contact links', href: '/settings', description: 'Connect your contacts in Xero with external systems such as CRM' },
    ],
  },
  {
    title: 'Projects',
    icon: '',
    links: [
      { label: 'Staff cost rates', href: '/projects', description: 'Manage hourly cost rate for staff' },
    ],
  },
];

export function SettingsPage() {
  const routerState = useRouterState();
  const currentHref = routerState.location.href;

  useEffect(() => {
    // Parse section from router href (not window.location which may be stale)
    const qIdx = currentHref.indexOf('?');
    const params = qIdx >= 0 ? new URLSearchParams(currentHref.substring(qIdx)) : null;
    const section = params?.get('section');
    if (section) {
      // Clear any previous section highlights
      document.querySelectorAll('[id^="settings-"].bg-blue-50').forEach((el) => {
        el.classList.remove('bg-blue-50');
      });
      requestAnimationFrame(() => {
        const el = document.getElementById(`settings-${section}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          el.classList.add('bg-blue-50');
          setTimeout(() => el.classList.remove('bg-blue-50'), 2000);
        }
      });
    }
  }, [currentHref]);

  return (
    <PageContainer title="Settings">
      <ul className="space-y-6" data-testid="settings-hub">
        {SETTINGS_SECTIONS.map((section) => {
          const sectionId = section.title.toLowerCase().replace(/\s+/g, '-');
          return (
          <li key={section.title} id={`settings-${sectionId}`} data-testid={`settings-section-${sectionId}`} className="scroll-mt-20 rounded-lg p-3 -m-3 transition-colors duration-500">
            <h2 className="text-base font-semibold text-[#1a1a2e] mb-3">{section.title}</h2>
            <div className="space-y-2">
              {section.links.map((link) => (
                <div key={link.label}>
                  <Link
                    to={link.href}
                    className="block hover:underline"
                    data-testid={`settings-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <h3 className="text-sm font-medium text-[#0078c8]">{link.label}</h3>
                  </Link>
                  <p className="text-sm text-[#6b7280]">{link.description}</p>
                </div>
              ))}
            </div>
          </li>
          );
        })}
      </ul>

      <div className="mt-8 text-sm text-[#6b7280]" data-testid="user-settings-footer">
        Looking for user settings?{' '}
        <Link to="/settings" className="text-[#0078c8] hover:underline">
          Open My Xero
        </Link>
      </div>
    </PageContainer>
  );
}
