// src/hooks/useTokenRegistry.js
import { useState, useEffect } from 'react';
import { fetchAndCacheTokens } from '../services/tokenRegistry';

export function useTokenRegistry() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reloadTokens = async () => {
    try {
      setLoading(true);
      const list = await fetchAndCacheTokens();
      setTokens(list);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadTokens();
  }, []);

  return { tokens, loading, error, refresh: reloadTokens };
}
