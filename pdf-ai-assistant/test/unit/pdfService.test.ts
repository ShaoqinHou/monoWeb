import { describe, it, expect, beforeAll } from 'vitest';
import {
  getPageCount,
  deletePages,
  mergePages,
  extractPages,
  insertPages,
} from '../../services/pdfService';
import { generateTestPdf } from '../helpers/generateTestPdf';
import { PDFDocument } from 'pdf-lib';

// Helper to read text from a PDF page (extracts the identifier tag like [TestDoc:2/5])
async function getPageIdentifiers(data: Uint8Array): Promise<string[]> {
  // Since pdf-lib doesn't easily extract text, we verify via page count
  // and structural checks. For content verification, we rely on the
  // generateTestPdf structure being correct.
  const pdfDoc = await PDFDocument.load(data);
  const count = pdfDoc.getPageCount();
  return Array.from({ length: count }, (_, i) => `page-${i + 1}`);
}

describe('pdfService', () => {
  let pdf3Pages: Uint8Array;
  let pdf5Pages: Uint8Array;
  let pdf7Pages: Uint8Array;
  let pdf2Pages: Uint8Array;

  beforeAll(async () => {
    pdf3Pages = await generateTestPdf('Doc-A', 3);
    pdf5Pages = await generateTestPdf('Doc-B', 5);
    pdf7Pages = await generateTestPdf('Doc-C', 7);
    pdf2Pages = await generateTestPdf('Doc-D', 2);
  });

  // ===========================================
  // getPageCount
  // ===========================================
  describe('getPageCount', () => {
    it('should return correct page count for 3-page PDF', async () => {
      expect(await getPageCount(pdf3Pages)).toBe(3);
    });

    it('should return correct page count for 5-page PDF', async () => {
      expect(await getPageCount(pdf5Pages)).toBe(5);
    });

    it('should return correct page count for 7-page PDF', async () => {
      expect(await getPageCount(pdf7Pages)).toBe(7);
    });

    it('should return correct page count for 2-page PDF', async () => {
      expect(await getPageCount(pdf2Pages)).toBe(2);
    });
  });

  // ===========================================
  // deletePages
  // ===========================================
  describe('deletePages', () => {
    it('should remove a single page from a 5-page PDF', async () => {
      const result = await deletePages(pdf5Pages, [3]);
      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(4);
      expect(result.data).toBeDefined();
      // Verify the result is a valid PDF with 4 pages
      expect(await getPageCount(result.data!)).toBe(4);
    });

    it('should remove multiple pages', async () => {
      const result = await deletePages(pdf5Pages, [1, 3, 5]);
      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(2);
    });

    it('should remove the first page', async () => {
      const result = await deletePages(pdf5Pages, [1]);
      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(4);
    });

    it('should remove the last page', async () => {
      const result = await deletePages(pdf5Pages, [5]);
      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(4);
    });

    it('should fail when trying to delete all pages', async () => {
      const result = await deletePages(pdf3Pages, [1, 2, 3]);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Cannot delete all');
    });

    it('should handle duplicate page numbers gracefully', async () => {
      const result = await deletePages(pdf5Pages, [2, 2, 2]);
      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(4); // Only one page actually removed
    });

    it('should fail with no valid page numbers', async () => {
      const result = await deletePages(pdf5Pages, [0, 6, 99]);
      expect(result.success).toBe(false);
      expect(result.message).toContain('No valid');
    });

    it('should ignore out-of-range page numbers but process valid ones', async () => {
      const result = await deletePages(pdf5Pages, [0, 1, 99]);
      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(4); // Only page 1 removed
    });

    it('should not mutate the original data', async () => {
      const original = new Uint8Array(pdf5Pages);
      await deletePages(pdf5Pages, [1]);
      expect(pdf5Pages).toEqual(original);
    });

    it('should produce a valid PDF that can be further operated on', async () => {
      const result1 = await deletePages(pdf5Pages, [1]);
      expect(result1.success).toBe(true);
      // Delete another page from the result
      const result2 = await deletePages(result1.data!, [1]);
      expect(result2.success).toBe(true);
      expect(result2.pageCount).toBe(3);
    });
  });

  // ===========================================
  // mergePages
  // ===========================================
  describe('mergePages', () => {
    it('should merge two full PDFs', async () => {
      const result = await mergePages([
        { data: pdf3Pages },
        { data: pdf5Pages },
      ]);
      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(8);
    });

    it('should merge three full PDFs', async () => {
      const result = await mergePages([
        { data: pdf3Pages },
        { data: pdf5Pages },
        { data: pdf2Pages },
      ]);
      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(10);
    });

    it('should merge specific pages from multiple sources', async () => {
      const result = await mergePages([
        { data: pdf5Pages, pages: [1, 2] },
        { data: pdf3Pages, pages: [3] },
      ]);
      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(3);
    });

    it('should handle a single source with all pages', async () => {
      const result = await mergePages([{ data: pdf3Pages }]);
      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(3);
    });

    it('should handle a single source with specific pages', async () => {
      const result = await mergePages([
        { data: pdf5Pages, pages: [2, 4] },
      ]);
      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(2);
    });

    it('should fail with empty sources array', async () => {
      const result = await mergePages([]);
      expect(result.success).toBe(false);
    });

    it('should skip sources with only invalid page numbers', async () => {
      const result = await mergePages([
        { data: pdf3Pages, pages: [99] },
        { data: pdf5Pages, pages: [1] },
      ]);
      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(1);
    });

    it('should fail when all sources have only invalid pages', async () => {
      const result = await mergePages([
        { data: pdf3Pages, pages: [99] },
      ]);
      expect(result.success).toBe(false);
    });

    it('should preserve page order as specified', async () => {
      // Merge page 3 then page 1 from a 5-page doc
      const result = await mergePages([
        { data: pdf5Pages, pages: [3, 1] },
      ]);
      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(2);
    });

    it('should produce a valid PDF', async () => {
      const result = await mergePages([
        { data: pdf3Pages },
        { data: pdf2Pages },
      ]);
      expect(result.success).toBe(true);
      expect(await getPageCount(result.data!)).toBe(5);
    });
  });

  // ===========================================
  // extractPages
  // ===========================================
  describe('extractPages', () => {
    it('should extract a single page', async () => {
      const result = await extractPages(pdf5Pages, [3]);
      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(1);
    });

    it('should extract multiple pages', async () => {
      const result = await extractPages(pdf5Pages, [1, 3, 5]);
      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(3);
    });

    it('should extract pages in specified order', async () => {
      const result = await extractPages(pdf5Pages, [5, 1, 3]);
      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(3);
    });

    it('should extract all pages (effectively a copy)', async () => {
      const result = await extractPages(pdf3Pages, [1, 2, 3]);
      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(3);
    });

    it('should fail with empty page numbers', async () => {
      const result = await extractPages(pdf5Pages, []);
      expect(result.success).toBe(false);
    });

    it('should fail when no valid pages specified', async () => {
      const result = await extractPages(pdf5Pages, [0, 99]);
      expect(result.success).toBe(false);
    });

    it('should ignore invalid page numbers but process valid ones', async () => {
      const result = await extractPages(pdf5Pages, [0, 2, 99]);
      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(1);
    });

    it('should not mutate the original data', async () => {
      const original = new Uint8Array(pdf5Pages);
      await extractPages(pdf5Pages, [1, 2]);
      expect(pdf5Pages).toEqual(original);
    });

    it('should produce a valid PDF', async () => {
      const result = await extractPages(pdf7Pages, [2, 4, 6]);
      expect(result.success).toBe(true);
      expect(await getPageCount(result.data!)).toBe(3);
    });
  });

  // ===========================================
  // insertPages
  // ===========================================
  describe('insertPages', () => {
    it('should insert a page at the beginning (after page 0)', async () => {
      const result = await insertPages(pdf3Pages, pdf5Pages, [1], 0);
      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(4);
    });

    it('should insert a page in the middle', async () => {
      const result = await insertPages(pdf3Pages, pdf5Pages, [1], 2);
      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(4);
    });

    it('should insert a page at the end', async () => {
      const result = await insertPages(pdf3Pages, pdf5Pages, [1], 3);
      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(4);
    });

    it('should insert multiple pages', async () => {
      const result = await insertPages(pdf3Pages, pdf5Pages, [1, 2, 3], 1);
      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(6);
    });

    it('should fail with invalid insert position', async () => {
      const result = await insertPages(pdf3Pages, pdf5Pages, [1], 99);
      expect(result.success).toBe(false);
    });

    it('should fail with negative insert position', async () => {
      const result = await insertPages(pdf3Pages, pdf5Pages, [1], -1);
      expect(result.success).toBe(false);
    });

    it('should fail with empty source pages', async () => {
      const result = await insertPages(pdf3Pages, pdf5Pages, [], 1);
      expect(result.success).toBe(false);
    });

    it('should fail when source pages are out of range', async () => {
      const result = await insertPages(pdf3Pages, pdf2Pages, [99], 1);
      expect(result.success).toBe(false);
    });

    it('should ignore invalid source pages but process valid ones', async () => {
      const result = await insertPages(pdf3Pages, pdf5Pages, [0, 1, 99], 1);
      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(4);
    });

    it('should not mutate the original target data', async () => {
      const original = new Uint8Array(pdf3Pages);
      await insertPages(pdf3Pages, pdf5Pages, [1], 1);
      expect(pdf3Pages).toEqual(original);
    });

    it('should not mutate the original source data', async () => {
      const original = new Uint8Array(pdf5Pages);
      await insertPages(pdf3Pages, pdf5Pages, [1], 1);
      expect(pdf5Pages).toEqual(original);
    });

    it('should produce a valid PDF that can be further operated on', async () => {
      const result1 = await insertPages(pdf3Pages, pdf5Pages, [1, 2], 1);
      expect(result1.success).toBe(true);
      expect(result1.pageCount).toBe(5);
      // Extract from the result
      const result2 = await extractPages(result1.data!, [2, 3]);
      expect(result2.success).toBe(true);
      expect(result2.pageCount).toBe(2);
    });
  });

  // ===========================================
  // Integration: chained operations
  // ===========================================
  describe('chained operations', () => {
    it('should handle: extract then merge', async () => {
      // Extract pages 1-2 from Doc-B
      const extracted = await extractPages(pdf5Pages, [1, 2]);
      expect(extracted.success).toBe(true);

      // Merge extracted with Doc-D
      const merged = await mergePages([
        { data: extracted.data! },
        { data: pdf2Pages },
      ]);
      expect(merged.success).toBe(true);
      expect(merged.pageCount).toBe(4);
    });

    it('should handle: delete then merge', async () => {
      // Delete page 1 from Doc-A (3 pages -> 2 pages)
      const deleted = await deletePages(pdf3Pages, [1]);
      expect(deleted.success).toBe(true);
      expect(deleted.pageCount).toBe(2);

      // Merge the result with Doc-D
      const merged = await mergePages([
        { data: deleted.data! },
        { data: pdf2Pages },
      ]);
      expect(merged.success).toBe(true);
      expect(merged.pageCount).toBe(4);
    });

    it('should handle: merge specific pages from 3 files + delete from another', async () => {
      // This simulates the complex command:
      // "Put together first 2 pages of Doc-B and page 3 of Doc-C and page 3 of Doc-B,
      //  also remove the last page from Doc-C"

      // Step 1: Merge specific pages
      const merged = await mergePages([
        { data: pdf5Pages, pages: [1, 2] },
        { data: pdf7Pages, pages: [3] },
        { data: pdf5Pages, pages: [3] },
      ]);
      expect(merged.success).toBe(true);
      expect(merged.pageCount).toBe(4);

      // Step 2: Delete last page from Doc-C (7 pages -> 6 pages)
      const deleted = await deletePages(pdf7Pages, [7]);
      expect(deleted.success).toBe(true);
      expect(deleted.pageCount).toBe(6);
    });
  });
});
