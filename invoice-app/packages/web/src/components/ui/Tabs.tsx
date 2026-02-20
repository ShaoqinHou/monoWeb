import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
  type HTMLAttributes,
  type ButtonHTMLAttributes,
} from "react";
import { cn } from "../../lib/cn";

/* ─── Context ─── */
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) {
    throw new Error("Tab components must be used within a Tabs provider");
  }
  return ctx;
}

/* ─── Tabs (Root Provider) ─── */
export interface TabsProps {
  defaultTab: string;
  children: ReactNode;
  className?: string;
  onChange?: (tabId: string) => void;
}

export function Tabs({ defaultTab, children, className, onChange }: TabsProps) {
  const [activeTab, setActiveTabState] = useState(defaultTab);

  // Sync internal state when defaultTab changes (e.g. from URL query params)
  useEffect(() => {
    setActiveTabState(defaultTab);
  }, [defaultTab]);

  const setActiveTab = useCallback(
    (id: string) => {
      setActiveTabState(id);
      onChange?.(id);
    },
    [onChange],
  );

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

/* ─── TabList ─── */
export interface TabListProps extends HTMLAttributes<HTMLDivElement> {}

export function TabList({ className, ...props }: TabListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex border-b border-[#e5e7eb]",
        className,
      )}
      {...props}
    />
  );
}

/* ─── Tab ─── */
export interface TabProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tabId: string;
}

export function Tab({ tabId, className, children, ...props }: TabProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === tabId;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${tabId}`}
      id={`tab-${tabId}`}
      onClick={() => setActiveTab(tabId)}
      className={cn(
        "relative px-4 py-2.5 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0078c8] focus-visible:ring-offset-2",
        isActive
          ? "text-[#0078c8] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#0078c8]"
          : "text-[#6b7280] hover:text-[#1a1a2e]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ─── TabPanel ─── */
export interface TabPanelProps extends HTMLAttributes<HTMLDivElement> {
  tabId: string;
}

export function TabPanel({ tabId, className, children, ...props }: TabPanelProps) {
  const { activeTab } = useTabsContext();
  const isActive = activeTab === tabId;

  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${tabId}`}
      aria-labelledby={`tab-${tabId}`}
      className={cn("py-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}
