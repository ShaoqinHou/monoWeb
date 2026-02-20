import { AuditEntryRow } from './AuditEntryRow';
import type { AuditEntry } from '../types';

interface AuditTimelineProps {
  entries: AuditEntry[];
  onEntityClick?: (entityType: string, entityId: string) => void;
}

export function AuditTimeline({ entries, onEntityClick }: AuditTimelineProps) {
  if (entries.length === 0) {
    return (
      <div data-testid="audit-empty" className="text-center py-12">
        <p className="text-gray-500 text-sm">No audit entries found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
      {entries.map((entry) => (
        <AuditEntryRow
          key={entry.id}
          entry={entry}
          onEntityClick={onEntityClick}
        />
      ))}
    </div>
  );
}
