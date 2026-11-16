const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Flexible check for TON and GRAM across identifiers
function isTonOrGram(addressOrSymbol) {
    if (!addressOrSymbol) return false;
    const s = String(addressOrSymbol).toLowerCase();
    return s === 'native' || 
           s.includes('ton') || 
           s.includes('gram') || 
           s.includes('eqaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaam9c') || 
           s.includes('eqb-mpwuxuswknm7h9n_6u1y59_h_m0nk7wd70t4z4h6z30u') ||
           s.includes('eqcjtjxjwakaujighnsd7n5ztgiauc9od04i68g_3aemfbkni');
}

// Fetch all DeDust Pools paired with TON or GRAM
async function fetchDedustMemePools() {
    try {
        const [poolsRes, assetsRes] = await Promise.all([
            axios.get('https://api.dedust.io/v2/pools', { timeout: 15000 }),
            axios.get('https://api.dedust.io/v2/assets', { timeout: 15000 })
        ]);

        const pools = poolsRes.data || [];
        const assetsMap = new Map();
        (assetsRes.data || []).forEach(a => {
            if (a && a.address) assetsMap.set(a.address, a);
        });

        const memePools = [];
        for (const pool of pools) {
            const assets = pool.assets || [];
            if (assets.length < 2) continue;
            const [asset0, asset1] = assets;

            const meta0 = assetsMap.get(asset0) || {};
            const meta1 = assetsMap.get(asset1) || {};

            const is0TonGram = isTonOrGram(asset0) || isTonOrGram(meta0.symbol) || isTonOrGram(meta0.name);
            const is1TonGram = isTonOrGram(asset1) || isTonOrGram(meta1.symbol) || isTonOrGram(meta1.name);

            let quote = is0TonGram ? asset0 : (is1TonGram ? asset1 : null);
            let base = quote === asset0 ? asset1 : (quote === asset1 ? asset0 : null);

            if (!base) continue;

            const baseMeta = assetsMap.get(base) || {};
            const symbol = baseMeta.symbol || 'MEME';
            const name = baseMeta.name || symbol;

            const liqUSD = parseFloat(pool.stats?.reserveUSD || '1000');
            const vol24h = parseFloat(pool.stats?.volume24hUSD || '100');
            const priceUSD = parseFloat(pool.stats?.price || '0.001');
            const change24h = parseFloat(pool.stats?.priceChange24h || '0');
            const mcap = liqUSD > 0 ? liqUSD * 3.2 : 50000;

            let logo = '';
            if (baseMeta.image) {
                logo = baseMeta.image.startsWith('http') ? baseMeta.image : `https://assets.dedust.io/images/${baseMeta.image}`;
            } else {
                logo = `https://assets.dedust.io/images/${base}.png`;
            }

            memePools.push({
                address: base,
                name: name,
                symbol: String(symbol).toUpperCase(),
                logo: logo,
                mcap: mcap,
                liq: liqUSD,
                vol: vol24h,
                priceUSD: priceUSD,
                change24h: change24h,
                dexSource: 'dedust',
                poolAddress: pool.address || base
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
        const poolsRes = await axios.get('https://api.ston.fi/v1/pools', { timeout: 15000 });
        const pools = poolsRes.data?.pool_list || [];

        const memePools = [];
        for (const pool of pools) {
            const token0 = pool.token0_address;
            const token1 = pool.token1_address;
            const symbol0 = pool.token0_symbol || '';
            const symbol1 = pool.token1_symbol || '';

            const is0TonGram = isTonOrGram(token0) || isTonOrGram(symbol0);
            const is1TonGram = isTonOrGram(token1) || isTonOrGram(symbol1);

            let quote = is0TonGram ? token0 : (is1TonGram ? token1 : null);
            let baseAddress = quote === token0 ? token1 : token0;
            let baseSymbol = quote === token0 ? symbol1 : symbol0;

            if (!baseAddress) continue;

            const liqUSD = parseFloat(pool.lp_total_supply_usd || '1000');
            const vol24h = parseFloat(pool.volume_24h || '100');
            const priceUSD = parseFloat(pool.lp_price || '0.001');
            const mcap = liqUSD > 0 ? liqUSD * 3.2 : 50000;

            memePools.push({
                address: baseAddress,
                name: baseSymbol || 'MEME',
                symbol: String(baseSymbol || 'MEME').toUpperCase(),
                logo: `https://asset.ston.fi/img/${baseAddress}.png`,
                mcap: mcap,
                liq: liqUSD,
                vol: vol24h,
                priceUSD: priceUSD,
                change24h: 0,
                dexSource: 'stonfi',
                poolAddress: pool.address || baseAddress
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
