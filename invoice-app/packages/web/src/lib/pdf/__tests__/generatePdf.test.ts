import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateInvoicePdf,
  generateQuotePdf,
  generateBillPdf,
  generateCreditNotePdf,
  generateStatementPdf,
  printPdf,
  downloadPdfAsHtml,
  type PdfDocument,
  type InvoicePdfData,
  type QuotePdfData,
  type BillPdfData,
  type CreditNotePdfData,
  type StatementPdfData,
} from "../generatePdf";

// ---------------------------------------------------------------------------
// Shared helpers / fixture data
// ---------------------------------------------------------------------------

function makeInvoiceData(overrides: Partial<InvoicePdfData> = {}): InvoicePdfData {
  return {
    companyName: "Demo Company (NZ)",
    companyAddress: "123 Test Street\nWellington 6011\nNew Zealand",
    companyPhone: "+64 4 123 4567",
    companyEmail: "info@demo.co.nz",
    contactName: "Acme Corp",
    contactEmail: "billing@acme.com",
    contactAddress: "456 Client Ave\nAuckland 1010",
    invoiceNumber: "INV-0042",
    reference: "PO-123",
    date: "2026-02-16",
    dueDate: "2026-03-16",
    status: "submitted",
    currency: "NZD",
    amountType: "exclusive",
    lineItems: [
      {
        description: "Web Development",
        quantity: 10,
        unitPrice: 150,
        taxRate: 15,
        taxAmount: 225,
        lineAmount: 1500,
        discount: 0,
      },
      {
        description: "Design Services",
        quantity: 5,
        unitPrice: 200,
        taxRate: 15,
        taxAmount: 150,
        lineAmount: 1000,
        discount: 0,
      },
    ],
    subTotal: 2500,
    totalTax: 375,
    total: 2875,
    amountDue: 2875,
    amountPaid: 0,
    ...overrides,
  };
}

function makeQuoteData(overrides: Partial<QuotePdfData> = {}): QuotePdfData {
  return {
    companyName: "Demo Company (NZ)",
    companyAddress: "123 Test Street\nWellington 6011",
    companyPhone: "+64 4 123 4567",
    companyEmail: "info@demo.co.nz",
    contactName: "Acme Corp",
    contactEmail: "billing@acme.com",
    contactAddress: "456 Client Ave",
    quoteNumber: "QU-0010",
    reference: "RFQ-99",
    date: "2026-02-16",
    expiryDate: "2026-03-16",
    currency: "NZD",
    amountType: "exclusive",
    lineItems: [
      {
        description: "Consulting",
        quantity: 8,
        unitPrice: 120,
        taxRate: 15,
        taxAmount: 144,
        lineAmount: 960,
        discount: 0,
      },
    ],
    subTotal: 960,
    totalTax: 144,
    total: 1104,
    ...overrides,
  };
}

function makeBillData(overrides: Partial<BillPdfData> = {}): BillPdfData {
  return {
    companyName: "Demo Company (NZ)",
    companyAddress: "123 Test Street\nWellington 6011",
    companyPhone: "+64 4 123 4567",
    companyEmail: "info@demo.co.nz",
    supplierName: "Office Supplies Ltd",
    supplierEmail: "accounts@office.co.nz",
    supplierAddress: "789 Supplier Rd\nChristchurch 8011",
    billNumber: "BILL-0005",
    reference: "SO-456",
    date: "2026-02-10",
    dueDate: "2026-03-10",
    status: "approved",
    currency: "NZD",
    amountType: "exclusive",
    lineItems: [
      {
        description: "Printer Paper (A4)",
        quantity: 20,
        unitPrice: 12.5,
        taxRate: 15,
        taxAmount: 37.5,
        lineAmount: 250,
        discount: 0,
      },
    ],
    subTotal: 250,
    totalTax: 37.5,
    total: 287.5,
    amountDue: 287.5,
    amountPaid: 0,
    ...overrides,
  };
}

function makeCreditNoteData(
  overrides: Partial<CreditNotePdfData> = {},
): CreditNotePdfData {
  return {
    companyName: "Demo Company (NZ)",
    companyAddress: "123 Test Street\nWellington 6011",
    companyPhone: "+64 4 123 4567",
    companyEmail: "info@demo.co.nz",
    contactName: "Acme Corp",
    contactEmail: "billing@acme.com",
    contactAddress: "456 Client Ave",
    creditNoteNumber: "CN-0003",
    reference: "INV-0042",
    date: "2026-02-20",
    currency: "NZD",
    amountType: "exclusive",
    lineItems: [
      {
        description: "Refund - Overpayment",
        quantity: 1,
        unitPrice: 500,
        taxRate: 15,
        taxAmount: 75,
        lineAmount: 500,
        discount: 0,
      },
    ],
    subTotal: 500,
    totalTax: 75,
    total: 575,
    ...overrides,
  };
}

function makeStatementData(
  overrides: Partial<StatementPdfData> = {},
): StatementPdfData {
  return {
    companyName: "Demo Company (NZ)",
    companyAddress: "123 Test Street\nWellington 6011",
    companyPhone: "+64 4 123 4567",
    companyEmail: "info@demo.co.nz",
    contactName: "Acme Corp",
    contactEmail: "billing@acme.com",
    contactAddress: "456 Client Ave",
    statementDate: "2026-02-28",
    fromDate: "2026-01-01",
    toDate: "2026-02-28",
    currency: "NZD",
    entries: [
      {
        date: "2026-01-15",
        description: "Invoice INV-0040",
        reference: "INV-0040",
        amount: 1150,
        balance: 1150,
      },
      {
        date: "2026-02-01",
        description: "Payment received",
        reference: "PAY-001",
        amount: -1150,
        balance: 0,
      },
    ],
    openingBalance: 0,
    closingBalance: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// generateInvoicePdf
// ---------------------------------------------------------------------------

describe("generateInvoicePdf", () => {
  it("returns a PdfDocument with title containing invoice number", () => {
    const doc = generateInvoicePdf(makeInvoiceData());
    expect(doc.title).toContain("INV-0042");
    expect(doc.title.toLowerCase()).toContain("invoice");
  });

  it("includes contact name in the HTML", () => {
    const doc = generateInvoicePdf(makeInvoiceData());
    expect(doc.html).toContain("Acme Corp");
  });

  it("includes all line items", () => {
    const doc = generateInvoicePdf(makeInvoiceData());
    expect(doc.html).toContain("Web Development");
    expect(doc.html).toContain("Design Services");
  });

  it("includes correct totals in the output", () => {
    const doc = generateInvoicePdf(makeInvoiceData());
    // subTotal 2500, tax 375, total 2875
    expect(doc.html).toContain("2,500.00");
    expect(doc.html).toContain("2,875.00");
  });

  it("includes tax breakdown", () => {
    const doc = generateInvoicePdf(makeInvoiceData());
    expect(doc.html).toContain("375.00");
  });

  it("handles zero line items gracefully", () => {
    const doc = generateInvoicePdf(
      makeInvoiceData({
        lineItems: [],
        subTotal: 0,
        totalTax: 0,
        total: 0,
        amountDue: 0,
      }),
    );
    expect(doc.html).toContain("0.00");
  });

  it("includes invoice number, date, and due date", () => {
    const doc = generateInvoicePdf(makeInvoiceData());
    expect(doc.html).toContain("INV-0042");
    expect(doc.html).toContain("2026-02-16");
    expect(doc.html).toContain("2026-03-16");
  });

  it("includes company info", () => {
    const doc = generateInvoicePdf(makeInvoiceData());
    expect(doc.html).toContain("Demo Company (NZ)");
    expect(doc.html).toContain("123 Test Street");
  });

  it("includes reference number when provided", () => {
    const doc = generateInvoicePdf(makeInvoiceData());
    expect(doc.html).toContain("PO-123");
  });

  it("includes amount paid and amount due", () => {
    const data = makeInvoiceData({ amountPaid: 500, amountDue: 2375 });
    const doc = generateInvoicePdf(data);
    expect(doc.html).toContain("500.00");
    expect(doc.html).toContain("2,375.00");
  });

  it("includes styles string", () => {
    const doc = generateInvoicePdf(makeInvoiceData());
    expect(doc.styles).toEqual(expect.any(String));
    expect(doc.styles.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// generateQuotePdf
// ---------------------------------------------------------------------------

describe("generateQuotePdf", () => {
  it('returns a PdfDocument with "Quote" in title', () => {
    const doc = generateQuotePdf(makeQuoteData());
    expect(doc.title.toLowerCase()).toContain("quote");
  });

  it("includes quote number and expiry date", () => {
    const doc = generateQuotePdf(makeQuoteData());
    expect(doc.html).toContain("QU-0010");
    expect(doc.html).toContain("2026-03-16");
  });

  it("includes line items and totals", () => {
    const doc = generateQuotePdf(makeQuoteData());
    expect(doc.html).toContain("Consulting");
    expect(doc.html).toContain("960.00");
    expect(doc.html).toContain("1,104.00");
  });

  it("includes contact name", () => {
    const doc = generateQuotePdf(makeQuoteData());
    expect(doc.html).toContain("Acme Corp");
  });
});

// ---------------------------------------------------------------------------
// generateBillPdf
// ---------------------------------------------------------------------------

describe("generateBillPdf", () => {
  it('returns a PdfDocument with "Bill" in title', () => {
    const doc = generateBillPdf(makeBillData());
    expect(doc.title.toLowerCase()).toContain("bill");
  });

  it("includes supplier info", () => {
    const doc = generateBillPdf(makeBillData());
    expect(doc.html).toContain("Office Supplies Ltd");
    expect(doc.html).toContain("789 Supplier Rd");
  });

  it("includes bill number and dates", () => {
    const doc = generateBillPdf(makeBillData());
    expect(doc.html).toContain("BILL-0005");
    expect(doc.html).toContain("2026-02-10");
    expect(doc.html).toContain("2026-03-10");
  });

  it("includes line items and totals", () => {
    const doc = generateBillPdf(makeBillData());
    expect(doc.html).toContain("Printer Paper (A4)");
    expect(doc.html).toContain("250.00");
    expect(doc.html).toContain("287.50");
  });
});

// ---------------------------------------------------------------------------
// generateCreditNotePdf
// ---------------------------------------------------------------------------

describe("generateCreditNotePdf", () => {
  it('returns a PdfDocument with "Credit Note" in title', () => {
    const doc = generateCreditNotePdf(makeCreditNoteData());
    expect(doc.title.toLowerCase()).toContain("credit note");
  });

  it("includes credit note number", () => {
    const doc = generateCreditNotePdf(makeCreditNoteData());
    expect(doc.html).toContain("CN-0003");
  });

  it("includes line items and totals", () => {
    const doc = generateCreditNotePdf(makeCreditNoteData());
    expect(doc.html).toContain("Refund - Overpayment");
    expect(doc.html).toContain("500.00");
    expect(doc.html).toContain("575.00");
  });
});

// ---------------------------------------------------------------------------
// generateStatementPdf
// ---------------------------------------------------------------------------

describe("generateStatementPdf", () => {
  it('returns a PdfDocument with "Statement" in title', () => {
    const doc = generateStatementPdf(makeStatementData());
    expect(doc.title.toLowerCase()).toContain("statement");
  });

  it("includes date range", () => {
    const doc = generateStatementPdf(makeStatementData());
    expect(doc.html).toContain("2026-01-01");
    expect(doc.html).toContain("2026-02-28");
  });

  it("includes all statement entries", () => {
    const doc = generateStatementPdf(makeStatementData());
    expect(doc.html).toContain("Invoice INV-0040");
    expect(doc.html).toContain("Payment received");
  });

  it("includes opening and closing balances", () => {
    const data = makeStatementData({
      openingBalance: 500,
      closingBalance: 1200,
    });
    const doc = generateStatementPdf(data);
    expect(doc.html).toContain("500.00");
    expect(doc.html).toContain("1,200.00");
  });
});

// ---------------------------------------------------------------------------
// printPdf & downloadPdfAsHtml
// ---------------------------------------------------------------------------

describe("printPdf", () => {
  it("opens a new window and calls print", () => {
    const mockWrite = vi.fn();
    const mockClose = vi.fn();
    const mockPrint = vi.fn();
    const mockWindow = {
      document: { write: mockWrite, close: mockClose },
      focus: vi.fn(),
      print: mockPrint,
    };
    vi.spyOn(window, "open").mockReturnValue(mockWindow as unknown as Window);

    const doc: PdfDocument = {
      title: "Test",
      html: "<p>Hello</p>",
      styles: "body { color: red; }",
    };
    printPdf(doc);

    expect(window.open).toHaveBeenCalled();
    expect(mockWrite).toHaveBeenCalled();
    expect(mockPrint).toHaveBeenCalled();
  });
});

describe("downloadPdfAsHtml", () => {
  it("creates a blob URL and triggers download", () => {
    const createObjectURL = vi.fn().mockReturnValue("blob:test-url");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(globalThis, "URL", {
      value: { createObjectURL, revokeObjectURL },
      writable: true,
    });

    const clickSpy = vi.fn();
    vi.spyOn(document, "createElement").mockReturnValue({
      href: "",
      download: "",
      click: clickSpy,
      style: {},
    } as unknown as HTMLAnchorElement);

    const doc: PdfDocument = {
      title: "Test",
      html: "<p>Hello</p>",
      styles: "body {}",
    };
    downloadPdfAsHtml(doc, "test-file.html");

    expect(createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
  });
});
