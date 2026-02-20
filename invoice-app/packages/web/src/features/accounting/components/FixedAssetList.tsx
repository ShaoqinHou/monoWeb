import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import type { FixedAsset } from '../hooks/useFixedAssets';

interface FixedAssetListProps {
  assets: FixedAsset[];
  isLoading: boolean;
  onAssetClick?: (asset: FixedAsset) => void;
  selectedIds?: Set<string>;
  onSelectAsset?: (id: string, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
  }).format(amount);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Derive a human-readable asset type from depreciation method */
function assetTypeLabel(method: string): string {
  if (method === 'straight_line') return 'Straight Line';
  if (method === 'diminishing_value') return 'Diminishing Value';
  return method;
}

export function FixedAssetList({
  assets,
  isLoading,
  onAssetClick,
  selectedIds,
  onSelectAsset,
  onSelectAll,
}: FixedAssetListProps) {
  if (isLoading) {
    return (
      <div className="py-12 text-center text-[#6b7280]" data-testid="assets-loading">
        Loading fixed assets...
      </div>
    );
  }

  const allSelected = assets.length > 0 && selectedIds
    ? assets.every((a) => selectedIds.has(a.id))
    : false;

  if (assets.length === 0) {
    return (
      <div className="py-12 text-center text-[#6b7280]" data-testid="assets-empty">
        No fixed assets found.
      </div>
    );
  }

  return (
    <Table data-testid="assets-table">
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => onSelectAll?.(e.target.checked)}
              data-testid="assets-select-all"
              aria-label="Select all assets"
            />
          </TableHead>
          <TableHead>
            <button type="button" className="font-semibold" data-testid="sort-asset-name">
              Asset name
            </button>
          </TableHead>
          <TableHead>
            <button type="button" className="font-semibold" data-testid="sort-asset-number">
              Asset number
            </button>
          </TableHead>
          <TableHead>
            <button type="button" className="font-semibold" data-testid="sort-asset-type">
              Asset type
            </button>
          </TableHead>
          <TableHead>
            <button type="button" className="font-semibold" data-testid="sort-purchase-date">
              Purchase date
            </button>
          </TableHead>
          <TableHead className="text-right">
            <button type="button" className="font-semibold" data-testid="sort-purchase-price">
              Purchase price
            </button>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assets.map((asset) => (
          <TableRow
            key={asset.id}
            data-testid={`asset-row-${asset.id}`}
            className={onAssetClick ? 'cursor-pointer' : ''}
          >
            <TableCell>
              <input
                type="checkbox"
                checked={selectedIds?.has(asset.id) ?? false}
                onChange={(e) => onSelectAsset?.(asset.id, e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                data-testid={`asset-select-${asset.id}`}
                aria-label={`Select ${asset.name}`}
              />
            </TableCell>
            <TableCell
              className="font-medium text-blue-700 hover:underline cursor-pointer"
              onClick={() => onAssetClick?.(asset)}
            >
              {asset.name}
            </TableCell>
            <TableCell className="text-[#6b7280]">{asset.assetNumber}</TableCell>
            <TableCell>{assetTypeLabel(asset.depreciationMethod)}</TableCell>
            <TableCell>{formatDate(asset.purchaseDate)}</TableCell>
            <TableCell className="text-right">{formatCurrency(asset.purchasePrice)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
