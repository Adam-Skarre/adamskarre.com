import test from 'node:test';
import assert from 'node:assert/strict';
import {calculate,screenPeers,sensitivity,csv} from '../model.mjs';
import {company,defaults,peers,cases} from '../data.mjs';
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);

test('historical values reconcile to the reported definitions',()=>{
  near(company.ebitda,123.072);near(company.nwc,123.124);
  near(company.cfo-company.capex,88.852);
  assert.equal(peers.length,5);assert.equal(new Set(peers.map(p=>p.ticker)).size,5);
  for(const p of peers){assert.ok(p.url.startsWith('https://'));assert.ok(p.revenue>0&&p.priorRevenue>0);}
});
test('base case first-year cash flow independently reconciles',()=>{
  const r=calculate(),y=r.years[0];
  const rev=682.389*1.04,ebitda=123.072*1.04,da=27.709*1.04;
  const interest=123.072*4.5*.08,tax=(ebitda-da-interest)*.25;
  const capex=rev*.032,deltaNwc=123.124*.04;
  near(y.revenue,rev);near(y.fcf,ebitda-interest-tax-capex-deltaNwc);
  near(r.sponsorEquity,1230.72+1230.72*.02+553.824*.02+20-553.824);
  near(r.irr,.0791822131795652);near(r.moic,1.4637735453615168);
});
test('sources, debt, cash and equity bridge reconcile across scenarios',()=>{
  for(const [caseName,c] of Object.entries(cases))for(const usePlan of [true,false]){
    const r=calculate({caseName,exitMultiple:c.exitMultiple,usePlan});
    near(r.sourceCheck,0);near(r.bridgeCheck,0);
    r.years.forEach((y,i)=>{near(y.cashCheck,0);near(y.debtCheck,0);assert.ok(y.term>=-1e-8&&y.revolver>=0);assert.ok(y.cash>=defaults.minCash-1e-8);if(i){near(y.openingTerm,r.years[i-1].term);near(y.openingCash,r.years[i-1].cash);}});
  }
});
test('maximum bid solves the return hurdle with unchanged operating case and debt',()=>{
  for(const caseName of Object.keys(cases)){const r=calculate({caseName});const bid=calculate({caseName,entryMultiple:r.maxBidMultiple});near(bid.irr,defaults.hurdle);}
});
test('inventory release is cash, never EBITDA; only changes in inventory release recur',()=>{
  const a={usePlan:true,priceEnabled:false,yieldEnabled:false,inventoryEnabled:true,implementationCost:[0,0,0,0,0],growth:0};
  const no=calculate({...a,inventoryEnabled:false}),yes=calculate(a);
  yes.years.forEach((y,i)=>near(y.ebitda,no.years[i].ebitda));
  near(yes.years[0].fcf-no.years[0].fcf,company.cogs/365*8*.35);
  near(yes.years[3].deltaNwc,0);near(yes.years[4].deltaNwc,0);
});
test('disabling every initiative matches the no-plan case exactly',()=>{
  const a=calculate({usePlan:true,priceEnabled:false,yieldEnabled:false,inventoryEnabled:false});const b=calculate({usePlan:false});near(a.irr,b.irr);near(a.dcfEV,b.dcfEV);
});
test('implementation capex is depreciated over five years',()=>{
  const r=calculate({usePlan:true,priceEnabled:false,inventoryEnabled:false});
  r.years.forEach(y=>near(y.da-y.revenue*defaults.daRatio,.6));
});
test('debt cannot be swept below zero; excess cash accumulates',()=>{
  const r=calculate({debtMultiple:.25});assert.ok(r.years.some(y=>y.term===0));assert.ok(r.years.at(-1).cash>20);r.years.forEach(y=>assert.ok(y.term>=0));near(r.bridgeCheck,0);
});
test('zero debt produces no interest and a valid equity return',()=>{
  const r=calculate({debtMultiple:0});assert.equal(r.minCoverage,null);assert.ok(Number.isFinite(r.irr));r.years.forEach(y=>near(y.interest,0));
});
test('unfunded liquidity is surfaced and sponsor returns are unavailable',()=>{
  const r=calculate({capexRatio:.2,revolverLimit:0});assert.equal(r.feasible,false);assert.equal(r.irr,null);assert.equal(r.moic,null);assert.ok(r.years.some(y=>y.shortfall>0));
});
test('revolver draws are capped, charge opening interest and repay before term sweeps',()=>{
  const r=calculate({caseName:'Downside',capexRatio:.085,revolverLimit:200});
  for(const y of r.years){assert.ok(y.revolver<=200+1e-8);if(y.termSweep>0)near(y.revolver,0);near(y.interest,y.openingTerm*.08+y.openingRevolver*.09);}
});
test('terminal working capital uses terminal growth, not year-five forecast growth',()=>{
  const r=calculate();const y=r.years.at(-1),g=defaults.terminalGrowth;
  const expected=y.recurringEbitda*(1+g)-(y.recurringEbitda-y.revenue*defaults.daRatio)*(1+g)*.25-y.revenue*(1+g)*.032-y.nwc*g;
  near(r.terminalFcf,expected);
});
test('sensitivity center matches and price/multiple effects have correct direction',()=>{
  const r=calculate(),m=sensitivity(defaults,[9,10,11],[8,9,10]);near(m[1][1],r.irr);assert.ok(m[0][1]>m[1][1]&&m[1][1]>m[2][1]);assert.ok(m[1][2]>m[1][1]&&m[1][1]>m[1][0]);
});
test('invalid assumptions fail explicitly, including zero vs missing',()=>{
  assert.throws(()=>calculate({entryMultiple:NaN}));assert.throws(()=>calculate({entryMultiple:null}));assert.throws(()=>calculate({terminalGrowth:.08,wacc:.08}));assert.throws(()=>calculate({entryMultiple:2,debtMultiple:8}));assert.throws(()=>calculate({caseName:'Unknown'}));assert.doesNotThrow(()=>calculate({debtMultiple:0}));
});
test('screening and ranking use calculated metrics and retain company exceptions',()=>{
  assert.equal(screenPeers(peers,{maxRevenue:1000})[0].ticker,'GRC');
  assert.deepEqual(screenPeers(peers,{maxLeverage:0,sort:'netLeverage'}).map(p=>p.ticker),['ITT','GGG']);
  assert.equal(screenPeers(peers,{search:'nothing matches'}).length,0);
  near(screenPeers(peers,{search:'ITT'})[0].fcf,547.5);
  near(screenPeers(peers,{search:'FLS'})[0].ebitda,495.378);
});
test('CSV quotes delimiters and neutralizes spreadsheet formula injection',()=>{
  assert.equal(csv([['a,b','"x"','=1+1',-3]]),'"a,b","""x""","\'=1+1","-3"');
});

test('sensitivity marks overfunded acquisition cells unavailable without suppressing valid cells',()=>{
 const a={...defaults,entryMultiple:8,debtMultiple:8};
 const result=sensitivity(a,[7,8],[8,9]);
 assert.deepEqual(result[0],[null,null]);
 near(result[1][1],calculate({...a,exitMultiple:9}).irr);
});
