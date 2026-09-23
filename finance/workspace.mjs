import {defaults} from './data.mjs';
import {calculate} from './model.mjs';

const keys=Object.keys(defaults).filter(key=>!Array.isArray(defaults[key]));
export function normalizeCase(value){
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid scenario.');
  const result={...defaults};
  for(const key of keys)if(Object.hasOwn(value,key)){
    if(typeof value[key]!==typeof defaults[key])throw new Error('Invalid scenario input.');
    result[key]=value[key];
  }
  calculate(result);
  return result;
}
export function caseParameters(value){
  const a=normalizeCase(value);
  return Object.fromEntries(keys.filter(key=>a[key]!==defaults[key]).map(key=>[key,a[key]]));
}
export function caseFromSearch(search){
  const raw=new URLSearchParams(search).get('s');
  if(raw===null)return {...defaults};
  if(raw.length>5000)throw new Error('The shared scenario is too long.');
  return normalizeCase(JSON.parse(raw));
}
export function caseLink(value,base){
  const url=new URL(base);url.search='';
  const parameters=caseParameters(value);
  if(Object.keys(parameters).length)url.searchParams.set('s',JSON.stringify(parameters));
  url.hash='underwriting';return url.href;
}
export function caseLabel(a){return `${a.caseName} · ${a.entryMultiple.toFixed(2)}× entry · ${a.exitMultiple.toFixed(2)}× exit${a.usePlan?' · Plan on':''}`;}
export function readSavedCases(raw){
  try{
    const parsed=JSON.parse(raw??'[]');if(!Array.isArray(parsed))return [];
    return parsed.slice(0,3).flatMap((row,i)=>{try{return [{id:String(i),a:normalizeCase(row.a)}];}catch{return [];}});
  }catch{return [];}
}
