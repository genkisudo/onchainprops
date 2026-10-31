---
title: What Is Vanta Trading?
description: Vanta Trading is a one-step prop firm from Taoshi, built on Bittensor Subnet 8. 10% target, 100% split, weekly USDC payouts. Full rules and prices.
seoTitle: What Is Vanta Trading? Rules, Pricing & Payouts (2026)
category: guides
date: 2026-10-31
tldr: Vanta Trading is a prop trading evaluation platform built on Bittensor Subnet 8 (Vanta Network). You pay a one-time fee, pass a one-step challenge with a 10% profit target on a simulated account, and earn weekly rewards in USDC or by bank transfer, with a 100% profit split by default.
---

## What Is Vanta?

To understand Vanta Trading, start with Bittensor. Bittensor is a blockchain made of independent subnets, each producing a digital commodity such as compute, AI inference, storage or predictions. The chain pays participants in its token, TAO, according to the value they add.

Each subnet has four kinds of participant. Subnet creators define the rules and rewards, miners produce the commodity, validators score the miners, and stakers back validators with TAO. Vanta runs on Subnet 8, where the commodity is trading performance: miners compete as traders, and the best results earn rewards.

**Vanta Trading** is a prop trading evaluation platform. You pay a one-time fee, pass a one-step challenge on a simulated account, and then earn weekly rewards on your simulated profit, with a 100% profit split by default. Rewards are paid in USDC or by bank transfer and listed on a public Payout Ledger. See the full [Vanta Trading firm page](https://onchainprops.xyz/firms/vanta-trading) for current pricing.

## Why Vanta Says It Is Different: Open Source, Onchain, Decentralized

Founder and CEO Arrash Yasavolian argues that the core problem with prop firms is trust: the firm that took your fee also decides whether your payout is valid. He points to The Funded Trader, which blocked over $2M in withdrawals and then paused operations.

His answer has three parts:

- **Open source:** Vanta Network's rules are public code that anyone can read.
- **Onchain:** activity and payouts can be checked independently.
- **Decentralized:** independent validators receive every order, apply the rules and reach consensus on payouts, so no single company has the final say.

That is the pitch. In practice, only part of it is verifiable today: USDC rewards settle on Base with public transaction hashes, but bank rewards are paid in USD via Stripe and cannot be checked onchain, and the evaluation rules themselves are enforced by Vanta rather than a smart contract. Read the Payout Ledger yourself before relying on the claim.

He also separates the two brands. Vanta Network (SN8) is the open infrastructure. Vanta Trading is one prop firm built on it. Other firms can build on SN8 too, and traders can join the network directly as miners.

At the network level, payouts are made in SN8's alpha token (theta) based on profit, and prop firms pay the network in theta to fund their traders. Vanta Trading then pays its own customers in USDC or by bank transfer. Validators, in turn, get access to the trading data, which gives them a reason to help find the best traders.

## Vanta Tokenomics: Buybacks, Burns and Locked Emissions

Vanta Trading supports the SN8 (theta) token in three ways: it buys theta, burns it to register traders, and locks its own emissions. The figures below come from CEO Arrash Yasavolian.

### $160,000 of SN8 buybacks in one month

Vanta Trading bought about $160,000 of SN8 alpha in a single month, valued in TAO at the time of purchase. Every trader Vanta Trading registers on the network needs collateral, and that collateral is burned. So more traders means more buybacks and more burns.

### Emissions locked in conviction

Vanta Trading has locked its share of miner emissions in conviction: about 40,000 alpha, worth roughly $300,000 at the time (transaction on Taostats). It keeps only what it needs to pay traders and cover operations.

Counting that lock, buybacks covered 76% of miner emissions for the month. Vanta has no owner emissions, since it cut them to 0% and locked them too. The team says it will keep locking its Vanta Trading emissions and fund trader collateral from buybacks.

### What's next: 2,500 miners and an agentic trading platform

Two upcoming changes are meant to raise demand for theta:

- **Null Consensus** will expand SN8 to 2,500 miner slots. Vanta plans to fill each one with a trader posting collateral, which means more buybacks and burns.
- An **agentic trading SaaS platform** will give traders AI-driven tooling to compete on Vanta. It will also run its own buybacks and burns.

The stated goal is for demand for funding to cover 100% or more of miner emissions. Live figures are on the Vanta Network metrics and tokenomics dashboards.

These are the team's own claims and plans. Check the dashboards and onchain data, and remember that theta is a volatile token; nothing here is investment advice.

## What Is a Bittensor Subnet?

Bittensor is a blockchain network that pays computers for useful work, judged by other computers. Its native token is TAO. The network is split into subnets, each with its own task and its own scoring rules (Vanta repo).

You can track Subnet 8 live (emissions, miners, validators and price) on [SubnetRadar](https://subnetradar.com/subnet/8).

Other places to follow Subnet 8:

- [Taostats](https://taostats.io/subnets/8): main explorer page for SN8
- [Bittensor.ai](https://bittensor.ai/subnets/8): subnet overview
- [TaoMarketCap](https://taomarketcap.com/subnets/8): market data and trading
- [Subnet Metrics](https://subnetmetrics.com/subnets/8): burns, emissions and more

The three roles that matter most here:

- **Miners** do the work. On Subnet 8, the work is trading signals.
- **Validators** check the work, score each miner and set weights on the chain.
- **The subnet owner** writes the rules. For Subnet 8 that is Taoshi.

Since the dynamic TAO (dTAO) upgrade in 2025, each subnet also has its own token, called its alpha. Subnet tokens are named after Greek letters in order, and people buy them with TAO (Taostats). Subnet 8's token is therefore theta (θ).

## How Vanta Network Miners Work

On Subnet 8 (testnet 116), miners are traders or trading bots. They send LONG, SHORT or FLAT signals on forex, crypto, equities or commodities, and validators track each miner's simulated portfolio (README).

The miner rules look a lot like a prop firm challenge:

- **Registration:** a miner registers a hotkey on Bittensor for under 1 TAO.
- **Collateral:** a miner deposits 300 to 1,000 theta. Each theta unlocks $500 of trading capacity, so account sizes run from $150,000 to $500,000 (miner docs).
- **One asset class:** each miner picks crypto, forex, equities or commodities and trades only that.
- **Challenge period:** within 90 days, a miner needs 61+ trading days, returns above 10% (8% for forex), no breach of a 5% intraday or 5% end-of-day drawdown, and a rank in the top 25 of its asset class.
- **Eliminations:** in the main competition, a miner is removed for a 5% intraday or 8% end-of-day drawdown, 60 days without an order, or copying another miner. An eliminated hotkey is blacklisted for good.
- **Real trading costs:** carry fees (10.95% a year for crypto at 1x, or live Hyperliquid funding rates), spread fees and slippage are all charged.

Miners are paid in network emissions (theta, tracked in TAO and USD), not in cash. Since December 2025 Vanta uses debt-based scoring: last week's profit, scaled by penalties, sets what each miner is owed, and validator weights pay it out by midnight UTC on Sunday. Average daily PnL currently carries 100% of the score. Unused weight goes to a burn address.

### Entity miners: how Vanta Trading plugs in

The repo also defines entity miners. An entity pays 1,000 theta once to register, then opens many subaccounts, each trading like its own miner (entity miner docs). At most 10 entities can exist on the network.

This is the plumbing behind a prop firm on Subnet 8. Subaccounts have challenge, funded, Instant Funded and pro stages, with the same 5% static or daily loss rules seen on Vanta Trading. Hyperliquid-linked subaccounts are also supported. Each subaccount's registration fee is paid in theta and burned, for example 66.67 theta for a $100,000 account at a 5% daily limit.

## What Is the Theta (θ) Token?

Theta is Subnet 8's alpha token, also listed as SN8. You get it by staking TAO into the Subnet 8 pool, using the Vanta CLI or any Bittensor wallet (Vanta CLI docs).

Theta has four main uses on the network:

| Use | Amount |
|-----|--------|
| Miner collateral | 300 to 1,000 theta ($500 of capacity each) |
| Validator stake | 1,000 theta minimum |
| Entity registration | 1,000 theta, burned |
| Subaccount and pro promotion fees | Set by account size; burned |

Theta is also how the network pays: emissions go to miners, validators, the owner and stakers. The supply model caps alpha at 21 million, with a first halving at 10.5 million minted. In a late-August 2026 snapshot, theta traded near $8.45, with about 5.45 million in circulation (Yellow).

Vanta Trading users do not need theta. Classic evaluations are paid by card, bank or crypto, and rewards come in USDC or by bank transfer. Theta matters to miners, validators and investors in the subnet, not to retail traders. It is a volatile token, and this is not investment advice.

## How the Vanta Trading Evaluation Works

The Classic evaluation is one step at every size. Hit a 10% profit target without breaching either loss limit, and your scaled account activates immediately.

- **Static loss limit:** equity may never fall more than 5% below your starting balance.
- **Daily loss limit:** equity may never fall more than 3% or 5% below the start-of-day balance (UTC). You choose at purchase; 3% is the default.
- Both limits use equity, so open losses count. Breach either and the account closes.
- No time limit, no minimum days, no consistency rule. Trade at least once every 60 days to stay active.

Any style is allowed on Classic: manual, algorithmic, intraday, swing and news trading, as long as the strategy is yours. Third-party copy trading means disqualification.

You trade on the Vanta Trading Desk with real-time data, across 500+ instruments in crypto, forex, equities, indices and commodities. Accounts are simulated; there is no real money in your account.

## Latest Vanta Trading News

Vanta Trading has passed $1,000,000 in trader payouts, and celebrated with a $100,000 Classic challenge giveaway. Other recent updates:

- Vanta Trading locked its share of miner emissions in conviction, about 40,000 alpha (~$300,000), keeping only what it needs for payouts and operations.
- Buybacks covered 76% of miner emissions for the month; future collateral deposits will be funded by buybacks and burns.
- Owner emissions were cut to 0% and locked in conviction, and Vanta Trading bought about $160,000 of SN8 alpha in one month.
- A coming change called Null Consensus is set to expand the network to 2,500 miners.
- The founder set out why prop firms need to be open source, onchain and decentralized.
- Vanta's tokenomics are tracked on the public tokenomics dashboard.

## FAQ

### Is Vanta Trading a Bittensor subnet?

Vanta Trading is a product built on Bittensor Subnet 8, the Vanta Network. The subnet handles performance tracking and rule enforcement.

### Do I trade real money on Vanta?

No. Accounts are simulated; rewards are real and paid weekly.

### What is the Vanta Trading profit split?

100% by default. You can choose 60/40 to 90/10 for a cheaper fee.

### Does Vanta Trading require KYC?

Yes, once, when your scaled account is activated and before rewards are paid.

### What is the Vanta (SN8) token?

Theta (θ), Subnet 8's alpha token. Miners and validators stake it as collateral; Vanta Trading customers never need it.

### Can I mine on Vanta Network?

Yes. Register a hotkey on Subnet 8, deposit 300 to 1,000 theta, pick an asset class and pass the 90-day challenge period.

### How do I contact Vanta?

Through Discord or support@vantatrading.io.
