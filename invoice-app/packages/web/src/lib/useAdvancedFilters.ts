import { useState, useCallback, useMemo } from "react";

export type FilterFieldType =
  | "text"
  | "dateRange"
  | "amountRange"
  | "status"
  | "contact";

export interface FilterFieldConfig {
  key: string;
  label: string;
  type: FilterFieldType;
  options?: Array<{ value: string; label: string }>;
}

export interface FilterValues {
  [key: string]: string | string[] | undefined;
}

export interface AdvancedFiltersState {
  filters: FilterValues;
  setFilter: (key: string, value: string | string[] | undefined) => void;
  clearFilters: () => void;
  activeCount: number;
  applyFilters: (pending: FilterValues) => void;
}

function parseSearchParams(): FilterValues {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const result: FilterValues = {};
  params.forEach((value, key) => {
    if (key.startsWith("f_")) {
      const filterKey = key.slice(2);
      if (value.includes(",")) {
        result[filterKey] = value.split(",");
      } else {
        result[filterKey] = value;
      }
    }
  });
  return result;
}

function writeSearchParams(filters: FilterValues): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);

  // Remove all existing filter params
  const keysToRemove: string[] = [];
  params.forEach((_v, k) => {
    if (k.startsWith("f_")) keysToRemove.push(k);
  });
  keysToRemove.forEach((k) => params.delete(k));

  // Set new filter params
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
      continue;
    }
    const paramValue = Array.isArray(value) ? value.join(",") : value;
    params.set(`f_${key}`, paramValue);
  }

  const newUrl = params.toString()
    ? `${window.location.pathname}?${params.toString()}`
    : window.location.pathname;
  window.history.replaceState(null, "", newUrl);
}

export function useAdvancedFilters(
  _filterConfig: FilterFieldConfig[],
): AdvancedFiltersState {
  const [filters, setFilters] = useState<FilterValues>(() => parseSearchParams());

  const setFilter = useCallback(
    (key: string, value: string | string[] | undefined) => {
      setFilters((prev) => {
        const next = { ...prev };
        if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
          delete next[key];
        } else {
          next[key] = value;
        }
        writeSearchParams(next);
        return next;
      });
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setFilters({});
    writeSearchParams({});
  }, []);

  const applyFilters = useCallback((pending: FilterValues) => {
    const cleaned: FilterValues = {};
    for (const [key, value] of Object.entries(pending)) {
      if (value !== undefined && value !== "" && !(Array.isArray(value) && value.length === 0)) {
        cleaned[key] = value;
      }
    }
    setFilters(cleaned);
    writeSearchParams(cleaned);
  }, []);

  const activeCount = useMemo(() => {
    return Object.values(filters).filter(
      (v) => v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0),
    ).length;
  }, [filters]);

  return { filters, setFilter, clearFilters, activeCount, applyFilters };
}
