import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Page background colors (light pastels) for visual distinction.
 */
const PAGE_COLORS = [
  rgb(1.0, 0.92, 0.92),   // Light red
  rgb(0.92, 1.0, 0.92),   // Light green
  rgb(0.92, 0.92, 1.0),   // Light blue
  rgb(1.0, 1.0, 0.92),    // Light yellow
  rgb(1.0, 0.92, 1.0),    // Light magenta
  rgb(0.92, 1.0, 1.0),    // Light cyan
  rgb(0.95, 0.95, 0.95),  // Light gray
  rgb(1.0, 0.96, 0.88),   // Light orange
  rgb(0.88, 0.96, 1.0),   // Light sky
  rgb(0.96, 0.88, 1.0),   // Light purple
];

/**
 * Generate a test PDF with clearly labeled pages.
 * Each page shows:
 *   - Large centered page number (e.g., "Page 2")
 *   - File name at the top (e.g., "TestPDF-1")
 *   - "Page 2 of 5" at the bottom
 *   - Unique background color per page
 *
 * @param name - Document name to display on each page
 * @param pageCount - Number of pages to generate
 */
export async function generateTestPdf(
  name: string,
  pageCount: number,
  width: number = 612,
  height: number = 792
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (let i = 1; i <= pageCount; i++) {
    const page = pdfDoc.addPage([width, height]);
    const bgColor = PAGE_COLORS[(i - 1) % PAGE_COLORS.length];

    // Draw background
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: bgColor,
    });

    // Draw border
    page.drawRectangle({
      x: 20,
      y: 20,
      width: width - 40,
      height: height - 40,
      borderColor: rgb(0.6, 0.6, 0.6),
      borderWidth: 1,
    });

    // Draw file name at top center
    const nameSize = 28;
    const nameWidth = font.widthOfTextAtSize(name, nameSize);
    page.drawText(name, {
      x: (width - nameWidth) / 2,
      y: height - 70,
      size: nameSize,
      font,
      color: rgb(0.25, 0.25, 0.25),
    });

    // Draw large page number in center
    const pageLabel = `Page ${i}`;
    const bigSize = 80;
    const labelWidth = font.widthOfTextAtSize(pageLabel, bigSize);
    page.drawText(pageLabel, {
      x: (width - labelWidth) / 2,
      y: height / 2 - bigSize / 3,
      size: bigSize,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Draw "Page X of Y" at bottom center
    const footerText = `Page ${i} of ${pageCount}`;
    const footerSize = 18;
    const footerWidth = font.widthOfTextAtSize(footerText, footerSize);
    page.drawText(footerText, {
      x: (width - footerWidth) / 2,
      y: 45,
      size: footerSize,
      font,
      color: rgb(0.45, 0.45, 0.45),
    });

    // Draw file identifier in top-left corner (for programmatic verification)
    const idText = `[${name}:${i}/${pageCount}]`;
    const idSize = 10;
    page.drawText(idText, {
      x: 30,
      y: height - 35,
      size: idSize,
      font,
      color: rgb(0.7, 0.7, 0.7),
    });
  }

  const bytes = await pdfDoc.save();
  return new Uint8Array(bytes);
}
