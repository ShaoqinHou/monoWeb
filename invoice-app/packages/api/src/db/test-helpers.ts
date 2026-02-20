import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';
import * as schema from './schema';
import type { Db } from './index';

/**
 * Create an in-memory SQLite database with all tables for testing.
 * Returns db + a cleanup function.
 */
export function createTestDb(): { db: Db; cleanup: () => void } {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');

  const db = drizzle(sqlite, { schema });

  // Create tables
  db.run(sql`
    CREATE TABLE contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('customer', 'supplier', 'customer_and_supplier')),
      email TEXT,
      phone TEXT,
      tax_number TEXT,
      bank_account_name TEXT,
      bank_account_number TEXT,
      default_account_code TEXT,
      bank_bsb TEXT,
      default_tax_rate REAL,
      outstanding_balance REAL NOT NULL DEFAULT 0,
      overdue_balance REAL NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(sql`
    CREATE TABLE accounts (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('revenue', 'expense', 'asset', 'liability', 'equity')),
      tax_type TEXT NOT NULL DEFAULT 'none' CHECK(tax_type IN ('output', 'input', 'none')),
      description TEXT,
      is_archived INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.run(sql`
    CREATE TABLE invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT,
      reference TEXT,
      contact_id TEXT NOT NULL REFERENCES contacts(id),
      contact_name TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'approved', 'paid', 'voided')),
      amount_type TEXT NOT NULL DEFAULT 'exclusive' CHECK(amount_type IN ('exclusive', 'inclusive', 'no_tax')),
      currency TEXT NOT NULL DEFAULT 'NZD',
      date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      sub_total REAL NOT NULL DEFAULT 0,
      total_tax REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      amount_due REAL NOT NULL DEFAULT 0,
      amount_paid REAL NOT NULL DEFAULT 0,
      notes TEXT,
      source_quote_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(sql`
    CREATE TABLE bills (
      id TEXT PRIMARY KEY,
      bill_number TEXT,
      reference TEXT,
      contact_id TEXT NOT NULL REFERENCES contacts(id),
      contact_name TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'approved', 'paid', 'voided')),
      amount_type TEXT NOT NULL DEFAULT 'exclusive' CHECK(amount_type IN ('exclusive', 'inclusive', 'no_tax')),
      currency TEXT NOT NULL DEFAULT 'NZD',
      date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      sub_total REAL NOT NULL DEFAULT 0,
      total_tax REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      amount_due REAL NOT NULL DEFAULT 0,
      amount_paid REAL NOT NULL DEFAULT 0,
      source_purchase_order_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(sql`
    CREATE TABLE line_items (
      id TEXT PRIMARY KEY,
      invoice_id TEXT,
      bill_id TEXT,
      product_id TEXT,
      description TEXT NOT NULL DEFAULT '',
      quantity REAL NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL DEFAULT 0,
      account_code TEXT,
      tax_rate REAL NOT NULL DEFAULT 15,
      tax_amount REAL NOT NULL DEFAULT 0,
      line_amount REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0
    )
  `);

  db.run(sql`
    CREATE TABLE payments (
      id TEXT PRIMARY KEY,
      invoice_id TEXT REFERENCES invoices(id),
      bill_id TEXT REFERENCES bills(id),
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      reference TEXT,
      account_code TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(sql`
    CREATE TABLE journals (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      narration TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'posted', 'voided')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(sql`
    CREATE TABLE journal_lines (
      id TEXT PRIMARY KEY,
      journal_id TEXT NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
      account_id TEXT NOT NULL,
      account_name TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      debit REAL NOT NULL DEFAULT 0,
      credit REAL NOT NULL DEFAULT 0
    )
  `);

  db.run(sql`
    CREATE TABLE bank_transactions (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      reference TEXT,
      amount REAL NOT NULL,
      is_reconciled INTEGER NOT NULL DEFAULT 0,
      matched_invoice_id TEXT REFERENCES invoices(id),
      matched_bill_id TEXT REFERENCES bills(id),
      matched_payment_id TEXT REFERENCES payments(id),
      category TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(sql`
    CREATE TABLE employees (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      position TEXT,
      department TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT,
      salary REAL NOT NULL DEFAULT 0,
      pay_frequency TEXT NOT NULL DEFAULT 'monthly' CHECK(pay_frequency IN ('weekly', 'fortnightly', 'monthly')),
      tax_code TEXT NOT NULL DEFAULT 'M',
      bank_account_number TEXT,
      ird_number TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      kiwi_saver_rate REAL DEFAULT 3,
      kiwi_saver_employer_rate REAL DEFAULT 3,
      split_payment_config TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(sql`
    CREATE TABLE pay_runs (
      id TEXT PRIMARY KEY,
      pay_period_start TEXT NOT NULL,
      pay_period_end TEXT NOT NULL,
      pay_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'posted')),
      total_gross REAL NOT NULL DEFAULT 0,
      total_tax REAL NOT NULL DEFAULT 0,
      total_net REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(sql`
    CREATE TABLE payslips (
      id TEXT PRIMARY KEY,
      pay_run_id TEXT NOT NULL REFERENCES pay_runs(id) ON DELETE CASCADE,
      employee_id TEXT NOT NULL REFERENCES employees(id),
      gross_pay REAL NOT NULL DEFAULT 0,
      paye REAL NOT NULL DEFAULT 0,
      kiwi_saver_employee REAL NOT NULL DEFAULT 0,
      kiwi_saver_employer REAL NOT NULL DEFAULT 0,
      net_pay REAL NOT NULL DEFAULT 0
    )
  `);

  db.run(sql`
    CREATE TABLE projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact_id TEXT REFERENCES contacts(id),
      contact_name TEXT,
      status TEXT NOT NULL DEFAULT 'in_progress' CHECK(status IN ('in_progress', 'completed', 'closed')),
      deadline TEXT,
      estimated_budget REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(sql`
    CREATE TABLE timesheets (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      employee_id TEXT REFERENCES employees(id),
      date TEXT NOT NULL,
      hours REAL NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      is_billable INTEGER NOT NULL DEFAULT 1,
      is_invoiced INTEGER NOT NULL DEFAULT 0,
      hourly_rate REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(sql`
    CREATE TABLE quotes (
      id TEXT PRIMARY KEY,
      quote_number TEXT,
      reference TEXT,
      contact_id TEXT NOT NULL REFERENCES contacts(id),
      contact_name TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'sent', 'accepted', 'declined', 'expired', 'invoiced')),
      title TEXT,
      summary TEXT,
      currency TEXT NOT NULL DEFAULT 'NZD',
      date TEXT NOT NULL,
      expiry_date TEXT NOT NULL,
      sub_total REAL NOT NULL DEFAULT 0,
      total_tax REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      converted_invoice_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(sql`
    CREATE TABLE recurring_invoices (
      id TEXT PRIMARY KEY,
      template_name TEXT NOT NULL,
      contact_id TEXT NOT NULL REFERENCES contacts(id),
      contact_name TEXT NOT NULL DEFAULT '',
      frequency TEXT NOT NULL CHECK(frequency IN ('weekly', 'fortnightly', 'monthly', 'bimonthly', 'quarterly', 'yearly')),
      next_date TEXT NOT NULL,
      end_date TEXT,
      days_until_due INTEGER NOT NULL DEFAULT 30,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paused', 'completed')),
      sub_total REAL NOT NULL DEFAULT 0,
      total_tax REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      times_generated INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(sql`
    CREATE TABLE credit_notes (
      id TEXT PRIMARY KEY,
      credit_note_number TEXT,
      type TEXT NOT NULL CHECK(type IN ('sales', 'purchase')),
      contact_id TEXT NOT NULL REFERENCES contacts(id),
      contact_name TEXT NOT NULL DEFAULT '',
      linked_invoice_id TEXT REFERENCES invoices(id),
      linked_bill_id TEXT REFERENCES bills(id),
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'approved', 'applied', 'voided')),
      date TEXT NOT NULL,
      sub_total REAL NOT NULL DEFAULT 0,
      total_tax REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      remaining_credit REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(sql`
    CREATE TABLE purchase_orders (
      id TEXT PRIMARY KEY,
      po_number TEXT,
      reference TEXT,
      contact_id TEXT NOT NULL REFERENCES contacts(id),
      contact_name TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'approved', 'billed', 'closed')),
      delivery_date TEXT,
      delivery_address TEXT,
      currency TEXT NOT NULL DEFAULT 'NZD',
      date TEXT NOT NULL,
      sub_total REAL NOT NULL DEFAULT 0,
      total_tax REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      converted_bill_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(sql`
    CREATE TABLE recurring_bills (
      id TEXT PRIMARY KEY,
      template_name TEXT NOT NULL,
      contact_id TEXT NOT NULL REFERENCES contacts(id),
      contact_name TEXT NOT NULL DEFAULT '',
      frequency TEXT NOT NULL CHECK(frequency IN ('weekly', 'fortnightly', 'monthly', 'bimonthly', 'quarterly', 'yearly')),
      next_date TEXT NOT NULL,
      end_date TEXT,
      days_until_due INTEGER NOT NULL DEFAULT 30,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paused', 'completed')),
      sub_total REAL NOT NULL DEFAULT 0,
      total_tax REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      times_generated INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(sql`
    CREATE TABLE contact_groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(sql`
    CREATE TABLE contact_group_members (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL REFERENCES contact_groups(id) ON DELETE CASCADE,
      contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE
    )
  `);

  db.run(sql`
    CREATE TABLE contact_notes (
      id TEXT PRIMARY KEY,
      contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(sql`
    CREATE TABLE bank_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      account_id TEXT NOT NULL,
      match_field TEXT NOT NULL DEFAULT 'description' CHECK(match_field IN ('description', 'reference', 'amount')),
      match_type TEXT NOT NULL DEFAULT 'contains' CHECK(match_type IN ('contains', 'equals', 'starts_with')),
      match_value TEXT NOT NULL,
      allocate_to_account_code TEXT NOT NULL,
      tax_rate REAL NOT NULL DEFAULT 15,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(sql`
    CREATE TABLE fixed_assets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      asset_number TEXT,
      purchase_date TEXT NOT NULL,
      purchase_price REAL NOT NULL,
      depreciation_method TEXT NOT NULL DEFAULT 'straight_line' CHECK(depreciation_method IN ('straight_line', 'diminishing_value')),
      depreciation_rate REAL NOT NULL DEFAULT 0,
      current_value REAL NOT NULL,
      accumulated_depreciation REAL NOT NULL DEFAULT 0,
      asset_account_code TEXT NOT NULL,
      depreciation_account_code TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'registered' CHECK(status IN ('registered', 'disposed', 'sold')),
      disposal_date TEXT,
      disposal_price REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(sql`
    CREATE TABLE gst_returns (
      id TEXT PRIMARY KEY,
      period TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'filed', 'overdue')),
      gst_collected REAL NOT NULL DEFAULT 0,
      gst_paid REAL NOT NULL DEFAULT 0,
      net_gst REAL NOT NULL DEFAULT 0,
      filed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(sql`
    CREATE TABLE budgets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      financial_year TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'archived')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(sql`
    CREATE TABLE budget_lines (
      id TEXT PRIMARY KEY,
      budget_id TEXT NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
      account_code TEXT NOT NULL,
      account_name TEXT NOT NULL DEFAULT '',
      month1 REAL NOT NULL DEFAULT 0, month2 REAL NOT NULL DEFAULT 0, month3 REAL NOT NULL DEFAULT 0,
      month4 REAL NOT NULL DEFAULT 0, month5 REAL NOT NULL DEFAULT 0, month6 REAL NOT NULL DEFAULT 0,
      month7 REAL NOT NULL DEFAULT 0, month8 REAL NOT NULL DEFAULT 0, month9 REAL NOT NULL DEFAULT 0,
      month10 REAL NOT NULL DEFAULT 0, month11 REAL NOT NULL DEFAULT 0, month12 REAL NOT NULL DEFAULT 0
    )
  `);

  db.run(sql`
    CREATE TABLE leave_requests (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL REFERENCES employees(id),
      leave_type TEXT NOT NULL CHECK(leave_type IN ('annual', 'sick', 'bereavement', 'parental', 'unpaid')),
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      hours REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'declined')),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(sql`
    CREATE TABLE pay_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('earnings', 'deduction', 'reimbursement', 'tax')),
      rate_type TEXT NOT NULL DEFAULT 'fixed' CHECK(rate_type IN ('fixed', 'per_hour', 'percentage')),
      amount REAL NOT NULL DEFAULT 0,
      account_code TEXT,
      is_default INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(sql`
    CREATE TABLE project_expenses (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      category TEXT,
      is_billable INTEGER NOT NULL DEFAULT 1,
      is_invoiced INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(sql`
    CREATE TABLE project_tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo', 'in_progress', 'done')),
      assignee_id TEXT REFERENCES employees(id),
      estimated_hours REAL,
      actual_hours REAL NOT NULL DEFAULT 0,
      due_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(sql`
    CREATE TABLE settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(sql`
    CREATE TABLE expenses (
      id TEXT PRIMARY KEY,
      employee_id TEXT REFERENCES employees(id),
      contact_id TEXT REFERENCES contacts(id),
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      tax_rate REAL NOT NULL DEFAULT 15,
      tax_amount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      category TEXT,
      receipt_url TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'approved', 'reimbursed', 'declined')),
      account_code TEXT,
      notes TEXT,
      mileage_km REAL,
      mileage_rate REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(sql`
    CREATE TABLE products (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      purchase_price REAL NOT NULL DEFAULT 0,
      sale_price REAL NOT NULL DEFAULT 0,
      account_code TEXT,
      tax_rate REAL NOT NULL DEFAULT 15,
      is_tracked INTEGER NOT NULL DEFAULT 0,
      quantity_on_hand REAL NOT NULL DEFAULT 0,
      is_sold INTEGER NOT NULL DEFAULT 1,
      is_purchased INTEGER NOT NULL DEFAULT 1,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(sql`
    CREATE TABLE stock_movements (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('invoice', 'bill', 'adjustment')),
      quantity REAL NOT NULL,
      reason TEXT,
      notes TEXT,
      reference_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(sql`
    CREATE TABLE tracking_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      options TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(sql`
    CREATE TABLE currencies (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      rate REAL NOT NULL DEFAULT 1.0,
      enabled INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT
    )
  `);

  db.run(sql`
    CREATE TABLE smart_lists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      filters TEXT NOT NULL,
      created_at TEXT
    )
  `);

  db.run(sql`
    CREATE TABLE leave_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      paid_leave INTEGER NOT NULL DEFAULT 1,
      show_on_payslip INTEGER NOT NULL DEFAULT 1,
      default_days_per_year INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.run(sql`
    CREATE TABLE connected_apps (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      icon TEXT NOT NULL DEFAULT '',
      connected INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT
    )
  `);

  db.run(sql`
    CREATE TABLE notification_preferences (
      id TEXT PRIMARY KEY DEFAULT 'default',
      overdue_reminders INTEGER NOT NULL DEFAULT 1,
      overdue_reminder_days INTEGER NOT NULL DEFAULT 7,
      payment_confirmations INTEGER NOT NULL DEFAULT 1,
      quote_expiry_alerts INTEGER NOT NULL DEFAULT 1,
      quote_expiry_days_before INTEGER NOT NULL DEFAULT 7,
      bill_due_alerts INTEGER NOT NULL DEFAULT 1,
      bill_due_days_before INTEGER NOT NULL DEFAULT 3,
      bank_feed_updates INTEGER NOT NULL DEFAULT 1
    )
  `);

  db.run(sql`
    CREATE TABLE supplier_prepayments (
      id TEXT PRIMARY KEY,
      contact_id TEXT NOT NULL,
      contact_name TEXT NOT NULL DEFAULT '',
      amount REAL NOT NULL,
      balance REAL NOT NULL,
      date TEXT NOT NULL,
      reference TEXT NOT NULL DEFAULT '',
      created_at TEXT
    )
  `);

  db.run(sql`
    CREATE TABLE tax_rates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      rate REAL NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  return {
    db,
    cleanup: () => sqlite.close(),
  };
}
