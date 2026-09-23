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

test('initial render populates all three projects and the memo without an input error',()=>{
  assert.equal($('#error').hidden,true);assert.equal(metric(0),'7.9%');
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
