/**
 * Print-ready CSS styles that mimic Xero's invoice PDF appearance.
 * Used by all PDF generators to produce consistent, professional output.
 */

export const pdfBaseStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 13px;
    line-height: 1.5;
    color: #1a1a2e;
    background: #fff;
    padding: 40px;
  }

  .pdf-container {
    max-width: 800px;
    margin: 0 auto;
  }

  /* Header: company info + document title */
  .pdf-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32px;
    padding-bottom: 20px;
    border-bottom: 2px solid #e5e7eb;
  }

  .company-info {
    flex: 1;
  }

  .company-name {
    font-size: 20px;
    font-weight: 700;
    color: #1a1a2e;
    margin-bottom: 4px;
  }

  .company-details {
    color: #6b7280;
    font-size: 12px;
    white-space: pre-line;
  }

  .doc-title-block {
    text-align: right;
  }

  .doc-title {
    font-size: 28px;
    font-weight: 700;
    color: #0078c8;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
  }

  .doc-number {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
  }

  .doc-status {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    margin-top: 6px;
  }

  .status-draft { background: #f3f4f6; color: #6b7280; }
  .status-submitted { background: #dbeafe; color: #0078c8; }
  .status-approved { background: #fef3c7; color: #d97706; }
  .status-paid { background: #d1fae5; color: #059669; }
  .status-overdue { background: #fee2e2; color: #ef4444; }
  .status-voided { background: #f3f4f6; color: #6b7280; text-decoration: line-through; }

  /* Info grid: To / Details */
  .info-grid {
    display: flex;
    justify-content: space-between;
    margin-bottom: 28px;
    gap: 40px;
  }

  .info-block {
    flex: 1;
  }

  .info-block-right {
    flex: 1;
    text-align: right;
  }

  .info-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #9ca3af;
    margin-bottom: 4px;
  }

  .info-value {
    font-size: 13px;
    color: #1a1a2e;
    white-space: pre-line;
  }

  .info-row {
    margin-bottom: 8px;
  }

  /* Line items table */
  .items-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 24px;
  }

  .items-table thead th {
    background: #f9fafb;
    border-bottom: 2px solid #e5e7eb;
    padding: 10px 12px;
    text-align: left;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #6b7280;
  }

  .items-table thead th.text-right {
    text-align: right;
  }

  .items-table tbody td {
    padding: 10px 12px;
    border-bottom: 1px solid #f3f4f6;
    font-size: 13px;
    color: #374151;
    vertical-align: top;
  }

  .items-table tbody td.text-right {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .items-table tbody tr:nth-child(even) {
    background: #fafbfc;
  }

  .items-table tbody tr:hover {
    background: #f3f4f6;
  }

  /* Totals section */
  .totals-section {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 32px;
  }

  .totals-table {
    width: 280px;
    border-collapse: collapse;
  }

  .totals-table tr td {
    padding: 6px 12px;
    font-size: 13px;
  }

  .totals-table tr td:first-child {
    text-align: left;
    color: #6b7280;
  }

  .totals-table tr td:last-child {
    text-align: right;
    font-variant-numeric: tabular-nums;
    color: #374151;
    font-weight: 500;
  }

  .totals-table .total-row td {
    border-top: 2px solid #e5e7eb;
    padding-top: 10px;
    font-size: 16px;
    font-weight: 700;
    color: #1a1a2e;
  }

  .totals-table .amount-due-row td {
    border-top: 1px solid #e5e7eb;
    padding-top: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #0078c8;
  }

  /* Statement entries table */
  .statement-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 24px;
  }

  .statement-table thead th {
    background: #f9fafb;
    border-bottom: 2px solid #e5e7eb;
    padding: 8px 12px;
    text-align: left;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #6b7280;
  }

  .statement-table thead th.text-right {
    text-align: right;
  }

  .statement-table tbody td {
    padding: 8px 12px;
    border-bottom: 1px solid #f3f4f6;
    font-size: 13px;
    color: #374151;
  }

  .statement-table tbody td.text-right {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .statement-table tbody tr:nth-child(even) {
    background: #fafbfc;
  }

  /* Balance row */
  .balance-row {
    display: flex;
    justify-content: space-between;
    padding: 10px 12px;
    font-size: 14px;
    font-weight: 600;
    border-top: 2px solid #e5e7eb;
    margin-top: 4px;
  }

  /* Footer */
  .pdf-footer {
    margin-top: 40px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
    font-size: 11px;
    color: #9ca3af;
    text-align: center;
  }

  /* Print-specific rules */
  @media print {
    body {
      padding: 0;
      margin: 0;
    }

    .pdf-container {
      max-width: none;
    }

    .items-table tbody tr:hover {
      background: inherit;
    }

    .items-table tbody tr:nth-child(even) {
      background: #fafbfc !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .doc-title {
      color: #0078c8 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .pdf-header {
      border-bottom-color: #e5e7eb !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    @page {
      margin: 20mm;
      size: A4;
    }
  }
`;
