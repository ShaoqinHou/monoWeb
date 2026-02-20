import { useState, useCallback, useEffect, useRef } from 'react';
import { apiFetch } from './api-helpers';

export interface SearchResult {
  id: string;
  type: 'contact' | 'invoice' | 'bill' | 'quote' | 'credit-note' | 'account';
  title: string;
  subtitle: string;
  href: string;
}

export interface UseGlobalSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  results: SearchResult[];
  isLoading: boolean;
  recentSearches: string[];
  clearRecent: () => void;
}

const STORAGE_KEY = 'xero-recent-searches';
const MAX_RECENT = 5;
const DEBOUNCE_MS = 200;
const MIN_QUERY_LENGTH = 2;

function loadRecent(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as string[];
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

function saveRecent(searches: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
}

function addToRecent(query: string, current: string[]): string[] {
  const filtered = current.filter((s) => s !== query);
  const updated = [query, ...filtered].slice(0, MAX_RECENT);
  return updated;
}

interface ContactApiItem {
  id: string;
  name: string;
  type?: string;
}

interface InvoiceApiItem {
  id: string;
  number: string;
  total?: number;
  status?: string;
}

interface BillApiItem {
  id: string;
  number?: string;
  reference?: string;
  total?: number;
  status?: string;
}

function mapContacts(items: ContactApiItem[]): SearchResult[] {
  return items.map((c) => ({
    id: c.id,
    type: 'contact' as const,
    title: c.name,
    subtitle: c.type || 'Contact',
    href: `/contacts/${c.id}`,
  }));
}

function mapInvoices(items: InvoiceApiItem[]): SearchResult[] {
  return items.map((inv) => ({
    id: inv.id,
    type: 'invoice' as const,
    title: inv.number || `INV-${inv.id}`,
    subtitle: inv.total != null ? `$${inv.total.toLocaleString()} - ${inv.status || 'Draft'}` : inv.status || 'Draft',
    href: `/sales/invoices/${inv.id}`,
  }));
}

function mapBills(items: BillApiItem[]): SearchResult[] {
  return items.map((b) => ({
    id: b.id,
    type: 'bill' as const,
    title: b.number || b.reference || `BILL-${b.id}`,
    subtitle: b.total != null ? `$${b.total.toLocaleString()} - ${b.status || 'Unpaid'}` : b.status || 'Unpaid',
    href: `/purchases/bills/${b.id}`,
  }));
}

async function executeSearch(query: string): Promise<SearchResult[]> {
  const searchParam = encodeURIComponent(query);

  const [contacts, invoices, bills] = await Promise.all([
    apiFetch<ContactApiItem[]>(`/contacts?search=${searchParam}`).catch(() => [] as ContactApiItem[]),
    apiFetch<InvoiceApiItem[]>(`/invoices?search=${searchParam}`).catch(() => [] as InvoiceApiItem[]),
    apiFetch<BillApiItem[]>(`/bills?search=${searchParam}`).catch(() => [] as BillApiItem[]),
  ]);

  return [
    ...mapContacts(contacts),
    ...mapInvoices(invoices),
    ...mapBills(bills),
  ];
}

export function useGlobalSearch(): UseGlobalSearchReturn {
  const [query, setQueryRaw] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(loadRecent);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setQuery = useCallback((q: string) => {
    setQueryRaw(q);
  }, []);

  const clearRecent = useCallback(() => {
    setRecentSearches([]);
    saveRecent([]);
  }, []);

  // Debounce: update debouncedQuery after DEBOUNCE_MS
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < MIN_QUERY_LENGTH) {
      setDebouncedQuery('');
      setResults([]);
      setIsLoading(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  // Execute search when debouncedQuery changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < MIN_QUERY_LENGTH) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    // Save to recent searches
    const updated = addToRecent(debouncedQuery, loadRecent());
    saveRecent(updated);
    setRecentSearches(updated);

    executeSearch(debouncedQuery).then((merged) => {
      if (!cancelled) {
        setResults(merged);
        setIsLoading(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  return {
    query,
    setQuery,
    results,
    isLoading,
    recentSearches,
    clearRecent,
  };
}
