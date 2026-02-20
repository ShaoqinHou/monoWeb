/**
 * Client-side PDF generation via print-ready HTML documents.
 *
 * Each generator returns a PdfDocument containing styled HTML that can be:
 * - Previewed in an iframe (PdfPreview component)
 * - Printed via window.print()
 * - Downloaded as a self-contained HTML file
 */

import { pdfBaseStyles } from "./styles";

// ---------------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------------

export interface PdfDocument {
  title: string;
  html: string;
  styles: string;
}

export interface PdfLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  lineAmount: number;
  discount: number;
}

interface BaseCompanyInfo {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
}

// ---------------------------------------------------------------------------
// Data types for each document kind
// ---------------------------------------------------------------------------

export interface InvoicePdfData extends BaseCompanyInfo {
  contactName: string;
  contactEmail: string;
  contactAddress: string;
  invoiceNumber: string;
  reference?: string;
  date: string;
  dueDate: string;
  status: string;
  currency: string;
  amountType: string;
  lineItems: PdfLineItem[];
  subTotal: number;
  totalTax: number;
  total: number;
  amountDue: number;
  amountPaid: number;
}

export interface QuotePdfData extends BaseCompanyInfo {
  contactName: string;
  contactEmail: string;
  contactAddress: string;
  quoteNumber: string;
  reference?: string;
  date: string;
  expiryDate: string;
  currency: string;
  amountType: string;
  lineItems: PdfLineItem[];
  subTotal: number;
  totalTax: number;
  total: number;
}

export interface BillPdfData extends BaseCompanyInfo {
  supplierName: string;
  supplierEmail: string;
  supplierAddress: string;
  billNumber: string;
  reference?: string;
  date: string;
  dueDate: string;
  status: string;
  currency: string;
  amountType: string;
  lineItems: PdfLineItem[];
  subTotal: number;
  totalTax: number;
  total: number;
  amountDue: number;
  amountPaid: number;
}

export interface CreditNotePdfData extends BaseCompanyInfo {
  contactName: string;
  contactEmail: string;
  contactAddress: string;
  creditNoteNumber: string;
  reference?: string;
  date: string;
  currency: string;
  amountType: string;
  lineItems: PdfLineItem[];
  subTotal: number;
  totalTax: number;
  total: number;
}

export interface StatementEntry {
  date: string;
  description: string;
  reference: string;
  amount: number;
  balance: number;
}

export interface StatementPdfData extends BaseCompanyInfo {
  contactName: string;
  contactEmail: string;
  contactAddress: string;
  statementDate: string;
  fromDate: string;
  toDate: string;
  currency: string;
  entries: StatementEntry[];
  openingBalance: number;
  closingBalance: number;
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-NZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nl2br(str: string): string {
  return escapeHtml(str).replace(/\n/g, "<br>");
}

// ---------------------------------------------------------------------------
// HTML fragment builders
// ---------------------------------------------------------------------------

function buildCompanyBlock(data: BaseCompanyInfo): string {
  return `
    <div class="company-info">
      <div class="company-name">${escapeHtml(data.companyName)}</div>
      <div class="company-details">${nl2br(data.companyAddress)}</div>
      <div class="company-details">${escapeHtml(data.companyPhone)}</div>
      <div class="company-details">${escapeHtml(data.companyEmail)}</div>
    </div>
  `;
}

function buildTitleBlock(
  docType: string,
  docNumber: string,
  status?: string,
): string {
  const statusHtml = status
    ? `<div class="doc-status status-${status}">${escapeHtml(status)}</div>`
    : "";
  return `
    <div class="doc-title-block">
      <div class="doc-title">${escapeHtml(docType)}</div>
      <div class="doc-number">${escapeHtml(docNumber)}</div>
      ${statusHtml}
    </div>
  `;
}

function buildContactBlock(
  label: string,
  name: string,
  address: string,
  email: string,
): string {
  return `
    <div class="info-block">
      <div class="info-row">
        <div class="info-label">${escapeHtml(label)}</div>
        <div class="info-value">${escapeHtml(name)}</div>
        <div class="info-value">${nl2br(address)}</div>
        <div class="info-value">${escapeHtml(email)}</div>
      </div>
    </div>
  `;
}

function buildDetailsBlock(rows: Array<[string, string]>): string {
  const rowsHtml = rows
    .filter(([, value]) => value)
    .map(
      ([label, value]) => `
      <div class="info-row">
        <div class="info-label">${escapeHtml(label)}</div>
        <div class="info-value">${escapeHtml(value)}</div>
      </div>
    `,
    )
    .join("");
  return `<div class="info-block-right">${rowsHtml}</div>`;
}

function buildLineItemsTable(items: PdfLineItem[]): string {
  if (items.length === 0) {
    return `
      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Unit Price</th>
            <th class="text-right">Tax</th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr><td colspan="5" style="text-align:center; color:#9ca3af; padding:20px;">No line items</td></tr>
        </tbody>
      </table>
    `;
  }

  const rows = items
    .map(
      (item) => `
      <tr>
        <td>${escapeHtml(item.description)}</td>
        <td class="text-right">${item.quantity}</td>
        <td class="text-right">${formatCurrency(item.unitPrice)}</td>
        <td class="text-right">${formatCurrency(item.taxAmount)}</td>
        <td class="text-right">${formatCurrency(item.lineAmount)}</td>
      </tr>
    `,
    )
    .join("");

  return `
    <table class="items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Unit Price</th>
          <th class="text-right">Tax</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function buildTotalsSection(
  subTotal: number,
  totalTax: number,
  total: number,
  extras?: Array<[string, number, string?]>,
): string {
  const extraRows = (extras ?? [])
    .map(
      ([label, amount, cssClass]) => `
      <tr${cssClass ? ` class="${cssClass}"` : ""}>
        <td>${escapeHtml(label)}</td>
        <td>${formatCurrency(amount)}</td>
      </tr>
    `,
    )
    .join("");

  return `
    <div class="totals-section">
      <table class="totals-table">
        <tr>
          <td>Subtotal</td>
          <td>${formatCurrency(subTotal)}</td>
        </tr>
        <tr>
          <td>Tax</td>
          <td>${formatCurrency(totalTax)}</td>
        </tr>
        <tr class="total-row">
          <td>Total</td>
          <td>${formatCurrency(total)}</td>
        </tr>
        ${extraRows}
      </table>
    </div>
  `;
}

function wrapDocument(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
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
}

// ---------------------------------------------------------------------------
// Public generators
// ---------------------------------------------------------------------------

export function generateInvoicePdf(data: InvoicePdfData): PdfDocument {
  const title = `Invoice ${data.invoiceNumber}`;

  const detailRows: Array<[string, string]> = [
    ["Invoice Number", data.invoiceNumber],
    ["Date", data.date],
    ["Due Date", data.dueDate],
    ["Currency", data.currency],
  ];
  if (data.reference) {
    detailRows.push(["Reference", data.reference]);
  }

  const bodyHtml = `
    <div class="pdf-header">
      ${buildCompanyBlock(data)}
      ${buildTitleBlock("Invoice", data.invoiceNumber, data.status)}
    </div>
    <div class="info-grid">
      ${buildContactBlock("To", data.contactName, data.contactAddress, data.contactEmail)}
      ${buildDetailsBlock(detailRows)}
    </div>
    ${buildLineItemsTable(data.lineItems)}
    ${buildTotalsSection(data.subTotal, data.totalTax, data.total, [
      ["Amount Paid", data.amountPaid],
      ["Amount Due", data.amountDue, "amount-due-row"],
    ])}
    <div class="pdf-footer">
      Thank you for your business
    </div>
  `;

  return {
    title,
    html: wrapDocument(title, bodyHtml),
    styles: pdfBaseStyles,
  };
}

export function generateQuotePdf(data: QuotePdfData): PdfDocument {
  const title = `Quote ${data.quoteNumber}`;

  const detailRows: Array<[string, string]> = [
    ["Quote Number", data.quoteNumber],
    ["Date", data.date],
    ["Expiry Date", data.expiryDate],
    ["Currency", data.currency],
  ];
  if (data.reference) {
    detailRows.push(["Reference", data.reference]);
  }

  const bodyHtml = `
    <div class="pdf-header">
      ${buildCompanyBlock(data)}
      ${buildTitleBlock("Quote", data.quoteNumber)}
    </div>
    <div class="info-grid">
      ${buildContactBlock("To", data.contactName, data.contactAddress, data.contactEmail)}
      ${buildDetailsBlock(detailRows)}
    </div>
    ${buildLineItemsTable(data.lineItems)}
    ${buildTotalsSection(data.subTotal, data.totalTax, data.total)}
    <div class="pdf-footer">
      This quote is valid until ${escapeHtml(data.expiryDate)}
    </div>
  `;

  return {
    title,
    html: wrapDocument(title, bodyHtml),
    styles: pdfBaseStyles,
  };
}

export function generateBillPdf(data: BillPdfData): PdfDocument {
  const title = `Bill ${data.billNumber}`;

  const detailRows: Array<[string, string]> = [
    ["Bill Number", data.billNumber],
    ["Date", data.date],
    ["Due Date", data.dueDate],
    ["Currency", data.currency],
  ];
  if (data.reference) {
    detailRows.push(["Reference", data.reference]);
  }

  const bodyHtml = `
    <div class="pdf-header">
      ${buildCompanyBlock(data)}
      ${buildTitleBlock("Bill", data.billNumber, data.status)}
    </div>
    <div class="info-grid">
      ${buildContactBlock("From", data.supplierName, data.supplierAddress, data.supplierEmail)}
      ${buildDetailsBlock(detailRows)}
    </div>
    ${buildLineItemsTable(data.lineItems)}
    ${buildTotalsSection(data.subTotal, data.totalTax, data.total, [
      ["Amount Paid", data.amountPaid],
      ["Amount Due", data.amountDue, "amount-due-row"],
    ])}
    <div class="pdf-footer">
      Bill from ${escapeHtml(data.supplierName)}
    </div>
  `;

  return {
    title,
    html: wrapDocument(title, bodyHtml),
    styles: pdfBaseStyles,
  };
}

export function generateCreditNotePdf(data: CreditNotePdfData): PdfDocument {
  const title = `Credit Note ${data.creditNoteNumber}`;

  const detailRows: Array<[string, string]> = [
    ["Credit Note Number", data.creditNoteNumber],
    ["Date", data.date],
    ["Currency", data.currency],
  ];
  if (data.reference) {
    detailRows.push(["Reference", data.reference]);
  }

  const bodyHtml = `
    <div class="pdf-header">
      ${buildCompanyBlock(data)}
      ${buildTitleBlock("Credit Note", data.creditNoteNumber)}
    </div>
    <div class="info-grid">
      ${buildContactBlock("To", data.contactName, data.contactAddress, data.contactEmail)}
      ${buildDetailsBlock(detailRows)}
    </div>
    ${buildLineItemsTable(data.lineItems)}
    ${buildTotalsSection(data.subTotal, data.totalTax, data.total)}
    <div class="pdf-footer">
      Credit note applied to account
    </div>
  `;

  return {
    title,
    html: wrapDocument(title, bodyHtml),
    styles: pdfBaseStyles,
  };
}

export function generateStatementPdf(data: StatementPdfData): PdfDocument {
  const title = `Statement - ${data.contactName}`;

  const entryRows = data.entries
    .map(
      (entry) => `
      <tr>
        <td>${escapeHtml(entry.date)}</td>
        <td>${escapeHtml(entry.description)}</td>
        <td>${escapeHtml(entry.reference)}</td>
        <td class="text-right">${formatCurrency(entry.amount)}</td>
        <td class="text-right">${formatCurrency(entry.balance)}</td>
      </tr>
    `,
    )
    .join("");

  const bodyHtml = `
    <div class="pdf-header">
      ${buildCompanyBlock(data)}
      ${buildTitleBlock("Statement", `${data.fromDate} to ${data.toDate}`)}
    </div>
    <div class="info-grid">
      ${buildContactBlock("To", data.contactName, data.contactAddress, data.contactEmail)}
      ${buildDetailsBlock([
        ["Statement Date", data.statementDate],
        ["Period", `${data.fromDate} to ${data.toDate}`],
      ])}
    </div>
    <div class="balance-row">
      <span>Opening Balance</span>
      <span>${formatCurrency(data.openingBalance)}</span>
    </div>
    <table class="statement-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Description</th>
          <th>Reference</th>
          <th class="text-right">Amount</th>
          <th class="text-right">Balance</th>
        </tr>
      </thead>
      <tbody>${entryRows}</tbody>
    </table>
    <div class="balance-row">
      <span>Closing Balance</span>
      <span>${formatCurrency(data.closingBalance)}</span>
    </div>
    <div class="pdf-footer">
      Statement for ${escapeHtml(data.contactName)}
    </div>
  `;

  return {
    title,
    html: wrapDocument(title, bodyHtml),
    styles: pdfBaseStyles,
  };
}

// ---------------------------------------------------------------------------
// Print / Download actions
// ---------------------------------------------------------------------------

export function printPdf(doc: PdfDocument): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(doc.html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

export function downloadPdfAsHtml(doc: PdfDocument, filename: string): void {
  const blob = new Blob([doc.html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  anchor.click();

  URL.revokeObjectURL(url);
}
