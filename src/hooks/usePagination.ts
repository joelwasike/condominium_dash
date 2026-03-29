import { useState, useCallback } from 'react';

interface UsePaginationReturn {
  page: number;
  pageSize: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  setPageSize: React.Dispatch<React.SetStateAction<number>>;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (p: number) => void;
  queryString: string;
}

export function usePagination(initialPageSize: number = 20): UsePaginationReturn {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const nextPage = useCallback(() => setPage(p => p + 1), []);
  const prevPage = useCallback(() => setPage(p => Math.max(1, p - 1)), []);
  const goToPage = useCallback((p: number) => setPage(p), []);

  const queryString = `?page=${page}&pageSize=${pageSize}`;

  return { page, pageSize, setPage, setPageSize, nextPage, prevPage, goToPage, queryString };
}
