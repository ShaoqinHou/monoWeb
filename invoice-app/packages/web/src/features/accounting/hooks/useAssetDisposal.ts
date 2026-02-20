import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../../../lib/api-helpers';
import { fixedAssetKeys } from './fixedAssetKeys';
import type { FixedAsset } from './useFixedAssets';

export type DisposalMethod = 'sold' | 'scrapped' | 'lost';

export interface DisposeAssetInput {
  id: string;
  date: string;
  price: number;
  method: DisposalMethod;
}

export function useAssetDisposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, date, price, method }: DisposeAssetInput) =>
      apiPost<FixedAsset>(`/fixed-assets/${id}/dispose`, { date, price, method }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: fixedAssetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: fixedAssetKeys.detail(variables.id) });
    },
  });
}
