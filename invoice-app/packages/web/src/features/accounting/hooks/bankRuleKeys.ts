export const bankRuleKeys = {
  all: () => ['bankRules'] as const,
  lists: () => [...bankRuleKeys.all(), 'list'] as const,
  details: () => [...bankRuleKeys.all(), 'detail'] as const,
  detail: (id: string) => [...bankRuleKeys.details(), id] as const,
};
