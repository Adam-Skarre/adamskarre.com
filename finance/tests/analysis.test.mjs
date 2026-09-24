import test from 'node:test';
import assert from 'node:assert/strict';
import {company} from '../data.mjs';
import {calculate} from '../model.mjs';
import {historicalAudit,trailingFinancials,initiativeAttribution,debtCapacity,stressCases,requiredExitMultiple,traceCalculation} from '../analysis.mjs';
import {earningsBridge,debtFacts} from '../diligence-data.mjs';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('three audited CFO bridges, cash balances and end markets reconcile independently',()=>{
  for(const row of historicalAudit()){near(row.cfoCheck,0);near(row.cashCheck,0);near(row.marketCheck,0);}
});
test('LTM removes the prior interim period before adding the current interim period',()=>{
  const t=trailingFinancials();near(t.revenue,702.053);near(t.ebitda,132.059);near(t.cfo,119.802);near(t.capex,19.261);near(t.fcf,100.541);
});
test('EBITDA definitions and debt principal reconcile without mixing adjustments',()=>{
  near(95.363+27.709,123.072);near(123.072-2.803,120.269);near(120.269+2.960+1.166+4.396,earningsBridge.at(-1).value);
  near(debtFacts.term+debtFacts.notes,debtFacts.principal);near(debtFacts.principal-debtFacts.unamortizedFees,debtFacts.carryingValue);
});
test('order-independent initiative attribution fully allocates the combined value',()=>{
  const a=calculate().a,attribution=initiativeAttribution(a);near(attribution.check,0);
  near(attribution.uplift,calculate({...a,usePlan:true}).exitEquity-calculate({...a,usePlan:false}).exitEquity);
  const disabled=initiativeAttribution({...a,priceEnabled:false});near(disabled.contributions[0].value,0);near(disabled.check,0);
  const none=initiativeAttribution({...a,priceEnabled:false,yieldEnabled:false,inventoryEnabled:false});near(none.uplift,0);
});
test('unfunded counterfactuals cannot produce an initiative allocation',()=>{
  assert.equal(initiativeAttribution(calculate({caseName:'Downside',capexRatio:.2,revolverLimit:0}).a),null);
});
test('debt capacity meets each constraint and the next grid point does not',()=>{
  const a=calculate().a,c=debtCapacity(a),r=calculate({...a,debtMultiple:c.multiple});assert.ok(r.creditPass);assert.ok((r.initialDebt-a.minCash)/company.ebitda<=a.maxLeverage);
  const next=calculate({...a,debtMultiple:c.multiple+.01});assert.ok(!next.creditPass||(next.initialDebt-a.minCash)/company.ebitda>a.maxLeverage);
});
test('required exit multiple solves the sponsor hurdle',()=>{
  const r=calculate();near(calculate({...r.a,exitMultiple:requiredExitMultiple(r)}).irr,r.a.hurdle);
});
test('stress scenarios change assumptions consistently and expose credit failure',()=>{
  const r=calculate(),s=stressCases(r.a);near(s[0].result.irr,r.irr);assert.ok(s[3].result.irr<0);assert.equal(s[3].result.creditPass,false);near(s[3].result.a.interestRate,.1);near(s[3].result.a.growth,0);
});
test('formula inspector references the selected year and traces cash flow drivers',()=>{
  const r=calculate({usePlan:true}),trace=traceCalculation(r,'fcf',2),y=r.years[2];assert.equal(trace.year,2028);near(trace.value,y.ebitda-y.interest-y.taxes-y.capex-y.deltaNwc);assert.ok(trace.substitution.includes(y.interest.toFixed(3)));assert.throws(()=>traceCalculation(r,'unknown'));
});
