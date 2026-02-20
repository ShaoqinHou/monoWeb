/** Query key factory for accounting feature */
export const accountingKeys = {
  all: ['accounting'] as const,
  accounts: () => [...accountingKeys.all, 'accounts'] as const,
  account: (id: string) => [...accountingKeys.accounts(), id] as const,
  bankAccounts: () => [...accountingKeys.all, 'bank-accounts'] as const,
  bankAccount: (id: string) => [...accountingKeys.bankAccounts(), id] as const,
  journals: () => [...accountingKeys.all, 'journals'] as const,
  journal: (id: string) => [...accountingKeys.journals(), id] as const,
};
