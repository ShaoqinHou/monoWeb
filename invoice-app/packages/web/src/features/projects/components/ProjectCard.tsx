import { Card, CardContent, CardHeader } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { formatCurrency } from '../../../../../shared/calc/currency';
import { ProjectProgress } from './ProjectProgress';
import { MoreHorizontal } from 'lucide-react';
import type { Project, ProjectStatus } from '../types';

interface ProjectCardProps {
  project: Project;
  onClick?: (projectId: string) => void;
}

const statusLabels: Record<ProjectStatus, string> = {
  draft: 'Draft',
  in_progress: 'In Progress',
  completed: 'Completed',
  closed: 'Closed',
};

const statusVariants: Record<ProjectStatus, 'info' | 'success' | 'default' | 'warning'> = {
  draft: 'warning',
  in_progress: 'info',
  completed: 'success',
  closed: 'default',
};

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick?.(project.id);
  };

  return (
    <a
      href={`/projects/${project.id}`}
      onClick={handleClick}
      className="block cursor-pointer"
      data-testid={`project-card-${project.id}`}
      aria-label={`Open project ${project.name}`}
    >
    <Card
      className="hover:shadow-md transition-shadow h-full"
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {project.contactName && (
              <div
                className="h-10 w-10 rounded-full bg-[#0078c8]/10 flex items-center justify-center text-[#0078c8] text-sm font-bold shrink-0"
                data-testid={`project-contact-initials-${project.id}`}
              >
                {project.contactName
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-[#1a1a2e] truncate">
                {project.name}
              </h3>
              {project.contactName && (
                <p className="text-sm text-[#6b7280] mt-0.5">{project.contactName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariants[project.status]}>
              {statusLabels[project.status]}
            </Badge>
            <button
              className="p-1 rounded hover:bg-gray-100 text-[#6b7280] hover:text-[#1a1a2e] transition-colors"
              onClick={(e) => { e.stopPropagation(); }}
              data-testid={`project-more-${project.id}`}
              aria-label="More options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Deadline */}
          {project.deadline && (
            <div className="flex justify-between text-sm">
              <span className="text-[#6b7280]">Deadline</span>
              <span className="text-[#1a1a2e]">
                {new Date(project.deadline).toLocaleDateString('en-NZ', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}

          {/* Estimate vs Spent */}
          <div className="flex justify-between text-sm" data-testid={`project-estimate-spent-${project.id}`}>
            <span className="text-[#6b7280]">Estimate vs Spent</span>
            <span className="text-[#1a1a2e]">
              {project.budgetAmount != null
                ? `${formatCurrency(project.usedAmount ?? 0)} / ${formatCurrency(project.budgetAmount)}`
                : formatCurrency(project.usedAmount ?? 0)}
            </span>
          </div>

          {/* Progress bar for budgeted projects */}
          {project.budgetHours != null && project.budgetHours > 0 && (
            <ProjectProgress
              used={project.usedHours}
              budget={project.budgetHours}
              label="Hours used"
            />
          )}
        </div>
      </CardContent>
    </Card>
    </a>
  );
}
