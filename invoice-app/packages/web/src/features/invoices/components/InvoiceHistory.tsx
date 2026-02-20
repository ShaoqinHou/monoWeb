import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../lib/api-helpers';

export interface AuditEntry {
  id: string;
  entityId: string;
  action: string;
  user: string;
  date: string;
  details?: string;
}

export interface InvoiceHistoryProps {
  invoiceId: string;
}

export function InvoiceHistory({ invoiceId }: InvoiceHistoryProps) {
  const { data: entries, isLoading } = useQuery({
    queryKey: ['audit', invoiceId],
    queryFn: () => apiFetch<AuditEntry[]>(`/audit?entityId=${invoiceId}`),
    staleTime: 60 * 1000,
    enabled: !!invoiceId,
  });

  if (isLoading) {
    return (
      <div data-testid="invoice-history-loading" className="text-sm text-[#6b7280]">
        Loading history...
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div data-testid="invoice-history-empty" className="text-sm text-[#6b7280]">
        No history available.
      </div>
    );
  }

  return (
    <div data-testid="invoice-history" className="relative">
      <div className="absolute left-3 top-0 bottom-0 w-px bg-[#e5e7eb]" />
      <ul className="space-y-4">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="relative pl-8"
            data-testid={`history-entry-${entry.id}`}
          >
            <div className="absolute left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-[#0078c8] bg-white" />
            <div className="text-xs text-[#6b7280]" data-testid="history-date">
              {new Date(entry.date).toLocaleDateString('en-NZ', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
            <div className="text-sm font-medium text-[#1a1a2e]" data-testid="history-action">
              {entry.action}
            </div>
            <div className="text-xs text-[#6b7280]" data-testid="history-user">
              {entry.user}
            </div>
            {entry.details && (
              <div className="mt-1 text-xs text-[#6b7280]" data-testid="history-details">
                {entry.details}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
