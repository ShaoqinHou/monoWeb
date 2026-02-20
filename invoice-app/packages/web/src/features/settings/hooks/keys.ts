export const settingsKeys = {
  all: ['settings'] as const,
  organization: () => [...settingsKeys.all, 'organization'] as const,
  user: () => [...settingsKeys.all, 'user'] as const,
};
