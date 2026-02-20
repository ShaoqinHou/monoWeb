import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import { RootLayout } from './components/layout/RootLayout';

// Feature page imports
import { DashboardPage } from './features/dashboard/routes/DashboardPage';
import { InvoicesPage, InvoiceDetailPage, InvoiceCreatePage, InvoiceEditPage } from './features/invoices/routes/InvoicesPage';
import { SalesOverviewPage } from './features/sales-overview/routes/SalesOverviewPage';
import { QuotesPage } from './features/invoices/routes/QuotesPage';
import { QuoteCreatePage, QuoteDetailPage } from './features/invoices/routes/QuoteSubPages';
import { BillsPage, BillDetailPage, BillCreatePage, PurchaseCreditNotesPage } from './features/bills/routes/BillsPage';
import { PurchasesOverviewPage } from './features/purchases-overview/routes/PurchasesOverviewPage';
import { PurchaseOrdersPage } from './features/bills/routes/PurchaseOrdersPage';
import { PurchaseOrderCreatePage, PurchaseOrderDetailPage } from './features/bills/routes/PurchaseOrderSubPages';
import { ContactsPage, ContactDetailPage, ContactCreatePage, ContactEditPage } from './features/contacts/routes/ContactsPage';
import { ChartOfAccountsPage, ManualJournalsPage, ChartOfAccountsCreatePage, BankAccountsPage } from './features/accounting/routes/AccountingPage';
import { ChartOfAccountsEditPage } from './features/accounting/routes/ChartOfAccountsEditPage';
import { JournalDetailPage } from './features/accounting/routes/JournalDetailPage';
import { BankRulesPage } from './features/accounting/routes/BankRulesPage';
import { FixedAssetsPage } from './features/accounting/routes/FixedAssetsPage';
import { FindAndRecodePage } from './features/accounting/routes/FindAndRecodePage';
import { AssetReportsPage } from './features/accounting/routes/AssetReportsPage';
import { ReportingPage, ProfitAndLossPage, BalanceSheetPage } from './features/reporting/routes/ReportingPage';
import { AgedReceivablesPage } from './features/reporting/routes/AgedReceivablesPage';
import { AgedPayablesPage } from './features/reporting/routes/AgedPayablesPage';
import { BudgetsPage } from './features/reporting/routes/BudgetsPage';
import { TrialBalancePage } from './features/reporting/routes/TrialBalancePage';
import { CashFlowForecastPage } from './features/reporting/routes/CashFlowForecastPage';
import { AccountTransactionsPage } from './features/reporting/routes/AccountTransactionsPage';
import { BusinessSnapshotPage } from './features/reporting/routes/BusinessSnapshotPage';
import { ExecutiveSummaryPage } from './features/reporting/routes/ExecutiveSummaryPage';
import { PayrollReportPage } from './features/reporting/routes/PayrollReportPage';
import { BankReconciliationReportPage } from './features/reporting/routes/BankReconciliationReportPage';
import { PayrollOverviewPage, EmployeesPage, PayRunsPage, EmployeeDetailPage, PayRunDetailPage } from './features/payroll/routes/PayrollPage';
import { EmployeeCreatePage } from './features/payroll/routes/EmployeeCreatePage';
import { EmployeeEditPage } from './features/payroll/routes/EmployeeEditPage';
import { LeaveRequestsPage } from './features/payroll/routes/LeaveRequestsPage';
import { TimesheetsPage } from './features/payroll/routes/TimesheetsPage';
import { TaxesFilingsPage } from './features/payroll/routes/TaxesFilingsPage';
import { PayrollSettingsPage } from './features/payroll/routes/PayrollSettingsPage';
import { YearEndSummaryPage } from './features/payroll/routes/YearEndSummaryPage';
import { ProjectsPage, ProjectDetailPage, TimeEntriesPage } from './features/projects/routes/ProjectsPage';
import { ProjectCreatePage } from './features/projects/routes/ProjectCreatePage';
import { StaffTimeOverviewPage } from './features/projects/routes/StaffTimeOverviewPage';
import { GSTReturnsPage, TaxRatesPage } from './features/tax/routes/TaxPage';
import { TaxAuditReportPage } from './features/tax/routes/TaxAuditReportPage';
import { BankReconciliationPage } from './features/accounting/bank/routes/BankPage';
import { CashCodingPage } from './features/accounting/bank/routes/CashCodingPage';
import { SpendMoneyPage } from './features/accounting/bank/routes/SpendMoneyPage';
import { ReceiveMoneyPage } from './features/accounting/bank/routes/ReceiveMoneyPage';
import { TransferMoneyPage } from './features/accounting/bank/routes/TransferMoneyPage';
import { ReconciliationReportPage } from './features/accounting/bank/routes/ReconciliationReportPage';
import { SettingsPage, UsersPage } from './features/settings/routes/SettingsPage';
import { PaymentServicesPage } from './features/settings/routes/PaymentServicesPage';
import { EmailTemplatesPage } from './features/settings/routes/EmailTemplatesPage';
import { CurrenciesPage } from './features/settings/routes/CurrenciesPage';
import { TrackingCategoriesSettingsPage } from './features/settings/routes/TrackingCategoriesSettingsPage';
import { BrandingPage } from './features/settings/routes/BrandingPage';
import { ConnectedAppsPage } from './features/settings/routes/ConnectedAppsPage';
import { PaymentLinksPage } from './features/sales-overview/routes/PaymentLinksPage';
import { AssuranceDashboardPage } from './features/accounting/routes/AssuranceDashboardPage';
import { HistoryAndNotesPage } from './features/accounting/routes/HistoryAndNotesPage';
import { PayrollReportsPage } from './features/payroll/routes/PayrollReportsPage';
import { AuditTrailPage } from './features/audit/routes/AuditTrailPage';
import { ProductsPage, ProductCreatePage, ProductDetailPage } from './features/products/routes/ProductsPage';
import { ExpensesPage, ExpenseCreatePage, ExpenseDetailPage } from './features/expenses/routes/ExpensesPage';

// Root
const rootRoute = createRootRoute({
  component: RootLayout,
});

// Home
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
});

// Sales
const salesOverviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sales',
  component: SalesOverviewPage,
});

const invoicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sales/invoices',
  component: InvoicesPage,
});

const invoiceCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sales/invoices/new',
  component: InvoiceCreatePage,
});

const invoiceDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sales/invoices/$invoiceId',
  component: InvoiceDetailPage,
});

const invoiceEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sales/invoices/$invoiceId/edit',
  component: InvoiceEditPage,
});

const quotesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sales/quotes',
  component: QuotesPage,
});

const quoteCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sales/quotes/new',
  component: QuoteCreatePage,
});

const quoteDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sales/quotes/$quoteId',
  component: QuoteDetailPage,
});

const paymentLinksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sales/payment-links',
  component: PaymentLinksPage,
});

// Purchases
const purchasesOverviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/purchases',
  component: PurchasesOverviewPage,
});

const billsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/purchases/bills',
  component: BillsPage,
});

const billCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/purchases/bills/new',
  component: BillCreatePage,
});

const billDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/purchases/bills/$billId',
  component: BillDetailPage,
});

const purchaseOrdersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/purchases/purchase-orders',
  component: PurchaseOrdersPage,
});

const purchaseOrderCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/purchases/purchase-orders/new',
  component: PurchaseOrderCreatePage,
});

const purchaseOrderDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/purchases/purchase-orders/$orderId',
  component: PurchaseOrderDetailPage,
});

const purchaseCreditNotesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/purchases/credit-notes',
  component: PurchaseCreditNotesPage,
});

// Contacts
const contactsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/contacts',
  component: ContactsPage,
});

const contactCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/contacts/new',
  component: ContactCreatePage,
});

const contactDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/contacts/$contactId',
  component: ContactDetailPage,
});

const contactEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/contacts/$contactId/edit',
  component: ContactEditPage,
});

// Accounting
const chartOfAccountsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/accounting/chart-of-accounts',
  component: ChartOfAccountsPage,
});

const chartOfAccountsCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/accounting/chart-of-accounts/new',
  component: ChartOfAccountsCreatePage,
});

const chartOfAccountsEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/accounting/chart-of-accounts/$accountId/edit',
  component: ChartOfAccountsEditPage,
});

const manualJournalsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/accounting/manual-journals',
  component: ManualJournalsPage,
});

const journalCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/accounting/manual-journals/new',
  component: ManualJournalsPage,
});

const journalDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/accounting/manual-journals/$journalId',
  component: JournalDetailPage,
});

const bankRulesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/accounting/bank-rules',
  component: BankRulesPage,
});

const bankAccountsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/accounting/bank-accounts',
  component: BankAccountsPage,
});

const fixedAssetsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/accounting/fixed-assets',
  component: FixedAssetsPage,
});

const findAndRecodeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/accounting/find-and-recode',
  component: FindAndRecodePage,
});

const assetReportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/accounting/fixed-assets/reports',
  component: AssetReportsPage,
});

const assuranceDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/accounting/assurance-dashboard',
  component: AssuranceDashboardPage,
});

const historyAndNotesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/accounting/history-and-notes',
  component: HistoryAndNotesPage,
});

// Reporting
const reportingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reporting',
  component: ReportingPage,
});

const profitAndLossRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reporting/profit-and-loss',
  component: ProfitAndLossPage,
});

const balanceSheetRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reporting/balance-sheet',
  component: BalanceSheetPage,
});

const agedReceivablesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reporting/aged-receivables',
  component: AgedReceivablesPage,
});

const agedPayablesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reporting/aged-payables',
  component: AgedPayablesPage,
});

const budgetsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reporting/budgets',
  component: BudgetsPage,
});

const trialBalanceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reporting/trial-balance',
  component: TrialBalancePage,
});

const cashFlowForecastRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reporting/cash-flow-forecast',
  component: CashFlowForecastPage,
});

const accountTransactionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reporting/account-transactions',
  component: AccountTransactionsPage,
});

const businessSnapshotRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reporting/business-snapshot',
  component: BusinessSnapshotPage,
});

const executiveSummaryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reporting/executive-summary',
  component: ExecutiveSummaryPage,
});

const payrollReportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reporting/payroll-report',
  component: PayrollReportPage,
});

const bankReconciliationReportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reporting/bank-reconciliation',
  component: BankReconciliationReportPage,
});

// Payroll
const payrollRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payroll',
  component: PayrollOverviewPage,
});

const employeesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payroll/employees',
  component: EmployeesPage,
});

const employeeCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payroll/employees/new',
  component: EmployeeCreatePage,
});

const employeeDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payroll/employees/$employeeId',
  component: EmployeeDetailPage,
});

const employeeEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payroll/employees/$employeeId/edit',
  component: EmployeeEditPage,
});

const payRunsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payroll/pay-runs',
  component: PayRunsPage,
});

const payRunDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payroll/pay-runs/$payRunId',
  component: PayRunDetailPage,
});

const leaveRequestsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payroll/leave-requests',
  component: LeaveRequestsPage,
});

const timesheetsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payroll/timesheets',
  component: TimesheetsPage,
});

const taxesFilingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payroll/taxes-filings',
  component: TaxesFilingsPage,
});

const payrollSettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payroll/settings',
  component: PayrollSettingsPage,
});

const payrollReportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payroll/reports',
  component: PayrollReportsPage,
});

const yearEndSummaryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payroll/year-end',
  component: YearEndSummaryPage,
});

// Projects
const projectsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects',
  component: ProjectsPage,
});

const projectCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects/new',
  component: ProjectCreatePage,
});

const projectDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects/$projectId',
  component: ProjectDetailPage,
});

const timeEntriesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects/time-entries',
  component: TimeEntriesPage,
});

const staffTimeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects/staff-time',
  component: StaffTimeOverviewPage,
});

// Tax
const taxIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tax',
  component: GSTReturnsPage,
});

const gstReturnsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tax/gst-returns',
  component: GSTReturnsPage,
});

const taxRatesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tax/tax-rates',
  component: TaxRatesPage,
});

const taxAuditReportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tax/audit-report',
  component: TaxAuditReportPage,
});

// Bank
const bankRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bank',
  component: BankReconciliationPage,
});

const cashCodingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bank/cash-coding',
  component: CashCodingPage,
});

const spendMoneyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bank/spend',
  component: SpendMoneyPage,
});

const receiveMoneyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bank/receive',
  component: ReceiveMoneyPage,
});

const transferMoneyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bank/transfer',
  component: TransferMoneyPage,
});

const reconciliationReportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bank/reconciliation-report',
  component: ReconciliationReportPage,
});

// Settings
const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
});

const paymentServicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings/payment-services',
  component: PaymentServicesPage,
});

const emailTemplatesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings/email-templates',
  component: EmailTemplatesPage,
});

const currenciesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings/currencies',
  component: CurrenciesPage,
});

const trackingCategoriesSettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings/tracking-categories',
  component: TrackingCategoriesSettingsPage,
});

const brandingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings/branding',
  component: BrandingPage,
});

const connectedAppsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings/connected-apps',
  component: ConnectedAppsPage,
});

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings/users',
  component: UsersPage,
});

// Audit Trail
const auditTrailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/audit',
  component: AuditTrailPage,
});

// Products
const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sales/products',
  component: ProductsPage,
});

const productCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sales/products/new',
  component: ProductCreatePage,
});

const productDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sales/products/$productId',
  component: ProductDetailPage,
});

// Expenses
const expensesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/purchases/expenses',
  component: ExpensesPage,
});

const expenseCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/purchases/expenses/new',
  component: ExpenseCreatePage,
});

const expenseDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/purchases/expenses/$expenseId',
  component: ExpenseDetailPage,
});

// Route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  // Sales
  salesOverviewRoute,
  invoicesRoute,
  invoiceCreateRoute,
  invoiceDetailRoute,
  invoiceEditRoute,
  quotesRoute,
  quoteCreateRoute,
  quoteDetailRoute,
  paymentLinksRoute,
  // Purchases
  purchasesOverviewRoute,
  billsRoute,
  billCreateRoute,
  billDetailRoute,
  purchaseOrdersRoute,
  purchaseOrderCreateRoute,
  purchaseOrderDetailRoute,
  purchaseCreditNotesRoute,
  // Contacts
  contactsRoute,
  contactCreateRoute,
  contactDetailRoute,
  contactEditRoute,
  // Accounting
  chartOfAccountsRoute,
  chartOfAccountsCreateRoute,
  chartOfAccountsEditRoute,
  manualJournalsRoute,
  journalCreateRoute,
  journalDetailRoute,
  bankRulesRoute,
  bankAccountsRoute,
  fixedAssetsRoute,
  findAndRecodeRoute,
  assetReportsRoute,
  assuranceDashboardRoute,
  historyAndNotesRoute,
  // Reporting
  reportingRoute,
  profitAndLossRoute,
  balanceSheetRoute,
  agedReceivablesRoute,
  agedPayablesRoute,
  budgetsRoute,
  trialBalanceRoute,
  cashFlowForecastRoute,
  accountTransactionsRoute,
  businessSnapshotRoute,
  executiveSummaryRoute,
  payrollReportRoute,
  bankReconciliationReportRoute,
  // Payroll
  payrollRoute,
  employeesRoute,
  employeeCreateRoute,
  employeeDetailRoute,
  employeeEditRoute,
  payRunsRoute,
  payRunDetailRoute,
  leaveRequestsRoute,
  timesheetsRoute,
  taxesFilingsRoute,
  payrollSettingsRoute,
  payrollReportsRoute,
  yearEndSummaryRoute,
  // Projects
  projectsRoute,
  projectCreateRoute,
  projectDetailRoute,
  timeEntriesRoute,
  staffTimeRoute,
  // Tax
  taxIndexRoute,
  gstReturnsRoute,
  taxRatesRoute,
  taxAuditReportRoute,
  // Bank
  bankRoute,
  cashCodingRoute,
  spendMoneyRoute,
  receiveMoneyRoute,
  transferMoneyRoute,
  reconciliationReportRoute,
  // Settings
  settingsRoute,
  paymentServicesRoute,
  emailTemplatesRoute,
  currenciesRoute,
  trackingCategoriesSettingsRoute,
  brandingRoute,
  connectedAppsRoute,
  usersRoute,
  // Audit
  auditTrailRoute,
  // Products
  productsRoute,
  productCreateRoute,
  productDetailRoute,
  // Expenses
  expensesRoute,
  expenseCreateRoute,
  expenseDetailRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
