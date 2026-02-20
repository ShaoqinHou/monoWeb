import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../../../../lib/api-helpers';
import { bankKeys } from './keys';
import type { ImportParams, ImportResult } from '../types';

/** Import bank transactions via POST /bank-transactions/import */
export function useImportTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ImportParams): Promise<ImportResult> => {
      return apiPost<ImportResult>('/bank-transactions/import', params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankKeys.all });
    },
  });
}
