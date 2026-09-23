# Investment analysis projects

Three independent educational case studies for Adam Skarre's portfolio:

1. **Acquisition analysis:** five-year Gorman-Rupp LBO, cash-flow and debt schedules, sources and uses, live entry/exit sensitivities, equity return attribution, price at a target IRR, and a DCF cross-check.
2. **Value creation:** pricing, process yield, and inventory initiatives with realization delays, implementation costs, incremental depreciation, and linked financing effects.
3. **Company screener:** five sourced public industrial companies, common EBITDA/FCF definitions, interactive filters, quality-of-earnings exceptions, and hypothetical valuation ranges.

## Run and validate

Serve the repository with any static HTTP server and open `/finance/`. No build, API key, account, or database is required. `node --test finance/tests/model.test.mjs` runs the financial-engine checks. Run `npm install` followed by `npm test` for the full suite, including isolated DOM interaction tests. The test environment requires Node 24 or newer. The module `model.mjs` is shared by the application and verification scripts. The Excel workbook contains a separate formula implementation that is reconciled against this engine during generation.

## Data and honesty

`data.mjs` contains the fixed FY2025 reporting snapshot, source URLs and fiscal dates. Values are stored in USD millions. This is a historical educational exercise prepared in September 2026, not live market data and not a contemporaneous 2025 investment decision. No association with, endorsement by, or work for a financial institution is represented.

The EBITDA proxy is operating income plus cash-flow D&A. It is not company-adjusted EBITDA or a covenant definition. Company-level charges, accounting changes, cash availability, pension obligations and prospective acquisitions must be researched before valuation. The screener preserves important exceptions and does not imply that companies are for sale.

## Modeling conventions

- All transaction terms, discount rates, return hurdles, financing and initiatives are illustrative assumptions.
- One term loan and a capped revolver; beginning-of-period interest, year-end draws, mandatory original-principal amortization, and a 100% cash sweep after minimum liquidity. New revolver borrowing bears interest beginning the next year; no commitment fees or intra-year draw timing are modeled.
- A funding shortfall is shown explicitly; IRR and MOIC are unavailable. No rescue contribution is invented.
- Five-year gross equity returns have only the initial investment and terminal distribution. Annual IRR is therefore `(exit equity / initial equity)^(1/5)-1`. No fund fees, carry or interim dividends are modeled.
- Cash taxes are simplified, with no NOL, interest-deduction, acquisition tax or purchase-accounting analysis. This is not a full three-statement model.
- Minimum cash is funded at acquisition and included in exit cash. Sources and uses show assumed old debt payoff and target cash. Under the debt-free/cash-free convention, old debt payoff cancels in sponsor funding.
- Operating NWC uses receivables + inventory + prepaid/other current assets − accounts payable − accrued liabilities. Inventory initiatives lower the balance; only changes affect period cash flow.
- The DCF is unlevered, discounted at year end, with a perpetual-growth terminal value. Terminal working-capital investment is recomputed at terminal growth. No market-estimated WACC is claimed.
- Excel is the editable default model. Browser changes export as a current-case CSV; they do not alter the downloadable workbook or original base-case PDF.

## Updating

Replace each reported input from the linked source and update its fiscal date, retrieval date and accounting notes. Reconcile operating income, D&A, CFO, capex, cash and debt before calculating the common metrics. Do not blend reported and management-adjusted metrics or treat missing values as zero. Regenerate the workbook and PDF and rerun the engine and cross-implementation checks after any model change.

## Interactive workflow

The homepage teaser recalculates returns as visitors change entry price. The full workspace supports linked sliders and exact inputs, clickable entry/exit sensitivities, a target-return price action, three local comparison snapshots, and URL-based scenario sharing. Comparison data remains in browser local storage; no account or server storage is used. Shared URLs contain only validated public model assumptions.

The HTML, CSS and JavaScript are published directly through the repository's existing GitHub Pages deployment. The PDF and workbook are supporting downloads under Research & memo; they are not required to use the projects.
