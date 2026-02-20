import { Hono } from 'hono';
import { eq, and, gte, lte, sql, ne } from 'drizzle-orm';
import { invoices, bills, accounts, lineItems, payments, journals, journalLines } from '../db/schema';
import type { Db } from '../db/index';

/**
 * Financial reports route — accrual/cash accounting using chart of accounts.
 */
export function reportRoutes(db: Db) {
  const router = new Hono();

  // GET /api/reports/profit-and-loss?start=YYYY-MM-DD&end=YYYY-MM-DD&basis=accrual|cash
  router.get('/profit-and-loss', async (c) => {
    const start = c.req.query('start') ?? '1900-01-01';
    const end = c.req.query('end') ?? '2099-12-31';
    const basis = c.req.query('basis') ?? 'accrual';

    // Get all revenue/expense accounts (non-archived)
    const revenueAccounts = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.type, 'revenue'), eq(accounts.isArchived, false)))
      .all();

    const expenseAccounts = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.type, 'expense'), eq(accounts.isArchived, false)))
      .all();

    // Build a map of accountCode -> accountName for lookups
    const accountMap = new Map<string, { name: string; type: string }>();
    for (const a of [...revenueAccounts, ...expenseAccounts]) {
      accountMap.set(a.code, { name: a.name, type: a.type });
    }

    // Revenue: from invoices line items assigned to revenue accounts
    // Accrual = based on invoice date; Cash = based on payment date (only paid invoices)
    const revenueByAccount = new Map<string, number>();

    if (basis === 'cash') {
      // Cash basis: only count revenue from invoices that have payments in the date range
      const paidInvoices = await db
        .select({
          invoiceId: payments.invoiceId,
          paymentAmount: payments.amount,
        })
        .from(payments)
        .where(
          and(
            gte(payments.date, start),
            lte(payments.date, end),
            sql`${payments.invoiceId} IS NOT NULL`,
          ),
        )
        .all();

      // For each paid invoice, get the line items and proportionally allocate
      for (const p of paidInvoices) {
        if (!p.invoiceId) continue;
        const inv = await db.select({ total: invoices.total }).from(invoices)
          .where(eq(invoices.id, p.invoiceId)).all();
        const invTotal = inv[0]?.total ?? 0;
        if (invTotal === 0) continue;
        const ratio = p.paymentAmount / invTotal;

        const lines = await db.select({
          accountCode: lineItems.accountCode,
          lineAmount: lineItems.lineAmount,
        }).from(lineItems).where(eq(lineItems.invoiceId, p.invoiceId)).all();

        for (const li of lines) {
          const code = li.accountCode ?? '';
          const acct = accountMap.get(code);
          if (acct && acct.type === 'revenue') {
            revenueByAccount.set(code, (revenueByAccount.get(code) ?? 0) + li.lineAmount * ratio);
          }
        }
      }
    } else {
      // Accrual basis: count from all non-voided invoices in the date range
      const invoiceList = await db
        .select({ id: invoices.id, currency: invoices.currency })
        .from(invoices)
        .where(
          and(
            ne(invoices.status, 'voided'),
            gte(invoices.date, start),
            lte(invoices.date, end),
          ),
        )
        .all();

      for (const inv of invoiceList) {
        const lines = await db.select({
          accountCode: lineItems.accountCode,
          lineAmount: lineItems.lineAmount,
        }).from(lineItems).where(eq(lineItems.invoiceId, inv.id)).all();

        for (const li of lines) {
          const code = li.accountCode ?? '';
          const acct = accountMap.get(code);
          if (acct && acct.type === 'revenue') {
            revenueByAccount.set(code, (revenueByAccount.get(code) ?? 0) + li.lineAmount);
          }
        }
      }
    }

    // Expenses: from bills line items assigned to expense accounts
    const expenseByAccount = new Map<string, number>();

    if (basis === 'cash') {
      const paidBills = await db
        .select({
          billId: payments.billId,
          paymentAmount: payments.amount,
        })
        .from(payments)
        .where(
          and(
            gte(payments.date, start),
            lte(payments.date, end),
            sql`${payments.billId} IS NOT NULL`,
          ),
        )
        .all();

      for (const p of paidBills) {
        if (!p.billId) continue;
        const bill = await db.select({ total: bills.total }).from(bills)
          .where(eq(bills.id, p.billId)).all();
        const billTotal = bill[0]?.total ?? 0;
        if (billTotal === 0) continue;
        const ratio = p.paymentAmount / billTotal;

        const lines = await db.select({
          accountCode: lineItems.accountCode,
          lineAmount: lineItems.lineAmount,
        }).from(lineItems).where(eq(lineItems.billId, p.billId)).all();

        for (const li of lines) {
          const code = li.accountCode ?? '';
          const acct = accountMap.get(code);
          if (acct && acct.type === 'expense') {
            expenseByAccount.set(code, (expenseByAccount.get(code) ?? 0) + li.lineAmount * ratio);
          }
        }
      }
    } else {
      const billList = await db
        .select({ id: bills.id, currency: bills.currency })
        .from(bills)
        .where(
          and(
            ne(bills.status, 'voided'),
            gte(bills.date, start),
            lte(bills.date, end),
          ),
        )
        .all();

      for (const b of billList) {
        const lines = await db.select({
          accountCode: lineItems.accountCode,
          lineAmount: lineItems.lineAmount,
        }).from(lineItems).where(eq(lineItems.billId, b.id)).all();

        for (const li of lines) {
          const code = li.accountCode ?? '';
          const acct = accountMap.get(code);
          if (acct && acct.type === 'expense') {
            expenseByAccount.set(code, (expenseByAccount.get(code) ?? 0) + li.lineAmount);
          }
        }
      }
    }

    // Also include journal entries (posted, in date range)
    const postedJournals = await db
      .select({ id: journals.id })
      .from(journals)
      .where(
        and(
          eq(journals.status, 'posted'),
          gte(journals.date, start),
          lte(journals.date, end),
        ),
      )
      .all();

    for (const j of postedJournals) {
      const lines = await db
        .select({
          accountId: journalLines.accountId,
          accountName: journalLines.accountName,
          debit: journalLines.debit,
          credit: journalLines.credit,
        })
        .from(journalLines)
        .where(eq(journalLines.journalId, j.id))
        .all();

      for (const jl of lines) {
        // Look up the account to determine type
        const acctRows = await db
          .select({ code: accounts.code, type: accounts.type, name: accounts.name })
          .from(accounts)
          .where(eq(accounts.id, jl.accountId))
          .all();
        const acct = acctRows[0];
        if (!acct) continue;

        if (acct.type === 'revenue') {
          // Revenue: credits increase revenue
          const net = jl.credit - jl.debit;
          revenueByAccount.set(acct.code, (revenueByAccount.get(acct.code) ?? 0) + net);
        } else if (acct.type === 'expense') {
          // Expense: debits increase expense
          const net = jl.debit - jl.credit;
          expenseByAccount.set(acct.code, (expenseByAccount.get(acct.code) ?? 0) + net);
        }
      }
    }

    // If no line items had account codes, fall back to simple invoice/bill totals
    // so existing data without account codes still produces a report
    if (revenueByAccount.size === 0 && expenseByAccount.size === 0) {
      // Fallback: group by contact as before
      const dateFilter = basis === 'cash'
        ? and(eq(invoices.status, 'paid'), gte(invoices.date, start), lte(invoices.date, end))
        : and(ne(invoices.status, 'voided'), gte(invoices.date, start), lte(invoices.date, end));

      const incomeRows = await db
        .select({ total: sql<number>`coalesce(sum(${invoices.total}), 0)` })
        .from(invoices)
        .where(dateFilter)
        .all();

      const billDateFilter = basis === 'cash'
        ? and(eq(bills.status, 'paid'), gte(bills.date, start), lte(bills.date, end))
        : and(ne(bills.status, 'voided'), gte(bills.date, start), lte(bills.date, end));

      const expRows = await db
        .select({ total: sql<number>`coalesce(sum(${bills.total}), 0)` })
        .from(bills)
        .where(billDateFilter)
        .all();

      const income = incomeRows[0]?.total ?? 0;
      const expenses = expRows[0]?.total ?? 0;

      return c.json({
        ok: true,
        data: {
          dateRange: { from: start, to: end },
          basis,
          revenue: income > 0 ? [{ accountName: 'Sales Revenue', amount: income }] : [],
          costOfSales: [],
          operatingExpenses: expenses > 0 ? [{ accountName: 'General Expenses', amount: expenses }] : [],
          totalRevenue: income,
          totalCostOfSales: 0,
          grossProfit: income,
          totalOperatingExpenses: expenses,
          netProfit: income - expenses,
        },
      });
    }

    // Build response grouped by account
    const revenue = Array.from(revenueByAccount.entries())
      .map(([code, amount]) => ({
        accountName: accountMap.get(code)?.name ?? code,
        amount: Math.round(amount * 100) / 100,
      }))
      .sort((a, b) => a.accountName.localeCompare(b.accountName));

    const operatingExpenses = Array.from(expenseByAccount.entries())
      .map(([code, amount]) => ({
        accountName: accountMap.get(code)?.name ?? code,
        amount: Math.round(amount * 100) / 100,
      }))
      .sort((a, b) => a.accountName.localeCompare(b.accountName));

    const totalRevenue = revenue.reduce((s, r) => s + r.amount, 0);
    const totalOperatingExpenses = operatingExpenses.reduce((s, r) => s + r.amount, 0);
    const grossProfit = totalRevenue; // costOfSales is a subset we could separate later
    const netProfit = totalRevenue - totalOperatingExpenses;

    return c.json({
      ok: true,
      data: {
        dateRange: { from: start, to: end },
        basis,
        revenue,
        costOfSales: [],
        operatingExpenses,
        totalRevenue,
        totalCostOfSales: 0,
        grossProfit,
        totalOperatingExpenses,
        netProfit,
      },
    });
  });

  // GET /api/reports/balance-sheet?asAt=YYYY-MM-DD
  router.get('/balance-sheet', async (c) => {
    const asAt = c.req.query('asAt') ?? new Date().toISOString().slice(0, 10);

    // Get all non-archived accounts
    const allAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.isArchived, false))
      .all();

    // Calculate balances from invoices and bills
    const arRows = await db
      .select({ total: sql<number>`coalesce(sum(${invoices.amountDue}), 0)` })
      .from(invoices)
      .where(and(lte(invoices.date, asAt), ne(invoices.status, 'voided')))
      .all();
    const accountsReceivable = arRows[0]?.total ?? 0;

    const apRows = await db
      .select({ total: sql<number>`coalesce(sum(${bills.amountDue}), 0)` })
      .from(bills)
      .where(and(lte(bills.date, asAt), ne(bills.status, 'voided')))
      .all();
    const accountsPayable = apRows[0]?.total ?? 0;

    // Group accounts by type
    const currentAssets: Array<{ accountName: string; amount: number }> = [];
    const fixedAssets: Array<{ accountName: string; amount: number }> = [];
    const currentLiabilities: Array<{ accountName: string; amount: number }> = [];
    const equityItems: Array<{ accountName: string; amount: number }> = [];

    // Add computed AR/AP
    currentAssets.push({ accountName: 'Accounts Receivable', amount: accountsReceivable });

    // Calculate journal-based balances per account
    const accountBalances = new Map<string, number>();
    const postedJournals = await db
      .select({ id: journals.id })
      .from(journals)
      .where(and(eq(journals.status, 'posted'), lte(journals.date, asAt)))
      .all();

    for (const j of postedJournals) {
      const lines = await db
        .select({
          accountId: journalLines.accountId,
          debit: journalLines.debit,
          credit: journalLines.credit,
        })
        .from(journalLines)
        .where(eq(journalLines.journalId, j.id))
        .all();

      for (const jl of lines) {
        const balance = accountBalances.get(jl.accountId) ?? 0;
        // Assets/Expenses: debit increases; Liabilities/Equity/Revenue: credit increases
        accountBalances.set(jl.accountId, balance + jl.debit - jl.credit);
      }
    }

    for (const acct of allAccounts) {
      const journalBalance = accountBalances.get(acct.id) ?? 0;
      const entry = { accountName: acct.name, amount: journalBalance };

      switch (acct.type) {
        case 'asset':
          // Don't duplicate AR if this account represents it
          if (acct.name !== 'Accounts Receivable') {
            fixedAssets.push(entry);
          }
          break;
        case 'liability':
          currentLiabilities.push(entry);
          break;
        case 'equity':
          equityItems.push(entry);
          break;
      }
    }

    // Add AP to liabilities
    currentLiabilities.push({ accountName: 'Accounts Payable', amount: accountsPayable });

    const totalCurrentAssets = currentAssets.reduce((s, r) => s + r.amount, 0);
    const totalFixedAssets = fixedAssets.reduce((s, r) => s + r.amount, 0);
    const totalAssets = totalCurrentAssets + totalFixedAssets;
    const totalCurrentLiabilities = currentLiabilities.reduce((s, r) => s + r.amount, 0);
    const totalLiabilities = totalCurrentLiabilities;

    // Calculate retained earnings from P&L (revenue - expenses from invoices/bills)
    const retainedEarnings = totalAssets - totalLiabilities - equityItems.reduce((s, r) => s + r.amount, 0);
    if (Math.abs(retainedEarnings) > 0.01) {
      equityItems.push({ accountName: 'Retained Earnings', amount: retainedEarnings });
    }

    const totalEquity = equityItems.reduce((s, r) => s + r.amount, 0);
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    return c.json({
      ok: true,
      data: {
        asAt,
        currentAssets,
        fixedAssets,
        currentLiabilities,
        equity: equityItems,
        totalCurrentAssets,
        totalFixedAssets,
        totalAssets,
        totalCurrentLiabilities,
        totalLiabilities,
        totalEquity,
        totalLiabilitiesAndEquity,
      },
    });
  });

  // GET /api/reports/aged-receivables
  router.get('/aged-receivables', async (c) => {
    const today = new Date().toISOString().slice(0, 10);

    const outstanding = await db
      .select({
        id: invoices.id,
        contactName: invoices.contactName,
        invoiceNumber: invoices.invoiceNumber,
        dueDate: invoices.dueDate,
        amountDue: invoices.amountDue,
      })
      .from(invoices)
      .where(and(ne(invoices.status, 'voided'), ne(invoices.status, 'paid')))
      .all();

    const buckets = [
      { label: 'Current', amount: 0, count: 0 },
      { label: '1-30 days', amount: 0, count: 0 },
      { label: '31-60 days', amount: 0, count: 0 },
      { label: '61-90 days', amount: 0, count: 0 },
      { label: '90+ days', amount: 0, count: 0 },
    ];

    const todayMs = new Date(today + 'T00:00:00Z').getTime();
    let total = 0;

    for (const inv of outstanding) {
      const dueDateMs = new Date(inv.dueDate + 'T00:00:00Z').getTime();
      const daysOverdue = Math.floor((todayMs - dueDateMs) / (1000 * 60 * 60 * 24));
      total += inv.amountDue;

      const idx = daysOverdue <= 0 ? 0
        : daysOverdue <= 30 ? 1
        : daysOverdue <= 60 ? 2
        : daysOverdue <= 90 ? 3
        : 4;

      buckets[idx].amount += inv.amountDue;
      buckets[idx].count += 1;
    }

    return c.json({ ok: true, data: { buckets, total } });
  });

  // GET /api/reports/aged-payables
  router.get('/aged-payables', async (c) => {
    const today = new Date().toISOString().slice(0, 10);

    const outstanding = await db
      .select({
        id: bills.id,
        contactName: bills.contactName,
        billNumber: bills.billNumber,
        dueDate: bills.dueDate,
        amountDue: bills.amountDue,
      })
      .from(bills)
      .where(and(ne(bills.status, 'voided'), ne(bills.status, 'paid')))
      .all();

    const buckets = [
      { label: 'Current', amount: 0, count: 0 },
      { label: '1-30 days', amount: 0, count: 0 },
      { label: '31-60 days', amount: 0, count: 0 },
      { label: '61-90 days', amount: 0, count: 0 },
      { label: '90+ days', amount: 0, count: 0 },
    ];

    const todayMs = new Date(today + 'T00:00:00Z').getTime();
    let total = 0;

    for (const bill of outstanding) {
      const dueDateMs = new Date(bill.dueDate + 'T00:00:00Z').getTime();
      const daysOverdue = Math.floor((todayMs - dueDateMs) / (1000 * 60 * 60 * 24));
      total += bill.amountDue;

      const idx = daysOverdue <= 0 ? 0
        : daysOverdue <= 30 ? 1
        : daysOverdue <= 60 ? 2
        : daysOverdue <= 90 ? 3
        : 4;

      buckets[idx].amount += bill.amountDue;
      buckets[idx].count += 1;
    }

    return c.json({ ok: true, data: { buckets, total } });
  });

  return router;
}
