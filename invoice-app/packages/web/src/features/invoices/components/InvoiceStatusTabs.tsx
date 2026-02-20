import { Tabs, TabList, Tab, TabPanel } from '../../../components/ui/Tabs';
import type { ReactNode } from 'react';
import type { Invoice } from '../types';

interface InvoiceStatusTabsProps {
  invoices: Invoice[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: (filteredInvoices: Invoice[]) => ReactNode;
  /** Extra tabs rendered after the invoice-status tabs (e.g. Repeating, Credit Notes) */
  extraTabs?: Array<{ id: string; label: string }>;
  /** Content to render when an extra (non-invoice-filter) tab is active */
  extraTabContent?: ReactNode;
}

interface TabDef {
  id: string;
  label: string;
  filter: (inv: Invoice) => boolean;
}

const INVOICE_TAB_DEFINITIONS: TabDef[] = [
  { id: 'all', label: 'All', filter: () => true },
  { id: 'draft', label: 'Draft', filter: (inv) => inv.status === 'draft' },
  { id: 'submitted', label: 'Awaiting Approval', filter: (inv) => inv.status === 'submitted' },
  { id: 'approved', label: 'Awaiting Payment', filter: (inv) => inv.status === 'approved' },
  { id: 'paid', label: 'Paid', filter: (inv) => inv.status === 'paid' },
];

/** IDs of tabs that are invoice-filter tabs (not extra/custom content tabs) */
const INVOICE_TAB_IDS = new Set(INVOICE_TAB_DEFINITIONS.map((t) => t.id));

export function InvoiceStatusTabs({
  invoices,
  activeTab,
  onTabChange,
  children,
  extraTabs = [],
  extraTabContent,
}: InvoiceStatusTabsProps) {
  const counts = INVOICE_TAB_DEFINITIONS.reduce<Record<string, number>>((acc, tab) => {
    acc[tab.id] = invoices.filter(tab.filter).length;
    return acc;
  }, {});

  const isInvoiceTab = INVOICE_TAB_IDS.has(activeTab);
  const currentTab = INVOICE_TAB_DEFINITIONS.find((t) => t.id === activeTab) ?? INVOICE_TAB_DEFINITIONS[0];
  const filteredInvoices = isInvoiceTab ? invoices.filter(currentTab.filter) : [];

  return (
    <Tabs defaultTab={activeTab} onChange={onTabChange}>
      <TabList data-testid="invoice-status-tabs">
        {INVOICE_TAB_DEFINITIONS.map((tab) => (
          <Tab key={tab.id} tabId={tab.id} data-testid={`tab-${tab.id}`}>
            {tab.label}
            <span className="ml-1 text-xs text-gray-500">
              ({counts[tab.id]})
            </span>
          </Tab>
        ))}
        {extraTabs.map((tab) => (
          <Tab key={tab.id} tabId={tab.id} data-testid={`tab-${tab.id}`}>
            {tab.label}
          </Tab>
        ))}
      </TabList>

      {INVOICE_TAB_DEFINITIONS.map((tab) => (
        <TabPanel key={tab.id} tabId={tab.id}>
          {tab.id === activeTab ? children(filteredInvoices) : null}
        </TabPanel>
      ))}
      {extraTabs.map((tab) => (
        <TabPanel key={tab.id} tabId={tab.id}>
          {tab.id === activeTab ? extraTabContent : null}
        </TabPanel>
      ))}
    </Tabs>
  );
}

/** @deprecated Use INVOICE_TAB_DEFINITIONS instead */
const TAB_DEFINITIONS = INVOICE_TAB_DEFINITIONS;

export { TAB_DEFINITIONS, INVOICE_TAB_DEFINITIONS, INVOICE_TAB_IDS };
