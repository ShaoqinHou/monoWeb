import { useState, useMemo } from 'react';

export interface UsePaginationOptions {
  defaultPage?: number;
  defaultPageSize?: number;
}

export interface UsePaginationResult<T> {
  page: number;
  pageSize: number;
  total: number;
  pageData: T[];
  onChange: (page: number, pageSize: number) => void;
}

/** Client-side pagination hook — slices an array by page/pageSize */
export function usePagination<T>(
  data: T[],
  options: UsePaginationOptions = {},
): UsePaginationResult<T> {
  const { defaultPage = 1, defaultPageSize = 25 } = options;
  const [page, setPage] = useState(defaultPage);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const total = data.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Clamp page to valid range
  const safePage = Math.min(Math.max(1, page), totalPages);

  const pageData = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, safePage, pageSize]);

  const onChange = (newPage: number, newPageSize: number) => {
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setPage(1); // Reset to page 1 on page size change
    } else {
      setPage(newPage);
    }
  };

  return { page: safePage, pageSize, total, pageData, onChange };
}
