// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FindRecodeForm } from '../components/FindRecodeForm';
import { TrackingCategoryForm } from '../components/TrackingCategoryForm';
import { DepreciationRunner } from '../components/DepreciationRunner';
import { ImportCOADialog } from '../components/ImportCOADialog';
import {
  calculateDepreciation,
  previewDepreciation,
} from '../hooks/useDepreciation';
import type { FixedAsset } from '../hooks/useFixedAssets';
import type { TrackingCategory } from '../hooks/useTrackingCategories';

// --- Mock data ---

const MOCK_ASSET_SL: FixedAsset = {
  id: 'a1',
  name: 'Office Laptop',
  assetNumber: 'FA-001',
  purchaseDate: '2024-01-15',
  purchasePrice: 2400,
  depreciationMethod: 'straight_line',
  depreciationRate: 20,
  currentValue: 2000,
  accumulatedDepreciation: 400,
  assetAccountCode: '1-1200',
  depreciationAccountCode: '6-0800',
  status: 'registered',
  disposalDate: null,
  disposalPrice: null,
  createdAt: '2024-01-15T00:00:00.000Z',
};

const MOCK_ASSET_DV: FixedAsset = {
  id: 'a2',
  name: 'Company Vehicle',
  assetNumber: 'FA-002',
  purchaseDate: '2023-06-01',
  purchasePrice: 50000,
  depreciationMethod: 'diminishing_value',
  depreciationRate: 30,
  currentValue: 35000,
  accumulatedDepreciation: 15000,
  assetAccountCode: '1-1300',
  depreciationAccountCode: '6-0900',
  status: 'registered',
  disposalDate: null,
  disposalPrice: null,
  createdAt: '2023-06-01T00:00:00.000Z',
};

const MOCK_DISPOSED_ASSET: FixedAsset = {
  id: 'a3',
  name: 'Old Printer',
  assetNumber: 'FA-003',
  purchaseDate: '2020-01-01',
  purchasePrice: 500,
  depreciationMethod: 'straight_line',
  depreciationRate: 25,
  currentValue: 0,
  accumulatedDepreciation: 500,
  assetAccountCode: '1-1200',
  depreciationAccountCode: '6-0800',
  status: 'disposed',
  disposalDate: '2025-01-01',
  disposalPrice: null,
  createdAt: '2020-01-01T00:00:00.000Z',
};

const MOCK_TRACKING_CATEGORY: TrackingCategory = {
  id: 'tc1',
  name: 'Region',
  options: [
    { id: 'o1', name: 'North' },
    { id: 'o2', name: 'South' },
  ],
  createdAt: '2024-01-01T00:00:00.000Z',
};

// --- FindRecodeForm ---

describe('FindRecodeForm', () => {
  it('renders all filter inputs', () => {
    render(<FindRecodeForm onSearch={vi.fn()} />);
    expect(screen.getByTestId('filter-account-code')).toBeInTheDocument();
    expect(screen.getByTestId('filter-date-from')).toBeInTheDocument();
    expect(screen.getByTestId('filter-date-to')).toBeInTheDocument();
    expect(screen.getByTestId('filter-amount-min')).toBeInTheDocument();
    expect(screen.getByTestId('filter-amount-max')).toBeInTheDocument();
    expect(screen.getByTestId('filter-reference')).toBeInTheDocument();
  });

  it('calls onSearch with filters on submit', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<FindRecodeForm onSearch={onSearch} />);

    await user.type(screen.getByTestId('filter-account-code'), '4-0100');
    await user.type(screen.getByTestId('filter-reference'), 'INV-001');
    await user.click(screen.getByTestId('search-btn'));

    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        accountCode: '4-0100',
        reference: 'INV-001',
      }),
    );
  });

  it('resets all fields on reset click', async () => {
    const user = userEvent.setup();
    render(<FindRecodeForm onSearch={vi.fn()} />);

    await user.type(screen.getByTestId('filter-account-code'), '4-0100');
    await user.click(screen.getByTestId('reset-btn'));

    expect(screen.getByTestId('filter-account-code')).toHaveValue('');
  });

  it('renders search button', () => {
    render(<FindRecodeForm onSearch={vi.fn()} />);
    expect(screen.getByTestId('search-btn')).toBeInTheDocument();
    expect(screen.getByTestId('search-btn')).toHaveTextContent('Search');
  });
});

// --- TrackingCategoryForm ---

describe('TrackingCategoryForm', () => {
  it('renders empty form for new category', () => {
    render(<TrackingCategoryForm onSubmit={vi.fn()} />);
    expect(screen.getByTestId('category-name-input')).toHaveValue('');
    expect(screen.getByTestId('option-input-0')).toBeInTheDocument();
  });

  it('populates form with initial data', () => {
    render(
      <TrackingCategoryForm
        initialData={MOCK_TRACKING_CATEGORY}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByTestId('category-name-input')).toHaveValue('Region');
    expect(screen.getByTestId('option-input-0')).toHaveValue('North');
    expect(screen.getByTestId('option-input-1')).toHaveValue('South');
  });

  it('calls onSubmit with form data', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<TrackingCategoryForm onSubmit={onSubmit} />);

    await user.type(screen.getByTestId('category-name-input'), 'Department');
    await user.type(screen.getByTestId('option-input-0'), 'Engineering');
    await user.click(screen.getByTestId('save-category-btn'));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Department',
      options: ['Engineering'],
    });
  });

  it('adds and removes options', async () => {
    const user = userEvent.setup();
    render(<TrackingCategoryForm onSubmit={vi.fn()} />);

    // Add an option
    await user.click(screen.getByTestId('add-option-btn'));
    expect(screen.getByTestId('option-input-1')).toBeInTheDocument();

    // Remove the second option
    await user.click(screen.getByTestId('remove-option-1'));
    expect(screen.queryByTestId('option-input-1')).not.toBeInTheDocument();
  });

  it('shows Update Category button when editing', () => {
    render(
      <TrackingCategoryForm
        initialData={MOCK_TRACKING_CATEGORY}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByTestId('save-category-btn')).toHaveTextContent('Update Category');
  });
});

// --- Depreciation calculations ---

describe('calculateDepreciation', () => {
  it('calculates straight-line depreciation', () => {
    const result = calculateDepreciation(MOCK_ASSET_SL, '2025-01');
    expect(result).not.toBeNull();
    // 2400 * 20% / 12 = 40
    expect(result!.amount).toBe(40);
    expect(result!.assetName).toBe('Office Laptop');
    expect(result!.debitAccount).toBe('6-0800');
    expect(result!.creditAccount).toBe('1-1200');
  });

  it('calculates diminishing-value depreciation', () => {
    const result = calculateDepreciation(MOCK_ASSET_DV, '2025-01');
    expect(result).not.toBeNull();
    // 35000 * 30% / 12 = 875
    expect(result!.amount).toBe(875);
  });

  it('returns null for disposed assets', () => {
    const result = calculateDepreciation(MOCK_DISPOSED_ASSET, '2025-01');
    expect(result).toBeNull();
  });

  it('returns null for zero-value assets', () => {
    const zeroAsset = { ...MOCK_ASSET_SL, currentValue: 0 };
    const result = calculateDepreciation(zeroAsset, '2025-01');
    expect(result).toBeNull();
  });
});

describe('previewDepreciation', () => {
  it('previews depreciation for multiple assets', () => {
    const result = previewDepreciation(
      [MOCK_ASSET_SL, MOCK_ASSET_DV, MOCK_DISPOSED_ASSET],
      '2025-01',
    );
    expect(result.entries).toHaveLength(2);
    // 40 + 875 = 915
    expect(result.totalDepreciation).toBe(915);
  });

  it('returns empty entries when no eligible assets', () => {
    const result = previewDepreciation([MOCK_DISPOSED_ASSET], '2025-01');
    expect(result.entries).toHaveLength(0);
    expect(result.totalDepreciation).toBe(0);
  });
});

// --- DepreciationRunner ---

describe('DepreciationRunner', () => {
  it('renders run depreciation button', () => {
    render(
      <DepreciationRunner assets={[MOCK_ASSET_SL]} onRun={vi.fn()} />,
    );
    expect(screen.getByTestId('run-depreciation-btn')).toBeInTheDocument();
    expect(screen.getByTestId('run-depreciation-btn')).toHaveTextContent('Run Depreciation');
  });

  it('opens dialog on button click', async () => {
    const user = userEvent.setup();
    render(
      <DepreciationRunner assets={[MOCK_ASSET_SL]} onRun={vi.fn()} />,
    );

    await user.click(screen.getByTestId('run-depreciation-btn'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('depreciation-period')).toBeInTheDocument();
  });

  it('shows preview table with depreciation entries', async () => {
    const user = userEvent.setup();
    render(
      <DepreciationRunner assets={[MOCK_ASSET_SL, MOCK_ASSET_DV]} onRun={vi.fn()} />,
    );

    await user.click(screen.getByTestId('run-depreciation-btn'));
    expect(screen.getByTestId('depreciation-preview-table')).toBeInTheDocument();
    expect(screen.getByText('Office Laptop')).toBeInTheDocument();
    expect(screen.getByText('Company Vehicle')).toBeInTheDocument();
  });

  it('shows no-depreciation message for ineligible assets', async () => {
    const user = userEvent.setup();
    render(
      <DepreciationRunner assets={[MOCK_DISPOSED_ASSET]} onRun={vi.fn()} />,
    );

    await user.click(screen.getByTestId('run-depreciation-btn'));
    expect(screen.getByTestId('no-depreciation')).toBeInTheDocument();
  });
});

// --- ImportCOADialog ---

describe('ImportCOADialog', () => {
  it('renders upload step when open', () => {
    render(<ImportCOADialog open={true} onClose={vi.fn()} />);
    expect(screen.getByTestId('csv-file-input')).toBeInTheDocument();
    expect(screen.getByText(/Upload a CSV file/)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ImportCOADialog open={false} onClose={vi.fn()} />);
    expect(screen.queryByTestId('csv-file-input')).not.toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ImportCOADialog open={true} onClose={onClose} />);

    await user.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });
});
