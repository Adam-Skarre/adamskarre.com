from pathlib import Path
import json, shutil
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_RIGHT

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'outputs/pe-portfolio'
OUT = ROOT / 'output/pdf'
OUT.mkdir(parents=True, exist_ok=True)
d = json.loads((DATA / 'verification.json').read_text())
sources = json.loads((DATA / 'sources.json').read_text())
b, p, u, low = (d[k] for k in ['base', 'plan', 'upside', 'downside'])
navy, blue, muted = map(colors.HexColor, ['#12263C', '#225DA8', '#5E6F7F'])
styles = {
    'title': ParagraphStyle('title', fontName='Times-Roman', fontSize=28, leading=30, textColor=navy, spaceAfter=12),
    'deck': ParagraphStyle('deck', fontName='Helvetica', fontSize=10, leading=14, textColor=muted, spaceAfter=12),
    'h': ParagraphStyle('h', fontName='Helvetica-Bold', fontSize=11, leading=15, textColor=navy, spaceBefore=10, spaceAfter=6),
    'body': ParagraphStyle('body', fontName='Helvetica', fontSize=9.2, leading=13, textColor=navy, spaceAfter=6),
    'small': ParagraphStyle('small', fontName='Helvetica', fontSize=7.8, leading=10, textColor=muted, spaceAfter=6),
    'cell': ParagraphStyle('cell', fontName='Helvetica', fontSize=8.2, leading=10.5, textColor=navy),
    'head': ParagraphStyle('head', fontName='Helvetica-Bold', fontSize=8.2, leading=11, textColor=colors.white),
    'callout': ParagraphStyle('callout', fontName='Helvetica-Bold', fontSize=11, leading=16, textColor=navy),
}
story = []
def text(s, style='body'):
    story.append(Paragraph(s, styles[style]))
def table(rows, widths):
    t = Table([[Paragraph(str(c), styles['head' if i == 0 else 'cell']) for c in r] for i, r in enumerate(rows)], colWidths=widths, repeatRows=1, hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),navy),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.HexColor('#F0F4F8'),colors.white]),('LINEBELOW',(0,-1),(-1,-1),.5,colors.HexColor('#CFD9E2'))]))
    story.append(t)
def money(v): return f'${v:,.1f}m' if v >= 0 else f'(${abs(v):,.1f}m)'
def pct(v): return f'{v:.1%}'
def multiple(v): return f'{v:.2f}x'
def head(kicker,title,deck):
    text(kicker.upper(),'small');text(title,'title');text(deck,'deck')
def footer(c,doc):
    c.setStrokeColor(colors.HexColor('#CCD6DF'));c.line(44, forty:=40,568,forty)
    c.setFont('Helvetica',7);c.setFillColor(muted);c.drawString(44,27,'ADAM SKARRE  /  INDEPENDENT INVESTMENT CASE  /  23 SEPTEMBER 2026')
    c.drawRightString(568,27,str(doc.page))

head('01 / Acquisition underwriting','Gorman-Rupp','A hypothetical five-year acquisition of an industrial pump manufacturer. FY2025 historical basis; USD millions unless indicated.')
callout = Table([[Paragraph(f'Recommendation: reprice before proceeding.<br/>At 10.0x entry EBITDA, the base case returns {pct(b["irr"])} versus a 20.0% hurdle.',styles['callout'])]], colWidths=[524])
callout.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#EAF0F6')),('BOX',(0,0),(-1,-1),.7,colors.HexColor('#B9CBDA')),('LEFTPADDING',(0,0),(-1,-1),13),('RIGHTPADDING',(0,0),(-1,-1),13),('TOPPADDING',(0,0),(-1,-1),12),('BOTTOMPADDING',(0,0),(-1,-1),12)]));story.append(callout)
text('Investment judgment','h')
text(f'The base case supports a maximum enterprise value of <b>{money(b["maxBid"])} ({multiple(b["maxBidMultiple"])})</b> at the target return, holding the debt amount and operating assumptions fixed. The proposed 10.0x price implies {money(b["entryEV"])} of enterprise value. Growth and debt repayment do not offset that purchase price and the assumed 9.0x exit multiple.')
text('The investment hypothesis is that durable pump demand and cash generation can support a buyout through a cycle. Test end-market exposure, customer retention and maintenance demand before treating that hypothesis as an underwriting conclusion.')
table([['Transaction assumption','Default case','Return / financing measure','Result'],['Entry multiple / exit multiple','10.0x / 9.0x','Sponsor equity',money(b['sponsorEquity'])],['Initial debt / EBITDA','4.5x','Initial debt',money(b['initialDebt'])],['Interest / annual amortization','8.0% / 1.0%','Year-five debt',money(b['years'][-1]['term'])],['Minimum cash / revolver','$20.0m / $50.0m','Minimum EBITDA / interest',multiple(b['minCoverage'])],['Transaction / financing fees','2.0% EV / 2.0% debt','DCF enterprise value',money(b['dcfEV'])]],[156,100,176,92])
text('Scenario discipline','h')
table([['Scenario','Revenue path','Exit multiple','Gross IRR','MOIC'],['Downside','-8%, -2%, 1%, 2%, 2%','7.0x',pct(low['irr']),multiple(low['moic'])],['Base','4% annually','9.0x',pct(b['irr']),multiple(b['moic'])],['Upside','6%, 6%, 5%, 5%, 4%','10.0x',pct(u['irr']),multiple(u['moic'])]],[83,190,87,82,82])
text('Scenarios also vary EBITDA margin: Base unchanged; Upside +0.3 to +1.0 percentage points; Downside -3.0 to -1.0 points versus FY2025. No operating initiatives are included in this table. Gross returns precede fund fees and carry.','small')
text('The DCF assumes a 10.0% discount rate, 2.5% perpetual growth and 12.0% terminal return on invested capital. Growth requires reinvestment. These are illustrative assumptions, not market-derived estimates. No current share price, takeover premium or observed transaction multiple is used.','small')

story.append(PageBreak())
head('02 / Operating value creation','An operating plan with costs','Pricing, process yield and inventory initiatives feed the same cash-flow, debt and returns model.')
text(f'Under the base operating case, the illustrative plan increases gross IRR from <b>{pct(b["irr"])} to {pct(p["irr"])}</b> and MOIC from <b>{multiple(b["moic"])} to {multiple(p["moic"])}</b>. It still falls below the 20.0% return hurdle at the default entry price. Operational improvement is therefore a diligence priority, not a justification for the proposed price.')
table([['Initiative','Hypothesis and measurement','Model treatment'],['Pricing','1.0% realized price increase; 0.25% volume loss; 35% lost-volume contribution margin. Track price realization, churn and mix by customer.','Net price and lost contribution affect recurring EBITDA. The model also captures revenue-driven capex and working capital.'],['Process yield','Savings equal to 0.6% of baseline cost of goods sold. Track scrap rate, first-pass yield, throughput and cost per unit.','$3.0m initial capex; straight-line depreciation over five years. Savings enter EBITDA as implementation ramps.'],['Inventory','Eight fewer inventory days. Track aging, turns, fill rate and on-time delivery.','The reduction releases cash through working capital. Only the annual change enters cash flow; it never enters EBITDA.']],[84,222,218])
text('Implementation economics','h')
text('Realization ramps to 35% in Year 1, 75% in Year 2 and 100% thereafter. Operating implementation costs total $3.0m: $2.0m in Year 1 and $1.0m in Year 2. Costs are allocated 25% to pricing, 50% to yield and 25% to inventory when individual initiatives are toggled.')
table([['Measure','Base','With plan','Change'],['2030 recurring EBITDA',money(b['years'][-1]['recurringEbitda']),money(p['years'][-1]['recurringEbitda']),money(p['years'][-1]['recurringEbitda']-b['years'][-1]['recurringEbitda'])],['2030 closing debt',money(b['years'][-1]['term']+b['years'][-1]['revolver']),money(p['years'][-1]['term']+p['years'][-1]['revolver']),money(p['years'][-1]['term']+p['years'][-1]['revolver']-b['years'][-1]['term']-b['years'][-1]['revolver'])],['Exit equity value',money(b['exitEquity']),money(p['exitEquity']),money(p['exitEquity']-b['exitEquity'])]],[212,104,104,104])
text('First 100 days: evidence before scale','h')
table([['Window','Work and decision gate'],['Days 1-30','CFO and operating leads establish customer, SKU and plant baselines. Reconcile source data to reported accounts. Validate available capacity and service requirements.'],['Days 31-60','Commercial and plant leads pilot repricing and process changes. Run sensitivity tests on demand loss and implementation delay. Stop initiatives that reduce contribution or service quality.'],['Days 61-100','Scale only validated pilots. Assign monthly owners and budgets. Finance reconciles realized EBITDA and cash effects against the original case; revise the investment forecast.']],[84,440])
text('All targets, timing and implementation budgets are hypotheses for this case. No company management commitment or achieved operating improvement is represented.','small')

story.append(PageBreak())
head('03 / Research and diligence','Make the comparisons defensible','A five-company industrial screen supports research prioritization. It is not a database of actionable acquisition targets.')
rows=[['Company','FY2025 revenue','EBITDA margin','FCF / EBITDA','Net leverage']]
for peer in sources['peers']:
    rows.append([f'{peer["name"]} ({peer["ticker"]})',money(peer['revenue']),pct(peer['margin']),pct(peer['conversion']),multiple(peer['netLeverage'])])
table(rows,[156,104,88,88,88])
text('Earnings quality changes the interpretation','h')
text('<b>Gorman-Rupp:</b> operating EBITDA is operating income plus D&amp;A: $95.363m + $27.709m = $123.072m. It differs from company-adjusted EBITDA of $128.791m. This case retains facility costs and LIFO expense. <b>Graco:</b> operating profit includes a $14.061m contingent consideration benefit. <b>Donaldson:</b> its July fiscal year differs from the other companies, and reported earnings include $62m of impairment expense.')
text('<b>Flowserve:</b> operating income includes a $140.092m asbestos divestiture loss; operating cash flow includes a $199m related contribution. Normalize the earnings and cash effects together. <b>ITT:</b> year-end cash reflects an equity raise ahead of SPX FLOW. Net cash is not a steady-state funding assumption. The screen excludes $7.9m of capex incentives from FCF.')
text('Priority diligence questions','h')
text('<b>Commercial:</b> Which customers and end markets drive backlog, cancellations and pricing power? <b>Operations:</b> What plant and SKU evidence supports yield and inventory targets? <b>Financial:</b> Which earnings adjustments are nonrecurring, and what cash effects accompany them? <b>Financing:</b> What are actual debt payoff, pension, lease and debt-like obligations, lender covenants and seasonal liquidity needs?')
text('Definitions and scope','h')
text('Screen EBITDA proxy = reported operating income + D&amp;A; FCF = operating cash flow - gross capex; net leverage = (book debt - cash) / EBITDA proxy. Fiscal dates and source notes appear in the interactive screen and workbook. Multiples used for illustrative valuation are user assumptions, not trading comparables.','small')
text('The acquisition model covers five annual periods, sources and uses, debt sweeps, bounded revolver draws, cash taxes and a DCF cross-check. Interest uses beginning debt. No interim distributions are assumed. A funding shortfall suppresses returns. The model is not a full three-statement or purchase-accounting model; it omits tax-loss carryforwards, interest-deduction limits and intra-year financing. Estimated payoff uses $310.750m reported principal before break costs and accrued interest; book debt is $307.531m.','small')
text('Primary sources','h')
for peer in sorted(sources['peers'], key=lambda x: ['GRC','GGG','DCI','FLS','ITT'].index(x['ticker'])):
    text(f'<link href="{peer["url"]}" color="#225DA8">{peer["name"]}: FY2025 results and financial statements</link> | fiscal year ended {peer["period"]}','small')
text('Historical inputs retrieved September 23, 2026. Gorman-Rupp annual financial inputs reconcile to the audited FY2025 10-K. This retrospective case uses FY2025 information; it is not a contemporaneous 2025 decision or a representation of executed investment work.','small')

target=OUT/'investment-memo.pdf'
doc=SimpleDocTemplate(str(target),pagesize=(612,792),rightMargin=44,leftMargin=44,topMargin=43,bottomMargin=53,title='Gorman-Rupp | Investment and operating case',author='Adam Skarre')
doc.build(story,onFirstPage=footer,onLaterPages=footer)
shutil.copyfile(target,ROOT/'finance/downloads/investment-memo.pdf')
print(target)
