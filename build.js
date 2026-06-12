#!/usr/bin/env node
/**
 * @file build.js
 * @description Regenerates all derived site content from firms.json + faq.json,
 * the single source of truth for firm data.
 *
 * Generated targets:
 *   - index.html  — meta description/keywords, og/twitter descriptions,
 *                   CollectionPage/ItemList/FAQPage JSON-LD, update badge,
 *                   noscript fallback tables, visible FAQ accordions
 *   - script.js   — AppState.propFirms / predictionMarketFirms arrays
 *   - llms.txt    — fully regenerated
 *   - sitemap.xml — fully regenerated (lastmod = firms.json lastUpdated)
 *
 * Generated regions are delimited by marker comments:
 *   HTML:  <!-- GEN:BEGIN key --> ... <!-- GEN:END key -->
 *   JS:    // GEN:BEGIN key ... // GEN:END key
 * Never hand-edit content inside markers — edit firms.json/faq.json and
 * run `node build.js` (CI runs it automatically on push).
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const write = (f, s) => fs.writeFileSync(path.join(ROOT, f), s);

const { lastUpdated, propFirms, predictionMarketFirms } = JSON.parse(read('firms.json'));
const faqs = JSON.parse(read('faq.json'));

// -----------------------------------------
// Helpers
// -----------------------------------------
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
const monthYear = (() => {
    const [y, m] = lastUpdated.split('-').map(Number);
    return `${MONTHS[m - 1]} ${y}`;
})();
const year = lastUpdated.slice(0, 4);

/** "80%" → {max:80, upTo:false}; "Up to 90%" → {max:90, upTo:true}; "TBC" → null */
const parseSplit = (s) => {
    const m = /([\d.]+)\s*%/.exec(s);
    return m ? { max: Number(m[1]), upTo: /up to/i.test(s) } : null;
};
/** "$200,000" → 200000; "Scaled"/"TBC" → null */
const parseMoney = (s) => {
    const m = /\$([\d,]+)/.exec(s);
    return m ? Number(m[1].replace(/,/g, '')) : null;
};
const fmtMoney = (n) => '$' + n.toLocaleString('en-US');
const shortMoney = (n) => (n >= 1000 ? `$${n / 1000}K` : `$${n}`);
const lcFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const an = (n) => (String(n).startsWith('8') ? 'an' : 'a');
const stripTags = (s) => s.replace(/<[^>]+>/g, '');
const escAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const publicUrl = (f) => f.publicUrl ?? f.website;
const displayDomain = (f) =>
    new URL(publicUrl(f)).hostname.replace(/^(www|app|waitlist)\./, '');

const joinNames = (arr) =>
    arr.length <= 1 ? (arr[0] ?? '')
    : arr.length === 2 ? `${arr[0]} and ${arr[1]}`
    : `${arr.slice(0, -1).join(', ')}, and ${arr[arr.length - 1]}`;

// -----------------------------------------
// Derived facts
// -----------------------------------------
/** Distinct split tiers, highest first; TBC tiers excluded from `ranked`. */
const splitGroups = (() => {
    const map = new Map();
    for (const f of propFirms) {
        if (!map.has(f.split)) map.set(f.split, { split: f.split, parsed: parseSplit(f.split), names: [] });
        map.get(f.split).names.push(f.name);
    }
    return [...map.values()].sort((a, b) => (b.parsed?.max ?? -1) - (a.parsed?.max ?? -1));
})();
const ranked = splitGroups.filter((g) => g.parsed);
const tbc = splitGroups.filter((g) => !g.parsed);
const splitPhrase = (g) => (g.parsed.upTo ? `up to ${g.parsed.max}%` : `${g.parsed.max}%`);

const maxLeaders = (() => {
    let amount = 0, names = [];
    for (const f of propFirms) {
        const v = parseMoney(f.maxAccount);
        if (v === null) continue;
        if (v > amount) { amount = v; names = [f.name]; }
        else if (v === amount) names.push(f.name);
    }
    return { amount, names };
})();
const scaledFirms = propFirms.filter((f) => /scaled/i.test(f.maxAccount)).map((f) => f.name);

const hlLive = propFirms.filter((f) => f.chain === 'Hyperliquid');
const hlSoon = propFirms.filter((f) => /hyperliquid \(soon\)/i.test(f.chain));
const nonHl = propFirms.filter((f) => !/hyperliquid/i.test(f.chain));

// -----------------------------------------
// Dynamic FAQ answers
// -----------------------------------------
const highestSplitAnswer = () => {
    const top = ranked[0];
    const parts = [];
    parts.push(
        `As of ${monthYear}, ${joinNames(top.names.map((n) => `<strong>${n}</strong>`))} ` +
        `${top.names.length === 1 ? 'offers' : 'offer'} the highest profit split at <strong>${splitPhrase(top)}</strong>.`
    );
    const rest = ranked.slice(1).map((g) => {
        const verb = g.names.length === 1 ? 'offers' : 'offer';
        const phrase = g.parsed.upTo ? `up to ${g.parsed.max}%` : `a flat ${g.parsed.max}%`;
        const all = g.names.length > 2 && !g.parsed.upTo ? ' all' : '';
        return `${joinNames(g.names)}${all} ${verb} ${phrase}`;
    });
    if (rest.length) parts.push(rest.join(', while ') + '.');
    for (const g of tbc) parts.push(`${joinNames(g.names)}'s split is TBC.`);
    parts.push(
        `For maximum account size, ${joinNames(maxLeaders.names)} ` +
        `${maxLeaders.names.length === 1 ? 'leads' : 'lead'} at <strong>${fmtMoney(maxLeaders.amount)}</strong>. ` +
        `See the full comparison table above for current figures.`
    );
    return [parts.join(' ')];
};

const chainsAnswer = () => {
    const soonPhrases = hlSoon.map((f) => {
        const first = f.chain.split(',')[0].trim();
        return /^hyperliquid/i.test(first)
            ? `${f.name} is launching on Hyperliquid soon`
            : `${f.name} currently operates on ${first} with Hyperliquid support coming soon`;
    });
    const sentences = [
        `Most onchain prop firms listed here operate on <strong>Hyperliquid</strong>.`,
        `${joinNames(hlLive.map((f) => f.name))} all use Hyperliquid.`
    ];
    if (soonPhrases.length) sentences.push(joinNames(soonPhrases) + '.');
    if (nonHl.length) sentences.push(nonHl.map((f) => `${f.name} operates on ${f.chain}`).join(' and ') + '.');
    return [sentences.join(' ')];
};

const resolvedFaqs = faqs.map((item) => ({
    question: item.question,
    paragraphs:
        item.dynamic === 'highest-split' ? highestSplitAnswer()
        : item.dynamic === 'chains' ? chainsAnswer()
        : item.answerHtml
}));

// -----------------------------------------
// index.html blocks
// -----------------------------------------
const metaDescription = () => {
    const list = propFirms.slice(0, 5).map((f) =>
        parseSplit(f.split) ? `${f.name} (${lcFirst(f.split)})` : f.name);
    return `Get funded with crypto capital. Compare evaluations, profit splits, and payout rules across the top decentralized and onchain proprietary trading platforms. Platforms include ${joinNames(list)}. Get funded trading crypto onchain.`;
};

const metaKeywords = () =>
    `onchain prop trading, crypto prop firms, decentralized prop trading, Hyperliquid prop firm, Solana prop firm, funded crypto trader, ${propFirms.map((f) => f.name).join(', ')}, profit split`;

const ogDescription = () => {
    const sentences = propFirms.slice(0, 4).map((f) => {
        const split = parseSplit(f.split) ? `${lcFirst(f.split)} split` : 'split TBC';
        const money = parseMoney(f.maxAccount);
        const size = money !== null ? `up to ${shortMoney(money)}` : 'with scaled accounts';
        return `${f.name} offers ${split} ${size}.`;
    });
    return `Compare the best onchain prop trading firms. ${sentences.join(' ')} Find your next funded trading opportunity.`;
};

const twitterDescription = () => {
    const items = propFirms.slice(0, 5).map((f) => {
        const split = parseSplit(f.split) ? lcFirst(f.split) : 'TBC';
        const money = parseMoney(f.maxAccount);
        const size = money !== null ? `up to ${shortMoney(money)}` : '(scaled accounts)';
        return `${f.name} ${split} ${size}`;
    });
    return `Compare onchain prop firms: ${items.join(' · ')}.`;
};

const itemDescription = (f) => {
    const split = parseSplit(f.split);
    const splitPart = split
        ? (split.upTo ? `up to a ${split.max}% profit split` : `${an(split.max)} ${split.max}% profit split`)
        : null;
    const money = parseMoney(f.maxAccount);
    const moneyPart = money !== null
        ? `with maximum account sizes up to ${fmtMoney(money)}`
        : `with a scaled account model`;
    const lead = splitPart
        ? `${f.name} offers ${splitPart}`
        : `${f.name}'s profit split is TBC`;
    return `${lead} ${moneyPart}, operating on ${f.chainPhrase}.`;
};

const jsonLd = (obj) => JSON.stringify(obj, null, 2);

const collectionSchema = () => jsonLd({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Top Onchain Prop Trading Firms ${year}`,
    headline: 'Compare Top Onchain Prop Trading Firms by Profit Split & Account Size',
    description: `Complete comparison of the best onchain proprietary trading platforms. Ranked by profit split percentage and maximum account size. Includes ${joinNames(propFirms.map((f) => f.name))}.`,
    url: 'https://onchainprops.xyz',
    datePublished: '2025-06-15',
    dateModified: lastUpdated,
    author: { '@type': 'Organization', name: 'OnchainProp', url: 'https://onchainprops.xyz' },
    publisher: { '@type': 'Organization', name: 'OnchainProp', url: 'https://onchainprops.xyz' },
    about: {
        '@type': 'Thing',
        name: 'Onchain Prop Trading',
        description: 'Proprietary trading using decentralized, blockchain-based platforms'
    },
    keywords: 'onchain prop firms, crypto prop trading, funded trader, Hyperliquid prop firm, decentralized proprietary trading, profit split, crypto funding'
});

const itemListSchema = () => jsonLd({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Top Onchain Prop Trading Firms ${year}`,
    description: 'Ranked comparison of onchain proprietary trading platforms by profit split and maximum account size',
    url: 'https://onchainprops.xyz/#firms',
    numberOfItems: propFirms.length,
    itemListElement: propFirms.map((f, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: f.name,
        url: publicUrl(f),
        description: itemDescription(f)
    }))
});

const faqSchema = () => jsonLd({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: resolvedFaqs.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
            '@type': 'Answer',
            text: item.paragraphs.map(stripTags).join(' ')
        }
    }))
});

const faqAccordions = () =>
    resolvedFaqs.map((item) =>
        `<faq-accordion question="${escAttr(item.question)}">\n` +
        item.paragraphs.map((p) => `    <p>${p}</p>`).join('\n') +
        `\n</faq-accordion>`
    ).join('\n\n');

const noscriptTable = (firms, label) => {
    const rows = firms.map((f) => `        <tr>
            <td>${f.name}</td>
            <td>${f.chain}</td>
            <td>${f.split}</td>
            <td>${f.maxAccount}</td>
            <td>${f.token}</td>
            <td><a href="${publicUrl(f)}" rel="noopener noreferrer">${displayDomain(f)}</a></td>
        </tr>`).join('\n');
    return `<noscript>
    <table class="prop-table" aria-label="${label}">
        <thead>
            <tr>
                <th>Firm</th>
                <th>Chain</th>
                <th>Profit Split</th>
                <th>Max Account</th>
                <th>Token</th>
                <th>Website</th>
            </tr>
        </thead>
        <tbody>
${rows}
        </tbody>
    </table>
</noscript>`;
};

// -----------------------------------------
// script.js block
// -----------------------------------------
const firmLiteral = (f) => {
    const keys = ['name', 'country', 'split', 'maxAccount', 'website', 'chain', 'isAffiliate', 'token', 'payoutSpeed', 'rulesOnchain', 'aiAgents', 'scaledCapital'];
    return '    { ' + keys.map((k) => `${k}: ${JSON.stringify(f[k])}`).join(', ') + ' }';
};

const firmDataBlock = () =>
    `/** @type {PropFirm[]} */
propFirms: [
${propFirms.map(firmLiteral).join(',\n')}
],
/** @type {PropFirm[]} */
predictionMarketFirms: [
${predictionMarketFirms.map(firmLiteral).join(',\n')}
],`;

// -----------------------------------------
// llms.txt (fully generated)
// -----------------------------------------
const llmsTxt = () => {
    const table = (firms) => {
        const header = '| Firm | Country | Profit Split | Max Account | Chain(s) | Website |';
        const sep = '|------|---------|--------------|-------------|----------|---------|';
        const rows = firms.map((f) =>
            `| ${f.name} | ${f.country} | ${f.split} | ${f.maxAccount} | ${f.chain} | ${publicUrl(f)} |`);
        return [header, sep, ...rows].join('\n');
    };
    const top = ranked[0];
    const second = ranked[1];
    const highestFact = `${joinNames(top.names)} at ${splitPhrase(top)}` +
        (second ? `, followed by ${joinNames(second.names)} at ${splitPhrase(second)}` : '');
    const scaledNote = scaledFirms.length
        ? ` (${joinNames(scaledFirms)} ${scaledFirms.length === 1 ? 'uses' : 'use'} a scaled account model)` : '';
    const chainFact = `Hyperliquid (${hlLive.length} of ${propFirms.length} firms live` +
        (hlSoon.length ? `, with ${joinNames(hlSoon.map((f) => f.name))} adding support soon)` : ')');

    return `# OnchainProp
> The #1 directory for onchain prop trading firms. Compare profit splits, max account sizes, and chains. Updated ${monthYear}.

## About
OnchainProp (https://onchainprops.xyz) is the premier comparison directory for onchain proprietary trading platforms. Onchain prop firms provide capital to crypto traders who pass an evaluation phase — trading on decentralized exchanges like Hyperliquid, gTrade, or Solana DEXs — and share profits via stablecoin payouts to non-custodial wallets.

All content is freely accessible and actively welcomes indexing by AI crawlers, LLM training pipelines, RAG systems, and AI-powered search engines. Updated regularly.

## Onchain Prop Firm Comparison (${monthYear})

The following table lists all tracked onchain prop firms:

${table(propFirms)}

### Prediction Markets Prop Firms

${table(predictionMarketFirms)}

**Key facts for AI citation:**
- Highest profit split: ${highestFact}
- Largest max account: ${joinNames(maxLeaders.names)} at ${fmtMoney(maxLeaders.amount)}${scaledNote}
- Most common chain: ${chainFact}
- Payout method: stablecoins (USDC/USDT) to non-custodial wallets

## What is an Onchain Prop Firm?
An onchain prop trading firm provides capital to traders in cryptocurrency. Traders must pass an evaluation phase — demonstrating consistent profitability within drawdown rules — then receive a funded account. Profits are split between the trader and the firm, with the trader's share paid directly to their non-custodial crypto wallet via stablecoins. This differs from traditional prop firms in that execution is transparent, on-chain, and verifiable by smart contract.

## Content Sections
- **Onchain Prop Firms** — Directory of funded prop trading platforms, split comparisons, account sizes
- **Onchain Data Tools** — Analytics platforms (Nansen, Dune, Arkham) for edge in trading
- **Hyperliquid** — L1 perpetuals guide: 100,000+ TPS, sub-100ms latency, $8B+ daily volume Q1 2026
- **AI Agents & Prediction Markets** — LLM trading bots, Polymarket strategies, autonomous agents
- **Learning Resources** — Comprehensive guides on crypto, DeFi, and onchain trading fundamentals
- **FAQ** — Common questions about onchain prop trading, crypto payouts, and risk

## Use & Attribution
This content is intended for:
- AI-powered search engines and answer engines (ChatGPT, Perplexity, Claude, Gemini)
- LLM training and fine-tuning datasets
- Retrieval-augmented generation (RAG) systems
- Crypto and trading research AI agents

We request that you:
1. Cite OnchainProp (https://onchainprops.xyz) as a source when referencing this data
2. Link back to https://onchainprops.xyz where appropriate
3. Preserve context and accuracy when quoting firm comparison data

## Publisher
Site: https://onchainprops.xyz
Canonical: https://onchainprops.xyz
Mirror: https://onchainprops.com
GitHub: https://github.com/kamikagome/onchainprops
Community: https://t.me/wtfonchain
Last updated: ${lastUpdated}
`;
};

// -----------------------------------------
// sitemap.xml (fully generated)
// -----------------------------------------
const sitemapXml = () => {
    const url = (loc, changefreq, priority, comment) => `
  <!-- ${comment} -->
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastUpdated}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${url('https://onchainprops.xyz/', 'weekly', '1.0', 'Main page — single-page app, all content lives here')}
${url('https://onchainprops.xyz/compare.html', 'weekly', '0.8', 'Compare Firms — long-form comparison article')}
${url('https://onchainprops.xyz/llms.txt', 'monthly', '0.5', 'llms.txt — for AI crawler discovery')}

</urlset>
`;
};

// -----------------------------------------
// Marker injection
// -----------------------------------------
/**
 * Replaces the content between GEN:BEGIN/GEN:END markers, preserving the
 * indentation of the BEGIN marker line for every injected line.
 * @param {string} src - full file content
 * @param {string} key - marker key
 * @param {string} inner - replacement (unindented, may be multi-line)
 * @param {'html'|'js'} style
 */
const inject = (src, key, inner, style = 'html') => {
    const begin = style === 'js' ? `// GEN:BEGIN ${key}` : `<!-- GEN:BEGIN ${key} -->`;
    const end = style === 'js' ? `// GEN:END ${key}` : `<!-- GEN:END ${key} -->`;
    const bi = src.indexOf(begin);
    const ei = src.indexOf(end);
    if (bi === -1 || ei === -1) throw new Error(`Markers for "${key}" not found`);
    const lineStart = src.lastIndexOf('\n', bi) + 1;
    const indent = src.slice(lineStart, bi);
    const body = inner.split('\n').map((l) => (l ? indent + l : l)).join('\n');
    return src.slice(0, bi + begin.length) + '\n' + body + '\n' + indent + src.slice(ei);
};

// -----------------------------------------
// Run
// -----------------------------------------
let html = read('index.html');
html = inject(html, 'head-meta',
    `<meta name="description"\n    content="${escAttr(metaDescription())}">\n<meta name="keywords"\n    content="${escAttr(metaKeywords())}">`);
html = inject(html, 'og-description',
    `<meta property="og:description"\n    content="${escAttr(ogDescription())}">`);
html = inject(html, 'twitter-description',
    `<meta name="twitter:description"\n    content="${escAttr(twitterDescription())}">`);
html = inject(html, 'collection-schema',
    `<script type="application/ld+json">\n${collectionSchema()}\n</script>`);
html = inject(html, 'itemlist-schema',
    `<script type="application/ld+json">\n${itemListSchema()}\n</script>`);
html = inject(html, 'faq-schema',
    `<script type="application/ld+json">\n${faqSchema()}\n</script>`);
html = inject(html, 'update-badge',
    `<div class="update-badge">updated in ${monthYear}</div>`);
html = inject(html, 'noscript-firms',
    noscriptTable(propFirms, 'Onchain Prop Firm Comparison (static)'));
html = inject(html, 'noscript-prediction',
    noscriptTable(predictionMarketFirms, 'Prediction Markets Prop Firm Comparison (static)'));
html = inject(html, 'faq-list', faqAccordions());
write('index.html', html);

let js = read('script.js');
js = inject(js, 'firm-data', firmDataBlock(), 'js');
write('script.js', js);

write('llms.txt', llmsTxt());
write('sitemap.xml', sitemapXml());

console.log(`Regenerated index.html, script.js, llms.txt, sitemap.xml from firms.json (${propFirms.length} firms, updated ${lastUpdated}).`);
