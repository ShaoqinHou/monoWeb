export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: () => [...dashboardKeys.all, 'summary'] as const,
  invoiceSummary: () => [...dashboardKeys.all, 'invoice-summary'] as const,
  billSummary: () => [...dashboardKeys.all, 'bill-summary'] as const,
  cashFlow: () => [...dashboardKeys.all, 'cash-flow'] as const,
  bankAccounts: () => [...dashboardKeys.all, 'bank-accounts'] as const,
  watchlist: () => [...dashboardKeys.all, 'watchlist'] as const,
  recentActivity: () => [...dashboardKeys.all, 'recent-activity'] as const,
  tasks: () => [...dashboardKeys.all, 'tasks'] as const,
  insights: () => [...dashboardKeys.all, 'insights'] as const,
};
