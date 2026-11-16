// src/services/tokenRegistry.js
const DEDUST_API_URL = 'https://api.dedust.io/v2/assets';
const STONFI_API_URL = 'https://api.ston.fi/v1/assets';
const STORAGE_KEY = 'kote_dex_token_registry_v1';

export async function fetchAndCacheTokens() {
  try {
    // 1. Fetch live assets from both DEX endpoints in parallel
    const [dedustRes, stonfiRes] = await Promise.all([
      fetch(DEDUST_API_URL),
      fetch(STONFI_API_URL)
    ]);

    const dedustRaw = await dedustRes.json();
    const stonfiRaw = await stonfiRes.json();

    // 2. Normalize DeDust assets array
    const dedustTokens = (Array.isArray(dedustRaw) ? dedustRaw : dedustRaw.assets || []).map(token => ({
      address: token.address || (token.kind === 'native' ? 'TON' : null),
      name: token.name || 'Unknown Token',
      symbol: token.symbol || 'UNKNOWN',
      decimals: token.decimals ?? 9,
      image: token.image || token.imageUrl || '',
      dex: 'dedust',
      verified: !token.protocol
    })).filter(t => t.address);

    // 3. Normalize STON.fi assets array
    const stonfiAssets = stonfiRaw.asset_list || stonfiRaw.assets || stonfiRaw;
    const stonfiTokens = (Array.isArray(stonfiAssets) ? stonfiAssets : []).map(token => ({
      address: token.contract_address || token.address,
      name: token.display_name || token.name || 'Unknown Token',
      symbol: token.symbol || 'UNKNOWN',
      decimals: token.decimals ?? 9,
      image: token.image_url || token.image || '',
      dex: 'stonfi',
      verified: token.deprecated === false
    })).filter(t => t.address);

    // 4. Merge lists and de-duplicate by master contract address
    const tokenMap = new Map();
    
    // Always insert native TON first as the base asset
    tokenMap.set('TON', {
      address: 'TON',
      name: 'Toncoin',
      symbol: 'TON',
      decimals: 9,
      image: 'https://asset.ston.fi/img/TON.png',
      dex: 'native',
      verified: true
    });

    [...dedustTokens, ...stonfiTokens].forEach(token => {
      if (!tokenMap.has(token.address)) {
        tokenMap.set(token.address, token);
      } else {
        // If available on both DEXes, update tag to 'both'
        const existing = tokenMap.get(token.address);
        existing.dex = 'both';
      }
    });

    const registryPayload = {
      tokens: Array.from(tokenMap.values()),
      updatedAt: Date.now()
    };

    // 5. Persist to browser localStorage and Telegram CloudStorage (if in Mini App)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registryPayload));
    
    if (window.Telegram?.WebApp?.CloudStorage) {
      window.Telegram.WebApp.CloudStorage.setItem(STORAGE_KEY, JSON.stringify(registryPayload), (err) => {
        if (err) console.error('Failed to save to Telegram CloudStorage:', err);
      });
    }

    return registryPayload.tokens;
  } catch (error) {
    console.error('Failed to sync DEX token registries:', error);
    
    // Fallback to local cache if offline or network fails
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached).tokens;
      } catch (parseErr) {
        console.error('Failed to parse cached tokens:', parseErr);
      }
    }
    return [];
  }
}
