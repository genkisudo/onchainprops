#!/usr/bin/env node
/**
 * @file payouts.js
 * @description Fetches onchain payout stats for every firm wallet listed under
 * `payoutWallets` in firms.json and writes them to payouts.json. build.js then
 * renders them on the firm pages. Zero dependencies (Node 18+ global fetch).
 *
 *   ETHERSCAN_API_KEY=... node payouts.js
 *
 * Only the API key's owner calls Etherscan: visitors read the generated HTML.
 * A daily GitHub Action (.github/workflows/payouts.yml) runs this + build.js.
 *
 * Wallet entry in firms.json:
 *   "payoutWallets": [{
 *     "chainId": 1, "chain": "Ethereum",
 *     "address": "0x...", "token": "USDC",
 *     "tokenAddress": "0xa0b8...eb48", "decimals": 6,
 *     "exclude": ["0x..."]            // firm-owned addresses: not trader payouts
 *   }]
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const API = 'https://api.etherscan.io/v2/api';
const WINDOW_DAYS = 30;
const PAGE_SIZE = 1000;
const MAX_PAGES = 10; // Etherscan caps page * offset at 10,000
const KEY = process.env.ETHERSCAN_API_KEY;

if (!KEY) {
    console.error('ETHERSCAN_API_KEY is not set.');
    process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** One Etherscan V2 call, spaced and retried to stay under the free-plan rate limit (3/sec). */
const call = async (chainId, params) => {
    const qs = new URLSearchParams({ chainid: String(chainId), ...params, apikey: KEY });
    for (let attempt = 1; attempt <= 5; attempt++) {
        await sleep(400);
        const res = await fetch(`${API}?${qs}`);
        if (!res.ok) throw new Error(`Etherscan HTTP ${res.status}`);
        const body = await res.json();
        if (body.status === '1') return body.result;
        if (/no transactions found/i.test(body.message)) return [];
        if (/rate limit/i.test(String(body.result))) { await sleep(1000 * attempt); continue; }
        throw new Error(`Etherscan ${params.action}: ${body.message} — ${body.result}`);
    }
    throw new Error(`Etherscan ${params.action}: still rate limited after 5 attempts`);
};

/** All transfers of one token for a wallet since `startBlock`, newest first. */
const tokenTransfers = async (w, startBlock) => {
    const all = [];
    let endBlock = 999999999;
    for (;;) {
        let batch = [];
        for (let page = 1; page <= MAX_PAGES; page++) {
            const rows = await call(w.chainId, {
                module: 'account', action: 'tokentx', address: w.address,
                contractaddress: w.tokenAddress, startblock: String(startBlock),
                endblock: String(endBlock), sort: 'desc', page: String(page), offset: String(PAGE_SIZE)
            });
            batch = batch.concat(rows);
            if (rows.length < PAGE_SIZE) break;
        }
        if (batch.length < PAGE_SIZE * MAX_PAGES) return all.concat(batch);
        // Hit the 10k window cap. The API returns no log index to dedupe on, so drop the
        // (possibly partial) oldest block and refetch it whole in the next window.
        const oldest = Number(batch[batch.length - 1].blockNumber);
        if (oldest >= endBlock) throw new Error(`${w.address}: more than ${PAGE_SIZE * MAX_PAGES} transfers in block ${oldest}`);
        all.push(...batch.filter((t) => Number(t.blockNumber) > oldest));
        endBlock = oldest;
    }
};

const median = (xs) => {
    if (!xs.length) return 0;
    const s = [...xs].sort((a, b) => a - b);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const round2 = (n) => Math.round(n * 100) / 100;

const walletStats = async (w) => {
    const addr = w.address.toLowerCase();
    const exclude = new Set((w.exclude ?? []).map((a) => a.toLowerCase()));
    const since = Math.floor(Date.now() / 1000) - WINDOW_DAYS * 86400;
    const startBlock = await call(w.chainId, {
        module: 'block', action: 'getblocknobytime', timestamp: String(since), closest: 'after'
    });
    const rows = await tokenTransfers(w, startBlock);
    const scale = 10 ** w.decimals;
    const out = rows.filter((t) => t.from.toLowerCase() === addr && !exclude.has(t.to.toLowerCase()));
    const inc = rows.filter((t) => t.to.toLowerCase() === addr);
    const amounts = out.map((t) => Number(t.value) / scale);
    const largest = out.reduce((a, t) => (!a || BigInt(t.value) > BigInt(a.value) ? t : a), null);
    const balance = await call(w.chainId, {
        module: 'account', action: 'tokenbalance', contractaddress: w.tokenAddress, address: w.address, tag: 'latest'
    });
    return {
        chainId: w.chainId,
        chain: w.chain,
        address: w.address,
        token: w.token,
        windowDays: WINDOW_DAYS,
        paidOut: round2(amounts.reduce((a, b) => a + b, 0)),
        payoutCount: out.length,
        uniqueRecipients: new Set(out.map((t) => t.to.toLowerCase())).size,
        medianPayout: round2(median(amounts)),
        largestPayout: largest && {
            amount: round2(Number(largest.value) / scale),
            hash: largest.hash,
            date: new Date(Number(largest.timeStamp) * 1000).toISOString().slice(0, 10)
        },
        lastPayout: out[0] ? new Date(Number(out[0].timeStamp) * 1000).toISOString().slice(0, 10) : null,
        fundedIn: round2(inc.reduce((a, t) => a + Number(t.value) / scale, 0)),
        excludedTransfers: rows.filter((t) => t.from.toLowerCase() === addr && exclude.has(t.to.toLowerCase())).length,
        balance: round2(Number(balance) / scale)
    };
};

(async () => {
    const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'firms.json'), 'utf8'));
    const firms = [...(data.propFirms ?? []), ...(data.predictionMarketFirms ?? []), ...(data.cryptoPropFirms ?? [])];
    const result = { generatedAt: new Date().toISOString(), firms: {} };
    for (const f of firms) {
        for (const w of f.payoutWallets ?? []) {
            const s = await walletStats(w);
            (result.firms[f.name] ??= []).push(s);
            console.log(`${f.name} ${w.chain} ${w.token}: ${s.paidOut} paid to ${s.uniqueRecipients} wallets in ${s.payoutCount} transfers (${WINDOW_DAYS}d), balance ${s.balance}`);
        }
    }
    fs.writeFileSync(path.join(ROOT, 'payouts.json'), JSON.stringify(result, null, 2) + '\n');
    console.log('Wrote payouts.json');
})().catch((e) => {
    console.error(e.message);
    process.exit(1);
});
