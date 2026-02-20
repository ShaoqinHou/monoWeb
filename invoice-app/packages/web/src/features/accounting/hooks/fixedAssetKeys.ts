export const fixedAssetKeys = {
  all: () => ['fixedAssets'] as const,
  lists: () => [...fixedAssetKeys.all(), 'list'] as const,
  details: () => [...fixedAssetKeys.all(), 'detail'] as const,
  detail: (id: string) => [...fixedAssetKeys.details(), id] as const,
};
