export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  startDate: string;
  salary: number;
  payFrequency: 'weekly' | 'fortnightly' | 'monthly';
  status: 'active' | 'inactive';
  taxCode: string;
  irdNumber?: string; // format: XX-XXX-XXX
  kiwiSaverRate?: number; // e.g. 3, 4, 6, 8, 10 (percent)
  bankAccount?: string;
  employmentType?: 'employee' | 'contractor';
  nextPaymentDate?: string; // ISO date string e.g. '2023-07-18'
}

export type CreateEmployeeInput = Omit<Employee, 'id'>;
export type UpdateEmployeeInput = Partial<Omit<Employee, 'id'>>;

export interface Payslip {
  id: string;
  employeeId: string;
  employeeName: string;
  gross: number;
  paye: number;
  kiwiSaverEmployee: number;
  kiwiSaverEmployer: number;
  studentLoan: number;
  totalDeductions: number;
  net: number;
}

export interface PayRunEmployee {
  employeeId: string;
  employeeName: string;
  gross: number;
  tax: number;
  net: number;
}

export interface PayRun {
  id: string;
  periodStart: string;
  periodEnd: string;
  payDate: string;
  status: 'draft' | 'posted' | 'paid';
  employees: PayRunEmployee[];
  payslips?: Payslip[];
  totalGross: number;
  totalTax: number;
  totalNet: number;
}

export interface PayrollSummary {
  nextPayRunDate: string;
  totalEmployees: number;
  ytdPayrollCosts: number;
  totalCostLastMonth?: number;
  totalTaxLastMonth?: number;
  nextPaymentDate?: string;
}

export interface LeaveToApprove {
  id: string;
  employee: string;
  leaveType: string;
  leavePeriod: string;
  status: 'pending' | 'approved' | 'declined';
}

export interface CreatePayRunInput {
  periodStart: string;
  periodEnd: string;
  payDate: string;
}
