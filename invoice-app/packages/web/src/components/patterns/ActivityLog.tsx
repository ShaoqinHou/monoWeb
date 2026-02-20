import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface AuditEntry {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details?: string;
}

export interface ActivityLogProps {
  entityType: string;
  entityId: string;
  fetchEntries?: (entityType: string, entityId: string) => Promise<AuditEntry[]>;
  className?: string;
}

async function defaultFetchEntries(entityType: string, entityId: string): Promise<AuditEntry[]> {
  const res = await fetch(`/api/audit?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`);
  if (!res.ok) return [];
  const data = await res.json() as { data?: AuditEntry[] };
  return data.data ?? [];
}

export function ActivityLog({
  entityType,
  entityId,
  fetchEntries = defaultFetchEntries,
  className,
}: ActivityLogProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchEntries(entityType, entityId).then((data) => {
      if (!cancelled) {
        setEntries(data);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [entityType, entityId, fetchEntries]);

  if (loading) {
    return (
      <div className={cn('py-4 text-center text-sm text-[#6b7280]', className)} aria-busy="true">
        Loading activity...
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className={cn('py-4 text-center text-sm text-[#6b7280]', className)}>
        No activity recorded
      </div>
    );
  }

  return (
    <div className={cn('space-y-0', className)} aria-label="Activity log">
      {entries.map((entry) => (
        <div key={entry.id} className="flex gap-3 py-3 border-b border-[#e5e7eb] last:border-0">
          <div className="flex-shrink-0 mt-0.5">
            <Clock className="h-4 w-4 text-[#6b7280]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#1a1a2e]">
              <span className="font-medium">{entry.user}</span>{' '}
              {entry.action}
            </p>
            {entry.details && (
              <p className="text-xs text-[#6b7280] mt-0.5">{entry.details}</p>
            )}
            <p className="text-xs text-[#6b7280] mt-0.5">
              {new Date(entry.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
