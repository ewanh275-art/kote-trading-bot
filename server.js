const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const { spawn, execSync } = require('child_process');

const app = express();
app.use(cors());

// Serve static files directly from root directory
app.use(express.static(__dirname));

// Automatically install Python dependencies on startup (cleanly with no path warnings)
try {
    console.log("📦 Installing Python dependencies for bot.py...");
    execSync('pip3 install --break-system-packages --no-warn-script-location python-telegram-bot', { stdio: 'inherit' });
} catch (err) {
    console.error("⚠️ Pip install warning:", err);
}

// Automatically launch your Python Telegram bot in the background
const pythonBot = spawn('python3', ['bot.py']);

pythonBot.stdout.on('data', (data) => {
    console.log(`[Bot Output]: ${data}`);
});

// Stream stderr as info logs so normal Python INFO messages aren't falsely flagged as red errors
pythonBot.stderr.on('data', (data) => {
    console.log(`[Bot Info]: ${data}`);
});

pythonBot.on('close', (code) => {
    console.log(`[Bot Process exited with code ${code}]`);
});

const GRAM_MASTER_ADDRESS = "EQC47093oX5Xhb0xuk2lCr2RhS8rj-vul61u4W2UH5ORmG_O";
const NATIVE_TON_ADDRESS = "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c";
const STON_TON_WRAPPER = "EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA";

const EXCLUDED_SYMBOLS = new Set([
    "TON", "GRAM", "JUSDT", "USDT", "JUSDC", "USDC", "STTON", "TSTON", 
    "STD", "SCALE", "DUST", "WTON", "PTON", "JWBTC", "JWETH", "DAI", "USDE"
]);

const EXCLUDED_ADDRESSES = new Set([
    GRAM_MASTER_ADDRESS.toLowerCase(),
    NATIVE_TON_ADDRESS.toLowerCase(),
    STON_TON_WRAPPER.toLowerCase(),
    "eqaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaam9c".toLowerCase()
]);

let serverCache = {
    topblast: [],
    dedust: [],
    stonfi: [],
    lastUpdated: null
};

function isTonOrGram(addr) {
    if (!addr) return false;
    const al = addr.toLowerCase();
    return al === NATIVE_TON_ADDRESS.toLowerCase() || 
           al === STON_TON_WRAPPER.toLowerCase() || 
           al === GRAM_MASTER_ADDRESS.toLowerCase() ||
           al === "eqaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaam9c".toLowerCase();
}

async function runBackgroundWorker() {
    console.log("🔄 Running background worker to update DEX pools & DexScreener metrics...");
    try {
        const [dedustAssetsRes, dedustPoolsRes, stonfiAssetsRes, stonfiPoolsRes] = await Promise.all([
            fetch('https://assets.dedust.io/list.json').catch(() => fetch('https://api.dedust.io/v2/assets')),
            fetch('https://api.dedust.io/v2/pools'),
            fetch('https://api.ston.fi/v1/assets'),
            fetch('https://api.ston.fi/v1/pools')
        ]);

        const dedustAssets = await dedustAssetsRes.json();
        const dedustPools = await dedustPoolsRes.json();
        const stonfiAssets = await stonfiAssetsRes.json();
        const stonfiPools = await stonfiPoolsRes.json();

        const dedustAssetMap = new Map();
        (Array.isArray(dedustAssets) ? dedustAssets : (dedustAssets.assets || [])).forEach(a => {
            if (a && a.address) dedustAssetMap.set(a.address.toLowerCase(), { name: a.name || a.symbol || 'Jetton', symbol: a.symbol || 'MEME', image: a.image || a.logo || '' });
        });

        const dedustMemeAddresses = new Set();
        (Array.isArray(dedustPools) ? dedustPools : (dedustPools.pools || [])).forEach(pool => {
            const rawAssets = pool.assets || [];
            if (rawAssets.length < 2) return;
            const parseA = (ast) => typeof ast === 'string' ? (ast === 'native' ? 'native' : ast.replace('jetton:', '')) : ast?.address;
            const a0 = parseA(rawAssets[0]);
            const a1 = parseA(rawAssets[1]);
            if (!a0 || !a1) return;

            const a0IsQuote = a0 === 'native' || isTonOrGram(a0);
            const a1IsQuote = a1 === 'native' || isTonOrGram(a1);
            if (a0IsQuote === a1IsQuote) return;

            const base = a0IsQuote ? a1 : a0;
            if (base === 'native' || EXCLUDED_ADDRESSES.has(base.toLowerCase())) return;

            const meta = dedustAssetMap.get(base.toLowerCase());
            if (meta?.symbol && EXCLUDED_SYMBOLS.has(meta.symbol.toUpperCase())) return;

            dedustMemeAddresses.add(base);
        });

        const stonfiAssetMap = new Map();
        (stonfiAssets.asset_list || stonfiAssets || []).forEach(a => {
            const addr = a.contract_address || a.address;
            if (addr) stonfiAssetMap.set(addr.toLowerCase(), { name: a.display_name || a.name || 'STON.fi Jetton', symbol: a.symbol || 'MEME', image: a.image_url || a.image || '' });
        });

        const stonfiMemeAddresses = new Set();
        (stonfiPools.pool_list || stonfiPools || []).forEach(pool => {
            const t0 = pool.token0_address || pool.coin0_address;
            const t1 = pool.token1_address || pool.coin1_address;
            if (!t0 || !t1) return;

            const t0IsQuote = isTonOrGram(t0);
            const t1IsQuote = isTonOrGram(t1);
            if (t0IsQuote === t1IsQuote) return;

            const base = t0IsQuote ? t1 : t0;
            if (EXCLUDED_ADDRESSES.has(base.toLowerCase())) return;

            const meta = stonfiAssetMap.get(base.toLowerCase());
            if (meta?.symbol && EXCLUDED_SYMBOLS.has(meta.symbol.toUpperCase())) return;

            stonfiMemeAddresses.add(base);
        });

        async function enrichWithDexScreener(addresses, migrationDex) {
            const tokens = addresses.map(ca => {
                const map = migrationDex === 'dedust' ? dedustAssetMap : stonfiAssetMap;
                const meta = map.get(ca.toLowerCase());
                return {
                    name: meta?.name || 'Meme Token',
                    symbol: meta?.symbol || 'MEME',
                    address: ca,
                    poolAddress: ca,
                    logo: meta?.image || '',
                    mcap: 0, liq: 0, vol: 0, priceUSD: 0, change24h: 0,
                    graduated: true, migrationDex
                };
            });

            const addrs = Array.from(addresses);
            for (let i = 0; i < addrs.length; i += 30) {
                const chunk = addrs.slice(i, i + 30).join(',');
                if (!chunk) continue;
                try {
                    const dsRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${chunk}`);
                    if (!dsRes.ok) continue;
                    const text = await dsRes.text();
                    if (text.startsWith('<')) continue; // Skip HTML error/cloudflare pages
                    const dsData = JSON.parse(text);
                    const pairs = (dsData.pairs || []).filter(p => p.chainId === 'ton');

                    pairs.forEach(p => {
                        const baseAddr = p.baseToken?.address;
                        if (!baseAddr) return;
                        const match = tokens.find(t => t.address.toLowerCase() === baseAddr.toLowerCase());
                        if (match) {
                            match.name = p.baseToken?.name || match.name;
                            match.symbol = p.baseToken?.symbol || match.symbol;
                            match.poolAddress = p.pairAddress || match.poolAddress;
                            match.logo = match.logo || p.info?.imageUrl || p.baseToken?.logoURI || '';
                            match.mcap = p.marketCap || p.fdv || match.mcap;
                            match.liq = p.liquidity?.usd || match.liq;
                            match.vol = p.volume?.h24 || match.vol;
                            match.priceUSD = parseFloat(p.priceUsd) || match.priceUSD;
                            match.change24h = p.priceChange?.h24 || 0;
                        }
                    });
                } catch (e) { console.error("DexScreener chunk error:", e); }
            }
            tokens.sort((a, b) => b.mcap - a.mcap);
            return tokens;
        }

        const [dedustEnriched, stonfiEnriched] = await Promise.all([
            enrichWithDexScreener(Array.from(dedustMemeAddresses), 'dedust'),
            enrichWithDexScreener(Array.from(stonfiMemeAddresses), 'stonfi')
        ]);

        serverCache = {
            topblast: [],
            dedust: dedustEnriched,
            stonfi: stonfiEnriched,
            lastUpdated: new Date().toISOString()
        };

        console.log(`✅ Background Worker updated successfully: ${dedustEnriched.length} DeDust & ${stonfiEnriched.length} STON.fi memes cached.`);
    } catch (err) {
        console.error("Background worker error:", err);
    }
}

runBackgroundWorker();
setInterval(runBackgroundWorker, 10000);

app.get('/api/tokens', (req, res) => {
    res.json(serverCache);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Kote Trade Server running on port ${PORT}`);
});
