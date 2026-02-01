import { PDFDocument } from 'pdf-lib';
import { PdfOperationResult } from '../types';

/**
 * Get the total page count of a PDF.
 */
export async function getPageCount(data: Uint8Array): Promise<number> {
  const pdfDoc = await PDFDocument.load(data);
  return pdfDoc.getPageCount();
}

/**
 * Remove specified pages from a PDF.
 * @param data - Source PDF bytes
 * @param pageNumbers - 1-based page numbers to remove
 */
export async function deletePages(
  data: Uint8Array,
  pageNumbers: number[]
): Promise<PdfOperationResult> {
  const pdfDoc = await PDFDocument.load(data);
  const totalPages = pdfDoc.getPageCount();

  const valid = [...new Set(pageNumbers.filter((p) => p >= 1 && p <= totalPages))];
  if (valid.length === 0) {
    return { success: false, message: 'No valid page numbers to delete.' };
  }
  if (valid.length >= totalPages) {
    return { success: false, message: 'Cannot delete all pages from a PDF.' };
  }

  // Sort descending to avoid index shifting
  const sorted = valid.sort((a, b) => b - a);
  for (const pageNum of sorted) {
    pdfDoc.removePage(pageNum - 1);
  }

  const resultBytes = await pdfDoc.save();
  return {
    success: true,
    data: new Uint8Array(resultBytes),
    message: `Deleted ${sorted.length} page(s). ${pdfDoc.getPageCount()} pages remaining.`,
    pageCount: pdfDoc.getPageCount(),
  };
}

/**
 * Merge multiple PDFs (or specific pages from multiple PDFs) into one.
 * @param sources - Array of { data, pages? } where pages is optional 1-based page numbers.
 *   If pages is omitted, all pages are included.
 */
export async function mergePages(
  sources: Array<{ data: Uint8Array; pages?: number[] }>
): Promise<PdfOperationResult> {
  if (sources.length === 0) {
    return { success: false, message: 'No sources provided for merge.' };
  }

  const mergedPdf = await PDFDocument.create();

  for (const source of sources) {
    const sourcePdf = await PDFDocument.load(source.data);
    const totalPages = sourcePdf.getPageCount();

    const indices = source.pages
      ? source.pages.filter((p) => p >= 1 && p <= totalPages).map((p) => p - 1)
      : Array.from({ length: totalPages }, (_, i) => i);

    if (indices.length === 0) continue;

    const copiedPages = await mergedPdf.copyPages(sourcePdf, indices);
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  if (mergedPdf.getPageCount() === 0) {
    return { success: false, message: 'No valid pages to merge.' };
  }

  const resultBytes = await mergedPdf.save();
  return {
    success: true,
    data: new Uint8Array(resultBytes),
    message: `Merged into ${mergedPdf.getPageCount()} page document.`,
    pageCount: mergedPdf.getPageCount(),
    suggestedName: 'merged',
  };
}

/**
 * Extract specific pages from a PDF into a new PDF.
 * @param data - Source PDF bytes
 * @param pageNumbers - 1-based page numbers to extract (in desired order)
 */
export async function extractPages(
  data: Uint8Array,
  pageNumbers: number[]
): Promise<PdfOperationResult> {
  if (pageNumbers.length === 0) {
    return { success: false, message: 'No page numbers specified for extraction.' };
  }

  const sourcePdf = await PDFDocument.load(data);
  const totalPages = sourcePdf.getPageCount();

  const valid = pageNumbers.filter((p) => p >= 1 && p <= totalPages);
  if (valid.length === 0) {
    return { success: false, message: 'No valid page numbers to extract.' };
  }

  const newPdf = await PDFDocument.create();
  const indices = valid.map((p) => p - 1);
  const copiedPages = await newPdf.copyPages(sourcePdf, indices);
  copiedPages.forEach((page) => newPdf.addPage(page));

  const resultBytes = await newPdf.save();
  return {
    success: true,
    data: new Uint8Array(resultBytes),
    message: `Extracted ${valid.length} page(s) into new document.`,
    pageCount: newPdf.getPageCount(),
    suggestedName: 'extracted',
  };
}

/**
 * Insert pages from a source PDF into a target PDF at a specified position.
 * @param targetData - The target PDF bytes
 * @param sourceData - The source PDF bytes
 * @param sourcePages - 1-based page numbers from source to insert
 * @param insertAfterPage - 1-based page number in target after which to insert (0 = beginning)
 */
export async function insertPages(
  targetData: Uint8Array,
  sourceData: Uint8Array,
  sourcePages: number[],
  insertAfterPage: number
): Promise<PdfOperationResult> {
  if (sourcePages.length === 0) {
    return { success: false, message: 'No source pages specified for insertion.' };
  }

  const targetPdf = await PDFDocument.load(targetData);
  const sourcePdf = await PDFDocument.load(sourceData);
  const sourceTotalPages = sourcePdf.getPageCount();
  const targetTotalPages = targetPdf.getPageCount();

  if (insertAfterPage < 0 || insertAfterPage > targetTotalPages) {
    return {
      success: false,
      message: `Insert position ${insertAfterPage} is out of range (0-${targetTotalPages}).`,
    };
  }

  const valid = sourcePages.filter((p) => p >= 1 && p <= sourceTotalPages);
  if (valid.length === 0) {
    return { success: false, message: 'No valid source pages to insert.' };
  }

  const indices = valid.map((p) => p - 1);
  const copiedPages = await targetPdf.copyPages(sourcePdf, indices);

  // Insert at the correct position
  for (let i = 0; i < copiedPages.length; i++) {
    targetPdf.insertPage(insertAfterPage + i, copiedPages[i]);
  }

  const resultBytes = await targetPdf.save();
  return {
    success: true,
    data: new Uint8Array(resultBytes),
    message: `Inserted ${valid.length} page(s) after page ${insertAfterPage}. Total: ${targetPdf.getPageCount()} pages.`,
    pageCount: targetPdf.getPageCount(),
  };
}

/**
 * Trigger a browser download of PDF bytes.
 */
export function downloadPdf(data: Uint8Array, fileName: string): void {
  const blob = new Blob([data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
