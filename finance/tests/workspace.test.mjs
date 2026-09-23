import test from 'node:test';
import assert from 'node:assert/strict';
import {caseFromSearch,caseLink,caseParameters,normalizeCase,readSavedCases} from '../workspace.mjs';
import {calculate} from '../model.mjs';

test('a shared case round-trips all editable assumptions and preserves calculated returns',()=>{
  const a=normalizeCase({caseName:'Downside',entryMultiple:7.25,exitMultiple:7,debtMultiple:3.5,usePlan:true,volumeLoss:.006,priceEnabled:false,growth:.06});
  const link=caseLink(a,'https://portfolio.test/finance/?previous=1#operations');
  const restored=caseFromSearch(new URL(link).search);
  assert.deepEqual(restored,a);assert.equal(calculate(restored).irr,calculate(a).irr);
  assert.equal(new URL(link).hash,'#underwriting');assert.ok(!link.includes('previous'));
});
test('shared scenarios reject invalid values while accepting explicit zero inputs',()=>{
  assert.throws(()=>caseFromSearch('?s=notjson'));
  assert.throws(()=>normalizeCase({entryMultiple:'10'}));
  assert.throws(()=>normalizeCase({usePlan:'false'}));
  assert.throws(()=>normalizeCase({caseName:'Unrecognized'}));
  assert.throws(()=>normalizeCase({debtMultiple:9}));
  assert.equal(normalizeCase({debtMultiple:0}).debtMultiple,0);
  assert.deepEqual(caseParameters({}),{});
});
test('corrupt local comparisons cannot prevent the application from loading',()=>{
  assert.deepEqual(readSavedCases('bad json'),[]);
  assert.deepEqual(readSavedCases('{}'),[]);
  const result=readSavedCases(JSON.stringify([{a:{entryMultiple:8}},{a:{entryMultiple:-20}},{a:{entryMultiple:9}},{a:{entryMultiple:12}}]));
  assert.equal(result.length,2);assert.equal(result[0].a.entryMultiple,8);
});
