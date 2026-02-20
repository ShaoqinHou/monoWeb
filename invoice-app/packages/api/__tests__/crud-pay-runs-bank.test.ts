import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createApp } from '../src/app';
import { createTestDb } from '../src/db/test-helpers';
import { employees } from '../src/db/schema';
import type { Db } from '../src/db/index';

let db: Db;
let cleanup: () => void;
let app: ReturnType<typeof createApp>;

beforeEach(async () => {
  ({ db, cleanup } = createTestDb());
  app = createApp(db);
});
afterEach(() => cleanup());

function req(method: string, path: string, body?: unknown) {
  const init: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) init.body = JSON.stringify(body);
  return app.request(path, init);
}

// ─── Helper: NZ PAYE calculation (mirrors server logic exactly) ───────────────

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

function expectedPayslip(salary: number, periodsPerYear: number) {
  const grossPay = Math.round((salary / periodsPerYear) * 100) / 100;
  const annualPaye = calculatePaye(salary);
  const paye = Math.round((annualPaye / periodsPerYear) * 100) / 100;
  const kiwiSaverEmployee = Math.round(grossPay * 0.03 * 100) / 100;
  const kiwiSaverEmployer = Math.round(grossPay * 0.03 * 100) / 100;
  const netPay = Math.round((grossPay - paye - kiwiSaverEmployee) * 100) / 100;
  return { grossPay, paye, kiwiSaverEmployee, kiwiSaverEmployer, netPay };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAY RUNS — Comprehensive CRUD + Validation
// ═══════════════════════════════════════════════════════════════════════════════

describe('Pay Runs CRUD', () => {
  const EMP1_SALARY = 85000;
  const EMP2_SALARY = 95000;

  beforeEach(async () => {
    // Seed 2 employees
    await db.insert(employees).values([
      {
        id: 'emp-1',
        firstName: 'Emma',
        lastName: 'Stone',
        startDate: '2022-01-01',
        salary: EMP1_SALARY,
        payFrequency: 'monthly',
        taxCode: 'M',
        isActive: true,
      },
      {
        id: 'emp-2',
        firstName: 'James',
        lastName: 'Wilson',
        startDate: '2023-01-01',
        salary: EMP2_SALARY,
        payFrequency: 'monthly',
        taxCode: 'M',
        isActive: true,
      },
    ]);
  });

  // Pre-calculate expected values for both employees (monthly = 12 periods)
  const emp1Expected = expectedPayslip(EMP1_SALARY, 12);
  const emp2Expected = expectedPayslip(EMP2_SALARY, 12);

  // ── 1. Create with valid data ──────────────────────────────────────────────
  it('POST /api/pay-runs with valid data returns 201 with draft status and correct payslips', async () => {
    const res = await req('POST', '/api/pay-runs', {
      payPeriodStart: '2024-01-01',
      payPeriodEnd: '2024-01-31',
      payDate: '2024-01-31',
      employeeIds: ['emp-1', 'emp-2'],
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe('draft');
    expect(body.data.payslips).toHaveLength(2);

    // Verify totals are exact
    const expectedTotalGross = Math.round((emp1Expected.grossPay + emp2Expected.grossPay) * 100) / 100;
    const expectedTotalTax = Math.round((emp1Expected.paye + emp2Expected.paye) * 100) / 100;
    const expectedTotalNet = Math.round((emp1Expected.netPay + emp2Expected.netPay) * 100) / 100;

    expect(body.data.totalGross).toBe(expectedTotalGross);
    expect(body.data.totalTax).toBe(expectedTotalTax);
    expect(body.data.totalNet).toBe(expectedTotalNet);

    // Specific numeric checks: totalGross = 7083.33 + 7916.67 = 15000.00
    expect(body.data.totalGross).toBe(15000);
    expect(body.data.totalNet).toBeLessThan(body.data.totalGross);
  });

  // ── 2. Missing payPeriodStart ──────────────────────────────────────────────
  it('POST /api/pay-runs with missing payPeriodStart returns 400', async () => {
    const res = await req('POST', '/api/pay-runs', {
      payPeriodEnd: '2024-01-31',
      payDate: '2024-01-31',
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain('payPeriodStart');
  });

  // ── 3. Missing payPeriodEnd ────────────────────────────────────────────────
  it('POST /api/pay-runs with missing payPeriodEnd returns 400', async () => {
    const res = await req('POST', '/api/pay-runs', {
      payPeriodStart: '2024-01-01',
      payDate: '2024-01-31',
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain('payPeriodEnd');
  });

  // ── 4. Missing payDate ─────────────────────────────────────────────────────
  it('POST /api/pay-runs with missing payDate returns 400', async () => {
    const res = await req('POST', '/api/pay-runs', {
      payPeriodStart: '2024-01-01',
      payPeriodEnd: '2024-01-31',
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain('payDate');
  });

  // ── 5. Create with specific employeeIds ────────────────────────────────────
  it('POST /api/pay-runs with specific employeeIds only includes those employees', async () => {
    const res = await req('POST', '/api/pay-runs', {
      payPeriodStart: '2024-01-01',
      payPeriodEnd: '2024-01-31',
      payDate: '2024-01-31',
      employeeIds: ['emp-1'],
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.payslips).toHaveLength(1);

    // Only emp-1's payslip should exist
    const slip = body.data.payslips[0];
    expect(slip.employeeId).toBe('emp-1');
    expect(slip.grossPay).toBe(emp1Expected.grossPay); // 7083.33
    expect(slip.paye).toBe(emp1Expected.paye); // 1580.83
    expect(slip.netPay).toBe(emp1Expected.netPay); // 5290.00

    // Total should only reflect emp-1
    expect(body.data.totalGross).toBe(emp1Expected.grossPay);
  });

  // ── 6. Create with no employeeIds auto-includes all active ─────────────────
  it('POST /api/pay-runs with no employeeIds auto-includes all active employees', async () => {
    const res = await req('POST', '/api/pay-runs', {
      payPeriodStart: '2024-02-01',
      payPeriodEnd: '2024-02-28',
      payDate: '2024-02-28',
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.payslips).toHaveLength(2);

    // Verify both employees are included
    const empIds = body.data.payslips.map((s: { employeeId: string }) => s.employeeId).sort();
    expect(empIds).toEqual(['emp-1', 'emp-2']);
  });

  // ── 7. Get list ────────────────────────────────────────────────────────────
  it('GET /api/pay-runs returns created pay runs with employees array', async () => {
    // Create two pay runs
    await req('POST', '/api/pay-runs', {
      payPeriodStart: '2024-01-01',
      payPeriodEnd: '2024-01-31',
      payDate: '2024-01-31',
      employeeIds: ['emp-1'],
    });
    await req('POST', '/api/pay-runs', {
      payPeriodStart: '2024-02-01',
      payPeriodEnd: '2024-02-28',
      payDate: '2024-02-28',
      employeeIds: ['emp-2'],
    });

    const res = await req('GET', '/api/pay-runs');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data).toHaveLength(2);

    // Each pay run should have an employees array enriched with names
    const first = body.data[0];
    expect(first.employees).toHaveLength(1);
    expect(first.employees[0]).toHaveProperty('employeeName');
    expect(first.employees[0]).toHaveProperty('gross');
    expect(first.employees[0]).toHaveProperty('tax');
    expect(first.employees[0]).toHaveProperty('net');
  });

  // ── 8. Get by ID ───────────────────────────────────────────────────────────
  it('GET /api/pay-runs/:id returns pay run with payslips', async () => {
    const createRes = await req('POST', '/api/pay-runs', {
      payPeriodStart: '2024-01-01',
      payPeriodEnd: '2024-01-31',
      payDate: '2024-01-31',
      employeeIds: ['emp-1', 'emp-2'],
    });
    const { data: pr } = await createRes.json();

    const res = await req('GET', `/api/pay-runs/${pr.id}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.id).toBe(pr.id);
    expect(body.data.periodStart).toBe('2024-01-01');
    expect(body.data.periodEnd).toBe('2024-01-31');
    expect(body.data.payDate).toBe('2024-01-31');
    expect(body.data.status).toBe('draft');
    expect(body.data.payslips).toHaveLength(2);
    expect(body.data.employees).toHaveLength(2);

    // Verify employee enrichment in the detail view
    const emmaEntry = body.data.employees.find(
      (e: { employeeId: string }) => e.employeeId === 'emp-1',
    );
    expect(emmaEntry.employeeName).toBe('Emma Stone');
    expect(emmaEntry.gross).toBe(emp1Expected.grossPay);
  });

  // ── 9. Get non-existent ────────────────────────────────────────────────────
  it('GET /api/pay-runs/:id for non-existent ID returns 404', async () => {
    const res = await req('GET', '/api/pay-runs/nonexistent-id');
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain('not found');
  });

  // ── 10. Post (finalize) a draft ────────────────────────────────────────────
  it('PUT /api/pay-runs/:id/post changes status from draft to posted', async () => {
    const createRes = await req('POST', '/api/pay-runs', {
      payPeriodStart: '2024-01-01',
      payPeriodEnd: '2024-01-31',
      payDate: '2024-01-31',
      employeeIds: ['emp-1'],
    });
    const { data: pr } = await createRes.json();
    expect(pr.status).toBe('draft');

    const res = await req('PUT', `/api/pay-runs/${pr.id}/post`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe('posted');

    // Payslips should still be attached
    expect(body.data.payslips).toHaveLength(1);
  });

  // ── 11. Post already-posted ────────────────────────────────────────────────
  it('PUT /api/pay-runs/:id/post on already-posted run returns 400', async () => {
    const createRes = await req('POST', '/api/pay-runs', {
      payPeriodStart: '2024-01-01',
      payPeriodEnd: '2024-01-31',
      payDate: '2024-01-31',
    });
    const { data: pr } = await createRes.json();

    // First post succeeds
    const postRes = await req('PUT', `/api/pay-runs/${pr.id}/post`);
    expect(postRes.status).toBe(200);

    // Second post fails
    const res = await req('PUT', `/api/pay-runs/${pr.id}/post`);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain('Already posted');
  });

  // ── 12. Post non-existent ──────────────────────────────────────────────────
  it('PUT /api/pay-runs/:id/post for non-existent ID returns 404', async () => {
    const res = await req('PUT', '/api/pay-runs/nonexistent-id/post');
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain('not found');
  });

  // ── 13. Verify payslip calculations ────────────────────────────────────────
  it('payslip calculations match NZ PAYE brackets exactly', async () => {
    const createRes = await req('POST', '/api/pay-runs', {
      payPeriodStart: '2024-01-01',
      payPeriodEnd: '2024-01-31',
      payDate: '2024-01-31',
      employeeIds: ['emp-1', 'emp-2'],
    });
    const { data: pr } = await createRes.json();

    // Fetch full pay run with payslips
    const detailRes = await req('GET', `/api/pay-runs/${pr.id}`);
    const { data } = await detailRes.json();

    // ── Employee 1: $85,000 salary ──
    // Annual PAYE: 14000*0.105 + 34000*0.175 + 22000*0.30 + 15000*0.33
    //            = 1470 + 5950 + 6600 + 4950 = 18970
    // Monthly gross = round(85000/12 * 100)/100 = 7083.33
    // Monthly PAYE  = round(18970/12 * 100)/100 = 1580.83
    // KiwiSaver emp = round(7083.33*0.03 * 100)/100 = 212.50
    // NetPay        = round((7083.33 - 1580.83 - 212.50)*100)/100 = 5290.00

    const slip1 = data.payslips.find(
      (s: { employeeId: string }) => s.employeeId === 'emp-1',
    );
    expect(slip1.grossPay).toBe(7083.33);
    expect(slip1.paye).toBe(1580.83);
    expect(slip1.kiwiSaverEmployee).toBe(212.5);
    expect(slip1.kiwiSaverEmployer).toBe(212.5);
    expect(slip1.netPay).toBe(5290);

    // ── Employee 2: $95,000 salary ──
    // Annual PAYE: 14000*0.105 + 34000*0.175 + 22000*0.30 + 25000*0.33
    //            = 1470 + 5950 + 6600 + 8250 = 22270
    // Monthly gross = round(95000/12 * 100)/100 = 7916.67
    // Monthly PAYE  = round(22270/12 * 100)/100 = 1855.83
    // KiwiSaver emp = round(7916.67*0.03 * 100)/100 = 237.50
    // NetPay        = round((7916.67 - 1855.83 - 237.50)*100)/100 = 5823.34

    const slip2 = data.payslips.find(
      (s: { employeeId: string }) => s.employeeId === 'emp-2',
    );
    expect(slip2.grossPay).toBe(7916.67);
    expect(slip2.paye).toBe(1855.83);
    expect(slip2.kiwiSaverEmployee).toBe(237.5);
    expect(slip2.kiwiSaverEmployer).toBe(237.5);
    expect(slip2.netPay).toBe(5823.34);

    // ── Totals ──
    expect(data.totalGross).toBe(15000);
    expect(data.totalTax).toBe(3436.66);
    expect(data.totalNet).toBe(11113.34);

    // Verify the identity: netPay = grossPay - paye - kiwiSaverEmployee for each
    for (const slip of data.payslips) {
      const expectedNet = Math.round((slip.grossPay - slip.paye - slip.kiwiSaverEmployee) * 100) / 100;
      expect(slip.netPay).toBe(expectedNet);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// BANK TRANSACTIONS — Comprehensive CRUD + Validation
// ═══════════════════════════════════════════════════════════════════════════════

describe('Bank Transactions CRUD', () => {
  const BANK_ACCOUNT_ID = 'bank-acc-1';

  // No actual account seed required — bankTransactions.accountId is a plain text
  // field with no FK constraint. We use a consistent ID for clarity.

  // ── 1. Create with valid data ──────────────────────────────────────────────
  it('POST /api/bank-transactions with valid data returns 201', async () => {
    const res = await req('POST', '/api/bank-transactions', {
      accountId: BANK_ACCOUNT_ID,
      date: '2024-03-15',
      description: 'Client payment from Acme Corp',
      amount: 2500.50,
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.accountId).toBe(BANK_ACCOUNT_ID);
    expect(body.data.date).toBe('2024-03-15');
    expect(body.data.description).toBe('Client payment from Acme Corp');
    expect(body.data.amount).toBe(2500.5);
    expect(body.data.isReconciled).toBe(false);
    expect(typeof body.data.id).toBe('string');
    expect(body.data.id.length).toBeGreaterThan(0);
  });

  // ── 2. Missing accountId ───────────────────────────────────────────────────
  it('POST /api/bank-transactions with missing accountId returns 400', async () => {
    const res = await req('POST', '/api/bank-transactions', {
      date: '2024-03-15',
      amount: 1000,
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain('accountId');
  });

  // ── 3. Missing date ────────────────────────────────────────────────────────
  it('POST /api/bank-transactions with missing date returns 400', async () => {
    const res = await req('POST', '/api/bank-transactions', {
      accountId: BANK_ACCOUNT_ID,
      amount: 1000,
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain('date');
  });

  // ── 4. Missing amount ──────────────────────────────────────────────────────
  it('POST /api/bank-transactions with missing amount returns 400', async () => {
    const res = await req('POST', '/api/bank-transactions', {
      accountId: BANK_ACCOUNT_ID,
      date: '2024-03-15',
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain('amount');
  });

  // ── 5. Get list ────────────────────────────────────────────────────────────
  it('GET /api/bank-transactions returns all created transactions', async () => {
    // Create 3 transactions with specific amounts
    await req('POST', '/api/bank-transactions', {
      accountId: BANK_ACCOUNT_ID,
      date: '2024-03-01',
      description: 'Opening balance',
      amount: 10000,
    });
    await req('POST', '/api/bank-transactions', {
      accountId: BANK_ACCOUNT_ID,
      date: '2024-03-05',
      description: 'Rent payment',
      amount: -2500,
    });
    await req('POST', '/api/bank-transactions', {
      accountId: BANK_ACCOUNT_ID,
      date: '2024-03-10',
      description: 'Invoice payment received',
      amount: 4200,
    });

    const res = await req('GET', '/api/bank-transactions');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data).toHaveLength(3);

    // Verify amounts are preserved exactly
    const amounts = body.data.map((t: { amount: number }) => t.amount).sort((a: number, b: number) => a - b);
    expect(amounts).toEqual([-2500, 4200, 10000]);
  });

  // ── 6. Get by ID ───────────────────────────────────────────────────────────
  it('GET /api/bank-transactions/:id returns a single transaction', async () => {
    const createRes = await req('POST', '/api/bank-transactions', {
      accountId: BANK_ACCOUNT_ID,
      date: '2024-03-20',
      description: 'Consulting fee',
      amount: 3750,
      reference: 'INV-001',
    });
    const { data: tx } = await createRes.json();

    const res = await req('GET', `/api/bank-transactions/${tx.id}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.id).toBe(tx.id);
    expect(body.data.accountId).toBe(BANK_ACCOUNT_ID);
    expect(body.data.date).toBe('2024-03-20');
    expect(body.data.description).toBe('Consulting fee');
    expect(body.data.amount).toBe(3750);
    expect(body.data.isReconciled).toBe(false);
  });

  // ── 7. Get non-existent ────────────────────────────────────────────────────
  it('GET /api/bank-transactions/:id for non-existent ID returns 404', async () => {
    const res = await req('GET', '/api/bank-transactions/nonexistent-tx-id');
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain('not found');
  });

  // ── 8. Reconcile a transaction ─────────────────────────────────────────────
  it('PUT /api/bank-transactions/:id/reconcile sets isReconciled to true', async () => {
    const createRes = await req('POST', '/api/bank-transactions', {
      accountId: BANK_ACCOUNT_ID,
      date: '2024-03-15',
      description: 'Client payment',
      amount: 1500,
    });
    const { data: tx } = await createRes.json();
    expect(tx.isReconciled).toBe(false);

    const res = await req('PUT', `/api/bank-transactions/${tx.id}/reconcile`, {
      category: 'Sales Revenue',
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.isReconciled).toBe(true);
    expect(body.data.category).toBe('Sales Revenue');

    // Verify via GET
    const getRes = await req('GET', `/api/bank-transactions/${tx.id}`);
    const getBody = await getRes.json();
    expect(getBody.data.isReconciled).toBe(true);
    expect(getBody.data.category).toBe('Sales Revenue');
  });

  // ── 9. Reconcile already-reconciled ────────────────────────────────────────
  it('PUT /api/bank-transactions/:id/reconcile on already-reconciled returns 400', async () => {
    const createRes = await req('POST', '/api/bank-transactions', {
      accountId: BANK_ACCOUNT_ID,
      date: '2024-03-15',
      amount: 800,
    });
    const { data: tx } = await createRes.json();

    // First reconcile succeeds
    const firstRes = await req('PUT', `/api/bank-transactions/${tx.id}/reconcile`, {});
    expect(firstRes.status).toBe(200);

    // Second reconcile fails
    const res = await req('PUT', `/api/bank-transactions/${tx.id}/reconcile`, {});
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain('Already reconciled');
  });

  // ── 10. Delete a transaction ───────────────────────────────────────────────
  it('DELETE /api/bank-transactions/:id removes the transaction', async () => {
    const createRes = await req('POST', '/api/bank-transactions', {
      accountId: BANK_ACCOUNT_ID,
      date: '2024-03-15',
      description: 'To be deleted',
      amount: 999,
    });
    const { data: tx } = await createRes.json();

    // Confirm it exists
    const existsRes = await req('GET', `/api/bank-transactions/${tx.id}`);
    expect(existsRes.status).toBe(200);

    // Delete it
    const delRes = await req('DELETE', `/api/bank-transactions/${tx.id}`);
    expect(delRes.status).toBe(200);
    const delBody = await delRes.json();
    expect(delBody.ok).toBe(true);
    expect(delBody.data.id).toBe(tx.id);

    // Verify it's gone
    const goneRes = await req('GET', `/api/bank-transactions/${tx.id}`);
    expect(goneRes.status).toBe(404);
    const goneBody = await goneRes.json();
    expect(goneBody.ok).toBe(false);
  });

  // ── Additional: filter by accountId ────────────────────────────────────────
  it('GET /api/bank-transactions?accountId filters by account', async () => {
    await req('POST', '/api/bank-transactions', {
      accountId: 'acc-A',
      date: '2024-03-01',
      amount: 500,
    });
    await req('POST', '/api/bank-transactions', {
      accountId: 'acc-B',
      date: '2024-03-01',
      amount: 700,
    });
    await req('POST', '/api/bank-transactions', {
      accountId: 'acc-A',
      date: '2024-03-02',
      amount: 300,
    });

    const res = await req('GET', '/api/bank-transactions?accountId=acc-A');
    const body = await res.json();
    expect(body.data).toHaveLength(2);
    const totalAmount = body.data.reduce((sum: number, t: { amount: number }) => sum + t.amount, 0);
    expect(totalAmount).toBe(800); // 500 + 300
  });

  // ── Additional: negative amount (spend) ────────────────────────────────────
  it('POST /api/bank-transactions supports negative amount for spend', async () => {
    const res = await req('POST', '/api/bank-transactions', {
      accountId: BANK_ACCOUNT_ID,
      date: '2024-03-15',
      description: 'Office supplies',
      amount: -450.75,
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.amount).toBe(-450.75);
  });

  // ── Additional: reconcile with category and verify persisted state ────────
  it('PUT /api/bank-transactions/:id/reconcile preserves category on reconciled tx', async () => {
    const createRes = await req('POST', '/api/bank-transactions', {
      accountId: BANK_ACCOUNT_ID,
      date: '2024-03-15',
      amount: 1200,
    });
    const { data: tx } = await createRes.json();

    const res = await req('PUT', `/api/bank-transactions/${tx.id}/reconcile`, {
      category: 'Accounts Receivable',
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.isReconciled).toBe(true);
    expect(body.data.category).toBe('Accounts Receivable');

    // Verify the state persists via GET
    const getRes = await req('GET', `/api/bank-transactions/${tx.id}`);
    const getBody = await getRes.json();
    expect(getBody.data.isReconciled).toBe(true);
    expect(getBody.data.category).toBe('Accounts Receivable');
    expect(getBody.data.amount).toBe(1200);
  });

  // ── Additional: delete non-existent ────────────────────────────────────────
  it('DELETE /api/bank-transactions/:id for non-existent ID returns 404', async () => {
    const res = await req('DELETE', '/api/bank-transactions/no-such-id');
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  // ── Additional: reconcile non-existent ─────────────────────────────────────
  it('PUT /api/bank-transactions/:id/reconcile for non-existent ID returns 404', async () => {
    const res = await req('PUT', '/api/bank-transactions/no-such-id/reconcile', {});
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });
});
