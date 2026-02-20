import {
  FileText,
  CreditCard,
  Receipt,
  MessageSquare,
  UserCog,
  Mail,
  CheckCircle,
  type LucideIcon,
} from 'lucide-react';
import { formatCurrency } from '../../../../../shared/calc/currency';
import type { TimelineEvent } from '../types';

interface ContactTimelineProps {
  events: TimelineEvent[];
  isLoading: boolean;
}

type DateGroup = 'Today' | 'This Week' | 'This Month' | 'Older';

function getDateGroup(dateStr: string): DateGroup {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffMs = today.getTime() - eventDay.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays < 7) return 'This Week';
  if (diffDays < 30) return 'This Month';
  return 'Older';
}

interface EventTypeConfig {
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

function getEventConfig(type: TimelineEvent['type']): EventTypeConfig {
  switch (type) {
    case 'invoice_created':
      return { icon: FileText, color: 'text-[#0078c8]', bgColor: 'bg-[#0078c8]/10' };
    case 'invoice_paid':
      return { icon: CheckCircle, color: 'text-[#14b8a6]', bgColor: 'bg-[#14b8a6]/10' };
    case 'bill_created':
      return { icon: Receipt, color: 'text-[#f59e0b]', bgColor: 'bg-[#f59e0b]/10' };
    case 'bill_paid':
      return { icon: CheckCircle, color: 'text-[#14b8a6]', bgColor: 'bg-[#14b8a6]/10' };
    case 'payment_received':
      return { icon: CreditCard, color: 'text-[#14b8a6]', bgColor: 'bg-[#14b8a6]/10' };
    case 'payment_made':
      return { icon: CreditCard, color: 'text-[#ef4444]', bgColor: 'bg-[#ef4444]/10' };
    case 'note_added':
      return { icon: MessageSquare, color: 'text-[#6b7280]', bgColor: 'bg-gray-100' };
    case 'contact_updated':
      return { icon: UserCog, color: 'text-[#6b7280]', bgColor: 'bg-gray-100' };
    case 'email_sent':
      return { icon: Mail, color: 'text-[#0078c8]', bgColor: 'bg-[#0078c8]/10' };
    default:
      return { icon: FileText, color: 'text-[#6b7280]', bgColor: 'bg-gray-100' };
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function groupEventsByDate(events: TimelineEvent[]): Map<DateGroup, TimelineEvent[]> {
  const groups = new Map<DateGroup, TimelineEvent[]>();
  const order: DateGroup[] = ['Today', 'This Week', 'This Month', 'Older'];

  for (const group of order) {
    groups.set(group, []);
  }

  for (const event of events) {
    const group = getDateGroup(event.date);
    groups.get(group)!.push(event);
  }

  // Remove empty groups
  for (const group of order) {
    if (groups.get(group)!.length === 0) {
      groups.delete(group);
    }
  }

  return groups;
}

export function ContactTimeline({ events, isLoading }: ContactTimelineProps) {
  if (isLoading) {
    return (
      <div className="py-8 text-center text-[#6b7280]" data-testid="timeline-loading">
        Loading timeline...
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="py-8 text-center text-[#6b7280]" data-testid="timeline-empty">
        No activity found for this contact.
      </div>
    );
  }

  const grouped = groupEventsByDate(events);

  return (
    <div className="space-y-6" data-testid="contact-timeline">
      {Array.from(grouped.entries()).map(([groupLabel, groupEvents]) => (
        <div key={groupLabel}>
          <h3 className="text-sm font-semibold text-[#6b7280] mb-3">{groupLabel}</h3>
          <div className="relative ml-4 border-l-2 border-[#e5e7eb] pl-6 space-y-4">
            {groupEvents.map((event) => {
              const config = getEventConfig(event.type);
              const IconComponent = config.icon;

              return (
                <div
                  key={event.id}
                  className="relative flex items-start gap-3"
                  data-testid={`timeline-event-${event.id}`}
                >
                  {/* Icon dot on the timeline line */}
                  <div
                    className={`absolute -left-[34px] flex h-8 w-8 items-center justify-center rounded-full ${config.bgColor}`}
                    data-testid={`timeline-icon-${event.type}`}
                  >
                    <IconComponent className={`h-4 w-4 ${config.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 ml-2">
                    <p className="text-sm font-medium text-[#1a1a2e]">
                      {event.description}
                    </p>
                    <p className="text-xs text-[#6b7280] mt-0.5">
                      {formatDate(event.date)}
                    </p>
                  </div>

                  {/* Amount */}
                  {event.amount !== undefined && (
                    <span className="text-sm font-medium text-[#1a1a2e] shrink-0">
                      {formatCurrency(event.amount)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
