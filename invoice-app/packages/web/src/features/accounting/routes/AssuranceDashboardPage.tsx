import { useState, useMemo } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Tabs, TabList, Tab, TabPanel } from '../../../components/ui/Tabs';

/** Assurance Dashboard tabs */
const ASSURANCE_TABS = [
  { id: 'user-activity', label: 'User Activity' },
  { id: 'bank-accounts', label: 'Bank Accounts' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'invoices-bills', label: 'Invoices & Bills' },
] as const;

type AssuranceTabId = (typeof ASSURANCE_TABS)[number]['id'];

/** Mock user activity data */
const MOCK_USERS = [
  { id: 'u1', name: 'John Smith', email: 'john@example.com', deleted: false },
  { id: 'u2', name: 'Jane Doe', email: 'jane@example.com', deleted: false },
  { id: 'u3', name: 'Bob Wilson', email: 'bob@example.com', deleted: true },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Generate mock heatmap data: value 0-3 for intensity */
function generateHeatmapData(): Map<string, number[]> {
  const map = new Map<string, number[]>();
  for (const user of MOCK_USERS) {
    const data: number[] = [];
    for (let i = 0; i < 12; i++) {
      data.push(user.deleted && i > 8 ? 0 : Math.floor(Math.random() * 4));
    }
    map.set(user.id, data);
  }
  return map;
}

const HEATMAP_COLORS = [
  'bg-gray-100',
  'bg-green-200',
  'bg-green-400',
  'bg-green-600',
];

export function AssuranceDashboardPage() {
  const [showDeleted, setShowDeleted] = useState(false);
  const [heatmapData] = useState(() => generateHeatmapData());

  const visibleUsers = useMemo(() => {
    return showDeleted ? MOCK_USERS : MOCK_USERS.filter((u) => !u.deleted);
  }, [showDeleted]);

  return (
    <PageContainer
      title="Assurance Dashboard"
      breadcrumbs={[
        { label: 'Accounting', href: '/accounting/chart-of-accounts' },
        { label: 'Assurance Dashboard' },
      ]}
    >
      <Tabs defaultTab="user-activity">
        <TabList>
          {ASSURANCE_TABS.map((tab) => (
            <Tab key={tab.id} tabId={tab.id} data-testid={`assurance-tab-${tab.id}`}>
              {tab.label}
            </Tab>
          ))}
        </TabList>

        {/* User Activity tab */}
        <TabPanel tabId="user-activity">
          <div className="space-y-4">
            {/* Show deleted users toggle */}
            <div className="flex items-center gap-3" data-testid="show-deleted-toggle">
              <label
                htmlFor="show-deleted"
                className="text-sm font-medium text-[#1a1a2e]"
              >
                Show deleted users
              </label>
              <button
                id="show-deleted"
                role="switch"
                type="button"
                aria-checked={showDeleted}
                onClick={() => setShowDeleted(!showDeleted)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0078c8] focus:ring-offset-2 ${
                  showDeleted ? 'bg-[#0078c8]' : 'bg-gray-200'
                }`}
                data-testid="show-deleted-switch"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    showDeleted ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Activity heatmap */}
            <div className="overflow-x-auto" data-testid="activity-heatmap">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-[#6b7280] uppercase">User</th>
                    {MONTHS.map((m) => (
                      <th key={m} className="px-2 py-2 text-center text-xs font-semibold text-[#6b7280] uppercase">
                        {m}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((user) => {
                    const data = heatmapData.get(user.id) ?? new Array(12).fill(0);
                    return (
                      <tr key={user.id} data-testid={`heatmap-row-${user.id}`}>
                        <td className="px-4 py-2 text-[#1a1a2e]">
                          <span className={user.deleted ? 'line-through text-[#6b7280]' : ''}>
                            {user.name}
                          </span>
                          {user.deleted && (
                            <span className="ml-2 text-xs text-[#6b7280]">(deleted)</span>
                          )}
                        </td>
                        {data.map((val, i) => (
                          <td key={i} className="px-2 py-2 text-center">
                            <div
                              className={`mx-auto h-6 w-6 rounded ${HEATMAP_COLORS[val] ?? HEATMAP_COLORS[0]}`}
                              title={`${MONTHS[i]}: ${val === 0 ? 'No activity' : `Level ${val}`}`}
                              data-testid={`heatmap-cell-${user.id}-${i}`}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabPanel>

        {/* Bank Accounts tab */}
        <TabPanel tabId="bank-accounts">
          <div className="py-8 text-center text-sm text-[#6b7280]" data-testid="assurance-bank-content">
            <p>Bank account reconciliation status and exceptions will appear here.</p>
          </div>
        </TabPanel>

        {/* Contacts tab */}
        <TabPanel tabId="contacts">
          <div className="py-8 text-center text-sm text-[#6b7280]" data-testid="assurance-contacts-content">
            <p>Contact audit information and duplicate detection will appear here.</p>
          </div>
        </TabPanel>

        {/* Invoices & Bills tab */}
        <TabPanel tabId="invoices-bills">
          <div className="py-8 text-center text-sm text-[#6b7280]" data-testid="assurance-invoices-content">
            <p>Invoice and bill exception reports will appear here.</p>
          </div>
        </TabPanel>
      </Tabs>
    </PageContainer>
  );
}
