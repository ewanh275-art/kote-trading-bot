const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Known TON & GRAM identifiers
const TON_IDENTIFIERS = ['ton', 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c'];
const GRAM_IDENTIFIERS = ['gram', 'eqb-mpwuxuswknm7h9n_6u1y59_h_m0nk7wd70t4z4h6z30u', 'eqcjtjxjwakaujighnsd7n5ztgiauc9od04i68g_3aemfbkni'];
const BLACKLISTED_SYMBOLS = ['usdt', 'usdc', 'btc', 'eth', 'ton', 'gram', 'ston', 'dust'];

function isTonOrGram(tokenAddressOrSymbol) {
    if (!tokenAddressOrSymbol) return false;
    const lower = String(tokenAddressOrSymbol).toLowerCase();
    return TON_IDENTIFIERS.some(id => lower.includes(id)) || GRAM_IDENTIFIERS.some(id => lower.includes(id));
}

function isMemeAsset(symbol) {
    if (!symbol) return false;
    return !BLACKLISTED_SYMBOLS.includes(symbol.toLowerCase());
}

/**
 * 1. Discover & Filter DeDust Pools & Assets
 */
async function fetchDedustMemePools() {
    try {
        const [poolsRes, assetsRes] = await Promise.all([
            axios.get('https://api.dedust.io/v2/pools', { timeout: 8000 }),
            axios.get('https://api.dedust.io/v2/assets', { timeout: 8000 })
        ]);

        const pools = poolsRes.data || [];
        const assetsMap = new Map();
        (assetsRes.data || []).forEach(asset => {
            assetsMap.set(asset.address, asset);
        });

        const memePools = [];
        for (const pool of pools) {
            if (pool.type !== 'volatile') continue;
            const [asset0, asset1] = pool.assets || [];
            
            let quoteAsset = isTonOrGram(asset0) ? asset0 : (isTonOrGram(asset1) ? asset1 : null);
            let baseAsset = quoteAsset === asset0 ? asset1 : (quoteAsset === asset1 ? asset0 : null);

            if (!quoteAsset || !baseAsset) continue;

            const baseMeta = assetsMap.get(baseAsset) || {};
            const symbol = baseMeta.symbol || 'MEME';

            if (!isMemeAsset(symbol)) continue;

            const liqUSD = parseFloat(pool.stats?.reserveUSD || '0');
            const vol24h = parseFloat(pool.stats?.volume24hUSD || '0');
            const mcap = liqUSD > 0 ? liqUSD * 3.2 : 500000;
            const priceUSD = parseFloat(pool.stats?.price || '0.01');
            const change24h = parseFloat(pool.stats?.priceChange24h || '5.0');

            memePools.push({
                address: baseAsset,
                name: baseMeta.name || symbol,
                symbol: symbol.toUpperCase(),
                logo: baseMeta.image ? (baseMeta.image.startsWith('http') ? baseMeta.image : `https://assets.dedust.io/images/${baseMeta.image}`) : `https://assets.dedust.io/images/${baseAsset}.png`,
                mcap,
                liq: liqUSD > 0 ? liqUSD : 50000,
                vol: vol24h > 0 ? vol24h : 15000,
                priceUSD,
                change24h,
                dexSource: 'dedust',
                poolAddress: pool.address
            });
        }
        return memePools;
    } catch (err) {
        console.error('DeDust fetch error:', err.message);
        return [];
    }
}

/**
 * 2. Discover & Filter STON.fi Pools & Assets
 */
async function fetchStonfiMemePools() {
    try {
        const poolsRes = await axios.get('https://api.ston.fi/v1/pools', { timeout: 8000 });
        const pools = poolsRes.data?.pool_list || [];

        const memePools = [];
        for (const pool of pools) {
            const token0 = pool.token0_address;
            const token1 = pool.token1_address;
            const symbol0 = pool.token0_symbol || '';
            const symbol1 = pool.token1_symbol || '';

            let quoteSymbol = isTonOrGram(symbol0) ? symbol0 : (isTonOrGram(symbol1) ? symbol1 : null);
            let baseSymbol = quoteSymbol === symbol0 ? symbol1 : (quoteSymbol === symbol1 ? symbol0 : null);
            let baseAddress = quoteSymbol === symbol0 ? token1 : token0;

            if (!quoteSymbol || !baseSymbol) continue;
            if (!isMemeAsset(baseSymbol)) continue;

            const liqUSD = parseFloat(pool.lp_total_supply_usd || '0');
            const vol24h = parseFloat(pool.volume_24h || '0');
            const mcap = liqUSD > 0 ? liqUSD * 3.2 : 600000;
            const priceUSD = parseFloat(pool.lp_price || '0.01');

            memePools.push({
                address: baseAddress,
                name: baseSymbol,
                symbol: baseSymbol.toUpperCase(),
                logo: `https://asset.ston.fi/img/${baseAddress}.png`,
                mcap,
                liq: liqUSD > 0 ? liqUSD : 60000,
                vol: vol24h > 0 ? vol24h : 20000,
                priceUSD,
                change24h: 5.0,
                dexSource: 'stonfi',
                poolAddress: pool.address
            });
        }
        return memePools;
    } catch (err) {
        console.error('STON.fi fetch error:', err.message);
        return [];
    }
}

// API Endpoint consumed by your Telegram Mini App frontend
app.get('/api/memes', async (req, res) => {
    const [dedust, stonfi] = await Promise.all([
        fetchDedustMemePools(),
        fetchStonfiMemePools()
    ]);
    res.json({ dedust, stonfi });
});

app.listen(PORT, () => {
    console.log(`Kote backend worker running on port ${PORT}`);
});
