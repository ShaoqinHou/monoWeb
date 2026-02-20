export const settingKeys = {
  all: ['api-settings'] as const,
  list: () => [...settingKeys.all, 'list'] as const,
  detail: (key: string) => [...settingKeys.all, 'detail', key] as const,
};
