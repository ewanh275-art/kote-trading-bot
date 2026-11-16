// src/components/TokenSelector.jsx
import React, { useState } from 'react';
import { useTokenRegistry } from '../hooks/useTokenRegistry';

export function TokenSelector({ onSelectToken, selectedTokenAddress }) {
  const { tokens, loading, error, refresh } = useTokenRegistry();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tokens safely by name, symbol, or contract address
  const filteredTokens = tokens.filter(token => {
    const query = searchQuery.toLowerCase();
    return (
      token.name?.toLowerCase().includes(query) ||
      token.symbol?.toLowerCase().includes(query) ||
      token.address?.toLowerCase().includes(query)
    );
  });

  if (loading && tokens.length === 0) {
    return <div className="p-4 text-center text-gray-400">Loading DEX token pools...</div>;
  }

  if (error && tokens.length === 0) {
    return (
      <div className="p-4 text-center text-red-400">
        <p>Failed to load token list.</p>
        <button onClick={refresh} className="mt-2 px-3 py-1 bg-blue-600 rounded text-white">Retry</button>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 max-w-md w-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white font-semibold">Select Token</h3>
        <button onClick={refresh} className="text-xs text-blue-400 hover:underline">Sync APIs</button>
      </div>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search name, symbol, or address..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm mb-3 focus:outline-none focus:border-blue-500"
      />

      {/* Token List */}
      <div className="max-h-60 overflow-y-auto space-y-1">
        {filteredTokens.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">No tokens found</div>
        ) : (
          filteredTokens.map(token => (
            <div
              key={token.address}
              onClick={() => onSelectToken(token)}
              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                selectedTokenAddress === token.address ? 'bg-blue-600/20 border border-blue-500/50' : 'hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center space-x-3">
                <img
                  src={token.image || 'https://via.placeholder.com/24'}
                  alt={token.symbol}
                  className="w-7 h-7 rounded-full bg-gray-700 object-cover"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/24'; }}
                />
                <div>
                  <div className="text-white font-medium text-sm">{token.symbol}</div>
                  <div className="text-gray-400 text-xs">{token.name}</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold bg-gray-800 text-gray-300 border border-gray-700">
                  {token.dex}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
