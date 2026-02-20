import { Lock } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';

const SYSTEM_ACCOUNT_CODES = ['610', '800', '820', '310'];

export function isSystemAccount(code: string): boolean {
  return SYSTEM_ACCOUNT_CODES.includes(code);
}

interface SystemAccountBadgeProps {
  accountCode: string;
}

export function SystemAccountBadge({ accountCode }: SystemAccountBadgeProps) {
  if (!isSystemAccount(accountCode)) return null;

  return (
    <span className="inline-flex items-center gap-1" data-testid="system-account-badge">
      <Lock className="h-3 w-3 text-[#6b7280]" />
      <Badge variant="default">System</Badge>
    </span>
  );
}
