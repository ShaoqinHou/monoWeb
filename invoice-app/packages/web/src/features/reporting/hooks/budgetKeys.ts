/** Query key factory for budget feature */
export const budgetKeys = {
  all: ['budgets'] as const,
  lists: () => [...budgetKeys.all, 'list'] as const,
  detail: (id: string) => [...budgetKeys.all, 'detail', id] as const,
};
