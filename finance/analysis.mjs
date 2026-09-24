import {company} from './data.mjs';
import {calculate} from './model.mjs';
import {annuals,interim,cashFlowFacts,endMarkets} from './diligence-data.mjs';

export function historicalAudit(){
  return annuals.map((a,i)=>({year:a.year,cfo:cashFlowFacts.reduce((s,row)=>s+row[1][i],0),cfoCheck:cashFlowFacts.reduce((s,row)=>s+row[1][i],0)-a.cfo,cashCheck:a.openingCash+a.cfo+a.investing+a.financing+a.fx-a.cash,marketCheck:endMarkets.reduce((s,m)=>s+m.sales[i],0)-a.revenue}));
}
export function trailingFinancials(){
  const annual=annuals.at(-1), result={};
  for(const key of ['revenue','ebit','da','cfo','capex','netIncome'])result[key]=annual[key]-interim.h125[key]+interim.h126[key];
  result.ebitda=result.ebit+result.da;result.fcf=result.cfo-result.capex;return result;
}
export function stressCases(a){
  const shocks=[
    {name:'Selected case',growth:0,margin:0,rate:0},
    {name:'Demand pressure',growth:-.02,margin:-.01,rate:0},
    {name:'Financing pressure',growth:0,margin:0,rate:.02},
    {name:'Combined stress',growth:-.04,margin:-.02,rate:.02},
    {name:'Severe contraction',growth:-.08,margin:-.04,rate:.03}
  ];
  return shocks.map(s=>{
    const candidate={...a,growth:a.growth+s.growth,marginChange:a.marginChange+s.margin,interestRate:a.interestRate+s.rate};
    try {return {...s,result:calculate(candidate)};}catch{return {...s,result:null};}
  });
}
export function debtCapacity(a){
  // Explicit bounded search, no monotonicity assumption. Resolution: 0.01x EBITDA.
  let best=null;
  for(let i=0;i<=800;i++){
    const multiple=i/100;
    try{const r=calculate({...a,debtMultiple:multiple}),entryNet=(r.initialDebt-a.minCash)/company.ebitda;
      if(r.creditPass&&entryNet<=a.maxLeverage)best={multiple,debt:r.initialDebt,minCoverage:r.minCoverage,maxNetLeverage:Math.max(entryNet,r.maxNetLeverage)};
    }catch{}
  }
  return best;
}
export function requiredExitMultiple(r){
  if(!r.feasible||r.years.at(-1).recurringEbitda<=0)return null;
  const y=r.years.at(-1);return (r.sponsorEquity*Math.pow(1+r.a.hurdle,5)+y.term+y.revolver-y.cash)/(y.recurringEbitda*(1-r.a.exitFee));
}
export function initiativeAttribution(a){
  const keys=['priceEnabled','yieldEnabled','inventoryEnabled'],labels=['Pricing','Process yield','Inventory'];
  const models=Array.from({length:8},(_,mask)=>calculate({...a,usePlan:true,...Object.fromEntries(keys.map((key,i)=>[key,Boolean(mask&(1<<i))&&a[key]]))}));
  if(models.some(r=>!r.feasible))return null;
  const orders=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]],value=[0,0,0];
  for(const order of orders){let mask=0;for(const i of order){const next=mask|(1<<i);value[i]+=(models[next].exitEquity-models[mask].exitEquity)/6;mask=next;}}
  const uplift=models[7].exitEquity-models[0].exitEquity;
  return {contributions:labels.map((label,i)=>({label,value:value[i]})),uplift,check:value.reduce((s,v)=>s+v,0)-uplift};
}
export const cashRows=[
  {key:'revenue',label:'Revenue',group:'Operating forecast'},
  {key:'recurringEbitda',label:'Recurring EBITDA'},
  {key:'implementationCost',label:'Less: implementation expense',sign:-1},
  {key:'ebitda',label:'EBITDA after implementation',total:true},
  {key:'da',label:'Less: depreciation & amortization',sign:-1},
  {key:'ebit',label:'Operating income (EBIT)',total:true},
  {key:'interest',label:'Less: cash interest',sign:-1,group:'Cash available for debt repayment'},
  {key:'taxes',label:'Less: cash taxes',sign:-1},
  {key:'da',label:'Add: depreciation & amortization'},
  {key:'capex',label:'Less: capital expenditure',sign:-1},
  {key:'deltaNwc',label:'Less: increase / (decrease) in NWC',sign:-1},
  {key:'fcf',label:'Levered FCF before principal payments',total:true},
  {key:'ufcf',label:'Unlevered FCF for DCF',total:true,group:'Valuation cash flow — excludes financing'}
];
export function traceCalculation(r,key,index=0){
  const y=r.years[index],p=index?r.years[index-1]:null,a=r.a;
  const f=v=>Number(v).toFixed(3),pct=v=>(v*100).toFixed(3)+'%';
  const plan=a.usePlan?y.plan:{priceRevenue:0,ebitda:0,cost:0,capex:0,inventoryRelease:0};
  const traces={
    revenue:['Prior organic revenue × (1 + growth) + pricing revenue',`${f(p?p.organicRevenue:company.revenue)} × (1 + ${pct(y.growth)}) + ${f(plan.priceRevenue)}`, 'Growth is scenario growth plus the user shift. Pricing revenue includes volume loss.'],
    recurringEbitda:['Organic revenue × modeled margin + initiative EBITDA',`${f(y.organicRevenue)} × ${pct(y.margin)} + ${f(plan.ebitda)}`,'Margin starts at FY2025 operating EBITDA / sales, plus scenario and user changes.'],
    implementationCost:['Scheduled cost × enabled initiative weights',`${f(a.implementationCost[index])} × ${f(a.usePlan?((a.priceEnabled?.25:0)+(a.yieldEnabled?.5:0)+(a.inventoryEnabled?.25:0)):0)}`,'Hypothetical cost allocation: pricing 25%, yield 50%, inventory 25%.'],
    ebitda:['Recurring EBITDA − implementation expense',`${f(y.recurringEbitda)} − ${f(y.implementationCost)}`,'All implementation expense reduces cash earnings in the period.'],
    da:['Revenue × baseline D&A / sales + cumulative initiative capex / 5',`${f(y.revenue)} × ${pct(a.daRatio)} + ${f(y.da-y.revenue*a.daRatio)}`,'Baseline D&A is a simplifying ratio; initiative capex uses five-year straight-line depreciation.'],
    ebit:['EBITDA − depreciation & amortization',`${f(y.ebitda)} − ${f(y.da)}`,'This operating forecast excludes purchase-price allocation and goodwill accounting.'],
    interest:['Opening term debt × rate + opening revolver × (rate + 1%)',`${f(y.openingTerm)} × ${pct(a.interestRate)} + ${f(y.openingRevolver)} × ${pct(a.interestRate+.01)}`,'Year-end draws accrue interest from the following year. Intrayear liquidity and commitment fees are not modeled.'],
    taxes:['max(0, EBIT − cash interest) × tax rate',`max(0, ${f(y.ebit)} − ${f(y.interest)}) × ${pct(a.taxRate)}`,'Simplified cash tax; no NOL carryforward, interest-deduction limitation, or purchase-accounting tax shield.'],
    capex:['Revenue × recurring capex / sales + initiative capex',`${f(y.revenue)} × ${pct(a.capexRatio)} + ${f(plan.capex)}`,'Recurring and initiative capex both consume cash. Maintenance versus growth capex is not disclosed separately.'],
    deltaNwc:['Closing operating NWC − prior operating NWC',`${f(y.nwc)} − ${f(p?p.nwc:company.nwc)}`,'Closing NWC = revenue × baseline NWC / sales − inventory balance release. Only the change enters cash flow.'],
    fcf:['EBITDA − interest − cash taxes − capex − increase in NWC',`${f(y.ebitda)} − ${f(y.interest)} − ${f(y.taxes)} − ${f(y.capex)} − ${f(y.deltaNwc)}`,'Cash available before mandatory principal repayment and cash sweeps. It is not an equity distribution.'],
    ufcf:['EBITDA − max(0, EBIT) × tax rate − capex − increase in NWC',`${f(y.ebitda)} − ${f(Math.max(0,y.ebit)*a.taxRate)} − ${f(y.capex)} − ${f(y.deltaNwc)}`,'Unlevered cash flow uses taxes before financing effects and is discounted at the assumed WACC.']
  };
  const t=traces[key];if(!t)throw new Error('Unknown calculation');
  return {year:y.year,label:cashRows.find(row=>row.key===key)?.label||key,formula:t[0],substitution:t[1],value:y[key],note:t[2],source:'FY2025 Form 10-K, pp.29–31; forward inputs are assumptions'};
}
