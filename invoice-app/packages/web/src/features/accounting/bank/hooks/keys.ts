export const bankKeys = {
  all: ['bank'] as const,
  accounts: () => [...bankKeys.all, 'accounts'] as const,
  transactions: (accountId?: string) => [...bankKeys.all, 'transactions', accountId] as const,
  suggestions: (transactionId: string) => [...bankKeys.all, 'suggestions', transactionId] as const,
  balance: (accountId: string) => [...bankKeys.all, 'balance', accountId] as const,
};
