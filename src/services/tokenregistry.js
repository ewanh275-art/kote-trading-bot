// src/services/tokenRegistry.js
const DEDUST_API_URL = 'https://api.dedust.io/v2/assets';
const STONFI_API_URL = 'https://api.ston.fi/v1/assets';
const STORAGE_KEY = 'kote_dex_token_registry_v1';

// Essential fallback tokens to guarantee tokens always display
const FALLBACK_TOKENS = [
  {
    address: 'TON',
    name: 'Toncoin',
    symbol: 'TON',
    decimals: 9,
    image: 'https://asset.ston.fi/img/TON.png',
    dex: 'native',
    verified: true
  },
  {
    address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    image: 'https://asset.ston.fi/img/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs.png',
    dex: 'both',
    verified: true
  },
  {
    address: 'EQB-MPwuxusWknM7H9N_6U1y59_h_M0nK7wD70t4Z4H6z30U',
    name: 'Jецца / STON',
    symbol: 'STON',
    decimals: 9,
    image: 'https://asset.ston.fi/img/STON.png',
    dex: 'stonfi',
    verified: true
  }
];

export async function fetchAndCacheTokens() {
  let dedustTokens = [];
  let stonfiTokens = [];

  // 1. Fetch from DeDust & STON.fi independently using allSettled so one failure doesn't break the other
  const results = await Promise.allSettled([
    fetch(DEDUST_API_URL).then(res => res.json()),
    fetch(STONFI_API_URL).then(res => res.json())
  ]);

  // Process DeDust
  if (results[0].status === 'fulfilled') {
    const dedustRaw = results[0].value;
    const assetsArray = Array.isArray(dedustRaw) ? dedustRaw : dedustRaw.assets || [];
    dedustTokens = assetsArray.map(token => ({
      address: token.address || (token.kind === 'native' ? 'TON' : null),
      name: token.name || 'Unknown Token',
      symbol: token.symbol || 'UNKNOWN',
      decimals: token.decimals ?? 9,
      image: token.image || token.imageUrl || '',
      dex: 'dedust',
      verified: !token.protocol
    })).filter(t => t.address);
  } else {
    console.warn('DeDust API fetch failed, using fallback/cache:', results[0].reason);
  }

  // Process STON.fi
  if (results[1].status === 'fulfilled') {
    const stonfiRaw = results[1].value;
    const assetsArray = stonfiRaw.asset_list || stonfiRaw.assets || stonfiRaw;
    if (Array.isArray(assetsArray)) {
      stonfiTokens = assetsArray.map(token => ({
        address: token.contract_address || token.address,
        name: token.display_name || token.name || 'Unknown Token',
        symbol: token.symbol || 'UNKNOWN',
        decimals: token.decimals ?? 9,
        image: token.image_url || token.image || '',
        dex: 'stonfi',
        verified: token.deprecated === false
      })).filter(t => t.address);
    }
  } else {
    console.warn('STON.fi API fetch failed, using fallback/cache:', results[1].reason);
  }

  // 2. Merge all tokens and de-duplicate by contract address
  const tokenMap = new Map();

  // Load fallbacks first
  FALLBACK_TOKENS.forEach(t => tokenMap.set(t.address, t));

  // Merge live fetched tokens
  [...dedustTokens, ...stonfiTokens].forEach(token => {
    if (!tokenMap.has(token.address)) {
      tokenMap.set(token.address, token);
    } else {
      const existing = tokenMap.get(token.address);
      existing.dex = 'both';
    }
  });

  const finalTokens = Array.from(tokenMap.values());

  const registryPayload = {
    tokens: finalTokens,
    updatedAt: Date.now()
  };

  // 3. Save to localStorage & Telegram CloudStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registryPayload));
    if (window.Telegram?.WebApp?.CloudStorage) {
      window.Telegram.WebApp.CloudStorage.setItem(STORAGE_KEY, JSON.stringify(registryPayload));
    }
  } catch (storageErr) {
    console.error('Storage save error:', storageErr);
  }

  console.log('Successfully loaded tokens count:', finalTokens.length);
  return finalTokens;
}
