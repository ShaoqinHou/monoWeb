/**
 * Seed script — populates the database with demo data for the Xero Replica.
 * Run: npx tsx packages/api/src/db/seed.ts
 */
import { randomUUID } from 'crypto';
import { createDb } from './index';
import {
  contacts, accounts, invoices, bills, lineItems, payments,
  journals, journalLines, bankTransactions,
  employees, payRuns, payslips, projects, timesheets,
  currencies, trackingCategories, taxRates, products,
} from './schema';

const { db } = createDb();

async function seed() {
  console.log('Seeding database...');

  // ── Contacts ─────────────────────────────────────────────────────────────
  const contactData = [
    { id: 'c-1', name: 'Ridgeway University', type: 'customer' as const, email: 'billing@ridgeway.ac.nz', phone: '09-555-1234' },
    { id: 'c-2', name: 'Boom FM', type: 'customer' as const, email: 'accounts@boomfm.co.nz', phone: '09-555-2345' },
    { id: 'c-3', name: 'City Agency', type: 'customer_and_supplier' as const, email: 'info@cityagency.co.nz', phone: '09-555-3456' },
    { id: 'c-4', name: 'Bayside Club', type: 'customer' as const, email: 'club@bayside.co.nz', phone: '09-555-4567' },
    { id: 'c-5', name: 'PowerDirect', type: 'supplier' as const, email: 'billing@powerdirect.co.nz', phone: '09-555-5678' },
    { id: 'c-6', name: 'ABC Furniture', type: 'supplier' as const, email: 'sales@abcfurniture.co.nz', phone: '09-555-6789' },
    { id: 'c-7', name: 'Swanston Security', type: 'supplier' as const, email: 'accounts@swanston.co.nz', phone: '09-555-7890' },
    { id: 'c-8', name: 'Marine Systems', type: 'supplier' as const, email: 'support@marinesys.co.nz', phone: '09-555-8901' },
  ];
  for (const c of contactData) {
    await db.insert(contacts).values({ ...c, isArchived: false, outstandingBalance: 0, overdueBalance: 0 });
  }

  // ── Accounts ─────────────────────────────────────────────────────────────
  const accountData = [
    { id: 'a-1', code: '200', name: 'Sales', type: 'revenue' as const, taxType: 'output' as const },
    { id: 'a-2', code: '260', name: 'Other Revenue', type: 'revenue' as const, taxType: 'output' as const },
    { id: 'a-3', code: '400', name: 'Advertising', type: 'expense' as const, taxType: 'input' as const },
    { id: 'a-4', code: '404', name: 'Bank Fees', type: 'expense' as const, taxType: 'none' as const },
    { id: 'a-5', code: '408', name: 'Cleaning', type: 'expense' as const, taxType: 'input' as const },
    { id: 'a-6', code: '412', name: 'Consulting & Accounting', type: 'expense' as const, taxType: 'input' as const },
    { id: 'a-7', code: '420', name: 'Entertainment', type: 'expense' as const, taxType: 'none' as const },
    { id: 'a-8', code: '429', name: 'General Expenses', type: 'expense' as const, taxType: 'input' as const },
    { id: 'a-9', code: '461', name: 'Rent', type: 'expense' as const, taxType: 'input' as const },
    { id: 'a-10', code: '477', name: 'Wages and Salaries', type: 'expense' as const, taxType: 'none' as const },
    { id: 'a-11', code: '610', name: 'Accounts Receivable', type: 'asset' as const, taxType: 'none' as const },
    { id: 'a-12', code: '620', name: 'Prepayments', type: 'asset' as const, taxType: 'none' as const },
    { id: 'a-13', code: '090', name: 'Business Bank Account', type: 'asset' as const, taxType: 'none' as const },
    { id: 'a-14', code: '091', name: 'Business Savings Account', type: 'asset' as const, taxType: 'none' as const },
    { id: 'a-15', code: '800', name: 'Accounts Payable', type: 'liability' as const, taxType: 'none' as const },
    { id: 'a-16', code: '820', name: 'GST', type: 'liability' as const, taxType: 'none' as const },
    { id: 'a-17', code: '900', name: 'Owner A Share Capital', type: 'equity' as const, taxType: 'none' as const },
    { id: 'a-18', code: '960', name: 'Retained Earnings', type: 'equity' as const, taxType: 'none' as const },
  ];
  for (const a of accountData) {
    await db.insert(accounts).values({ ...a, isArchived: false });
  }

  // ── Invoices ─────────────────────────────────────────────────────────────
  const invoiceData = [
    { id: 'inv-1', invoiceNumber: 'INV-0001', contactId: 'c-1', contactName: 'Ridgeway University', status: 'paid' as const, date: '2024-01-15', dueDate: '2024-02-15', subTotal: 2000, totalTax: 300, total: 2300, amountDue: 0, amountPaid: 2300 },
    { id: 'inv-2', invoiceNumber: 'INV-0002', contactId: 'c-2', contactName: 'Boom FM', status: 'approved' as const, date: '2024-02-01', dueDate: '2024-03-01', subTotal: 4500, totalTax: 675, total: 5175, amountDue: 5175, amountPaid: 0 },
    { id: 'inv-3', invoiceNumber: 'INV-0003', contactId: 'c-3', contactName: 'City Agency', status: 'approved' as const, date: '2024-01-20', dueDate: '2024-02-20', subTotal: 1200, totalTax: 180, total: 1380, amountDue: 1380, amountPaid: 0 },
    { id: 'inv-4', invoiceNumber: 'INV-0004', contactId: 'c-4', contactName: 'Bayside Club', status: 'draft' as const, date: '2024-03-01', dueDate: '2024-04-01', subTotal: 800, totalTax: 120, total: 920, amountDue: 920, amountPaid: 0 },
    { id: 'inv-5', invoiceNumber: 'INV-0005', contactId: 'c-1', contactName: 'Ridgeway University', status: 'paid' as const, date: '2024-03-15', dueDate: '2024-04-15', subTotal: 3200, totalTax: 480, total: 3680, amountDue: 0, amountPaid: 3680 },
  ];
  for (const inv of invoiceData) {
    await db.insert(invoices).values({ ...inv, amountType: 'exclusive', currency: 'NZD' });
  }

  // Line items for invoices
  const invoiceLines = [
    { id: 'li-1', invoiceId: 'inv-1', description: 'Website Design', quantity: 1, unitPrice: 2000, accountCode: '200', taxRate: 15, taxAmount: 300, lineAmount: 2000 },
    { id: 'li-2', invoiceId: 'inv-2', description: 'Radio Campaign - Q1', quantity: 3, unitPrice: 1500, accountCode: '200', taxRate: 15, taxAmount: 675, lineAmount: 4500 },
    { id: 'li-3', invoiceId: 'inv-3', description: 'Consulting Services', quantity: 8, unitPrice: 150, accountCode: '200', taxRate: 15, taxAmount: 180, lineAmount: 1200 },
    { id: 'li-4', invoiceId: 'inv-4', description: 'Event Catering', quantity: 1, unitPrice: 800, accountCode: '200', taxRate: 15, taxAmount: 120, lineAmount: 800 },
    { id: 'li-5', invoiceId: 'inv-5', description: 'Software License', quantity: 1, unitPrice: 3200, accountCode: '200', taxRate: 15, taxAmount: 480, lineAmount: 3200 },
  ];
  for (const li of invoiceLines) {
    await db.insert(lineItems).values({ ...li, discount: 0 });
  }

  // ── Bills ────────────────────────────────────────────────────────────────
  const billData = [
    { id: 'bill-1', billNumber: 'BILL-001', contactId: 'c-5', contactName: 'PowerDirect', status: 'paid' as const, date: '2024-01-10', dueDate: '2024-02-10', subTotal: 850, totalTax: 127.50, total: 977.50, amountDue: 0, amountPaid: 977.50 },
    { id: 'bill-2', billNumber: 'BILL-002', contactId: 'c-6', contactName: 'ABC Furniture', status: 'approved' as const, date: '2024-02-01', dueDate: '2024-03-01', subTotal: 2400, totalTax: 360, total: 2760, amountDue: 2760, amountPaid: 0 },
    { id: 'bill-3', billNumber: 'BILL-003', contactId: 'c-7', contactName: 'Swanston Security', status: 'approved' as const, date: '2024-01-25', dueDate: '2024-02-25', subTotal: 600, totalTax: 90, total: 690, amountDue: 690, amountPaid: 0 },
    { id: 'bill-4', billNumber: 'BILL-004', contactId: 'c-8', contactName: 'Marine Systems', status: 'draft' as const, date: '2024-03-05', dueDate: '2024-04-05', subTotal: 1500, totalTax: 225, total: 1725, amountDue: 1725, amountPaid: 0 },
  ];
  for (const b of billData) {
    await db.insert(bills).values({ ...b, amountType: 'exclusive', currency: 'NZD' });
  }

  // Line items for bills
  const billLines = [
    { id: 'li-b1', billId: 'bill-1', description: 'Electricity - January', quantity: 1, unitPrice: 850, accountCode: '429', taxRate: 15, taxAmount: 127.50, lineAmount: 850 },
    { id: 'li-b2', billId: 'bill-2', description: 'Office Furniture', quantity: 4, unitPrice: 600, accountCode: '429', taxRate: 15, taxAmount: 360, lineAmount: 2400 },
    { id: 'li-b3', billId: 'bill-3', description: 'Security Services - Feb', quantity: 1, unitPrice: 600, accountCode: '429', taxRate: 15, taxAmount: 90, lineAmount: 600 },
    { id: 'li-b4', billId: 'bill-4', description: 'Marine Equipment', quantity: 1, unitPrice: 1500, accountCode: '429', taxRate: 15, taxAmount: 225, lineAmount: 1500 },
  ];
  for (const li of billLines) {
    await db.insert(lineItems).values({ ...li, discount: 0 });
  }

  // ── Payments ─────────────────────────────────────────────────────────────
  const paymentData = [
    { id: 'pay-1', invoiceId: 'inv-1', amount: 2300, date: '2024-02-10', reference: 'Bank transfer', accountCode: '090' },
    { id: 'pay-2', invoiceId: 'inv-5', amount: 3680, date: '2024-04-10', reference: 'Direct deposit', accountCode: '090' },
    { id: 'pay-3', billId: 'bill-1', amount: 977.50, date: '2024-02-08', reference: 'Auto-payment', accountCode: '090' },
  ];
  for (const p of paymentData) {
    await db.insert(payments).values(p);
  }

  // ── Journals ─────────────────────────────────────────────────────────────
  const journalData = [
    { id: 'j-1', date: '2024-01-15', narration: 'Monthly depreciation', status: 'posted' as const },
    { id: 'j-2', date: '2024-01-20', narration: 'Accrued wages', status: 'posted' as const },
    { id: 'j-3', date: '2024-02-01', narration: 'Prepaid rent adjustment', status: 'draft' as const },
  ];
  for (const j of journalData) {
    await db.insert(journals).values(j);
  }

  const journalLineData = [
    { id: 'jl-1', journalId: 'j-1', accountId: 'a-3', accountName: 'Advertising', description: 'Depreciation charge', debit: 500, credit: 0 },
    { id: 'jl-2', journalId: 'j-1', accountId: 'a-12', accountName: 'Prepayments', description: 'Accumulated depreciation', debit: 0, credit: 500 },
    { id: 'jl-3', journalId: 'j-2', accountId: 'a-10', accountName: 'Wages and Salaries', description: 'Jan wages accrual', debit: 3000, credit: 0 },
    { id: 'jl-4', journalId: 'j-2', accountId: 'a-15', accountName: 'Accounts Payable', description: 'Wages payable', debit: 0, credit: 3000 },
    { id: 'jl-5', journalId: 'j-3', accountId: 'a-9', accountName: 'Rent', description: 'Feb rent expense', debit: 2000, credit: 0 },
    { id: 'jl-6', journalId: 'j-3', accountId: 'a-13', accountName: 'Business Bank Account', description: 'Rent prepayment', debit: 0, credit: 2000 },
  ];
  for (const jl of journalLineData) {
    await db.insert(journalLines).values(jl);
  }

  // ── Bank Transactions ────────────────────────────────────────────────────
  const txData = [
    { id: 'bt-1', accountId: 'a-13', date: '2024-01-10', description: 'Payment from Ridgeway University', amount: 2300, isReconciled: true, matchedPaymentId: 'pay-1' },
    { id: 'bt-2', accountId: 'a-13', date: '2024-01-15', description: 'PowerDirect - Electricity', amount: -977.50, isReconciled: true, matchedPaymentId: 'pay-3' },
    { id: 'bt-3', accountId: 'a-13', date: '2024-02-01', description: 'Xero Monthly Fee', amount: -50, isReconciled: false },
    { id: 'bt-4', accountId: 'a-13', date: '2024-02-05', description: 'ANZ Interest', amount: 12.50, isReconciled: false },
    { id: 'bt-5', accountId: 'a-13', date: '2024-02-10', description: 'City Agency Payment', amount: 1380, isReconciled: false },
    { id: 'bt-6', accountId: 'a-13', date: '2024-03-01', description: 'Rent payment', amount: -2000, isReconciled: false },
    { id: 'bt-7', accountId: 'a-14', date: '2024-01-01', description: 'Opening balance', amount: 15000, isReconciled: true },
    { id: 'bt-8', accountId: 'a-14', date: '2024-02-28', description: 'Interest earned', amount: 45.00, isReconciled: false },
  ];
  for (const t of txData) {
    await db.insert(bankTransactions).values(t);
  }

  // ── Employees ────────────────────────────────────────────────────────────
  const empData = [
    { id: 'emp-1', firstName: 'Emma', lastName: 'Stone', email: 'emma@demo.co.nz', position: 'Sales Manager', department: 'Sales', startDate: '2022-03-01', salary: 85000, payFrequency: 'monthly' as const, taxCode: 'M', irdNumber: '012-345-678' },
    { id: 'emp-2', firstName: 'James', lastName: 'Wilson', email: 'james@demo.co.nz', position: 'Developer', department: 'Engineering', startDate: '2023-01-15', salary: 95000, payFrequency: 'monthly' as const, taxCode: 'M', irdNumber: '023-456-789' },
    { id: 'emp-3', firstName: 'Sarah', lastName: 'Chen', email: 'sarah@demo.co.nz', position: 'Accountant', department: 'Finance', startDate: '2021-06-01', salary: 78000, payFrequency: 'monthly' as const, taxCode: 'M', irdNumber: '034-567-890' },
    { id: 'emp-4', firstName: 'David', lastName: 'Brown', email: 'david@demo.co.nz', position: 'Office Manager', department: 'Admin', startDate: '2020-11-01', salary: 62000, payFrequency: 'fortnightly' as const, taxCode: 'M', irdNumber: '045-678-901' },
  ];
  for (const e of empData) {
    await db.insert(employees).values({ ...e, isActive: true });
  }

  // ── Pay Runs ─────────────────────────────────────────────────────────────
  await db.insert(payRuns).values({
    id: 'pr-1',
    payPeriodStart: '2024-01-01',
    payPeriodEnd: '2024-01-31',
    payDate: '2024-01-31',
    status: 'posted',
    totalGross: 26666.67,
    totalTax: 5833.33,
    totalNet: 20033.34,
  });

  const prSlips = [
    { id: 'ps-1', payRunId: 'pr-1', employeeId: 'emp-1', grossPay: 7083.33, paye: 1468.75, kiwiSaverEmployee: 212.50, kiwiSaverEmployer: 212.50, netPay: 5402.08 },
    { id: 'ps-2', payRunId: 'pr-1', employeeId: 'emp-2', grossPay: 7916.67, paye: 1718.75, kiwiSaverEmployee: 237.50, kiwiSaverEmployer: 237.50, netPay: 5960.42 },
    { id: 'ps-3', payRunId: 'pr-1', employeeId: 'emp-3', grossPay: 6500.00, paye: 1300.00, kiwiSaverEmployee: 195.00, kiwiSaverEmployer: 195.00, netPay: 5005.00 },
  ];
  for (const s of prSlips) {
    await db.insert(payslips).values(s);
  }

  // ── Projects ─────────────────────────────────────────────────────────────
  const projData = [
    { id: 'proj-1', name: 'Website Redesign', contactId: 'c-1', contactName: 'Ridgeway University', status: 'in_progress' as const, deadline: '2024-06-30', estimatedBudget: 25000 },
    { id: 'proj-2', name: 'Marketing Campaign Q2', contactId: 'c-2', contactName: 'Boom FM', status: 'in_progress' as const, deadline: '2024-04-30', estimatedBudget: 12000 },
    { id: 'proj-3', name: 'Office Fit-out', contactId: null, contactName: null, status: 'completed' as const, deadline: '2024-01-31', estimatedBudget: 8000 },
  ];
  for (const p of projData) {
    await db.insert(projects).values(p);
  }

  // ── Timesheets ───────────────────────────────────────────────────────────
  const tsData = [
    { id: 'ts-1', projectId: 'proj-1', employeeId: 'emp-2', date: '2024-02-01', hours: 8, description: 'Initial wireframes', isBillable: true, hourlyRate: 150 },
    { id: 'ts-2', projectId: 'proj-1', employeeId: 'emp-2', date: '2024-02-02', hours: 6, description: 'Frontend development', isBillable: true, hourlyRate: 150 },
    { id: 'ts-3', projectId: 'proj-1', employeeId: 'emp-1', date: '2024-02-03', hours: 3, description: 'Client meeting', isBillable: true, hourlyRate: 125 },
    { id: 'ts-4', projectId: 'proj-2', employeeId: 'emp-1', date: '2024-02-05', hours: 5, description: 'Campaign planning', isBillable: true, hourlyRate: 125 },
    { id: 'ts-5', projectId: 'proj-2', employeeId: 'emp-1', date: '2024-02-06', hours: 4, description: 'Creative review', isBillable: false, hourlyRate: 125 },
    { id: 'ts-6', projectId: 'proj-3', employeeId: 'emp-4', date: '2024-01-15', hours: 8, description: 'Furniture assembly', isBillable: false, hourlyRate: 80 },
  ];
  for (const t of tsData) {
    await db.insert(timesheets).values({ ...t, isInvoiced: false });
  }

  // ── Currencies ──────────────────────────────────────────────────────────
  const currencyData = [
    { code: 'NZD', name: 'New Zealand Dollar', rate: 1.0, enabled: 1 },
    { code: 'AUD', name: 'Australian Dollar', rate: 0.93, enabled: 1 },
    { code: 'USD', name: 'US Dollar', rate: 0.62, enabled: 1 },
    { code: 'GBP', name: 'British Pound', rate: 0.49, enabled: 1 },
    { code: 'EUR', name: 'Euro', rate: 0.57, enabled: 1 },
  ];
  for (const cur of currencyData) {
    await db.insert(currencies).values(cur);
  }

  // ── Tracking Categories ───────────────────────────────────────────────
  const trackingData = [
    { id: 'tc-1', name: 'Region', options: JSON.stringify(['North', 'South', 'East', 'West']) },
    { id: 'tc-2', name: 'Department', options: JSON.stringify(['Sales', 'Marketing', 'Engineering', 'Finance', 'Admin']) },
  ];
  for (const tc of trackingData) {
    await db.insert(trackingCategories).values(tc);
  }

  // ── Tax Rates ────────────────────────────────────────────────────────────
  const taxRateData = [
    { id: 'tr-1', name: 'GST on Income (15%)', rate: 15, isActive: true },
    { id: 'tr-2', name: 'GST on Expenses (15%)', rate: 15, isActive: true },
    { id: 'tr-3', name: 'No GST (0%)', rate: 0, isActive: true },
    { id: 'tr-4', name: 'GST on Imports (15%)', rate: 15, isActive: true },
    { id: 'tr-5', name: 'Zero Rated (0%)', rate: 0, isActive: true },
    { id: 'tr-6', name: 'Exempt (0%)', rate: 0, isActive: true },
  ];
  for (const tr of taxRateData) {
    await db.insert(taxRates).values(tr);
  }

  // ── Products ─────────────────────────────────────────────────────────────
  const productData = [
    { id: 'prod-1', code: 'DEV-001', name: 'Development Services', salePrice: 150.00, purchasePrice: 0, accountCode: '200', taxRate: 15, isSold: true, isPurchased: false },
    { id: 'prod-2', code: 'DES-001', name: 'Design Services', salePrice: 125.00, purchasePrice: 0, accountCode: '200', taxRate: 15, isSold: true, isPurchased: false },
    { id: 'prod-3', code: 'CON-001', name: 'Consulting', salePrice: 175.00, purchasePrice: 0, accountCode: '200', taxRate: 15, isSold: true, isPurchased: false },
    { id: 'prod-4', code: 'HW-001', name: 'Computer Equipment', salePrice: 1200.00, purchasePrice: 800.00, accountCode: '400', taxRate: 15, isSold: true, isPurchased: true, isTracked: true, quantityOnHand: 10 },
    { id: 'prod-5', code: 'SW-001', name: 'Software License', salePrice: 49.99, purchasePrice: 25.00, accountCode: '200', taxRate: 15, isSold: true, isPurchased: true },
  ];
  for (const p of productData) {
    await db.insert(products).values({ ...p, isActive: true });
  }

  console.log('Seed complete!');
  console.log('  8 contacts, 18 accounts, 5 invoices, 4 bills, 3 payments');
  console.log('  3 journals, 8 bank transactions, 4 employees, 1 pay run');
  console.log('  3 projects, 6 timesheets, 5 currencies, 2 tracking categories');
  console.log('  6 tax rates, 5 products');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
