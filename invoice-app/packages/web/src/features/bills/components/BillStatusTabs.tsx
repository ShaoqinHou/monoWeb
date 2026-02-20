import { Tabs, TabList, Tab, TabPanel } from '../../../components/ui/Tabs';
import type { ReactNode } from 'react';
import type { BillStatusTab, BillStatusCount } from '../types';
import { STATUS_TAB_LABELS } from '../types';

interface BillStatusTabsProps {
  counts: BillStatusCount;
  activeTab: BillStatusTab;
  onTabChange: (tab: BillStatusTab) => void;
  children: (activeTab: BillStatusTab) => ReactNode;
}

const TAB_ORDER: BillStatusTab[] = ['all', 'draft', 'submitted', 'approved', 'paid', 'overdue', 'voided'];

export function BillStatusTabs({ counts, activeTab, onTabChange, children }: BillStatusTabsProps) {
  return (
    <Tabs defaultTab={activeTab} onChange={(id) => onTabChange(id as BillStatusTab)}>
      <TabList>
        {TAB_ORDER.map((tab) => (
          <Tab key={tab} tabId={tab} data-testid={`tab-${tab}`}>
            {STATUS_TAB_LABELS[tab]} ({counts[tab]})
          </Tab>
        ))}
      </TabList>
      {TAB_ORDER.map((tab) => (
        <TabPanel key={tab} tabId={tab}>
          {children(tab)}
        </TabPanel>
      ))}
    </Tabs>
  );
}
