export interface PciEntry {
  score: number;
  designation: string;
  tagline: string;
  smokingGun: string;
  observation: string;
}

export const pciData: PciEntry[] = [
  // THE SOVEREIGN CHOICE (96-100)
  { score: 100, designation: "Unicorn", tagline: "The Market's End State.", smokingGun: "ImportYeti Global Dominance: 3x raw material inflow.", observation: "Our DPI discovered total supply chain capture via shipping manifests, making a 500%+ breakout mathematically inevitable." },
  { score: 99, designation: "Supernova", tagline: "Infrastructure Expansion.", smokingGun: "SAM.gov Whale: Unannounced $1.2B federal grant.", observation: "Federal capital inflows now exceed total corporate debt, confirming a state-sponsored supercycle." },
  { score: 98, designation: "Oracle", tagline: "Prophetic IP Dominance.", smokingGun: "USPTO Core Disruptor: Semantic distance mapped to 10-year moat.", observation: "Patent filings reveal an insurmountable technological monopoly over next-generation infrastructure." },
  { score: 97, designation: "Eclipse", tagline: "Market Cannibalization.", smokingGun: "LinkedIn Talent Raid: 40% of rival engineering team absorbed.", observation: "They are systematically eclipsing rivals by absorbing their core intellectual property creators." },
  { score: 96, designation: "Vortex", tagline: "Total Float Absorption.", smokingGun: "CBOE Dark Pool Print: Absolute institutional absorption.", observation: "A liquidity vacuum has been created, removing all available supply and forcing an upward price shock." },
  // THE STRATEGIC APEX (90-95)
  { score: 95, designation: "Titan", tagline: "Structural Pop.", smokingGun: "SEC XBRL Data: Gross margins expanded by 1,200 bps.", observation: "Pricing power has achieved escape velocity, translating raw demand into pure net income." },
  { score: 94, designation: "Ironclad", tagline: "Mathematical Fortress.", smokingGun: "Altman Z-Score 8.5+.", observation: "The balance sheet is utterly impenetrable, providing massive asymmetric upside with zero structural risk." },
  { score: 93, designation: "Overlord", tagline: "Macro Alignment.", smokingGun: "FRED API: Yield Curve Un-inversion trigger.", observation: "Macro tailwinds and Fed policy shifts have unlocked a multi-billion dollar runway for this specific asset class." },
  { score: 92, designation: "Highlander", tagline: "Sector Domination.", smokingGun: "Nielsen/Scanner API: Capturing 5% rival market share monthly.", observation: "Consumer and enterprise spending flows are being violently redirected into this singular asset." },
  { score: 91, designation: "Juggernaut", tagline: "Physical Dominance.", smokingGun: "Local Gov Records: Power substation permits approved.", observation: "Infrastructure capex is 4x the industry average; the physical footprint is already built." },
  { score: 90, designation: "Centurion", tagline: "The Gold Standard.", smokingGun: "FCF Mastery: Free Cash Flow yield sustained above 12%.", observation: "A perfect cash conversion cycle means every dollar invested is mathematically compounding." },
  // ASCENDANT GROWTH (70-89)
  { score: 89, designation: "Volt", tagline: "Liquidity Injection.", smokingGun: "Etherscan/Public Ledger: $1B Stablecoin inflow detected.", observation: "Massive institutional capital is staging on the sidelines, preparing for immediate deployment." },
  { score: 88, designation: "Velocity", tagline: "Forced Buying.", smokingGun: "CBOE Vanna Flow: Dealer hedging gamma squeeze.", observation: "Options market makers are mathematically forced to buy the underlying asset to hedge their books." },
  { score: 87, designation: "Gladiator", tagline: "Insider Conviction.", smokingGun: "SEC Form 4: CEO/CFO double personal stakes.", observation: "The ultimate signal of trust; the architects of the company are buying on the open market." },
  { score: 86, designation: "Chrome", tagline: "Internal Alpha.", smokingGun: "Glassdoor API: Employee morale spiking ahead of product launch.", observation: "Human capital sentiment strongly correlates with upcoming, unannounced R&D breakthroughs." },
  { score: 85, designation: "Monolith", tagline: "Institutional Floor.", smokingGun: "13F Filings: 85% held by diamond-hand pensions.", observation: "Retail volatility is eliminated; the asset is anchored by generational wealth funds." },
  { score: 84, designation: "Afterburner", tagline: "Growth Acceleration.", smokingGun: "YoY Revenue: The second derivative of growth is vertical.", observation: "The company isn't just growing; the rate at which they are growing is speeding up." },
  { score: 83, designation: "Prism", tagline: "Sentiment Refraction.", smokingGun: "NLP Fedspeak: Central bank tone aligns with corporate debt structure.", observation: "Media narrative is bearish, but institutional algorithms are buying the macro alignment." },
  { score: 82, designation: "Kinetic", tagline: "Arbitrage Breakout.", smokingGun: "Put/Call Parity: Persistent ADR pricing gap.", observation: "Local exchange action is predicting a massive US-listing surge before retail wakes up." },
  { score: 81, designation: "Stratos", tagline: "High-Altitude Value.", smokingGun: "EV/EBITDA Matrix: Trading at 40% sector discount.", observation: "Mathematical value dislocation; the asset is fundamentally mispriced relative to its cash generation." },
  { score: 80, designation: "Bulwark", tagline: "Absolute Deleveraging.", smokingGun: "Debt-to-Equity < 0.2.", observation: "Structural debt has been eliminated, clearing the runway for massive stock buybacks." },
  { score: 79, designation: "Zenith", tagline: "Supply Chain Resiliency.", smokingGun: "ImportYeti: Zero single-point-of-failure suppliers.", observation: "Operational risk is mitigated; they can survive global macro shocks that will bankrupt competitors." },
  { score: 78, designation: "Catalyst", tagline: "Regulatory Trigger.", smokingGun: "Federal Register: ESG/Carbon rule change finalized.", observation: "Legislative shifts are forcing institutional capital to rotate heavily into this sector." },
  { score: 77, designation: "Dynamo", tagline: "Credit Evaporation.", smokingGun: "CDS Spreads: Corporate bond insurance costs collapsing.", observation: "The bond market is pricing in zero default risk, leading equity markets to follow." },
  { score: 76, designation: "Aegis", tagline: "Compounder.", smokingGun: "Dividend CAGR: Verified 15%+ growth for 3 years.", observation: "Yield generation is mathematically compounding, forcing dividend-growth ETFs to accumulate." },
  { score: 75, designation: "Pulse", tagline: "Narrative Shift.", smokingGun: "Transcript NLP: 'Demand' mentioned 4x more than Q3.", observation: "Executive language reveals a massive influx of inbound business prior to official earnings." },
  { score: 74, designation: "Quantum", tagline: "IP Velocity.", smokingGun: "USPTO Output: Patent approvals outpacing sector by 2x.", observation: "The R&D pipeline is translating into legally protected, monetizable assets." },
  { score: 73, designation: "Forge", tagline: "Inventory Clearance.", smokingGun: "Turnover Ratio: Sales clearing warehouses at record pace.", observation: "Product demand is vastly outpacing manufacturing capacity, ensuring pricing power." },
  { score: 72, designation: "Current", tagline: "Physical Footprint.", smokingGun: "Geospatial Data: Retail/facility foot traffic up 20%.", observation: "Satellite and mobile data confirm real-world acceleration ahead of quarter-end." },
  { score: 71, designation: "Spark", tagline: "Capitulation.", smokingGun: "Sell-Side Action: First major upgrade after 18mo neutral.", observation: "Wall Street is finally waking up to the data, triggering algorithmic momentum buys." },
  { score: 70, designation: "Ignition", tagline: "Algorithmic Trigger.", smokingGun: "Moving Average: 50/200 Day Golden Cross.", observation: "Quantitative trading bots have received the mathematical green light to accumulate." },
  // THE VALUE TRAPS (51-69)
  { score: 69, designation: "Ghost", tagline: "Bot Net Hype.", smokingGun: "Social Sentiment: 80% of retail mentions are automated.", observation: "The narrative is completely fabricated by social media manipulation; there is no real alpha." },
  { score: 68, designation: "Echo", tagline: "The Fake Pivot.", smokingGun: "Import Manifests: Claimed 'AI Pivot' but zero hardware bought.", observation: "Management is lying to shareholders; the physical supply chain completely contradicts their press releases." },
  { score: 67, designation: "Static", tagline: "Guidance Paralysis.", smokingGun: "Forward Guidance: Flat/Unchanged.", observation: "Management is paralyzed by macro headwinds and has no strategic plan for growth." },
  { score: 66, designation: "Mirage", tagline: "Accounting Tricks.", smokingGun: "Adjusted EBITDA: Massive gap from GAAP earnings.", observation: "The company is engineering its numbers; real, auditable cash flow is highly concerning." },
  { score: 65, designation: "Vapor", tagline: "Cannibalizing the Future.", smokingGun: "R&D Spend: Dropped 15% YoY.", observation: "They are cutting critical future investments just to artificially save the current quarter's EPS." },
  { score: 64, designation: "Shadow", tagline: "Short Comfort.", smokingGun: "Days to Cover: Extremely low despite high short interest.", observation: "Short sellers are highly comfortable in their positions; there is zero risk of a squeeze." },
  { score: 63, designation: "Drift", tagline: "Zero Independence.", smokingGun: "Sector Correlation: Exactly 1.0.", observation: "The asset is just floating mindlessly with the broader ETF; it generates zero independent strength." },
  { score: 62, designation: "Murmur", tagline: "IP Abandonment.", smokingGun: "USPTO: Letting critical patents expire.", observation: "They are surrendering their technological moat simply to save cash on maintenance fees." },
  { score: 61, designation: "Facade", tagline: "Capex Freeze.", smokingGun: "10-Q Capex: Infrastructure growth halted.", observation: "Physical expansion has stopped entirely, signaling deep internal concerns about future demand." },
  { score: 60, designation: "Illusion", tagline: "Levered Returns.", smokingGun: "Debt Issuance: Buybacks funded by new loans.", observation: "They are artificially inflating the stock price by taking on dangerous levels of corporate debt." },
  { score: 59, designation: "Phantom", tagline: "Quiet Exits.", smokingGun: "LinkedIn API: Mid-level directors migrating away.", observation: "The people actually running the day-to-day operations are quietly abandoning ship." },
  { score: 58, designation: "Limbo", tagline: "Regulatory Wall.", smokingGun: "Federal Register: Key product approval infinitely stalled.", observation: "Bureaucratic red tape has trapped their primary revenue driver in permanent stasis." },
  { score: 57, designation: "Stagnant", tagline: "Inflation Loser.", smokingGun: "YoY Revenue: Flat.", observation: "When adjusted for global inflation, this company is actually shrinking in real terms." },
  { score: 56, designation: "Plateau", tagline: "CAC Blowout.", smokingGun: "Customer Acquisition Cost: Surging 3x.", observation: "They are paying completely unsustainable amounts of money just to maintain their current user base." },
  { score: 55, designation: "Inert", tagline: "Management Apathy.", smokingGun: "Zero Insider Buying.", observation: "Even trading at 52-week lows, the executives refuse to invest their own money into the asset." },
  { score: 54, designation: "Fog", tagline: "Reporting Blackout.", smokingGun: "SEC Edgar: Delayed 10-Q Filing.", observation: "A massive red flag indicating severe accounting irregularities or internal audits gone wrong." },
  { score: 53, designation: "Haze", tagline: "Geopolitical Risk.", smokingGun: "Supply Chain: 80% reliance on a single unstable region.", observation: "One tariff or macro shock will instantly sever their entire ability to manufacture goods." },
  { score: 52, designation: "Blur", tagline: "Pricing Power Lost.", smokingGun: "Shrinking Gross Margins.", observation: "Competitors are forcing them into a race to the bottom, destroying their profitability." },
  { score: 51, designation: "Neutral", tagline: "Mathematical Mediocrity.", smokingGun: "Beta exactly 1.0.", observation: "The absolute definition of dead money; a pure value trap with zero asymmetric upside." },
  // THE ENTROPY WARNING (1-50)
  { score: 50, designation: "Rust", tagline: "Structural Deficit.", smokingGun: "Working Capital: Liabilities outstripping short-term assets.", observation: "The fundamental machinery of the business is beginning to break down under financial weight." },
  { score: 49, designation: "Fracture", tagline: "Collection Failure.", smokingGun: "Days Sales Outstanding (DSO): Spiking.", observation: "Customers have stopped paying their invoices, creating a severe, impending cash crunch." },
  { score: 48, designation: "Splinter", tagline: "Yield Trap.", smokingGun: "Payout Ratio: Exceeds 120%.", observation: "The dividend is a mathematical lie; a massive cut is imminent to prevent insolvency." },
  { score: 47, designation: "Toxin", tagline: "Credit Contagion.", smokingGun: "Rating Agencies: Imminent junk downgrade.", observation: "The cost of borrowing capital is about to skyrocket, suffocating future growth." },
  { score: 46, designation: "Decay", tagline: "Obsolete Assets.", smokingGun: "Inventory Bloat: Record highs during falling sales.", observation: "Warehouses are packed with dead, depreciating technology that no one wants to buy." },
  { score: 45, designation: "Erosion", tagline: "Footprint Collapse.", smokingGun: "Physical Data: Store/Facility closures up 10% YoY.", observation: "The company is physically shrinking to survive, surrendering its market share permanently." },
  { score: 44, designation: "Parasite", tagline: "Toxic Financing.", smokingGun: "Convertible Debt: Death spiral warrants issued.", observation: "Predatory lenders are extracting value, massively diluting existing retail shareholders." },
  { score: 43, designation: "Hemorrhage", tagline: "Cash Incinerator.", smokingGun: "Free Cash Flow: Deeply Negative.", observation: "They are burning through tens of millions a quarter with no viable path to profitability." },
  { score: 42, designation: "Fault", tagline: "Leadership Void.", smokingGun: "C-Suite Resignation: CEO leaves with no successor.", observation: "Sudden executive abandonment signals catastrophic, undisclosed internal failures." },
  { score: 41, designation: "Tremor", tagline: "Regulatory Scrutiny.", smokingGun: "SEC Comment Letter: Revenue recognition questioned.", observation: "Federal regulators suspect the financial statements are materially misleading or fraudulent." },
  { score: 40, designation: "Quake", tagline: "Founder Exodus.", smokingGun: "Form 4 Aggregation: Massive insider liquidation.", observation: "The architects of the company are dumping over 50% of their holdings onto retail bagholders." },
  { score: 39, designation: "Rupture", tagline: "Revenue Severance.", smokingGun: "SAM.gov/Contract Loss: Primary client walked away.", observation: "The sole pillar holding up the company's valuation has been abruptly removed." },
  { score: 38, designation: "Chasm", tagline: "Distress Zone.", smokingGun: "Altman Z-Score < 1.8.", observation: "Mathematical models confirm the company has officially entered the pre-bankruptcy distress zone." },
  { score: 37, designation: "Abyss", tagline: "Structural Compromise.", smokingGun: "Product Recall Warning.", observation: "Their flagship asset is defective, destroying consumer trust and inviting massive litigation." },
  { score: 36, designation: "Sinkhole", tagline: "Covenant Breach.", smokingGun: "Debt Covenants: Violated.", observation: "Institutional banks now have the legal right to seize corporate assets and collateral." },
  { score: 35, designation: "Crater", tagline: "Panic Button.", smokingGun: "WARN Act Notices: >20% workforce laid off.", observation: "Operations have been slashed to the bone simply to survive the calendar year." },
  { score: 34, designation: "Ash", tagline: "Default Trigger.", smokingGun: "Missed Coupon Payment.", observation: "The company has officially failed to pay interest on its corporate bonds." },
  { score: 33, designation: "Cinder", tagline: "Asset Evaporation.", smokingGun: "Goodwill Impairment: Massive write-down.", observation: "Hundreds of millions in previous acquisitions have been officially declared worthless." },
  { score: 32, designation: "Ember", tagline: "Board Exodus.", smokingGun: "Board of Directors: Mass resignations.", observation: "The oversight committee has fled to protect themselves from upcoming legal liability." },
  { score: 31, designation: "Smoke", tagline: "Trust Deletion.", smokingGun: "Auditor Resignation: Refusal to sign financials.", observation: "The accounting firm has walked away; the reported numbers can no longer be trusted." },
  { score: 30, designation: "Toxic", tagline: "Criminal Scrutiny.", smokingGun: "DOJ Probe: Investigations underway.", observation: "Federal prosecutors are moving in; this is no longer a business failure, it's a crime scene." },
  { score: 29, designation: "Venom", tagline: "Shareholder Revolt.", smokingGun: "Class Action: Institutional lawsuits filed.", observation: "Major funds are suing management for fiduciary failure and securities fraud." },
  { score: 28, designation: "Blight", tagline: "Vendor Halt.", smokingGun: "ImportYeti: Zero inbound shipments; credit halted.", observation: "Suppliers are demanding cash-on-delivery because they know the company is insolvent." },
  { score: 27, designation: "Plague", tagline: "Terminal Runway.", smokingGun: "Cash Burn: Less than 3 months of capital left.", observation: "Without an immediate, highly dilutive miracle, the doors close next quarter." },
  { score: 26, designation: "Virus", tagline: "Negative Margins.", smokingGun: "Gross Margin < 0.", observation: "It literally costs them more money to manufacture the product than they sell it for." },
  { score: 25, designation: "Infection", tagline: "Macro Destruction.", smokingGun: "Yield Spread: Business model crushed by rate environment.", observation: "The era of free money is over, and this zombie company cannot survive the new gravity." },
  { score: 24, designation: "Necrosis", tagline: "Eating the Organs.", smokingGun: "Asset Liquidation: Selling core IP.", observation: "They are selling their foundational patents just to make payroll for one more month." },
  { score: 23, designation: "Vulture", tagline: "Debt Predators.", smokingGun: "Distressed Debt Funds: Circling the bonds.", observation: "Vulture funds are buying the debt pennies on the dollar to eventually steal the equity." },
  { score: 22, designation: "Carrion", tagline: "Pre-Packaged End.", smokingGun: "Restructuring Officers Hired.", observation: "Specialist lawyers are currently in the boardroom drafting the Chapter 11 paperwork." },
  { score: 21, designation: "Skeleton", tagline: "Lights Out.", smokingGun: "Operations Ceased: Facilities locked.", observation: "The workforce is gone, the servers are down, and the physical footprint is abandoned." },
  { score: 20, designation: "Fossil", tagline: "Delisting Trigger.", smokingGun: "NYSE/Nasdaq: Price < $1.00 for 30+ days.", observation: "The major exchanges are preparing to eject the asset from the legitimate financial system." },
  { score: 19, designation: "Relic", tagline: "Pink Sheet Exile.", smokingGun: "OTC Downgrade.", observation: "The asset has been banished to the unregulated, illiquid over-the-counter graveyard." },
  { score: 18, designation: "Ruin", tagline: "Micro-Cap Death.", smokingGun: "Market Cap < $5M.", observation: "There is no liquidity left; any attempt to sell will instantly crash the remaining price." },
  { score: 17, designation: "Wreck", tagline: "Exchange Intervention.", smokingGun: "Trading Suspended: Halted pending news.", observation: "Regulators have frozen the asset to prevent further retail destruction." },
  { score: 16, designation: "Debris", tagline: "Dumb Money Trap.", smokingGun: "13F: 0% Institutional Ownership.", observation: "Smart money has entirely evacuated; only trapped retail bagholders remain." },
  { score: 15, designation: "Scrap", tagline: "Negative Equity.", smokingGun: "Book Value: Deeply Negative.", observation: "If you liquidated the entire company today, it would still owe the banks millions." },
  { score: 14, designation: "Shard", tagline: "Liquidity Zero.", smokingGun: "Order Book: Zero volume days.", observation: "There is no market. Not a single participant is willing to place a bid at any price." },
  { score: 13, designation: "Dust", tagline: "Fire Sale.", smokingGun: "Final Asset Auction.", observation: "The office chairs, domains, and scrap metal are being auctioned off to pay secured creditors." },
  { score: 12, designation: "Vapor", tagline: "Hollow Shell.", smokingGun: "Shell Status.", observation: "There are no employees, no products, and no revenue. It is just a dead ticker symbol." },
  { score: 11, designation: "Vacuum", tagline: "Desperation Split.", smokingGun: "1-for-100 Reverse Split.", observation: "A purely mathematical illusion to artificially inflate the share price and delay execution." },
  { score: 10, designation: "Oblivion", tagline: "Court Surrender.", smokingGun: "Chapter 11 Filing.", observation: "Management has lost control; a bankruptcy judge now dictates the fate of the capital." },
  { score: 9, designation: "Null", tagline: "Wiped Out.", smokingGun: "Reorganization Plan: Common Equity = $0.", observation: "The court has ruled that common shareholders will receive absolutely nothing." },
  { score: 8, designation: "Zero", tagline: "Secured Losses.", smokingGun: "Bondholder Haircut.", observation: "The destruction is so deep that even the highly protected, secured debt holders are losing money." },
  { score: 7, designation: "Minus", tagline: "Terminal Fraud.", smokingGun: "SEC Permanent Halt.", observation: "Trading has been banned forever due to irrefutable, massive corporate fraud." },
  { score: 6, designation: "Deficit", tagline: "Criminal Fallout.", smokingGun: "DOJ: Executive Indictments.", observation: "The C-Suite is facing federal prison; the corporate entity was nothing but a criminal enterprise." },
  { score: 5, designation: "Drain", tagline: "Total Dissolution.", smokingGun: "Chapter 7 Liquidation.", observation: "There is no reorganization. The company is being legally erased from existence." },
  { score: 4, designation: "Bleed", tagline: "Symbol Revoked.", smokingGun: "FINRA Deletion.", observation: "The regulatory body has officially stripped the ticker symbol from the global network." },
  { score: 3, designation: "Collapse", tagline: "Digital Deletion.", smokingGun: "Server Offline: AWS/Domains terminated.", observation: "The very digital infrastructure of the company has been unplugged and wiped." },
  { score: 2, designation: "Implosion", tagline: "Capital Extinction.", smokingGun: "Asset Annihilation.", observation: "Every dollar invested has been mathematically pulverized. The asset no longer exists in reality." },
  { score: 1, designation: "Extinction", tagline: "Historical Artifact.", smokingGun: "Absolute System Purge.", observation: "Our DPI confirms absolute, irreversible deletion from the financial system." },
  { score: 0, designation: "Eradicated", tagline: "Delisted, Bankrupt, Eradicated.", smokingGun: "Total System Removal.", observation: "The asset has been permanently erased from every regulated and unregulated venue. There is nothing left to value." },
];

export const getPciData = (score: number): PciEntry => {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const result = pciData.find((item) => item.score === clamped) ?? pciData[pciData.length - 1];
  return {
    ...result,
    observation: `${result.observation} In addition to the rest of the Phaos Proprietary Algorithms.`,
  };
};

export const getPciColorClass = (score: number): { text: string; bar: string; border: string; bg: string; ring: string } => {
  if (score >= 96) return { text: "text-pci-choice", bar: "bg-pci-choice", border: "border-pci-choice/50", bg: "bg-pci-choice/10", ring: "ring-pci-choice/40" };
  if (score >= 90) return { text: "text-pci-go", bar: "bg-pci-go", border: "border-pci-go/50", bg: "bg-pci-go/10", ring: "ring-pci-go/40" };
  if (score >= 70) return { text: "text-pci-potential", bar: "bg-pci-potential", border: "border-pci-potential/50", bg: "bg-pci-potential/10", ring: "ring-pci-potential/40" };
  if (score >= 51) return { text: "text-pci-warning", bar: "bg-pci-warning", border: "border-pci-warning/50", bg: "bg-pci-warning/10", ring: "ring-pci-warning/40" };
  return { text: "text-pci-no-go", bar: "bg-pci-no-go", border: "border-pci-no-go/50", bg: "bg-pci-no-go/10", ring: "ring-pci-no-go/40" };
};
