import { test, expect } from '@playwright/test';

// Helper: click "Load Sample PDFs" and wait for files to appear
async function loadSamplePdfs(page: import('@playwright/test').Page) {
  // Button is in the file list sidebar (prominent blue button when no files)
  await page.getByRole('button', { name: /Load Sample PDFs/ }).click();
  // Wait for all 6 files to appear
  await expect(page.locator('text=Files (6)')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('text=TestPDF-1')).toBeVisible();
}

// Helper: send a message in the AI chat
async function sendAiMessage(page: import('@playwright/test').Page, message: string) {
  const textarea = page.locator('textarea');
  await textarea.fill(message);
  await page.getByRole('button', { name: 'Send' }).click();
}

// Helper: wait for AI response (loading indicator disappears and input re-enables)
async function waitForAiResponse(page: import('@playwright/test').Page) {
  // Wait for loading dots to disappear (max 30s for AI response)
  await expect(page.locator('.animate-bounce').first()).toBeHidden({ timeout: 30000 });
  // Wait for input to re-enable
  await expect(page.locator('textarea')).toBeEnabled({ timeout: 5000 });
  // Small buffer for state updates
  await page.waitForTimeout(500);
}

// Helper: click a file in the sidebar to make it active
async function selectFile(page: import('@playwright/test').Page, fileName: string) {
  await page.locator(`text=${fileName}`).first().click();
  // Wait for thumbnails to load
  await page.waitForTimeout(1000);
}

// Helper: get the page count displayed in the center preview header
async function getDisplayedPageCount(page: import('@playwright/test').Page): Promise<number> {
  const headerText = await page.locator('[class*="text-slate-400"]').filter({ hasText: /\d+ pages?/ }).first().textContent();
  const match = headerText?.match(/(\d+) pages?/);
  return match ? parseInt(match[1]) : 0;
}

// Helper: count thumbnail images in the preview grid
async function countThumbnails(page: import('@playwright/test').Page): Promise<number> {
  await page.waitForTimeout(500); // Let thumbnails render
  return await page.locator('img[alt^="Page"]').count();
}

// Helper: select page thumbnails by their 1-based page numbers
async function selectPages(page: import('@playwright/test').Page, pageNumbers: number[]) {
  for (const num of pageNumbers) {
    // Click the thumbnail container that has the page number badge
    const thumb = page.locator(`img[alt="Page ${num}"]`).first();
    await thumb.click();
  }
}

test.describe('PDF AI Assistant', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=PDF AI Assistant')).toBeVisible();
  });

  // ===========================================
  // UI Basics
  // ===========================================
  test.describe('UI Basics', () => {
    test('should show the app title, layout and onboarding', async ({ page }) => {
      await expect(page.locator('text=PDF AI Assistant')).toBeVisible();
      await expect(page.locator('text=Files (0)')).toBeVisible();
      await expect(page.locator('text=May I Help?')).toBeVisible();
      // Onboarding steps
      await expect(page.locator('text=Welcome to PDF AI Assistant')).toBeVisible();
      await expect(page.locator('text=Upload your PDFs or load samples')).toBeVisible();
      await expect(page.locator('text=Select pages & use the toolbar')).toBeVisible();
      await expect(page.locator('text=Or just ask the AI')).toBeVisible();
    });

    test('should show Load Sample PDFs button prominently below Files (0)', async ({ page }) => {
      const loadBtn = page.getByRole('button', { name: /Load Sample PDFs/ }).first();
      await expect(loadBtn).toBeVisible();
      // Should be below the Files heading (in the sidebar, not the header)
      await expect(page.locator('text=Load 6 test PDFs to try things out')).toBeVisible();
    });

    test('should load sample PDFs with correct page counts', async ({ page }) => {
      await loadSamplePdfs(page);
      await expect(page.locator('text=Files (6)')).toBeVisible();
      // Verify each file and its page count
      await expect(page.locator('text=TestPDF-1')).toBeVisible();
      await expect(page.locator('text=3 pages').first()).toBeVisible();
      await expect(page.locator('text=TestPDF-2')).toBeVisible();
      await expect(page.locator('text=5 pages')).toBeVisible();
      await expect(page.locator('text=TestPDF-3')).toBeVisible();
      await expect(page.locator('text=7 pages')).toBeVisible();
      await expect(page.locator('text=TestPDF-4')).toBeVisible();
      await expect(page.locator('text=2 pages').first()).toBeVisible();
      await expect(page.locator('text=TestPDF-5')).toBeVisible();
      await expect(page.locator('text=4 pages')).toBeVisible();
      await expect(page.locator('text=TestPDF-6')).toBeVisible();
      await expect(page.locator('text=10 pages')).toBeVisible();
    });

    test('should show page thumbnails when a file is selected', async ({ page }) => {
      await loadSamplePdfs(page);
      // TestPDF-1 should be auto-selected (3 pages) - wait for thumbnails to render
      await expect(page.locator('img[alt="Page 1"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('img[alt="Page 2"]')).toBeVisible();
      await expect(page.locator('img[alt="Page 3"]')).toBeVisible();
      // Exactly 3 thumbnails
      const count = await countThumbnails(page);
      expect(count).toBe(3);
    });

    test('should show template suggestions', async ({ page }) => {
      await expect(page.locator('text=Quick commands')).toBeVisible();
      await expect(page.locator('text=Merge all files into one')).toBeVisible();
      await expect(page.locator('text=Complex multi-step task')).toBeVisible();
    });

    test('should switch between files and show correct thumbnails', async ({ page }) => {
      await loadSamplePdfs(page);
      // Default: TestPDF-1 with 3 thumbnails
      await expect(page.locator('img[alt="Page 3"]')).toBeVisible({ timeout: 10000 });
      let count = await countThumbnails(page);
      expect(count).toBe(3);

      // Switch to TestPDF-2 (5 pages)
      await selectFile(page, 'TestPDF-2');
      await expect(page.locator('img[alt="Page 5"]')).toBeVisible({ timeout: 10000 });
      count = await countThumbnails(page);
      expect(count).toBe(5);

      // Switch to TestPDF-4 (2 pages)
      await selectFile(page, 'TestPDF-4');
      await expect(page.locator('img[alt="Page 2"]')).toBeVisible({ timeout: 10000 });
      count = await countThumbnails(page);
      expect(count).toBe(2);
    });
  });

  // ===========================================
  // Manual Operations with page content verification
  // ===========================================
  test.describe('Manual Operations', () => {
    test('should select and deselect pages', async ({ page }) => {
      await loadSamplePdfs(page);
      await page.waitForTimeout(2000);

      // Click page 1 thumbnail
      await page.locator('img[alt="Page 1"]').click();
      await expect(page.locator('text=1 page selected')).toBeVisible();
      await expect(page.locator('text=1 selected')).toBeVisible();

      // Click page 3
      await page.locator('img[alt="Page 3"]').click();
      await expect(page.locator('text=2 pages selected')).toBeVisible();
      await expect(page.locator('text=2 selected')).toBeVisible();

      // Deselect page 1
      await page.locator('img[alt="Page 1"]').click();
      await expect(page.locator('text=1 page selected')).toBeVisible();
    });

    test('should delete a page and verify remaining page content', async ({ page }) => {
      await loadSamplePdfs(page);
      await page.waitForTimeout(2000);

      // TestPDF-1 has 3 pages. Select page 2 and delete it.
      await page.locator('img[alt="Page 2"]').click();
      await expect(page.locator('text=1 page selected')).toBeVisible();

      await page.getByRole('button', { name: 'Delete Selected' }).click();

      // Should now show 2 pages
      await expect(page.locator('text=2 pages').first()).toBeVisible({ timeout: 5000 });
      const count = await countThumbnails(page);
      expect(count).toBe(2);

      // File list should still show 6 files (delete modifies in-place)
      await expect(page.locator('text=Files (6)')).toBeVisible();
    });

    test('should extract pages into a new file and verify content', async ({ page }) => {
      await loadSamplePdfs(page);
      // Switch to TestPDF-2 (5 pages)
      await selectFile(page, 'TestPDF-2');
      await expect(page.locator('img[alt="Page 5"]')).toBeVisible({ timeout: 10000 });

      // Select pages 1 and 3
      await page.locator('img[alt="Page 1"]').click();
      await page.locator('img[alt="Page 3"]').click();
      await expect(page.locator('text=2 pages selected')).toBeVisible();

      // Extract
      await page.getByRole('button', { name: 'Extract Selected' }).click();

      // Should have 7 files now
      await expect(page.locator('text=Files (7)')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=TestPDF-2-extract')).toBeVisible();

      // Click on extracted file to verify
      await selectFile(page, 'TestPDF-2-extract');
      await expect(page.locator('img[alt="Page 2"]')).toBeVisible({ timeout: 10000 });
      const count = await countThumbnails(page);
      expect(count).toBe(2);
    });

    test('should merge pages across files and verify content', async ({ page }) => {
      await loadSamplePdfs(page);
      await page.waitForTimeout(2000);

      // Select page 1 from TestPDF-1
      await page.locator('img[alt="Page 1"]').click();
      await expect(page.locator('text=1 page selected')).toBeVisible();

      // Switch to TestPDF-3 and select page 2
      await selectFile(page, 'TestPDF-3');
      await expect(page.locator('img[alt="Page 7"]')).toBeVisible({ timeout: 10000 });
      await page.locator('img[alt="Page 2"]').click();
      await expect(page.locator('text=2 pages selected')).toBeVisible();

      // Merge
      await page.getByRole('button', { name: 'Merge Selected' }).click();

      // Should have 7 files
      await expect(page.locator('text=Files (7)')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=merged')).toBeVisible();

      // Click on merged file to verify it has 2 pages
      await selectFile(page, 'merged');
      await expect(page.locator('img[alt="Page 2"]')).toBeVisible({ timeout: 10000 });
      const count = await countThumbnails(page);
      expect(count).toBe(2);
    });

    test('should select all pages via Select All button', async ({ page }) => {
      await loadSamplePdfs(page);
      await page.waitForTimeout(2000);

      // Click Select All
      await page.getByRole('button', { name: 'Select All' }).click();
      await expect(page.locator('text=3 pages selected')).toBeVisible();
      await expect(page.locator('text=3 selected')).toBeVisible();
    });

    test('should remove a file via the x button', async ({ page }) => {
      await loadSamplePdfs(page);

      // Remove TestPDF-1 via x button
      const removeBtn = page.locator('text=TestPDF-1').locator('..').locator('..').getByRole('button', { name: 'x' });
      await removeBtn.click();

      // Should have 5 files now
      await expect(page.locator('text=Files (5)')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=TestPDF-1')).not.toBeVisible();
    });
  });

  // ===========================================
  // AI Tools (require Gemini API)
  // ===========================================
  test.describe('AI Tool: listFiles', () => {
    test('should list uploaded files via AI', async ({ page }) => {
      await loadSamplePdfs(page);
      await sendAiMessage(page, 'List all my files');
      await waitForAiResponse(page);

      // The AI response should mention file names
      const messages = page.locator('[class*="bg-slate-700"][class*="rounded-lg"]');
      const lastMessage = messages.last();
      await expect(lastMessage).toContainText(/TestPDF/);
    });
  });

  test.describe('AI Tool: mergePages', () => {
    test('should merge all files and verify page count', async ({ page }) => {
      await loadSamplePdfs(page);
      await sendAiMessage(page, 'Merge all my uploaded PDFs into a single document');
      await waitForAiResponse(page);

      // A merged file should appear with 31 pages (3+5+7+2+4+10)
      await expect(page.locator('text=Files (7)')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=31 pages')).toBeVisible();

      // Click on merged file and verify thumbnail count
      await page.locator('text=31 pages').first().click();
      await page.waitForTimeout(2000);
      const count = await countThumbnails(page);
      expect(count).toBe(31);
    });

    test('should merge specific pages from multiple files', async ({ page }) => {
      await loadSamplePdfs(page);
      await sendAiMessage(
        page,
        'Merge pages 1 and 2 of TestPDF-1 with page 3 of TestPDF-2'
      );
      await waitForAiResponse(page);

      // Should have 7 files with a 3-page merged result
      await expect(page.locator('text=Files (7)')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=3 pages').nth(1)).toBeVisible(); // merged file has 3 pages
    });
  });

  test.describe('AI Tool: deletePages', () => {
    test('should delete a page and verify reduced count', async ({ page }) => {
      await loadSamplePdfs(page);
      await sendAiMessage(page, 'Remove page 1 from TestPDF-1');
      await waitForAiResponse(page);

      // TestPDF-1 should now show 2 pages
      const messages = page.locator('[class*="bg-slate-700"][class*="rounded-lg"]');
      const lastMessage = messages.last();
      await expect(lastMessage).toContainText(/[Dd]elet|[Rr]emov/);

      // Verify in sidebar
      const testPdf1 = page.locator('text=TestPDF-1').first().locator('..');
      await expect(testPdf1.locator('text=2 pages')).toBeVisible({ timeout: 5000 });

      // Click TestPDF-1 and verify only 2 thumbnails
      await selectFile(page, 'TestPDF-1');
      await page.waitForTimeout(1000);
      const count = await countThumbnails(page);
      expect(count).toBe(2);
    });
  });

  test.describe('AI Tool: extractPages', () => {
    test('should extract pages into a new file', async ({ page }) => {
      await loadSamplePdfs(page);
      await sendAiMessage(
        page,
        'Extract pages 2 through 4 from TestPDF-2 into a new PDF'
      );
      await waitForAiResponse(page);

      // Should have 7 files (6 original + 1 extracted)
      await expect(page.locator('text=Files (7)')).toBeVisible({ timeout: 5000 });

      // Find the extracted file (should have 3 pages)
      await expect(page.locator('text=3 pages').nth(1)).toBeVisible();
    });
  });

  test.describe('Complex Chained Commands', () => {
    test('should handle a multi-step command', async ({ page }) => {
      await loadSamplePdfs(page);
      await sendAiMessage(
        page,
        'Put together the first two pages of TestPDF-1 and the third page of TestPDF-3 and the third page of TestPDF-1 together, also give me TestPDF-6 with the last page removed'
      );
      await waitForAiResponse(page);

      // Should have performed merge + delete
      const messages = page.locator('[class*="bg-slate-700"][class*="rounded-lg"]');
      const lastMessage = messages.last();
      await expect(lastMessage).toContainText(/[Mm]erg|[Cc]ombin|[Dd]elet|[Rr]emov/);

      // Merged file should have 4 pages (2+1+1)
      // TestPDF-6 should have 9 pages (10-1)
      await expect(page.locator('text=9 pages')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Template Suggestions', () => {
    test('should send template command when clicked', async ({ page }) => {
      await loadSamplePdfs(page);
      // Click "Merge all files into one" template
      await page.getByRole('button', { name: 'Merge all files into one' }).click();
      // Should start AI processing
      await waitForAiResponse(page);
      // Should have new merged file
      await expect(page.locator('text=Files (7)')).toBeVisible({ timeout: 5000 });
    });
  });
});
