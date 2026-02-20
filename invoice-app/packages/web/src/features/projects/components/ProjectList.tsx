import { useNavigate } from '@tanstack/react-router';
import { Button } from '../../../components/ui/Button';
import type { Project } from '../types';
import { ProjectCard } from './ProjectCard';

interface ProjectListProps {
  projects: Project[];
  onProjectClick?: (projectId: string) => void;
}

export function ProjectList({ projects, onProjectClick }: ProjectListProps) {
  const navigate = useNavigate();

  if (projects.length === 0) {
    return (
      <div className="py-12 text-center" data-testid="empty-projects">
        <h3 className="text-lg font-medium text-gray-900">No projects yet</h3>
        <p className="mt-1 text-sm text-gray-500">Track time and costs against projects for your clients</p>
        <div className="mt-4">
          <Button variant="primary" size="sm" onClick={() => navigate({ to: '/projects/new' })}>
            New Project
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      data-testid="project-list"
    >
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onClick={onProjectClick}
        />
      ))}
    </div>
  );
}
