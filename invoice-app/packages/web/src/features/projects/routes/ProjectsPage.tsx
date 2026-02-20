import { useState, useMemo } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { showToast } from '../../dashboard/components/ToastContainer';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Combobox, type ComboboxOption } from '../../../components/ui/Combobox';
import { Input } from '../../../components/ui/Input';
import { Pagination } from '../../../components/patterns/Pagination';
import { usePagination } from '../../../lib/usePagination';
import { ProjectList } from '../components/ProjectList';
import { ProjectDetail } from '../components/ProjectDetail';
import { TimeEntryList } from '../components/TimeEntryList';
import { TimeEntryForm } from '../components/TimeEntryForm';
import { ProjectForm } from '../components/ProjectForm';
import {
  useProjects,
  useProject,
  useTimeEntries,
  useUpdateProject,
  useDeleteProject,
  useCreateTimeEntry,
  useDeleteTimeEntry,
} from '../hooks/useProjects';
import { useContacts } from '../../contacts/hooks/useContacts';
import { Timer, BarChart2, Search, MoreHorizontal } from 'lucide-react';
import type { ProjectStatus } from '../types';

/* ─── Status tab definitions ─── */

const STATUS_TABS: { value: ProjectStatus | 'all'; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'closed', label: 'Closed' },
];

/* ─── ProjectsPage ─── */

export function ProjectsPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('in_progress');
  const [searchQuery, setSearchQuery] = useState('');
  const [contactFilter, setContactFilter] = useState<string | null>(null);
  const { data: projects, isLoading, isError } = useProjects(statusFilter);

  // Also fetch all projects to get the "All projects" count
  const { data: allProjects } = useProjects('all');

  const allProjectList = allProjects ?? [];

  // Get unique contacts for filter (as Combobox options)
  const contactComboboxOptions = useMemo((): ComboboxOption[] => {
    const names = new Set<string>();
    for (const p of allProjectList) {
      if (p.contactName) names.add(p.contactName);
    }
    return Array.from(names).sort().map((name) => ({ value: name, label: name }));
  }, [allProjectList]);

  const projectList = projects ?? [];

  // Apply search filter
  const filteredProjects = useMemo(() => projectList.filter((p) => {
    const matchesSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.contactName && p.contactName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesContact = !contactFilter || p.contactName === contactFilter;
    return matchesSearch && matchesContact;
  }), [projectList, searchQuery, contactFilter]);

  // Shared pagination hook — must be called unconditionally before any early returns
  const pagination = usePagination(filteredProjects, { defaultPageSize: 12 });

  if (isLoading) {
    return (
      <PageContainer title="Projects">
        <div className="text-[#6b7280]" data-testid="projects-loading">Loading projects...</div>
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer title="Projects">
        <div className="text-[#ef4444]" data-testid="projects-error">Failed to load projects.</div>
      </PageContainer>
    );
  }

  // Get tab counts from all projects
  const tabCounts: Record<string, number> = { draft: 0, in_progress: 0, closed: 0 };
  for (const p of allProjectList) {
    if (p.status in tabCounts) tabCounts[p.status]++;
  }

  const statusLabel = STATUS_TABS.find((t) => t.value === statusFilter)?.label ?? 'all';
  const searchPlaceholder = `Search ${statusLabel.toLowerCase()} projects`;

  const handleTabChange = (tab: ProjectStatus | 'all') => {
    setStatusFilter(tab);
    setSearchQuery('');
    setContactFilter(null);
  };

  return (
    <PageContainer
      title="Projects"
      actions={
        <div className="flex items-center gap-3">
          <Button variant="secondary" data-testid="timer-btn">
            <Timer className="h-4 w-4 mr-1" />
            Timer
          </Button>
          <Button variant="secondary" data-testid="reports-btn">
            <BarChart2 className="h-4 w-4 mr-1" />
            Reports
          </Button>
          <Button onClick={() => navigate({ to: '/projects/new' })} data-testid="new-project-btn">New project</Button>
          <button
            className="p-2 rounded border border-[#e5e7eb] hover:bg-gray-50 text-[#6b7280] hover:text-[#1a1a2e] transition-colors"
            data-testid="page-more-options-btn"
            aria-label="More options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      }
    >
      {/* Status tabs */}
      <div className="flex border-b border-[#e5e7eb] mb-4" role="tablist" data-testid="status-tabs">
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.value;
          const count = tabCounts[tab.value] ?? 0;
          return (
            <button
              key={tab.value}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabChange(tab.value)}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'text-[#0078c8] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#0078c8]'
                  : 'text-[#6b7280] hover:text-[#1a1a2e]'
              }`}
              data-testid={`tab-${tab.value}`}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Filter bar: search + all projects + contact filter */}
      <div className="flex items-center gap-3 mb-4" data-testid="filter-bar">
        <div className="flex-1 max-w-sm">
          <Input
            inputId="project-search"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); pagination.onChange(1, pagination.pageSize); }}
            startIcon={<Search className="h-4 w-4" />}
            aria-label="Search projects"
          />
        </div>
        <Button
          variant={statusFilter === 'all' ? 'primary' : 'secondary'}
          onClick={() => handleTabChange('all')}
          data-testid="all-projects-btn"
        >
          All projects ({allProjectList.length})
        </Button>
        <Combobox
          options={[{ value: '', label: 'All contacts' }, ...contactComboboxOptions]}
          value={contactFilter ?? ''}
          onChange={(val) => { setContactFilter(val || null); pagination.onChange(1, pagination.pageSize); }}
          placeholder="Contact"
          data-testid="contact-filter"
          className="w-48"
        />
      </div>

      <ProjectList
        projects={pagination.pageData}
        onProjectClick={(projectId) => navigate({ to: '/projects/$projectId', params: { projectId } })}
      />

      {pagination.total > 0 && (
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onChange={pagination.onChange}
          className="mt-4 border-t border-[#e5e7eb]"
        />
      )}

    </PageContainer>
  );
}

/* ─── ProjectDetailPage ─── */

interface ProjectDetailPageProps {
  projectId?: string;
}

export function ProjectDetailPage({ projectId: projectIdProp }: ProjectDetailPageProps) {
  let routeProjectId: string | undefined;
  try {
    const params = useParams({ from: '/projects/$projectId' });
    routeProjectId = params.projectId;
  } catch {
    // Not rendered under the route — use prop fallback
  }
  const projectId = projectIdProp ?? routeProjectId ?? '';
  const navigate = useNavigate();
  const [showEditForm, setShowEditForm] = useState(false);
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: timeEntries, isLoading: entriesLoading } = useTimeEntries(projectId);
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const { data: detailContactList } = useContacts();
  const detailContactOptions = useMemo(() => {
    if (!detailContactList) return [];
    return detailContactList.map((c) => ({ value: c.id, label: c.name }));
  }, [detailContactList]);

  if (projectLoading || entriesLoading) {
    return (
      <PageContainer title="Loading...">
        <div className="text-[#6b7280]" data-testid="project-detail-loading">Loading project...</div>
      </PageContainer>
    );
  }

  if (!project) {
    return (
      <PageContainer title="Project Not Found">
        <p className="text-[#6b7280]">The requested project could not be found.</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={project.name}
      breadcrumbs={[
        { label: 'Projects', href: '/projects' },
        { label: project.name },
      ]}
      actions={
        !showEditForm ? (
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setShowEditForm(true)}>
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteProject.mutate(projectId, {
                  onSuccess: () => {
                    showToast('success', 'Project deleted');
                    navigate({ to: '/projects' });
                  },
                  onError: (err: Error) => showToast('error', err.message || 'Failed to delete project'),
                });
              }}
            >
              Delete
            </Button>
          </div>
        ) : undefined
      }
    >
      {showEditForm ? (
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg border border-[#e5e7eb] bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-[#1a1a2e]">Edit Project</h2>
            <ProjectForm
              open={false}
              onClose={() => setShowEditForm(false)}
              project={project}
              contacts={detailContactOptions}
              mode="inline"
              onSubmit={(values) => {
                updateProject.mutate(
                  { id: projectId, data: values },
                  {
                    onSuccess: () => {
                      showToast('success', 'Project updated');
                      setShowEditForm(false);
                    },
                    onError: (error: Error) => {
                      showToast('error', error.message || 'Failed to update project');
                    },
                  },
                );
              }}
            />
          </div>
        </div>
      ) : (
        <ProjectDetail project={project} timeEntries={timeEntries ?? []} projectId={projectId} />
      )}
    </PageContainer>
  );
}

/* ─── TimeEntriesPage ─── */

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeekDates(baseDate: Date): Date[] {
  const day = baseDate.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Adjust to start from Monday
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' });
}

export function TimeEntriesPage() {
  const [showForm, setShowForm] = useState(false);
  const [projectFilter, setProjectFilter] = useState('');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const { data: allProjects, isLoading: projectsLoading } = useProjects();
  const { data: timeEntries, isLoading: entriesLoading } = useTimeEntries(projectFilter || undefined);
  const createTimeEntry = useCreateTimeEntry();
  const deleteTimeEntry = useDeleteTimeEntry();

  const weekDates = getWeekDates(new Date());

  if (projectsLoading || entriesLoading) {
    return (
      <PageContainer
        title="Time Entries"
        breadcrumbs={[
          { label: 'Projects', href: '/projects' },
          { label: 'Time Entries' },
        ]}
      >
        <div className="text-[#6b7280]" data-testid="time-entries-loading">Loading time entries...</div>
      </PageContainer>
    );
  }

  const projects = allProjects ?? [];
  const entries = timeEntries ?? [];

  // Group entries by day of week
  const entriesByDay: Record<number, typeof entries> = {};
  for (const entry of entries) {
    const entryDate = new Date(entry.date);
    const dayOfWeek = entryDate.getDay();
    const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Mon=0, Sun=6
    if (!entriesByDay[adjustedDay]) entriesByDay[adjustedDay] = [];
    entriesByDay[adjustedDay].push(entry);
  }

  const dayTotals = DAYS_OF_WEEK.map((_, idx) => {
    const dayEntries = entriesByDay[idx] ?? [];
    return dayEntries.reduce((sum, e) => sum + e.duration / 60, 0);
  });

  const filteredEntries = selectedDay !== null
    ? (entriesByDay[selectedDay] ?? [])
    : entries;

  const projectFilterOptions = [
    { value: '', label: 'All Projects' },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ];

  const handleDeleteEntry = (entryId: string) => {
    deleteTimeEntry.mutate(entryId, {
      onSuccess: () => showToast('success', 'Entry deleted'),
      onError: (err: Error) => showToast('error', err.message || 'Failed to delete entry'),
    });
  };

  return (
    <PageContainer
      title="Time Entries"
      breadcrumbs={[
        { label: 'Projects', href: '/projects' },
        { label: 'Time Entries' },
      ]}
      actions={
        <div className="flex items-center gap-3">
          <Select
            selectId="te-project-filter"
            options={projectFilterOptions}
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            aria-label="Filter by project"
          />
          <Button variant="secondary" data-testid="time-timer-btn">
            <Timer className="h-4 w-4 mr-1" />
            Timer
          </Button>
          <Button onClick={() => setShowForm(true)}>Log Time</Button>
        </div>
      }
    >
      {/* Weekly calendar bar */}
      <div className="flex gap-1 mb-4 p-2 bg-gray-50 rounded-lg" data-testid="weekly-calendar">
        {DAYS_OF_WEEK.map((day, idx) => (
          <button
            key={day}
            onClick={() => setSelectedDay(selectedDay === idx ? null : idx)}
            className={`flex-1 flex flex-col items-center gap-0.5 px-2 py-2 rounded-md text-xs transition-colors ${
              selectedDay === idx
                ? 'bg-[#0078c8] text-white'
                : 'hover:bg-gray-200 text-[#1a1a2e]'
            }`}
            data-testid={`day-btn-${day.toLowerCase()}`}
          >
            <span className="font-medium">{day}</span>
            <span className="text-[10px]">{formatShortDate(weekDates[idx])}</span>
            <span className="font-semibold">{dayTotals[idx].toFixed(1)}h</span>
          </button>
        ))}
      </div>

      <TimeEntryList
        entries={filteredEntries}
        onDelete={handleDeleteEntry}
      />
      <TimeEntryForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={(values) => {
          createTimeEntry.mutate(values, {
            onSuccess: () => {
              setShowForm(false);
              showToast('success', 'Time entry added');
            },
            onError: (err: Error) => showToast('error', err.message || 'Failed to add time entry'),
          });
        }}
        projects={projects}
      />
    </PageContainer>
  );
}
