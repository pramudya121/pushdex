import { useState, useEffect, useCallback } from 'react';

interface FavoriteToken {
  address: string;
  symbol: string;
  name: string;
}

interface FavoritePool {
  pairAddress: string;
  token0Symbol: string;
  token1Symbol: string;
}

const FAVORITES_STORAGE_KEY = 'pushdex_favorites';

export function useFavorites() {
  const [favoriteTokens, setFavoriteTokens] = useState<FavoriteToken[]>([]);
  const [favoritePools, setFavoritePools] = useState<FavoritePool[]>([]);

  // Load favorites from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setFavoriteTokens(parsed.tokens || []);
        setFavoritePools(parsed.pools || []);
      } catch (e) {
        console.error('Failed to parse favorites:', e);
      }
    }
  }, []);

  // Save favorites to localStorage
  const saveFavorites = useCallback((tokens: FavoriteToken[], pools: FavoritePool[]) => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify({ tokens, pools }));
  }, []);

  const addFavoriteToken = useCallback((token: FavoriteToken) => {
    setFavoriteTokens(prev => {
      if (prev.some(t => t.address.toLowerCase() === token.address.toLowerCase())) {
        return prev;
      }
      const updated = [...prev, token];
      saveFavorites(updated, favoritePools);
      return updated;
    });
  }, [favoritePools, saveFavorites]);

  const removeFavoriteToken = useCallback((address: string) => {
    setFavoriteTokens(prev => {
      const updated = prev.filter(t => t.address.toLowerCase() !== address.toLowerCase());
      saveFavorites(updated, favoritePools);
      return updated;
    });
  }, [favoritePools, saveFavorites]);

  const isFavoriteToken = useCallback((address: string) => {
    return favoriteTokens.some(t => t.address.toLowerCase() === address.toLowerCase());
  }, [favoriteTokens]);

  const addFavoritePool = useCallback((pool: FavoritePool) => {
    setFavoritePools(prev => {
      if (prev.some(p => p.pairAddress.toLowerCase() === pool.pairAddress.toLowerCase())) {
        return prev;
      }
      const updated = [...prev, pool];
      saveFavorites(favoriteTokens, updated);
      return updated;
    });
  }, [favoriteTokens, saveFavorites]);

  const removeFavoritePool = useCallback((pairAddress: string) => {
    setFavoritePools(prev => {
      const updated = prev.filter(p => p.pairAddress.toLowerCase() !== pairAddress.toLowerCase());
      saveFavorites(favoriteTokens, updated);
      return updated;
    });
  }, [favoriteTokens, saveFavorites]);

  const isFavoritePool = useCallback((pairAddress: string) => {
    return favoritePools.some(p => p.pairAddress.toLowerCase() === pairAddress.toLowerCase());
  }, [favoritePools]);

  const toggleFavoriteToken = useCallback((token: FavoriteToken) => {
    if (isFavoriteToken(token.address)) {
      removeFavoriteToken(token.address);
    } else {
      addFavoriteToken(token);
    }
  }, [isFavoriteToken, removeFavoriteToken, addFavoriteToken]);

  const toggleFavoritePool = useCallback((pool: FavoritePool) => {
    if (isFavoritePool(pool.pairAddress)) {
      removeFavoritePool(pool.pairAddress);
    } else {
      addFavoritePool(pool);
    }
  }, [isFavoritePool, removeFavoritePool, addFavoritePool]);

  return {
    favoriteTokens,
    favoritePools,
    addFavoriteToken,
    removeFavoriteToken,
    isFavoriteToken,
    toggleFavoriteToken,
    addFavoritePool,
    removeFavoritePool,
    isFavoritePool,
    toggleFavoritePool,
  };
}
