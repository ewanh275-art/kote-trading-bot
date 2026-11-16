import React, { useEffect } from 'react';
import { fetchAndCacheTokens } from './services/tokenRegistry';
import { TokenSelector } from './components/TokenSelector';

export default function App() {
  useEffect(() => {
    // Automatically trigger token sync when the mini app loads
    fetchAndCacheTokens().catch(err => console.error('Background token sync error:', err));
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-4 flex flex-col items-center justify-center">
      <h1 className="text-xl font-bold mb-4">Kote Trading Bot</h1>
      <TokenSelector onSelectToken={(token) => console.log('Selected token:', token)} />
    </div>
  );
}
