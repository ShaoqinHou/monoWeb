/** A single PDF loaded into memory */
export interface PdfFile {
  id: string;
  /** Display name (without .pdf extension) */
  name: string;
  /** Original filename as uploaded */
  fileName: string;
  /** Raw PDF bytes in memory */
  data: Uint8Array;
  /** Total page count */
  pageCount: number;
}

/** Result of any PDF operation */
export interface PdfOperationResult {
  success: boolean;
  /** The resulting PDF bytes (if success) */
  data?: Uint8Array;
  /** Suggested file name for the result */
  suggestedName?: string;
  /** Human-readable description of what was done */
  message: string;
  /** Page count of result PDF */
  pageCount?: number;
}

/** A set of selected pages, keyed by fileId */
export type PageSelection = Map<string, Set<number>>;

/** Chat message in the AI panel */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  /** Operations performed during this message (assistant only) */
  operations?: OperationSummary[];
}

/** Summary of a single PDF operation performed by the AI */
export interface OperationSummary {
  type: 'merge' | 'delete' | 'extract' | 'insert' | 'list';
  description: string;
  resultFileName?: string;
}

/** A clickable template command for the AI chat */
export interface TemplateCommand {
  label: string;
  prompt: string;
  category: 'merge' | 'delete' | 'extract' | 'general';
}

/** A page collected in the workspace from any source file */
export interface WorkspacePage {
  id: string;
  sourceFileId: string;
  sourceFileName: string;
  pageNumber: number;
  thumbnailUrl: string;
}

/** App-level state managed by useReducer */
export interface AppState {
  files: PdfFile[];
  activeFileId: string | null;
  selectedPages: PageSelection;
  chatMessages: ChatMessage[];
  aiLoading: boolean;
  workspace: WorkspacePage[];
}

export type AppAction =
  | { type: 'ADD_FILES'; files: PdfFile[] }
  | { type: 'REMOVE_FILE'; fileId: string }
  | { type: 'REPLACE_FILE'; fileId: string; newFile: PdfFile }
  | { type: 'SET_ACTIVE_FILE'; fileId: string }
  | { type: 'TOGGLE_PAGE'; fileId: string; pageNumber: number }
  | { type: 'SELECT_PAGES'; fileId: string; pages: number[] }
  | { type: 'SELECT_ALL_PAGES'; fileId: string }
  | { type: 'DESELECT_ALL' }
  | { type: 'ADD_CHAT_MESSAGE'; message: ChatMessage }
  | { type: 'SET_AI_LOADING'; loading: boolean }
  | { type: 'UPDATE_FILE'; fileId: string; updates: Partial<PdfFile> }
  | { type: 'ADD_TO_WORKSPACE'; pages: WorkspacePage[] }
  | { type: 'REMOVE_FROM_WORKSPACE'; pageIds: string[] }
  | { type: 'REORDER_WORKSPACE'; pageIds: string[] }
  | { type: 'CLEAR_WORKSPACE' };
