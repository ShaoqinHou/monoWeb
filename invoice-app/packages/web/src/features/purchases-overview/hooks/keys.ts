export const purchasesKeys = {
  all: ['purchases'] as const,
  summary: () => [...purchasesKeys.all, 'summary'] as const,
  chart: (year: number) => [...purchasesKeys.all, 'chart', year] as const,
  recent: () => [...purchasesKeys.all, 'recent'] as const,
};
