import { Hono } from 'hono';
import { eq, and, gte, lte } from 'drizzle-orm';
import { employees, payRuns, payslips, leaveRequests } from '../db/schema';
import type { Db } from '../db/index';

export function payrollSettingRoutes(db: Db) {
  const router = new Hono();

  // GET /kiwisaver/:employeeId — return employee's KiwiSaver rates
  router.get('/kiwisaver/:employeeId', async (c) => {
    const employeeId = c.req.param('employeeId');
    const emp = await db.select().from(employees).where(eq(employees.id, employeeId)).get();
    if (!emp) {
      return c.json({ ok: false, error: 'Employee not found' }, 404);
    }
    return c.json({
      ok: true,
      data: {
        employeeId: emp.id,
        kiwiSaverRate: emp.kiwiSaverRate ?? 3,
        kiwiSaverEmployerRate: emp.kiwiSaverEmployerRate ?? 3,
      },
    });
  });

  // PUT /kiwisaver/:employeeId — update KiwiSaver rates
  router.put('/kiwisaver/:employeeId', async (c) => {
    const employeeId = c.req.param('employeeId');
    const emp = await db.select().from(employees).where(eq(employees.id, employeeId)).get();
    if (!emp) {
      return c.json({ ok: false, error: 'Employee not found' }, 404);
    }

    const body = await c.req.json();
    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };

    if (body.kiwiSaverRate !== undefined) updates.kiwiSaverRate = body.kiwiSaverRate;
    if (body.kiwiSaverEmployerRate !== undefined) updates.kiwiSaverEmployerRate = body.kiwiSaverEmployerRate;

    await db.update(employees).set(updates).where(eq(employees.id, employeeId));
    const updated = await db.select().from(employees).where(eq(employees.id, employeeId)).get();

    return c.json({
      ok: true,
      data: {
        employeeId: updated!.id,
        kiwiSaverRate: updated!.kiwiSaverRate ?? 3,
        kiwiSaverEmployerRate: updated!.kiwiSaverEmployerRate ?? 3,
      },
    });
  });

  // GET /split-payments/:employeeId — return parsed splitPaymentConfig
  router.get('/split-payments/:employeeId', async (c) => {
    const employeeId = c.req.param('employeeId');
    const emp = await db.select().from(employees).where(eq(employees.id, employeeId)).get();
    if (!emp) {
      return c.json({ ok: false, error: 'Employee not found' }, 404);
    }

    let config: unknown = null;
    if (emp.splitPaymentConfig) {
      try {
        config = JSON.parse(emp.splitPaymentConfig);
      } catch {
        config = null;
      }
    }

    return c.json({ ok: true, data: { employeeId: emp.id, splitPaymentConfig: config } });
  });

  // PUT /split-payments/:employeeId — update splitPaymentConfig
  router.put('/split-payments/:employeeId', async (c) => {
    const employeeId = c.req.param('employeeId');
    const emp = await db.select().from(employees).where(eq(employees.id, employeeId)).get();
    if (!emp) {
      return c.json({ ok: false, error: 'Employee not found' }, 404);
    }

    const body = await c.req.json();
    if (body.splitPaymentConfig === undefined) {
      return c.json({ ok: false, error: 'splitPaymentConfig is required' }, 400);
    }

    const configStr = typeof body.splitPaymentConfig === 'string'
      ? body.splitPaymentConfig
      : JSON.stringify(body.splitPaymentConfig);

    await db.update(employees).set({
      splitPaymentConfig: configStr,
      updatedAt: new Date().toISOString(),
    }).where(eq(employees.id, employeeId));

    const updated = await db.select().from(employees).where(eq(employees.id, employeeId)).get();
    let config: unknown = null;
    if (updated!.splitPaymentConfig) {
      try {
        config = JSON.parse(updated!.splitPaymentConfig);
      } catch {
        config = null;
      }
    }

    return c.json({ ok: true, data: { employeeId: updated!.id, splitPaymentConfig: config } });
  });

  // GET /year-end-summary — compute totals from payRuns for a tax year
  // Tax year param: e.g. 2026 means Apr 2025 - Mar 2026
  router.get('/year-end-summary', async (c) => {
    const taxYearStr = c.req.query('taxYear');
    if (!taxYearStr) {
      return c.json({ ok: false, error: 'taxYear query param is required' }, 400);
    }

    const taxYear = parseInt(taxYearStr, 10);
    if (isNaN(taxYear)) {
      return c.json({ ok: false, error: 'taxYear must be a number' }, 400);
    }

    // NZ tax year: April (taxYear-1) to March (taxYear)
    const startDate = `${taxYear - 1}-04-01`;
    const endDate = `${taxYear}-03-31`;

    const runs = await db.select().from(payRuns)
      .where(and(
        gte(payRuns.payDate, startDate),
        lte(payRuns.payDate, endDate),
      ))
      .all();

    // Aggregate per-employee from payslips across all pay runs in the tax year
    const empTotals = new Map<string, { grossPay: number; paye: number; kiwiSaverEmployee: number; kiwiSaverEmployer: number; netPay: number }>();

    for (const run of runs) {
      const slips = await db.select().from(payslips)
        .where(eq(payslips.payRunId, run.id))
        .all();
      for (const slip of slips) {
        const existing = empTotals.get(slip.employeeId) ?? { grossPay: 0, paye: 0, kiwiSaverEmployee: 0, kiwiSaverEmployer: 0, netPay: 0 };
        existing.grossPay += slip.grossPay;
        existing.paye += slip.paye;
        existing.kiwiSaverEmployee += slip.kiwiSaverEmployee;
        existing.kiwiSaverEmployer += slip.kiwiSaverEmployer;
        existing.netPay += slip.netPay;
        empTotals.set(slip.employeeId, existing);
      }
    }

    // Build per-employee array with names
    const employeeList = [];
    const totals = { grossPay: 0, paye: 0, kiwiSaverEmployee: 0, kiwiSaverEmployer: 0, studentLoan: 0, netPay: 0 };
    for (const [empId, sums] of empTotals) {
      const emp = await db.select().from(employees).where(eq(employees.id, empId)).get();
      const entry = {
        employeeId: empId,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown',
        grossPay: Math.round(sums.grossPay * 100) / 100,
        paye: Math.round(sums.paye * 100) / 100,
        kiwiSaverEmployee: Math.round(sums.kiwiSaverEmployee * 100) / 100,
        kiwiSaverEmployer: Math.round(sums.kiwiSaverEmployer * 100) / 100,
        studentLoan: 0,
        netPay: Math.round(sums.netPay * 100) / 100,
      };
      employeeList.push(entry);
      totals.grossPay += entry.grossPay;
      totals.paye += entry.paye;
      totals.kiwiSaverEmployee += entry.kiwiSaverEmployee;
      totals.kiwiSaverEmployer += entry.kiwiSaverEmployer;
      totals.netPay += entry.netPay;
    }

    // Round totals
    totals.grossPay = Math.round(totals.grossPay * 100) / 100;
    totals.paye = Math.round(totals.paye * 100) / 100;
    totals.kiwiSaverEmployee = Math.round(totals.kiwiSaverEmployee * 100) / 100;
    totals.kiwiSaverEmployer = Math.round(totals.kiwiSaverEmployer * 100) / 100;
    totals.netPay = Math.round(totals.netPay * 100) / 100;

    return c.json({
      ok: true,
      data: {
        taxYear: String(taxYear),
        employees: employeeList,
        totals,
      },
    });
  });

  // GET /reports/:type — payroll reports
  // Query params: start, end
  // Types: payroll-activity, employee-details, leave-balances, kiwisaver, paye-summary
  router.get('/reports/:type', async (c) => {
    const type = c.req.param('type');
    const start = c.req.query('start');
    const end = c.req.query('end');

    const validTypes = ['payroll-activity', 'employee-details', 'leave-balances', 'kiwisaver', 'paye-summary'];
    if (!validTypes.includes(type)) {
      return c.json({ ok: false, error: `Invalid report type. Must be one of: ${validTypes.join(', ')}` }, 400);
    }

    if (!start || !end) {
      return c.json({ ok: false, error: 'start and end query params are required' }, 400);
    }

    switch (type) {
      case 'payroll-activity': {
        const runs = await db.select().from(payRuns)
          .where(and(gte(payRuns.payDate, start), lte(payRuns.payDate, end)))
          .all();

        const runData = [];
        for (const run of runs) {
          const slips = await db.select().from(payslips).where(eq(payslips.payRunId, run.id)).all();
          runData.push({ ...run, payslips: slips });
        }

        return c.json({ ok: true, data: { type, start, end, payRuns: runData } });
      }

      case 'employee-details': {
        const allEmployees = await db.select().from(employees).all();
        return c.json({ ok: true, data: { type, start, end, employees: allEmployees } });
      }

      case 'leave-balances': {
        const allEmployees = await db.select().from(employees).all();
        const result = [];

        for (const emp of allEmployees) {
          const leaves = await db.select().from(leaveRequests)
            .where(and(
              eq(leaveRequests.employeeId, emp.id),
              gte(leaveRequests.startDate, start),
              lte(leaveRequests.endDate, end),
            ))
            .all();

          const totalHours = leaves
            .filter((l) => l.status === 'approved')
            .reduce((sum, l) => sum + l.hours, 0);

          result.push({
            employeeId: emp.id,
            employeeName: `${emp.firstName} ${emp.lastName}`,
            totalApprovedLeaveHours: totalHours,
            leaveRequests: leaves,
          });
        }

        return c.json({ ok: true, data: { type, start, end, employees: result } });
      }

      case 'kiwisaver': {
        const allEmployees = await db.select().from(employees).all();
        const result = [];

        for (const emp of allEmployees) {
          // Get all payslips in date range for this employee
          const runs = await db.select().from(payRuns)
            .where(and(gte(payRuns.payDate, start), lte(payRuns.payDate, end)))
            .all();

          let totalEmployee = 0;
          let totalEmployer = 0;

          for (const run of runs) {
            const slips = await db.select().from(payslips)
              .where(and(
                eq(payslips.payRunId, run.id),
                eq(payslips.employeeId, emp.id),
              ))
              .all();

            for (const slip of slips) {
              totalEmployee += slip.kiwiSaverEmployee;
              totalEmployer += slip.kiwiSaverEmployer;
            }
          }

          result.push({
            employeeId: emp.id,
            employeeName: `${emp.firstName} ${emp.lastName}`,
            kiwiSaverRate: emp.kiwiSaverRate ?? 3,
            kiwiSaverEmployerRate: emp.kiwiSaverEmployerRate ?? 3,
            totalEmployeeContributions: totalEmployee,
            totalEmployerContributions: totalEmployer,
          });
        }

        return c.json({ ok: true, data: { type, start, end, employees: result } });
      }

      case 'paye-summary': {
        const runs = await db.select().from(payRuns)
          .where(and(gte(payRuns.payDate, start), lte(payRuns.payDate, end)))
          .all();

        let totalGross = 0;
        let totalPaye = 0;
        let totalKiwiSaverEmployee = 0;
        let totalKiwiSaverEmployer = 0;
        let totalNet = 0;

        for (const run of runs) {
          totalGross += run.totalGross;
          totalNet += run.totalNet;

          const slips = await db.select().from(payslips).where(eq(payslips.payRunId, run.id)).all();
          for (const slip of slips) {
            totalPaye += slip.paye;
            totalKiwiSaverEmployee += slip.kiwiSaverEmployee;
            totalKiwiSaverEmployer += slip.kiwiSaverEmployer;
          }
        }

        return c.json({
          ok: true,
          data: {
            type,
            start,
            end,
            totalGross,
            totalPaye,
            totalKiwiSaverEmployee,
            totalKiwiSaverEmployer,
            totalNet,
            payRunCount: runs.length,
          },
        });
      }

      default:
        return c.json({ ok: false, error: 'Unknown report type' }, 400);
    }
  });

  return router;
}
