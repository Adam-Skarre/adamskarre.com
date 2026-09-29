import test from 'node:test';
import assert from 'node:assert/strict';
import {fillRiteAnalysis,spxAnalysis,sundyneAnalysis,transactionResearchSnapshot} from '../transactions.mjs';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);

test('Fill-Rite numerator adjustment reconciles without changing the historical denominator',()=>{
  const full=fillRiteAnalysis(),zero=fillRiteAnalysis({taxCredit:0}),half=fillRiteAnalysis({taxCredit:.5});
  close(full.grossMultiple,525/34.5);close(full.adjustedMultiple,445/34.5);
  close(zero.adjustedMultiple,zero.grossMultiple);close(half.netValue,485);
  close(full.grossMultiple-full.adjustedMultiple,80/34.5);
});
test('final Fill-Rite purchase funding remains gross regardless of valuation credit',()=>{
  const r=fillRiteAnalysis({priceBasis:'final',taxCredit:1});
  close(r.price,528);close(r.netValue,448);close(r.fundingCheck,0);
  close(r.price,350+90+5+83);
});
test('SPX historical bridge reconciles and the forecast multiple uses a separate earnings period',()=>{
  const r=spxAnalysis();
  close(r.reported,45.5+126.1+123.6-14.2);close(r.acceptedEbitda,296.4);
  close(r.earningsCheck,0);close(r.managementBridgeCheck,0);
  close(r.ltmBridgeCheck,0);close(r.nineMonthGrowth,(204.3-224.6)/224.6);
  assert.ok(r.nineMonthGrowth<0);assert.ok(r.impliedGrowth>0);
  close(r.acceptedMultiple,4775/296.4);
  close(r.impliedForwardEbitda*14.2,4775);
  assert.equal(r.postSynergyMultiple.toFixed(1),'11.5');
});
test('haircuts affect only their stated denominator and retain the removal of the asset-sale gain',()=>{
  const all=spxAnalysis(),none=spxAnalysis({restructuringCredit:0,acquisitionCredit:0,otherCredit:0,synergyCredit:0});
  close(none.acceptedEbitda,280);close(none.postSynergyMultiple,14.2);
  close(none.impliedForwardEbitda,all.impliedForwardEbitda);
  close(spxAnalysis({synergyCredit:0}).acceptedEbitda,all.acceptedEbitda);
  assert.ok(none.acceptedMultiple>all.acceptedMultiple);
});
test('missing Sundyne inputs remain missing in calculations and export',()=>{
  const r=sundyneAnalysis(),snapshot=JSON.parse(JSON.stringify(transactionResearchSnapshot()));
  assert.equal(r.grossMultiple,null);assert.equal(r.impliedEbitda,null);
  assert.equal(snapshot.facts.sundyne.ebitda,null);assert.equal(snapshot.facts.sundyne.taxBenefit,null);
  assert.ok(snapshot.sources.sundyneAnnouncement.url.startsWith('https://www.honeywell.com/'));
});
test('invalid analyst credits cannot silently produce transaction valuations',()=>{
  for(const bad of [-.01,1.01,NaN,Infinity,'1',null]){
    assert.throws(()=>fillRiteAnalysis({taxCredit:bad}));assert.throws(()=>spxAnalysis({synergyCredit:bad}));
  }
  assert.throws(()=>fillRiteAnalysis({priceBasis:'unknown'}));
});
