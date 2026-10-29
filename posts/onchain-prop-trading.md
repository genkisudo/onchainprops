---
title: Onchain Prop Trading: Why the Books Are Finally Opening
description: Onchain prop trading explained: how onchain prop firms like Propr and Hypernova move hedging, rules and payouts onchain so traders can verify them.
seoTitle: Onchain Prop Trading: Why Prop Firm Books Are Opening
category: general
date: 2026-10-29
tldr: Onchain prop trading means anyone can audit the code and check the data themselves. Onchain prop firms move hedging, account rules, payouts and revenue onto the blockchain, so traders verify the firm instead of taking its word for it.
---

Traditional prop trading has a structural problem: the incentives are broken from day one.

## The Problem With Legacy Prop Firms: B-Booking and Evaluation Fees

Most legacy prop firms don't actually need their traders to succeed. Their revenue comes mainly from evaluation fees, and most accounts are heavily B-booked. That means traders are on simulated accounts, and the firm takes the other side, so every dollar a trader wins comes straight out of the firm's pocket. When your business model depends on traders failing, it's hard to claim you're on their side.

A different story is spreading through my feed right now: onchain prop trading.

## What Is Onchain Prop Trading? The Crypto Prop Firm Landscape

The core idea is simple. Onchain prop trading means anyone can audit the code and check the data for themselves. But "crypto prop firm" covers very different businesses. Today crypto prop firms fall roughly into three groups:

- **Legacy rebrands.** Same old model with crypto deposits and withdrawals added. No smart contracts, no new transparency.
- **CEX-based props (e.g., Breakout).** Crypto-native, but built on centralized exchange infrastructure.
- **Onchain prop firms.** The focus of this article.

Over the past few weeks I've been digging into how these onchain prop firms actually work under the hood. Approaches vary a lot. Some teams are shipping genuinely new infrastructure, while others have already shut down.

In my view, [Hypernova](../firms/hypernova) and [Propr](../firms/propr) are the current market leaders among onchain prop firms. Elsewhere, a recent podcast with the [Vanta](../firms/vanta-trading) founder went viral on X, [Doji Funded](../firms/dojifunded) is recording every closed trade on the blockchain, and a number of new protocols are building quietly in stealth.

## Onchain vs Offchain: Not All Prop Firm Transparency Dashboards Are Equal

"Transparency dashboard" has become a buzzword, so it's worth being precise. There are two kinds of prop firm transparency dashboard, and they are not the same:

- **Onchain dashboards** read from smart contracts and blockchain transactions. The data is already public, and anyone can verify it independently.
- **Offchain dashboards** pull from the firm's own internal database. No smart contracts, so you're still taking the firm's word for it.

In practice it isn't black and white. If a trader pays for an evaluation with a credit card, that payment will never be onchain. Not everything can live on a blockchain, but the direction matters: the more of a prop firm that moves onchain, the less trust traders need to extend. Open-sourcing code is another encouraging trend.

## Infrastructure and Access to Capital: Why Onchain Prop Firms Work Now

### A-Book vs B-Book: Aligning the Firm With the Trader

The trust problem is being solved one component at a time, by moving more of the business onchain and making it verifiable. A-booking, where trader flow is actually hedged in the market, aligns the platform with the trader instead of pitting them against each other.

### Hyperliquid and Low-Fee L2s

The infrastructure has finally caught up too. Hyperliquid gives traders CEX-level performance and liquidity with zero gas fees on execution, and fees on L2s like Arbitrum are now low as well.

### Access to Capital for More Traders

There's also an access story. Traders in jurisdictions that never had access to capital or professional infrastructure can now trade, including RWA perps.

## Propr vs Hypernova: How the Leading Onchain Prop Firms Approach Transparency

### Propr: Open Books, Public Hedging on Hyperliquid

Propr's position is that hedging is the single most important part of a prop firm, so it's the part they've made public. Today, Propr offers:

- **Onchain hedging** on Hyperliquid, publicly visible and verifiable
- **Traceable flows**, with revenue and payouts trackable onchain
- **Financial and operational reporting**, including published financials, revenue attribution and active user numbers

Next on their roadmap are a fully onchain simulated order book (CLOB), onchain trade state and fully automated hedging PnL. The stated aim is to shrink the amount of trust traders have to place in the firm.

Those items aren't live yet, but in response to demand from traders and affiliates, Propr's next app update adds full payout transparency: gross payouts, net payouts, total spent on evaluations, total net PnL across paid evaluations and funded accounts, and how each trader's signals feed into their hedging algorithm.

The longer-term goal is to back traders whose results would hold up on a live account just as well as in a prop program. Propr's team says that in conversations with other prop firm CEOs, more of them are moving the same way. Prop trading gets far more powerful when the books are open.

### Hypernova: Prop Firm Business Logic in Smart Contracts

Hypernova went further down the stack. Its account rules, account state and payout eligibility all live in smart contracts. Traders interact with those contracts directly and get paid from an onchain reserve, with no manual approval step.

The hard part, as the team explains it, was risk. With instant settlement there's no withdrawal review queue to catch abuse after the fact, so it has to be caught during trading. Hypernova built its in-flight risk checks from scratch for exactly that reason.

Making sure this holds up at scale is a big part of why they've stayed in closed alpha/beta. The results so far are striking: September payouts averaged 5.9 seconds from click to wallet, the fastest in the prop space by a wide margin. There's more work ahead, but it's a clear case of choosing the harder path and having it pay off.

## Why I'm Building Onchain Props

My background explains a lot of this. Back in 2017–2018 I was running spot arbitrage between CEXs and early DEXs, and I got hacked twice on centralized exchanges (Cryptopia, I'm looking at you). So I understand on a gut level why traders prefer Hyperliquid to CEXs, and why they don't trust legacy props.

### The Onchain Paradox: Transparent but Unreadable

But there's a catch. Onchain data is open, yet raw blockchain data isn't useful to most traders. Transparency you can't read isn't much better than no transparency at all. MCP and newer tooling make it easier, but there's still a gap.

That's what we're closing at @onchain_props. We've built a dedicated data tools section to help traders navigate onchain prop firms, and I've been working on analytics covering the whole space. No black boxes, just blockchain data.

## FAQ

### What is onchain prop trading?

Onchain prop trading means anyone can audit the code and check the data for themselves. Onchain prop firms move parts of the business, such as hedging, account rules, payouts and revenue, onto the blockchain so traders can verify them instead of taking the firm's word for it.

### What's wrong with the traditional prop firm model?

Most legacy prop firms earn mainly from evaluation fees, and most accounts are heavily B-booked: traders are on simulated accounts and the firm takes the other side, so every dollar a trader wins comes out of the firm's pocket.

### What is the difference between A-book and B-book at a prop firm?

On a B-book, traders are on simulated accounts and the firm takes the other side of their trades. With A-booking, trader flow is actually hedged in the market, which aligns the platform with the trader instead of pitting them against each other.

### What types of crypto prop firms are there?

Crypto prop firms fall roughly into three groups: legacy rebrands (the old model with crypto deposits and withdrawals added), CEX-based props built on centralized exchange infrastructure (e.g., Breakout), and onchain prop firms.

### Are all prop firm transparency dashboards trustworthy?

No. Onchain dashboards read from smart contracts and blockchain transactions, so anyone can verify the data independently. Offchain dashboards pull from the firm's own internal database, so you're still taking the firm's word for it.

### Propr vs Hypernova: how do they differ?

Propr makes its hedging public, with onchain hedging on Hyperliquid, payouts and revenue trackable onchain, and published financial reporting. Hypernova puts account rules, account state and payout eligibility in smart contracts and pays traders from an onchain reserve with no manual approval step; its September payouts averaged 5.9 seconds from click to wallet.
