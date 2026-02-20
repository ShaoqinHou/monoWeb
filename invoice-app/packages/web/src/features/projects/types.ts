export type ProjectStatus = 'draft' | 'in_progress' | 'completed' | 'closed';

export interface Project {
  id: string;
  name: string;
  contactId?: string;
  contactName?: string;
  status: ProjectStatus;
  deadline?: string;
  budgetHours?: number;
  budgetAmount?: number;
  estimatedBudget?: number;
  usedHours?: number;
  usedAmount?: number;
  createdAt: string;
}

/** Extended project detail returned by GET /api/projects/:id */
export interface ProjectDetail extends Project {
  totalHours: number;
  totalCost: number;
  billableHours: number;
  timesheets: TimeEntry[];
}

export interface TimeEntry {
  id: string;
  projectId: string;
  projectName: string;
  taskName: string;
  staffName: string;
  date: string;
  duration: number; // minutes
  description: string;
  billable: boolean;
  hourlyRate: number;
}

export interface CreateProject {
  name: string;
  contactId?: string;
  contactName?: string;
  status: ProjectStatus;
  deadline?: string;
  budgetHours?: number;
  budgetAmount?: number;
}

export interface UpdateProject {
  name?: string;
  contactId?: string;
  contactName?: string;
  status?: ProjectStatus;
  deadline?: string;
  budgetHours?: number;
  budgetAmount?: number;
}

export interface TimeEntryFormValues {
  projectId: string;
  taskName: string;
  staffName: string;
  date: string;
  hours: number;
  minutes: number;
  description: string;
  billable: boolean;
  hourlyRate: number;
}

export interface CreateTimesheet {
  projectId: string;
  taskName: string;
  staffName: string;
  date: string;
  duration: number;
  description: string;
  billable: boolean;
  hourlyRate: number;
}

export interface UpdateTimesheet {
  taskName?: string;
  staffName?: string;
  date?: string;
  duration?: number;
  description?: string;
  billable?: boolean;
  hourlyRate?: number;
}
