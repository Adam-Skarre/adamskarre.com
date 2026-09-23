import {company, defaults, cases} from './data.mjs';

export function assumptions(overrides={}) {
  const a={...defaults,...overrides};
  if (!cases[a.caseName]) throw new Error('Select a valid scenario.');
  const bounded={entryMultiple:[2,25],exitMultiple:[2,25],debtMultiple:[0,8],interestRate:[.001,.30],amortization:[0,.25],transactionFee:[0,.1],financingFee:[0,.1],exitFee:[0,.1],minCash:[0,200],revolverLimit:[0,500],taxRate:[0,.5],capexRatio:[0,.2],daRatio:[0,.2],nwcRatio:[0,1],growth:[-.5,.5],marginChange:[-.15,.15],hurdle:[.01,.5],wacc:[.03,.3],terminalGrowth:[0,.08],priceIncrease:[0,.1],volumeLoss:[0,.1],contributionMargin:[0,1],scrapSaving:[0,.05],inventoryDays:[0,45],maxLeverage:[1,10],minCoverage:[1,5]};
  for(const [k,[min,max]] of Object.entries(bounded)) if(typeof a[k]!=='number'||!Number.isFinite(a[k])||a[k]<min||a[k]>max) throw new Error(`${k}: enter a number between ${min} and ${max}.`);
  if(a.terminalGrowth>=a.wacc) throw new Error('Terminal growth must be below the discount rate.');
  for(const k of ['ramp','implementationCost','initiativeCapex']) if(!Array.isArray(a[k])||a[k].length!==5||a[k].some(v=>typeof v!=='number'||!Number.isFinite(v)||v<0)||(k==='ramp'&&a[k].some(v=>v>1))) throw new Error(`Invalid ${k} schedule.`);
  return a;
}

export function planImpact(revenue,year,a) {
  const r=a.ramp[year], cogsRatio=company.cogs/company.revenue;
  const price=a.priceEnabled?a.priceIncrease*r:0, loss=a.priceEnabled?a.volumeLoss*r:0;
  const priceRevenue=revenue*((1-loss)*(1+price)-1);
  const priceEbitda=revenue*(1-loss)*price-revenue*loss*a.contributionMargin;
  const yieldEbitda=a.yieldEnabled?revenue*cogsRatio*a.scrapSaving*r:0;
  const inventoryRelease=a.inventoryEnabled?revenue*cogsRatio/365*a.inventoryDays*r:0;
  const weights=[a.priceEnabled?.25:0,a.yieldEnabled?.5:0,a.inventoryEnabled?.25:0];
  const cost=a.implementationCost[year]*weights.reduce((s,v)=>s+v,0);
  const capex=a.yieldEnabled?a.initiativeCapex[year]:0;
  return {priceRevenue,priceEbitda,yieldEbitda,inventoryRelease,cost,capex,ebitda:priceEbitda+yieldEbitda};
}

export function calculate(overrides={}) {
  const a=assumptions(overrides), scenario=cases[a.caseName], baseMargin=company.ebitda/company.revenue;
  const entryEV=company.ebitda*a.entryMultiple, initialDebt=company.ebitda*a.debtMultiple;
  const transactionFees=entryEV*a.transactionFee, financingFees=initialDebt*a.financingFee;
  const sponsorEquity=entryEV+transactionFees+financingFees+a.minCash-initialDebt;
  if(sponsorEquity<=0) throw new Error('Debt exceeds the purchase funding requirement. Reduce entry leverage.');
  const sellerEquity=entryEV-company.debtPayoff+company.cash;
  const uses=sellerEquity+company.debtPayoff+transactionFees+financingFees+a.minCash;
  const sources=sponsorEquity+initialDebt+company.cash;
  let revenue=company.revenue, nwc=company.nwc, term=initialDebt, revolver=0, cash=a.minCash, initiativeAssets=0;
  const years=[];
  for(let i=0;i<5;i++) {
    const growth=scenario.growth[i]+a.growth-defaults.growth;
    revenue*=1+growth;
    const p=planImpact(revenue,i,a), margin=baseMargin+scenario.marginChange[i]+a.marginChange;
    const actualPlan=a.usePlan?p:{priceRevenue:0,ebitda:0,cost:0,capex:0,inventoryRelease:0};
    const totalRevenue=revenue+actualPlan.priceRevenue, recurringEbitda=revenue*margin+actualPlan.ebitda;
    initiativeAssets+=actualPlan.capex;
    const ebitda=recurringEbitda-actualPlan.cost, da=totalRevenue*a.daRatio+initiativeAssets/5, ebit=ebitda-da;
    const openingTerm=term, openingRevolver=revolver, openingCash=cash;
    const interest=openingTerm*a.interestRate+openingRevolver*(a.interestRate+.01);
    const taxes=Math.max(0,ebit-interest)*a.taxRate;
    const capex=totalRevenue*a.capexRatio+actualPlan.capex;
    const closingNwc=totalRevenue*a.nwcRatio-actualPlan.inventoryRelease, deltaNwc=closingNwc-nwc;
    const fcf=ebitda-interest-taxes-capex-deltaNwc;
    const mandatory=Math.min(openingTerm,initialDebt*a.amortization);
    const available=openingCash+fcf-a.minCash-mandatory;
    const draw=Math.min(Math.max(0,-available),Math.max(0,a.revolverLimit-openingRevolver));
    const shortfall=Math.max(0,-available-draw);
    const availableForSweep=Math.max(0,available+draw);
    const revolverRepay=Math.min(openingRevolver+draw,availableForSweep);
    const termSweep=Math.min(Math.max(0,openingTerm-mandatory),Math.max(0,availableForSweep-revolverRepay));
    term=openingTerm-mandatory-termSweep;
    revolver=openingRevolver+draw-revolverRepay;
    cash=openingCash+fcf+draw-mandatory-revolverRepay-termSweep;
    const ufcf=ebitda-Math.max(0,ebit)*a.taxRate-capex-deltaNwc;
    const coverage=interest>0?ebitda/interest:null, netLeverage=ebitda>0?(term+revolver-cash)/ebitda:null;
    years.push({year:2026+i,growth,revenue:totalRevenue,organicRevenue:revenue,margin,recurringEbitda,ebitda,da,ebit,interest,taxes,netIncome:ebit-interest-taxes,capex,nwc:closingNwc,deltaNwc,fcf,ufcf,openingTerm,openingRevolver,openingCash,mandatory,draw,revolverRepay,termSweep,term,revolver,cash,shortfall,coverage,netLeverage,plan:p,implementationCost:actualPlan.cost,
      cashCheck:cash-(openingCash+fcf+draw-mandatory-revolverRepay-termSweep),debtCheck:term+revolver-(openingTerm+openingRevolver+draw-mandatory-revolverRepay-termSweep)});
    nwc=closingNwc;
  }
  const last=years.at(-1), exitEV=last.recurringEbitda*a.exitMultiple, exitCosts=exitEV*a.exitFee;
  const exitEquity=Math.max(0,exitEV-exitCosts-last.term-last.revolver+last.cash);
  const feasible=years.every(y=>y.shortfall<1e-8);
  const moic=feasible?exitEquity/sponsorEquity:null;
  const irr=feasible?Math.pow(moic,1/5)-1:null;
  const minCoverage=Math.min(...years.filter(y=>y.coverage!==null).map(y=>y.coverage));
  const maxNetLeverage=Math.max(...years.map(y=>y.netLeverage??Infinity));
  const creditPass=feasible&&minCoverage>=a.minCoverage&&maxNetLeverage<=a.maxLeverage;
  const maxBid=(exitEquity/Math.pow(1+a.hurdle,5)+initialDebt-a.minCash-financingFees)/(1+a.transactionFee);
  const terminalRevenue=last.revenue*(1+a.terminalGrowth),terminalEbitda=last.recurringEbitda*(1+a.terminalGrowth);
  const terminalDa=terminalRevenue*a.daRatio,terminalCapex=terminalRevenue*a.capexRatio,terminalDeltaNwc=last.nwc*a.terminalGrowth;
  const terminalFcf=terminalEbitda-Math.max(0,terminalEbitda-terminalDa)*a.taxRate-terminalCapex-terminalDeltaNwc;
  const terminalValue=terminalFcf/(a.wacc-a.terminalGrowth);
  const pvForecast=years.reduce((s,y,i)=>s+y.ufcf/Math.pow(1+a.wacc,i+1),0);
  const pvTerminal=terminalValue/Math.pow(1+a.wacc,5), dcfEV=pvForecast+pvTerminal;
  const bridge=[
    {label:'Entry equity',value:sponsorEquity,total:true},
    {label:'Entry fees',value:-transactionFees-financingFees},
    {label:'Revenue growth',value:(last.revenue-company.revenue)*baseMargin*a.entryMultiple},
    {label:'Margin / operations',value:(last.recurringEbitda-last.revenue*baseMargin)*a.entryMultiple},
    {label:'Exit multiple',value:last.recurringEbitda*(a.exitMultiple-a.entryMultiple)},
    {label:'Debt reduction',value:initialDebt-last.term-last.revolver},
    {label:'Cash change',value:last.cash-a.minCash},
    {label:'Exit fees',value:-exitCosts},
    {label:'Equity floor',value:Math.max(0,-(exitEV-exitCosts-last.term-last.revolver+last.cash))},
    {label:'Exit equity',value:exitEquity,total:true}
  ];
  return {a,entryEV,initialDebt,transactionFees,financingFees,sponsorEquity,sellerEquity,uses,sources,sourceCheck:sources-uses,years,exitEV,exitCosts,exitEquity,moic,irr,feasible,minCoverage:Number.isFinite(minCoverage)?minCoverage:null,maxNetLeverage,creditPass,maxBid:Math.max(0,maxBid),maxBidMultiple:Math.max(0,maxBid)/company.ebitda,dcfEV,pvForecast,pvTerminal,terminalFcf,dcfEquity:dcfEV-company.debtPayoff+company.cash,terminalShare:pvTerminal/dcfEV,bridge,
    bridgeCheck:bridge.slice(0,-1).reduce((s,v)=>s+v.value,0)-bridge.at(-1).value};
}

export function sensitivity(a,entries,exits) {
  return entries.map(entryMultiple=>exits.map(exitMultiple=>{
    const ev=company.ebitda*entryMultiple,debt=company.ebitda*a.debtMultiple;
    if(ev*(1+a.transactionFee)+debt*a.financingFee+a.minCash-debt<=0)return null;
    const r=calculate({...a,entryMultiple,exitMultiple});return r.irr;
  }));
}

export function screenPeers(records,filters={}) {
  const {search='',maxRevenue=10000,minMargin=0,minGrowth=-1,maxLeverage=100,sort='margin'}=filters;
  const result=records.map(p=>({...p,ebitda:p.ebit+p.da,margin:(p.ebit+p.da)/p.revenue,growth:p.revenue/p.priorRevenue-1,fcf:p.cfo-p.capex,netDebt:p.bookDebt-p.cash,netLeverage:(p.bookDebt-p.cash)/(p.ebit+p.da),conversion:(p.cfo-p.capex)/(p.ebit+p.da)}))
    .filter(p=>`${p.name} ${p.ticker} ${p.sector}`.toLowerCase().includes(search.toLowerCase())&&p.revenue<=maxRevenue&&p.margin>=minMargin&&p.growth>=minGrowth&&p.netLeverage<=maxLeverage);
  const direction=sort==='netLeverage'?1:-1;
  return result.sort((a,b)=>direction*(a[sort]-b[sort])||a.name.localeCompare(b.name));
}

export function csv(rows) {
  return rows.map(row=>row.map(value=>{let v=value==null?'':String(value);if(typeof value==='string'&&/^[=+\-@\t\r]/.test(v))v="'"+v;return '"'+v.replaceAll('"','""')+'"';}).join(',')).join('\r\n');
}
