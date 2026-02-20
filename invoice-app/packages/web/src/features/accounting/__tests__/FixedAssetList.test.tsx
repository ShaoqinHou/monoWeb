// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FixedAssetList } from '../components/FixedAssetList';
import type { FixedAsset } from '../hooks/useFixedAssets';

const MOCK_ASSETS: FixedAsset[] = [
  {
    id: 'a1',
    name: 'Office Laptop',
    assetNumber: 'FA-0001',
    purchaseDate: '2025-01-15',
    purchasePrice: 2000,
    depreciationMethod: 'straight_line',
    depreciationRate: 25,
    currentValue: 1500,
    accumulatedDepreciation: 500,
    assetAccountCode: '1-0500',
    depreciationAccountCode: '6-0300',
    status: 'registered',
    disposalDate: null,
    disposalPrice: null,
    createdAt: '2025-01-15T10:00:00.000Z',
  },
  {
    id: 'a2',
    name: 'Company Vehicle',
    assetNumber: 'FA-0002',
    purchaseDate: '2024-06-01',
    purchasePrice: 35000,
    depreciationMethod: 'diminishing_value',
    depreciationRate: 20,
    currentValue: 28000,
    accumulatedDepreciation: 7000,
    assetAccountCode: '1-0600',
    depreciationAccountCode: '6-0400',
    status: 'registered',
    disposalDate: null,
    disposalPrice: null,
    createdAt: '2024-06-01T08:00:00.000Z',
  },
  {
    id: 'a3',
    name: 'Old Printer',
    assetNumber: 'FA-0003',
    purchaseDate: '2023-03-10',
    purchasePrice: 800,
    depreciationMethod: 'straight_line',
    depreciationRate: 50,
    currentValue: 0,
    accumulatedDepreciation: 800,
    assetAccountCode: '1-0500',
    depreciationAccountCode: '6-0300',
    status: 'disposed',
    disposalDate: '2025-06-01',
    disposalPrice: 0,
    createdAt: '2023-03-10T09:30:00.000Z',
  },
  {
    id: 'a4',
    name: 'Conference Table',
    assetNumber: 'FA-0004',
    purchaseDate: '2024-01-20',
    purchasePrice: 3500,
    depreciationMethod: 'straight_line',
    depreciationRate: 10,
    currentValue: 0,
    accumulatedDepreciation: 2000,
    assetAccountCode: '1-0500',
    depreciationAccountCode: '6-0300',
    status: 'sold',
    disposalDate: '2025-07-15',
    disposalPrice: 1800,
    createdAt: '2024-01-20T12:00:00.000Z',
  },
];

describe('FixedAssetList', () => {
  const defaultProps = {
    assets: MOCK_ASSETS,
    isLoading: false,
    onAssetClick: vi.fn(),
    selectedIds: new Set<string>(),
    onSelectAsset: vi.fn(),
    onSelectAll: vi.fn(),
  };

  it('renders all assets', () => {
    render(<FixedAssetList {...defaultProps} />);
    expect(screen.getByText('Office Laptop')).toBeInTheDocument();
    expect(screen.getByText('Company Vehicle')).toBeInTheDocument();
    expect(screen.getByText('Old Printer')).toBeInTheDocument();
    expect(screen.getByText('Conference Table')).toBeInTheDocument();
  });

  it('renders Xero-matching table headers: Checkbox, Asset name, Asset number, Asset type, Purchase date, Purchase price', () => {
    render(<FixedAssetList {...defaultProps} />);
    expect(screen.getByTestId('assets-select-all')).toBeInTheDocument();
    expect(screen.getByText('Asset name')).toBeInTheDocument();
    expect(screen.getByText('Asset number')).toBeInTheDocument();
    expect(screen.getByText('Asset type')).toBeInTheDocument();
    expect(screen.getByText('Purchase date')).toBeInTheDocument();
    expect(screen.getByText('Purchase price')).toBeInTheDocument();
  });

  it('renders sortable column header buttons', () => {
    render(<FixedAssetList {...defaultProps} />);
    expect(screen.getByTestId('sort-asset-name').tagName).toBe('BUTTON');
    expect(screen.getByTestId('sort-asset-number').tagName).toBe('BUTTON');
    expect(screen.getByTestId('sort-asset-type').tagName).toBe('BUTTON');
    expect(screen.getByTestId('sort-purchase-date').tagName).toBe('BUTTON');
    expect(screen.getByTestId('sort-purchase-price').tagName).toBe('BUTTON');
  });

  it('renders asset numbers', () => {
    render(<FixedAssetList {...defaultProps} />);
    expect(screen.getByText('FA-0001')).toBeInTheDocument();
    expect(screen.getByText('FA-0002')).toBeInTheDocument();
    expect(screen.getByText('FA-0003')).toBeInTheDocument();
    expect(screen.getByText('FA-0004')).toBeInTheDocument();
  });

  it('renders asset type labels', () => {
    render(<FixedAssetList {...defaultProps} />);
    // Straight Line appears 3 times (a1, a3, a4)
    const straightLine = screen.getAllByText('Straight Line');
    expect(straightLine).toHaveLength(3);
    expect(screen.getByText('Diminishing Value')).toBeInTheDocument();
  });

  it('renders purchase prices', () => {
    render(<FixedAssetList {...defaultProps} />);
    expect(screen.getAllByText('$2,000.00').length).toBeGreaterThan(0);
    expect(screen.getByText('$35,000.00')).toBeInTheDocument();
    expect(screen.getByText('$3,500.00')).toBeInTheDocument();
  });

  it('calls onAssetClick when a row name is clicked', async () => {
    const onAssetClick = vi.fn();
    const user = userEvent.setup();
    render(<FixedAssetList {...defaultProps} onAssetClick={onAssetClick} />);

    await user.click(screen.getByText('Office Laptop'));
    expect(onAssetClick).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Office Laptop' }),
    );
  });

  it('renders per-row checkboxes', () => {
    render(<FixedAssetList {...defaultProps} />);
    expect(screen.getByTestId('asset-select-a1')).toBeInTheDocument();
    expect(screen.getByTestId('asset-select-a2')).toBeInTheDocument();
    expect(screen.getByTestId('asset-select-a3')).toBeInTheDocument();
    expect(screen.getByTestId('asset-select-a4')).toBeInTheDocument();
  });

  it('calls onSelectAsset when a checkbox is toggled', async () => {
    const onSelectAsset = vi.fn();
    const user = userEvent.setup();
    render(<FixedAssetList {...defaultProps} onSelectAsset={onSelectAsset} />);

    await user.click(screen.getByTestId('asset-select-a1'));
    expect(onSelectAsset).toHaveBeenCalledWith('a1', true);
  });

  it('calls onSelectAll when select-all checkbox is toggled', async () => {
    const onSelectAll = vi.fn();
    const user = userEvent.setup();
    render(<FixedAssetList {...defaultProps} onSelectAll={onSelectAll} />);

    await user.click(screen.getByTestId('assets-select-all'));
    expect(onSelectAll).toHaveBeenCalledWith(true);
  });

  it('shows loading state', () => {
    render(<FixedAssetList {...defaultProps} isLoading={true} assets={[]} />);
    expect(screen.getByTestId('assets-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading fixed assets...')).toBeInTheDocument();
  });

  it('shows empty state when no assets', () => {
    render(<FixedAssetList {...defaultProps} assets={[]} />);
    expect(screen.getByTestId('assets-empty')).toBeInTheDocument();
    expect(screen.getByText('No fixed assets found.')).toBeInTheDocument();
  });
});
