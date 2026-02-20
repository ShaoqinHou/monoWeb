import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { employees } from '../db/schema';
import type { Db } from '../db/index';

export function employeeRoutes(db: Db) {
  const router = new Hono();

  // GET /api/employees
  router.get('/', async (c) => {
    const rows = await db.select().from(employees).all();
    return c.json({ ok: true, data: rows });
  });

  // GET /api/employees/summary
  router.get('/summary', async (c) => {
    const allEmployees = await db.select().from(employees).all();
    const activeCount = allEmployees.filter((e) => e.isActive).length;
    const totalSalary = allEmployees.filter((e) => e.isActive).reduce((sum, e) => sum + (e.salary ?? 0), 0);
    // Approximate YTD costs: monthly fraction of total annual salary
    const now = new Date();
    const monthsElapsed = now.getMonth() + 1;
    const ytdPayrollCosts = Math.round((totalSalary / 12) * monthsElapsed * 100) / 100;
    const totalCostLastMonth = Math.round((totalSalary / 12) * 100) / 100;
    const totalTaxLastMonth = Math.round(totalCostLastMonth * 0.22 * 100) / 100; // ~22% avg tax
    // Next pay run date: last day of current month
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const nextPayRunDate = nextMonth.toISOString().split('T')[0];
    const nextPaymentDate = nextPayRunDate;

    return c.json({
      ok: true,
      data: {
        totalEmployees: activeCount,
        ytdPayrollCosts,
        totalCostLastMonth,
        totalTaxLastMonth,
        nextPayRunDate,
        nextPaymentDate,
      },
    });
  });

  // GET /api/employees/:id
  router.get('/:id', async (c) => {
    const id = c.req.param('id');
    const row = await db.select().from(employees).where(eq(employees.id, id)).get();
    if (!row) return c.json({ ok: false, error: 'Employee not found' }, 404);
    return c.json({ ok: true, data: row });
  });

  // POST /api/employees
  router.post('/', async (c) => {
    const body = await c.req.json();
    if (!body.firstName || !body.lastName || !body.startDate) {
      return c.json({ ok: false, error: 'firstName, lastName, and startDate required' }, 400);
    }
    const id = randomUUID();
    await db.insert(employees).values({
      id,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email ?? null,
      phone: body.phone ?? null,
      position: body.position ?? null,
      department: body.department ?? null,
      startDate: body.startDate,
      endDate: body.endDate ?? null,
      salary: body.salary ?? 0,
      payFrequency: body.payFrequency ?? 'monthly',
      taxCode: body.taxCode ?? 'M',
      bankAccountNumber: body.bankAccountNumber ?? null,
      irdNumber: body.irdNumber ?? null,
      isActive: body.isActive ?? true,
    });
    const created = await db.select().from(employees).where(eq(employees.id, id)).get();
    return c.json({ ok: true, data: created }, 201);
  });

  // PUT /api/employees/:id
  router.put('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(employees).where(eq(employees.id, id)).get();
    if (!existing) return c.json({ ok: false, error: 'Employee not found' }, 404);

    const body = await c.req.json();
    await db.update(employees).set({
      firstName: body.firstName ?? existing.firstName,
      lastName: body.lastName ?? existing.lastName,
      email: body.email !== undefined ? body.email : existing.email,
      phone: body.phone !== undefined ? body.phone : existing.phone,
      position: body.position !== undefined ? body.position : existing.position,
      department: body.department !== undefined ? body.department : existing.department,
      startDate: body.startDate ?? existing.startDate,
      endDate: body.endDate !== undefined ? body.endDate : existing.endDate,
      salary: body.salary ?? existing.salary,
      payFrequency: body.payFrequency ?? existing.payFrequency,
      taxCode: body.taxCode ?? existing.taxCode,
      bankAccountNumber: body.bankAccountNumber !== undefined ? body.bankAccountNumber : existing.bankAccountNumber,
      irdNumber: body.irdNumber !== undefined ? body.irdNumber : existing.irdNumber,
      isActive: body.isActive ?? existing.isActive,
    }).where(eq(employees.id, id));

    const updated = await db.select().from(employees).where(eq(employees.id, id)).get();
    return c.json({ ok: true, data: updated });
  });

  // DELETE /api/employees/:id
  router.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(employees).where(eq(employees.id, id)).get();
    if (!existing) return c.json({ ok: false, error: 'Employee not found' }, 404);
    await db.delete(employees).where(eq(employees.id, id));
    return c.json({ ok: true, data: { id } });
  });

  return router;
}
