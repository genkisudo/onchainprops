---
title: Polymarket Prop Firms: Funded Prediction Market Trading Compared
description: Polymarket prop firms compared: evaluation rules, payout methods and what you can verify onchain at Funding Predicts, PolyFundr, PropMarket and more.
seoTitle: Polymarket Prop Firms Compared: Funded Accounts 2026
category: guides
date: 2026-10-29
tldr: Polymarket prop firms sell a one-time evaluation on simulated event-contract accounts priced off live Polymarket order books, then pay 70–90% of profits on funded accounts. Live today are Funding Predicts, PolyFundr, PropMarket, FundMyPrediction and Cashed. None publishes a treasury or payout wallet, so onchain verification is limited to your own payout transfer.
---

Every week someone slides into my DMs with the same question: which Polymarket prop firm actually pays? Fair. A year ago this category barely existed. Now a handful of firms sell funded accounts on event contracts. I read every firm's site and docs so you don't have to. Here's what's live, what the rules say, and what you can check onchain.

**What is a prediction market prop firm?** A prediction market prop firm sells a one-time evaluation. You trade event contracts, usually priced off live Polymarket order books, on a simulated balance. Hit the profit target without breaking the loss limits and you get a funded account. Then you keep a share of profits, typically 80–90%, paid in USDC or fiat.

## How It Differs From Perps Prop Trading

Coming from [Hyperliquid prop firms](https://onchainprops.xyz/#firms)? Three things change:

- **Binary outcomes.** A contract settles at $1 or $0. There's no stop-loss on the way to zero. Gravity doesn't negotiate. That's why firms add price bands and per-position caps.
- **Resolution risk.** Your P&L depends on how a market resolves. Disputed resolutions happen. None of the firms below documents what happens to a funded account when one does.
- **Liquidity per market.** Every market has its own thin book. Firms either simulate fills against real depth or exclude thin markets entirely.

One more thing. Every firm below runs **simulated** accounts. Your trades never touch Polymarket. If that surprises you, read [how prop firms make money](https://onchainprops.xyz/blog/how-do-prop-firms-make-money) first.

## The Polymarket Prop Firms Live Right Now

### Funding Predicts

- **Evaluation:** single phase. $10K–$150K Standard accounts for $85–$535. 6% target, trailing end-of-day drawdown, daily loss limit, 35% consistency rule, 5 minimum trading days, 10–90¢ entry band. 30 days, extendable to 45 ([pricing](https://fundingpredicts.com/), [FAQ](https://fundingpredicts.com/faq)).
- **Payouts:** up to 90% split, weekly, through Rise. KYC and a 7-day wait before the first payout. $100,000 lifetime cap per trader. Its FAQ says crypto payouts are "temporarily under maintenance" ([FAQ](https://fundingpredicts.com/faq)).
- **Onchain:** payout wallet not disclosed. Backed by MyFundedFutures. The site states accounts are simulated and not connected to Polymarket.

Our review: [Funding Predicts](https://onchainprops.xyz/firms/funding-predicts) · [Get a challenge](https://fundingpredicts.com/purchase?ref=ONCHAINPROPS)

### PolyFundr

- **Evaluation:** $5K–$50K for $49–$500. 30% target. 10% daily and 20% total drawdown. 5% max risk per trade. No time limit. No KYC ([tiers](https://support.polyfundr.com/challenges/overview)).
- **Payouts:** 80% split, 90% with an upgrade. USDC on Polygon to any EVM wallet. First payout unlocks at 2% profit. 7-day cooldown. The cap ladder starts at 5% of the account and tops out at $5,000 per payout ([payouts](https://support.polyfundr.com/faq/payouts)).
- **Onchain:** each payout is a Polygon USDC transfer you can see on an explorer. Firm treasury/payout wallet: not disclosed.

### PropMarket

- **Evaluation:** $5K–$100K from $59. 20% target in 30 days. 10% trailing drawdown, no daily limit. 10%-per-market consistency rule. 20–80¢ price band. Polymarket and Kalshi markets ([site](https://prop.market/)).
- **Payouts:** 70/30 split, 90/10 as a paid add-on. Weekly, with a 7-day wait before the first withdrawal. Payout method: not disclosed.
- **Onchain:** nothing disclosed. Evaluations are run by Prop Account, LLC, per its footer.

### FundMyPrediction

- **Evaluation:** $5K–$150K for $49–$665. 10% target, 2% daily loss, 3% trailing drawdown. 3 minimum trading days. 5–95¢ entry band. No time limit ([FAQ](https://fundmyprediction.com/faq)).
- **Payouts:** 80% split, 90% as an add-on. $10 minimum. Decisions "within 24 hours." One-time KYC before your first payout. Payout method: not disclosed.
- **Onchain:** nothing disclosed. Status is mixed. The homepage says "Now open." The FAQ banner still says "launching soon." Schrödinger's prop firm.

### Cashed

- **Evaluation:** no fixed account size. You pay a deposit of $5–$1,500 and it gets multiplied into "Trading Power." The Standard plan is 115×, with a 10% target, 3% daily loss and 6% static drawdown. One account covers Hyperliquid perps and Polymarket markets ([rulebook](https://cashed.fun/rulebook)).
- **Payouts:** 80% starting split. $20 USDC minimum. One payout per 24h, max $10,000 per trader per rolling 24h. New payouts go out in USDC on BNB Smart Chain.
- **Onchain:** the payout feed lives on Discord and the firm wallet isn't disclosed. We haven't verified payouts onchain yet.

Our review: [Cashed](https://onchainprops.xyz/firms/cashed) · [Open an account](https://cashed.fun/join?ref=GENKISUD-209C78)

**Not included:** Propr's Polymarket product. It's still only on Propr's [roadmap](https://www.propr.xyz/roadmap), and its old prediction-market page now returns a 404. FundedPoly is winding down. PolyFunded's site is under maintenance.

## Risks I'd Weigh First

- **It's all simulated.** Payouts come from the firm's revenue. Your real counterparty is the firm's balance sheet. Firm solvency is the risk that matters.
- **Little is verifiable onchain.** No firm here publishes a treasury or payout wallet. PolyFundr's Polygon USDC payouts come closest.
- **Rules change fast.** Cashed amended its payout limits on October 20, 2026. Re-read the rulebook before every purchase. Yes, every one.
- **Resolution edge cases** are undocumented everywhere. Hope is not a risk model.

## FAQ

### What is a polymarket prop firm?

A firm that sells an evaluation priced off Polymarket markets and pays a profit share on a funded, usually simulated, account.

### Is a funded Polymarket account real money on Polymarket?

At the firms above, no. Trades are simulated against live prices. The payouts are real.

### Which prediction market prop firm pays in USDC?

PolyFundr pays in USDC on Polygon. Cashed pays in USDC on BNB Chain. Funding Predicts pays through Rise.

### Can I verify a prediction market funded trader's payouts onchain?

Partly. You can see your own USDC transfer. No firm publishes a payout wallet yet.

---

I'm tracking this category as it grows. Compare firms on [onchainprops.xyz](https://onchainprops.xyz/) and follow [@onchain_props](https://x.com/onchain_props) for updates.
