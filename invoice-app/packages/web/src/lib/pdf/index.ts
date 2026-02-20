export {
  generateInvoicePdf,
  generateQuotePdf,
  generateBillPdf,
  generateCreditNotePdf,
  generateStatementPdf,
  printPdf,
  downloadPdfAsHtml,
  type PdfDocument,
  type PdfLineItem,
  type InvoicePdfData,
  type QuotePdfData,
  type BillPdfData,
  type CreditNotePdfData,
  type StatementPdfData,
  type StatementEntry,
} from "./generatePdf";

export {
  generatePayslipPdf,
  type PayslipPdfData,
} from "./generatePayslip";

export { pdfBaseStyles } from "./styles";
