/**
 * Renders a <style> tag with @media print rules.
 * Hides sidebar, header, footer and makes the report content full-width.
 */
export function PrintStylesheet() {
  return (
    <style data-testid="print-stylesheet">{`
@media print {
  /* Hide non-report elements */
  nav,
  header,
  footer,
  [data-sidebar],
  [data-header],
  [data-footer],
  .no-print {
    display: none !important;
  }

  /* Make report content full-width */
  .xero-print-mode {
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  /* Adjust font sizes for print */
  body {
    font-size: 12pt !important;
    color: #000 !important;
    background: #fff !important;
  }

  /* Ensure tables don't break awkwardly */
  table {
    page-break-inside: auto;
  }
  tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }

  /* Remove shadows and borders that look bad in print */
  * {
    box-shadow: none !important;
  }
}
`}</style>
  );
}
