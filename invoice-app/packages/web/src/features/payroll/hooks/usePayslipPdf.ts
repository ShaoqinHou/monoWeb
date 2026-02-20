import { useCallback } from 'react';
import { generatePayslipPdf, type PayslipPdfData } from '../../../lib/pdf/generatePayslip';
import { downloadPdfAsHtml } from '../../../lib/pdf/generatePdf';

interface UsePayslipPdfOptions {
  companyName: string;
  companyAddress: string;
  payPeriod: string;
  payDate: string;
}

interface PayslipInput {
  employeeName: string;
  employeePosition: string;
  employeeTaxCode: string;
  employeeIrdNumber: string;
  bankAccount: string;
  grossPay: number;
  paye: number;
  kiwiSaverEmployee: number;
  kiwiSaverEmployer: number;
  studentLoan: number;
  netPay: number;
}

export function usePayslipPdf(options: UsePayslipPdfOptions) {
  const downloadPayslip = useCallback((input: PayslipInput) => {
    const data: PayslipPdfData = {
      companyName: options.companyName,
      companyAddress: options.companyAddress,
      payPeriod: options.payPeriod,
      payDate: options.payDate,
      ...input,
    };

    const doc = generatePayslipPdf(data);
    const filename = `payslip-${input.employeeName.replace(/\s+/g, '-').toLowerCase()}-${options.payPeriod}.html`;
    downloadPdfAsHtml(doc, filename);
  }, [options.companyName, options.companyAddress, options.payPeriod, options.payDate]);

  return { downloadPayslip };
}
