import { useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { PageContainer } from '../../../components/layout/PageContainer';
import { ProjectForm } from '../components/ProjectForm';
import { useCreateProject } from '../hooks/useProjects';
import { useContacts } from '../../contacts/hooks/useContacts';
import { showToast } from '../../dashboard/components/ToastContainer';
import type { CreateProject } from '../types';

export function ProjectCreatePage() {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const { data: contactList } = useContacts();

  const contactOptions = useMemo(() => {
    if (!contactList) return [];
    return contactList.map((c) => ({ value: c.id, label: c.name }));
  }, [contactList]);

  const handleSubmit = (values: CreateProject) => {
    createProject.mutate(values, {
      onSuccess: () => {
        showToast('success', 'Project created');
        navigate({ to: '/projects' });
      },
      onError: (err: Error) => showToast('error', err.message || 'Failed to create project'),
    });
  };

  const handleCancel = () => {
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
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-[#e5e7eb] bg-white p-6">
          <ProjectForm
            open={false}
            onClose={handleCancel}
            onSubmit={handleSubmit}
            contacts={contactOptions}
            mode="inline"
          />
        </div>
      </div>
    </PageContainer>
  );
}
