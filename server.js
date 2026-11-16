const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 3000;

// Master Catalog of TON & GRAM Meme Tokens across DeDust & STON.fi
const MASTER_TOKENS = [
    { address: 'EQB-MPwuxusWknM7H9N_6U1y59_h_M0nK7wD70t4Z4H6z30U', name: 'Gram Memes Token', symbol: 'GRAM', logo: 'https://asset.ston.fi/img/EQB-MPwuxusWknM7H9N_6U1y59_h_M0nK7wD70t4Z4H6z30U.png', mcap: 1850000, liq: 620000, vol: 450000, priceUSD: 0.85, change24h: 12.4, dexSource: 'dedust', poolAddress: 'EQB-MPwuxusWknM7H9N_6U1y59_h_M0nK7wD70t4Z4H6z30U' },
    { address: 'EQBlqsm144Dq6SjbPI4jjZvA1hqTIP3CvHovbIfW_t-SCALE', name: 'Scale TON', symbol: 'SCALE', logo: 'https://assets.dedust.io/images/EQBlqsm144Dq6SjbPI4jjZvA1hqTIP3CvHovbIfW_t-SCALE.png', mcap: 840000, liq: 310000, vol: 195000, priceUSD: 0.14, change24h: 8.5, dexSource: 'dedust', poolAddress: 'EQBlqsm144Dq6SjbPI4jjZvA1hqTIP3CvHovbIfW_t-SCALE' },
    { address: 'EQA4g22tW9bBvH5N_6U1y59_h_M0nK7wD70t4Z4H6z30F', name: 'Fish Crypto', symbol: 'FISH', logo: 'https://asset.ston.fi/img/EQA4g22tW9bBvH5N_6U1y59_h_M0nK7wD70t4Z4H6z30F.png', mcap: 1450000, liq: 520000, vol: 320000, priceUSD: 0.042, change24h: -2.3, dexSource: 'dedust', poolAddress: 'EQA4g22tW9bBvH5N_6U1y59_h_M0nK7wD70t4Z4H6z30F' },
    { address: 'EQCGX_REDO_MEME_TOKEN_ADDRESS', name: 'Resistance Dog', symbol: 'REDO', logo: 'https://asset.ston.fi/img/EQCGX_REDO_MEME_TOKEN_ADDRESS.png', mcap: 3400000, liq: 1100000, vol: 720000, priceUSD: 0.34, change24h: 18.2, dexSource: 'dedust', poolAddress: 'EQCGX_REDO_MEME_TOKEN_ADDRESS' },
    { address: 'EQC_DUST_PROTOCOL_TOKEN', name: 'DeDust Protocol', symbol: 'DUST', logo: 'https://assets.dedust.io/images/EQD_v8Hv7X2d5_gK3Jp1q8s9t2u4v6w8x0y1z3A5B7C9D2E.png', mcap: 1087000, liq: 318000, vol: 195000, priceUSD: 0.31, change24h: 5.4, dexSource: 'dedust', poolAddress: 'EQC_DUST_PROTOCOL_TOKEN' },
    { address: 'EQC_UTYA_MEME_TOKEN', name: 'Utya Meme', symbol: 'UTYA', logo: 'https://asset.ston.fi/img/TON.png', mcap: 620000, liq: 180000, vol: 94000, priceUSD: 0.029, change24h: 11.1, dexSource: 'dedust', poolAddress: 'EQC_UTYA_MEME_TOKEN' },
    { address: 'EQCJTjXjWKaUjiGHnsd7N5ztGIAUC9od04i68G_3AEmFbknI', name: 'STON.fi Governance', symbol: 'STON', logo: 'https://asset.ston.fi/img/STON.png', mcap: 9200000, liq: 2800000, vol: 950000, priceUSD: 2.10, change24h: -1.5, dexSource: 'stonfi', poolAddress: 'EQCJTjXjWKaUjiGHnsd7N5ztGIAUC9od04i68G_3AEmFbknI' },
    { address: 'TON', name: 'Toncoin', symbol: 'TON', logo: 'https://asset.ston.fi/img/TON.png', mcap: 14200000000, liq: 45000000, vol: 12000000, priceUSD: 5.65, change24h: 4.2, dexSource: 'stonfi', poolAddress: 'TON' },
    { address: 'EQC_RIFT_TON_Stonfi', name: 'Rifty Meme', symbol: 'RIFT', logo: 'https://asset.ston.fi/img/TON.png', mcap: 1120000, liq: 380000, vol: 210000, priceUSD: 0.18, change24h: 22.0, dexSource: 'stonfi', poolAddress: 'EQC_RIFT_TON_Stonfi' },
    { address: 'EQC_YODA_TON_Stonfi', name: 'Baby Yoda', symbol: 'YODA', logo: 'https://asset.ston.fi/img/TON.png', mcap: 950000, liq: 290000, vol: 165000, priceUSD: 0.075, change24h: -4.1, dexSource: 'stonfi', poolAddress: 'EQC_YODA_TON_Stonfi' },
    { address: 'EQC_ANDY_TON_Stonfi', name: 'Andy Token', symbol: 'ANDY', logo: 'https://asset.ston.fi/img/TON.png', mcap: 2400000, liq: 850000, vol: 510000, priceUSD: 0.22, change24h: 9.3, dexSource: 'stonfi', poolAddress: 'EQC_ANDY_TON_Stonfi' },
    { address: 'EQC_GROYP_TON_Stonfi', name: 'Groyper', symbol: 'GROYP', logo: 'https://asset.ston.fi/img/TON.png', mcap: 580000, liq: 190000, vol: 92000, priceUSD: 0.019, change24h: 14.7, dexSource: 'stonfi', poolAddress: 'EQC_GROYP_TON_Stonfi' },
    { address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', name: 'Tether USD', symbol: 'USDT', logo: 'https://asset.ston.fi/img/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs.png', mcap: 50000000, liq: 15000000, vol: 8000000, priceUSD: 1.00, change24h: 0.1, dexSource: 'stonfi', poolAddress: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs' }
];

// Automatically generate additional active tokens for full multi-page lists
for (let i = 1; i <= 50; i++) {
    MASTER_TOKENS.push({
        address: `EQ_TOKEN_HASH_${i}`,
        name: `Gram Meme #${i}`,
        symbol: `MEME${i}`,
        logo: `https://asset.ston.fi/img/TON.png`,
        mcap: 120000 + (i * 30000),
        liq: 40000 + (i * 9000),
        vol: 15000 + (i * 6000),
        priceUSD: 0.002 + (i * 0.0008),
        change24h: (i % 2 === 0 ? 1 : -1) * (4 + (i % 18)),
        dexSource: i % 2 === 0 ? 'dedust' : 'stonfi',
        poolAddress: `EQ_POOL_${i}`
    });
}

app.get('/api/memes', (req, res) => {
    const dedust = MASTER_TOKENS.filter(t => t.dexSource === 'dedust');
    const stonfi = MASTER_TOKENS.filter(t => t.dexSource === 'stonfi');
    res.json({ dedust, stonfi });
});

app.listen(PORT, () => {
    console.log(`Kote Trade Server running on port ${PORT}`);
});
