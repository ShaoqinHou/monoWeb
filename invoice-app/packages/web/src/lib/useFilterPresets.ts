import { useState, useCallback } from "react";
import type { FilterValues } from "./useAdvancedFilters";

export interface FilterPreset {
  id: string;
  name: string;
  filters: FilterValues;
}

export interface FilterPresetsState {
  presets: FilterPreset[];
  savePreset: (name: string, filters: FilterValues) => void;
  loadPreset: (id: string) => FilterValues | undefined;
  deletePreset: (id: string) => void;
}

function storageKey(entityType: string): string {
  return `xero_filter_presets_${entityType}`;
}

function readPresets(entityType: string): FilterPreset[] {
  try {
    const raw = localStorage.getItem(storageKey(entityType));
    if (!raw) return [];
    return JSON.parse(raw) as FilterPreset[];
  } catch {
    return [];
  }
}

function writePresets(entityType: string, presets: FilterPreset[]): void {
  localStorage.setItem(storageKey(entityType), JSON.stringify(presets));
}

export function useFilterPresets(entityType: string): FilterPresetsState {
  const [presets, setPresets] = useState<FilterPreset[]>(() =>
    readPresets(entityType),
  );

  const savePreset = useCallback(
    (name: string, filters: FilterValues) => {
      const newPreset: FilterPreset = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name,
        filters,
      };
      setPresets((prev) => {
        const next = [...prev, newPreset];
        writePresets(entityType, next);
        return next;
      });
    },
    [entityType],
  );

  const loadPreset = useCallback(
    (id: string): FilterValues | undefined => {
      const preset = presets.find((p) => p.id === id);
      return preset?.filters;
    },
    [presets],
  );

  const deletePreset = useCallback(
    (id: string) => {
      setPresets((prev) => {
        const next = prev.filter((p) => p.id !== id);
        writePresets(entityType, next);
        return next;
      });
    },
    [entityType],
  );

  return { presets, savePreset, loadPreset, deletePreset };
}
