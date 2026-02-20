import { type HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-[#14b8a6]/10 text-[#14b8a6]",
  warning: "bg-[#f59e0b]/10 text-[#f59e0b]",
  error: "bg-[#ef4444]/10 text-[#ef4444]",
  info: "bg-[#0078c8]/10 text-[#0078c8]",
};

export function Badge({
  variant = "default",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
