import { describe, it, expect } from 'vitest';
import { ContactSchema, CreateContactSchema } from '../schemas/contact';
import { InvoiceSchema, CreateInvoiceSchema, InvoiceStatus } from '../schemas/invoice';
import { BillSchema, CreateBillSchema, BillStatus } from '../schemas/bill';
import { LineItemSchema, CreateLineItemSchema } from '../schemas/line-item';
import { PaymentSchema, CreatePaymentSchema } from '../schemas/payment';
import { AccountSchema, AccountType } from '../schemas/account';
import { TaxRateSchema, NZ_TAX_RATES } from '../schemas/tax-rate';
import { JournalSchema, CreateJournalSchema, JournalLineSchema } from '../schemas/journal';
import { EmployeeSchema, CreateEmployeeSchema } from '../schemas/employee';
import { ExpenseSchema, CreateExpenseSchema, ExpenseStatus } from '../schemas/expense';
import { ProductSchema, CreateProductSchema, StockAdjustmentSchema } from '../schemas/product';
import { ProjectSchema, CreateProjectSchema } from '../schemas/project';
import { TimesheetSchema, CreateTimesheetSchema } from '../schemas/timesheet';
import { BankTransactionSchema, CreateBankTransactionSchema, ImportBankTransactionsSchema } from '../schemas/bank-transaction';
import { PayRunSchema, CreatePayRunSchema, PayslipSchema } from '../schemas/pay-run';
import { TrackingCategorySchema, CreateTrackingCategorySchema } from '../schemas/tracking-category';

describe('ContactSchema', () => {
  const validContact = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Acme Corp',
    type: 'customer' as const,
    email: 'info@acme.com',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  };

  it('accepts a valid contact', () => {
    const result = ContactSchema.safeParse(validContact);
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = ContactSchema.safeParse({ ...validContact, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = ContactSchema.safeParse({ ...validContact, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('defaults outstandingBalance to 0', () => {
    const result = ContactSchema.parse(validContact);
    expect(result.outstandingBalance).toBe(0);
  });

  it('accepts all contact types', () => {
    for (const type of ['customer', 'supplier', 'customer_and_supplier'] as const) {
      const result = ContactSchema.safeParse({ ...validContact, type });
      expect(result.success).toBe(true);
    }
  });
});

describe('CreateContactSchema', () => {
  it('does not require id, timestamps, or balances', () => {
    const result = CreateContactSchema.safeParse({
      name: 'Test Contact',
      type: 'customer',
    });
    expect(result.success).toBe(true);
  });

  it('requires name', () => {
    const result = CreateContactSchema.safeParse({ type: 'customer' });
    expect(result.success).toBe(false);
  });
});

describe('InvoiceSchema', () => {
  const validInvoice = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    contactId: '550e8400-e29b-41d4-a716-446655440001',
    date: '2024-01-15',
    dueDate: '2024-02-14',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  };

  it('accepts a valid invoice with defaults', () => {
    const result = InvoiceSchema.parse(validInvoice);
    expect(result.status).toBe('draft');
    expect(result.amountType).toBe('exclusive');
    expect(result.currency).toBe('NZD');
    expect(result.lineItems).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('validates all invoice statuses', () => {
    for (const status of ['draft', 'submitted', 'approved', 'paid', 'voided'] as const) {
      const result = InvoiceStatus.safeParse(status);
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid status', () => {
    const result = InvoiceStatus.safeParse('cancelled');
    expect(result.success).toBe(false);
  });
});

describe('CreateInvoiceSchema', () => {
  it('requires at least one line item', () => {
    const result = CreateInvoiceSchema.safeParse({
      contactId: '550e8400-e29b-41d4-a716-446655440001',
      date: '2024-01-15',
      dueDate: '2024-02-14',
      lineItems: [],
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid create input', () => {
    const result = CreateInvoiceSchema.safeParse({
      contactId: '550e8400-e29b-41d4-a716-446655440001',
      date: '2024-01-15',
      dueDate: '2024-02-14',
      lineItems: [{ description: 'Widget', quantity: 2, unitPrice: 50 }],
    });
    expect(result.success).toBe(true);
  });
});

describe('BillSchema', () => {
  it('has same structure as invoice', () => {
    const validBill = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      contactId: '550e8400-e29b-41d4-a716-446655440001',
      date: '2024-01-15',
      dueDate: '2024-02-14',
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
    };
    const result = BillSchema.parse(validBill);
    expect(result.status).toBe('draft');
    expect(result.total).toBe(0);
  });

  it('validates bill statuses', () => {
    for (const status of ['draft', 'submitted', 'approved', 'paid', 'voided'] as const) {
      expect(BillStatus.safeParse(status).success).toBe(true);
    }
  });
});

describe('LineItemSchema', () => {
  it('accepts valid line item', () => {
    const result = LineItemSchema.parse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      description: 'Widget',
      quantity: 2,
      unitPrice: 50,
    });
    expect(result.taxRate).toBe(15);
    expect(result.discount).toBe(0);
  });

  it('rejects negative quantity', () => {
    const result = LineItemSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      quantity: -1,
      unitPrice: 50,
    });
    expect(result.success).toBe(false);
  });
});

describe('PaymentSchema', () => {
  it('rejects negative amount', () => {
    const result = PaymentSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      amount: -100,
      date: '2024-01-15',
      createdAt: '2024-01-15T00:00:00Z',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid payment', () => {
    const result = PaymentSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      invoiceId: '550e8400-e29b-41d4-a716-446655440001',
      amount: 100,
      date: '2024-01-15',
      createdAt: '2024-01-15T00:00:00Z',
    });
    expect(result.success).toBe(true);
  });
});

describe('AccountSchema', () => {
  it('accepts all account types', () => {
    for (const type of ['revenue', 'expense', 'asset', 'liability', 'equity'] as const) {
      expect(AccountType.safeParse(type).success).toBe(true);
    }
  });
});

describe('TaxRateSchema', () => {
  it('validates NZ tax rates', () => {
    for (const rate of NZ_TAX_RATES) {
      expect(TaxRateSchema.safeParse(rate).success).toBe(true);
    }
  });

  it('rejects rate over 100', () => {
    expect(TaxRateSchema.safeParse({ name: 'Bad', rate: 150 }).success).toBe(false);
  });
});

// ── JournalSchema ──────────────────────────────────────────────────────

describe('JournalSchema', () => {
  const validLine = { id: 'l1', accountId: 'a1', accountName: 'Sales', description: 'Rev', debit: 100, credit: 0 };
  const validLine2 = { id: 'l2', accountId: 'a2', accountName: 'Bank', description: 'Cash', debit: 0, credit: 100 };

  const validJournal = {
    id: 'j1',
    date: '2024-03-01',
    narration: 'Revenue recognition',
    status: 'draft' as const,
    lines: [validLine, validLine2],
  };

  it('accepts a valid journal', () => {
    expect(JournalSchema.safeParse(validJournal).success).toBe(true);
  });

  it('requires at least 2 lines', () => {
    expect(JournalSchema.safeParse({ ...validJournal, lines: [validLine] }).success).toBe(false);
  });

  it('rejects empty narration', () => {
    expect(JournalSchema.safeParse({ ...validJournal, narration: '' }).success).toBe(false);
  });

  it('rejects negative debit/credit', () => {
    const badLine = { ...validLine, debit: -10 };
    expect(JournalLineSchema.safeParse(badLine).success).toBe(false);
  });

  it('validates journal statuses', () => {
    for (const status of ['draft', 'posted', 'voided'] as const) {
      expect(JournalSchema.safeParse({ ...validJournal, status }).success).toBe(true);
    }
  });

  it('rejects invalid status', () => {
    expect(JournalSchema.safeParse({ ...validJournal, status: 'deleted' }).success).toBe(false);
  });
});

describe('CreateJournalSchema', () => {
  it('defaults status to draft', () => {
    const result = CreateJournalSchema.parse({
      date: '2024-03-01',
      narration: 'Test',
      lines: [
        { accountId: 'a1', accountName: 'Sales', description: 'Rev', debit: 50, credit: 0 },
        { accountId: 'a2', accountName: 'Bank', description: 'Cash', debit: 0, credit: 50 },
      ],
    });
    expect(result.status).toBe('draft');
  });

  it('does not require line id', () => {
    const result = CreateJournalSchema.safeParse({
      date: '2024-03-01',
      narration: 'Test',
      lines: [
        { accountId: 'a1', accountName: 'Sales', description: 'Rev', debit: 100, credit: 0 },
        { accountId: 'a2', accountName: 'Bank', description: 'Cash', debit: 0, credit: 100 },
      ],
    });
    expect(result.success).toBe(true);
  });
});

// ── EmployeeSchema ─────────────────────────────────────────────────────

describe('EmployeeSchema', () => {
  const validEmployee = {
    id: 'e1',
    firstName: 'Jane',
    lastName: 'Smith',
    startDate: '2023-01-15',
    salary: 75000,
    payFrequency: 'monthly' as const,
    taxCode: 'M',
    isActive: true,
  };

  it('accepts a valid employee', () => {
    expect(EmployeeSchema.safeParse(validEmployee).success).toBe(true);
  });

  it('rejects empty firstName', () => {
    expect(EmployeeSchema.safeParse({ ...validEmployee, firstName: '' }).success).toBe(false);
  });

  it('rejects empty lastName', () => {
    expect(EmployeeSchema.safeParse({ ...validEmployee, lastName: '' }).success).toBe(false);
  });

  it('rejects negative salary', () => {
    expect(EmployeeSchema.safeParse({ ...validEmployee, salary: -1 }).success).toBe(false);
  });

  it('accepts all pay frequencies', () => {
    for (const freq of ['weekly', 'fortnightly', 'monthly'] as const) {
      expect(EmployeeSchema.safeParse({ ...validEmployee, payFrequency: freq }).success).toBe(true);
    }
  });

  it('allows nullable optional fields', () => {
    const result = EmployeeSchema.safeParse({
      ...validEmployee,
      email: null,
      phone: null,
      position: null,
      department: null,
      endDate: null,
      bankAccountNumber: null,
      irdNumber: null,
    });
    expect(result.success).toBe(true);
  });
});

describe('CreateEmployeeSchema', () => {
  it('defaults isActive to true', () => {
    const result = CreateEmployeeSchema.parse({
      firstName: 'Test',
      lastName: 'User',
      startDate: '2024-01-01',
      salary: 50000,
      payFrequency: 'monthly',
      taxCode: 'M',
    });
    expect(result.isActive).toBe(true);
  });
});

// ── ExpenseSchema ──────────────────────────────────────────────────────

describe('ExpenseSchema', () => {
  const validExpense = {
    id: 'exp-1',
    employeeId: 'e1',
    contactId: null,
    date: '2024-03-01',
    description: 'Office supplies',
    amount: 125.50,
    taxRate: 15,
    taxAmount: 18.83,
    total: 144.33,
    category: null,
    receiptUrl: null,
    accountCode: null,
    notes: null,
    mileageKm: null,
    mileageRate: null,
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
  };

  it('accepts a valid expense', () => {
    expect(ExpenseSchema.safeParse(validExpense).success).toBe(true);
  });

  it('defaults status to draft', () => {
    const result = ExpenseSchema.parse(validExpense);
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
  it('requires description', () => {
    const result = CreateExpenseSchema.safeParse({
      date: '2024-03-01',
      description: '',
      amount: 100,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative amount', () => {
    const result = CreateExpenseSchema.safeParse({
      date: '2024-03-01',
      description: 'Test',
      amount: -50,
    });
    expect(result.success).toBe(false);
  });

  it('defaults taxRate to 15', () => {
    const result = CreateExpenseSchema.parse({
      date: '2024-03-01',
      description: 'Test',
      amount: 100,
    });
    expect(result.taxRate).toBe(15);
  });

  it('allows amount of 0', () => {
    const result = CreateExpenseSchema.safeParse({
      date: '2024-03-01',
      description: 'Mileage only',
      amount: 0,
      mileageKm: 25,
      mileageRate: 0.95,
    });
    expect(result.success).toBe(true);
  });
});

// ── ProductSchema ──────────────────────────────────────────────────────

describe('ProductSchema', () => {
  const validProduct = {
    id: 'p1',
    code: 'WIDGET-001',
    name: 'Standard Widget',
    description: null,
    purchasePrice: 10,
    salePrice: 25,
    accountCode: null,
    taxRate: 15,
    isTracked: false,
    quantityOnHand: 0,
    isSold: true,
    isPurchased: true,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  it('accepts a valid product', () => {
    expect(ProductSchema.safeParse(validProduct).success).toBe(true);
  });
});

describe('CreateProductSchema', () => {
  it('requires code and name', () => {
    expect(CreateProductSchema.safeParse({ code: '', name: 'Test' }).success).toBe(false);
    expect(CreateProductSchema.safeParse({ code: 'T1', name: '' }).success).toBe(false);
  });

  it('defaults prices to 0', () => {
    const result = CreateProductSchema.parse({ code: 'T1', name: 'Test' });
    expect(result.purchasePrice).toBe(0);
    expect(result.salePrice).toBe(0);
  });

  it('defaults isTracked to false', () => {
    const result = CreateProductSchema.parse({ code: 'T1', name: 'Test' });
    expect(result.isTracked).toBe(false);
  });

  it('defaults taxRate to 15', () => {
    const result = CreateProductSchema.parse({ code: 'T1', name: 'Test' });
    expect(result.taxRate).toBe(15);
  });
});

describe('StockAdjustmentSchema', () => {
  it('validates all adjustment reasons', () => {
    for (const reason of ['stock_take', 'damaged', 'returned', 'other'] as const) {
      expect(StockAdjustmentSchema.safeParse({ quantity: 5, reason }).success).toBe(true);
    }
  });

  it('allows negative quantity (stock reduction)', () => {
    expect(StockAdjustmentSchema.safeParse({ quantity: -3, reason: 'damaged' }).success).toBe(true);
  });

  it('rejects invalid reason', () => {
    expect(StockAdjustmentSchema.safeParse({ quantity: 1, reason: 'stolen' }).success).toBe(false);
  });
});

// ── ProjectSchema ──────────────────────────────────────────────────────

describe('ProjectSchema', () => {
  const validProject = {
    id: 'proj-1',
    name: 'Website Redesign',
    status: 'in_progress' as const,
  };

  it('accepts a valid project', () => {
    expect(ProjectSchema.safeParse(validProject).success).toBe(true);
  });

  it('rejects empty name', () => {
    expect(ProjectSchema.safeParse({ ...validProject, name: '' }).success).toBe(false);
  });

  it('validates all project statuses', () => {
    for (const status of ['in_progress', 'completed', 'closed'] as const) {
      expect(ProjectSchema.safeParse({ ...validProject, status }).success).toBe(true);
    }
  });

  it('allows nullable optional fields', () => {
    const result = ProjectSchema.safeParse({
      ...validProject,
      contactId: null,
      contactName: null,
      deadline: null,
      estimatedBudget: null,
    });
    expect(result.success).toBe(true);
  });
});

describe('CreateProjectSchema', () => {
  it('defaults status to in_progress', () => {
    const result = CreateProjectSchema.parse({ name: 'Test Project' });
    expect(result.status).toBe('in_progress');
  });

  it('requires name', () => {
    expect(CreateProjectSchema.safeParse({ status: 'in_progress' }).success).toBe(false);
  });
});

// ── TimesheetSchema ────────────────────────────────────────────────────

describe('TimesheetSchema', () => {
  const validTimesheet = {
    id: 'ts-1',
    projectId: 'proj-1',
    date: '2024-03-01',
    hours: 8,
    description: 'Development work',
    isBillable: true,
    isInvoiced: false,
    hourlyRate: 150,
  };

  it('accepts a valid timesheet', () => {
    expect(TimesheetSchema.safeParse(validTimesheet).success).toBe(true);
  });

  it('rejects negative hours', () => {
    expect(TimesheetSchema.safeParse({ ...validTimesheet, hours: -1 }).success).toBe(false);
  });

  it('rejects negative hourly rate', () => {
    expect(TimesheetSchema.safeParse({ ...validTimesheet, hourlyRate: -10 }).success).toBe(false);
  });

  it('accepts zero hours', () => {
    expect(TimesheetSchema.safeParse({ ...validTimesheet, hours: 0 }).success).toBe(true);
  });
});

describe('CreateTimesheetSchema', () => {
  it('defaults isBillable to true', () => {
    const result = CreateTimesheetSchema.parse({
      projectId: 'proj-1',
      date: '2024-03-01',
      hours: 4,
      description: 'Meeting',
      hourlyRate: 100,
    });
    expect(result.isBillable).toBe(true);
  });

  it('does not include isInvoiced', () => {
    const result = CreateTimesheetSchema.parse({
      projectId: 'proj-1',
      date: '2024-03-01',
      hours: 4,
      description: 'Meeting',
      hourlyRate: 100,
    });
    expect(result).not.toHaveProperty('isInvoiced');
  });
});

// ── BankTransactionSchema ──────────────────────────────────────────────

describe('BankTransactionSchema', () => {
  const validTxn = {
    id: 'bt-1',
    accountId: 'acc-1',
    date: '2024-03-01',
    description: 'Payment from client',
    amount: 500,
    isReconciled: false,
  };

  it('accepts a valid bank transaction', () => {
    expect(BankTransactionSchema.safeParse(validTxn).success).toBe(true);
  });

  it('allows negative amounts (debits)', () => {
    expect(BankTransactionSchema.safeParse({ ...validTxn, amount: -200 }).success).toBe(true);
  });

  it('allows nullable match fields', () => {
    const result = BankTransactionSchema.safeParse({
      ...validTxn,
      matchedInvoiceId: null,
      matchedBillId: null,
      matchedPaymentId: null,
    });
    expect(result.success).toBe(true);
  });
});

describe('CreateBankTransactionSchema', () => {
  it('does not include reconciliation fields', () => {
    const result = CreateBankTransactionSchema.safeParse({
      accountId: 'acc-1',
      date: '2024-03-01',
      description: 'Deposit',
      amount: 1000,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('isReconciled');
      expect(result.data).not.toHaveProperty('matchedInvoiceId');
    }
  });
});

describe('ImportBankTransactionsSchema', () => {
  it('accepts valid import payload', () => {
    const result = ImportBankTransactionsSchema.safeParse({
      accountId: 'acc-1',
      transactions: [
        { date: '2024-03-01', description: 'Txn 1', amount: 100 },
        { date: '2024-03-02', description: 'Txn 2', amount: -50 },
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

// ── PayRunSchema ───────────────────────────────────────────────────────

describe('PayRunSchema', () => {
  const validPayRun = {
    id: 'pr-1',
    payPeriodStart: '2024-03-01',
    payPeriodEnd: '2024-03-31',
    payDate: '2024-04-01',
    status: 'draft' as const,
    totalGross: 10000,
    totalTax: 3000,
    totalNet: 7000,
  };

  it('accepts a valid pay run', () => {
    expect(PayRunSchema.safeParse(validPayRun).success).toBe(true);
  });

  it('validates pay run statuses', () => {
    for (const status of ['draft', 'posted'] as const) {
      expect(PayRunSchema.safeParse({ ...validPayRun, status }).success).toBe(true);
    }
  });

  it('rejects invalid status', () => {
    expect(PayRunSchema.safeParse({ ...validPayRun, status: 'cancelled' }).success).toBe(false);
  });

  it('accepts optional payslips array', () => {
    const result = PayRunSchema.safeParse({
      ...validPayRun,
      payslips: [{
        id: 'ps-1',
        payRunId: 'pr-1',
        employeeId: 'e1',
        grossPay: 5000,
        paye: 1500,
        kiwiSaverEmployee: 150,
        kiwiSaverEmployer: 150,
        netPay: 3350,
      }],
    });
    expect(result.success).toBe(true);
  });
});

describe('CreatePayRunSchema', () => {
  it('requires at least one employee', () => {
    expect(CreatePayRunSchema.safeParse({
      payPeriodStart: '2024-03-01',
      payPeriodEnd: '2024-03-31',
      payDate: '2024-04-01',
      employeeIds: [],
    }).success).toBe(false);
  });

  it('accepts valid create input', () => {
    expect(CreatePayRunSchema.safeParse({
      payPeriodStart: '2024-03-01',
      payPeriodEnd: '2024-03-31',
      payDate: '2024-04-01',
      employeeIds: ['e1', 'e2'],
    }).success).toBe(true);
  });
});

describe('PayslipSchema', () => {
  it('accepts a valid payslip', () => {
    expect(PayslipSchema.safeParse({
      id: 'ps-1',
      payRunId: 'pr-1',
      employeeId: 'e1',
      grossPay: 5000,
      paye: 1500,
      kiwiSaverEmployee: 150,
      kiwiSaverEmployer: 150,
      netPay: 3350,
    }).success).toBe(true);
  });
});

// ── TrackingCategorySchema ─────────────────────────────────────────────

describe('TrackingCategorySchema', () => {
  const validCategory = {
    id: 'tc-1',
    name: 'Region',
    options: [
      { id: 'opt-1', name: 'North Island', isActive: true },
      { id: 'opt-2', name: 'South Island', isActive: true },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  it('accepts a valid tracking category', () => {
    expect(TrackingCategorySchema.safeParse(validCategory).success).toBe(true);
  });

  it('accepts empty options array', () => {
    expect(TrackingCategorySchema.safeParse({ ...validCategory, options: [] }).success).toBe(true);
  });
});

describe('CreateTrackingCategorySchema', () => {
  it('requires name', () => {
    expect(CreateTrackingCategorySchema.safeParse({ name: '' }).success).toBe(false);
  });

  it('defaults options to empty array', () => {
    const result = CreateTrackingCategorySchema.parse({ name: 'Department' });
    expect(result.options).toEqual([]);
  });
});
