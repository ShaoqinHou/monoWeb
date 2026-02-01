import React, { useReducer, useCallback, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
  type DragStartEvent,
  type DragEndEvent,
  type CollisionDetection,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { AppState, AppAction, PdfFile, ChatMessage, WorkspacePage } from './types';
import { SAMPLE_PDFS, THUMBNAIL_SCALE } from './constants';
import { generateTestPdf } from './test/helpers/generateTestPdf';
import * as pdfService from './services/pdfService';
import { renderPageToImage } from './services/pdfRenderService';
import FileList from './components/FileList';
import PdfPreview from './components/PdfPreview';
import Toolbar from './components/Toolbar';
import AIChatPanel from './components/AIChatPanel';
import WorkspaceDock from './components/WorkspaceDock';

const initialState: AppState = {
  files: [],
  activeFileId: null,
  selectedPages: new Map(),
  chatMessages: [],
  aiLoading: false,
  workspace: [],
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_FILES':
      return {
        ...state,
        files: [...state.files, ...action.files],
        activeFileId: state.activeFileId || action.files[0]?.id || null,
      };

    case 'REMOVE_FILE': {
      const remaining = state.files.filter((f) => f.id !== action.fileId);
      const newSelection = new Map(state.selectedPages);
      newSelection.delete(action.fileId);
      return {
        ...state,
        files: remaining,
        activeFileId:
          state.activeFileId === action.fileId
            ? remaining[0]?.id || null
            : state.activeFileId,
        selectedPages: newSelection,
      };
    }

    case 'REPLACE_FILE':
      return {
        ...state,
        files: state.files.map((f) =>
          f.id === action.fileId ? action.newFile : f
        ),
      };

    case 'UPDATE_FILE':
      return {
        ...state,
        files: state.files.map((f) =>
          f.id === action.fileId ? { ...f, ...action.updates } : f
        ),
      };

    case 'SET_ACTIVE_FILE':
      return { ...state, activeFileId: action.fileId };

    case 'TOGGLE_PAGE': {
      const sel = new Map(state.selectedPages);
      const pages = new Set(sel.get(action.fileId) || []);
      if (pages.has(action.pageNumber)) {
        pages.delete(action.pageNumber);
      } else {
        pages.add(action.pageNumber);
      }
      if (pages.size === 0) {
        sel.delete(action.fileId);
      } else {
        sel.set(action.fileId, pages);
      }
      return { ...state, selectedPages: sel };
    }

    case 'SELECT_PAGES': {
      const sel = new Map(state.selectedPages);
      sel.set(action.fileId, new Set(action.pages));
      return { ...state, selectedPages: sel };
    }

    case 'SELECT_ALL_PAGES': {
      const file = state.files.find((f) => f.id === action.fileId);
      if (!file) return state;
      const sel = new Map(state.selectedPages);
      sel.set(
        action.fileId,
        new Set(Array.from({ length: file.pageCount }, (_, i) => i + 1))
      );
      return { ...state, selectedPages: sel };
    }

    case 'DESELECT_ALL':
      return { ...state, selectedPages: new Map() };

    case 'ADD_CHAT_MESSAGE':
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.message],
      };

    case 'SET_AI_LOADING':
      return { ...state, aiLoading: action.loading };

    case 'ADD_TO_WORKSPACE':
      return {
        ...state,
        workspace: [...state.workspace, ...action.pages],
      };

    case 'REMOVE_FROM_WORKSPACE':
      return {
        ...state,
        workspace: state.workspace.filter((p) => !action.pageIds.includes(p.id)),
      };

    case 'REORDER_WORKSPACE': {
      const orderMap = new Map(action.pageIds.map((id, idx) => [id, idx]));
      const sorted = [...state.workspace].sort(
        (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
      );
      return { ...state, workspace: sorted };
    }

    case 'CLEAR_WORKSPACE':
      return { ...state, workspace: [] };

    default:
      return state;
  }
}

/** Parse a grid sortable ID like "grid-fileId-3" into { fileId, pageNumber } */
function parseGridId(id: string): { fileId: string; pageNumber: number } | null {
  const match = id.match(/^grid-(.+)-(\d+)$/);
  if (!match) return null;
  return { fileId: match[1], pageNumber: parseInt(match[2], 10) };
}

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const filesRef = useRef<PdfFile[]>(state.files);
  filesRef.current = state.files;

  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const activeFile = state.files.find((f) => f.id === state.activeFileId) || null;

  // DnD sensors — 8px distance prevents accidental drags on click
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Custom collision detection: prefer workspace drop zone, then grid rect intersection
  const collisionDetection: CollisionDetection = useCallback((args) => {
    const pointerCollisions = pointerWithin(args);
    const workspaceHit = pointerCollisions.find((c) => c.id === 'workspace-drop');
    if (workspaceHit) return [workspaceHit];
    return rectIntersection(args);
  }, []);

  // ── Standard callbacks ──

  const handleFilesAdded = useCallback((files: PdfFile[]) => {
    dispatch({ type: 'ADD_FILES', files });
  }, []);

  const handleRemoveFile = useCallback((fileId: string) => {
    dispatch({ type: 'REMOVE_FILE', fileId });
  }, []);

  const handleSetActive = useCallback((fileId: string) => {
    dispatch({ type: 'SET_ACTIVE_FILE', fileId });
  }, []);

  const handleTogglePage = useCallback((fileId: string, pageNumber: number) => {
    dispatch({ type: 'TOGGLE_PAGE', fileId, pageNumber });
  }, []);

  const handleSelectAllPages = useCallback((fileId: string) => {
    dispatch({ type: 'SELECT_ALL_PAGES', fileId });
  }, []);

  const handleDeselectAll = useCallback(() => {
    dispatch({ type: 'DESELECT_ALL' });
  }, []);

  const handleAddFile = useCallback((file: PdfFile) => {
    dispatch({ type: 'ADD_FILES', files: [file] });
  }, []);

  const handleReplaceFile = useCallback((fileId: string, newFile: PdfFile) => {
    dispatch({ type: 'REPLACE_FILE', fileId, newFile });
  }, []);

  const handleAddChatMessage = useCallback((message: ChatMessage) => {
    dispatch({ type: 'ADD_CHAT_MESSAGE', message });
  }, []);

  const handleSetAiLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_AI_LOADING', loading });
  }, []);

  const handleLoadSamples = useCallback(async () => {
    const sampleFiles: PdfFile[] = [];
    for (const sample of SAMPLE_PDFS) {
      const data = await generateTestPdf(sample.name, sample.pages);
      sampleFiles.push({
        id: `sample-${sample.name}-${Date.now()}`,
        name: sample.name,
        fileName: `${sample.name}.pdf`,
        data,
        pageCount: sample.pages,
      });
    }
    dispatch({ type: 'ADD_FILES', files: sampleFiles });
  }, []);

  // ── Workspace callbacks ──

  const handleAddToWorkspace = useCallback(async () => {
    const currentFiles = filesRef.current;
    const pages: WorkspacePage[] = [];

    for (const [fileId, pageNums] of state.selectedPages) {
      const file = currentFiles.find((f) => f.id === fileId);
      if (!file) continue;
      const sorted = [...pageNums].sort((a, b) => a - b);
      for (const pageNum of sorted) {
        const thumbnailUrl = await renderPageToImage(file.data, pageNum, THUMBNAIL_SCALE);
        pages.push({
          id: `ws-${fileId}-${pageNum}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          sourceFileId: fileId,
          sourceFileName: file.name,
          pageNumber: pageNum,
          thumbnailUrl,
        });
      }
    }

    if (pages.length > 0) {
      dispatch({ type: 'ADD_TO_WORKSPACE', pages });
      dispatch({ type: 'DESELECT_ALL' });
    }
  }, [state.selectedPages]);

  const handleRemoveFromWorkspace = useCallback((pageId: string) => {
    dispatch({ type: 'REMOVE_FROM_WORKSPACE', pageIds: [pageId] });
  }, []);

  const handleClearWorkspace = useCallback(() => {
    dispatch({ type: 'CLEAR_WORKSPACE' });
  }, []);

  const handleCreatePdfFromWorkspace = useCallback(async () => {
    const currentFiles = filesRef.current;
    const workspace = state.workspace;
    if (workspace.length === 0) return;

    // Each workspace page → individual merge source (preserves order)
    const sources: Array<{ data: Uint8Array; pages: number[] }> = [];
    for (const wp of workspace) {
      const file = currentFiles.find((f) => f.id === wp.sourceFileId);
      if (!file) continue;
      sources.push({ data: file.data, pages: [wp.pageNumber] });
    }

    const result = await pdfService.mergePages(sources);
    if (result.success && result.data) {
      const newFile: PdfFile = {
        id: `workspace-${Date.now()}`,
        name: 'workspace-assembly',
        fileName: 'workspace-assembly.pdf',
        data: result.data,
        pageCount: result.pageCount!,
      };
      dispatch({ type: 'ADD_FILES', files: [newFile] });
      dispatch({ type: 'CLEAR_WORKSPACE' });
    }
  }, [state.workspace]);

  // ── Drag-and-drop handlers ──

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveDragId(null);
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      // Case 1: Grid item dropped on workspace drop zone
      if (overId === 'workspace-drop' && activeId.startsWith('grid-')) {
        const parsed = parseGridId(activeId);
        if (!parsed) return;
        const file = filesRef.current.find((f) => f.id === parsed.fileId);
        if (!file) return;

        // If dragged page is part of a selection, add all selected pages from this file
        const selectedForFile = state.selectedPages.get(parsed.fileId);
        const pagesToAdd =
          selectedForFile && selectedForFile.has(parsed.pageNumber)
            ? [...selectedForFile].sort((a, b) => a - b)
            : [parsed.pageNumber];

        const newPages: WorkspacePage[] = [];
        for (const pageNum of pagesToAdd) {
          const thumbnailUrl = await renderPageToImage(file.data, pageNum, THUMBNAIL_SCALE);
          newPages.push({
            id: `ws-${parsed.fileId}-${pageNum}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            sourceFileId: parsed.fileId,
            sourceFileName: file.name,
            pageNumber: pageNum,
            thumbnailUrl,
          });
        }
        dispatch({ type: 'ADD_TO_WORKSPACE', pages: newPages });
        return;
      }

      // Case 2: Reorder within the grid (same file)
      if (activeId.startsWith('grid-') && overId.startsWith('grid-')) {
        const activeParsed = parseGridId(activeId);
        const overParsed = parseGridId(overId);
        if (!activeParsed || !overParsed) return;
        if (activeParsed.fileId !== overParsed.fileId) return;
        if (activeParsed.pageNumber === overParsed.pageNumber) return;

        const file = filesRef.current.find((f) => f.id === activeParsed.fileId);
        if (!file) return;

        // Build new page order using arrayMove
        const pageCount = file.pageCount;
        const oldOrder = Array.from({ length: pageCount }, (_, i) => i + 1);
        const oldIndex = oldOrder.indexOf(activeParsed.pageNumber);
        const newIndex = oldOrder.indexOf(overParsed.pageNumber);
        const newOrder = arrayMove(oldOrder, oldIndex, newIndex);

        // Rebuild PDF in new order via extractPages
        const result = await pdfService.extractPages(file.data, newOrder);
        if (result.success && result.data) {
          dispatch({
            type: 'REPLACE_FILE',
            fileId: file.id,
            newFile: { ...file, data: result.data, pageCount: result.pageCount! },
          });
          // Clear selection since page positions changed
          const sel = new Map(state.selectedPages);
          sel.delete(file.id);
          if (sel.size === 0) {
            dispatch({ type: 'DESELECT_ALL' });
          }
        }
        return;
      }

      // Case 3: Reorder within workspace
      if (activeId.startsWith('ws-') && overId.startsWith('ws-')) {
        const oldIndex = state.workspace.findIndex((p) => p.id === activeId);
        const newIndex = state.workspace.findIndex((p) => p.id === overId);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

        const newOrder = arrayMove(
          state.workspace.map((p) => p.id),
          oldIndex,
          newIndex
        );
        dispatch({ type: 'REORDER_WORKSPACE', pageIds: newOrder });
      }
    },
    [state.selectedPages, state.workspace]
  );

  // Drag overlay preview
  const dragOverlayContent = (() => {
    if (!activeDragId) return null;

    if (activeDragId.startsWith('ws-')) {
      const wp = state.workspace.find((p) => p.id === activeDragId);
      if (!wp) return null;
      return (
        <div className="w-16 h-20 rounded-md overflow-hidden border-2 border-blue-500 bg-white shadow-xl opacity-90">
          <img src={wp.thumbnailUrl} alt="" className="w-full h-full object-cover" draggable={false} />
        </div>
      );
    }

    const parsed = parseGridId(activeDragId);
    if (!parsed) return null;
    const selectedForFile = state.selectedPages.get(parsed.fileId);
    const dragCount =
      selectedForFile && selectedForFile.has(parsed.pageNumber) ? selectedForFile.size : 1;

    return (
      <div className="relative">
        <div className="w-24 h-32 rounded-lg bg-white border-2 border-blue-500 shadow-xl flex items-center justify-center opacity-90">
          <span className="text-slate-600 text-sm font-medium">Page {parsed.pageNumber}</span>
        </div>
        {dragCount > 1 && (
          <div className="absolute -top-2 -right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-md">
            {dragCount}
          </div>
        )}
      </div>
    );
  })();

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">
            PDF
          </div>
          <h1 className="text-lg font-semibold">PDF AI Assistant</h1>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left sidebar — File list */}
        <div className="w-60 bg-slate-800 border-r border-slate-700 flex flex-col shrink-0">
          <FileList
            files={state.files}
            activeFileId={state.activeFileId}
            onSetActive={handleSetActive}
            onRemoveFile={handleRemoveFile}
            onFilesAdded={handleFilesAdded}
            onLoadSamples={handleLoadSamples}
          />
        </div>

        {/* Center — Preview + Toolbar + Workspace (wrapped in DnD context) */}
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 flex flex-col min-w-0">
            <Toolbar
              files={state.files}
              selectedPages={state.selectedPages}
              onAddFile={handleAddFile}
              onReplaceFile={handleReplaceFile}
              onDeselectAll={handleDeselectAll}
              onAddToWorkspace={handleAddToWorkspace}
            />
            <PdfPreview
              file={activeFile}
              selectedPages={state.selectedPages}
              onTogglePage={handleTogglePage}
              onSelectAllPages={handleSelectAllPages}
              onDeselectAll={handleDeselectAll}
              onFilesAdded={handleFilesAdded}
            />
            <WorkspaceDock
              pages={state.workspace}
              files={state.files}
              onRemovePage={handleRemoveFromWorkspace}
              onClear={handleClearWorkspace}
              onCreatePdf={handleCreatePdfFromWorkspace}
            />
          </div>

          <DragOverlay dropAnimation={null}>{dragOverlayContent}</DragOverlay>
        </DndContext>

        {/* Right sidebar — AI Chat */}
        <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col shrink-0">
          <AIChatPanel
            files={state.files}
            filesRef={filesRef}
            chatMessages={state.chatMessages}
            aiLoading={state.aiLoading}
            onAddChatMessage={handleAddChatMessage}
            onSetAiLoading={handleSetAiLoading}
            onAddFile={handleAddFile}
            onReplaceFile={handleReplaceFile}
          />
        </div>
      </div>
    </div>
  );
}
