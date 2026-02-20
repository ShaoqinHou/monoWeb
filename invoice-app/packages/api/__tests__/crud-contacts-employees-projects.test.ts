import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createApp } from '../src/app';
import { createTestDb } from '../src/db/test-helpers';
import type { Db } from '../src/db/index';

let db: Db;
let cleanup: () => void;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  ({ db, cleanup } = createTestDb());
  app = createApp(db);
});
afterEach(() => cleanup());

function req(method: string, path: string, body?: unknown) {
  const init: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) init.body = JSON.stringify(body);
  return app.request(path, init);
}

// ---------------------------------------------------------------------------
// Contacts CRUD + Validation
// ---------------------------------------------------------------------------
describe('Contacts CRUD + Validation', () => {
  describe('POST /api/contacts', () => {
    it('creates a contact with valid data (name + type=customer) and returns 201', async () => {
      const res = await req('POST', '/api/contacts', { name: 'Acme Corp', type: 'customer' });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(typeof json.data.id).toBe('string');
      expect(json.data.name).toBe('Acme Corp');
      expect(json.data.type).toBe('customer');
      expect(json.data.outstandingBalance).toBe(0);
      expect(json.data.overdueBalance).toBe(0);
      expect(typeof json.data.createdAt).toBe('string');
      expect(typeof json.data.updatedAt).toBe('string');
    });

    it('creates a contact with all optional fields and verifies all saved', async () => {
      const full = {
        name: 'Full Contact Ltd',
        type: 'customer_and_supplier' as const,
        email: 'contact@full.co.nz',
        phone: '+64 21 555 9999',
        taxNumber: 'GST-999888',
        bankAccountName: 'Full Contact Trust',
        bankAccountNumber: '06-0123-4567890-00',
        bankBSB: '062-000',
        defaultAccountCode: '400',
        defaultTaxRate: '15',
        isArchived: false,
      };
      const res = await req('POST', '/api/contacts', full);
      expect(res.status).toBe(201);
      const { data } = await res.json();
      expect(data.name).toBe('Full Contact Ltd');
      expect(data.type).toBe('customer_and_supplier');
      expect(data.email).toBe('contact@full.co.nz');
      expect(data.phone).toBe('+64 21 555 9999');
      expect(data.taxNumber).toBe('GST-999888');
      expect(data.bankAccountName).toBe('Full Contact Trust');
      expect(data.bankAccountNumber).toBe('06-0123-4567890-00');
      expect(data.bankBSB).toBe('062-000');
      expect(data.defaultAccountCode).toBe('400');
      // defaultTaxRate might come back as string or number depending on schema
      expect(String(data.defaultTaxRate)).toBe('15');
      expect(data.outstandingBalance).toBe(0);
      expect(data.overdueBalance).toBe(0);
    });

    it('rejects contact creation with missing name and returns 400', async () => {
      const res = await req('POST', '/api/contacts', { type: 'customer' });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error).toBe('Validation failed');
      expect(json.details).toBeDefined();
    });
  });

  describe('GET /api/contacts', () => {
    it('returns empty data array when no contacts exist', async () => {
      const res = await req('GET', '/api/contacts');
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data).toEqual([]);
    });

    it('returns all created contacts in the list', async () => {
      await req('POST', '/api/contacts', { name: 'Alpha Co', type: 'customer' });
      await req('POST', '/api/contacts', { name: 'Beta Inc', type: 'supplier' });
      await req('POST', '/api/contacts', { name: 'Gamma Ltd', type: 'customer_and_supplier' });

      const res = await req('GET', '/api/contacts');
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data).toHaveLength(3);
      const names = json.data.map((c: { name: string }) => c.name);
      expect(names).toContain('Alpha Co');
      expect(names).toContain('Beta Inc');
      expect(names).toContain('Gamma Ltd');
    });
  });

  describe('GET /api/contacts/:id', () => {
    it('returns a specific contact by ID', async () => {
      const createRes = await req('POST', '/api/contacts', { name: 'Lookup Test', type: 'customer', email: 'lookup@test.com' });
      const { data: created } = await createRes.json();

      const res = await req('GET', `/api/contacts/${created.id}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.id).toBe(created.id);
      expect(json.data.name).toBe('Lookup Test');
      expect(json.data.email).toBe('lookup@test.com');
    });

    it('returns 404 for a non-existent contact ID', async () => {
      const res = await req('GET', '/api/contacts/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error).toBe('Contact not found');
    });
  });

  describe('PUT /api/contacts/:id', () => {
    it('updates contact fields and returns updated data', async () => {
      const createRes = await req('POST', '/api/contacts', { name: 'Before Update', type: 'customer', email: 'old@test.com' });
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/contacts/${created.id}`, {
        name: 'After Update',
        phone: '+64 9 555 0000',
        type: 'supplier',
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.name).toBe('After Update');
      expect(json.data.phone).toBe('+64 9 555 0000');
      expect(json.data.type).toBe('supplier');
      // Email should remain unchanged
      expect(json.data.email).toBe('old@test.com');
    });

    it('returns 404 when updating a non-existent contact', async () => {
      const res = await req('PUT', '/api/contacts/00000000-0000-0000-0000-000000000000', { name: 'Ghost' });
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error).toBe('Contact not found');
    });
  });

  describe('DELETE /api/contacts/:id', () => {
    it('deletes an existing contact and returns 200', async () => {
      const createRes = await req('POST', '/api/contacts', { name: 'Delete Me', type: 'customer' });
      const { data: created } = await createRes.json();

      const res = await req('DELETE', `/api/contacts/${created.id}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.id).toBe(created.id);
    });

    it('returns 404 when deleting a non-existent contact', async () => {
      const res = await req('DELETE', '/api/contacts/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error).toBe('Contact not found');
    });

    it('returns 404 when getting a deleted contact', async () => {
      const createRes = await req('POST', '/api/contacts', { name: 'Soon Deleted', type: 'supplier' });
      const { data: created } = await createRes.json();

      await req('DELETE', `/api/contacts/${created.id}`);

      const getRes = await req('GET', `/api/contacts/${created.id}`);
      expect(getRes.status).toBe(404);
      const json = await getRes.json();
      expect(json.ok).toBe(false);
      expect(json.error).toBe('Contact not found');
    });
  });
});

// ---------------------------------------------------------------------------
// Employees CRUD + Validation
// ---------------------------------------------------------------------------
describe('Employees CRUD + Validation', () => {
  describe('POST /api/employees', () => {
    it('creates an employee with valid required data (firstName, lastName, startDate) and returns 201', async () => {
      const res = await req('POST', '/api/employees', {
        firstName: 'Alice',
        lastName: 'Johnson',
        startDate: '2024-03-01',
      });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(typeof json.data.id).toBe('string');
      expect(json.data.firstName).toBe('Alice');
      expect(json.data.lastName).toBe('Johnson');
      expect(json.data.startDate).toBe('2024-03-01');
      // Defaults
      expect(json.data.salary).toBe(0);
      expect(json.data.payFrequency).toBe('monthly');
      expect(json.data.taxCode).toBe('M');
      expect(json.data.isActive).toBe(true);
    });

    it('creates an employee with all optional fields and verifies all saved', async () => {
      const full = {
        firstName: 'Bob',
        lastName: 'Williams',
        startDate: '2024-01-15',
        email: 'bob@company.co.nz',
        phone: '+64 27 888 1234',
        position: 'Senior Developer',
        department: 'Engineering',
        salary: 120000,
        payFrequency: 'fortnightly',
        taxCode: 'SB',
        bankAccountNumber: '12-3456-7890123-00',
        irdNumber: '012-345-678',
        endDate: '2025-12-31',
        isActive: true,
      };
      const res = await req('POST', '/api/employees', full);
      expect(res.status).toBe(201);
      const { data } = await res.json();
      expect(data.firstName).toBe('Bob');
      expect(data.lastName).toBe('Williams');
      expect(data.startDate).toBe('2024-01-15');
      expect(data.email).toBe('bob@company.co.nz');
      expect(data.phone).toBe('+64 27 888 1234');
      expect(data.position).toBe('Senior Developer');
      expect(data.department).toBe('Engineering');
      expect(data.salary).toBe(120000);
      expect(data.payFrequency).toBe('fortnightly');
      expect(data.taxCode).toBe('SB');
      expect(data.bankAccountNumber).toBe('12-3456-7890123-00');
      expect(data.irdNumber).toBe('012-345-678');
      expect(data.endDate).toBe('2025-12-31');
      expect(data.isActive).toBe(true);
    });

    it('rejects employee creation with missing firstName and returns 400', async () => {
      const res = await req('POST', '/api/employees', {
        lastName: 'NoFirst',
        startDate: '2024-01-01',
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error).toContain('firstName');
    });

    it('rejects employee creation with missing lastName and returns 400', async () => {
      const res = await req('POST', '/api/employees', {
        firstName: 'NoLast',
        startDate: '2024-01-01',
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error).toContain('lastName');
    });

    it('rejects employee creation with missing startDate and returns 400', async () => {
      const res = await req('POST', '/api/employees', {
        firstName: 'NoDate',
        lastName: 'Missing',
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error).toContain('startDate');
    });
  });

  describe('GET /api/employees', () => {
    it('returns empty data array when no employees exist', async () => {
      const res = await req('GET', '/api/employees');
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data).toEqual([]);
    });

    it('returns all created employees in the list', async () => {
      await req('POST', '/api/employees', { firstName: 'Emp1', lastName: 'A', startDate: '2024-01-01' });
      await req('POST', '/api/employees', { firstName: 'Emp2', lastName: 'B', startDate: '2024-02-01' });

      const res = await req('GET', '/api/employees');
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data).toHaveLength(2);
      const firstNames = json.data.map((e: { firstName: string }) => e.firstName);
      expect(firstNames).toContain('Emp1');
      expect(firstNames).toContain('Emp2');
    });
  });

  describe('GET /api/employees/:id', () => {
    it('returns a specific employee by ID', async () => {
      const createRes = await req('POST', '/api/employees', {
        firstName: 'Detail',
        lastName: 'Check',
        startDate: '2024-06-15',
        salary: 95000,
      });
      const { data: created } = await createRes.json();

      const res = await req('GET', `/api/employees/${created.id}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.id).toBe(created.id);
      expect(json.data.firstName).toBe('Detail');
      expect(json.data.lastName).toBe('Check');
      expect(json.data.salary).toBe(95000);
    });

    it('returns 404 for a non-existent employee ID', async () => {
      const res = await req('GET', '/api/employees/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error).toBe('Employee not found');
    });
  });

  describe('PUT /api/employees/:id', () => {
    it('updates employee fields and returns updated data', async () => {
      const createRes = await req('POST', '/api/employees', {
        firstName: 'Old',
        lastName: 'Name',
        startDate: '2024-01-01',
        salary: 70000,
        position: 'Junior',
      });
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/employees/${created.id}`, {
        salary: 85000,
        position: 'Senior Developer',
        department: 'Engineering',
        email: 'new@company.com',
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.salary).toBe(85000);
      expect(json.data.position).toBe('Senior Developer');
      expect(json.data.department).toBe('Engineering');
      expect(json.data.email).toBe('new@company.com');
      // Unchanged fields
      expect(json.data.firstName).toBe('Old');
      expect(json.data.lastName).toBe('Name');
      expect(json.data.startDate).toBe('2024-01-01');
    });

    it('returns 404 when updating a non-existent employee', async () => {
      const res = await req('PUT', '/api/employees/00000000-0000-0000-0000-000000000000', { salary: 100000 });
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error).toBe('Employee not found');
    });
  });

  describe('DELETE /api/employees/:id', () => {
    it('deletes an existing employee and returns 200', async () => {
      const createRes = await req('POST', '/api/employees', {
        firstName: 'Gone',
        lastName: 'Soon',
        startDate: '2024-01-01',
      });
      const { data: created } = await createRes.json();

      const res = await req('DELETE', `/api/employees/${created.id}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.id).toBe(created.id);
    });

    it('returns 404 when getting a deleted employee', async () => {
      const createRes = await req('POST', '/api/employees', {
        firstName: 'Deleted',
        lastName: 'Person',
        startDate: '2024-01-01',
      });
      const { data: created } = await createRes.json();

      await req('DELETE', `/api/employees/${created.id}`);

      const getRes = await req('GET', `/api/employees/${created.id}`);
      expect(getRes.status).toBe(404);
      const json = await getRes.json();
      expect(json.ok).toBe(false);
      expect(json.error).toBe('Employee not found');
    });
  });

  describe('GET /api/employees/summary', () => {
    it('returns zero summary when no employees exist', async () => {
      const res = await req('GET', '/api/employees/summary');
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.totalEmployees).toBe(0);
      expect(json.data.ytdPayrollCosts).toBe(0);
      expect(json.data.totalCostLastMonth).toBe(0);
      expect(json.data.totalTaxLastMonth).toBe(0);
      expect(typeof json.data.nextPayRunDate).toBe('string');
      expect(typeof json.data.nextPaymentDate).toBe('string');
    });

    it('returns correct summary with active employees', async () => {
      // Create two active employees with salaries
      await req('POST', '/api/employees', {
        firstName: 'Active1',
        lastName: 'A',
        startDate: '2024-01-01',
        salary: 60000,
        isActive: true,
      });
      await req('POST', '/api/employees', {
        firstName: 'Active2',
        lastName: 'B',
        startDate: '2024-01-01',
        salary: 84000,
        isActive: true,
      });
      // Create one inactive employee — should not count
      await req('POST', '/api/employees', {
        firstName: 'Inactive',
        lastName: 'C',
        startDate: '2024-01-01',
        salary: 100000,
        isActive: false,
      });

      const res = await req('GET', '/api/employees/summary');
      const json = await res.json();
      expect(json.data.totalEmployees).toBe(2);

      // Total active salary = 60000 + 84000 = 144000
      // Monthly cost = 144000 / 12 = 12000
      const totalSalary = 144000;
      const monthlyRate = totalSalary / 12;
      const now = new Date();
      const monthsElapsed = now.getMonth() + 1;
      const expectedYtd = Math.round(monthlyRate * monthsElapsed * 100) / 100;
      const expectedMonthlyCost = Math.round(monthlyRate * 100) / 100;
      const expectedTax = Math.round(expectedMonthlyCost * 0.22 * 100) / 100;

      expect(json.data.ytdPayrollCosts).toBe(expectedYtd);
      expect(json.data.totalCostLastMonth).toBe(expectedMonthlyCost);
      expect(json.data.totalTaxLastMonth).toBe(expectedTax);

      // nextPayRunDate should be last day of current month (YYYY-MM-DD format)
      expect(json.data.nextPayRunDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(json.data.nextPaymentDate).toBe(json.data.nextPayRunDate);
    });
  });
});

// ---------------------------------------------------------------------------
// Projects CRUD + Validation
// ---------------------------------------------------------------------------
describe('Projects CRUD + Validation', () => {
  describe('POST /api/projects', () => {
    it('creates a project with valid data (name) and returns 201 with default status', async () => {
      const res = await req('POST', '/api/projects', { name: 'Website Redesign' });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(typeof json.data.id).toBe('string');
      expect(json.data.name).toBe('Website Redesign');
      expect(json.data.status).toBe('in_progress');
      expect(json.data.contactId).toBeNull();
      expect(json.data.contactName).toBeNull();
      expect(json.data.deadline).toBeNull();
      expect(json.data.estimatedBudget).toBeNull();
    });

    it('creates a project with all optional fields and verifies all saved', async () => {
      // First create a contact to link
      const contactRes = await req('POST', '/api/contacts', { name: 'Project Client', type: 'customer' });
      const { data: contact } = await contactRes.json();

      const full = {
        name: 'Full Project',
        status: 'in_progress',
        contactId: contact.id,
        contactName: 'Project Client',
        deadline: '2025-06-30',
        estimatedBudget: 50000,
      };
      const res = await req('POST', '/api/projects', full);
      expect(res.status).toBe(201);
      const { data } = await res.json();
      expect(data.name).toBe('Full Project');
      expect(data.status).toBe('in_progress');
      expect(data.contactId).toBe(contact.id);
      expect(data.contactName).toBe('Project Client');
      expect(data.deadline).toBe('2025-06-30');
      expect(data.estimatedBudget).toBe(50000);
    });

    it('rejects project creation with missing name and returns 400', async () => {
      const res = await req('POST', '/api/projects', { status: 'in_progress' });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error).toBe('Project name required');
    });
  });

  describe('GET /api/projects', () => {
    it('returns empty data array when no projects exist', async () => {
      const res = await req('GET', '/api/projects');
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data).toEqual([]);
    });

    it('returns all projects with computed usedHours/usedAmount fields', async () => {
      // Create a project
      const createRes = await req('POST', '/api/projects', { name: 'Tracked Project', estimatedBudget: 10000 });
      const { data: project } = await createRes.json();

      // Add timesheet entries
      await req('POST', '/api/timesheets', {
        projectId: project.id,
        date: '2024-03-01',
        hours: 8,
        hourlyRate: 150,
        isBillable: true,
      });
      await req('POST', '/api/timesheets', {
        projectId: project.id,
        date: '2024-03-02',
        hours: 4,
        hourlyRate: 100,
        isBillable: false,
      });

      const res = await req('GET', '/api/projects');
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data).toHaveLength(1);

      const proj = json.data[0];
      expect(proj.name).toBe('Tracked Project');
      // usedHours = 8 + 4 = 12
      expect(proj.usedHours).toBe(12);
      // usedAmount = (8 * 150) + (4 * 100) = 1200 + 400 = 1600
      expect(proj.usedAmount).toBe(1600);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('returns a specific project by ID with timesheet data', async () => {
      const createRes = await req('POST', '/api/projects', { name: 'Detail Project' });
      const { data: project } = await createRes.json();

      // Add a timesheet entry
      await req('POST', '/api/timesheets', {
        projectId: project.id,
        date: '2024-04-01',
        hours: 6,
        hourlyRate: 120,
        isBillable: true,
        description: 'Backend work',
      });

      const res = await req('GET', `/api/projects/${project.id}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.id).toBe(project.id);
      expect(json.data.name).toBe('Detail Project');
      expect(json.data.timesheets).toHaveLength(1);
      expect(json.data.timesheets[0].hours).toBe(6);
      expect(json.data.totalHours).toBe(6);
      expect(json.data.totalCost).toBe(720); // 6 * 120
      expect(json.data.billableHours).toBe(6);
    });

    it('returns project with zero totals when no timesheets exist', async () => {
      const createRes = await req('POST', '/api/projects', { name: 'Empty Project' });
      const { data: project } = await createRes.json();

      const res = await req('GET', `/api/projects/${project.id}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.timesheets).toEqual([]);
      expect(json.data.totalHours).toBe(0);
      expect(json.data.totalCost).toBe(0);
      expect(json.data.billableHours).toBe(0);
    });

    it('returns 404 for a non-existent project ID', async () => {
      const res = await req('GET', '/api/projects/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error).toBe('Project not found');
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('updates project fields and returns updated data', async () => {
      const createRes = await req('POST', '/api/projects', { name: 'Original', estimatedBudget: 5000 });
      const { data: created } = await createRes.json();

      const res = await req('PUT', `/api/projects/${created.id}`, {
        name: 'Renamed',
        status: 'completed',
        deadline: '2025-12-31',
        estimatedBudget: 15000,
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.name).toBe('Renamed');
      expect(json.data.status).toBe('completed');
      expect(json.data.deadline).toBe('2025-12-31');
      expect(json.data.estimatedBudget).toBe(15000);
    });

    it('preserves unchanged fields on partial update', async () => {
      const createRes = await req('POST', '/api/projects', {
        name: 'Partial',
        status: 'in_progress',
        deadline: '2025-06-30',
        estimatedBudget: 20000,
      });
      const { data: created } = await createRes.json();

      // Only update the name
      const res = await req('PUT', `/api/projects/${created.id}`, { name: 'Partial Updated' });
      const json = await res.json();
      expect(json.data.name).toBe('Partial Updated');
      expect(json.data.status).toBe('in_progress'); // unchanged
      expect(json.data.deadline).toBe('2025-06-30'); // unchanged
      expect(json.data.estimatedBudget).toBe(20000); // unchanged
    });

    it('returns 404 when updating a non-existent project', async () => {
      const res = await req('PUT', '/api/projects/00000000-0000-0000-0000-000000000000', { name: 'Ghost' });
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error).toBe('Project not found');
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('deletes an existing project and returns 200', async () => {
      const createRes = await req('POST', '/api/projects', { name: 'Delete Me' });
      const { data: created } = await createRes.json();

      const res = await req('DELETE', `/api/projects/${created.id}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.id).toBe(created.id);
    });

    it('returns 404 when deleting a non-existent project', async () => {
      const res = await req('DELETE', '/api/projects/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error).toBe('Project not found');
    });

    it('returns 404 when getting a deleted project', async () => {
      const createRes = await req('POST', '/api/projects', { name: 'Soon Gone' });
      const { data: created } = await createRes.json();

      await req('DELETE', `/api/projects/${created.id}`);

      const getRes = await req('GET', `/api/projects/${created.id}`);
      expect(getRes.status).toBe(404);
      const json = await getRes.json();
      expect(json.ok).toBe(false);
      expect(json.error).toBe('Project not found');
    });
  });
});
