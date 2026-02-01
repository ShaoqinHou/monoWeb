import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker - use CDN for simplicity
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

/**
 * Render a single page of a PDF to a data URL (image).
 * @param data - PDF bytes
 * @param pageNumber - 1-based page number
 * @param scale - Render scale (0.4 for thumbnails, 1.2 for preview)
 * @returns Data URL of the rendered page
 */
export async function renderPageToImage(
  data: Uint8Array,
  pageNumber: number,
  scale: number
): Promise<string> {
  const loadingTask = pdfjsLib.getDocument({ data: data.slice() });
  const pdfDoc = await loadingTask.promise;
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext('2d')!;
  await page.render({ canvasContext: ctx, viewport }).promise;

  const dataUrl = canvas.toDataURL('image/png');
  pdfDoc.destroy();
  return dataUrl;
}

/**
 * Render all pages of a PDF to data URLs.
 * @param data - PDF bytes
 * @param scale - Render scale
 * @returns Array of data URLs, one per page
 */
export async function renderAllPages(
  data: Uint8Array,
  scale: number
): Promise<string[]> {
  const loadingTask = pdfjsLib.getDocument({ data: data.slice() });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const urls: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport }).promise;

    urls.push(canvas.toDataURL('image/png'));
  }

  pdfDoc.destroy();
  return urls;
}

/**
 * Get PDF page count without rendering.
 */
export async function getPdfPageCount(data: Uint8Array): Promise<number> {
  const loadingTask = pdfjsLib.getDocument({ data: data.slice() });
  const pdfDoc = await loadingTask.promise;
  const count = pdfDoc.numPages;
  pdfDoc.destroy();
  return count;
}
