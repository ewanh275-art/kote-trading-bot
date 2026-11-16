const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// TON & GRAM identifiers
const TON_IDS = ['ton', 'eqaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaam9c'];
const GRAM_IDS = ['gram', 'eqb-mpwuxuswknm7h9n_6u1y59_h_m0nk7wd70t4z4h6z30u', 'eqcjtjxjwakaujighnsd7n5ztgiauc9od04i68g_3aemfbkni'];

function isTonOrGram(addrOrSymbol) {
    if (!addrOrSymbol) return false;
    const lower = String(addrOrSymbol).toLowerCase();
    return TON_IDS.some(id => lower.includes(id)) || GRAM_IDS.some(id => lower.includes(id));
}

// Fetch all DeDust Pools paired with TON or GRAM
async function fetchDedustMemePools() {
    try {
        const [poolsRes, assetsRes] = await Promise.all([
            axios.get('https://api.dedust.io/v2/pools', { timeout: 10000 }),
            axios.get('https://api.dedust.io/v2/assets', { timeout: 10000 })
        ]);

        const pools = poolsRes.data || [];
        const assetsMap = new Map();
        (assetsRes.data || []).forEach(a => assetsMap.set(a.address, a));

        const memePools = [];
        for (const pool of pools) {
            const [asset0, asset1] = pool.assets || [];
            let quote = isTonOrGram(asset0) ? asset0 : (isTonOrGram(asset1) ? asset1 : null);
            let base = quote === asset0 ? asset1 : (quote === asset1 ? asset0 : null);

            if (!quote || !base) continue;

            const baseMeta = assetsMap.get(base) || {};
            const symbol = baseMeta.symbol || 'MEME';

            const liqUSD = parseFloat(pool.stats?.reserveUSD || '0');
            const vol24h = parseFloat(pool.stats?.volume24hUSD || '0');
            const priceUSD = parseFloat(pool.stats?.price || '0.001');
            const change24h = parseFloat(pool.stats?.priceChange24h || '0');
            const mcap = liqUSD > 0 ? liqUSD * 3.2 : 100000;

            memePools.push({
                address: base,
                name: baseMeta.name || symbol,
                symbol: symbol.toUpperCase(),
                logo: baseMeta.image ? (baseMeta.image.startsWith('http') ? baseMeta.image : `https://assets.dedust.io/images/${baseMeta.image}`) : `https://assets.dedust.io/images/${base}.png`,
                mcap,
                liq: liqUSD,
                vol: vol24h,
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

// Fetch all STON.fi Pools paired with TON or GRAM
async function fetchStonfiMemePools() {
    try {
        const poolsRes = await axios.get('https://api.ston.fi/v1/pools', { timeout: 10000 });
        const pools = poolsRes.data?.pool_list || [];

        const memePools = [];
        for (const pool of pools) {
            const token0 = pool.token0_address;
            const token1 = pool.token1_address;
            const symbol0 = pool.token0_symbol || '';
            const symbol1 = pool.token1_symbol || '';

            let quote = isTonOrGram(symbol0) ? symbol0 : (isTonOrGram(symbol1) ? symbol1 : null);
            let baseSymbol = quote === symbol0 ? symbol1 : (quote === symbol1 ? symbol0 : token0);
            let baseAddress = quote === symbol0 ? token1 : token0;

            if (!quote || !baseSymbol) continue;

            const liqUSD = parseFloat(pool.lp_total_supply_usd || '0');
            const vol24h = parseFloat(pool.volume_24h || '0');
            const priceUSD = parseFloat(pool.lp_price || '0.001');
            const mcap = liqUSD > 0 ? liqUSD * 3.2 : 120000;

            memePools.push({
                address: baseAddress,
                name: baseSymbol,
                symbol: String(baseSymbol).toUpperCase(),
                logo: `https://asset.ston.fi/img/${baseAddress}.png`,
                mcap,
                liq: liqUSD,
                vol: vol24h,
                priceUSD,
                change24h: 0,
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
