import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'xero-favorite-reports';

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((v) => typeof v === 'string')) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

function saveFavorites(favorites: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
}

export function useFavoriteReports() {
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);

  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  const toggleFavorite = useCallback((url: string) => {
    setFavorites((prev) => {
      const idx = prev.indexOf(url);
      if (idx >= 0) {
        return prev.filter((_, i) => i !== idx);
      }
      return [...prev, url];
    });
  }, []);

  const isFavorite = useCallback(
    (url: string) => favorites.includes(url),
    [favorites],
  );

  return { favorites, toggleFavorite, isFavorite };
}
