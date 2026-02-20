import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createApp } from '../src/app';
import { createTestDb } from '../src/db/test-helpers';
import { employees, payRuns, payslips, leaveRequests } from '../src/db/schema';
import type { Db } from '../src/db/index';

let db: Db;
let cleanup: () => void;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  const t = createTestDb();
  db = t.db;
  cleanup = t.cleanup;
  app = createApp(db);
});

afterEach(() => {
  cleanup();
});

function req(method: string, path: string, body?: unknown) {
  const init: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) init.body = JSON.stringify(body);
  return app.request(path, init);
}

async function seedEmployee(id: string = 'emp-1') {
  await db.insert(employees).values({
    id,
    firstName: 'John',
    lastName: 'Doe',
    startDate: '2024-01-01',
    salary: 60000,
    taxCode: 'M',
  });
}

async function seedPayRun(payDate: string, empId: string = 'emp-1') {
  const runId = `run-${payDate}`;
  await db.insert(payRuns).values({
    id: runId,
    payPeriodStart: payDate,
    payPeriodEnd: payDate,
    payDate,
    status: 'posted',
    totalGross: 5000,
    totalTax: 1000,
    totalNet: 4000,
  });
  await db.insert(payslips).values({
    id: `slip-${payDate}-${empId}`,
    payRunId: runId,
    employeeId: empId,
    grossPay: 5000,
    paye: 1000,
    kiwiSaverEmployee: 150,
    kiwiSaverEmployer: 150,
    netPay: 3850,
  });
  return runId;
}

describe('Payroll Settings API', () => {
  describe('GET /api/payroll-settings/kiwisaver/:employeeId', () => {
    it('returns employee KiwiSaver rates', async () => {
      await seedEmployee();
      const res = await req('GET', '/api/payroll-settings/kiwisaver/emp-1');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.employeeId).toBe('emp-1');
      expect(body.data.kiwiSaverRate).toBe(3);
      expect(body.data.kiwiSaverEmployerRate).toBe(3);
    });

    it('returns 404 for non-existent employee', async () => {
      const res = await req('GET', '/api/payroll-settings/kiwisaver/nonexistent');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/payroll-settings/kiwisaver/:employeeId', () => {
    it('updates KiwiSaver rates', async () => {
      await seedEmployee();
      const res = await req('PUT', '/api/payroll-settings/kiwisaver/emp-1', {
        kiwiSaverRate: 4,
        kiwiSaverEmployerRate: 3,
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.kiwiSaverRate).toBe(4);
      expect(body.data.kiwiSaverEmployerRate).toBe(3);
    });

    it('returns 404 for non-existent employee', async () => {
      const res = await req('PUT', '/api/payroll-settings/kiwisaver/nonexistent', { kiwiSaverRate: 6 });
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/payroll-settings/split-payments/:employeeId', () => {
    it('returns null for employee with no config', async () => {
      await seedEmployee();
      const res = await req('GET', '/api/payroll-settings/split-payments/emp-1');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.splitPaymentConfig).toBeNull();
    });

    it('returns 404 for non-existent employee', async () => {
      const res = await req('GET', '/api/payroll-settings/split-payments/nonexistent');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/payroll-settings/split-payments/:employeeId', () => {
    it('sets split payment config', async () => {
      await seedEmployee();
      const config = [
        { accountNumber: '12-3456-7890123-00', percentage: 50 },
        { accountNumber: '12-3456-7890124-00', percentage: 50 },
      ];
      const res = await req('PUT', '/api/payroll-settings/split-payments/emp-1', { splitPaymentConfig: config });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.splitPaymentConfig).toEqual(config);
    });

    it('returns 404 for non-existent employee', async () => {
      const res = await req('PUT', '/api/payroll-settings/split-payments/nonexistent', { splitPaymentConfig: [] });
      expect(res.status).toBe(404);
    });

    it('requires splitPaymentConfig field', async () => {
      await seedEmployee();
      const res = await req('PUT', '/api/payroll-settings/split-payments/emp-1', {});
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/payroll-settings/year-end-summary', () => {
    it('returns totals for a tax year', async () => {
      await seedEmployee();
      // Tax year 2026: Apr 2025 - Mar 2026
      await seedPayRun('2025-06-15');
      await seedPayRun('2025-12-15');

      const res = await req('GET', '/api/payroll-settings/year-end-summary?taxYear=2026');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.taxYear).toBe('2026');
      expect(body.data.employees).toHaveLength(1);
      expect(body.data.employees[0].employeeId).toBe('emp-1');
      expect(body.data.employees[0].grossPay).toBe(10000);
      expect(body.data.employees[0].paye).toBe(2000);
      expect(body.data.employees[0].netPay).toBe(7700);
      expect(body.data.employees[0].kiwiSaverEmployee).toBe(300);
      expect(body.data.employees[0].kiwiSaverEmployer).toBe(300);
      expect(body.data.totals.grossPay).toBe(10000);
      expect(body.data.totals.paye).toBe(2000);
    });

    it('returns zeros when no pay runs in range', async () => {
      const res = await req('GET', '/api/payroll-settings/year-end-summary?taxYear=2020');
      const body = await res.json();
      expect(body.data.employees).toHaveLength(0);
      expect(body.data.totals.grossPay).toBe(0);
    });

    it('requires taxYear param', async () => {
      const res = await req('GET', '/api/payroll-settings/year-end-summary');
      expect(res.status).toBe(400);
    });

    it('rejects non-numeric taxYear', async () => {
      const res = await req('GET', '/api/payroll-settings/year-end-summary?taxYear=abc');
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/payroll-settings/reports/:type', () => {
    it('returns payroll-activity report', async () => {
      await seedEmployee();
      await seedPayRun('2025-06-15');

      const res = await req('GET', '/api/payroll-settings/reports/payroll-activity?start=2025-01-01&end=2025-12-31');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.type).toBe('payroll-activity');
      expect(body.data.payRuns).toHaveLength(1);
      expect(body.data.payRuns[0].payslips).toHaveLength(1);
    });

    it('returns employee-details report', async () => {
      await seedEmployee();
      const res = await req('GET', '/api/payroll-settings/reports/employee-details?start=2025-01-01&end=2025-12-31');
      const body = await res.json();
      expect(body.data.type).toBe('employee-details');
      expect(body.data.employees).toHaveLength(1);
      expect(body.data.employees[0].firstName).toBe('John');
    });

    it('returns leave-balances report', async () => {
      await seedEmployee();
      await db.insert(leaveRequests).values({
        id: 'lr-1',
        employeeId: 'emp-1',
        leaveType: 'annual',
        startDate: '2025-06-01',
        endDate: '2025-06-05',
        hours: 40,
        status: 'approved',
      });

      const res = await req('GET', '/api/payroll-settings/reports/leave-balances?start=2025-01-01&end=2025-12-31');
      const body = await res.json();
      expect(body.data.type).toBe('leave-balances');
      expect(body.data.employees).toHaveLength(1);
      expect(body.data.employees[0].totalApprovedLeaveHours).toBe(40);
    });

    it('returns kiwisaver report', async () => {
      await seedEmployee();
      await seedPayRun('2025-06-15');

      const res = await req('GET', '/api/payroll-settings/reports/kiwisaver?start=2025-01-01&end=2025-12-31');
      const body = await res.json();
      expect(body.data.type).toBe('kiwisaver');
      expect(body.data.employees).toHaveLength(1);
      expect(body.data.employees[0].totalEmployeeContributions).toBe(150);
      expect(body.data.employees[0].totalEmployerContributions).toBe(150);
    });

    it('returns paye-summary report', async () => {
      await seedEmployee();
      await seedPayRun('2025-06-15');

      const res = await req('GET', '/api/payroll-settings/reports/paye-summary?start=2025-01-01&end=2025-12-31');
      const body = await res.json();
      expect(body.data.type).toBe('paye-summary');
      expect(body.data.totalGross).toBe(5000);
      expect(body.data.totalPaye).toBe(1000);
    });

    it('rejects invalid report type', async () => {
      const res = await req('GET', '/api/payroll-settings/reports/invalid-type?start=2025-01-01&end=2025-12-31');
      expect(res.status).toBe(400);
    });

    it('requires start and end params', async () => {
      const res = await req('GET', '/api/payroll-settings/reports/payroll-activity');
      expect(res.status).toBe(400);
    });

    it('requires end param', async () => {
      const res = await req('GET', '/api/payroll-settings/reports/payroll-activity?start=2025-01-01');
      expect(res.status).toBe(400);
    });
  });
});
