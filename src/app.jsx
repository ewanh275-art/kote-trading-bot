// src/app.jsx
import React, { useState, useEffect } from 'react';
import { fetchAndCacheTokens } from './services/tokenRegistry';
import { TokenSelector } from './components/TokenSelector';

export default function App() {
  const [selectedToken, setSelectedToken] = useState(null);

  useEffect(() => {
    // Automatically trigger token sync when the mini app loads
    fetchAndCacheTokens().catch(err => console.error('Background token sync error:', err));
  }, []);

  const handleTokenSelect = (token) => {
    setSelectedToken(token);
    console.log('Active trading token selected:', token.symbol, token.address);
    // You can pass this token address into your DeDust / STON.fi swap router logic here
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 flex flex-col items-center justify-center">
      <h1 className="text-xl font-bold mb-2">Kote Trading Bot</h1>
      
      {selectedToken && (
        <div className="mb-4 text-xs text-blue-400 bg-blue-950/40 border border-blue-800/50 px-3 py-1.5 rounded-lg">
          Active: <span className="font-semibold text-white">{selectedToken.symbol}</span> ({selectedToken.address})
        </div>
      )}

      <TokenSelector 
        onSelectToken={handleTokenSelect} 
        selectedTokenAddress={selectedToken?.address} 
      />
    </div>
  );
}
