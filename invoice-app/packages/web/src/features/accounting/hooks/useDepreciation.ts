import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../../../lib/api-helpers';
import { fixedAssetKeys } from './fixedAssetKeys';
import { accountingKeys } from './keys';
import type { FixedAsset } from './useFixedAssets';

export interface DepreciationEntry {
  assetId: string;
  assetName: string;
  amount: number;
  debitAccount: string;
  creditAccount: string;
  period: string;
}

export interface DepreciationResult {
  entries: DepreciationEntry[];
  totalDepreciation: number;
}

/** Calculate depreciation for a single asset for a given period (monthly) */
export function calculateDepreciation(asset: FixedAsset, period: string): DepreciationEntry | null {
  if (asset.status !== 'registered' || asset.currentValue <= 0) {
    return null;
  }

  let amount: number;

  if (asset.depreciationMethod === 'straight_line') {
    // Straight-line: rate% of purchase price per year, divided by 12
    amount = (asset.purchasePrice * asset.depreciationRate) / 100 / 12;
  } else {
    // Diminishing value: rate% of current value per year, divided by 12
    amount = (asset.currentValue * asset.depreciationRate) / 100 / 12;
  }

  // Don't depreciate below zero
  amount = Math.min(amount, asset.currentValue);
  amount = Math.round(amount * 100) / 100;

  if (amount <= 0) return null;

  return {
    assetId: asset.id,
    assetName: asset.name,
    amount,
    debitAccount: asset.depreciationAccountCode,
    creditAccount: asset.assetAccountCode,
    period,
  };
}

/** Preview depreciation for all assets without posting */
export function previewDepreciation(assets: FixedAsset[], period: string): DepreciationResult {
  const entries: DepreciationEntry[] = [];
  let totalDepreciation = 0;

  for (const asset of assets) {
    const entry = calculateDepreciation(asset, period);
    if (entry) {
      entries.push(entry);
      totalDepreciation += entry.amount;
    }
  }

  return { entries, totalDepreciation: Math.round(totalDepreciation * 100) / 100 };
}

export interface DepreciationRunResult {
  journalId: string;
  assetsProcessed: number;
  journalEntriesCreated: number;
  message: string;
}

/** Mutation to run depreciation (posts journal entries to the server) */
export function useRunDepreciation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { period: string; entries: DepreciationEntry[] }) =>
      apiPost<DepreciationRunResult>('/fixed-assets/depreciate', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fixedAssetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: accountingKeys.journals() });
    },
  });
}
