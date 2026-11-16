// Add inside your top-level initialization useEffect in App.jsx
import { useEffect } from 'react';
import { fetchAndCacheTokens } from './services/tokenRegistry';

useEffect(() => {
  // Trigger background token sync on mini app open
  fetchAndCacheTokens().catch(err => console.error('Background token sync error:', err));
}, []);
