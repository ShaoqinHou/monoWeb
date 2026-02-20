import { useState } from 'react';
import { Button } from '../../../../components/ui/Button';

export interface BankFeedStatusProps {
  bankName: string;
  isConnected: boolean;
  lastSyncTime?: string;
}

function formatSyncTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function BankFeedStatus({
  bankName,
  isConnected: initialConnected,
  lastSyncTime: initialSync,
}: BankFeedStatusProps) {
  const [lastSync, setLastSync] = useState(initialSync ?? new Date().toISOString());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Mock refresh — just update the timestamp
    setTimeout(() => {
      setLastSync(new Date().toISOString());
      setIsRefreshing(false);
    }, 500);
  };

  return (
    <div className="flex items-center gap-3 rounded border border-[#e5e7eb] bg-white p-4">
      {/* Status indicator */}
      <span
        className={`inline-block h-3 w-3 rounded-full ${
          initialConnected ? 'bg-green-500' : 'bg-gray-400'
        }`}
        data-testid="feed-status-dot"
        aria-label={initialConnected ? 'Connected' : 'Disconnected'}
      />

      <div className="flex-1">
        <p className="text-sm font-medium text-[#1a1a2e]">{bankName}</p>
        <p className="text-xs text-[#6b7280]">
          {initialConnected ? 'Connected' : 'Disconnected'}
          {initialConnected && lastSync && (
            <> &middot; Last sync: {formatSyncTime(lastSync)}</>
          )}
        </p>
      </div>

      {initialConnected && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          loading={isRefreshing}
        >
          Refresh
        </Button>
      )}
    </div>
  );
}
