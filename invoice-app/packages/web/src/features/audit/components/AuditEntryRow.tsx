import { useState } from 'react';
import { ChevronDown, ChevronRight, User } from 'lucide-react';
import { AuditEntityLink } from './AuditEntityLink';
import type { AuditEntry } from '../types';

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) !== 1 ? 's' : ''} ago`;
  return new Date(timestamp).toLocaleDateString();
}

function formatActionLabel(action: string): string {
  return action.replace(/_/g, ' ');
}

type BadgeColor = 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'gray';

function getActionBadgeColor(action: string): BadgeColor {
  switch (action) {
    case 'created':
      return 'green';
    case 'updated':
      return 'blue';
    case 'deleted':
      return 'red';
    case 'status_changed':
      return 'yellow';
    case 'payment_recorded':
      return 'purple';
    case 'sent':
      return 'blue';
    case 'voided':
      return 'red';
    case 'approved':
      return 'green';
    default:
      return 'gray';
  }
}

const badgeColorClasses: Record<BadgeColor, string> = {
  green: 'bg-emerald-100 text-emerald-700',
  blue: 'bg-blue-100 text-blue-700',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-amber-100 text-amber-700',
  purple: 'bg-purple-100 text-purple-700',
  gray: 'bg-gray-100 text-gray-700',
};

interface AuditEntryRowProps {
  entry: AuditEntry;
  onEntityClick?: (entityType: string, entityId: string) => void;
}

export function AuditEntryRow({ entry, onEntityClick }: AuditEntryRowProps) {
  const [expanded, setExpanded] = useState(false);
  const hasChanges = entry.changes.length > 0;
  const color = getActionBadgeColor(entry.action);

  return (
    <div data-testid="audit-entry-row" className="border-b border-gray-100 py-3 px-4">
      <div className="flex items-start gap-3">
        {/* User avatar */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mt-0.5">
          <User className="w-4 h-4 text-gray-500" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Top row: user + action badge + timestamp */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-gray-900">{entry.userName}</span>
            <span
              data-testid="action-badge"
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badgeColorClasses[color]}`}
            >
              {formatActionLabel(entry.action)}
            </span>
            <span
              data-testid="audit-timestamp"
              className="text-xs text-gray-500 ml-auto"
              title={new Date(entry.timestamp).toLocaleString()}
            >
              {formatRelativeTime(entry.timestamp)}
            </span>
          </div>

          {/* Entity link */}
          <div className="mt-1">
            <AuditEntityLink
              entityType={entry.entityType}
              entityId={entry.entityId}
              onClick={onEntityClick}
            />
          </div>

          {/* Expandable changes */}
          {hasChanges && (
            <div className="mt-1.5">
              <button
                data-testid="changes-toggle"
                onClick={() => setExpanded(!expanded)}
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                {expanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                {entry.changes.length} change{entry.changes.length !== 1 ? 's' : ''}
              </button>

              {expanded && (
                <div data-testid="changes-detail" className="mt-1.5 space-y-1">
                  {entry.changes.map((change, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs bg-gray-50 rounded px-2 py-1">
                      <span className="font-medium text-gray-700">{change.field}</span>
                      <span className="text-gray-400">:</span>
                      <span className="text-red-600 line-through">
                        {change.oldValue ?? '(empty)'}
                      </span>
                      <span className="text-gray-400">&rarr;</span>
                      <span className="text-green-600">
                        {change.newValue ?? '(empty)'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
