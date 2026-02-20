export const salesKeys = {
  all: ['sales'] as const,
  summary: () => [...salesKeys.all, 'summary'] as const,
  chart: (year: number) => [...salesKeys.all, 'chart', year] as const,
  recent: () => [...salesKeys.all, 'recent'] as const,
};
