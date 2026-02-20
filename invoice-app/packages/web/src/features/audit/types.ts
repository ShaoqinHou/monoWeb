import type { AuditEntry } from '../../../../../packages/shared/schemas/audit';

export type { AuditEntry };

export interface AuditFilters {
  entityType?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface AuditListResponse {
  entries: AuditEntry[];
  total: number;
}
