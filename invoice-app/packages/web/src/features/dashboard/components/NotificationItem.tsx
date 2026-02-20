import type { Notification, NotificationType } from '../hooks/useNotifications';

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
}

const TYPE_ICONS: Record<NotificationType, { label: string; colorClass: string }> = {
  invoice_overdue: { label: 'INV', colorClass: 'bg-red-500' },
  payment_received: { label: 'PAY', colorClass: 'bg-green-500' },
  expense_submitted: { label: 'EXP', colorClass: 'bg-blue-500' },
  leave_request: { label: 'LV', colorClass: 'bg-purple-500' },
  bank_feed: { label: 'BNK', colorClass: 'bg-yellow-500' },
};

function formatRelativeTime(isoTimestamp: string): string {
  const diff = Date.now() - new Date(isoTimestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function NotificationItem({ notification, onMarkRead, onDismiss }: NotificationItemProps) {
  const icon = TYPE_ICONS[notification.type];

  const handleClick = () => {
    if (!notification.read) {
      onMarkRead(notification.id);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss(notification.id);
  };

  return (
    <div
      data-testid={`notification-${notification.id}`}
      className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
        notification.read ? 'opacity-60' : ''
      }`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') handleClick(); }}
    >
      {/* Type icon */}
      <div
        data-testid={`notification-icon-${notification.type}`}
        className={`flex-shrink-0 w-8 h-8 rounded-full ${icon.colorClass} text-white text-xs font-bold flex items-center justify-center`}
      >
        {icon.label}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${notification.read ? 'text-gray-500' : 'text-gray-900 font-medium'}`}>
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 mt-0.5" data-testid={`notification-time-${notification.id}`}>
          {formatRelativeTime(notification.timestamp)}
        </p>
      </div>

      {/* Unread dot + dismiss */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {!notification.read && (
          <span
            data-testid={`unread-dot-${notification.id}`}
            className="w-2 h-2 rounded-full bg-[#0078c8]"
          />
        )}
        <button
          data-testid={`dismiss-${notification.id}`}
          className="text-gray-400 hover:text-gray-600 text-sm leading-none p-1"
          onClick={handleDismiss}
          aria-label={`Dismiss notification`}
        >
          X
        </button>
      </div>
    </div>
  );
}
