import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { PageContainer } from '../../../components/layout/PageContainer';
import { ProjectForm } from '../components/ProjectForm';
import { useCreateProject } from '../hooks/useProjects';
import type { CreateProject } from '../types';

export function ProjectCreatePage() {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const [showForm, setShowForm] = useState(true);

  const handleSubmit = (values: CreateProject) => {
    createProject.mutate(values, {
      onSuccess: () => {
        navigate({ to: '/projects' });
      },
    });
  };

  const handleClose = () => {
    setShowForm(false);
    navigate({ to: '/projects' });
  };

  return (
    <PageContainer
      title="New Project"
      breadcrumbs={[
        { label: 'Projects', href: '/projects' },
        { label: 'New Project' },
      ]}
    >
      <ProjectForm
        open={showForm}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />
    </PageContainer>
  );
}
