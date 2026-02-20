import { useQuery } from '@tanstack/react-query';
import { auditKeys } from './keys';
import { apiFetch } from '../../../lib/api-helpers';
import type { AuditEntry, AuditFilters, AuditListResponse } from '../types';

function buildQueryString(filters?: AuditFilters): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  if (filters.entityType) params.set('entityType', filters.entityType);
  if (filters.action) params.set('action', filters.action);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.limit !== undefined) params.set('limit', String(filters.limit));
  if (filters.offset !== undefined) params.set('offset', String(filters.offset));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/**
 * apiFetch unwraps the { ok, data } envelope, but the audit endpoint
 * also returns `total` at the top level. We need a custom fetch to
 * capture both `data` and `total`.
 */
async function fetchAuditList(filters?: AuditFilters): Promise<AuditListResponse> {
  const qs = buildQueryString(filters);
  const res = await fetch(`/api/audit${qs}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  const json = await res.json();
  if (!json.ok) {
    throw new Error(json.error ?? 'Failed to fetch audit entries');
  }
  return {
    entries: json.data as AuditEntry[],
    total: json.total as number,
  };
}

export function useAuditEntries(filters?: AuditFilters) {
  return useQuery({
    queryKey: auditKeys.list(filters),
    queryFn: () => fetchAuditList(filters),
    staleTime: 60 * 1000,
  });
}

export function useAuditEntry(id: string) {
  return useQuery({
    queryKey: auditKeys.detail(id),
    queryFn: () => apiFetch<AuditEntry>(`/audit/${id}`),
    staleTime: 60 * 1000,
    enabled: !!id,
  });
}
