import {
  GoogleGenAI,
  Type,
  FunctionCallingConfigMode,
} from '@google/genai';
import type {
  FunctionDeclaration,
  Content,
  Part,
  FunctionCall,
} from '@google/genai';
import { PdfFile, OperationSummary } from '../types';
import * as pdfService from './pdfService';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// ============================================================
// Tool Declarations
// ============================================================

const listFilesTool: FunctionDeclaration = {
  name: 'listFiles',
  description:
    'List all currently uploaded PDF files with their names and page counts. Use this to understand what files are available before performing operations.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const deletePagesTool: FunctionDeclaration = {
  name: 'deletePages',
  description:
    'Remove specific pages from a PDF file. The file is modified in-place. Use when the user wants to delete, remove, or drop pages.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      fileName: {
        type: Type.STRING,
        description: 'The display name of the PDF file to modify (must match exactly).',
      },
      pageNumbers: {
        type: Type.ARRAY,
        items: { type: Type.NUMBER },
        description: 'Array of 1-based page numbers to remove.',
      },
    },
    required: ['fileName', 'pageNumbers'],
  },
};

const mergePagesTool: FunctionDeclaration = {
  name: 'mergePages',
  description:
    'Combine pages from one or more PDF files into a single new PDF. Use for merging, combining, or putting together documents or specific pages.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      sources: {
        type: Type.ARRAY,
        description: 'Ordered list of sources. Each specifies a file and optionally which pages to include.',
        items: {
          type: Type.OBJECT,
          properties: {
            fileName: {
              type: Type.STRING,
              description: 'Display name of the PDF file.',
            },
            pages: {
              type: Type.ARRAY,
              items: { type: Type.NUMBER },
              description: 'Optional 1-based page numbers. Omit or leave empty to include all pages.',
            },
          },
          required: ['fileName'],
        },
      },
      outputName: {
        type: Type.STRING,
        description: 'Name for the output merged PDF (without .pdf extension).',
      },
    },
    required: ['sources'],
  },
};

const extractPagesTool: FunctionDeclaration = {
  name: 'extractPages',
  description:
    'Extract specific pages from a PDF into a new separate document. Use when the user wants to pull out, extract, or split specific pages.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      fileName: {
        type: Type.STRING,
        description: 'Display name of the source PDF file.',
      },
      pageNumbers: {
        type: Type.ARRAY,
        items: { type: Type.NUMBER },
        description: 'Array of 1-based page numbers to extract.',
      },
      outputName: {
        type: Type.STRING,
        description: 'Name for the extracted PDF (without .pdf extension).',
      },
    },
    required: ['fileName', 'pageNumbers'],
  },
};

const insertPagesTool: FunctionDeclaration = {
  name: 'insertPages',
  description:
    'Insert pages from one PDF into another at a specific position. Use when the user wants to add or insert pages from one file into another.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      targetFileName: {
        type: Type.STRING,
        description: 'Display name of the target PDF to insert into.',
      },
      sourceFileName: {
        type: Type.STRING,
        description: 'Display name of the source PDF to take pages from.',
      },
      sourcePages: {
        type: Type.ARRAY,
        items: { type: Type.NUMBER },
        description: '1-based page numbers from source to insert.',
      },
      insertAfterPage: {
        type: Type.NUMBER,
        description: 'Insert after this 1-based page in target. Use 0 for beginning.',
      },
    },
    required: ['targetFileName', 'sourceFileName', 'sourcePages', 'insertAfterPage'],
  },
};

const ALL_TOOLS: FunctionDeclaration[] = [
  listFilesTool,
  deletePagesTool,
  mergePagesTool,
  extractPagesTool,
  insertPagesTool,
];

// ============================================================
// File Context Builder
// ============================================================

function buildFileContext(files: PdfFile[]): string {
  if (files.length === 0) return 'No PDF files are currently uploaded.';
  return files.map((f) => `- "${f.name}" (${f.pageCount} pages)`).join('\n');
}

// ============================================================
// Tool Executor
// ============================================================

function findFile(files: PdfFile[], name: string): PdfFile | undefined {
  // Exact match first, then case-insensitive
  return (
    files.find((f) => f.name === name || f.fileName === name) ||
    files.find(
      (f) =>
        f.name.toLowerCase() === name.toLowerCase() ||
        f.fileName.toLowerCase() === name.toLowerCase()
    )
  );
}

async function executeFunctionCall(
  call: FunctionCall,
  files: PdfFile[],
  onAddFile: (file: PdfFile) => void,
  onReplaceFile: (fileId: string, newFile: PdfFile) => void
): Promise<{ result: string; operation?: OperationSummary }> {
  const args = (call.args || {}) as Record<string, unknown>;

  switch (call.name) {
    case 'listFiles': {
      return { result: buildFileContext(files), operation: { type: 'list', description: 'Listed files' } };
    }

    case 'deletePages': {
      const fileName = args.fileName as string;
      const pageNumbers = args.pageNumbers as number[];
      const file = findFile(files, fileName);
      if (!file) return { result: `Error: File "${fileName}" not found. Available files: ${files.map((f) => f.name).join(', ')}` };

      const opResult = await pdfService.deletePages(file.data, pageNumbers);
      if (!opResult.success) return { result: `Error: ${opResult.message}` };

      const newFile: PdfFile = { ...file, data: opResult.data!, pageCount: opResult.pageCount! };
      onReplaceFile(file.id, newFile);

      return {
        result: opResult.message,
        operation: {
          type: 'delete',
          description: `Removed pages [${pageNumbers.join(', ')}] from "${file.name}"`,
          resultFileName: file.name,
        },
      };
    }

    case 'mergePages': {
      const sources = args.sources as Array<{ fileName: string; pages?: number[] }>;
      const outputName = (args.outputName as string) || 'merged';

      const resolvedSources: Array<{ data: Uint8Array; pages?: number[] }> = [];
      for (const src of sources) {
        const file = findFile(files, src.fileName);
        if (!file) return { result: `Error: File "${src.fileName}" not found. Available: ${files.map((f) => f.name).join(', ')}` };
        resolvedSources.push({ data: file.data, pages: src.pages });
      }

      const opResult = await pdfService.mergePages(resolvedSources);
      if (!opResult.success) return { result: `Error: ${opResult.message}` };

      const newFile: PdfFile = {
        id: `merged-${Date.now()}`,
        name: outputName,
        fileName: `${outputName}.pdf`,
        data: opResult.data!,
        pageCount: opResult.pageCount!,
      };
      onAddFile(newFile);

      return {
        result: `${opResult.message} Saved as "${outputName}".`,
        operation: {
          type: 'merge',
          description: `Merged ${sources.length} source(s) into "${outputName}" (${opResult.pageCount} pages)`,
          resultFileName: outputName,
        },
      };
    }

    case 'extractPages': {
      const fileName = args.fileName as string;
      const pageNumbers = args.pageNumbers as number[];
      const outputName = (args.outputName as string) || `${fileName}-extract`;

      const file = findFile(files, fileName);
      if (!file) return { result: `Error: File "${fileName}" not found. Available: ${files.map((f) => f.name).join(', ')}` };

      const opResult = await pdfService.extractPages(file.data, pageNumbers);
      if (!opResult.success) return { result: `Error: ${opResult.message}` };

      const newFile: PdfFile = {
        id: `extract-${Date.now()}`,
        name: outputName,
        fileName: `${outputName}.pdf`,
        data: opResult.data!,
        pageCount: opResult.pageCount!,
      };
      onAddFile(newFile);

      return {
        result: `Extracted pages [${pageNumbers.join(', ')}] from "${file.name}". ${opResult.message} Saved as "${outputName}".`,
        operation: {
          type: 'extract',
          description: `Extracted pages [${pageNumbers.join(', ')}] from "${file.name}"`,
          resultFileName: outputName,
        },
      };
    }

    case 'insertPages': {
      const targetFileName = args.targetFileName as string;
      const sourceFileName = args.sourceFileName as string;
      const sourcePages = args.sourcePages as number[];
      const insertAfterPage = args.insertAfterPage as number;

      const target = findFile(files, targetFileName);
      const source = findFile(files, sourceFileName);
      if (!target) return { result: `Error: Target file "${targetFileName}" not found.` };
      if (!source) return { result: `Error: Source file "${sourceFileName}" not found.` };

      const opResult = await pdfService.insertPages(
        target.data,
        source.data,
        sourcePages,
        insertAfterPage
      );
      if (!opResult.success) return { result: `Error: ${opResult.message}` };

      const newFile: PdfFile = { ...target, data: opResult.data!, pageCount: opResult.pageCount! };
      onReplaceFile(target.id, newFile);

      return {
        result: opResult.message,
        operation: {
          type: 'insert',
          description: `Inserted pages from "${source.name}" into "${target.name}" after page ${insertAfterPage}`,
          resultFileName: target.name,
        },
      };
    }

    default:
      return { result: `Unknown function: ${call.name}` };
  }
}

// ============================================================
// Multi-Turn Chat Loop
// ============================================================

const SYSTEM_INSTRUCTION = `You are a PDF manipulation assistant. You help users manage their PDF files through natural language commands.

RULES:
- Always use the EXACT file names from the available files list when calling tools.
- Page numbers are 1-based (first page = 1, last page = total pages).
- "Last page" of a file with N pages means page N.
- When a user says "put together", "combine", or "merge", use the mergePages tool.
- When a user says "insert" or "add pages from X into Y", use the insertPages tool.
- For complex requests with MULTIPLE distinct operations, call tools one at a time in sequence.
- If you're unsure which file the user means, call listFiles first.
- After completing all operations, give a clear summary of everything you did.
- If the user asks something unrelated to PDF manipulation, politely explain you can only help with PDF tasks.
- Give the output file a descriptive name based on what was done.
- When the user says "first file", "second file" etc., map them to the files in order as listed.

IMPORTANT - deletePages vs extractPages:
- deletePages MODIFIES the original file in-place. Only use it when the user clearly wants to permanently alter their existing file (e.g. "remove page 3 from my file", "delete the last page").
- When the user says "give me X with pages removed", "give me X without the last page", or any phrasing that implies they want a NEW/separate copy, use extractPages instead. Extract all pages EXCEPT the ones to remove into a new file. This preserves the original.
- Rule of thumb: "give me" or "also give me" = new file (extractPages). "Remove from" or "delete from" = modify original (deletePages).

NO FILES UPLOADED:
- If no files are currently uploaded, tell the user briefly: "No files loaded yet. Click the **Load Sample PDFs** button in the top-left sidebar to get started, or drag & drop your own PDFs."
- Keep it short and direct.`;

export interface AIChatRequest {
  userMessage: string;
  files: PdfFile[];
  chatHistory: Content[];
  onAddFile: (file: PdfFile) => void;
  onReplaceFile: (fileId: string, newFile: PdfFile) => void;
}

export interface AIChatResponse {
  assistantMessage: string;
  operations: OperationSummary[];
  updatedHistory: Content[];
}

const MAX_TURNS = 10;

export async function processAIChatRequest(
  request: AIChatRequest
): Promise<AIChatResponse> {
  const { userMessage, files, chatHistory, onAddFile, onReplaceFile } = request;
  const allOperations: OperationSummary[] = [];

  // Current files state that gets updated as tools execute
  let currentFiles = [...files];

  const wrappedAddFile = (file: PdfFile) => {
    currentFiles = [...currentFiles, file];
    onAddFile(file);
  };

  const wrappedReplaceFile = (fileId: string, newFile: PdfFile) => {
    currentFiles = currentFiles.map((f) => (f.id === fileId ? newFile : f));
    onReplaceFile(fileId, newFile);
  };

  // Build full system instruction with current file context
  const systemInstruction = `${SYSTEM_INSTRUCTION}\n\nAVAILABLE FILES:\n${buildFileContext(files)}`;

  const contents: Content[] = [
    ...chatHistory,
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: ALL_TOOLS }],
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.AUTO,
          },
        },
      },
    });

    const functionCalls = response.functionCalls;

    // No function calls = AI responded with text, we're done
    if (!functionCalls || functionCalls.length === 0) {
      const textResponse = response.text || 'All operations completed successfully.';
      contents.push({ role: 'model', parts: [{ text: textResponse }] });

      return {
        assistantMessage: textResponse,
        operations: allOperations,
        updatedHistory: contents,
      };
    }

    // AI wants to call tool(s) - add model turn with function calls
    const modelParts: Part[] = functionCalls.map((fc) => ({
      functionCall: { name: fc.name, args: fc.args },
    }));
    contents.push({ role: 'model', parts: modelParts });

    // Execute each function call and collect results
    const functionResponseParts: Part[] = [];
    for (const call of functionCalls) {
      const { result, operation } = await executeFunctionCall(
        call,
        currentFiles,
        wrappedAddFile,
        wrappedReplaceFile
      );
      if (operation) allOperations.push(operation);
      functionResponseParts.push({
        functionResponse: { name: call.name, response: { result } },
      });
    }

    // Send tool results back to the model
    contents.push({ role: 'user', parts: functionResponseParts });
  }

  // Safety: hit MAX_TURNS
  return {
    assistantMessage: 'I completed several operations but reached my step limit. Here is what was done so far.',
    operations: allOperations,
    updatedHistory: contents,
  };
}
