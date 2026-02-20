import { Badge, type BadgeVariant } from "../ui/Badge";
import { cn } from "../../lib/cn";

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

interface StatusConfig {
  variant: BadgeVariant;
  strikethrough?: boolean;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  draft: { variant: "default" },
  submitted: { variant: "info" },
  approved: { variant: "warning" },
  paid: { variant: "success" },
  overdue: { variant: "error" },
  voided: { variant: "default", strikethrough: true },
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_MAP[status.toLowerCase()] ?? { variant: "default" as BadgeVariant };

  return (
    <Badge
      variant={config.variant}
      className={cn(config.strikethrough && "line-through", className)}
    >
      {capitalize(status)}
    </Badge>
  );
}
