interface ProjectProgressProps {
  used: number;
  budget: number;
  label?: string;
}

export function ProjectProgress({ used, budget, label }: ProjectProgressProps) {
  const percentage = budget > 0 ? Math.min((used / budget) * 100, 100) : 0;
  const isOverBudget = used > budget;

  const barColor = isOverBudget
    ? 'bg-[#ef4444]'
    : percentage > 75
      ? 'bg-[#f59e0b]'
      : 'bg-[#0078c8]';

  return (
    <div className="w-full" data-testid="project-progress">
      {label && (
        <div className="flex justify-between text-xs text-[#6b7280] mb-1">
          <span>{label}</span>
          <span data-testid="progress-percentage">{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        className="h-2 w-full rounded-full bg-gray-100 overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
      >
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
