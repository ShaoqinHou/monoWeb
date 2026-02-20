import type { AuditFilters } from '../types';

export const auditKeys = {
  all: ['audit'] as const,
  list: (filters?: AuditFilters) => [...auditKeys.all, 'list', filters] as const,
  detail: (id: string) => [...auditKeys.all, 'detail', id] as const,
};
