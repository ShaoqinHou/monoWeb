import { Button } from '../../../components/ui/Button';
import type { FixedAsset } from '../hooks/useFixedAssets';

interface FixedAssetDetailProps {
  asset: FixedAsset;
  onDepreciate: () => void;
  onDispose: () => void;
  onSell: () => void;
  isDepreciating?: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
  }).format(amount);
}

export function FixedAssetDetail({
  asset,
  onDepreciate,
  onDispose,
  onSell,
  isDepreciating,
}: FixedAssetDetailProps) {
  const isRegistered = asset.status === 'registered';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900" data-testid="asset-name">
            {asset.name}
          </h2>
          <p className="text-sm text-[#6b7280]" data-testid="asset-number">
            {asset.assetNumber}
          </p>
        </div>
        {isRegistered && (
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={onDepreciate}
              loading={isDepreciating}
              data-testid="depreciate-btn"
            >
              Run Depreciation
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDispose}
              data-testid="dispose-btn"
            >
              Dispose
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSell}
              data-testid="sell-btn"
            >
              Sell
            </Button>
          </div>
        )}
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-6 rounded-lg border border-gray-200 bg-white p-6">
        <div>
          <p className="text-xs font-semibold uppercase text-[#6b7280]">Purchase Date</p>
          <p className="mt-1 text-sm text-[#1a1a2e]" data-testid="purchase-date">
            {asset.purchaseDate}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-[#6b7280]">Purchase Price</p>
          <p className="mt-1 text-sm text-[#1a1a2e]" data-testid="purchase-price">
            {formatCurrency(asset.purchasePrice)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-[#6b7280]">Current Value</p>
          <p className="mt-1 text-sm font-semibold text-[#1a1a2e]" data-testid="current-value">
            {formatCurrency(asset.currentValue)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-[#6b7280]">Accumulated Depreciation</p>
          <p className="mt-1 text-sm text-[#1a1a2e]" data-testid="accumulated-depreciation">
            {formatCurrency(asset.accumulatedDepreciation)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-[#6b7280]">Depreciation Method</p>
          <p className="mt-1 text-sm text-[#1a1a2e] capitalize" data-testid="depreciation-method">
            {asset.depreciationMethod.replace('_', ' ')}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-[#6b7280]">Depreciation Rate</p>
          <p className="mt-1 text-sm text-[#1a1a2e]" data-testid="depreciation-rate">
            {asset.depreciationRate}%
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-[#6b7280]">Status</p>
          <p className="mt-1 text-sm font-medium capitalize text-[#1a1a2e]" data-testid="asset-status">
            {asset.status}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-[#6b7280]">Asset Account</p>
          <p className="mt-1 text-sm text-[#1a1a2e]" data-testid="asset-account">
            {asset.assetAccountCode}
          </p>
        </div>
        {asset.disposalDate && (
          <>
            <div>
              <p className="text-xs font-semibold uppercase text-[#6b7280]">Disposal Date</p>
              <p className="mt-1 text-sm text-[#1a1a2e]" data-testid="disposal-date">
                {asset.disposalDate}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-[#6b7280]">Disposal Price</p>
              <p className="mt-1 text-sm text-[#1a1a2e]" data-testid="disposal-price">
                {formatCurrency(asset.disposalPrice ?? 0)}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Depreciation History Summary */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase text-[#6b7280]">
          Depreciation Summary
        </h3>
        <div className="flex items-center gap-8">
          <div>
            <p className="text-2xl font-bold text-[#1a1a2e]" data-testid="book-value">
              {formatCurrency(asset.currentValue)}
            </p>
            <p className="text-xs text-[#6b7280]">Book Value</p>
          </div>
          <div className="h-12 w-px bg-gray-200" />
          <div>
            <p className="text-2xl font-bold text-[#6b7280]" data-testid="total-depreciation">
              {formatCurrency(asset.accumulatedDepreciation)}
            </p>
            <p className="text-xs text-[#6b7280]">Total Depreciation</p>
          </div>
          <div className="h-12 w-px bg-gray-200" />
          <div>
            <p className="text-2xl font-bold text-[#1a1a2e]" data-testid="original-cost">
              {formatCurrency(asset.purchasePrice)}
            </p>
            <p className="text-xs text-[#6b7280]">Original Cost</p>
          </div>
        </div>
      </div>
    </div>
  );
}
