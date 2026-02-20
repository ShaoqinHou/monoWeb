import { describe, it, expect } from 'vitest';
import { JournalSchema, CreateJournalSchema, JournalLineSchema } from '../schemas/journal';
import { BankTransactionSchema, CreateBankTransactionSchema, ImportBankTransactionsSchema } from '../schemas/bank-transaction';
import { EmployeeSchema, CreateEmployeeSchema } from '../schemas/employee';
import { ExpenseSchema, CreateExpenseSchema, ExpenseStatus } from '../schemas/expense';
import { ProjectSchema, CreateProjectSchema } from '../schemas/project';
import { PayRunSchema, CreatePayRunSchema, PayslipSchema } from '../schemas/pay-run';
import { TimesheetSchema, CreateTimesheetSchema } from '../schemas/timesheet';
import { ProductSchema, CreateProductSchema, StockAdjustmentSchema, StockMovementSchema } from '../schemas/product';
import { TrackingCategorySchema, CreateTrackingCategorySchema, TrackingOptionSchema } from '../schemas/tracking-category';

// ── JournalSchema ──

describe('JournalSchema', () => {
  const validJournal = {
    id: 'j-1',
    date: '2026-01-15',
    narration: 'Test journal entry',
    status: 'draft' as const,
    lines: [
      { id: 'l1', accountId: 'a1', accountName: 'Cash', description: 'Debit', debit: 100, credit: 0 },
      { id: 'l2', accountId: 'a2', accountName: 'Revenue', description: 'Credit', debit: 0, credit: 100 },
    ],
  };

  it('accepts a valid journal', () => {
    const result = JournalSchema.safeParse(validJournal);
    expect(result.success).toBe(true);
  });

  it('rejects empty narration', () => {
    const result = JournalSchema.safeParse({ ...validJournal, narration: '' });
    expect(result.success).toBe(false);
  });

  it('requires at least 2 lines', () => {
    const result = JournalSchema.safeParse({
      ...validJournal,
      lines: [validJournal.lines[0]],
    });
    expect(result.success).toBe(false);
  });

  it('validates all journal statuses', () => {
    for (const status of ['draft', 'posted', 'voided'] as const) {
      const result = JournalSchema.safeParse({ ...validJournal, status });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid status', () => {
    const result = JournalSchema.safeParse({ ...validJournal, status: 'cancelled' });
    expect(result.success).toBe(false);
  });

  it('rejects negative debit in line', () => {
    const result = JournalLineSchema.safeParse({
      id: 'l1', accountId: 'a1', accountName: 'Cash', description: 'Bad', debit: -50, credit: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative credit in line', () => {
    const result = JournalLineSchema.safeParse({
      id: 'l1', accountId: 'a1', accountName: 'Cash', description: 'Bad', debit: 0, credit: -50,
    });
    expect(result.success).toBe(false);
  });
});

describe('CreateJournalSchema', () => {
  it('defaults status to draft', () => {
    const result = CreateJournalSchema.parse({
      date: '2026-01-15',
      narration: 'New journal',
      lines: [
        { accountId: 'a1', accountName: 'Cash', description: 'D', debit: 100, credit: 0 },
        { accountId: 'a2', accountName: 'Rev', description: 'C', debit: 0, credit: 100 },
      ],
    });
    expect(result.status).toBe('draft');
  });

  it('allows lines without id', () => {
    const result = CreateJournalSchema.safeParse({
      date: '2026-01-15',
      narration: 'New journal',
      lines: [
        { accountId: 'a1', accountName: 'Cash', description: 'D', debit: 100, credit: 0 },
        { accountId: 'a2', accountName: 'Rev', description: 'C', debit: 0, credit: 100 },
      ],
    });
    expect(result.success).toBe(true);
  });
});

// ── BankTransactionSchema ──

describe('BankTransactionSchema', () => {
  const validTx = {
    id: 'tx-1',
    accountId: 'acc-1',
    date: '2026-01-15',
    description: 'Office supplies',
    amount: -250,
    isReconciled: false,
  };

  it('accepts a valid bank transaction', () => {
    const result = BankTransactionSchema.safeParse(validTx);
    expect(result.success).toBe(true);
  });

  it('accepts negative amounts (outflows)', () => {
    const result = BankTransactionSchema.safeParse({ ...validTx, amount: -1500 });
    expect(result.success).toBe(true);
  });

  it('accepts positive amounts (inflows)', () => {
    const result = BankTransactionSchema.safeParse({ ...validTx, amount: 3000 });
    expect(result.success).toBe(true);
  });

  it('accepts nullable match fields', () => {
    const result = BankTransactionSchema.safeParse({
      ...validTx,
      matchedInvoiceId: null,
      matchedBillId: null,
      matchedPaymentId: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts matched invoice', () => {
    const result = BankTransactionSchema.safeParse({
      ...validTx,
      isReconciled: true,
      matchedInvoiceId: 'inv-1',
    });
    expect(result.success).toBe(true);
  });
});

describe('CreateBankTransactionSchema', () => {
  it('omits id, reconciliation, and match fields', () => {
    const result = CreateBankTransactionSchema.safeParse({
      accountId: 'acc-1',
      date: '2026-01-15',
      description: 'Purchase',
      amount: -100,
    });
    expect(result.success).toBe(true);
  });
});

describe('ImportBankTransactionsSchema', () => {
  it('accepts valid import batch', () => {
    const result = ImportBankTransactionsSchema.safeParse({
      accountId: 'acc-1',
      transactions: [
        { date: '2026-01-15', description: 'Payment', amount: 1000 },
        { date: '2026-01-16', description: 'Purchase', amount: -500 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty transactions array', () => {
    const result = ImportBankTransactionsSchema.safeParse({
      accountId: 'acc-1',
      transactions: [],
    });
    expect(result.success).toBe(true);
  });
});

// ── EmployeeSchema ──

describe('EmployeeSchema', () => {
  const validEmployee = {
    id: 'emp-1',
    firstName: 'Jane',
    lastName: 'Smith',
    startDate: '2025-01-15',
    salary: 85000,
    payFrequency: 'monthly' as const,
    taxCode: 'M',
    isActive: true,
  };

  it('accepts a valid employee', () => {
    const result = EmployeeSchema.safeParse(validEmployee);
    expect(result.success).toBe(true);
  });

  it('rejects empty first name', () => {
    const result = EmployeeSchema.safeParse({ ...validEmployee, firstName: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty last name', () => {
    const result = EmployeeSchema.safeParse({ ...validEmployee, lastName: '' });
    expect(result.success).toBe(false);
  });

  it('rejects negative salary', () => {
    const result = EmployeeSchema.safeParse({ ...validEmployee, salary: -1000 });
    expect(result.success).toBe(false);
  });

  it('accepts zero salary', () => {
    const result = EmployeeSchema.safeParse({ ...validEmployee, salary: 0 });
    expect(result.success).toBe(true);
  });

  it('validates all pay frequencies', () => {
    for (const freq of ['weekly', 'fortnightly', 'monthly'] as const) {
      const result = EmployeeSchema.safeParse({ ...validEmployee, payFrequency: freq });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid pay frequency', () => {
    const result = EmployeeSchema.safeParse({ ...validEmployee, payFrequency: 'daily' });
    expect(result.success).toBe(false);
  });
});

describe('CreateEmployeeSchema', () => {
  it('defaults isActive to true', () => {
    const result = CreateEmployeeSchema.parse({
      firstName: 'New',
      lastName: 'Hire',
      startDate: '2026-03-01',
      salary: 65000,
      payFrequency: 'fortnightly',
      taxCode: 'M',
    });
    expect(result.isActive).toBe(true);
  });
});

// ── ExpenseSchema ──

describe('ExpenseSchema', () => {
  const validExpense = {
    id: 'exp-1',
    employeeId: 'emp-1',
    contactId: null,
    date: '2026-01-15',
    description: 'Flight to Auckland',
    amount: 350,
    taxRate: 15,
    taxAmount: 52.5,
    total: 402.5,
    category: 'travel',
    receiptUrl: null,
    status: 'draft' as const,
    accountCode: null,
    notes: null,
    mileageKm: null,
    mileageRate: null,
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
  };

  it('accepts a valid expense', () => {
    const result = ExpenseSchema.safeParse(validExpense);
    expect(result.success).toBe(true);
  });

  it('defaults status to draft', () => {
    const result = ExpenseSchema.parse({ ...validExpense, status: undefined });
    expect(result.status).toBe('draft');
  });

  it('validates all expense statuses', () => {
    for (const status of ['draft', 'submitted', 'approved', 'reimbursed', 'declined'] as const) {
      expect(ExpenseStatus.safeParse(status).success).toBe(true);
    }
  });

  it('rejects invalid status', () => {
    expect(ExpenseStatus.safeParse('cancelled').success).toBe(false);
  });
});

describe('CreateExpenseSchema', () => {
  it('allows zero amount', () => {
    const result = CreateExpenseSchema.safeParse({
      date: '2026-01-15',
      description: 'Zero expense',
      amount: 0,
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative amount', () => {
    const result = CreateExpenseSchema.safeParse({
      date: '2026-01-15',
      description: 'Negative',
      amount: -50,
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty description', () => {
    const result = CreateExpenseSchema.safeParse({
      date: '2026-01-15',
      description: '',
      amount: 100,
    });
    expect(result.success).toBe(false);
  });

  it('defaults tax rate to 15', () => {
    const result = CreateExpenseSchema.parse({
      date: '2026-01-15',
      description: 'Office supplies',
      amount: 50,
    });
    expect(result.taxRate).toBe(15);
  });
});

// ── ProjectSchema ──

describe('ProjectSchema', () => {
  const validProject = {
    id: 'proj-1',
    name: 'Website Redesign',
    status: 'in_progress' as const,
  };

  it('accepts a valid project', () => {
    const result = ProjectSchema.safeParse(validProject);
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = ProjectSchema.safeParse({ ...validProject, name: '' });
    expect(result.success).toBe(false);
  });

  it('validates all project statuses', () => {
    for (const status of ['in_progress', 'completed', 'closed'] as const) {
      expect(ProjectSchema.safeParse({ ...validProject, status }).success).toBe(true);
    }
  });

  it('rejects invalid status', () => {
    expect(ProjectSchema.safeParse({ ...validProject, status: 'paused' }).success).toBe(false);
  });
});

describe('CreateProjectSchema', () => {
  it('defaults status to in_progress', () => {
    const result = CreateProjectSchema.parse({ name: 'New Project' });
    expect(result.status).toBe('in_progress');
  });
});

// ── PayRunSchema ──

describe('PayRunSchema', () => {
  const validPayRun = {
    id: 'pr-1',
    payPeriodStart: '2026-01-01',
    payPeriodEnd: '2026-01-31',
    payDate: '2026-02-01',
    status: 'draft' as const,
    totalGross: 50000,
    totalTax: 12500,
    totalNet: 37500,
  };

  it('accepts a valid pay run', () => {
    const result = PayRunSchema.safeParse(validPayRun);
    expect(result.success).toBe(true);
  });

  it('validates pay run statuses', () => {
    for (const status of ['draft', 'posted'] as const) {
      expect(PayRunSchema.safeParse({ ...validPayRun, status }).success).toBe(true);
    }
  });

  it('accepts optional payslips', () => {
    const result = PayRunSchema.safeParse({
      ...validPayRun,
      payslips: [{
        id: 'ps-1',
        payRunId: 'pr-1',
        employeeId: 'emp-1',
        grossPay: 5000,
        paye: 1250,
        kiwiSaverEmployee: 150,
        kiwiSaverEmployer: 150,
        netPay: 3600,
      }],
    });
    expect(result.success).toBe(true);
  });
});

describe('CreatePayRunSchema', () => {
  it('requires at least one employee', () => {
    const result = CreatePayRunSchema.safeParse({
      payPeriodStart: '2026-01-01',
      payPeriodEnd: '2026-01-31',
      payDate: '2026-02-01',
      employeeIds: [],
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid create input', () => {
    const result = CreatePayRunSchema.safeParse({
      payPeriodStart: '2026-01-01',
      payPeriodEnd: '2026-01-31',
      payDate: '2026-02-01',
      employeeIds: ['emp-1', 'emp-2'],
    });
    expect(result.success).toBe(true);
  });
});

// ── TimesheetSchema ──

describe('TimesheetSchema', () => {
  const validTimesheet = {
    id: 'ts-1',
    projectId: 'proj-1',
    date: '2026-01-15',
    hours: 8,
    description: 'Frontend development',
    isBillable: true,
    isInvoiced: false,
    hourlyRate: 150,
  };

  it('accepts a valid timesheet', () => {
    const result = TimesheetSchema.safeParse(validTimesheet);
    expect(result.success).toBe(true);
  });

  it('rejects negative hours', () => {
    const result = TimesheetSchema.safeParse({ ...validTimesheet, hours: -1 });
    expect(result.success).toBe(false);
  });

  it('accepts zero hours', () => {
    const result = TimesheetSchema.safeParse({ ...validTimesheet, hours: 0 });
    expect(result.success).toBe(true);
  });

  it('rejects negative hourly rate', () => {
    const result = TimesheetSchema.safeParse({ ...validTimesheet, hourlyRate: -50 });
    expect(result.success).toBe(false);
  });
});

describe('CreateTimesheetSchema', () => {
  it('defaults isBillable to true', () => {
    const result = CreateTimesheetSchema.parse({
      projectId: 'proj-1',
      date: '2026-01-15',
      hours: 4,
      description: 'Work',
      hourlyRate: 100,
    });
    expect(result.isBillable).toBe(true);
  });

  it('omits isInvoiced from create', () => {
    const result = CreateTimesheetSchema.safeParse({
      projectId: 'proj-1',
      date: '2026-01-15',
      hours: 4,
      description: 'Work',
      hourlyRate: 100,
      isInvoiced: true, // should be stripped
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect('isInvoiced' in result.data).toBe(false);
    }
  });
});

// ── ProductSchema ──

describe('ProductSchema', () => {
  const validProduct = {
    id: 'prod-1',
    code: 'WID-001',
    name: 'Widget',
    description: null,
    purchasePrice: 25,
    salePrice: 50,
    accountCode: null,
    taxRate: 15,
    isTracked: true,
    quantityOnHand: 100,
    isSold: true,
    isPurchased: true,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  it('accepts a valid product', () => {
    const result = ProductSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });
});

describe('CreateProductSchema', () => {
  it('rejects empty code', () => {
    const result = CreateProductSchema.safeParse({ code: '', name: 'Widget' });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = CreateProductSchema.safeParse({ code: 'WID-001', name: '' });
    expect(result.success).toBe(false);
  });

  it('defaults numeric fields', () => {
    const result = CreateProductSchema.parse({ code: 'NEW-001', name: 'New Product' });
    expect(result.purchasePrice).toBe(0);
    expect(result.salePrice).toBe(0);
    expect(result.taxRate).toBe(15);
    expect(result.quantityOnHand).toBe(0);
    expect(result.isTracked).toBe(false);
    expect(result.isSold).toBe(true);
    expect(result.isPurchased).toBe(true);
  });
});

describe('StockAdjustmentSchema', () => {
  it('accepts valid stock adjustment', () => {
    const result = StockAdjustmentSchema.safeParse({
      quantity: 10,
      reason: 'stock_take',
    });
    expect(result.success).toBe(true);
  });

  it('accepts negative quantity (reduction)', () => {
    const result = StockAdjustmentSchema.safeParse({
      quantity: -5,
      reason: 'damaged',
    });
    expect(result.success).toBe(true);
  });

  it('validates all adjustment reasons', () => {
    for (const reason of ['stock_take', 'damaged', 'returned', 'other'] as const) {
      expect(StockAdjustmentSchema.safeParse({ quantity: 1, reason }).success).toBe(true);
    }
  });

  it('rejects invalid reason', () => {
    expect(StockAdjustmentSchema.safeParse({ quantity: 1, reason: 'stolen' }).success).toBe(false);
  });
});

// ── TrackingCategorySchema ──

describe('TrackingCategorySchema', () => {
  const validCategory = {
    id: 'tc-1',
    name: 'Region',
    options: [
      { id: 'opt-1', name: 'North', isActive: true },
      { id: 'opt-2', name: 'South', isActive: true },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  it('accepts a valid tracking category', () => {
    const result = TrackingCategorySchema.safeParse(validCategory);
    expect(result.success).toBe(true);
  });

  it('accepts empty options array', () => {
    const result = TrackingCategorySchema.safeParse({ ...validCategory, options: [] });
    expect(result.success).toBe(true);
  });
});

describe('CreateTrackingCategorySchema', () => {
  it('rejects empty name', () => {
    const result = CreateTrackingCategorySchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('defaults options to empty array', () => {
    const result = CreateTrackingCategorySchema.parse({ name: 'Department' });
    expect(result.options).toEqual([]);
  });
});

describe('TrackingOptionSchema', () => {
  it('defaults isActive to true', () => {
    const result = TrackingOptionSchema.parse({ id: 'opt-1', name: 'Option A' });
    expect(result.isActive).toBe(true);
  });
});

// ── PayslipSchema ──

describe('PayslipSchema', () => {
  it('accepts a valid payslip', () => {
    const result = PayslipSchema.safeParse({
      id: 'ps-1',
      payRunId: 'pr-1',
      employeeId: 'emp-1',
      grossPay: 7916.67,
      paye: 1979.17,
      kiwiSaverEmployee: 237.5,
      kiwiSaverEmployer: 237.5,
      netPay: 5700,
    });
    expect(result.success).toBe(true);
  });
});
