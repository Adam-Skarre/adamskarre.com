export const source = {
  title: 'Gorman-Rupp FY2025 earnings release',
  url: 'https://www.sec.gov/Archives/edgar/data/42682/000119312526040888/grc-ex99.htm',
  published: '2026-02-06', period: '2025-12-31', retrieved: '2026-09-23',
  basis: 'Reported annual results. Condensed financial statements in the release are unaudited. USD millions.'
};
export const history = [
  {year:2024,revenue:659.667,cogs:455.339,ebit:91.443,da:27.897,netIncome:40.115,interest:33.621,tax:10.378,cfo:69.830,capex:14.319,cash:24.213,bookDebt:366.597,receivables:87.636,inventory:99.205,prepaids:9.773,payables:24.752,accruals:44.275},
  {year:2025,revenue:682.389,cogs:473.242,ebit:95.363,da:27.709,netIncome:53.017,interest:23.396,tax:16.147,cfo:106.228,capex:17.376,cash:35.083,bookDebt:307.531,receivables:88.378,inventory:96.457,prepaids:13.776,payables:25.885,accruals:49.602}
];
export const company = {...history[1],name:'Gorman-Rupp',ticker:'GRC',sector:'Industrial pumps',source,
  ebitda:history[1].ebit+history[1].da,
  nwc:history[1].receivables+history[1].inventory+history[1].prepaids-history[1].payables-history[1].accruals,
  debtPayoff:310,
  debtPayoffNote:'Illustrative debt payoff assumption of $310m; confirm principal, accrued interest and break costs in diligence. Book debt is $307.531m.'
};
export const cases = {
  Base: {growth:[.04,.04,.04,.04,.04],marginChange:[0,0,0,0,0],exitMultiple:9},
  Upside: {growth:[.06,.06,.05,.05,.04],marginChange:[.003,.006,.009,.01,.01],exitMultiple:10},
  Downside: {growth:[-.08,-.02,.01,.02,.02],marginChange:[-.03,-.03,-.02,-.015,-.01],exitMultiple:7}
};
export const defaults = {
  caseName:'Base',entryMultiple:10,exitMultiple:9,debtMultiple:4.5,interestRate:.08,
  amortization:.01,transactionFee:.02,financingFee:.02,exitFee:.01,minCash:20,revolverLimit:50,
  taxRate:.25,capexRatio:.032,daRatio:company.da/company.revenue,nwcRatio:company.nwc/company.revenue,
  growth:.04,marginChange:0,hurdle:.20,wacc:.10,terminalGrowth:.025,
  usePlan:false,priceEnabled:true,yieldEnabled:true,inventoryEnabled:true,
  priceIncrease:.01,volumeLoss:.0025,contributionMargin:.35,scrapSaving:.006,inventoryDays:8,
  ramp:[.35,.75,1,1,1],implementationCost:[2,1,0,0,0],initiativeCapex:[3,0,0,0,0],
  maxLeverage:5.5,minCoverage:2
};

// Every record uses the same EBITDA proxy: reported operating income + cash-flow D&A.
// Peers are a curated public-company sample, not a list of available acquisition targets.
export const peers = [
  {...company,priorRevenue:659.667,period:'2025-12-31',url:source.url,note:'The operating EBITDA proxy retains facility charges and LIFO expense. Verify add-backs and pension obligations before underwriting.',fit:'Direct pump exposure; central case study.'},
  {name:'Graco',ticker:'GGG',sector:'Fluid handling',revenue:2236.604,priorRevenue:2113.316,ebit:624.797,da:107.433,cfo:683.591,capex:45.669,bookDebt:24.696,cash:624.083,period:'2025-12-26',url:'https://www.sec.gov/Archives/edgar/data/42888/000004288826000019/ggg01262026exhibit991q4.htm',note:'Reported operating profit includes a $14.061m contingent consideration benefit. This proxy retains it; normalize before valuation.',fit:'Fluid handling benchmark; broader products and higher margins.'},
  {name:'Donaldson',ticker:'DCI',sector:'Filtration',revenue:3690.9,priorRevenue:3586.3,ebit:495.4,da:99.5,cfo:418.8,capex:78.9,bookDebt:668.3,cash:180.4,period:'2025-07-31',url:'https://ir.donaldson.com/news/news-details/2025/Donaldson-Reports-Record-Fourth-Quarter-Full-Year-2025-Sales-and-Earnings/default.aspx',note:'July fiscal year. Reported earnings include $62m of impairment expense. FCF here excludes proceeds from asset sales.',fit:'Adjacent industrial technology benchmark, not a pure pump peer.'},
  {name:'Flowserve',ticker:'FLS',sector:'Pumps & flow control',revenue:4729.260,priorRevenue:4557.806,ebit:399.924,da:95.454,cfo:505.884,capex:70.927,bookDebt:1575.078,cash:760.183,period:'2025-12-31',url:'https://ir.flowserve.com/news-events/news-details/2026/Flowserve-Corporation-Reports-Fourth-Quarter-and-Full-Year-2025-Results/default.aspx',note:'Operating income includes a $140.092m asbestos divestiture loss; CFO includes a $199m related cash contribution. Normalize both together.',fit:'Pump and valve exposure; materially larger than the central case.'},
  {name:'ITT',ticker:'ITT',sector:'Engineered components',revenue:3938.5,priorRevenue:3630.7,ebit:684.5,da:143.2,cfo:668.8,capex:121.3,bookDebt:782.8,cash:1742.9,period:'2025-12-31',url:'https://investors.itt.com/news-releases/news-release-details/itt-reports-fourth-quarter-earnings-share-eps-164-adjusted-eps',note:'Year-end cash reflects an equity raise ahead of SPX FLOW. Net cash is not a steady-state financing assumption. FCF excludes $7.9m of capex incentives.',fit:'Industrial process exposure within a diversified group.'}
];
