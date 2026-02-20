import { describe, it, expect } from 'vitest';
import { generatePayslipPdf } from '../generatePayslip';
import type { PayslipPdfData } from '../generatePayslip';

const sampleData: PayslipPdfData = {
  companyName: 'Demo Company (NZ)',
  companyAddress: '123 Business St, Wellington',
  employeeName: 'Sarah Chen',
  employeePosition: 'Software Engineer',
  employeeTaxCode: 'M',
  employeeIrdNumber: '12-345-678',
  bankAccount: '01-0123-0456789-00',
  payPeriod: '1 Jan 2026 - 31 Jan 2026',
  payDate: '2026-02-01',
  grossPay: 7916.67,
  paye: 1979.17,
  kiwiSaverEmployee: 237.50,
  kiwiSaverEmployer: 237.50,
  studentLoan: 0,
  netPay: 5700.00,
};

describe('generatePayslipPdf', () => {
  it('returns a PdfDocument with title, html, and styles', () => {
    const doc = generatePayslipPdf(sampleData);
    expect(doc.title).toContain('Sarah Chen');
    expect(doc.html).toContain('<!DOCTYPE html>');
    expect(doc.styles).toEqual(expect.any(String));
  });

  it('includes company info in HTML', () => {
    const doc = generatePayslipPdf(sampleData);
    expect(doc.html).toContain('Demo Company (NZ)');
    expect(doc.html).toContain('123 Business St, Wellington');
  });

  it('includes employee details in HTML', () => {
    const doc = generatePayslipPdf(sampleData);
    expect(doc.html).toContain('Sarah Chen');
    expect(doc.html).toContain('Software Engineer');
    expect(doc.html).toContain('12-345-678');
    expect(doc.html).toContain('01-0123-0456789-00');
  });

  it('includes earnings and deductions', () => {
    const doc = generatePayslipPdf(sampleData);
    expect(doc.html).toContain('Gross Pay');
    expect(doc.html).toContain('7,916.67');
    expect(doc.html).toContain('PAYE');
    expect(doc.html).toContain('1,979.17');
    expect(doc.html).toContain('KiwiSaver');
    expect(doc.html).toContain('237.50');
    expect(doc.html).toContain('Net Pay');
    expect(doc.html).toContain('5,700.00');
  });

  it('includes student loan when non-zero', () => {
    const dataWithLoan: PayslipPdfData = { ...sampleData, studentLoan: 150.00 };
    const doc = generatePayslipPdf(dataWithLoan);
    expect(doc.html).toContain('Student Loan');
    expect(doc.html).toContain('150.00');
  });

  it('omits student loan row when zero', () => {
    const doc = generatePayslipPdf(sampleData);
    expect(doc.html).not.toContain('Student Loan');
  });

  it('includes pay period in footer', () => {
    const doc = generatePayslipPdf(sampleData);
    expect(doc.html).toContain('1 Jan 2026 - 31 Jan 2026');
  });
});
