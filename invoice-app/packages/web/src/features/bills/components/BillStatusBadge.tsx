import { StatusBadge } from '../../../components/patterns/StatusBadge';

interface BillStatusBadgeProps {
  status: string;
  className?: string;
}

export function BillStatusBadge({ status, className }: BillStatusBadgeProps) {
  return <StatusBadge status={status} className={className} />;
}
