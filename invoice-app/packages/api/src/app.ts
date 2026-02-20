import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { contactRoutes } from './routes/contacts';
import { invoiceRoutes } from './routes/invoices';
import { billRoutes } from './routes/bills';
import { paymentRoutes } from './routes/payments';
import { accountRoutes } from './routes/accounts';
import { dashboardRoutes } from './routes/dashboard';
import { journalRoutes } from './routes/journals';
import { reportRoutes } from './routes/reports';
import { employeeRoutes } from './routes/employees';
import { payRunRoutes } from './routes/pay-runs';
import { projectRoutes } from './routes/projects';
import { timesheetRoutes } from './routes/timesheets';
import { bankTransactionRoutes } from './routes/bank-transactions';
import { quoteRoutes } from './routes/quotes';
import { recurringInvoiceRoutes } from './routes/recurring-invoices';
import { creditNoteRoutes } from './routes/credit-notes';
import { purchaseOrderRoutes } from './routes/purchase-orders';
import { recurringBillRoutes } from './routes/recurring-bills';
import { contactGroupRoutes } from './routes/contact-groups';
import { bankRuleRoutes } from './routes/bank-rules';
import { fixedAssetRoutes } from './routes/fixed-assets';
import { gstReturnRoutes } from './routes/gst-returns';
import { budgetRoutes } from './routes/budgets';
import { leaveRequestRoutes } from './routes/leave-requests';
import { payItemRoutes } from './routes/pay-items';
import { projectExpenseRoutes } from './routes/project-expenses';
import { projectTaskRoutes } from './routes/project-tasks';
import { settingsRoutes } from './routes/settings';
import { expenseRoutes } from './routes/expenses';
import { productRoutes } from './routes/products';
import { trackingCategoryRoutes } from './routes/tracking-categories';
import { auditRoutes } from './routes/audit';
import { currencyRoutes } from './routes/currencies';
import { smartListRoutes } from './routes/smart-lists';
import { leaveTypeRoutes } from './routes/leave-types';
import { connectedAppRoutes } from './routes/connected-apps';
import { notificationPreferenceRoutes } from './routes/notification-preferences';
import { supplierPrepaymentRoutes } from './routes/supplier-prepayments';
import { payrollSettingRoutes } from './routes/payroll-settings';
import { taxRateRoutes } from './routes/tax-rates';
import type { Db } from './db/index';

/**
 * Create the Hono app with all routes wired to the given DB.
 * Separated from server start so tests can use in-memory DB.
 */
export function createApp(db: Db) {
  const app = new Hono();

  app.use('*', cors({
    origin: ['http://localhost:5174', 'http://localhost:5175'],
  }));

  // Health check
  app.get('/api/health', (c) => {
    return c.json({ ok: true, timestamp: new Date().toISOString() });
  });

  // Mount route groups — Core
  app.route('/api/contacts', contactRoutes(db));
  app.route('/api/invoices', invoiceRoutes(db));
  app.route('/api/bills', billRoutes(db));
  app.route('/api/payments', paymentRoutes(db));
  app.route('/api/accounts', accountRoutes(db));
  app.route('/api/dashboard', dashboardRoutes(db));
  app.route('/api/journals', journalRoutes(db));
  app.route('/api/reports', reportRoutes(db));
  app.route('/api/employees', employeeRoutes(db));
  app.route('/api/pay-runs', payRunRoutes(db));
  app.route('/api/projects', projectRoutes(db));
  app.route('/api/timesheets', timesheetRoutes(db));
  app.route('/api/bank-transactions', bankTransactionRoutes(db));

  // Mount route groups — Wave D sub-features
  app.route('/api/quotes', quoteRoutes(db));
  app.route('/api/recurring-invoices', recurringInvoiceRoutes(db));
  app.route('/api/credit-notes', creditNoteRoutes(db));
  app.route('/api/purchase-orders', purchaseOrderRoutes(db));
  app.route('/api/recurring-bills', recurringBillRoutes(db));
  app.route('/api/contact-groups', contactGroupRoutes(db));
  app.route('/api/bank-rules', bankRuleRoutes(db));
  app.route('/api/fixed-assets', fixedAssetRoutes(db));
  app.route('/api/gst-returns', gstReturnRoutes(db));
  app.route('/api/budgets', budgetRoutes(db));
  app.route('/api/leave-requests', leaveRequestRoutes(db));
  app.route('/api/pay-items', payItemRoutes(db));
  app.route('/api/project-expenses', projectExpenseRoutes(db));
  app.route('/api/project-tasks', projectTaskRoutes(db));
  app.route('/api/settings', settingsRoutes(db));

  // Mount route groups — Wave G new modules
  app.route('/api/expenses', expenseRoutes(db));
  app.route('/api/products', productRoutes(db));
  app.route('/api/tracking-categories', trackingCategoryRoutes(db));

  // Audit (in-memory, no DB dependency)
  app.route('/api/audit', auditRoutes());

  // Wave M routes
  app.route('/api/currencies', currencyRoutes(db));
  app.route('/api/smart-lists', smartListRoutes(db));
  app.route('/api/leave-types', leaveTypeRoutes(db));
  app.route('/api/connected-apps', connectedAppRoutes(db));
  app.route('/api/notification-preferences', notificationPreferenceRoutes(db));
  app.route('/api/supplier-prepayments', supplierPrepaymentRoutes(db));
  app.route('/api/payroll-settings', payrollSettingRoutes(db));
  app.route('/api/tax-rates', taxRateRoutes(db));

  return app;
}
