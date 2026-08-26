# Assumptions

Product and data calls where the brief was vague.

1. **Single user.** No login. One wallet row (`id = 1`). The dataset is treated as that person's ledger.

2. **Coins.** One coin per full ₹100 on `SUCCESS` payments with a **positive** amount, **capped at 50 coins per transaction**. Failed, pending, and refunds (negative amounts) earn nothing. The cap is not specified in the brief; 50 keeps a ₹1 crore outlier from minting millions of coins.

3. **Wallet balance.** Seeded as `sum(coins_earned)`. Redemptions subtract from the stored balance under a row lock. We do not recompute from history on every read (faster); seed is the reset path.

4. **Catalogue.** Six rewards (Amazon, Swiggy, Flipkart, statement credit, BookMyShow, Airtel). Costs 100–500 coins so a first redeem is always affordable after seed (~256k coins).

5. **Messy timestamps.** Values arrive as ISO-Z, `+05:30`, date-only, unix milliseconds, and `DD/MM/YYYY HH:mm:ss`. All stored as UTC `timestamptz`. Slash dates are day-first (Indian format), which matches this dataset (e.g. `21/08/2025`).

6. **Status.** `success` is normalised to `SUCCESS`. Anything else unknown becomes `PENDING`.

7. **Category.** `null` or `""` → `Uncategorized`.

8. **Duplicate ids.** ~40 repeated `id`s. The first occurrence is kept; later ones are skipped and logged.

9. **Analytics.** Category chart ignores the category filter so a selected slice still sits in a full donut. Monthly chart ignores the date range when driven from the bar click so the trend stays visible. Table filters (status, search, amount, the other dimension) still reshape both charts.

10. **Currency.** Dataset is INR only; UI formats with `en-IN`.

11. **No auth on redeem.** Fine for a take-home; would be session-bound in production.

12. **Chart outliers.** Spend charts omit rows with `|amount| >= ₹10,00,000`. The table does not. The source file contains at least one ₹99,99,99,999 grocery row that would otherwise hide every other category.
