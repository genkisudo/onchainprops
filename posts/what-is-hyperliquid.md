---
title: What Is Hyperliquid?
description: What is Hyperliquid? A plain-English guide to the onchain order book L1: HyperCore, HyperEVM, HIP-3 markets, builder codes and HIP-4 outcomes.
seoTitle: What Is Hyperliquid? HyperCore, HIP-3 & Builder Codes
category: guides
date: 2026-10-29
tldr: Hyperliquid is a layer-1 blockchain built around an onchain exchange. Its core, HyperCore, runs perpetual futures and spot order books with one-block finality, and HyperEVM adds smart contracts on the same chain. HIP-3 lets anyone deploy perp markets, builder codes let apps earn fees on the trades they route, and HIP-4 adds outcome markets.
---

*No one competes with the internet.*

Most of the prop firms I track on [onchainprops.xyz](https://onchainprops.xyz/) run on Hyperliquid. So people keep asking me: what is Hyperliquid, really? A perp DEX? A chain? Something bigger? I read the [official docs](https://hyperliquid.gitbook.io/hyperliquid-docs) and the team's TOKEN2049 keynote. Here's my answer.

**What is Hyperliquid?** Hyperliquid is a layer-1 blockchain built for a fully onchain open financial system. Its core, HyperCore, runs perpetual futures and spot order books directly onchain, with one-block finality. HyperEVM adds general-purpose smart contracts on the same chain, so apps can build on that liquidity without bridging.

## How Does Hyperliquid Work?

Per the [About page](https://hyperliquid.gitbook.io/hyperliquid-docs/about-hyperliquid), Hyperliquid is an L1 "written and optimized from first principles." It's secured by HyperBFT, a consensus algorithm inspired by HotStuff. Execution is split in two.

### HyperCore

HyperCore holds the margin and matching engine state. Every order, cancel, trade and liquidation happens onchain. No dark back room. The docs put it bluntly: it "does not rely on the crutch of off-chain order books" ([HyperCore overview](https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/overview)).

- Mainnet supports roughly 200k orders per second.
- Median end-to-end latency is 0.2 seconds for a co-located client.

### HyperEVM

HyperEVM is not a separate chain. It's secured by the same consensus, so smart contracts can read HyperCore order book prices directly ([HyperEVM](https://hyperliquid.gitbook.io/hyperliquid-docs/hyperevm)). The docs still call it alpha. Read: build, but wear a helmet.

### HIP-1, HIP-2, HLP and HYPE

Around that core sit:

- **[HIP-1](https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-1-native-token-standard):** the token standard.
- **[HIP-2](https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-2-hyperliquidity):** an onchain liquidity strategy for new tokens.
- **[HLP](https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/vaults/protocol-vaults):** a community-owned vault that market-makes, performs liquidations and earns a share of fees.

The [101 page](https://hyperliquid.gitbook.io/hyperliquid-docs/about-hyperliquid/hyperliquid-101-for-non-crypto-audiences) says HYPE secures the network, pays for network costs and gives trading fee discounts. Over $1B in annualized fees goes toward buying HYPE back. Development is fully self-funded. No VCs.

That fits the mission: financial systems open to everyone, and wealth creation as broadly accessible as possible. Ideally, to everyone on the planet.

## Hyperliquid HIP-3: Anyone Can List a Perp

[HIP-3](https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-3-builder-deployed-perpetuals) is "permissionless builder-deployed perps." The deployer defines the market, including the oracle and contract specs, and operates it. HIP-3 markets inherit HyperCore's order books and margining.

The requirements, per the docs:

- Deployers must keep 500k HYPE staked.
- Validators can slash that stake by stake-weighted vote for malicious market operation.
- Deployers can set an extra fee share of 0–300%.

Permissionless, with a very expensive leash.

HIP-3 is the unlock for real-world asset markets. The reported numbers are striking: BTC and ETH down 30–40% year over year, Hyperliquid volume holding up anyway, and HIP-3 markets at roughly 30–50% of volume by mid-2026. Treat those as unverified. The docs don't include them.

## Hyperliquid Builder Codes and the Unix Philosophy

This is where the subtitle comes from. Fintech usually verticalizes everything into one closed app. Hyperliquid takes the Unix approach instead: small, independent tools plugged into one shared liquidity layer. Nobody competes with the internet. It's just a tool.

The mechanism is documented. [Builder codes](https://hyperliquid.gitbook.io/hyperliquid-docs/trading/builder-codes) let an app earn a fee on fills it sends for a user.

- The user approves a max fee and can revoke it anytime.
- The cap is 0.1% on perps and 1% on spot.
- It's all processed onchain.

The 101 page says independent teams (mobile apps, trading terminals, wallets) have earned more than $65M through builder codes. Valor, MetaMask and Phantom are examples. Any of them can tap the deepest onchain markets without breaking their existing user flow.

### Why Builder Codes Matter for Prop Trading

This is why firms like [Propr](https://onchainprops.xyz/firms/propr) and [Hypernova](https://onchainprops.xyz/firms/hypernova) can build on Hyperliquid instead of rebuilding an exchange. It's also why their activity is visible onchain. More on that in [onchain prop trading](https://onchainprops.xyz/blog/onchain-prop-trading).

## Hyperliquid HIP-4: Outcome Markets and Convexity

[HIP-4](https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-4-outcome-markets) adds outcome markets: "fully collateralized contracts that settle within a fixed range." Per the docs, outcomes bring "non-linearity, dated contracts, and an alternative form of derivative trading that does not involve leverage or liquidations."

- Yes and No books are merged to share liquidity.
- Standalone outcomes can settle to a fraction. The [deployer docs](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/hip-4-deployer-actions) call these scalar payouts.
- The first market is a recurring daily BTC binary.

Call it convexity, without leaving the venue. Outcomes compose with existing HyperCore primitives like portfolio margin and the HyperEVM, rather than living on a separate exchange. One caveat: the HIP-4 deployer actions page is still marked "Testnet-only."

## What's Next: AI Agents and Permissioned Markets

Onchain systems keep data and value at the same level of abstraction. That's exactly what AI agents need to trade on their own.

The documented piece today is [API wallets](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets), which the docs also call "agent wallets." They let a separate key sign trades for an account. The robots already have a login.

Next up is HIP-3 Star: permissioned markets aimed at institutions. The docs list [HIP-3\*](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/hip-3-deployer-actions) as testnet-only, adding "an allow-list and proxied user actions" on top of HIP-3. Serving regulated institutions is the stated direction, not a documented commitment.

Where it ends up is hard to predict. Even the team admits that.

## FAQ

### What is Hyperliquid in simple terms?

A blockchain whose core is an onchain exchange for perps and spot, plus an EVM so apps can plug into that liquidity.

### How does Hyperliquid work?

HyperBFT orders transactions. HyperCore matches orders and handles margin onchain. HyperEVM runs smart contracts on the same state.

### What is Hyperliquid HIP-3?

Permissionless, builder-deployed perp markets, backed by 500k staked HYPE that validators can slash.

### What are Hyperliquid builder codes?

User-approved, onchain fees (up to 0.1% on perps and 1% on spot) that let independent frontends earn from the trades they route.

---

Building or trading on Hyperliquid? Compare the [Hyperliquid prop firms](https://onchainprops.xyz/#firms) on onchainprops.xyz, browse [ecosystem resources](https://onchainprops.xyz/resources), and follow [@onchain_props](https://x.com/onchain_props).

*Not financial advice. Docs checked October 29, 2026. Source talk: "Hyperliquid: Rebuilding Finance from First Principles," TOKEN2049 Singapore, 7 October 2026.*
