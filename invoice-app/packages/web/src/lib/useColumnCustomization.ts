import { useState, useCallback } from "react";

export interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
}

export interface ColumnCustomizationState {
  visibleColumns: ColumnConfig[];
  allColumns: ColumnConfig[];
  toggleColumn: (key: string) => void;
  reorderColumn: (key: string, direction: "up" | "down") => void;
  resetToDefault: () => void;
}

function storageKey(entityType: string): string {
  return `xero_column_config_${entityType}`;
}

function readConfig(entityType: string): ColumnConfig[] | null {
  try {
    const raw = localStorage.getItem(storageKey(entityType));
    if (!raw) return null;
    return JSON.parse(raw) as ColumnConfig[];
  } catch {
    return null;
  }
}

function writeConfig(entityType: string, columns: ColumnConfig[]): void {
  localStorage.setItem(storageKey(entityType), JSON.stringify(columns));
}

export function useColumnCustomization(
  entityType: string,
  defaultColumns: ColumnConfig[],
): ColumnCustomizationState {
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    const saved = readConfig(entityType);
    if (saved) return saved;
    return defaultColumns;
  });

  const toggleColumn = useCallback(
    (key: string) => {
      setColumns((prev) => {
        const next = prev.map((col) =>
          col.key === key ? { ...col, visible: !col.visible } : col,
        );
        writeConfig(entityType, next);
        return next;
      });
    },
    [entityType],
  );

  const reorderColumn = useCallback(
    (key: string, direction: "up" | "down") => {
      setColumns((prev) => {
        const idx = prev.findIndex((col) => col.key === key);
        if (idx === -1) return prev;
        const newIdx = direction === "up" ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= prev.length) return prev;
        const next = [...prev];
        [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
        writeConfig(entityType, next);
        return next;
      });
    },
    [entityType],
  );

  const resetToDefault = useCallback(() => {
    setColumns(defaultColumns);
    localStorage.removeItem(storageKey(entityType));
  }, [entityType, defaultColumns]);

  const visibleColumns = columns.filter((col) => col.visible);

  return {
    visibleColumns,
    allColumns: columns,
    toggleColumn,
    reorderColumn,
    resetToDefault,
  };
}
