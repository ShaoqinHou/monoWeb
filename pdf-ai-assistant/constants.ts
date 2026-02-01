import { TemplateCommand } from './types';

/** Maximum file size in bytes (50 MB) */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/** Thumbnail rendering scale */
export const THUMBNAIL_SCALE = 0.4;

/** Full preview rendering scale */
export const PREVIEW_SCALE = 1.2;

/** Template test PDF definitions for "Load Sample PDFs" */
export const SAMPLE_PDFS = [
  { name: 'TestPDF-1', pages: 3 },
  { name: 'TestPDF-2', pages: 5 },
  { name: 'TestPDF-3', pages: 7 },
  { name: 'TestPDF-4', pages: 2 },
  { name: 'TestPDF-5', pages: 4 },
  { name: 'TestPDF-6', pages: 10 },
] as const;

/** Template commands displayed in the AI panel */
export const TEMPLATE_COMMANDS: TemplateCommand[] = [
  // Merge commands
  {
    label: 'Merge all files into one',
    prompt: 'Merge all my uploaded PDFs into a single document',
    category: 'merge',
  },
  {
    label: 'Combine first pages of each file',
    prompt: 'Take the first page from each uploaded PDF and merge them into one document',
    category: 'merge',
  },
  {
    label: 'Cherry-pick and merge',
    prompt: 'Merge pages 1-2 of {file1} with page 3 of {file2}',
    category: 'merge',
  },

  // Delete commands
  {
    label: 'Remove last page',
    prompt: 'Remove the last page from {file1}',
    category: 'delete',
  },
  {
    label: 'Keep only first 3 pages',
    prompt: 'Delete all pages after page 3 from {file2}',
    category: 'delete',
  },

  // Extract commands
  {
    label: 'Extract pages 2-4',
    prompt: 'Extract pages 2 through 4 from {file2} into a new PDF',
    category: 'extract',
  },
  {
    label: 'Split file into individual pages',
    prompt: 'Extract every page of {file1} into separate PDFs',
    category: 'extract',
  },

  // Complex / general
  {
    label: 'Complex multi-step task',
    prompt:
      'Put together the first two pages of {file1} and the third page of {file2} and the third page of {file1} together, also give me {file3} with the last page removed',
    category: 'general',
  },
];
