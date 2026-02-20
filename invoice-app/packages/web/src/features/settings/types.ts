export interface OrganizationSettings {
  name: string;
  industry: string;
  address: string;
  gstNumber: string;
  financialYearEnd: number; // month 1-12
  defaultPaymentTerms: number; // days
  invoicePrefix: string;
  nextInvoiceNumber: number;
  billPrefix: string;
  nextBillNumber: number;
  defaultTaxRate: number;
  gstFilingFrequency: 'monthly' | 'bi-monthly' | 'six-monthly';
  // Financial settings
  baseCurrency: string;
  taxRegistration: string;
  lockDate: string; // YYYY-MM-DD or empty
  defaultSalesAccount: string;
  defaultPurchasesAccount: string;
}

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  lastLogin: string;
}
