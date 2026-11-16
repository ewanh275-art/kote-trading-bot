// src/app.jsx
import React, { useState, useEffect } from 'react';
import { fetchAndCacheTokens } from './services/tokenRegistry';

export default function App() {
  const [activeTab, setActiveTab] = useState('gramMemes');
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Load tokens on mount using our registry service (with localStorage & fallback support)
  const loadTokenData = async () => {
    setLoading(true);
    try {
      const data = await fetchAndCacheTokens();
      setTokens(data);
    } catch (err) {
      console.error('Error loading token registry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTokenData();
  }, []);

  const filteredTokens = tokens.filter(t => 
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between select-none">
      
      {/* Top Header */}
      <div className="p-4 flex flex-col items-center">
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-xl">🐱</span>
          <h1 className="font-bold text-base tracking-wide">Kote Trade Terminal</h1>
        </div>

        {/* Gram Memes Card Container */}
        {activeTab === 'gramMemes' && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 w-full max-w-md shadow-xl">
            
            {/* Card Header */}
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="font-bold text-xs tracking-wider text-emerald-400 flex items-center gap-1">
                  <span>🌕</span> GRAM MEMES DEX POOLS
                </h3>
                <p className="text-[10px] text-gray-400">Instant Load via LocalStorage & DeDust/STON.fi</p>
              </div>
              <button 
                onClick={loadTokenData}
                className="text-[11px] bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-xl text-emerald-300 font-medium hover:bg-emerald-900/60 transition"
              >
                🔄 Sync Now
              </button>
            </div>

            {/* DEX Filter Badges */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="flex items-center justify-center space-x-2 bg-emerald-950/30 border border-emerald-800/40 rounded-xl py-2 text-xs font-medium text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>DeDust Pools</span>
              </div>
              <div className="flex items-center justify-center space-x-2 bg-blue-950/30 border border-blue-800/40 rounded-xl py-2 text-xs font-medium text-blue-400">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>STON.fi Pools</span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-3">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 text-xs">🔍</span>
              <input
                type="text"
                placeholder="Search Meme Tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Token List / Loading State */}
            {loading ? (
              <div className="text-center py-6 text-xs text-gray-400 animate-pulse flex flex-col items-center gap-2">
                <span>🔄 Syncing live DeDust & STON.fi pools...</span>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {filteredTokens.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-500">No tokens found</div>
                ) : (
                  filteredTokens.map(token => (
                    <div 
                      key={token.address}
                      onClick={() => console.log('Selected token:', token)}
                      className="flex items-center justify-between p-2 rounded-xl bg-gray-950/60 hover:bg-gray-800/80 border border-gray-800/80 cursor-pointer transition"
                    >
                      <div className="flex items-center space-x-2.5">
                        <img 
                          src={token.image || 'https://via.placeholder.com/28'} 
                          alt={token.symbol} 
                          className="w-7 h-7 rounded-full bg-gray-800 object-cover border border-gray-700"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/28'; }}
                        />
                        <div>
                          <div className="font-bold text-xs text-white">{token.symbol}</div>
                          <div className="text-[10px] text-gray-400 truncate max-w-[130px]">{token.name}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[9px] uppercase px-2 py-0.5 rounded-lg bg-gray-900 text-gray-300 border border-gray-800 font-semibold">
                          {token.dex}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Placeholder for other tabs */}
        {activeTab !== 'gramMemes' && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-md text-center text-gray-400 text-xs mt-4">
            {activeTab.toUpperCase()} Module Active
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <div className="bg-gray-950 border-t border-gray-800/80 px-2 py-2 flex justify-around items-center text-[10px] text-gray-400">
        {[
          { id: 'trade', label: 'Trade', icon: '📊' },
          { id: 'sniper', label: 'Sniper', icon: '🎯' },
          { id: 'active', label: 'Active', icon: '⚡' },
          { id: 'topblast', label: 'Topblast', icon: '🔥' },
          { id: 'gramMemes', label: 'Gram Memes', icon: '🌕' },
          { id: 'profile', label: 'Profile', icon: '👤' },
          { id: 'moonpay', label: 'MoonPay', icon: '💳' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center space-y-0.5 px-1 py-1 transition ${
              activeTab === tab.id ? 'text-red-500 font-bold' : 'hover:text-white'
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

    </div>
  );
}
