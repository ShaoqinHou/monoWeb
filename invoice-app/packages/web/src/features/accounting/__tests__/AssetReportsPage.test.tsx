// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockAssets: unknown[] = [];
let mockIsLoading = false;

vi.mock('../hooks/useFixedAssets', () => ({
  useFixedAssets: () => ({
    data: mockAssets,
    isLoading: mockIsLoading,
  }),
}));

vi.mock('../hooks/useDepreciation', () => ({
  useRunDepreciation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  calculateDepreciation: vi.fn(),
  previewDepreciation: vi.fn(),
}));

vi.mock('../../../components/layout/PageContainer', () => ({
  PageContainer: ({ children, title, actions }: { children: React.ReactNode; title: string; actions?: React.ReactNode }) => (
    <div data-testid="page-container">
      <h1>{title}</h1>
      {actions}
      {children}
    </div>
  ),
}));

vi.mock('../../../components/ui/Tabs', () => ({
  Tabs: ({ children, defaultTab }: { children: React.ReactNode; defaultTab: string }) => {
    const { useState } = require('react');
    const [active, setActive] = useState(defaultTab);
    return (
      <div data-testid="tabs" data-active={active}>
        <div data-ctx={JSON.stringify({ active, setActive })}>{children}</div>
      </div>
    );
  },
  TabList: ({ children }: { children: React.ReactNode }) => <div role="tablist">{children}</div>,
  Tab: ({ children, tabId, ...rest }: { children: React.ReactNode; tabId: string; [k: string]: unknown }) => (
    <button role="tab" data-testid={rest['data-testid'] as string} data-tab-id={tabId}>
      {children}
    </button>
  ),
  TabPanel: ({ children, tabId }: { children: React.ReactNode; tabId: string }) => (
    <div role="tabpanel" data-tab-id={tabId}>{children}</div>
  ),
}));

vi.mock('../../../components/ui/Table', () => ({
  Table: (props: Record<string, unknown>) => <table data-testid={props['data-testid'] as string}>{props.children as React.ReactNode}</table>,
  TableHeader: (props: Record<string, unknown>) => <thead>{props.children as React.ReactNode}</thead>,
  TableBody: (props: Record<string, unknown>) => <tbody>{props.children as React.ReactNode}</tbody>,
  TableRow: (props: Record<string, unknown>) => <tr data-testid={props['data-testid'] as string}>{props.children as React.ReactNode}</tr>,
  TableHead: (props: Record<string, unknown>) => <th>{props.children as React.ReactNode}</th>,
  TableCell: (props: Record<string, unknown>) => <td className={props.className as string}>{props.children as React.ReactNode}</td>,
}));

vi.mock('../components/DepreciationRunner', () => ({
  DepreciationRunner: () => <button data-testid="depreciation-runner-mock">Run Depreciation</button>,
}));

import { AssetReportsPage } from '../routes/AssetReportsPage';

const MOCK_ASSETS = [
  {
    id: 'a1',
    name: 'Office Laptop',
    assetNumber: 'FA-001',
    purchaseDate: '2024-01-15',
    purchasePrice: 2400,
    depreciationMethod: 'straight_line' as const,
    depreciationRate: 20,
    currentValue: 2000,
    accumulatedDepreciation: 400,
    assetAccountCode: '1-1200',
    depreciationAccountCode: '6-0800',
    status: 'registered' as const,
    disposalDate: null,
    disposalPrice: null,
    createdAt: '2024-01-15T00:00:00.000Z',
  },
  {
    id: 'a2',
    name: 'Company Vehicle',
    assetNumber: 'FA-002',
    purchaseDate: '2023-06-01',
    purchasePrice: 50000,
    depreciationMethod: 'diminishing_value' as const,
    depreciationRate: 30,
    currentValue: 35000,
    accumulatedDepreciation: 15000,
    assetAccountCode: '1-1300',
    depreciationAccountCode: '6-0900',
    status: 'registered' as const,
    disposalDate: null,
    disposalPrice: null,
    createdAt: '2023-06-01T00:00:00.000Z',
  },
  {
    id: 'a3',
    name: 'Old Printer',
    assetNumber: 'FA-003',
    purchaseDate: '2020-01-01',
    purchasePrice: 500,
    depreciationMethod: 'straight_line' as const,
    depreciationRate: 25,
    currentValue: 0,
    accumulatedDepreciation: 500,
    assetAccountCode: '1-1200',
    depreciationAccountCode: '6-0800',
    status: 'disposed' as const,
    disposalDate: '2025-01-01',
    disposalPrice: null,
    createdAt: '2020-01-01T00:00:00.000Z',
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockAssets.length = 0;
  mockIsLoading = false;
});

describe('AssetReportsPage', () => {
  it('renders page title', () => {
    render(<AssetReportsPage />);
    expect(screen.getByText('Asset Reports')).toBeInTheDocument();
  });

  it('renders tab navigation', () => {
    render(<AssetReportsPage />);
    expect(screen.getByTestId('tab-register')).toBeInTheDocument();
    expect(screen.getByTestId('tab-schedule')).toBeInTheDocument();
    expect(screen.getByTestId('tab-reconciliation')).toBeInTheDocument();
  });

  it('renders depreciation runner action', () => {
    render(<AssetReportsPage />);
    expect(screen.getByTestId('depreciation-runner-mock')).toBeInTheDocument();
  });

  it('shows loading state for register tab', () => {
    mockIsLoading = true;
    render(<AssetReportsPage />);
    expect(screen.getByTestId('register-loading')).toBeInTheDocument();
  });

  it('shows empty state when no assets', () => {
    render(<AssetReportsPage />);
    expect(screen.getByTestId('register-empty')).toBeInTheDocument();
    expect(screen.getByText('No fixed assets found.')).toBeInTheDocument();
  });

  it('renders register table with asset data', () => {
    mockAssets.push(...MOCK_ASSETS);
    render(<AssetReportsPage />);
    expect(screen.getByTestId('register-table')).toBeInTheDocument();
    // Asset names appear in multiple tabs (register + schedule + reconciliation)
    expect(screen.getAllByText('Office Laptop').length).toBeGreaterThan(0);
    expect(screen.getByText('FA-001')).toBeInTheDocument();
    expect(screen.getAllByText('Company Vehicle').length).toBeGreaterThan(0);
    expect(screen.getByText('FA-002')).toBeInTheDocument();
  });

  it('shows depreciation method labels', () => {
    mockAssets.push(...MOCK_ASSETS);
    render(<AssetReportsPage />);
    // Register tab shows full names, schedule tab shows abbreviations (SL, DV)
    expect(screen.getAllByText('Straight Line').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Diminishing Value').length).toBeGreaterThan(0);
  });

  it('shows asset status badges', () => {
    mockAssets.push(...MOCK_ASSETS);
    render(<AssetReportsPage />);
    expect(screen.getAllByText('Registered')).toHaveLength(2);
    expect(screen.getByText('Disposed')).toBeInTheDocument();
  });

  it('renders depreciation schedule tab content', () => {
    mockAssets.push(...MOCK_ASSETS);
    render(<AssetReportsPage />);
    // Schedule tab should filter to registered only and show schedule table
    expect(screen.getByTestId('schedule-table')).toBeInTheDocument();
  });

  it('shows reconciliation panel with totals', () => {
    mockAssets.push(...MOCK_ASSETS);
    render(<AssetReportsPage />);
    expect(screen.getByTestId('reconciliation-panel')).toBeInTheDocument();
    expect(screen.getByTestId('total-purchase')).toBeInTheDocument();
    expect(screen.getByTestId('total-depreciation-recon')).toBeInTheDocument();
    expect(screen.getByTestId('total-book-value')).toBeInTheDocument();
    expect(screen.getByTestId('variance')).toBeInTheDocument();
  });

  it('schedule tab shows empty state when no registered assets', () => {
    mockAssets.push({
      ...MOCK_ASSETS[2], // disposed asset only
    });
    render(<AssetReportsPage />);
    expect(screen.getByTestId('schedule-empty')).toBeInTheDocument();
    expect(screen.getByText('No registered assets to depreciate.')).toBeInTheDocument();
  });
});
