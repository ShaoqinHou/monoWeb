import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { projects, timesheets, projectExpenses, invoices, lineItems, contacts } from '../db/schema';
import type { Db } from '../db/index';

export function projectRoutes(db: Db) {
  const router = new Hono();

  // GET /api/projects
  router.get('/', async (c) => {
    const rows = await db.select().from(projects).all();
    // Compute usedHours/usedAmount from timesheets for each project
    const allSheets = await db.select().from(timesheets).all();
    const sheetsByProject = new Map<string, typeof allSheets>();
    for (const s of allSheets) {
      const arr = sheetsByProject.get(s.projectId) ?? [];
      arr.push(s);
      sheetsByProject.set(s.projectId, arr);
    }
    const enriched = rows.map((p) => {
      const sheets = sheetsByProject.get(p.id) ?? [];
      const usedHours = Math.round(sheets.reduce((s, t) => s + t.hours, 0) * 100) / 100;
      const usedAmount = Math.round(sheets.reduce((s, t) => s + t.hours * t.hourlyRate, 0) * 100) / 100;
      return {
        ...p,
        usedHours,
        usedAmount,
        budgetAmount: p.estimatedBudget ?? undefined,
      };
    });
    return c.json({ ok: true, data: enriched });
  });

  // GET /api/projects/:id (includes timesheet summary)
  router.get('/:id', async (c) => {
    const id = c.req.param('id');
    const project = await db.select().from(projects).where(eq(projects.id, id)).get();
    if (!project) return c.json({ ok: false, error: 'Project not found' }, 404);

    const sheets = await db.select().from(timesheets).where(eq(timesheets.projectId, id)).all();
    const totalHours = sheets.reduce((s, t) => s + t.hours, 0);
    const totalCost = sheets.reduce((s, t) => s + t.hours * t.hourlyRate, 0);
    const billableHours = sheets.filter((t) => t.isBillable).reduce((s, t) => s + t.hours, 0);

    return c.json({
      ok: true,
      data: {
        ...project,
        timesheets: sheets,
        totalHours: Math.round(totalHours * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        billableHours: Math.round(billableHours * 100) / 100,
      },
    });
  });

  // POST /api/projects
  router.post('/', async (c) => {
    const body = await c.req.json();
    if (!body.name) return c.json({ ok: false, error: 'Project name required' }, 400);

    const id = randomUUID();
    await db.insert(projects).values({
      id,
      name: body.name,
      contactId: body.contactId ?? null,
      contactName: body.contactName ?? null,
      status: body.status ?? 'in_progress',
      deadline: body.deadline ?? null,
      estimatedBudget: body.estimatedBudget ?? null,
    });
    const created = await db.select().from(projects).where(eq(projects.id, id)).get();
    return c.json({ ok: true, data: created }, 201);
  });

  // PUT /api/projects/:id
  router.put('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(projects).where(eq(projects.id, id)).get();
    if (!existing) return c.json({ ok: false, error: 'Project not found' }, 404);

    const body = await c.req.json();
    await db.update(projects).set({
      name: body.name ?? existing.name,
      contactId: body.contactId !== undefined ? body.contactId : existing.contactId,
      contactName: body.contactName !== undefined ? body.contactName : existing.contactName,
      status: body.status ?? existing.status,
      deadline: body.deadline !== undefined ? body.deadline : existing.deadline,
      estimatedBudget: body.estimatedBudget !== undefined ? body.estimatedBudget : existing.estimatedBudget,
    }).where(eq(projects.id, id));

    const updated = await db.select().from(projects).where(eq(projects.id, id)).get();
    return c.json({ ok: true, data: updated });
  });

  // GET /api/projects/:id/unbilled — fetch unbilled time entries and expenses
  router.get('/:id/unbilled', async (c) => {
    const id = c.req.param('id');
    const project = await db.select().from(projects).where(eq(projects.id, id)).get();
    if (!project) return c.json({ ok: false, error: 'Project not found' }, 404);

    const unbilledTime = await db.select().from(timesheets)
      .where(and(eq(timesheets.projectId, id), eq(timesheets.isInvoiced, false)))
      .all();

    const unbilledExpenses = await db.select().from(projectExpenses)
      .where(and(eq(projectExpenses.projectId, id), eq(projectExpenses.isInvoiced, false)))
      .all();

    const timeEntryItems = unbilledTime.map((t) => ({
      id: t.id,
      date: t.date,
      hours: t.hours,
      hourlyRate: t.hourlyRate,
      description: t.description,
      amount: Math.round(t.hours * t.hourlyRate * 100) / 100,
    }));

    const expenseItems = unbilledExpenses.map((e) => ({
      id: e.id,
      date: e.date,
      description: e.description,
      amount: e.amount,
      category: e.category,
    }));

    const totalUnbilled =
      timeEntryItems.reduce((s, t) => s + t.amount, 0) +
      expenseItems.reduce((s, e) => s + e.amount, 0);

    return c.json({
      ok: true,
      data: {
        timeEntries: timeEntryItems,
        expenses: expenseItems,
        totalUnbilled: Math.round(totalUnbilled * 100) / 100,
      },
    });
  });

  // POST /api/projects/:id/create-invoice — create invoice from unbilled items
  router.post('/:id/create-invoice', async (c) => {
    const id = c.req.param('id');
    const project = await db.select().from(projects).where(eq(projects.id, id)).get();
    if (!project) return c.json({ ok: false, error: 'Project not found' }, 404);

    const body = await c.req.json();
    const timeEntryIds: string[] = body.timeEntryIds ?? [];
    const expenseIds: string[] = body.expenseIds ?? [];

    if (timeEntryIds.length === 0 && expenseIds.length === 0) {
      return c.json({ ok: false, error: 'At least one time entry or expense is required' }, 400);
    }

    // Fetch the selected time entries and expenses
    const selectedTime = [];
    for (const tid of timeEntryIds) {
      const entry = await db.select().from(timesheets)
        .where(and(eq(timesheets.id, tid), eq(timesheets.projectId, id), eq(timesheets.isInvoiced, false)))
        .get();
      if (entry) selectedTime.push(entry);
    }

    const selectedExpenses = [];
    for (const eid of expenseIds) {
      const expense = await db.select().from(projectExpenses)
        .where(and(eq(projectExpenses.id, eid), eq(projectExpenses.projectId, id), eq(projectExpenses.isInvoiced, false)))
        .get();
      if (expense) selectedExpenses.push(expense);
    }

    if (selectedTime.length === 0 && selectedExpenses.length === 0) {
      return c.json({ ok: false, error: 'No valid unbilled items found' }, 400);
    }

    // Ensure project has a contact for the invoice
    const contactId = project.contactId;
    let contactName = project.contactName ?? '';
    if (!contactId) {
      return c.json({ ok: false, error: 'Project must have a contact to create an invoice' }, 400);
    }

    // Look up contact name if not on project
    if (!contactName) {
      const contact = await db.select().from(contacts).where(eq(contacts.id, contactId)).get();
      contactName = contact?.name ?? '';
    }

    // Create invoice
    const invoiceId = randomUUID();
    const now = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let subTotal = 0;

    // Create line items for time entries
    const createdLineItems = [];
    for (const t of selectedTime) {
      const amount = Math.round(t.hours * t.hourlyRate * 100) / 100;
      subTotal += amount;
      const liId = randomUUID();
      await db.insert(lineItems).values({
        id: liId,
        invoiceId,
        description: `${t.description || 'Time entry'} (${t.hours}h @ $${t.hourlyRate}/h)`,
        quantity: t.hours,
        unitPrice: t.hourlyRate,
        taxRate: 15,
        taxAmount: Math.round(amount * 0.15 * 100) / 100,
        lineAmount: amount,
        discount: 0,
      });
      createdLineItems.push(liId);
    }

    // Create line items for expenses
    for (const e of selectedExpenses) {
      subTotal += e.amount;
      const liId = randomUUID();
      await db.insert(lineItems).values({
        id: liId,
        invoiceId,
        description: e.description,
        quantity: 1,
        unitPrice: e.amount,
        taxRate: 15,
        taxAmount: Math.round(e.amount * 0.15 * 100) / 100,
        lineAmount: e.amount,
        discount: 0,
      });
      createdLineItems.push(liId);
    }

    const totalTax = Math.round(subTotal * 0.15 * 100) / 100;
    const total = Math.round((subTotal + totalTax) * 100) / 100;
    subTotal = Math.round(subTotal * 100) / 100;

    const invoiceNumber = `INV-PRJ-${Date.now().toString(36).toUpperCase()}`;

    await db.insert(invoices).values({
      id: invoiceId,
      invoiceNumber,
      contactId,
      contactName,
      status: 'draft',
      date: now,
      dueDate,
      subTotal,
      totalTax,
      total,
      amountDue: total,
      amountPaid: 0,
    });

    // Mark time entries and expenses as invoiced
    for (const t of selectedTime) {
      await db.update(timesheets).set({ isInvoiced: true }).where(eq(timesheets.id, t.id));
    }
    for (const e of selectedExpenses) {
      await db.update(projectExpenses).set({ isInvoiced: true }).where(eq(projectExpenses.id, e.id));
    }

    return c.json({
      ok: true,
      data: {
        id: invoiceId,
        invoiceNumber,
        total,
        lineItemCount: createdLineItems.length,
      },
    }, 201);
  });

  // GET /api/projects/:id/budget — compute budget data from timesheets + expenses
  router.get('/:id/budget', async (c) => {
    const id = c.req.param('id');
    const project = await db.select().from(projects).where(eq(projects.id, id)).get();
    if (!project) return c.json({ ok: false, error: 'Project not found' }, 404);

    // Compute labour actual from timesheets (hours * hourlyRate)
    const sheets = await db.select().from(timesheets).where(eq(timesheets.projectId, id)).all();
    const labourActual = sheets.reduce((sum, t) => sum + t.hours * t.hourlyRate, 0);

    // Compute expense actuals by category
    const expenseRows = await db.select().from(projectExpenses).where(eq(projectExpenses.projectId, id)).all();
    const materialsActual = expenseRows
      .filter((e) => e.category === 'materials' || e.category === 'Materials')
      .reduce((sum, e) => sum + e.amount, 0);
    const otherActual = expenseRows
      .filter((e) => e.category !== 'materials' && e.category !== 'Materials')
      .reduce((sum, e) => sum + e.amount, 0);

    // Use estimatedBudget to derive category budgets, or default to 0
    const estBudget = project.estimatedBudget ?? 0;
    // Split budget: 60% labour, 30% materials, 10% other
    const labourBudget = Math.round(estBudget * 0.6 * 100) / 100;
    const materialsBudget = Math.round(estBudget * 0.3 * 100) / 100;
    const otherBudget = Math.round(estBudget * 0.1 * 100) / 100;

    function makeCategory(catId: string, name: string, budget: number, actual: number) {
      const roundedActual = Math.round(actual * 100) / 100;
      const variance = Math.round((budget - roundedActual) * 100) / 100;
      const percentUsed = budget > 0 ? Math.round((roundedActual / budget) * 10000) / 100 : 0;
      return { id: catId, name, budget, actual: roundedActual, variance, percentUsed };
    }

    const categories = [
      makeCategory('labour', 'Labour', labourBudget, labourActual),
      makeCategory('materials', 'Materials', materialsBudget, materialsActual),
      makeCategory('other', 'Other', otherBudget, otherActual),
    ];

    const totalBudget = categories.reduce((s, c) => s + c.budget, 0);
    const totalActual = categories.reduce((s, c) => s + c.actual, 0);
    const totalVariance = Math.round((totalBudget - totalActual) * 100) / 100;
    const totalPercentUsed = totalBudget > 0 ? Math.round((totalActual / totalBudget) * 10000) / 100 : 0;

    return c.json({
      ok: true,
      data: { categories, totalBudget, totalActual, totalVariance, totalPercentUsed },
    });
  });

  // PUT /api/projects/:id/budget — update budget by adjusting estimatedBudget on the project
  router.put('/:id/budget', async (c) => {
    const id = c.req.param('id');
    const project = await db.select().from(projects).where(eq(projects.id, id)).get();
    if (!project) return c.json({ ok: false, error: 'Project not found' }, 404);

    const body = await c.req.json();
    const inputCategories = body.categories as Array<{ id: string; name: string; budget: number; actual: number }>;
    if (!Array.isArray(inputCategories)) {
      return c.json({ ok: false, error: 'categories array required' }, 400);
    }

    // Sum category budgets → update estimatedBudget on project
    const newTotalBudget = inputCategories.reduce((s, cat) => s + (cat.budget ?? 0), 0);
    await db.update(projects).set({ estimatedBudget: newTotalBudget }).where(eq(projects.id, id));

    // Recompute actuals and return consistent data
    const sheets = await db.select().from(timesheets).where(eq(timesheets.projectId, id)).all();
    const labourActual = sheets.reduce((sum, t) => sum + t.hours * t.hourlyRate, 0);

    const expenseRows = await db.select().from(projectExpenses).where(eq(projectExpenses.projectId, id)).all();
    const materialsActual = expenseRows
      .filter((e) => e.category === 'materials' || e.category === 'Materials')
      .reduce((sum, e) => sum + e.amount, 0);
    const otherActual = expenseRows
      .filter((e) => e.category !== 'materials' && e.category !== 'Materials')
      .reduce((sum, e) => sum + e.amount, 0);

    // Use provided budget values per category
    const labourBudget = inputCategories.find((cat) => cat.id === 'labour')?.budget ?? 0;
    const materialsBudget = inputCategories.find((cat) => cat.id === 'materials')?.budget ?? 0;
    const otherBudget = inputCategories.find((cat) => cat.id === 'other')?.budget ?? 0;

    function makeCat(catId: string, name: string, budget: number, actual: number) {
      const roundedActual = Math.round(actual * 100) / 100;
      const variance = Math.round((budget - roundedActual) * 100) / 100;
      const percentUsed = budget > 0 ? Math.round((roundedActual / budget) * 10000) / 100 : 0;
      return { id: catId, name, budget, actual: roundedActual, variance, percentUsed };
    }

    const categories = [
      makeCat('labour', 'Labour', labourBudget, labourActual),
      makeCat('materials', 'Materials', materialsBudget, materialsActual),
      makeCat('other', 'Other', otherBudget, otherActual),
    ];

    const totalBudget = categories.reduce((s, cat) => s + cat.budget, 0);
    const totalActual = categories.reduce((s, cat) => s + cat.actual, 0);
    const totalVariance = Math.round((totalBudget - totalActual) * 100) / 100;
    const totalPercentUsed = totalBudget > 0 ? Math.round((totalActual / totalBudget) * 10000) / 100 : 0;

    return c.json({
      ok: true,
      data: { categories, totalBudget, totalActual, totalVariance, totalPercentUsed },
    });
  });

  // GET /api/projects/:id/profitability — compute profitability from invoiced items + costs
  router.get('/:id/profitability', async (c) => {
    const id = c.req.param('id');
    const project = await db.select().from(projects).where(eq(projects.id, id)).get();
    if (!project) return c.json({ ok: false, error: 'Project not found' }, 404);

    // Revenue = invoiced time entries (billable, hours*rate) + invoiced expenses (billable)
    const sheets = await db.select().from(timesheets).where(eq(timesheets.projectId, id)).all();
    const expenseRows = await db.select().from(projectExpenses).where(eq(projectExpenses.projectId, id)).all();

    const invoicedTimeRevenue = sheets
      .filter((t) => t.isInvoiced && t.isBillable)
      .reduce((sum, t) => sum + t.hours * t.hourlyRate, 0);
    const invoicedExpenseRevenue = expenseRows
      .filter((e) => e.isInvoiced && e.isBillable)
      .reduce((sum, e) => sum + e.amount, 0);
    const totalRevenue = Math.round((invoicedTimeRevenue + invoicedExpenseRevenue) * 100) / 100;

    // Total cost = all time entries (hours*rate) + all expenses
    const totalTimeCost = sheets.reduce((sum, t) => sum + t.hours * t.hourlyRate, 0);
    const totalExpenseCost = expenseRows.reduce((sum, e) => sum + e.amount, 0);
    const totalCost = Math.round((totalTimeCost + totalExpenseCost) * 100) / 100;

    const profit = Math.round((totalRevenue - totalCost) * 100) / 100;
    const margin = totalRevenue > 0 ? Math.round((profit / totalRevenue) * 10000) / 100 : 0;

    // Monthly breakdown from time entries grouped by month
    const monthlyMap = new Map<string, { revenue: number; cost: number }>();

    for (const t of sheets) {
      const monthKey = t.date.slice(0, 7); // YYYY-MM
      const entry = monthlyMap.get(monthKey) ?? { revenue: 0, cost: 0 };
      entry.cost += t.hours * t.hourlyRate;
      if (t.isInvoiced && t.isBillable) {
        entry.revenue += t.hours * t.hourlyRate;
      }
      monthlyMap.set(monthKey, entry);
    }

    for (const e of expenseRows) {
      const monthKey = e.date.slice(0, 7);
      const entry = monthlyMap.get(monthKey) ?? { revenue: 0, cost: 0 };
      entry.cost += e.amount;
      if (e.isInvoiced && e.isBillable) {
        entry.revenue += e.amount;
      }
      monthlyMap.set(monthKey, entry);
    }

    // Sort months chronologically
    const sortedMonths = [...monthlyMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyBreakdown = sortedMonths.map(([key, data]) => {
      const monthIdx = parseInt(key.slice(5, 7), 10) - 1;
      const monthLabel = monthNames[monthIdx] ?? key;
      const rev = Math.round(data.revenue * 100) / 100;
      const cost = Math.round(data.cost * 100) / 100;
      return {
        month: monthLabel,
        revenue: rev,
        cost,
        profit: Math.round((rev - cost) * 100) / 100,
      };
    });

    return c.json({
      ok: true,
      data: { totalRevenue, totalCost, profit, margin, monthlyBreakdown },
    });
  });

  // DELETE /api/projects/:id
  router.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.select().from(projects).where(eq(projects.id, id)).get();
    if (!existing) return c.json({ ok: false, error: 'Project not found' }, 404);
    await db.delete(projects).where(eq(projects.id, id));
    return c.json({ ok: true, data: { id } });
  });

  return router;
}
