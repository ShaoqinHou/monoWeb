import { Hono } from 'hono';
import { sql } from 'drizzle-orm';
import { invoices, bills, payments, accounts, bankTransactions, expenses, leaveRequests } from '../db/schema';
import type { Db } from '../db/index';

export function dashboardRoutes(db: Db) {
  const router = new Hono();

  // GET /api/dashboard/summary — Aggregated stats for dashboard
  router.get('/summary', async (c) => {
    // Invoices owed (outstanding)
    const invoiceRows = await db.select().from(invoices).all();
    const totalInvoicesOwed = invoiceRows
      .filter((inv) => inv.status !== 'paid' && inv.status !== 'voided')
      .reduce((sum, inv) => sum + (inv.amountDue ?? 0), 0);
    const overdueInvoices = invoiceRows
      .filter((inv) => {
        if (inv.status === 'paid' || inv.status === 'voided') return false;
        return inv.dueDate < new Date().toISOString().split('T')[0];
      });
    const totalInvoicesOverdue = overdueInvoices.reduce((sum, inv) => sum + (inv.amountDue ?? 0), 0);

    // Bills to pay (outstanding)
    const billRows = await db.select().from(bills).all();
    const totalBillsToPay = billRows
      .filter((bill) => bill.status !== 'paid' && bill.status !== 'voided')
      .reduce((sum, bill) => sum + (bill.amountDue ?? 0), 0);
    const overdueBills = billRows
      .filter((bill) => {
        if (bill.status === 'paid' || bill.status === 'voided') return false;
        return bill.dueDate < new Date().toISOString().split('T')[0];
      });
    const totalBillsOverdue = overdueBills.reduce((sum, bill) => sum + (bill.amountDue ?? 0), 0);

    // Recent activity (last 10 of each)
    const recentInvoices = invoiceRows
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 10);
    const recentBills = billRows
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 10);

    // Payments
    const paymentRows = await db.select().from(payments).all();
    const recentPayments = paymentRows
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 10);

    // Bank accounts
    const bankAccounts = await db.select().from(accounts)
      .where(sql`${accounts.type} = 'asset' AND ${accounts.isArchived} = 0`)
      .all();

    // Cash flow by month (last 12 months)
    const now = new Date();
    const cashFlow: Array<{ month: string; income: number; expenses: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const income = invoiceRows
        .filter((inv) => inv.status === 'paid' && inv.date.startsWith(monthStr))
        .reduce((sum, inv) => sum + inv.total, 0);
      const expenses = billRows
        .filter((bill) => bill.status === 'paid' && bill.date.startsWith(monthStr))
        .reduce((sum, bill) => sum + bill.total, 0);
      cashFlow.push({ month: monthStr, income, expenses });
    }

    return c.json({
      ok: true,
      data: {
        totalInvoicesOwed,
        totalInvoicesOverdue,
        overdueInvoiceCount: overdueInvoices.length,
        totalBillsToPay,
        totalBillsOverdue,
        overdueBillCount: overdueBills.length,
        recentInvoices,
        recentBills,
        recentPayments,
        bankAccounts,
        cashFlow,
        invoiceCount: invoiceRows.length,
        billCount: billRows.length,
      },
    });
  });

  // GET /api/dashboard/tasks — Actionable items for dashboard tasks widget
  router.get('/tasks', async (c) => {
    const today = new Date().toISOString().split('T')[0];

    const invoiceRows = await db.select().from(invoices).all();
    const billRows = await db.select().from(bills).all();

    // Overdue invoices
    const overdueInvoices = invoiceRows.filter(
      (inv) => inv.status !== 'paid' && inv.status !== 'voided' && inv.dueDate < today,
    );
    const overdueInvoicesTotal = overdueInvoices.reduce((sum, inv) => sum + (inv.amountDue ?? 0), 0);

    // Bills due this week (next 7 days)
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndStr = weekEnd.toISOString().split('T')[0];
    const billsDueThisWeek = billRows.filter(
      (bill) =>
        bill.status !== 'paid' &&
        bill.status !== 'voided' &&
        bill.dueDate >= today &&
        bill.dueDate <= weekEndStr,
    );
    const billsDueThisWeekTotal = billsDueThisWeek.reduce((sum, bill) => sum + (bill.amountDue ?? 0), 0);

    // Unreconciled bank transactions
    const unreconciledRows = await db
      .select()
      .from(bankTransactions)
      .where(sql`${bankTransactions.isReconciled} = 0`)
      .all();

    // Unapproved expenses
    const unapprovedExpenses = await db
      .select()
      .from(expenses)
      .where(sql`${expenses.status} = 'submitted'`)
      .all();

    // Leave requests pending approval
    const pendingLeave = await db
      .select()
      .from(leaveRequests)
      .where(sql`${leaveRequests.status} = 'pending'`)
      .all();

    return c.json({
      ok: true,
      data: {
        overdueInvoices: { count: overdueInvoices.length, total: overdueInvoicesTotal },
        billsDueThisWeek: { count: billsDueThisWeek.length, total: billsDueThisWeekTotal },
        unreconciledTransactions: { count: unreconciledRows.length },
        unapprovedExpenses: { count: unapprovedExpenses.length },
        pendingLeaveRequests: { count: pendingLeave.length },
      },
    });
  });

  // GET /api/dashboard/insights — Computed financial insights
  router.get('/insights', async (c) => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

    const invoiceRows = await db.select().from(invoices).all();
    const billRows = await db.select().from(bills).all();

    // Revenue this month vs last month
    const revenueThisMonth = invoiceRows
      .filter((inv) => inv.status === 'paid' && inv.date.startsWith(thisMonth))
      .reduce((sum, inv) => sum + inv.total, 0);
    const revenueLastMonth = invoiceRows
      .filter((inv) => inv.status === 'paid' && inv.date.startsWith(lastMonth))
      .reduce((sum, inv) => sum + inv.total, 0);
    const revenueChange =
      revenueLastMonth > 0 ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 : 0;

    // Expenses this month vs last month
    const expensesThisMonth = billRows
      .filter((bill) => bill.status === 'paid' && bill.date.startsWith(thisMonth))
      .reduce((sum, bill) => sum + bill.total, 0);
    const expensesLastMonth = billRows
      .filter((bill) => bill.status === 'paid' && bill.date.startsWith(lastMonth))
      .reduce((sum, bill) => sum + bill.total, 0);
    const expensesChange =
      expensesLastMonth > 0
        ? ((expensesThisMonth - expensesLastMonth) / expensesLastMonth) * 100
        : 0;

    // Cash position (total bank account balances - using asset accounts)
    const bankAccounts = await db
      .select()
      .from(accounts)
      .where(sql`${accounts.type} = 'asset' AND ${accounts.isArchived} = 0`)
      .all();
    // Approximate cash from paid invoices minus paid bills
    const totalPaidIn = invoiceRows
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);
    const totalPaidOut = billRows
      .filter((bill) => bill.status === 'paid')
      .reduce((sum, bill) => sum + bill.total, 0);
    const cashPosition = totalPaidIn - totalPaidOut;

    // Top 5 outstanding debtors
    const contactTotals: Record<string, { name: string; total: number }> = {};
    for (const inv of invoiceRows) {
      if (inv.status === 'paid' || inv.status === 'voided') continue;
      if (!contactTotals[inv.contactId]) {
        contactTotals[inv.contactId] = { name: inv.contactName, total: 0 };
      }
      contactTotals[inv.contactId].total += inv.amountDue ?? 0;
    }
    const topDebtors = Object.values(contactTotals)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return c.json({
      ok: true,
      data: {
        revenue: {
          thisMonth: revenueThisMonth,
          lastMonth: revenueLastMonth,
          changePercent: Math.round(revenueChange * 10) / 10,
        },
        expenses: {
          thisMonth: expensesThisMonth,
          lastMonth: expensesLastMonth,
          changePercent: Math.round(expensesChange * 10) / 10,
        },
        cashPosition,
        bankAccountCount: bankAccounts.length,
        topDebtors,
      },
    });
  });

  return router;
}
