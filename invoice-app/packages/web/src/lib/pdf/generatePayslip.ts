/**
 * Payslip PDF generator.
 * Generates a print-ready HTML document for a single payslip.
 */

import { pdfBaseStyles } from './styles';
import type { PdfDocument } from './generatePdf';

export interface PayslipPdfData {
  companyName: string;
  companyAddress: string;
  employeeName: string;
  employeePosition: string;
  employeeTaxCode: string;
  employeeIrdNumber: string;
  bankAccount: string;
  payPeriod: string;
  payDate: string;
  grossPay: number;
  paye: number;
  kiwiSaverEmployee: number;
  kiwiSaverEmployer: number;
  studentLoan: number;
  netPay: number;
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-NZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function generatePayslipPdf(data: PayslipPdfData): PdfDocument {
  const title = `Payslip - ${data.employeeName} - ${data.payPeriod}`;

  const totalDeductions = data.paye + data.kiwiSaverEmployee + data.studentLoan;

  const studentLoanRow = data.studentLoan > 0
    ? `<tr><td>Student Loan</td><td class="text-right">$${formatCurrency(data.studentLoan)}</td></tr>`
    : '';

  const bodyHtml = `
    <div class="pdf-header">
      <div class="company-info">
        <div class="company-name">${escapeHtml(data.companyName)}</div>
        <div class="company-details">${escapeHtml(data.companyAddress)}</div>
      </div>
      <div class="doc-title-block">
        <div class="doc-title">PAYSLIP</div>
        <div class="doc-number">${escapeHtml(data.payPeriod)}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-block">
        <div class="info-row">
          <div class="info-label">Employee</div>
          <div class="info-value">${escapeHtml(data.employeeName)}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Position</div>
          <div class="info-value">${escapeHtml(data.employeePosition)}</div>
        </div>
        <div class="info-row">
          <div class="info-label">IRD Number</div>
          <div class="info-value">${escapeHtml(data.employeeIrdNumber)}</div>
        </div>
      </div>
      <div class="info-block-right">
        <div class="info-row">
          <div class="info-label">Pay Date</div>
          <div class="info-value">${escapeHtml(data.payDate)}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Tax Code</div>
          <div class="info-value">${escapeHtml(data.employeeTaxCode)}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Bank Account</div>
          <div class="info-value">${escapeHtml(data.bankAccount)}</div>
        </div>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Earnings</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Gross Pay</td>
          <td class="text-right">$${formatCurrency(data.grossPay)}</td>
        </tr>
      </tbody>
    </table>

    <table class="items-table">
      <thead>
        <tr>
          <th>Deductions</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>PAYE</td>
          <td class="text-right">$${formatCurrency(data.paye)}</td>
        </tr>
        <tr>
          <td>KiwiSaver (Employee ${data.kiwiSaverEmployee > 0 ? '' : '0%'})</td>
          <td class="text-right">$${formatCurrency(data.kiwiSaverEmployee)}</td>
        </tr>
        ${studentLoanRow}
        <tr style="font-weight:600; border-top: 2px solid #e5e7eb;">
          <td>Total Deductions</td>
          <td class="text-right">$${formatCurrency(totalDeductions)}</td>
        </tr>
      </tbody>
    </table>

    <table class="items-table" style="margin-bottom:8px;">
      <thead>
        <tr>
          <th>Employer Contributions</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>KiwiSaver (Employer)</td>
          <td class="text-right">$${formatCurrency(data.kiwiSaverEmployer)}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals-section">
      <table class="totals-table">
        <tr class="total-row">
          <td>Net Pay</td>
          <td>$${formatCurrency(data.netPay)}</td>
        </tr>
      </table>
    </div>

    <div class="pdf-footer">
      This payslip is for the period ${escapeHtml(data.payPeriod)}
    </div>
  `;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>${pdfBaseStyles}</style>
</head>
<body>
  <div class="pdf-container">
    ${bodyHtml}
  </div>
</body>
</html>`;

  return {
    title,
    html,
    styles: pdfBaseStyles,
  };
}
