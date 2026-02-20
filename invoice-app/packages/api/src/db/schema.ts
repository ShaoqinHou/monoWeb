import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ── Contacts ──────────────────────────────────────────────────────────────────

export const contacts = sqliteTable('contacts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: ['customer', 'supplier', 'customer_and_supplier'] }).notNull(),
  email: text('email'),
  phone: text('phone'),
  taxNumber: text('tax_number'),
  bankAccountName: text('bank_account_name'),
  bankAccountNumber: text('bank_account_number'),
  bankBSB: text('bank_bsb'),
  defaultAccountCode: text('default_account_code'),
  defaultTaxRate: text('default_tax_rate'),
  outstandingBalance: real('outstanding_balance').notNull().default(0),
  overdueBalance: real('overdue_balance').notNull().default(0),
  isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ── Accounts ──────────────────────────────────────────────────────────────────

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  type: text('type', { enum: ['revenue', 'expense', 'asset', 'liability', 'equity'] }).notNull(),
  taxType: text('tax_type', { enum: ['output', 'input', 'none'] }).notNull().default('none'),
  description: text('description'),
  isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
});

// ── Invoices ──────────────────────────────────────────────────────────────────

export const invoices = sqliteTable('invoices', {
  id: text('id').primaryKey(),
  invoiceNumber: text('invoice_number'),
  reference: text('reference'),
  contactId: text('contact_id').notNull().references(() => contacts.id),
  contactName: text('contact_name').notNull().default(''),
  status: text('status', { enum: ['draft', 'submitted', 'approved', 'paid', 'voided'] }).notNull().default('draft'),
  amountType: text('amount_type', { enum: ['exclusive', 'inclusive', 'no_tax'] }).notNull().default('exclusive'),
  currency: text('currency').notNull().default('NZD'),
  date: text('date').notNull(),
  dueDate: text('due_date').notNull(),
  subTotal: real('sub_total').notNull().default(0),
  totalTax: real('total_tax').notNull().default(0),
  total: real('total').notNull().default(0),
  amountDue: real('amount_due').notNull().default(0),
  amountPaid: real('amount_paid').notNull().default(0),
  notes: text('notes'),
  sourceQuoteId: text('source_quote_id'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ── Bills ─────────────────────────────────────────────────────────────────────

export const bills = sqliteTable('bills', {
  id: text('id').primaryKey(),
  billNumber: text('bill_number'),
  reference: text('reference'),
  contactId: text('contact_id').notNull().references(() => contacts.id),
  contactName: text('contact_name').notNull().default(''),
  status: text('status', { enum: ['draft', 'submitted', 'approved', 'paid', 'voided'] }).notNull().default('draft'),
  amountType: text('amount_type', { enum: ['exclusive', 'inclusive', 'no_tax'] }).notNull().default('exclusive'),
  currency: text('currency').notNull().default('NZD'),
  date: text('date').notNull(),
  dueDate: text('due_date').notNull(),
  subTotal: real('sub_total').notNull().default(0),
  totalTax: real('total_tax').notNull().default(0),
  total: real('total').notNull().default(0),
  amountDue: real('amount_due').notNull().default(0),
  amountPaid: real('amount_paid').notNull().default(0),
  sourcePurchaseOrderId: text('source_purchase_order_id'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ── Line Items ────────────────────────────────────────────────────────────────

export const lineItems = sqliteTable('line_items', {
  id: text('id').primaryKey(),
  invoiceId: text('invoice_id').references(() => invoices.id, { onDelete: 'cascade' }),
  billId: text('bill_id').references(() => bills.id, { onDelete: 'cascade' }),
  productId: text('product_id'),
  description: text('description').notNull().default(''),
  quantity: real('quantity').notNull().default(1),
  unitPrice: real('unit_price').notNull().default(0),
  accountCode: text('account_code'),
  taxRate: real('tax_rate').notNull().default(15),
  taxAmount: real('tax_amount').notNull().default(0),
  lineAmount: real('line_amount').notNull().default(0),
  discount: real('discount').notNull().default(0),
});

// ── Payments ──────────────────────────────────────────────────────────────────

export const payments = sqliteTable('payments', {
  id: text('id').primaryKey(),
  invoiceId: text('invoice_id').references(() => invoices.id),
  billId: text('bill_id').references(() => bills.id),
  amount: real('amount').notNull(),
  date: text('date').notNull(),
  reference: text('reference'),
  accountCode: text('account_code'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ── Journals ─────────────────────────────────────────────────────────────────

export const journals = sqliteTable('journals', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  narration: text('narration').notNull(),
  status: text('status', { enum: ['draft', 'posted', 'voided'] }).notNull().default('draft'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const journalLines = sqliteTable('journal_lines', {
  id: text('id').primaryKey(),
  journalId: text('journal_id').notNull().references(() => journals.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  accountName: text('account_name').notNull().default(''),
  description: text('description').notNull().default(''),
  debit: real('debit').notNull().default(0),
  credit: real('credit').notNull().default(0),
});

// ── Bank Transactions ────────────────────────────────────────────────────────

export const bankTransactions = sqliteTable('bank_transactions', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  date: text('date').notNull(),
  description: text('description').notNull().default(''),
  reference: text('reference'),
  amount: real('amount').notNull(),
  isReconciled: integer('is_reconciled', { mode: 'boolean' }).notNull().default(false),
  matchedInvoiceId: text('matched_invoice_id').references(() => invoices.id),
  matchedBillId: text('matched_bill_id').references(() => bills.id),
  matchedPaymentId: text('matched_payment_id').references(() => payments.id),
  category: text('category'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ── Employees ────────────────────────────────────────────────────────────────

export const employees = sqliteTable('employees', {
  id: text('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email'),
  phone: text('phone'),
  position: text('position'),
  department: text('department'),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  salary: real('salary').notNull().default(0),
  payFrequency: text('pay_frequency', { enum: ['weekly', 'fortnightly', 'monthly'] }).notNull().default('monthly'),
  taxCode: text('tax_code').notNull().default('M'),
  bankAccountNumber: text('bank_account_number'),
  irdNumber: text('ird_number'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  kiwiSaverRate: real('kiwi_saver_rate').default(3),
  kiwiSaverEmployerRate: real('kiwi_saver_employer_rate').default(3),
  splitPaymentConfig: text('split_payment_config'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ── Pay Runs ─────────────────────────────────────────────────────────────────

export const payRuns = sqliteTable('pay_runs', {
  id: text('id').primaryKey(),
  payPeriodStart: text('pay_period_start').notNull(),
  payPeriodEnd: text('pay_period_end').notNull(),
  payDate: text('pay_date').notNull(),
  status: text('status', { enum: ['draft', 'posted'] }).notNull().default('draft'),
  totalGross: real('total_gross').notNull().default(0),
  totalTax: real('total_tax').notNull().default(0),
  totalNet: real('total_net').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export const payslips = sqliteTable('payslips', {
  id: text('id').primaryKey(),
  payRunId: text('pay_run_id').notNull().references(() => payRuns.id, { onDelete: 'cascade' }),
  employeeId: text('employee_id').notNull().references(() => employees.id),
  grossPay: real('gross_pay').notNull().default(0),
  paye: real('paye').notNull().default(0),
  kiwiSaverEmployee: real('kiwi_saver_employee').notNull().default(0),
  kiwiSaverEmployer: real('kiwi_saver_employer').notNull().default(0),
  netPay: real('net_pay').notNull().default(0),
});

// ── Projects ─────────────────────────────────────────────────────────────────

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  contactId: text('contact_id').references(() => contacts.id),
  contactName: text('contact_name'),
  status: text('status', { enum: ['in_progress', 'completed', 'closed'] }).notNull().default('in_progress'),
  deadline: text('deadline'),
  estimatedBudget: real('estimated_budget'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ── Timesheets ───────────────────────────────────────────────────────────────

export const timesheets = sqliteTable('timesheets', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  employeeId: text('employee_id').references(() => employees.id),
  date: text('date').notNull(),
  hours: real('hours').notNull(),
  description: text('description').notNull().default(''),
  isBillable: integer('is_billable', { mode: 'boolean' }).notNull().default(true),
  isInvoiced: integer('is_invoiced', { mode: 'boolean' }).notNull().default(false),
  hourlyRate: real('hourly_rate').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ── Quotes ──────────────────────────────────────────────────────────────────

export const quotes = sqliteTable('quotes', {
  id: text('id').primaryKey(),
  quoteNumber: text('quote_number'),
  reference: text('reference'),
  contactId: text('contact_id').notNull().references(() => contacts.id),
  contactName: text('contact_name').notNull().default(''),
  status: text('status', { enum: ['draft', 'sent', 'accepted', 'declined', 'expired', 'invoiced'] }).notNull().default('draft'),
  title: text('title'),
  summary: text('summary'),
  currency: text('currency').notNull().default('NZD'),
  date: text('date').notNull(),
  expiryDate: text('expiry_date').notNull(),
  subTotal: real('sub_total').notNull().default(0),
  totalTax: real('total_tax').notNull().default(0),
  total: real('total').notNull().default(0),
  convertedInvoiceId: text('converted_invoice_id'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ── Recurring Invoices ──────────────────────────────────────────────────────

export const recurringInvoices = sqliteTable('recurring_invoices', {
  id: text('id').primaryKey(),
  templateName: text('template_name').notNull(),
  contactId: text('contact_id').notNull().references(() => contacts.id),
  contactName: text('contact_name').notNull().default(''),
  frequency: text('frequency', { enum: ['weekly', 'fortnightly', 'monthly', 'bimonthly', 'quarterly', 'yearly'] }).notNull(),
  nextDate: text('next_date').notNull(),
  endDate: text('end_date'),
  daysUntilDue: integer('days_until_due').notNull().default(30),
  status: text('status', { enum: ['active', 'paused', 'completed'] }).notNull().default('active'),
  subTotal: real('sub_total').notNull().default(0),
  totalTax: real('total_tax').notNull().default(0),
  total: real('total').notNull().default(0),
  timesGenerated: integer('times_generated').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ── Credit Notes ────────────────────────────────────────────────────────────

export const creditNotes = sqliteTable('credit_notes', {
  id: text('id').primaryKey(),
  creditNoteNumber: text('credit_note_number'),
  type: text('type', { enum: ['sales', 'purchase'] }).notNull(),
  contactId: text('contact_id').notNull().references(() => contacts.id),
  contactName: text('contact_name').notNull().default(''),
  linkedInvoiceId: text('linked_invoice_id').references(() => invoices.id),
  linkedBillId: text('linked_bill_id').references(() => bills.id),
  status: text('status', { enum: ['draft', 'submitted', 'approved', 'applied', 'voided'] }).notNull().default('draft'),
  date: text('date').notNull(),
  subTotal: real('sub_total').notNull().default(0),
  totalTax: real('total_tax').notNull().default(0),
  total: real('total').notNull().default(0),
  remainingCredit: real('remaining_credit').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ── Purchase Orders ─────────────────────────────────────────────────────────

export const purchaseOrders = sqliteTable('purchase_orders', {
  id: text('id').primaryKey(),
  poNumber: text('po_number'),
  reference: text('reference'),
  contactId: text('contact_id').notNull().references(() => contacts.id),
  contactName: text('contact_name').notNull().default(''),
  status: text('status', { enum: ['draft', 'submitted', 'approved', 'billed', 'closed'] }).notNull().default('draft'),
  deliveryDate: text('delivery_date'),
  deliveryAddress: text('delivery_address'),
  currency: text('currency').notNull().default('NZD'),
  date: text('date').notNull(),
  subTotal: real('sub_total').notNull().default(0),
  totalTax: real('total_tax').notNull().default(0),
  total: real('total').notNull().default(0),
  convertedBillId: text('converted_bill_id'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ── Recurring Bills ─────────────────────────────────────────────────────────

export const recurringBills = sqliteTable('recurring_bills', {
  id: text('id').primaryKey(),
  templateName: text('template_name').notNull(),
  contactId: text('contact_id').notNull().references(() => contacts.id),
  contactName: text('contact_name').notNull().default(''),
  frequency: text('frequency', { enum: ['weekly', 'fortnightly', 'monthly', 'bimonthly', 'quarterly', 'yearly'] }).notNull(),
  nextDate: text('next_date').notNull(),
  endDate: text('end_date'),
  daysUntilDue: integer('days_until_due').notNull().default(30),
  status: text('status', { enum: ['active', 'paused', 'completed'] }).notNull().default('active'),
  subTotal: real('sub_total').notNull().default(0),
  totalTax: real('total_tax').notNull().default(0),
  total: real('total').notNull().default(0),
  timesGenerated: integer('times_generated').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ── Contact Groups ──────────────────────────────────────────────────────────

export const contactGroups = sqliteTable('contact_groups', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export const contactGroupMembers = sqliteTable('contact_group_members', {
  id: text('id').primaryKey(),
  groupId: text('group_id').notNull().references(() => contactGroups.id, { onDelete: 'cascade' }),
  contactId: text('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
});

// ── Contact Notes ───────────────────────────────────────────────────────────

export const contactNotes = sqliteTable('contact_notes', {
  id: text('id').primaryKey(),
  contactId: text('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ── Bank Rules ──────────────────────────────────────────────────────────────

export const bankRules = sqliteTable('bank_rules', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  accountId: text('account_id').notNull(),
  matchField: text('match_field', { enum: ['description', 'reference', 'amount'] }).notNull().default('description'),
  matchType: text('match_type', { enum: ['contains', 'equals', 'starts_with'] }).notNull().default('contains'),
  matchValue: text('match_value').notNull(),
  allocateToAccountCode: text('allocate_to_account_code').notNull(),
  taxRate: real('tax_rate').notNull().default(15),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ── Fixed Assets ────────────────────────────────────────────────────────────

export const fixedAssets = sqliteTable('fixed_assets', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  assetNumber: text('asset_number'),
  purchaseDate: text('purchase_date').notNull(),
  purchasePrice: real('purchase_price').notNull(),
  depreciationMethod: text('depreciation_method', { enum: ['straight_line', 'diminishing_value'] }).notNull().default('straight_line'),
  depreciationRate: real('depreciation_rate').notNull().default(0),
  currentValue: real('current_value').notNull(),
  accumulatedDepreciation: real('accumulated_depreciation').notNull().default(0),
  assetAccountCode: text('asset_account_code').notNull(),
  depreciationAccountCode: text('depreciation_account_code').notNull(),
  status: text('status', { enum: ['registered', 'disposed', 'sold'] }).notNull().default('registered'),
  disposalDate: text('disposal_date'),
  disposalPrice: real('disposal_price'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ── GST Returns ─────────────────────────────────────────────────────────────

export const gstReturns = sqliteTable('gst_returns', {
  id: text('id').primaryKey(),
  period: text('period').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  dueDate: text('due_date').notNull(),
  status: text('status', { enum: ['draft', 'filed', 'overdue'] }).notNull().default('draft'),
  gstCollected: real('gst_collected').notNull().default(0),
  gstPaid: real('gst_paid').notNull().default(0),
  netGst: real('net_gst').notNull().default(0),
  filedAt: text('filed_at'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ── Budgets ─────────────────────────────────────────────────────────────────

export const budgets = sqliteTable('budgets', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  financialYear: text('financial_year').notNull(),
  status: text('status', { enum: ['draft', 'active', 'archived'] }).notNull().default('draft'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export const budgetLines = sqliteTable('budget_lines', {
  id: text('id').primaryKey(),
  budgetId: text('budget_id').notNull().references(() => budgets.id, { onDelete: 'cascade' }),
  accountCode: text('account_code').notNull(),
  accountName: text('account_name').notNull().default(''),
  month1: real('month1').notNull().default(0),
  month2: real('month2').notNull().default(0),
  month3: real('month3').notNull().default(0),
  month4: real('month4').notNull().default(0),
  month5: real('month5').notNull().default(0),
  month6: real('month6').notNull().default(0),
  month7: real('month7').notNull().default(0),
  month8: real('month8').notNull().default(0),
  month9: real('month9').notNull().default(0),
  month10: real('month10').notNull().default(0),
  month11: real('month11').notNull().default(0),
  month12: real('month12').notNull().default(0),
});

// ── Leave Requests ──────────────────────────────────────────────────────────

export const leaveRequests = sqliteTable('leave_requests', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').notNull().references(() => employees.id),
  leaveType: text('leave_type', { enum: ['annual', 'sick', 'bereavement', 'parental', 'unpaid'] }).notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  hours: real('hours').notNull(),
  status: text('status', { enum: ['pending', 'approved', 'declined'] }).notNull().default('pending'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ── Pay Items ───────────────────────────────────────────────────────────────

export const payItems = sqliteTable('pay_items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: ['earnings', 'deduction', 'reimbursement', 'tax'] }).notNull(),
  rateType: text('rate_type', { enum: ['fixed', 'per_hour', 'percentage'] }).notNull().default('fixed'),
  amount: real('amount').notNull().default(0),
  accountCode: text('account_code'),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ── Project Expenses ────────────────────────────────────────────────────────

export const projectExpenses = sqliteTable('project_expenses', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  date: text('date').notNull(),
  category: text('category'),
  isBillable: integer('is_billable', { mode: 'boolean' }).notNull().default(true),
  isInvoiced: integer('is_invoiced', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ── Project Tasks ───────────────────────────────────────────────────────────

export const projectTasks = sqliteTable('project_tasks', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status', { enum: ['todo', 'in_progress', 'done'] }).notNull().default('todo'),
  assigneeId: text('assignee_id').references(() => employees.id),
  estimatedHours: real('estimated_hours'),
  actualHours: real('actual_hours').notNull().default(0),
  dueDate: text('due_date'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ── Expenses ────────────────────────────────────────────────────────────────

export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').references(() => employees.id),
  contactId: text('contact_id').references(() => contacts.id),
  date: text('date').notNull(),
  description: text('description').notNull(),
  amount: real('amount').notNull().default(0),
  taxRate: real('tax_rate').notNull().default(15),
  taxAmount: real('tax_amount').notNull().default(0),
  total: real('total').notNull().default(0),
  category: text('category'),
  receiptUrl: text('receipt_url'),
  status: text('status', { enum: ['draft', 'submitted', 'approved', 'reimbursed', 'declined'] }).notNull().default('draft'),
  accountCode: text('account_code'),
  notes: text('notes'),
  mileageKm: real('mileage_km'),
  mileageRate: real('mileage_rate'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ── Products ────────────────────────────────────────────────────────────────

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  purchasePrice: real('purchase_price').notNull().default(0),
  salePrice: real('sale_price').notNull().default(0),
  accountCode: text('account_code'),
  taxRate: real('tax_rate').notNull().default(15),
  isTracked: integer('is_tracked', { mode: 'boolean' }).notNull().default(false),
  quantityOnHand: real('quantity_on_hand').notNull().default(0),
  isSold: integer('is_sold', { mode: 'boolean' }).notNull().default(true),
  isPurchased: integer('is_purchased', { mode: 'boolean' }).notNull().default(true),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ── Stock Movements ───────────────────────────────────────────────────────

export const stockMovements = sqliteTable('stock_movements', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull().references(() => products.id),
  type: text('type', { enum: ['invoice', 'bill', 'adjustment'] }).notNull(),
  quantity: real('quantity').notNull(),
  reason: text('reason'),
  notes: text('notes'),
  referenceId: text('reference_id'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ── Tracking Categories ─────────────────────────────────────────────────────

export const trackingCategories = sqliteTable('tracking_categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  options: text('options').notNull().default('[]'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ── Tax Rates ───────────────────────────────────────────────────────────────

export const taxRates = sqliteTable('tax_rates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  rate: real('rate').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ── Settings ────────────────────────────────────────────────────────────────

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ── Wave M: Currencies ──────────────────────────────────────────────────────

export const currencies = sqliteTable('currencies', {
  code: text('code').primaryKey(),
  name: text('name').notNull(),
  rate: real('rate').notNull().default(1.0),
  enabled: integer('enabled').notNull().default(1),
  updatedAt: text('updated_at'),
});

// ── Wave M: Smart Lists ─────────────────────────────────────────────────────

export const smartLists = sqliteTable('smart_lists', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  filters: text('filters').notNull(),
  createdAt: text('created_at'),
});

// ── Wave M: Leave Types ─────────────────────────────────────────────────────

export const leaveTypes = sqliteTable('leave_types', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  paidLeave: integer('paid_leave').notNull().default(1),
  showOnPayslip: integer('show_on_payslip').notNull().default(1),
  defaultDaysPerYear: integer('default_days_per_year').notNull().default(0),
});

// ── Wave M: Connected Apps ──────────────────────────────────────────────────

export const connectedApps = sqliteTable('connected_apps', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  icon: text('icon').notNull().default(''),
  connected: integer('connected').notNull().default(0),
  updatedAt: text('updated_at'),
});

// ── Wave M: Notification Preferences ────────────────────────────────────────

export const notificationPreferences = sqliteTable('notification_preferences', {
  id: text('id').primaryKey().default('default'),
  overdueReminders: integer('overdue_reminders').notNull().default(1),
  overdueReminderDays: integer('overdue_reminder_days').notNull().default(7),
  paymentConfirmations: integer('payment_confirmations').notNull().default(1),
  quoteExpiryAlerts: integer('quote_expiry_alerts').notNull().default(1),
  quoteExpiryDaysBefore: integer('quote_expiry_days_before').notNull().default(7),
  billDueAlerts: integer('bill_due_alerts').notNull().default(1),
  billDueDaysBefore: integer('bill_due_days_before').notNull().default(3),
  bankFeedUpdates: integer('bank_feed_updates').notNull().default(1),
});

// ── Wave M: Supplier Prepayments ────────────────────────────────────────────

export const supplierPrepayments = sqliteTable('supplier_prepayments', {
  id: text('id').primaryKey(),
  contactId: text('contact_id').notNull(),
  contactName: text('contact_name').notNull().default(''),
  amount: real('amount').notNull(),
  balance: real('balance').notNull(),
  date: text('date').notNull(),
  reference: text('reference').notNull().default(''),
  createdAt: text('created_at'),
});
