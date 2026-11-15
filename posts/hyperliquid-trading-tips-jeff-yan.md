---
title: Hyperliquid Trading Tips: 11 Rules From Founder Jeff Yan
description: Hyperliquid founder Jeff Yan's 11 trading rules from 2023: when to cross the spread, funding arb, liquidations, latency and sizing. Every quote sourced.
seoTitle: Hyperliquid Trading Tips: 11 Rules From Jeff Yan
category: guides
date: 2026-11-15
tldr: In 2023, Hyperliquid founder Jeff Yan (@chameleon_jeff) posted long threads on how professional crypto traders make money. His core advice: know who pays you, trade only where the order book is enforced onchain, cross the spread when you have a signal, collect funding but hedge it, and keep positions small while you prove your edge with markouts.
---

## Hyperliquid trading tips at a glance

**Short answer:** In 2023, Hyperliquid founder Jeff Yan (@chameleon_jeff) posted long threads on how professional crypto traders make money. His core advice: know who pays you, trade only where the order book is enforced onchain, cross the spread when you have a signal, collect funding but hedge it, and keep positions small while you prove your edge with markouts.

This guide turns those posts into 11 rules. Every quote is his, word for word, with a link to the original post. The commentary between quotes is ours. Jeff founded Hyperliquid, so many of his examples come from it. All figures are from 2023 and have probably changed since.

| # | Rule | Who it helps most |
| --- | --- | --- |
| 1 | Figure out who is paying you | Every trader |
| 2 | Only trade on books enforced onchain | Anyone choosing a venue |
| 3 | If you have a signal, cross the spread | Discretionary and medium-frequency traders |
| 4 | Get paid funding, and hedge it | Basis and carry traders |
| 5 | Mine the public onchain data | Quant and data-driven traders |
| 6 | Learn who gets the liquidations | Perps traders on long-tail assets |
| 7 | Measure latency before you optimize it | Bot builders |
| 8 | Keep positions small and lean toward flat | New market makers, funded traders |
| 9 | Research with simple priors and expect decay | Strategy researchers |
| 10 | To move size, announce it | Large traders and funds |
| 11 | Start small and get to live pnl | Beginners in algo trading |

## Who is Jeff Yan?

Jeff Yan is the co-founder of Hyperliquid, an onchain order book exchange for perpetual futures, and the founder of the crypto market-making firm Chameleon Trading. [In a May 2023 post](https://x.com/chameleon_jeff/status/1660079528054595584) he described Chameleon as "the crypto MM firm I built and have been leading for more than 3 years".

That year he wrote long threads on latency, making vs taking, MEV, funding, liquidations and research. We read all of his 2023 posts and pulled out the advice that still holds up.

## 1. Figure out who is paying you

Before you can have an edge, you need to know who is on the other side of your trade. In his first serious thread, Jeff split a market into four groups: retail, makers, HFT takers ("toxic flow") and arbitrageurs. "Retail" describes how the flow behaves. It isn't an insult:

> "Retail doesn't mean "dumb," but rather that HFT actors want to trade against their flow."

— [Jeff Yan on X, Feb 17, 2023](https://x.com/chameleon_jeff/status/1626665946269257728)

The edge comes from seeing what the other side needs:

> "often your alpha is someone else's undesired risk."

— [Jeff Yan on X, Apr 25, 2023](https://x.com/chameleon_jeff/status/1650868940728582146)

**Takeaway:** if you can't name who pays you and why, it's probably you.

## 2. Only trade on order books that are enforced onchain

Your venue sets the quality of your fills. Jeff's main structural argument of the year:

> "Order books offer more competitive liquidity than AMMs, but they must live onchain."

— [Jeff Yan on X, Jun 24, 2023](https://x.com/chameleon_jeff/status/1672715768470044673)

The reason is MEV (maximal extractable value). If the book lives offchain, whoever runs the matching engine decides who gets filled:

> "MEV for offchain order books is at the level of matching, not just tx ordering."

— [Jeff Yan on X, Jun 24, 2023](https://x.com/chameleon_jeff/status/1672715760140161024)

With an onchain book, a validator can't skip the best, earliest order. Filling anyone else is an invalid state transition, so the block gets rejected.

Centralized exchanges deserve the same check. Jeff publicly called out an exchange where his team watched trades print through their own top-of-book order:

> "literally see trades executing at farther prices while our order chilled there."

— [Jeff Yan on X, Apr 5, 2023](https://x.com/chameleon_jeff/status/1643610606082334720)

**Takeaway:** before you size up anywhere, check that your fills, the public prints and the order book all agree.

## 3. Limit or market order? If you have a signal, cross the spread

Resting a limit order inside a wide spread looks cheaper. Usually it isn't, because you get filled when you're wrong and miss the fill when you're right.

> "Just like in poker, if you make a bet, you tend to get called by better hand than those that fold."

— [Jeff Yan on X, Mar 10, 2023](https://x.com/chameleon_jeff/status/1634021058469826561)

Resting orders make money based on queue position, and the fastest traders win that race. So his advice for anyone who isn't running HFT:

> "if you're looking at medium frequency or longer, just take liquidity to start."

— [Jeff Yan on X, Mar 21, 2023](https://x.com/chameleon_jeff/status/1637986814748397569)

He gives two exceptions: heavily skewed fee schedules, and resting orders far from the price to catch big wicks.

**Takeaway:** if you're not HFT and you have a view, take liquidity. Either way, put a limit price on every order so a thin book can't fill you at a terrible price.

## 4. Hyperliquid funding arbitrage: get paid funding, and hedge it

Funding is one of the clearest edges in onchain perps. When a venue is crowded on one side, funding pays you to take the other side, and you can hedge on a venue where funding is flat. In October 2023, Jeff wrote:

> "Super juicy BTC funding arb available in 7 figs on @HyperliquidX"
>
> "Almost 400% annualized to short, while CEXs are flat for an easy hedge."

— [Jeff Yan on X, Oct 23, 2023](https://x.com/chameleon_jeff/status/1716588460033647020)

When funding gets extreme, a precise hedge matters less:

> "When funding pays up to 1%/hr all you need is a rough beta hedge."

— [Jeff Yan on X, Aug 21, 2023](https://x.com/chameleon_jeff/status/1693649491889443147)

These trades pay for a reason. On Hyperliquid, funding is what pays someone to take a large one-sided position off the main liquidity provider. That makes funding arb a service you are paid to provide:

> "alpha is a service you provide to the market."

— [Jeff Yan on X, May 31, 2023](https://x.com/chameleon_jeff/status/1663968386681012224)

**Our caution, not Jeff's:** funding arb is not risk-free. Before you call it an arb, count trading fees, slippage on both legs, funding flipping sign, the liquidation buffer on each leg and the cost of moving collateral between venues.

## 5. Mine the public onchain data

On a centralized exchange you see anonymous prints. On a fully onchain venue like Hyperliquid you also see addresses, positions and vaults. Jeff labeled addresses as retail or market maker by their rolling 30-day volume, then plotted retail trades against the best bid and offer. He called that chart

> "something that you could never see with CEX feed data."

— [Jeff Yan on X, May 23, 2023](https://x.com/chameleon_jeff/status/1660835008318423041)

Why it matters:

> "retail flow can be a strong predictor of medium-term price movements."

— [Jeff Yan on X, May 23, 2023](https://x.com/chameleon_jeff/status/1660835014471487488)

One of his favorite medium-frequency signals came from his own firm's HFT pnl. When it spiked, retail was usually piling in, and the price impact tended to partly revert. His lesson:

> "If you have a unique insight into markets through your interacting with them, use it."

— [Jeff Yan on X, Mar 24, 2023](https://x.com/chameleon_jeff/status/1639081540612411392)

**Takeaway:** onchain, much of the data that used to be private is public. The edge goes to whoever builds tools to read it.

## 6. Learn who gets the liquidations

Liquidation flow is some of the most profitable flow in perps, and someone always captures it:

> "Who gets the juicy liquidation flow?"
>
> "Answer: DMMs/internal desks on CEXs, MEV bots on DEXs."

— [Jeff Yan on X, Apr 24, 2023](https://x.com/chameleon_jeff/status/1650293672808792067)

How a venue liquidates decides how much you lose when it happens to you. On Hyperliquid, liquidations used to mean the protocol took over the position and its collateral. Then they moved to the order book. After that change, a liquidated user lost only slippage and fees, not the whole maintenance margin. Jeff said the switch

> "can be a 100x improvement on illiquid assets with strict margin requirements."

— [Jeff Yan on X, Oct 15, 2023](https://x.com/chameleon_jeff/status/1713551137020706897)

Design also limits what manipulators can do on thin markets. [After the YFI incident on dYdX](https://x.com/chameleon_jeff/status/1726091053491470408), he described isolated-only perps and auto-deleveraging (ADL) as defenses. He also noted that some CEX-style rules fail onchain because "DEX attackers can always split positions".

**Takeaway:** read a venue's margin, liquidation and backstop rules before you trade its long-tail perps.

## 7. Building a trading bot? Measure latency before you optimize it

Crypto is slow compared with traditional HFT. [In Jeff's words](https://x.com/chameleon_jeff/status/1650875274341359619), "Time scales are orders of magnitude larger than tradfi HFT."

So start simple:

> "Even today, you can write a large class of profitable crypto HFT strategies in python."

— [Jeff Yan on X, Apr 9, 2023](https://x.com/chameleon_jeff/status/1645071425731170304)

His setup: one event loop, one state machine that turns feed messages into orders and cancels, and PyPy for speed. Rewrite in a compiled language only once working strategies show what the system needs. [Run it in the cloud, not at home](https://x.com/chameleon_jeff/status/1649776559555747840): "I wouldn't try from your mac unless you live in the relevant AWS datacenter."

Then measure:

- Plot your clock against the matching engine's timestamp.
- Watch round-trip latency during volatile periods.
- Overlay how many messages per second your strategy is processing, so you can tell when you are the bottleneck.

[When his team did this](https://x.com/chameleon_jeff/status/1649770620953980930), the fix was simple: "get a lot more boxes and split up the symbols."

## 8. Keep positions small and lean toward flat

When you start market making, only a few things have to be exactly right: model, strategy and latency. Inventory, sizing and hedging can be 80/20. His starter rule:

> "Keep a small position limit, and bias towards flattening."

— [Jeff Yan on X, Jun 30, 2023](https://x.com/chameleon_jeff/status/1674922359214465024)

Don't assume your buys and sells will even out. They won't:

> "With this strategy you always hit your risk limit on one side. This is why your threshold and/or fair should scale with your position."

— [Jeff Yan on X, Jun 27, 2023](https://x.com/chameleon_jeff/status/1673720508607594496)

To find out whether you have an edge at all, Jeff's same post says to "Compute markouts to determine if you have edge". A markout measures how the price moved in your favor or against you at set intervals after each fill.

**Takeaway:** if your fills don't come out profitable shortly afterward, better sizing won't save you.

## 9. Research with simple priors and expect your edge to decay

Start every idea from a simple story, or you'll end up fitting noise:

> "Your hypotheses should be based on simple priors, or you will just overfit to noise."

— [Jeff Yan on X, Mar 24, 2023](https://x.com/chameleon_jeff/status/1639081516356739072)

Be suspicious of easy wins. Strategies that are easy to backtest draw the most competition:

> "There is no free lunch. Edge and inconvenience are often correlated."

— [Jeff Yan on X, May 15, 2023](https://x.com/chameleon_jeff/status/1658249142551076864)

Every trick stops working eventually. Your research process is what lasts:

> "the most important alpha is the research process. Any specific effect will decay"

— [Jeff Yan on X, Mar 13, 2023](https://x.com/chameleon_jeff/status/1635101000548913153)

## 10. To move size, announce it

Retail threads often cast big buyers as victims of front-running. Jeff argued the opposite:

> "If you want to execute large size, often the best thing to do is announce it."

— [Jeff Yan on X, Mar 13, 2023](https://x.com/chameleon_jeff/status/1635313678013841410)

Once quants know the flow is coming, they compete to supply it. The price still moves, but you pay something close to the "correct" impact. His traditional-finance example is leveraged ETFs, which rebalance predictably at the close.

He also argues that market makers and quants make markets thicker (more "viscous", in his words), so shocks fade faster. That's in his ["viscous fluid" thread](https://x.com/chameleon_jeff/status/1636350311974715393).

## 11. Start small and get to live pnl

You don't need a fund to start:

> "HFT is high enough ROI that it can be tiny. I started with <$10k personally."

— [Jeff Yan on X, May 24, 2023](https://x.com/chameleon_jeff/status/1661237273009029123)

Aim for live pnl first. Polish can wait:

> "The zero to one moment of live pnl should be your first goal."

— [Jeff Yan on X, Mar 21, 2023](https://x.com/chameleon_jeff/status/1637986806749872128)

Start with whatever programming language you already know:

> "If I had started with rust or C++ from day 1, there would've been no trading."

— [Jeff Yan on X, Apr 9, 2023](https://x.com/chameleon_jeff/status/1645071422480617473)

Then put in the hours. [His most-liked thread of the year](https://x.com/chameleon_jeff/status/1632001038772506629) was about work, not markets. While building an automated trading system from scratch, he worked "5am-10pm 7days/week" for months. He says himself that most people don't need to live that way, but it's an honest picture of what it took him.

## What these rules mean for funded traders

This section is our commentary, not Jeff's. If you trade a funded account from an onchain prop firm, several of his rules map directly onto the firm's rules:

- **Small position limits (rule 8)** matter even more when a daily drawdown limit can end the account in one bad session. Size so that a normal losing day stays well inside the limit.
- **Check your fills (rule 2)** applies to the firm as well as the exchange. Find out whether your account trades on the live Hyperliquid book or on a simulated feed, and whether payouts can be checked on a block explorer.
- **Know who pays you (rule 1)** applies to the firm's business model too. Learn whether it earns from your trading or from challenge fees ([how prop firms make money](https://onchainprops.xyz/blog/how-do-prop-firms-make-money)).
- **Liquidation rules (rule 6)** and the firm's own stop-out rules both decide how much a bad trade costs you.

To compare firms on profit split, drawdown rules and payout proof, see our [Hyperliquid prop firm comparison](https://onchainprops.xyz/#firms).

## Key takeaways

- Know who pays you. Your edge is a service.
- Trade where matching is enforced onchain, and check that fills match the book.
- If you have a signal and you're not HFT, cross the spread.
- Collect funding, and hedge it with every cost counted.
- Onchain transparency is data you can trade on.
- Know how a venue liquidates before you size up.
- Measure latency first. Python is fine to start.
- Use small position limits, lean toward flat, and judge your edge by markouts.
- Use simple priors, expect decay, and invest in the research process.
- Start small and get to live pnl.

## FAQ

### Who is Jeff Yan (@chameleon_jeff)?

Jeff Yan is the co-founder of Hyperliquid, an onchain order book exchange for perpetual futures, and the founder of the crypto market-making firm Chameleon Trading. He posts as @chameleon_jeff on X.

### Should I use limit or market orders on Hyperliquid?

Jeff Yan's 2023 advice for traders who aren't running HFT was to take liquidity when you have a signal, because resting orders tend to fill when you're wrong. He made exceptions for skewed fee schedules and orders resting far from the price. Either way, set a limit price on every order.

### Is Hyperliquid funding arbitrage risk-free?

No. Funding can pay well when one side is crowded, but fees, slippage on both legs, funding flipping sign, liquidation risk and the cost of moving collateral can all eat the return.

### Can you build a crypto trading bot in Python?

Jeff Yan said in 2023 that a large class of profitable crypto HFT strategies can be written in Python, using one event loop, one state machine and PyPy for speed, moving to a compiled language only once working strategies show what the system needs.

### How much money do you need to start algorithmic crypto trading?

Jeff Yan said he personally started with under $10,000. His advice was to aim for live pnl first and improve the system later.

### Do these tips apply to prop firm accounts?

Mostly, yes. Small position limits, checking your fills and knowing the liquidation rules matter even more under a prop firm's drawdown limits. Also check whether the firm's accounts trade on the live order book and whether its payouts can be verified onchain.

---

*Credit: compiled from the public 2023 X posts of Jeff Yan (@chameleon_jeff), co-founder of Hyperliquid and founder of Chameleon Trading. Quotes are his, linked to each post. Commentary between quotes is ours. All figures are from 2023. This article is for education only and is not financial advice.*
