import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { payRuns, payslips, employees } from '../db/schema';
import type { Db } from '../db/index';

/** Simple NZ PAYE calculation (approximate brackets for demo) */
function calculatePaye(annualSalary: number): number {
  let tax = 0;
  const brackets = [
    { limit: 14000, rate: 0.105 },
    { limit: 48000, rate: 0.175 },
    { limit: 70000, rate: 0.30 },
    { limit: 180000, rate: 0.33 },
    { limit: Infinity, rate: 0.39 },
  ];
  let remaining = annualSalary;
  let prev = 0;
  for (const b of brackets) {
    const taxable = Math.min(remaining, b.limit - prev);
    if (taxable <= 0) break;
    tax += taxable * b.rate;
    remaining -= taxable;
    prev = b.limit;
  }
  return tax;
}

export function payRunRoutes(db: Db) {
  const router = new Hono();

  // GET /api/pay-runs
  router.get('/', async (c) => {
    const rows = await db.select().from(payRuns).all();
    // Enrich with employee data from payslips
    const enriched = [];
    for (const run of rows) {
      const slips = await db.select().from(payslips).where(eq(payslips.payRunId, run.id)).all();
      const empList = [];
      for (const slip of slips) {
        const emp = await db.select().from(employees).where(eq(employees.id, slip.employeeId)).get();
        empList.push({
          employeeId: slip.employeeId,
          employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown',
          gross: slip.grossPay,
          tax: slip.paye,
          net: slip.netPay,
        });
      }
      enriched.push({
        id: run.id,
        periodStart: run.payPeriodStart,
        periodEnd: run.payPeriodEnd,
        payDate: run.payDate,
        status: run.status,
        employees: empList,
        totalGross: run.totalGross,
        totalTax: run.totalTax,
        totalNet: run.totalNet,
      });
    }
    return c.json({ ok: true, data: enriched });
  });

  // GET /api/pay-runs/:id (includes payslips and employees)
  router.get('/:id', async (c) => {
    const id = c.req.param('id');
    const run = await db.select().from(payRuns).where(eq(payRuns.id, id)).get();
    if (!run) return c.json({ ok: false, error: 'Pay run not found' }, 404);
    const slips = await db.select().from(payslips).where(eq(payslips.payRunId, id)).all();
    const empList = [];
    for (const slip of slips) {
      const emp = await db.select().from(employees).where(eq(employees.id, slip.employeeId)).get();
      empList.push({
        employeeId: slip.employeeId,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown',
        gross: slip.grossPay,
        tax: slip.paye,
        net: slip.netPay,
      });
    }
    return c.json({
      ok: true,
      data: {
        id: run.id,
        periodStart: run.payPeriodStart,
        periodEnd: run.payPeriodEnd,
        payDate: run.payDate,
        status: run.status,
        employees: empList,
        payslips: slips,
        totalGross: run.totalGross,
        totalTax: run.totalTax,
        totalNet: run.totalNet,
      },
    });
  });

  // POST /api/pay-runs — create a pay run and auto-generate payslips
  router.post('/', async (c) => {
    const body = await c.req.json();
    if (!body.payPeriodStart || !body.payPeriodEnd || !body.payDate) {
      return c.json({ ok: false, error: 'payPeriodStart, payPeriodEnd, payDate required' }, 400);
    }

    // Get employees to include
    const employeeIds: string[] = body.employeeIds ?? [];
    let emps;
    if (employeeIds.length > 0) {
      emps = [];
      for (const eid of employeeIds) {
        const emp = await db.select().from(employees).where(eq(employees.id, eid)).get();
        if (emp && emp.isActive) emps.push(emp);
      }
    } else {
      emps = await db.select().from(employees).where(eq(employees.isActive, true)).all();
    }

    if (emps.length === 0) {
      return c.json({ ok: false, error: 'No active employees found' }, 400);
    }

    // Calculate pay period fraction
    const freq = emps[0]?.payFrequency ?? 'monthly';
    const periodsPerYear = freq === 'weekly' ? 52 : freq === 'fortnightly' ? 26 : 12;

    const runId = randomUUID();
    let totalGross = 0;
    let totalTax = 0;
    let totalNet = 0;

    const slipValues = emps.map((emp) => {
      const grossPay = Math.round((emp.salary / periodsPerYear) * 100) / 100;
      const annualPaye = calculatePaye(emp.salary);
      const paye = Math.round((annualPaye / periodsPerYear) * 100) / 100;
      const ksEmployee = Math.round(grossPay * 0.03 * 100) / 100;
      const ksEmployer = Math.round(grossPay * 0.03 * 100) / 100;
      const netPay = Math.round((grossPay - paye - ksEmployee) * 100) / 100;

      totalGross += grossPay;
      totalTax += paye;
      totalNet += netPay;

      return {
        id: randomUUID(),
        payRunId: runId,
        employeeId: emp.id,
        grossPay,
        paye,
        kiwiSaverEmployee: ksEmployee,
        kiwiSaverEmployer: ksEmployer,
        netPay,
      };
    });

    totalGross = Math.round(totalGross * 100) / 100;
    totalTax = Math.round(totalTax * 100) / 100;
    totalNet = Math.round(totalNet * 100) / 100;

    await db.insert(payRuns).values({
      id: runId,
      payPeriodStart: body.payPeriodStart,
      payPeriodEnd: body.payPeriodEnd,
      payDate: body.payDate,
      status: 'draft',
      totalGross,
      totalTax,
      totalNet,
    });

    for (const slip of slipValues) {
      await db.insert(payslips).values(slip);
    }

    const created = await db.select().from(payRuns).where(eq(payRuns.id, runId)).get();
    return c.json({ ok: true, data: { ...created, payslips: slipValues } }, 201);
  });

  // PUT /api/pay-runs/:id/post — post a draft pay run
  router.put('/:id/post', async (c) => {
    const id = c.req.param('id');
    const run = await db.select().from(payRuns).where(eq(payRuns.id, id)).get();
    if (!run) return c.json({ ok: false, error: 'Pay run not found' }, 404);
    if (run.status === 'posted') return c.json({ ok: false, error: 'Already posted' }, 400);

    await db.update(payRuns).set({ status: 'posted' }).where(eq(payRuns.id, id));
    const updated = await db.select().from(payRuns).where(eq(payRuns.id, id)).get();
    const slips = await db.select().from(payslips).where(eq(payslips.payRunId, id)).all();
    return c.json({ ok: true, data: { ...updated, payslips: slips } });
  });

  return router;
}
