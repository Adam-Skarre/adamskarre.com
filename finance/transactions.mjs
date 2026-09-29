// Public announcement snapshots, USD millions. Null means not disclosed in the cited source.
// This selected sample illustrates valuation conventions; it is not a complete market universe.
export const transactionSources={
  fillAnnouncement:{title:'Gorman-Rupp acquisition announcement',date:'2022-04-27',url:'https://www.sec.gov/Archives/edgar/data/42682/000119312522121550/d574496dex992.htm',location:'Opening transaction terms and target financials'},
  fillClosing:{title:'Gorman-Rupp FY2022 Form 10-K',date:'2023',url:'https://www.sec.gov/Archives/edgar/data/42682/000143774923005782/grc20221231_10k.htm',location:'Note 2 — Acquisitions; final consideration and funding'},
  spxAnnouncement:{title:'ITT acquisition announcement',date:'2025-12-05',url:'https://www.sec.gov/Archives/edgar/data/216228/000119312525308605/d25498dex992.htm',location:'Valuation, expected synergies and transaction consideration'},
  spxFinancials:{title:'ITT preliminary prospectus supplement',date:'2025-12-08',url:'https://www.sec.gov/Archives/edgar/data/216228/000119312525310571/d848277d424b5.htm',location:'Summary historical SPX FLOW information; TTM EBITDA reconciliation'},
  sundyneAnnouncement:{title:'Honeywell acquisition announcement',date:'2025-03-04',url:'https://www.honeywell.com/us/en/news/press-releases/2025/03/honeywell-to-acquire-sundyne-to-expand-critical-equipment-portfolio-and-aftermarket-services',location:'Opening transaction terms; multiple expressly tax-adjusted'}
};
export const transactionFacts={
  fill:{target:'Fill-Rite & Sotera',buyer:'Gorman-Rupp',seller:'Tuthill',announced:'2022-04-27',price:525,finalPrice:528,taxBenefit:80,ebitda:34.5,revenue:140,period:'LTM March 31, 2022',funding:{senior:350,subordinated:90,revolver:5,cash:83},source:'fillAnnouncement',closingSource:'fillClosing'},
  spx:{target:'SPX FLOW',buyer:'ITT',seller:'Lone Star',announced:'2025-12-05',price:4775,quotedForwardMultiple:14.2,quotedPostSynergyMultiple:11.5,synergies:80,synergyTiming:'Expected annual run rate by end of year 3',period:'TTM September 27, 2025',netIncome:45.5,da:126.1,netInterest:123.6,taxes:-14.2,reportedEbitda:281,adjustedEbitda:296.4,adjustedEbitdaFY2024:316.7,adjustedEbitda9m2024:224.6,adjustedEbitda9m2025:204.3,adjustments:{saleGain:-1,restructuring:8.4,acquisition:6.5,other:1.5},stockConsideration:700,source:'spxAnnouncement',financialSource:'spxFinancials'},
  sundyne:{target:'Sundyne',buyer:'Honeywell',seller:'Warburg Pincus',announced:'2025-03-04',price:2160,quotedTaxAdjustedMultiple:14.5,taxBenefit:null,ebitda:null,period:'FY2024',source:'sundyneAnnouncement'}
};
function fraction(value,label){if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>1)throw new Error(label+' must be between 0 and 100%.');return value;}
export function fillRiteAnalysis({taxCredit=1,priceBasis='announced'}={}){
  fraction(taxCredit,'Tax benefit credit');
  if(!['announced','final'].includes(priceBasis))throw new Error('Unknown consideration basis.');
  const f=transactionFacts.fill,price=priceBasis==='announced'?f.price:f.finalPrice,creditedBenefit=f.taxBenefit*taxCredit,netValue=price-creditedBenefit;
  return {price,creditedBenefit,netValue,grossMultiple:price/f.ebitda,adjustedMultiple:netValue/f.ebitda,benefitMultiple:creditedBenefit/f.ebitda,margin:f.ebitda/f.revenue,fundingCheck:Object.values(f.funding).reduce((a,b)=>a+b,0)-f.finalPrice};
}
export function spxAnalysis({restructuringCredit=1,acquisitionCredit=1,otherCredit=1,synergyCredit=1}={}){
  for(const [key,value] of Object.entries({restructuringCredit,acquisitionCredit,otherCredit,synergyCredit}))fraction(value,key);
  const f=transactionFacts.spx,reported=f.netIncome+f.da+f.netInterest+f.taxes;
  const acceptedEbitda=reported+f.adjustments.saleGain+f.adjustments.restructuring*restructuringCredit+f.adjustments.acquisition*acquisitionCredit+f.adjustments.other*otherCredit;
  // Forward EBITDA is inferred from a rounded announced multiple, not a separately reported forecast.
  const impliedForwardEbitda=f.price/f.quotedForwardMultiple,creditedSynergies=f.synergies*synergyCredit;
  return {reported,acceptedEbitda,impliedForwardEbitda,creditedSynergies,postSynergyEbitda:impliedForwardEbitda+creditedSynergies,reportedMultiple:f.price/reported,acceptedMultiple:f.price/acceptedEbitda,forwardMultiple:f.quotedForwardMultiple,postSynergyMultiple:f.price/(impliedForwardEbitda+creditedSynergies),impliedGrowth:impliedForwardEbitda/f.adjustedEbitda-1,nineMonthGrowth:f.adjustedEbitda9m2025/f.adjustedEbitda9m2024-1,ltmBridgeCheck:f.adjustedEbitdaFY2024-f.adjustedEbitda9m2024+f.adjustedEbitda9m2025-f.adjustedEbitda,earningsCheck:reported-f.reportedEbitda,managementBridgeCheck:reported+Object.values(f.adjustments).reduce((a,b)=>a+b,0)-f.adjustedEbitda};
}
export function sundyneAnalysis(){return {grossMultiple:null,impliedEbitda:null,quotedMultiple:transactionFacts.sundyne.quotedTaxAdjustedMultiple,reason:'The cited release does not quantify the tax benefit or standalone EBITDA. Dividing gross consideration by a tax-adjusted multiple mixes valuation bases.'};}
export function transactionResearchSnapshot(){return {prepared:'2026-09-28',units:'USD millions',scope:'Selected announced industrial acquisitions; not a complete comparable universe',sources:transactionSources,facts:transactionFacts,calculated:{fill:fillRiteAnalysis(),spx:spxAnalysis(),sundyne:sundyneAnalysis()}};}
