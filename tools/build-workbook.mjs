import fs from 'node:fs/promises';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
import {company,history,source,defaults,cases,peers} from '../finance/data.mjs';
import {calculate,screenPeers} from '../finance/model.mjs';

const out=new URL('../outputs/pe-portfolio/',import.meta.url).pathname;
await fs.mkdir(out,{recursive:true});
const wb=Workbook.create();
const names=['Summary','Assumptions','Forecast','Debt','Valuation','Operations','Company Screen','Inputs'];
const sheets=Object.fromEntries(names.map(name=>[name,wb.worksheets.add(name)]));
const navy='#12263C',blue='#0000CC',green='#008000',muted='#607080',num='#,##0.0;(#,##0.0);"-"',percent='0.0%;(0.0%);"-"',multiple='0.00"x"',years=['E','F','G','H','I'];
function v(s,cell,value){s.getRange(cell).values=[[value]];if(typeof value==='number')s.getRange(cell).format.font.color=blue;}
function f(s,cell,formula){s.getRange(cell).formulas=[[formula]];s.getRange(cell).format.font.color=formula.includes('!')?green:'#000000';}
function label(s,row,text){v(s,`C${row}`,text);}
function note(s,row,text){v(s,`C${row}`,text);s.getRange(`C${row}:I${row}`).format.font={name:'Arial',size:10,color:muted,italic:true};}
function total(s,row,range=`C${row}:I${row}`){s.getRange(range).format.font.bold=true;s.getRange(range).format.borders={top:{style:'thin',color:'#A8B7C6'}};}
function section(s,row,title){label(s,row,title);s.getRange(`C${row}:I${row}`).format.fill='#EAF0F6';s.getRange(`C${row}:I${row}`).format.font.bold=true;s.getRange(`C${row}:I${row}`).format.rowHeight=26;}
function ratio(s,row,fmt=percent){s.getRange(`D${row}:I${row}`).setNumberFormat(fmt);s.getRange(`C${row}:I${row}`).format.font.italic=true;}
function header(s,row){s.getRange(`E${row}:I${row}`).values=[[2026,2027,2028,2029,2030]];s.getRange(`E${row}:I${row}`).setNumberFormat('0"E"');s.getRange(`C${row}:I${row}`).format.fill=navy;s.getRange(`C${row}:I${row}`).format.font={name:'Arial',size:10,bold:true,color:'#FFFFFF'};s.getRange(`D${row}:I${row}`).format.horizontalAlignment='center';}
function selected(s){label(s,4,'Case selected');f(s,'E4',"='Assumptions'!E5");s.getRange('E4').format.borders={preset:'outside',style:'dotted',color:'#8B9CAE'};s.getRange('E4').format.horizontalAlignment='center';}
for(const [name,s] of Object.entries(sheets)){
  s.showGridLines=false;s.getRange('A1:P80').format.font={name:'Arial',size:10,color:'#000000'};
  s.getRange('A1:P80').format.rowHeight=20;s.getRange('A1:P80').format.verticalAlignment='center';
  s.getRange('A1:B80').format.columnWidth=2;s.getRange('C1:C80').format.columnWidth=45;
  s.getRange('D1:P80').format.columnWidth=16;s.getRange('D1:P80').setNumberFormat(num);
  v(s,'C2',name==='Summary'?'Gorman-Rupp investment analysis':name);s.getRange('C2:I2').format.font={name:'Arial',size:16,bold:true,color:navy};s.getRange('C2:I2').format.rowHeight=30;
  s.getRange('C3:I3').format.borders={bottom:{style:'thin',color:'#BCC9D6'}};
  if(!['Assumptions','Inputs','Company Screen'].includes(name))selected(s);
  if(['Forecast','Debt','Operations'].includes(name)){header(s,6);s.freezePanes.freezeRows(6);s.freezePanes.freezeColumns(3);}
}
sheets.Summary.tabColor=navy;sheets.Assumptions.tabColor='#4976A0';sheets.Inputs.tabColor='#D5C7AC';

// Original reported source data; no downstream calculations feed this section.
const inp=sheets.Inputs;
v(inp,'C4','USD millions; reported annual financials');inp.getRange('D6:E6').values=[['2024A','2025A']];
const inputRows={7:['Revenue','revenue'],8:['Cost of products sold','cogs'],9:['Operating income','ebit'],10:['Net income','netIncome'],11:['Depreciation and amortization','da'],12:['Interest expense','interest'],13:['Income tax expense','tax'],14:['Operating cash flow','cfo'],15:['Gross capital expenditure','capex'],16:['Cash and cash equivalents','cash'],17:['Book debt','bookDebt'],18:['Receivables','receivables'],19:['Inventory','inventory'],20:['Prepaid / other current assets','prepaids'],21:['Accounts payable','payables'],22:['Accrued liabilities','accruals']};
for(const [r,[text,key]]of Object.entries(inputRows)){label(inp,r,text);inp.getRange(`D${r}:E${r}`).values=[[history[0][key],history[1][key]]];inp.getRange(`D${r}:E${r}`).format.font.color=blue;}
label(inp,23,'Assumed debt payoff (hypothetical)');v(inp,'E23',company.debtPayoff);
label(inp,24,'Company-reported adjusted EBITDA');inp.getRange('D24:E24').values=[[124.646,128.791]];inp.getRange('D24:E24').format.font.color=blue;
note(inp,26,'Source: audited FY2025 10-K, March 2, 2026, pp.29-31.');v(inp,'C27',source.url);inp.getRange('C27').format.font={name:'Arial',size:10,color:green};
note(inp,29,'Audited statements. Data checked September 23, 2026. Model version 2.');
note(inp,30,'Payoff is an assumption. Confirm principal, accrued interest and break costs in diligence.');
note(inp,31,'Book debt includes carrying-value adjustments; it is not assumed to equal debt repayment.');
note(inp,32,'Operating EBITDA uses operating income + D&A; management adjustments are separate.');
v(inp,'C34','Adjusted EBITDA source: FY2025 earnings reconciliation, February 6, 2026.');
v(inp,'C35','https://www.sec.gov/Archives/edgar/data/42682/000119312526040888/grc-ex99.htm');

const a=sheets.Assumptions;
label(a,4,'Scenario: 1 Base / 2 Upside / 3 Downside');v(a,'E4',1);a.getRange('E4').setNumberFormat('0');a.getRange('E4').dataValidation={rule:{type:'whole',operator:'between',formula1:1,formula2:3}};
label(a,5,'Case selected');f(a,'E5','=CHOOSE(E4,"Base","Upside","Downside")');a.getRange('E5').format.font.color=green;
const globals={7:['Include operating plan (0 no / 1 yes)',0],9:['Entry EV / EBITDA',10],10:['Initial debt / EBITDA',4.5],12:['Exit multiple: Base',9],13:['Exit multiple: Upside',10],14:['Exit multiple: Downside',7],15:['Annual term interest rate',.08],16:['Amortization / original debt',.01],17:['Transaction fees / entry EV',.02],18:['Financing fees / initial debt',.02],19:['Exit fees / exit EV',.01],20:['Minimum cash',20],21:['Revolver capacity',50],22:['Cash tax rate',.25],23:['Recurring capex / revenue',.032],26:['Target equity IRR',.20],27:['DCF discount rate',.10],28:['Terminal growth',.025],29:['Pricing initiative (0 no / 1 yes)',1],30:['Process yield initiative (0 no / 1 yes)',1],31:['Inventory initiative (0 no / 1 yes)',1],32:['Full-run-rate price increase',.01],33:['Full-run-rate volume loss',.0025],34:['Lost-volume contribution margin',.35],35:['Savings / baseline COGS',.006],36:['Inventory days reduction',8],37:['Revenue growth shift (percentage points)',0],38:['EBITDA margin shift (percentage points)',0],55:['Initiative asset life (years)',5],56:['Maximum year-end net leverage',5.5],57:['Minimum interest coverage',2],58:['Terminal return on invested capital',.12]};
for(const [r,[text,value]]of Object.entries(globals)){label(a,r,text);v(a,`E${r}`,value);a.getRange(`E${r}`).format.fill='#FFF6D8';}
label(a,11,'Exit EV / EBITDA: active');f(a,'E11','=CHOOSE($E$4,E12,E13,E14)');total(a,11);
label(a,24,'Historical D&A / revenue');f(a,'E24',"='Forecast'!D14/'Forecast'!D7");
label(a,25,'Historical operating NWC / revenue');f(a,'E25',"='Forecast'!D19/'Forecast'!D7");
for(const r of [15,16,17,18,19,22,23,24,25,26,27,28,32,33,34,35,37,38,58])a.getRange(`E${r}`).setNumberFormat(percent);
a.getRange('E33').setNumberFormat('0.00%');
for(const r of [9,10,11,12,13,14,56,57])a.getRange(`E${r}`).setNumberFormat(multiple);
for(const r of [7,29,30,31]){a.getRange(`E${r}`).setNumberFormat('0');a.getRange(`E${r}`).dataValidation={rule:{type:'whole',operator:'between',formula1:0,formula2:1}};}
for(const r of [36,55])a.getRange(`E${r}`).setNumberFormat('0');
header(a,41);label(a,42,'Revenue growth: active');label(a,43,'Base');label(a,44,'Upside');label(a,45,'Downside');label(a,47,'EBITDA margin change: active');label(a,48,'Base');label(a,49,'Upside');label(a,50,'Downside');
for(const [i,col]of years.entries()){
  f(a,`${col}42`,`=IF(CHOOSE($E$4,ISBLANK(${col}43),ISBLANK(${col}44),ISBLANK(${col}45)),NA(),IF(ISNUMBER(CHOOSE($E$4,${col}43,${col}44,${col}45)),CHOOSE($E$4,${col}43,${col}44,${col}45)+$E$37,NA()))`);
  f(a,`${col}47`,`=IF(CHOOSE($E$4,ISBLANK(${col}48),ISBLANK(${col}49),ISBLANK(${col}50)),NA(),IF(ISNUMBER(CHOOSE($E$4,${col}48,${col}49,${col}50)),CHOOSE($E$4,${col}48,${col}49,${col}50)+$E$38,NA()))`);
  for(const [name,row]of [['Base',43],['Upside',44],['Downside',45]])v(a,`${col}${row}`,cases[name].growth[i]);
  for(const [name,row]of [['Base',48],['Upside',49],['Downside',50]])v(a,`${col}${row}`,cases[name].marginChange[i]);
}
for(const r of [42,43,44,45,47,48,49,50])ratio(a,r);
total(a,42);total(a,47);
for(const [row,text,values]of [[52,'Initiative realization',defaults.ramp],[53,'Implementation expense before toggles',defaults.implementationCost],[54,'Process yield capex',defaults.initiativeCapex]]){label(a,row,text);a.getRange(`E${row}:I${row}`).values=[values];a.getRange(`E${row}:I${row}`).format.font.color=blue;a.getRange(`E${row}:I${row}`).format.fill='#FFF6D8';}
ratio(a,52);note(a,60,'Blue inputs are editable; black formulas calculate locally; green formulas link to other sheets.');note(a,61,'Hypothetical terms. No live share prices, financing commitments or observed acquisition multiples.');
note(a,62,'Revolver rate = term rate + 1 percentage point. Full remaining cash sweeps debt.');
a.freezePanes.freezeRows(5);

const forecast=sheets.Forecast,debt=sheets.Debt,val=sheets.Valuation,ops=sheets.Operations;
const forecastLabels={7:'Organic revenue',8:'Organic revenue growth',9:'Operating EBITDA margin before initiatives',10:'Total revenue',11:'Recurring EBITDA',12:'Implementation expense',13:'EBITDA after implementation',14:'Depreciation and amortization',15:'Operating income',16:'Cash interest expense',17:'Cash taxes',18:'Capital expenditure',19:'Closing operating working capital',20:'Change in operating working capital',21:'Levered FCF before principal payments',22:'Unlevered free cash flow',23:'Net income (simplified)',27:'Year-end discount factor',28:'PV of unlevered free cash flow'};
for(const [r,text]of Object.entries(forecastLabels))label(forecast,r,text);
v(forecast,'D6','2025A');
const histForm={7:"='Inputs'!E7",8:"='Inputs'!E7/'Inputs'!D7-1",9:'=D11/D7',10:'=D7',11:"='Inputs'!E9+'Inputs'!E11",12:'=0',13:'=D11',14:"='Inputs'!E11",15:"='Inputs'!E9",16:"='Inputs'!E12",17:"='Inputs'!E13",18:"='Inputs'!E15",19:"=SUM('Inputs'!E18:E20)-SUM('Inputs'!E21:E22)"};
for(const [r,x]of Object.entries(histForm))f(forecast,`D${r}`,x);
const debtLabels={7:'Opening term loan',8:'Opening revolver',9:'Cash interest expense',10:'Opening cash',11:'Levered FCF before principal payments',12:'Mandatory term amortization',13:'Cash after minimum cash and amortization',14:'Revolver draw',15:'Unfunded liquidity requirement',16:'Cash available for sweep',17:'Revolver repayment',18:'Term loan cash sweep',19:'Closing term loan',20:'Closing revolver',21:'Closing cash',22:'EBITDA / interest coverage',23:'Year-end net leverage',24:'Debt roll-forward difference',25:'Cash roll-forward difference'};
for(const [r,text]of Object.entries(debtLabels))label(debt,r,text);
const opLabels={7:'Revenue before initiatives',8:'Realization rate',9:'Effective price increase',10:'Effective volume loss',11:'Incremental pricing revenue',12:'Pricing EBITDA contribution',13:'Process yield EBITDA contribution',14:'Total recurring EBITDA uplift',15:'Implementation expense',16:'Incremental capex',17:'Reduction in closing inventory',18:'Cumulative initiative capital expenditure'};
for(const [r,text]of Object.entries(opLabels))label(ops,r,text);
for(const [i,c]of years.entries()){
  const p=i?years[i-1]:'D';
  const formulas={7:`=${p}7*(1+${c}8)`,8:`='Assumptions'!${c}42`,9:`=$D$9+'Assumptions'!${c}47`,10:`=${c}7+'Operations'!${c}11*'Assumptions'!$E$7`,11:`=${c}7*${c}9+'Operations'!${c}14*'Assumptions'!$E$7`,12:`='Operations'!${c}15*'Assumptions'!$E$7`,13:`=${c}11-${c}12`,14:`=${c}10*'Assumptions'!$E$24+'Operations'!${c}18/'Assumptions'!$E$55*'Assumptions'!$E$7`,15:`=${c}13-${c}14`,16:`='Debt'!${c}9`,17:`=MAX(0,${c}15-${c}16)*'Assumptions'!$E$22`,18:`=${c}10*'Assumptions'!$E$23+'Operations'!${c}16*'Assumptions'!$E$7`,19:`=${c}10*'Assumptions'!$E$25-'Operations'!${c}17*'Assumptions'!$E$7`,20:`=${c}19-${p}19`,21:`=${c}13-${c}16-${c}17-${c}18-${c}20`,22:`=${c}13-MAX(0,${c}15)*'Assumptions'!$E$22-${c}18-${c}20`,23:`=${c}15-${c}16-${c}17`,27:`=1/(1+'Assumptions'!$E$27)^(${c}$6-2025)`,28:`=${c}22*${c}27`};
  for(const [r,x]of Object.entries(formulas))f(forecast,`${c}${r}`,x);
  const debtFormulas={7:i?`=${p}19`:"='Valuation'!$E$9",8:i?`=${p}20`:'=0',9:`=${c}7*'Assumptions'!$E$15+${c}8*('Assumptions'!$E$15+0.01)`,10:i?`=${p}21`:"='Assumptions'!$E$20",11:`='Forecast'!${c}21`,12:`=MIN(${c}7,'Valuation'!$E$9*'Assumptions'!$E$16)`,13:`=${c}10+${c}11-'Assumptions'!$E$20-${c}12`,14:`=MIN(MAX(0,-${c}13),MAX(0,'Assumptions'!$E$21-${c}8))`,15:`=MAX(0,-${c}13-${c}14)`,16:`=MAX(0,${c}13+${c}14)`,17:`=MIN(${c}8+${c}14,${c}16)`,18:`=MIN(MAX(0,${c}7-${c}12),MAX(0,${c}16-${c}17))`,19:`=${c}7-${c}12-${c}18`,20:`=${c}8+${c}14-${c}17`,21:`=${c}10+${c}11+${c}14-${c}12-${c}17-${c}18`,22:`=IF(${c}9=0,"n.a.",'Forecast'!${c}13/${c}9)`,23:`=IF('Forecast'!${c}13<=0,"n.a.",(${c}19+${c}20-${c}21)/'Forecast'!${c}13)`,24:`=${c}19+${c}20-(${c}7+${c}8+${c}14-${c}12-${c}17-${c}18)`,25:`=${c}21-(${c}10+${c}11+${c}14-${c}12-${c}17-${c}18)`};
  for(const [r,x]of Object.entries(debtFormulas))f(debt,`${c}${r}`,x);
  const opFormulas={7:`='Forecast'!${c}7`,8:`='Assumptions'!${c}52`,9:`='Assumptions'!$E$29*'Assumptions'!$E$32*${c}8`,10:`='Assumptions'!$E$29*'Assumptions'!$E$33*${c}8`,11:`=${c}7*((1-${c}10)*(1+${c}9)-1)`,12:`=${c}7*(1-${c}10)*${c}9-${c}7*${c}10*'Assumptions'!$E$34`,13:`='Assumptions'!$E$30*${c}7*('Inputs'!$E$8/'Inputs'!$E$7)*'Assumptions'!$E$35*${c}8`,14:`=SUM(${c}12:${c}13)`,15:`='Assumptions'!${c}53*('Assumptions'!$E$29*0.25+'Assumptions'!$E$30*0.5+'Assumptions'!$E$31*0.25)`,16:`='Assumptions'!${c}54*'Assumptions'!$E$30`,17:`='Assumptions'!$E$31*${c}7*('Inputs'!$E$8/'Inputs'!$E$7)/365*'Assumptions'!$E$36*${c}8`,18:`=SUM($E16:${c}16)`};
  for(const [r,x]of Object.entries(opFormulas))f(ops,`${c}${r}`,x);
}
for(const r of [8,9])ratio(forecast,r);forecast.getRange('E27:I27').setNumberFormat('0.000x');
for(const r of [11,13,21,22,28])total(forecast,r);
for(const r of [19,20,21])total(debt,r);for(const r of [22,23])ratio(debt,r,multiple);
debt.getRange('E24:I25').setNumberFormat('0.00;(0.00);0.00');debt.getRange('E24:I25').format.font.color='#000000';
debt.getRange('E15:I15').conditionalFormats.add('cellIs',{operator:'greaterThan',formula:0.000001,format:{fill:'#FCE3DF',font:{color:'#A33E38',bold:true}}});
for(const r of [8,9,10])ratio(ops,r);total(ops,14);
note(forecast,31,'USD millions. Historical EBITDA proxy = reported operating income + cash-flow D&A.');note(forecast,32,'Cash taxes are simplified. No NOLs, interest deduction limits or acquisition tax effects.');note(forecast,33,'This is a cash-flow acquisition model, not a full three-statement / purchase-accounting model.');
note(debt,28,'Interest uses opening balances; new draws occur at year end. No intra-year timing or commitment fee.');note(debt,29,'A funding shortfall suppresses return outputs. No unmodeled equity rescue is assumed.');
note(ops,21,'Targets and costs are hypothetical. This sheet calculates the proposed initiatives.');note(ops,22,'They enter the forecast only when Include operating plan = 1 on Assumptions.');note(ops,23,'Inventory release lowers the balance; only the change affects period cash flow.');note(ops,24,'Implementation costs: pricing 25%, process yield 50%, inventory 25% of each year’s budget.');

const valueLabels={7:'Entry operating EBITDA proxy',8:'Entry enterprise value',9:'Initial term debt',10:'Transaction fees',11:'Financing fees',12:'Minimum cash at entry',13:'Sponsor equity required',15:'Purchase of seller equity',16:'Refinance assumed debt payoff',17:'Transaction and financing fees',18:'Fund minimum cash',19:'Total uses',21:'Sponsor equity',22:'New term debt',23:'Target cash',24:'Total sources',25:'Sources less uses',28:'Exit recurring EBITDA',29:'Exit enterprise value',30:'Exit transaction costs',31:'Closing term loan and revolver',32:'Closing cash',33:'Exit equity proceeds',34:'Gross sponsor MOIC',35:'Gross sponsor IRR',36:'Maximum entry EV at target IRR',37:'Maximum entry multiple',40:'Discount rate',41:'Terminal growth',42:'Terminal revenue',43:'Terminal EBITDA',44:'Terminal depreciation',45:'Terminal NOPAT',46:'Terminal reinvestment (growth / ROIC)',47:'Terminal unlevered cash flow',48:'Terminal value',49:'PV of explicit cash flows',50:'PV of terminal value',51:'DCF enterprise value',52:'Illustrative DCF equity value'};
for(const [r,text]of Object.entries(valueLabels))label(val,r,text);
const vf={7:"='Inputs'!E9+'Inputs'!E11",8:"=E7*'Assumptions'!E9",9:"=E7*'Assumptions'!E10",10:"=E8*'Assumptions'!E17",11:"=E9*'Assumptions'!E18",12:"='Assumptions'!E20",13:'=SUM(E8,E10:E12)-E9',15:"=E8-'Inputs'!E23+'Inputs'!E16",16:"='Inputs'!E23",17:'=SUM(E10:E11)',18:'=E12',19:'=SUM(E15:E18)',21:'=E13',22:'=E9',23:"='Inputs'!E16",24:'=SUM(E21:E23)',25:'=E24-E19',28:"='Forecast'!I11",29:"=E28*'Assumptions'!E11",30:"=E29*'Assumptions'!E19",31:"='Debt'!I19+'Debt'!I20",32:"='Debt'!I21",33:'=MAX(0,E29-E30-E31+E32)',34:"=IF(MAX('Debt'!E15:I15)>0.00000001,\"n.a.\",IF(E13<=0,\"n.a.\",E33/E13))",35:'=IF(ISNUMBER(E34),E34^(1/5)-1,"n.a.")',36:"=IF(ISNUMBER(E35),MAX(0,(E33/(1+'Assumptions'!E26)^5+E9-E12-E11)/(1+'Assumptions'!E17)),\"n.a.\")",37:'=IF(ISNUMBER(E36),E36/E7,"n.a.")',40:"='Assumptions'!E27",41:"='Assumptions'!E28",42:"='Forecast'!I10*(1+E41)",43:'=E28*(1+E41)',44:"=E42*'Assumptions'!E24",45:"=E43-E44-MAX(0,E43-E44)*'Assumptions'!E22",46:"=IF('Assumptions'!E58>0,MAX(0,E45)*E41/'Assumptions'!E58,NA())",47:"=E45-E46",48:'=IF(E40>E41,E47/(E40-E41),NA())',49:"=SUM('Forecast'!E28:I28)",50:'=E48/(1+E40)^5',51:'=SUM(E49:E50)',52:"=E51-'Inputs'!E23+'Inputs'!E16"};
for(const [r,x]of Object.entries(vf))f(val,`E${r}`,x);
for(const r of [13,19,24,33,35,36,51,52])total(val,r);
for(const r of [34,37])val.getRange(`E${r}`).setNumberFormat(multiple);
for(const r of [35,40,41])val.getRange(`E${r}`).setNumberFormat(percent);
val.getRange('E25').setNumberFormat('0.00;(0.00);0.00');note(val,55,'USD millions. No distributions before exit; annual IRR = MOIC^(1/5) - 1.');note(val,56,'DCF discount rate is assumed. Reinvestment = positive terminal NOPAT x growth / terminal ROIC.');

const sum=sheets.Summary;
note(sum,5,'USD millions. Independent hypothetical acquisition, based on FY2025 financials.');
const summaryRows={7:['Entry enterprise value',"='Valuation'!E8"],8:['Initial debt',"='Valuation'!E9"],9:['Sponsor equity',"='Valuation'!E13"],11:['Five-year gross sponsor IRR',"='Valuation'!E35"],12:['Gross invested capital multiple',"='Valuation'!E34"],13:['Target equity IRR',"='Assumptions'!E26"],15:['Maximum EV at target IRR',"='Valuation'!E36"],16:['Maximum entry EV / EBITDA',"='Valuation'!E37"],17:['DCF enterprise value',"='Valuation'!E51"],19:['Peak funding shortfall',"=MAX('Debt'!E15:I15)"],20:['Minimum interest coverage',"=IF(COUNT('Debt'!E22:I22)=0,\"n.a.\",MIN('Debt'!E22:I22))"],21:['Maximum year-end net leverage',"=IF(COUNT('Debt'!E23:I23)<5,\"n.a.\",MAX('Debt'!E23:I23))"]};
for(const [r,[text,x]]of Object.entries(summaryRows)){label(sum,r,text);f(sum,`E${r}`,x);sum.getRange(`E${r}`).format.font.color=navy;}
for(const r of [11,13])sum.getRange(`E${r}`).setNumberFormat(percent);
for(const r of [12,16,20,21])sum.getRange(`E${r}`).setNumberFormat(multiple);
total(sum,9);total(sum,11);total(sum,15);
label(sum,22,'Illustrative credit tests');f(sum,'E22',`=IF(AND(E19<0.00000001,ISNUMBER(E21),E21<='Assumptions'!E56,OR(COUNT('Debt'!E22:I22)=0,E20>='Assumptions'!E57)),"Pass","Fail")`);
label(sum,23,'Return conclusion');f(sum,'E23','=IF(ISNUMBER(E11),IF(E11>=E13,"Meets return hurdle","Below return hurdle"),"Funding / input issue")');sum.getRange('E23:I23').format.font.color=navy;
note(sum,25,'Change the scenario and inputs on Assumptions; all linked outputs recalculate.');note(sum,26,'The web demo adds live two-variable sensitivities and a with/without-plan comparison.');
section(sum,28,'Exit-multiple sensitivity (current entry price and financing)');
sum.getRange('E29:I29').values=[[7,8,9,10,11]];sum.getRange('E29:I29').setNumberFormat('0.0"x"');label(sum,30,'Gross sponsor IRR');
for(const c of years){f(sum,`${c}30`,`=IF(ISNUMBER($E$11),(MAX(0,'Valuation'!$E$28*${c}$29*(1-'Assumptions'!$E$19)-'Valuation'!$E$31+'Valuation'!$E$32)/'Valuation'!$E$13)^(1/5)-1,"n.a.")`);sum.getRange(`${c}30`).setNumberFormat(percent);sum.getRange(`${c}30`).format.font.color=navy;}
note(sum,33,'Credit thresholds are illustrative. Financial feasibility does not imply lender commitment.');note(sum,34,'Downloadable model reflects default inputs. Browser CSV exports capture the current web case.');

const screen=sheets['Company Screen'];
note(screen,4,'FY2025 public-company sample. USD millions. Reported EBITDA proxy retains special items.');
const headings=['Company','Ticker','Revenue','Growth','EBITDA','Margin','FCF','FCF / EBITDA','Net leverage','Fiscal year end'];
screen.getRange('C7:L7').values=[headings];screen.getRange('C7:L7').format.fill=navy;screen.getRange('C7:L7').format.font={name:'Arial',size:10,bold:true,color:'#FFFFFF'};
const rawHeads=['Company','Ticker','Revenue','Prior revenue','EBIT','D&A','CFO','Capex','Book debt','Cash','Fiscal year end'];screen.getRange('C19:M19').values=[rawHeads];screen.getRange('C19:M19').format.fill='#EAF0F6';screen.getRange('C19:M19').format.font.bold=true;
peers.forEach((p,i)=>{
  const rr=20+i,r=8+i;
  screen.getRange(`C${rr}:M${rr}`).values=[[p.name,p.ticker,p.revenue,p.priorRevenue,p.ebit,p.da,p.cfo,p.capex,p.bookDebt,p.cash,p.period]];screen.getRange(`E${rr}:L${rr}`).format.font.color=blue;
  const sf={C:`=$C$${rr}`,D:`=$D$${rr}`,E:`=$E$${rr}`,F:`=$E$${rr}/$F$${rr}-1`,G:`=SUM($G$${rr}:$H$${rr})`,H:`=G${r}/E${r}`,I:`=$I$${rr}-$J$${rr}`,J:`=I${r}/G${r}`,K:`=($K$${rr}-$L$${rr})/G${r}`,L:`=$M$${rr}`};
  for(const [c,x]of Object.entries(sf))f(screen,`${c}${r}`,x);
  for(const c of ['F','H','J'])screen.getRange(`${c}${r}`).setNumberFormat(percent);screen.getRange(`K${r}`).setNumberFormat(multiple);
  label(screen,28+i*4,`${p.ticker}: ${p.note}`);screen.getRange(`C${28+i*4}:M${29+i*4}`).merge();screen.getRange(`C${28+i*4}:M${29+i*4}`).format.wrapText=true;
});
// Correct source URL cells; sources remain beside the related input section.
peers.forEach((p,i)=>v(screen,`C${30+i*4}`,p.url));
screen.getRange('C8:L12').format.font.color=navy;
screen.tables.add('C7:L12',true,'IndustrialCompanies');
screen.freezePanes.freezeRows(7);screen.freezePanes.freezeColumns(4);
note(screen,15,'FCF = CFO less gross capex. Net leverage = (book debt less cash) / EBITDA proxy.');note(screen,16,'No live market multiples. These records are research candidates, not available acquisitions.');

wb.recalculate();
const close=(got,want,label)=>{if(typeof got!=='number'||Math.abs(got-want)>1e-7)throw new Error(`${label}: ${got} != ${want}`);};
const checkCase=(caseName,index,usePlan)=>{
  v(a,'E4',index);v(a,'E7',usePlan?1:0);wb.recalculate();
  const expected=calculate({caseName,exitMultiple:cases[caseName].exitMultiple,usePlan});
  for(const [cell,key]of [['E8','entryEV'],['E13','sponsorEquity'],['E33','exitEquity'],['E34','moic'],['E35','irr'],['E36','maxBid'],['E51','dcfEV']])close(val.getRange(cell).values[0][0],expected[key],`${caseName}/${usePlan}/${cell}`);
  years.forEach((col,i)=>{for(const [row,key]of [[10,'revenue'],[13,'ebitda'],[14,'da'],[21,'fcf'],[22,'ufcf']])close(forecast.getRange(`${col}${row}`).values[0][0],expected.years[i][key],`Forecast ${col}${row}`);for(const [row,key]of [[19,'term'],[20,'revolver'],[21,'cash']])close(debt.getRange(`${col}${row}`).values[0][0],expected.years[i][key],`Debt ${col}${row}`);});
};
for(const [name,index]of [['Base',1],['Upside',2],['Downside',3]])for(const plan of [false,true])checkCase(name,index,plan);
checkCase('Base',1,false);
// Verify a later-period driver is live, then restore.
v(a,'I43',.08);wb.recalculate();close(forecast.getRange('I7').values[0][0],forecast.getRange('H7').values[0][0]*1.08,'later-period driver');v(a,'I43',.04);
// Verify an unselected empty case does not block Base, then restore.
v(a,'E44',null);wb.recalculate();close(val.getRange('E35').values[0][0],calculate().irr,'unselected empty case');v(a,'E44',.06);
// A missing selected scenario must remain visible as an error.
v(a,'E43',null);wb.recalculate();if(a.getRange('E42').values[0][0]!=='#N/A')throw new Error('Selected missing scenario must not become zero');v(a,'E43',.04);
// Test zero debt, restore, then confirm funded base case.
v(a,'E10',0);wb.recalculate();close(debt.getRange('E9').values[0][0],0,'zero debt interest');v(a,'E10',4.5);
checkCase('Base',1,false);wb.recalculate();
const scan=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:30},summary:'Final formula scan'});
await fs.writeFile(out+'formula-scan.txt',scan.ndjson);
console.log((await wb.inspect({kind:'table',range:'Summary!C7:E23',include:'values,formulas',tableMaxRows:17,tableMaxCols:3,maxChars:3000})).ndjson);
console.log(scan.ndjson);
const file=await SpreadsheetFile.exportXlsx(wb);await file.save(out+'industrial-investment-model.xlsx');
await fs.copyFile(out+'industrial-investment-model.xlsx',new URL('../finance/downloads/industrial-investment-model.xlsx',import.meta.url));
const ranges={Summary:['C2:I34'],Assumptions:['C2:I38','C41:I62'],Forecast:['C2:I33'],Debt:['C2:I29'],Valuation:['C2:I37','C40:I56'],Operations:['C2:I24'],'Company Screen':['C2:M24','C28:M46'],Inputs:['C2:I35']};
for(const [name,rs]of Object.entries(ranges))for(const [i,range]of rs.entries()){
  if(process.env.RENDER_CHANGED&&!['Summary','Assumptions','Forecast','Valuation','Inputs'].includes(name))continue;
  const img=await wb.render({sheetName:name,range,scale:1.5,format:'png'});await fs.writeFile(`${out}${name.replaceAll(' ','-')}-${i}.png`,new Uint8Array(await img.arrayBuffer()));
}
await fs.writeFile(out+'verification.json',JSON.stringify({scenariosVerified:6,independentEngine:'finance/model.mjs',laterPeriodDriver:true,unselectedBlankCase:true,zeroDebt:true,base:calculate(),plan:calculate({usePlan:true}),downside:calculate({caseName:'Downside',exitMultiple:7}),upside:calculate({caseName:'Upside',exitMultiple:10})},null,2));
console.log('Workbook exported and reconciled across all 6 scenario/operating-plan combinations.');

await fs.writeFile(out+'sources.json',JSON.stringify({source,peers:screenPeers(peers)},null,2));
