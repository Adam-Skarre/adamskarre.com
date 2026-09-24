// Transcribed public financial facts. USD millions (SEC tables report USD thousands).
// A = audited annual statement; U = unaudited interim statement; D = derived.
export const documents = {
  annual:{id:'K25',title:'FY2025 Form 10-K',url:'https://www.sec.gov/Archives/edgar/data/42682/000119312526084820/grc-20251231.htm',filed:'2026-03-02',period:'2025-12-31',assurance:'Audited consolidated statements; EY opinion',locations:'Income p.29; balance sheet p.30; cash flow p.31; revenue Note 2; debt Note 4'},
  interim:{id:'Q26',title:'June 2026 Form 10-Q',url:'https://www.sec.gov/Archives/edgar/data/42682/000119312526317911/grc-20260630.htm',filed:'2026-07',period:'2026-06-30',assurance:'Unaudited interim statements',locations:'Income p.2; balance sheet p.3; cash flow p.4; MD&A'},
  earnings:{id:'E25',title:'FY2025 results & non-GAAP reconciliation',url:'https://www.sec.gov/Archives/edgar/data/42682/000119312526040888/grc-ex99.htm',filed:'2026-02-06',period:'2025-12-31',assurance:'Management non-GAAP presentation',locations:'Adjusted EBITDA reconciliation'},
  fcff:{id:'M01',title:'Damodaran — cash flow to the firm',url:'https://pages.stern.nyu.edu/~adamodar/New_Home_Page/littlebook/cashflows.htm',assurance:'Valuation methodology',locations:'After-tax operating income less reinvestment'},
  terminal:{id:'M02',title:'Damodaran — growth, reinvestment & terminal value',url:'https://pages.stern.nyu.edu/~adamodar/New_Home_Page/valquestions/termvalueexreturns.htm',assurance:'Valuation methodology',locations:'Stable growth and return on capital'},
  pe:{id:'M03',title:'Gompers, Kaplan & Mukharlyamov — What Do Private Equity Firms Say They Do?',url:'https://www.nber.org/papers/w21133',assurance:'Research paper; 2015 working paper / 2016 publication',locations:'Valuation, capital structure and value creation'}
};
export const annuals = [
  {year:2023,revenue:659.511,cogs:463.258,ebit:87.041,da:28.496,netIncome:34.951,cfo:98.225,capex:20.835,cash:30.518,openingCash:6.783,investing:-20.163,financing:-54.527,fx:.200},
  {year:2024,revenue:659.667,cogs:455.339,ebit:91.443,da:27.897,netIncome:40.115,cfo:69.830,capex:14.319,cash:24.213,openingCash:30.518,investing:-11.866,financing:-63.137,fx:-1.132},
  {year:2025,revenue:682.389,cogs:473.242,ebit:95.363,da:27.709,netIncome:53.017,cfo:106.228,capex:17.376,cash:35.083,openingCash:24.213,investing:-15.343,financing:-80.858,fx:.843}
];
// Cash-flow statement signs preserved; values ordered 2023 / 2024 / 2025.
export const cashFlowFacts = [
  ['Net income',[34.951,40.115,53.017],'income'],
  ['Depreciation & amortization',[28.496,27.897,27.709],'noncash'],
  ['LIFO expense',[6.891,5.142,4.396],'noncash'],
  ['Pension expense',[3.604,2.715,2.738],'noncash'],
  ['Pension contributions',[-2.250,-5.089,-2.700],'noncash'],
  ['Stock-based compensation',[3.252,4.008,3.579],'noncash'],
  ['Amortization of debt issuance fees',[3.014,6.405,1.181],'noncash'],
  ['Deferred income tax charge / (benefit)',[-.414,-1.417,10.341],'noncash'],
  ['Gain on sale of property & equipment',[0,-1.195,-.843],'noncash'],
  ['Other adjustments',[1.335,.387,.351],'noncash'],
  ['Accounts receivable',[3.752,1.180,.877],'working'],
  ['Inventories',[.559,-2.031,1.179],'working'],
  ['Accounts payable',[-1.518,1.222,.452],'working'],
  ['Commissions payable',[.009,-3.603,.193],'working'],
  ['Deferred revenue / customer deposits',[5.773,-5.636,.678],'working'],
  ['Accrued expenses & other',[6.316,-1.801,4.240],'working'],
  ['Income taxes',[1.226,2.129,-3.875],'working'],
  ['Benefit obligations',[3.229,-.598,2.715],'working']
];
export const interim = {
  h125:{revenue:342.994,ebit:49.037,da:13.937,cfo:48.888,capex:5.977,netIncome:27.925},
  h126:{revenue:362.658,ebit:57.888,da:14.073,cfo:62.462,capex:7.862,netIncome:37.272},
  balance:{cash:43.595,bookDebt:274.998,receivables:107.775,inventory:87.130}
};
export const endMarkets=[
  {name:'Industrial',sales:[136.978,131.479,139.624]},
  {name:'Fire',sales:[143.551,121.418,128.070]},
  {name:'Agriculture',sales:[83.053,82.224,84.643]},
  {name:'Construction',sales:[86.996,85.149,75.727]},
  {name:'Municipal',sales:[78.528,100.019,103.457]},
  {name:'Petroleum',sales:[23.168,24.188,25.653]},
  {name:'OEM',sales:[37.708,40.343,45.202]},
  {name:'Repair parts',sales:[69.529,74.847,80.013]}
];
export const earningsBridge = [
  {label:'Operating income',value:95.363,type:'reported',source:'annual'},
  {label:'Cash-flow depreciation & amortization',value:27.709,type:'reported',source:'annual'},
  {label:'Operating EBITDA proxy used in the LBO',value:123.072,type:'subtotal',source:'annual'},
  {label:'Other nonoperating expense, net',value:-2.803,type:'reported',source:'annual'},
  {label:'Net-income-based EBITDA',value:120.269,type:'subtotal',source:'earnings'},
  {label:'Facility optimization add-back',value:2.960,type:'management',source:'earnings'},
  {label:'Pension settlement add-back',value:1.166,type:'management',source:'earnings'},
  {label:'LIFO expense add-back',value:4.396,type:'management',source:'earnings'},
  {label:'Company-adjusted EBITDA',value:128.791,type:'subtotal',source:'earnings'}
];
export const debtFacts={principal:310.750,unamortizedFees:3.219,carryingValue:307.531,term:280.750,notes:30,actualRevolver:100,actualNetLeverageLimit:3.5,actualCoverageLimit:3,termRate:.058,pension:5.149,postretirement:24.803};
export const diligenceQuestions = [
  {issue:'Recurring earnings',evidence:'Operating EBITDA is $123.072m; management-adjusted EBITDA is $128.791m.',test:'Reconcile every adjustment to the ledger; reject recurring costs and double-counted pension items.',decision:'The acquisition uses the operating proxy. No management add-back is automatically accepted.',source:'earnings'},
  {issue:'Cash conversion',evidence:'FY2025 CFO includes a $10.341m deferred-tax adjustment and several liability movements.',test:'Bridge tax expense to cash payments and determine which timing differences reverse.',decision:'Do not capitalize one year of CFO as a perpetual cash-flow run rate.',source:'annual'},
  {issue:'Inventory economics',evidence:'Book inventory is $96.457m. The disclosed excess of replacement cost over LIFO cost is about $104.6m.',test:'Obtain SKU aging, LIFO layers, demand variability and service-level data.',decision:'Inventory-day targets based on book costs remain hypotheses; no savings are described as measured.',source:'annual'},
  {issue:'Demand & mix',evidence:'Construction sales fell in 2025 while industrial, municipal and fire markets grew.',test:'Separate orders, backlog conversion, volume, pricing and end-market mix; stress cancellations.',decision:'Diversification does not remove cyclical exposure. The downside includes revenue and margin declines.',source:'annual'},
  {issue:'Financing & debt-like items',evidence:'Debt principal is $310.750m versus a $307.531m carrying value; pension and postretirement liabilities also exist.',test:'Request payoff letters, restricted cash, leases, benefit funding schedules and change-of-control terms.',decision:'The model uses $310.750m reported principal as an estimated payoff, excluding unquantified break costs and accrued interest. Covenant screens are hypothetical.',source:'annual'},
  {issue:'Current trading',evidence:'The June 2026 quarter provides a more recent operating and cash-flow update.',test:'Rebuild LTM from annual minus prior interim plus current interim; distinguish seasonality from sustained growth.',decision:'Show the LTM bridge separately. Keep the original five-year acquisition case anchored to FY2025.',source:'interim'}
];
