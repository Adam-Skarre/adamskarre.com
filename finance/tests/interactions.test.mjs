import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {calculate} from '../model.mjs';
import {caseFromSearch} from '../workspace.mjs';

// In-memory component tests: no browser automation, network loading, or screenshots.
const {JSDOM}=await import(process.env.DOM_TEST_MODULE||'jsdom');
const dom=new JSDOM(await fs.readFile(new URL('../index.html',import.meta.url),'utf8'),{url:'https://portfolio.test/finance/',runScripts:'outside-only'});
Object.assign(globalThis,{window:dom.window,document:dom.window.document,location:dom.window.location});
let copied='';Object.defineProperty(globalThis,'navigator',{value:{clipboard:{writeText:async v=>{copied=v;}}},configurable:true});
const nativeTimeout=globalThis.setTimeout;globalThis.setTimeout=(...args)=>{const handle=nativeTimeout(...args);handle.unref();return handle;};
await import('../app.mjs');
const $=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
const click=s=>$(s).click();
const input=(s,value)=>{$(s).value=value;$(s).dispatchEvent(new dom.window.Event('input',{bubbles:true}));};
const change=(s,value)=>{$(s).value=value;$(s).dispatchEvent(new dom.window.Event('change',{bubbles:true}));};
const metric=i=>all('#underwriting-results .metric-value')[i].textContent;
const percent=value=>(value*100).toFixed(1)+'%';

test('initial render opens the portfolio overview and populates every analytical view',()=>{
  assert.equal($('#error').hidden,true);assert.equal(metric(0),'7.9%');
  assert.equal($('#case-study').hidden,false);assert.equal($('#financial-model').hidden,true);
  assert.equal(document.body.dataset.view,'case-study');assert.ok($('#case-study h1').textContent.includes('Gorman-Rupp'));
  assert.equal(all('.screen-table tbody tr').length,5);
  assert.ok($('#operations-results').textContent.includes('10.6%'));
  assert.ok($('#memo').textContent.includes('Reprice the acquisition'));
});
test('a slider immediately updates the financial results and exact numeric input',()=>{
  input('[data-slider="entryMultiple"]','8');
  assert.equal($('[data-input="entryMultiple"]').value,'8');
  assert.equal(metric(0),percent(calculate({entryMultiple:8}).irr));
  assert.equal($('#error').hidden,true);
});
test('clicking the target-price action solves the return hurdle',()=>{
  click('#reset');click('#apply-target-price');
  assert.equal(metric(0),'20.0%');
  assert.ok(Math.abs(Number($('[data-input="entryMultiple"]').value)-calculate().maxBidMultiple)<1e-6);
});
test('clicking a sensitivity cell applies both assumptions to all linked outputs',()=>{
  click('#reset');click('[data-entry="9"][data-exit="8"]');
  assert.equal($('[data-input="entryMultiple"]').value,'9');
  assert.equal($('[data-input="exitMultiple"]').value,'8');
  assert.equal(metric(0),percent(calculate({entryMultiple:9,exitMultiple:8}).irr));
});
test('an empty input suppresses stale results until every field is valid',()=>{
  input('[data-input="entryMultiple"]','');assert.equal($('#error').hidden,false);
  input('[data-input="exitMultiple"]','10');assert.equal($('#error').hidden,false);
  assert.equal($('#underwriting-results').inert,true);
  input('[data-input="entryMultiple"]','10');assert.equal($('#error').hidden,true);
  assert.equal($('#underwriting-results').inert,false);
});
test('saved comparisons persist and restore their actual assumptions',()=>{
  click('#reset');click('#save-case');click('[data-preset="price"]');click('#save-case');
  assert.equal(all('.comparison-card').length,2);
  assert.equal(JSON.parse(window.localStorage.getItem('skar-investment-cases-v1')).length,2);
  all('[data-load-case]')[0].click();assert.equal(metric(0),'7.9%');
  click('#save-case');assert.equal(all('.comparison-card').length,2);
  all('[data-remove-case]')[0].click();assert.equal(all('.comparison-card').length,1);
});
test('a shared link contains the actual selected case and reopens identical returns',async()=>{
  click('[data-preset="downside"]');click('#share-case');await Promise.resolve();
  const a=caseFromSearch(new URL(copied).search);
  assert.equal(a.caseName,'Downside');assert.equal(a.exitMultiple,7);
  assert.equal(metric(0),percent(calculate(a).irr));assert.equal($('#share-panel').hidden,false);
  click('#close-share');assert.equal($('#share-panel').hidden,true);
});
test('operating initiatives and navigation update the actual analysis',()=>{
  click('#reset');click('#apply-plan');assert.equal($('[data-input="usePlan"]').checked,true);
  assert.equal(metric(0),'10.6%');
  location.hash='screening';window.dispatchEvent(new dom.window.Event('hashchange'));
  assert.equal($('#screening').hidden,false);assert.equal($('#underwriting').hidden,true);
  location.hash='operations';window.dispatchEvent(new dom.window.Event('hashchange'));
  assert.equal($('#operations').hidden,false);
});
test('company filters handle empty results and restore a usable company selection',()=>{
  input('#search','nonexistent-business');assert.equal(all('.screen-table tbody tr').length,0);
  assert.ok($('#screening-results').textContent.includes('No companies meet'));
  input('#search','');change('#min-margin','0.30');assert.equal(all('.screen-table tbody tr').length,1);
  assert.ok($('.screen-table tbody').textContent.includes('Graco'));
  change('#min-margin','0');click('[data-peer="GRC"]');assert.equal($('#valuation-company').value,'GRC');
});
test('cash-flow worksheet exposes live formulas and updates the connected case',()=>{
  click('#reset');location.hash='financial-model';window.dispatchEvent(new dom.window.Event('hashchange'));
  assert.equal($('#financial-model').hidden,false);assert.ok($('.cashflow-sheet').textContent.includes('Levered FCF'));
  assert.equal($('.model-control-disclosure').open,false);$('.model-control-disclosure').open=true;
  click('[data-trace="fcf"][data-year="2"]');assert.ok($('.formula-title').textContent.includes('2028'));assert.ok($('.formula-substitution').textContent.includes('53.916'));
  change('[data-model-param="entryMultiple"]','8');assert.equal($('[data-input="entryMultiple"]').value,'8');assert.equal(metric(0),percent(calculate({entryMultiple:8}).irr));
  assert.equal($('.model-control-disclosure').open,true);
});
test('audited history, LTM bridge and debt evidence are inspectable',()=>{
  click('[data-model-pane="history"]');assert.ok($('#model-worksheet').textContent.includes('702.053'));assert.ok($('#model-worksheet').textContent.includes('106.228'));
  click('[data-model-pane="credit"]');assert.ok($('#model-worksheet').textContent.includes('310.750'));assert.ok($('#model-worksheet').textContent.includes('Combined stress'));
});
test('DCF worksheet applies real sensitivities and exposes reinvestment',()=>{
  click('[data-model-pane="valuation"]');assert.ok($('#model-worksheet').textContent.includes('Reinvestment = NOPAT'));
  click('[data-wacc="0.09"][data-terminal="0.02"]');assert.equal($('[data-input="wacc"]').value,'9');assert.equal($('[data-input="terminalGrowth"]').value,'2');
  change('[data-model-param="terminalRoic"]','15');assert.equal($('[data-input="terminalRoic"]').value,'15');
  click('[data-model-pane="evidence"]');assert.ok($('#model-worksheet').textContent.includes('Source register'));click('#reset');
});
test('invalid worksheet edits hide stale results while leaving controls usable',()=>{
  click('[data-model-pane="cashflow"]');
  input('[data-model-param="entryMultiple"]','');assert.equal($('#model-worksheet').hidden,true);assert.equal($('.model-input-error').hidden,false);
  change('[data-model-param="entryMultiple"]','2');assert.equal($('#error').hidden,false);assert.notEqual($('#financial-model').inert,true);
  change('[data-model-param="entryMultiple"]','10');assert.equal($('#error').hidden,true);assert.equal($('#model-worksheet').hidden,false);assert.equal(metric(0),'7.9%');
});
test('guided portfolio cases change the actual investment model and preserve the written baseline',()=>{
  const original=$('.study-verdict').textContent;
  for(const [id,patch] of [['plan',{usePlan:true}],['downside',{caseName:'Downside',exitMultiple:7}],['price',{entryMultiple:calculate().maxBidMultiple}],['base',{}]]){
    click(`[data-study-case="${id}"]`);
    assert.equal($('[data-study-irr]').textContent,percent(calculate(patch).irr));
    assert.equal(metric(0),percent(calculate(patch).irr));
    assert.equal($(`[data-study-case="${id}"]`).getAttribute('aria-pressed'),'true');
    assert.equal($('.study-verdict').textContent,original);
    assert.equal($('#error').hidden,true);
  }
});
test('custom model assumptions are identified separately on the portfolio overview',()=>{
  input('[data-input="entryMultiple"]','8.3');
  assert.ok($('#study-live-result').textContent.includes('CUSTOM INVESTMENT CASE'));
  assert.equal(all('[data-study-case][aria-pressed="true"]').length,0);
  assert.equal($('[data-study-irr]').textContent,percent(calculate({entryMultiple:8.3}).irr));
  click('[data-study-case="base"]');
});
test('portfolio evidence links open the relevant worksheet without resetting the case',()=>{
  click('[data-study-case="plan"]');click('[data-open-sheet="history"]');
  window.dispatchEvent(new dom.window.Event('hashchange'));
  assert.equal(location.hash,'#financial-model');assert.equal($('#financial-model').hidden,false);
  assert.ok($('#model-worksheet').textContent.includes('Reconcile net income'));
  assert.equal(metric(0),'10.6%');
  click('[data-open-sheet="evidence"]');
  assert.ok($('#model-worksheet').textContent.includes('Source register'));
  click('#reset');
});
test('real transaction research changes earnings credits without mutating the buyout case',()=>{
  location.hash='deal-evidence';window.dispatchEvent(new dom.window.Event('hashchange'));
  assert.equal($('#deal-evidence').hidden,false);
  assert.ok($('#spx-results').textContent.includes('16.11×'));
  input('[data-deal-input="synergyCredit"]','0');
  assert.ok($('#spx-results .deal-formula').textContent.includes('14.20×'));
  assert.equal($('#synergyCredit-output').textContent,'0%');
  input('[data-deal-input="restructuringCredit"]','0');
  assert.ok($('#spx-results').textContent.includes('$288.0m'));
  assert.equal(metric(0),'7.9%');
});
test('Fill-Rite controls distinguish final cash funding from credited economic cost',()=>{
  click('[data-deal="fill"]');
  assert.ok($('#fill-results').textContent.includes('12.90×'));
  input('[data-deal-input="taxCredit"]','0');
  assert.ok($('#fill-results').textContent.includes('15.22×'));
  change('[data-deal-select="priceBasis"]','final');
  assert.ok($('#fill-results .deal-formula').textContent.includes('528.0'));
  assert.ok($('#deal-detail').textContent.includes('Funding reconciliation'));
});
test('missing transaction data is visible and no fabricated multiple is rendered',()=>{
  click('[data-deal="sundyne"]');
  assert.ok($('#deal-detail').textContent.includes('Unavailable'));
  assert.ok($('#deal-detail').textContent.includes('two unknowns'));
  assert.equal(all('#deal-detail [data-deal-input]').length,0);
  click('[data-deal="spx"]');
  assert.equal($('[data-deal-input="synergyCredit"]').value,'0');
});
