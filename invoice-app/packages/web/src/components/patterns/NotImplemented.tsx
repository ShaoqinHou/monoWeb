import { cn } from '../../lib/cn';

interface NotImplementedProps {
  children: React.ReactNode;
  label?: string;
}

export function NotImplemented({ children, label = 'Not implemented' }: NotImplementedProps) {
  return (
    <div
      className={cn('relative inline-block')}
      title={label}
      data-testid="not-implemented-wrapper"
      aria-label={label}
    >
      <div className="opacity-60">{children}</div>
      <div className="absolute inset-0 rounded border border-red-300 bg-red-50/30 pointer-events-none" />
    </div>
  );
}
