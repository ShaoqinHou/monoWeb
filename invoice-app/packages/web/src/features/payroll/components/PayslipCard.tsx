import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { formatCurrency } from '@shared/calc/currency';
import { generatePayslipPdf } from '../../../lib/pdf/generatePayslip';
import { downloadPdfAsHtml } from '../../../lib/pdf/generatePdf';
import type { Payslip } from '../types';

interface PayslipCardProps {
  payslip: Payslip;
  companyName?: string;
  companyAddress?: string;
  payPeriod?: string;
  payDate?: string;
}

export function PayslipCard({
  payslip,
  companyName = 'Demo Company (NZ)',
  companyAddress = '',
  payPeriod = '',
  payDate = '',
}: PayslipCardProps) {
  const handleDownload = () => {
    const doc = generatePayslipPdf({
      companyName,
      companyAddress,
      employeeName: payslip.employeeName,
      employeePosition: '',
      employeeTaxCode: '',
      employeeIrdNumber: '',
      bankAccount: '',
      payPeriod,
      payDate,
      grossPay: payslip.gross,
      paye: payslip.paye,
      kiwiSaverEmployee: payslip.kiwiSaverEmployee,
      kiwiSaverEmployer: payslip.kiwiSaverEmployer,
      studentLoan: payslip.studentLoan,
      netPay: payslip.net,
    });
    const filename = `payslip-${payslip.employeeName.replace(/\s+/g, '-').toLowerCase()}.html`;
    downloadPdfAsHtml(doc, filename);
  };

  return (
    <Card data-testid={`payslip-${payslip.employeeId}`}>
      <CardContent>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-[#1a1a2e]">{payslip.employeeName}</h4>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#1a1a2e]">{formatCurrency(payslip.net)}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              data-testid={`download-payslip-${payslip.employeeId}`}
            >
              Download
            </Button>
          </div>
        </div>

        <dl className="space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-[#6b7280]">Gross Pay</dt>
            <dd className="font-medium">{formatCurrency(payslip.gross)}</dd>
          </div>

          <div className="border-t border-[#e5e7eb] pt-1 mt-1">
            <p className="text-xs font-medium text-[#6b7280] mb-1">Deductions</p>
          </div>

          <div className="flex justify-between pl-2">
            <dt className="text-[#6b7280]">PAYE</dt>
            <dd className="text-red-600">-{formatCurrency(payslip.paye)}</dd>
          </div>

          <div className="flex justify-between pl-2">
            <dt className="text-[#6b7280]">KiwiSaver (Employee)</dt>
            <dd className="text-red-600">-{formatCurrency(payslip.kiwiSaverEmployee)}</dd>
          </div>

          {payslip.kiwiSaverEmployer > 0 && (
            <div className="flex justify-between pl-2">
              <dt className="text-[#6b7280]">KiwiSaver (Employer)</dt>
              <dd className="text-[#6b7280]">{formatCurrency(payslip.kiwiSaverEmployer)}</dd>
            </div>
          )}

          {payslip.studentLoan > 0 && (
            <div className="flex justify-between pl-2">
              <dt className="text-[#6b7280]">Student Loan</dt>
              <dd className="text-red-600">-{formatCurrency(payslip.studentLoan)}</dd>
            </div>
          )}

          <div className="flex justify-between border-t border-[#e5e7eb] pt-1 mt-1">
            <dt className="text-[#6b7280] font-medium">Total Deductions</dt>
            <dd className="text-red-600 font-medium">-{formatCurrency(payslip.totalDeductions)}</dd>
          </div>

          <div className="flex justify-between border-t border-[#e5e7eb] pt-1 mt-1 font-semibold">
            <dt className="text-[#1a1a2e]">Net Pay</dt>
            <dd className="text-[#1a1a2e]">{formatCurrency(payslip.net)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
