import { useState, useCallback, useMemo } from 'react';
import { Search, PlayCircle, Info, MoreHorizontal, X } from 'lucide-react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Tabs, TabList, Tab, TabPanel } from '../../../components/ui/Tabs';
import { FixedAssetList } from '../components/FixedAssetList';
import { FixedAssetDetail } from '../components/FixedAssetDetail';
import { usePagination } from '../../../lib/usePagination';
import { Pagination } from '../../../components/patterns/Pagination';
import { showToast } from '../../dashboard/components/ToastContainer';
import { NotImplemented } from '../../../components/patterns/NotImplemented';
import {
  useFixedAssets,
  useFixedAsset,
  useDepreciateAsset,
  useDisposeAsset,
  useDeleteFixedAsset,
} from '../hooks/useFixedAssets';
import type { FixedAsset } from '../hooks/useFixedAssets';

/** Fixed asset status filter tabs matching Xero */
const ASSET_TABS = [
  { id: 'draft', label: 'Draft' },
  { id: 'registered', label: 'Registered' },
  { id: 'disposed', label: 'Sold/Disposed' },
] as const;

type AssetTabId = (typeof ASSET_TABS)[number]['id'];

export function FixedAssetsPage() {
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AssetTabId>('draft');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [helpBannerVisible, setHelpBannerVisible] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { data: assets = [], isLoading } = useFixedAssets();
  const { data: selectedAsset } = useFixedAsset(selectedAssetId ?? '');
  const depreciate = useDepreciateAsset();
  const dispose = useDisposeAsset();
  const deleteAsset = useDeleteFixedAsset();

  const filteredAssets = useMemo(() => {
    let result = assets;
    if (activeTab === 'draft') result = result.filter((a) => a.status === 'draft');
    else if (activeTab === 'registered') result = result.filter((a) => a.status === 'registered');
    else result = result.filter((a) => a.status === 'sold' || a.status === 'disposed');

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.assetNumber.toLowerCase().includes(q) ||
          a.depreciationMethod.toLowerCase().includes(q),
      );
    }
    return result;
  }, [assets, activeTab, search]);

  const pagination = usePagination(filteredAssets);

  /** Tab counts */
  const counts = useMemo(() => ({
    draft: assets.filter((a) => a.status === 'draft').length,
    registered: assets.filter((a) => a.status === 'registered').length,
    disposed: assets.filter((a) => a.status === 'sold' || a.status === 'disposed').length,
  }), [assets]);

  const handleAssetClick = useCallback((asset: FixedAsset) => {
    setSelectedAssetId(asset.id);
  }, []);

  const handleDepreciate = useCallback(() => {
    if (selectedAssetId) {
      depreciate.mutate(selectedAssetId, {
        onSuccess: () => showToast('success', 'Depreciation recorded'),
        onError: (err: Error) => showToast('error', err.message || 'Failed to record depreciation'),
      });
    }
  }, [selectedAssetId, depreciate]);

  const handleDispose = useCallback(() => {
    if (selectedAssetId) {
      dispose.mutate({ id: selectedAssetId, type: 'disposed' }, {
        onSuccess: () => showToast('success', 'Asset disposed'),
        onError: (err: Error) => showToast('error', err.message || 'Failed to dispose asset'),
      });
    }
  }, [selectedAssetId, dispose]);

  const handleSell = useCallback(() => {
    if (selectedAssetId) {
      const priceStr = window.prompt('Enter sale price:');
      if (priceStr !== null) {
        const price = parseFloat(priceStr);
        if (!isNaN(price) && price >= 0) {
          dispose.mutate({ id: selectedAssetId, type: 'sold', price }, {
            onSuccess: () => showToast('success', 'Asset sold'),
            onError: (err: Error) => showToast('error', err.message || 'Failed to sell asset'),
          });
        }
      }
    }
  }, [selectedAssetId, dispose]);

  const handleSelectAsset = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredAssets.map((a) => a.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [filteredAssets]);

  const handleBulkDelete = useCallback(() => {
    const ids = Array.from(selectedIds);
    ids.forEach((id) => deleteAsset.mutate(id, {
      onError: (err: Error) => showToast('error', err.message || 'Failed to delete asset'),
    }));
    setSelectedIds(new Set());
    if (ids.length > 0) showToast('success', `Deleted ${ids.length} asset(s)`);
  }, [selectedIds, deleteAsset]);

  const handleBulkRegister = useCallback(() => {
    // Register selected draft assets (placeholder — calls depreciate which transitions status)
    const ids = Array.from(selectedIds);
    ids.forEach((id) => depreciate.mutate(id, {
      onError: (err: Error) => showToast('error', err.message || 'Failed to register asset'),
    }));
    setSelectedIds(new Set());
    if (ids.length > 0) showToast('success', `Registering ${ids.length} asset(s)`);
  }, [selectedIds, depreciate]);

  return (
    <PageContainer
      title="Fixed Assets"
      breadcrumbs={[
        { label: 'Accounting', href: '/accounting' },
        { label: 'Fixed Assets' },
      ]}
    >
      {selectedAssetId && selectedAsset ? (
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedAssetId(null)}
            data-testid="back-to-assets"
          >
            Back to Assets
          </Button>
          <FixedAssetDetail
            asset={selectedAsset}
            onDepreciate={handleDepreciate}
            onDispose={handleDispose}
            onSell={handleSell}
            isDepreciating={depreciate.isPending}
          />
        </div>
      ) : (
        <>
          {/* Help banner */}
          {helpBannerVisible && (
            <div
              className="mb-4 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4"
              data-testid="assets-help-banner"
            >
              <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm text-blue-800">
                  Track business assets to manage their depreciation and disposals.{' '}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <NotImplemented label="Watch video — not yet implemented">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm font-medium text-blue-700 hover:bg-blue-100"
                    data-testid="assets-video-link"
                  >
                    <PlayCircle className="h-4 w-4" />
                    Watch video [2:33]
                  </button>
                </NotImplemented>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm font-medium text-blue-700 hover:bg-blue-100"
                  data-testid="assets-hide-banner"
                  onClick={() => setHelpBannerVisible(false)}
                >
                  <X className="h-4 w-4" />
                  Hide
                </button>
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="mb-4 flex items-center justify-between" data-testid="assets-toolbar">
            <div className="flex items-center gap-2">
              <NotImplemented label="Run depreciation — not yet implemented">
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="assets-run-depreciation"
                >
                  Run depreciation
                </Button>
              </NotImplemented>
              <NotImplemented label="More options — not yet implemented">
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="assets-more-options"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </NotImplemented>
            </div>
            <Button
              variant="primary"
              size="sm"
              data-testid="assets-new-asset"
              onClick={() => setShowCreateForm(true)}
            >
              New asset
            </Button>
          </div>

          {/* TODO: Replace with FixedAssetForm component when implemented */}
          {showCreateForm && (
            <div
              className="mb-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
              data-testid="assets-create-form-placeholder"
            >
              <p className="text-sm text-amber-800">
                Coming soon — fixed asset creation form
              </p>
              <button
                type="button"
                className="text-amber-600 hover:text-amber-800"
                onClick={() => setShowCreateForm(false)}
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Last depreciation info */}
          <div className="mb-4 text-sm text-[#6b7280]" data-testid="last-depreciation-info">
            Last depreciation: none
          </div>

          {/* Search box */}
          <div className="mb-4 max-w-md" data-testid="assets-search">
            <Input
              placeholder="Search draft assets by name, number, type or description"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              startIcon={<Search className="h-4 w-4" />}
              data-testid="assets-search-input"
            />
          </div>

          <Tabs defaultTab="draft" onChange={(id) => setActiveTab(id as AssetTabId)}>
            <TabList>
              {ASSET_TABS.map((tab) => (
                <Tab key={tab.id} tabId={tab.id} data-testid={`asset-tab-${tab.id}`}>
                  {tab.label} ({counts[tab.id]})
                </Tab>
              ))}
            </TabList>

            {ASSET_TABS.map((tab) => (
              <TabPanel key={tab.id} tabId={tab.id}>
                {/* Bulk actions bar for draft tab */}
                {activeTab === 'draft' && (
                  <div
                    className="mb-2 flex items-center gap-3"
                    data-testid="assets-bulk-actions"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      data-testid="assets-bulk-delete"
                      disabled={selectedIds.size === 0}
                      onClick={handleBulkDelete}
                    >
                      Delete
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      data-testid="assets-bulk-register"
                      disabled={selectedIds.size === 0}
                      onClick={handleBulkRegister}
                    >
                      Register
                    </Button>
                  </div>
                )}

                {/* Item count */}
                <div
                  className="mb-2 text-sm text-[#6b7280]"
                  data-testid="assets-item-count"
                >
                  {filteredAssets.length} items total
                </div>

                <FixedAssetList
                  assets={pagination.pageData}
                  isLoading={isLoading}
                  onAssetClick={handleAssetClick}
                  selectedIds={selectedIds}
                  onSelectAsset={handleSelectAsset}
                  onSelectAll={handleSelectAll}
                />
                {filteredAssets.length > 0 && (
                  <Pagination
                    page={pagination.page}
                    pageSize={pagination.pageSize}
                    total={pagination.total}
                    onChange={pagination.onChange}
                    data-testid="assets-pagination"
                  />
                )}
              </TabPanel>
            ))}
          </Tabs>
        </>
      )}
    </PageContainer>
  );
}
