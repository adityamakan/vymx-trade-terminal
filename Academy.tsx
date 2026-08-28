import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ReferenceLine } from 'recharts';
import { ChartContainer } from './ChartContainer';
import { 
  BookOpen, 
  GraduationCap, 
  Search, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Cpu, 
  Globe, 
  Layers, 
  Award, 
  Bookmark, 
  ChevronRight, 
  ChevronDown, 
  Percent, 
  Play, 
  Sparkles,
  HelpCircle,
  Lightbulb,
  Scale,
  Calculator,
  ArrowUpRight,
  Activity
} from 'lucide-react';
import { Asset } from '../types';

interface AcademyProps {
  onSelectAsset?: (asset: Asset) => void;
  setView?: (view: any) => void;
  assets?: Asset[];
}

interface Article {
  id: string;
  title: string;
  category: 'bonds' | 'stocks' | 'crypto' | 'forex' | 'risk_management' | 'advanced';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  timeToRead: string;
  summary: string;
  content: string[];
  isLocked?: boolean;
}

const EDUCATIONAL_ARTICLES: Article[] = [
  {
    id: 'bonds-102',
    title: 'Yield Curves & Duration Risk',
    category: 'bonds',
    difficulty: 'Intermediate',
    timeToRead: '8 min',
    summary: 'A deep dive into interpreting the yield curve, identifying inversions, and managing duration risk in fixed-income portfolios.',
    content: [
      'The Yield Curve represents the relationship between bond yields and their maturities.',
      'A normal curve slopes upward, reflecting higher risk premiums for longer lock-up periods.',
      'An inverted yield curve (where short-term yields exceed long-term yields) has historically been a strong predictor of economic recessions.',
      'Duration risk measures a bond\'s price sensitivity to interest rate changes. Longer duration bonds will experience steeper price drops when rates rise.'
    ]
  },
  {
    id: 'crypto-102',
    title: 'DeFi & Smart Contract Security',
    category: 'crypto',
    difficulty: 'Advanced',
    timeToRead: '12 min',
    summary: 'Understanding Decentralized Finance (DeFi) protocols, liquidity pools, and the smart contract risks associated with on-chain yield farming.',
    content: [
      'Decentralized Finance (DeFi) operates without central intermediaries using smart contracts on blockchains like Ethereum or Solana.',
      'Automated Market Makers (AMMs) use liquidity pools instead of traditional order books. Users provide paired assets to earn trading fees.',
      'Impermanent Loss occurs when the price ratio of pooled assets changes significantly from the time of deposit.',
      'Smart contract vulnerabilities (like reentrancy attacks or flash loan exploits) present terminal risks to capital deployed in these protocols.'
    ],
    isLocked: true
  },
  {
    id: 'options-101',
    title: 'Introduction to Options Trading Greeks',
    category: 'advanced',
    difficulty: 'Advanced',
    timeToRead: '15 min',
    summary: 'Mastering Delta, Gamma, Theta, and Vega to precisely manage your exposure to price, time decay, and volatility.',
    content: [
      'Options Greeks measure the sensitivity of an option\'s price to various market factors.',
      '**Delta**: The amount an option price is expected to move based on a $1 change in the underlying stock.',
      '**Gamma**: The rate of change of Delta. High gamma means the option\'s sensitivity will swing rapidly as the stock moves.',
      '**Theta**: The daily decay of the option\'s extrinsic value as it approaches expiration (Time Decay).',
      '**Vega**: The sensitivity of the option price to a 1% change in implied volatility.'
    ],
    isLocked: true
  },
  {
    id: 'art-bonds-101',
    title: 'Bond Markets Demystified: Debt Securities & Yields',
    category: 'bonds',
    difficulty: 'Beginner',
    timeToRead: '5 min',
    summary: 'An basic guide to understanding fixed-income government bonds, yields, prices, and why they act as the bedrock of wealth protection.',
    content: [
      'Government and corporate bonds are debt instruments used by institutions to borrow capital. When you buy a bond, you are essentially lending money to the issuer in exchange for periodic interest (coupons) and the return of the bond’s face value upon maturity.',
      'Unlike stocks, where you buy equity ownership in a company, bonds represent fixed-income contracts. Hence, they are generally much less volatile than stock indices or cryptocurrencies.',
      'Understanding **Bond Yields**: The yield is the annual rate of interest returned on the bond, expressed as a percentage. Bond prices and yields have an **inverse relationship**. When market interest rates go up, newly issued bonds offer higher interest. Consequently, existing bonds (which have locked-in lower rates) drop in price. This price dynamic is critical for portfolio planning.',
      'For beginners, 10-Year UK Gilts and US Treasury Yields are global benchmarks. If US10Y is rising, it represents tightening macro liquidity. Higher bond yields make stocks and crypto relatively less attractive because investors can secure reliable yields risk-free.'
    ]
  },
  {
    id: 'art-personal-finance-101',
    title: 'Wealth Management 101: The Power of Compounding & Financial Freedom',
    category: 'risk_management',
    difficulty: 'Beginner',
    timeToRead: '5 min',
    summary: 'An absolute beginner-friendly guide to personal finance, emergency stash creation, compound interest calculators, and high-yield interest avenues.',
    content: [
      'The foundational law of building wealth is simple: spend less than you earn, invest the difference immediately, and harness the power of exponential compounding. Compound interest is the process where your earnings generate their own earnings-accumulating capital at an accelerating speed over time.',
      '**The Rule of 72**: To easily estimate how many years it will take to double your money with any given yearly return, divide 72 by the nominal interest rate. For example, at an 8% compounding return, your investment principal will double every 9 years (72 / 8 = 9). Just a small early start drastically changes your lifetime net worth trajectory.',
      'Before buying unstable stocks or cryptocurrencies, beginners must construct a solid emergency fund. Typically, this constitutes 3 to 6 months of living expenses locked inside low-volatility, highly liquid assets like Sovereign Savings Bonds or high-yield savings accounts.',
      'Avoid high-interest consumer debt like credit card balances entirely. Consumer debt is compounding in reverse-enriching institutions at your expense.'
    ]
  },
  {
    id: 'art-indian-sectors',
    title: 'Understanding Indian Markets: Nifty Core Sectors & Blue-Chip Giants',
    category: 'stocks',
    difficulty: 'Beginner',
    timeToRead: '6 min',
    summary: 'Discover the engine of the Indian economy. Learn about IT services, capital banks, energy conglomerates, and key stock market indices.',
    content: [
      'The Indian stock market represents one of the fastest-growing major economies. The benchmark indices, Nifty 50 and BSE Sensex, track the performance of high-volume blue-chip corporations across several critical sectors.',
      '**The Banking & Financial Services Sector (BFSI)**: The most heavily weighted sector in the Nifty 50 (over 30%). It is anchored by major private institutions like HDFC Bank and ICICI Bank, and state-backed titans like State Bank of India (SBIN). This sector tracks overall consumer credit expansions and GDP velocity.',
      '**Information Technology (IT) Sector**: Represented by global software consultancies like Tata Consultancy Services (TCS) and Infosys (INFY). These firms earn substantial revenues in US Dollars from global enterprise software contracts, acting as a natural defense during Indian rupee fluctuations.',
      '**Energy and Conglomerates**: Led by Reliance Industries (RELIANCE)—the largest private corporation in India spanning oil refining, telecom (Jio), and retail platforms. Understanding these weight distributions is vital, as a major swing in Reliance or HDFC alone can move the entire Nifty or Sensex index.'
    ]
  },
  {
    id: 'art-stocks-nse-nyse',
    title: 'Global Equities: Navigating Indian NSE and US Stock Markets',
    category: 'stocks',
    difficulty: 'Beginner',
    timeToRead: '6 min',
    summary: 'A roadmap to trading in major stock exchanges like India (NSE) and the USA (NYSE/NASDAQ), understanding timezone differences, index weights, and market mechanics.',
    content: [
      'The stock market is a platform where shares of publicly listed companies are traded. Major world markets offer unique liquidity dynamics and growth attributes.',
      '**Indian Equities (NSE/BSE)**: Anchored by the benchmark Nifty 50 and Sensex, Indian stock markets represent high-growth emerging GDP potential. Nifty 50 tracks the top 50 blue-chip conglomerates like Reliance Industries, TCS, and HDFC Bank. Indian trading hours run from 9:15 AM to 3:30 PM Indian Standard Time (IST), Monday to Friday.',
      '**US Equities (NYSE/NASDAQ)**: The largest capital market pool globally. Major indicators are the S&P 500 (.SPX) and Nasdaq 100. It is heavily weighted by mega-cap technology systems like Apple (AAPL), Microsoft (MSFT), and Nvidia (NVDA). Main session hours are 9:30 AM to 4:00 PM EST.',
      '**Key Concept (Market Hours and Slippage)**: When trading international assets, you must account for local exchange operating hours. Trading outside main session hours (pre-market or after-hours) often suffers from lower liquidity and wider bid-ask spreads, which can affect execution prices.'
    ]
  },
  {
    id: 'art-crypto-web3-mechanics',
    title: 'Decentralized Applications: Liquidity Pools, Smart Contracts & Gas Fees',
    category: 'crypto',
    difficulty: 'Intermediate',
    timeToRead: '6 min',
    summary: 'An intermediate inspection of Decentralized Finance (DeFi) mechanics. Learn about automated market makers and validation protocols.',
    content: [
      'Beyond trading simple spot cryptocurrencies, investors can interact with Decentralized Finance (DeFi) networks via smart contracts. A smart contract is an autonomous, self-executing software script written on blockchain nodes.',
      '**Automated Market Makers (AMMs)**: Platforms like Uniswap (UNI) eliminate traditional orderbook matching. Instead, assets are parked in "Liquidity Pools" containing pairs of assets (e.g. ETH/USDC). Traders swap directly against the pool, while liquidity providers earn professional protocol swap fees.',
      '**Gas and Network Fees**: Every transaction on public chains requires computation. This computation is paid in the chain’s native token (e.g. Ether on Ethereum, SOL on Solana) as a "Gas fee". Gas prices spike during periods of high congestion, making low-cost Layer 1 consensus networks highly attractive.',
      'Participating in DeFi setups yields high returns, but exposes capital to smart contract exploits, code bugs, and impermanent loss (where holding individual spot tokens yields more value than parking them in a liquidity pool).'
    ]
  },
  {
    id: 'art-crypto-volatility',
    title: 'The Crypto Frontier: Decentralization & High-Beta Volatility',
    category: 'crypto',
    difficulty: 'Intermediate',
    timeToRead: '7 min',
    summary: 'Mastering decentralized assets like Bitcoin and Ethereum. Explore blockchain consensus, liquidity nodes, and managing severe drawdowns in crypto.',
    content: [
      'Cryptocurrencies are decentralized digital currencies anchored by cryptographic block ledgers. Because they operate independent of central reserve banks, they serve as high-beta alternatives to standard investment classes.',
      '**Bitcoin (BTC)** is often described as digital gold because of its programmed scarcity limit (21 Million maximum supply). **Ethereum (ETH)** acts as a decentralized software computer enabling smart contracts and decentralized finance (DeFi) networks.',
      '**Volatility Metrics**: Cryptocurrencies trade 24/7. Because there are no market halts, circuit breakers, or country-specific timezone closures, the correlation shifts are rapid and drastic. A standard crypto portfolio must apply strict risk-gapping rules, keeping position sizes small (typically 2% to 5% of total wealth).',
      'Investors must prioritize secure storage. Storing crypto on centralized exchanges exposes you to third-party solvency risks (e.g. historical exchange collapses). Professional traders utilize cold storage hardware wallets with offline private seed signatures.'
    ]
  },
  {
    id: 'art-options-hedging',
    title: 'Derivatives Masterclass: Core Options Buying and Hedging Tactics',
    category: 'advanced',
    difficulty: 'Advanced',
    timeToRead: '9 min',
    summary: 'Step into the derivative rings. Master Call Options, Put Options, premium calculations, Greeks decay, and hedging spot exposures.',
    content: [
      'Options are derivative contracts giving the buyer the right (but not the obligation) to buy (Call) or sell (Put) a specific asset at an agreed price (Strike Price) before a set expiration date.',
      '**Calls vs Puts**: If you expect AAPL to rally, buy a Call. If you expect a market correction, buy a Put. Puts represent the ultimate portfolio hedge. If you own ₹10,00,000 of Nifty stocks, buying Put contracts offsets potential negative drawdowns, acting as portfolio insurance.',
      '**Option Premium & Greeks**: The cost of buying an option is called the premium. This premium is heavily managed by mathematical Greek metrics: **Delta** (sensitivity to price changes), **Theta** (daily valuation decay over time), and **Vega** (sensitivity to expected volatility).',
      'Theta decay is the option writer’s best friend and option buyer’s silent enemy. As the expiration date draws closer, the option’s time value decays exponentially, moving to zero if the option expires out-of-the-money.'
    ]
  },
  {
    id: 'art-forex-leverage',
    title: 'Forex Foundations: Currency Pairs, PIPs, and Macro Economics',
    category: 'forex',
    difficulty: 'Intermediate',
    timeToRead: '6 min',
    summary: 'Deep-dive into the largest financial market. Learn about currency cross rates, PIP calculations, interest rate parity, and leverage risk profiles.',
    content: [
      'The Foreign Exchange (Forex) market translates national currencies relative to one another. The most active trading instruments include major pairings like EUR/USD, GBP/USD, and USD/INR.',
      '**Pip Mechanics**: Forex quotes are priced out to 4 or 5 decimal places (e.g. USD/INR = 83.5620). A PIP (Percentage in Point) is the smallest incremental price move, usually representing 0.0001 (or the 4th decimal). Because individual pip fluctuations represent micro-fractions of a cent, forex trading utilizes extreme leverage multipliers.',
      '**Leverage Hazard warning**: While leverage (e.g. 50x or 100x borrowing) magnifies profits on minor currency swings, it equally accelerates losses. It is highly possible to liquidate an entire forex holding in seconds if risk margins are not protected by immediate-action stop orders.',
      'Macro catalysts like central bank interest rate announcements (the Federal Reserve, Reserve Bank of India) dictate long-term currency trajectories. A country with higher nominal interest rates typically attracts yield-seeking capital, strengthening its currency relative to lower-rate peers.'
    ]
  },
  {
    id: 'art-risk-management',
    title: 'Risk Parity and Capital Preservation: The Pro’s Secret',
    category: 'risk_management',
    difficulty: 'Advanced',
    timeToRead: '8 min',
    summary: 'How top-tier hedge funds construct portfolios. Learn Stop Loss placement, position sizing formulas, Correlation matrices, and Drawdown defense.',
    content: [
      'Amateur traders focus entirely on potential gains; world-class professionals focus strictly on minimizing drawdowns. If your account drops by 50%, you need a 100% gain just to break even.',
      '**The Position Sizing Formula**: Never risk more than 1% to 2% of total capital on a single trade. To calculate: `Quantity = (Portfolio Capital * Risk %) / (Entry Price - Stop Loss Price)`. This ensures that even if you suffer five consecutive losses, your principal drawdown is kept under 10%.',
      '**Risk/Reward Ratio (R:R)**: Always aim for a minimum 1:2 or 1:3 ratio. This means if you are risking $100 on a trade, your target payout is $305. With a 1:3 ratio, you can be wrong 60% of the time and still remain consistently profitable.',
      '**Asset Diversification Matrix**: Correlation coefficient measures how closely two assets move together (from -1 to +1). For defense, pair positive-beta assets (stocks/crypto) with uncorrelated or negative-beta instruments (government bonds, physical commodities like gold) to absorb market-wide shocks.'
    ]
  },
  {
    id: 'art-indicators-quant',
    title: 'Quantitative Indicators: Leveraging Math in Trading Decisions',
    category: 'advanced',
    difficulty: 'Advanced',
    timeToRead: '10 min',
    summary: 'A masterclass explaining top quant indicators: RSI divergence, Bollinger band squeezes, VWAP institutions, and MACD momentum histograms.',
    content: [
      'Technical indicators apply mathematical filters to historical exchange data (price and volume). They help eliminate emotional bias and identify high-probability entry Zones.',
      '**Relative Strength Index (RSI)**: A momentum oscillator tracking the speed of price changes from 0 to 100. Values above 70 indicate overbought conditions (sell pressure accumulating), while values below 30 signal oversold extremes (potential accumulation zone). Advanced quants trade **RSI Divergences**, where price sets a new low but the oscillator sets a higher low, signaling structural exhaustion.',
      '**Volume Weighted Average Price (VWAP)**: The true average price of an asset throughout the current session based on both price points and transaction volumes. Institutional funds use VWAP as their prime benchmark; they try to execute orders close to or below VWAP for optimal average fill prices.',
      '**Bollinger Bands**: Visualizes market volatility using standard deviations plotted around a simple moving average. When the bands contract tightly (the squeeze), it signals extremely low volatility. Since markets transition dynamically from low-volatility to high-volatility, a band squeeze is typically followed by a massive, high-velocity breakout expansion.'
    ]
  },
  {
    id: 'art-indian-taxation-2024',
    title: 'Indian Taxation & Investments: Compounding Under Budget 2024 (ELSS, PPF, SGB & LTCG)',
    category: 'risk_management',
    difficulty: 'Intermediate',
    timeToRead: '8 min',
    summary: 'A definitive guide to Indian investment taxation, Section 80C deductions, compounding via ELSS and PPF, and navigating the new 12.5% Long-Term Capital Gains tax rules.',
    content: [
      'For Indian investors, maximizing actual take-home wealth requires a solid understanding of Indian taxation and direct investment channels. The current Union Budget 2024 introduced essential tweaks to long-term compounding channels.',
      '**Section 80C and Deductions**: Section 80C of the Income Tax Act allows citizens to deduct up to ₹1,50,050 annually from their taxable income by investing in specific instruments. The two most popular modes are: (1) **ELSS Mutual Funds**, offering high equity-linked compounding with the lowest lock-in period of just 3 years. (2) **Public Provident Fund (PPF)**, offering sovereign, risk-free interest (typically ~7.1% p.a.) backed by the Government of India, but holding a 15-year lock-in period with tax-free interest accruals.',
      '**Sovereign Gold Bonds (SGBs) and Real Estate**: SGBs are highly recommended for Indian portfolio diversification. Issued by the Reserve Bank of India (RBI), they pay a fixed annual interest rate (e.g. 2.50%) on the initial investment, and capital appreciation is completely exempt from income tax if held until maturity (8 years). SGBs serve as a modern digital alternative to storage-heavy physical gold.',
      '**Long-Term and Short-Term Capital Gains (LTCG vs STCG)**: In the latest Union Budget 2024 parameters: (1) **LTCG** on equity-oriented assets (holding period > 1 year) is taxed at 12.5% on capital gains exceeding ₹1.25 Lakhs per financial year. (2) **STCG** (holding period < 1 year) is taxed at a flat rate of 20% on gains. Tax planning ensures you systematically capture ₹1.25 Lakhs of tax-free LTCG harvests yearly to maximize long-term index compounding in Nifty and Sensex.'
    ]
  },
  {
    id: 'art-greeks-arbitrage-301',
    title: 'Advanced Option Greeks & Quantitative Delta-Neutral Hedging',
    category: 'advanced',
    difficulty: 'Advanced',
    timeToRead: '10 min',
    summary: 'A deep dive into delta-neutral stock arbitrage, mathematical Greek profiles, gamma squeezes, and institutional statistical market-neutral desk systems.',
    content: [
      'In high-volume trading, institutional desks rarely take directional standard price risk. Instead, they operate dynamic **Delta-Neutral** portfolios. Delta represents the sensitivity of an option premium to changes in the underlying asset’s price. By combining stock positions with short and long options, a trader can create a portfolio with a net Delta of zero.',
      '**The Greeks Hierarchy (Gamma, Theta, Vega)**: (1) **Gamma** measures the acceleration rate of Delta. If you are long Gamma, your portfolio accumulates Delta rapidly in the direction of the trend. (2) **Theta** is the daily decay rate of options. Market makers harvest Theta by selling premium to capture time erosion. (3) **Vega** monitors option pricing sensitivity to shifts in Implied Volatility (IV). Buying options prior to corporate earnings reports captures Vega expansions but suffers under the post-earnings IV crush.',
      '**The Mechanics of a Gamma Squeeze**: When retail traders purchase large volumes of out-of-the-money (OTM) Call options, institutional option writers are forced to dynamically hedge their exposure. To remain delta-neutral, these market-makers must buy shares of the underlying stock as the price moves up. This forced purchasing accelerates the upward swing, triggering a parabolic liquidity sweep (the Gamma Squeeze).'
    ]
  },
  {
    id: 'art-commodity-gold-hedging',
    title: 'Commodity Trading & MCX Gold Hedging for Cross-Border Portfolios',
    category: 'forex',
    difficulty: 'Intermediate',
    timeToRead: '8 min',
    summary: 'Master commodity pricing, gold contract correlations during inflation indices, and hedging price-action risks using Indian MCX futures pipelines.',
    content: [
      'Commodities are tangible raw materials traded on major futures exchanges (e.g. COMEX globally, Multi Commodity Exchange of India - MCX domestically). Gold, Silver, Crude Oil, and Natural Gas are classical hedges during macroeconomic currency depreciations.',
      '**Gold as an Inflation Offset**: Globally tracked under symbol **GC=F**, gold is the traditional currency-offset standard. In Indian households, gold holds cultural and financial significance, acting as a structural collateral buffer. When global currencies experience inflation or nominal interest rate contractions, capital shifts into gold, driving double-digit returns.',
      '**MCX Futures Hedging Mechanics**: For business owners and jewelers, gold raw material costs represent key overhead threats. By establishing a short position in MCX Gold futures, they can look-in purchase prices months in advance. Any premium increases in local physical gold are offset by profitable gains in their futures accounts, demonstrating professional corporate risk shielding.'
    ]
  }
];

interface CandlePattern {
  name: string;
  type: 'bullish' | 'bearish' | 'neutral';
  reliability: 'High' | 'Medium' | 'Low';
  description: string;
  tacticalTip: string;
  candles: {
    color: 'green' | 'red' | 'gray';
    open: number;  // percent height
    close: number; // percent height
    high: number;  // percent height
    low: number;   // percent height
    label?: string;
  }[];
}

const CANDLE_PATTERNS: CandlePattern[] = [
  {
    name: 'The Hammer',
    type: 'bullish',
    reliability: 'Medium',
    description: 'A bullish reversal pattern that forms during a downward price slide. The long lower shadow (wick) shows that sellers drove the price lower, but buyers pushed it aggressively back near the opening price before the close of the session.',
    tacticalTip: 'Look for a Hammer at historical support zones. Confirm with a high-volume green candle on the following session before entering long trades.',
    candles: [
      { color: 'red', open: 70, close: 50, high: 75, low: 45, label: 'Prev Day' },
      { color: 'green', open: 20, close: 25, high: 27, low: 2, label: 'Hammer' }
    ]
  },
  {
    name: 'Shooting Star',
    type: 'bearish',
    reliability: 'Medium',
    description: 'A bearish reversal pattern that forms at peak stock or crypto rallies. It features a tiny lower body and a long upper wick, indicating buyers dominated early but bears slammed the price action before closing.',
    tacticalTip: 'Place a protective stop order just above the top of the shooting star upper wick. Often signals a major downward shift.',
    candles: [
      { color: 'green', open: 40, close: 60, high: 62, low: 35, label: 'Prev Day' },
      { color: 'red', open: 25, close: 18, high: 75, low: 15, label: 'Star' }
    ]
  },
  {
    name: 'Bullish Engulfing',
    type: 'bullish',
    reliability: 'High',
    description: 'A robust double-candle reversal signal. The second green candle completely surrounds and swallows the body of the previous red candle, showing a powerful takeover of purchasing power over liquidate sellers.',
    tacticalTip: 'The larger the engulfing green body relative to the previous red candle, the stronger the potential momentum breakout.',
    candles: [
      { color: 'red', open: 65, close: 45, high: 70, low: 40, label: 'Session 1' },
      { color: 'green', open: 35, close: 75, high: 80, low: 30, label: 'Session 2' }
    ]
  },
  {
    name: 'Bearish Engulfing',
    type: 'bearish',
    reliability: 'High',
    description: 'A stark bearish takeover warning. The large red body fully encompasses the previous green candle body, indicating aggressive institutional liquidation waves.',
    tacticalTip: 'Traders use this pattern on daily index lines as a heavy warning to reduce margin leverage or purchase protective Put options.',
    candles: [
      { color: 'green', open: 40, close: 55, high: 60, low: 35, label: 'Session 1' },
      { color: 'red', open: 65, close: 30, high: 70, low: 25, label: 'Session 2' }
    ]
  },
  {
    name: 'Classic Doji',
    type: 'neutral',
    reliability: 'Low',
    description: 'Represents crossroad indecision where buyers and sellers are perfectly balanced, rendering an identical opening and closing price.',
    tacticalTip: 'A Doji in a vacuum is non-directional. Wait for the market breakout above or below the doji wick before initiating trades.',
    candles: [
      { color: 'gray', open: 48, close: 48, high: 90, low: 10, label: 'Doji' }
    ]
  },
  {
    name: 'Bullish Marubozu',
    type: 'bullish',
    reliability: 'High',
    description: 'A solid, full-bodied candle with zero (or extremely tiny) wicks. It shows buyers bid up the security from open to close without letting sellers push price back.',
    tacticalTip: 'Signals strong direct buying conviction. Often occurs at breakout points and suggests further continuation.',
    candles: [
      { color: 'green', open: 15, close: 85, high: 85, low: 15, label: 'Solid Bull' }
    ]
  }
];

interface Flashcard {
  id: string;
  term: string;
  context: string;
  definition: string;
  example: string;
}

const FLASHCARDS: Flashcard[] = [
  {
    id: 'fc-1',
    context: 'Decentralized Finance (DeFi)',
    term: 'Impermanent Loss (IL)',
    definition: 'The temporary loss of funds that liquidity providers experience on AMMs due to volatility in a trading pair. It happens when the price ratio of joined tokens diverges from when they were deposited.',
    example: 'If you deposit equal parts ETH and USDC into a pool, and ETH doubles in value, arbitrageurs drain some ETH. If you withdraw, you end up with less total value than if you had simply held the individual ETH offline.'
  },
  {
    id: 'fc-2',
    context: 'Quantitative Statistics',
    term: 'Standard Deviation (σ)',
    definition: 'A statistical measure of dispersion that calculates how far prices deviate from their average. Within Bollinger Bands, standard deviation defines the outer boundary bands representing 95% of expected trades.',
    example: 'An asset trading with a $100 average and a $2 standard deviation is highly stable. If it spikes to $106 (+3 Standard Deviations), it is statically a rare 0.3% outlier, indicating extreme overbought fatigue.'
  },
  {
    id: 'fc-3',
    context: 'Derivatives / Options',
    term: 'Theta Decay',
    definition: 'The rate of decline in the value of an option contract as time passes, representing time value erosion. Formally referred to as a Greek metric.',
    example: 'If you purchase an out-of-the-money Call option expiring in 3 days, it loses value every single hour of the day, even if the underlying stock remains perfectly unchanged.'
  },
  {
    id: 'fc-4',
    context: 'Market Mechanics',
    term: 'Orderbook Slippage',
    definition: 'The difference between the expected price of a trade and the actual execution price. Slippage occurs during high volatility or in thin, low-liquidity books.',
    example: 'You try to buy 1,000 shares of a small stock at a limit of $50, but because there are only 100 shares available at $50, your remaining 900 shares get filled at $50.50 and $51.00.'
  },
  {
    id: 'fc-5',
    context: 'Algorithmic Charts',
    term: 'The Golden Cross',
    definition: 'An elite technical chart pattern occurring when a short-term moving average (typically the 50 SMA) crosses upwards over a long-term moving average (typically the 200 SMA).',
    example: 'When Bitcoin experienced a Golden Cross on the daily chart in previous cycles, it signaled the transition from bear accumulation to a structural macro bull run.'
  },
  {
    id: 'fc-6',
    context: 'Institutional Assets',
    term: 'Yield Curve Inversion',
    definition: 'A macro financial anomaly where short-term government debt instruments yield higher interest utility than long-term bonds of equal credit standing.',
    example: 'If 2-Year US Treasury bonds yield 5.2% while 10-Year Treasury bonds yield 4.1%, it signals that banking desks expect near-term recession and rate cuts, inverting the normal yields curve.'
  }
];

export default function Academy({ onSelectAsset, setView, assets }: AcademyProps) {
// Main Sub-Tab selection: briefings, candlesticks, calculators, flashcards, options
  const [activeAcademySubTab, setActiveAcademySubTab] = useState<'briefings' | 'candlesticks' | 'calculators' | 'flashcards' | 'options'>('briefings');
  
  // Tab 1: Briefings State
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'bonds' | 'stocks' | 'crypto' | 'forex' | 'risk_management' | 'advanced'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'Beginner' | 'Intermediate' | 'Advanced'>('all');
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
  const [completedArticles, setCompletedArticles] = useState<string[]>(() => {
    const saved = localStorage.getItem('finova_completed_articles');
    return saved ? JSON.parse(saved) : ['art-bonds-101'];
  });

  // Tab 2: Candlesticks Playground State
  const [selectedPattern, setSelectedPattern] = useState<CandlePattern>(CANDLE_PATTERNS[0]);

  // Tab 3: Calculators State
  const [calcCurrency, setCalcCurrency] = useState<'USD' | 'INR' | 'GBP'>('INR');
  
  // Position Sizing variables
  const [accountBalance, setAccountBalance] = useState<string>('500000');
  const [riskPercentage, setRiskPercentage] = useState<string>('1.5');
  const [entryPrice, setEntryPrice] = useState<string>('3400');
  const [stopLossPrice, setStopLossPrice] = useState<string>('3250');
  
  // SIP Growth variables
  const [sipMonthly, setSipMonthly] = useState<string>('10000');
  const [sipRate, setSipRate] = useState<string>('13.5');

  // Tab 4: Flashcards Flipped Status
  const [flippedCardIds, setFlippedCardIds] = useState<string[]>([]);

  // Tab 5: Dynamic Options Strategies Sandbox
  const [optStrategy, setOptStrategy] = useState<'covered_call' | 'bull_call_spread' | 'iron_condor' | 'straddle'>('covered_call');
  const [optStrike, setOptStrike] = useState<number>(100);
  const [optPremium, setOptPremium] = useState<number>(4);

  const optionPayoffData = useMemo(() => {
    const data = [];
    const minS = 60;
    const maxS = 140;
    const steps = 41; // intervals of 2

    for (let s = minS; s <= maxS; s += (maxS - minS) / (steps - 1)) {
      const stockPrice = Math.round(s);
      let pnl = 0;

      if (optStrategy === 'covered_call') {
        const stockCostBase = optStrike - 5; // assume purchase price is slightly cheaper
        const payoffStock = stockPrice - stockCostBase;
        const payoffCallSold = Math.max(0, stockPrice - optStrike);
        pnl = payoffStock - optPremium - payoffCallSold;
      } else if (optStrategy === 'bull_call_spread') {
        const lowerK = optStrike - 10;
        const upperK = optStrike + 10;
        pnl = Math.max(0, stockPrice - lowerK) - Math.max(0, stockPrice - upperK) - optPremium;
      } else if (optStrategy === 'iron_condor') {
        const p1 = optStrike - 15;
        const p2 = optStrike - 5;
        const c1 = optStrike + 5;
        const c2 = optStrike + 15;
        
        let profit = optPremium; // credits
        if (stockPrice < p2) {
          profit -= Math.min(p2 - p1, p2 - stockPrice);
        } else if (stockPrice > c1) {
          profit -= Math.min(c2 - c1, stockPrice - c1);
        }
        pnl = profit;
      } else if (optStrategy === 'straddle') {
        pnl = Math.abs(stockPrice - optStrike) - optPremium;
      }

      data.push({
        stockPrice,
        pnl: parseFloat(pnl.toFixed(2)),
        zero: 0
      });
    }
    return data;
  }, [optStrategy, optStrike, optPremium]);

  // Interactive Quiz State (Renders contextually on Tab 1 sidebar)
  const QUIZ_QUESTIONS = [
    {
      text: "According to bond market fundamentals, what happens to bond portfolio prices when interest rates rise?",
      options: [
        "A) Bond prices rise proportionally because elevated yields create abundance.",
        "B) Bond prices decline, because older lower-coupon bonds become less attractive than new higher-yielding issues.",
        "C) Bond prices remain completely frozen, as they have locked-in coupon structures.",
        "D) Bond prices freeze and exchange trading volumes drop to zero."
      ],
      correctIdx: 1,
      explanation: "Bond prices and interest rates have an inverse relationship. When rates rise, older bonds with lower yields drop in value to compete with new higher-coupon issues."
    },
    {
      text: "Which of the following describes ELSS (Equity Linked Savings Scheme) in the Indian investment context?",
      options: [
        "A) A fixed corporate insurance plan with a 15-year statutory maturity lock.",
        "B) An equity mutual fund with a 3-year lock-in qualifying for tax deductions under Section 80C.",
        "C) A liquid currency swap pair traded natively on leveraged forex exchanges.",
        "D) A government gold certificate tracking local physical consumer gold inflation."
      ],
      correctIdx: 1,
      explanation: "ELSS is an equity mutual fund in India that offers dual benefits of capital appreciation and tax saving up to ₹1.5 Lakhs under Section 80C. It has the shortest lock-in period (3 years) among tax-saving assets."
    },
    {
      text: "What is an Indian Sovereign Gold Bond (SGB) and how does its interest mechanism work?",
      options: [
        "A) A digital decentralized cryptocurrency matching physical jewelry production.",
        "B) RBI-issued securities denominated in grams of Gold that pay 2.5% fixed annual interest plus asset price capital gains.",
        "C) An option derivative contract traded exclusively for speculative daily leverage.",
        "D) Private corporate equity in metal manufacturing groups."
      ],
      correctIdx: 1,
      explanation: "Sovereign Gold Bonds (SGBs) are issued by the RBI on behalf of the Government. They offer security, capital gains tracking physical gold prices, and pay a fixed 2.5% annual coupon interest (credited semi-annually)."
    },
    {
      text: "What is the primary advantage of a Systematic Investment Plan (SIP) in diversified mutual funds?",
      options: [
        "A) It guarantees fixed non-volatile returns regardless of market performance.",
        "B) It leverages rupee-cost averaging, enabling acquisition of more units when prices drop and fewer units when prices rise.",
        "C) It allows 150x leverage margins for intraday trading sweeps.",
        "D) It protects your account entirely from global inflation shifts."
      ],
      correctIdx: 1,
      explanation: "SIP uses rupee-cost averaging. Regular, fixed-amount investments mean you automatically buy more units at lower prices during market corrections, averaging out your acquisition cost over time without needing to time the market."
    }
  ];

  const [currentQuizIdx, setCurrentQuizIdx] = useState<number>(0);
  const [quizAnswered, setQuizAnswered] = useState<boolean>(false);
  const [selectedQuizIndex, setSelectedQuizIndex] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [answeredCorrectly, setAnsweredCorrectly] = useState<number[]>([]);

  const activeQuestion = QUIZ_QUESTIONS[currentQuizIdx];

  const handleQuizOptionClick = (idx: number) => {
    if (quizAnswered) return;
    setSelectedQuizIndex(idx);
    setQuizAnswered(true);
    if (idx === activeQuestion.correctIdx) {
      if (!answeredCorrectly.includes(currentQuizIdx)) {
        setAnsweredCorrectly(prev => [...prev, currentQuizIdx]);
        setQuizScore(prev => prev + 1);
      }
    }
  };

  const toggleArticleComplete = (id: string) => {
    setCompletedArticles(prev => {
      const updated = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('finova_completed_articles', JSON.stringify(updated));
      return updated;
    });
  };

  const filteredArticles = EDUCATIONAL_ARTICLES.filter(article => {
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesDifficulty = difficultyFilter === 'all' || article.difficulty === difficultyFilter;
    const matchesSearch = searchQuery.trim() === '' || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      article.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesDifficulty && matchesSearch;
  });

  const getDifficultyBadgeColor = (diff: 'Beginner' | 'Intermediate' | 'Advanced') => {
    if (diff === 'Beginner') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (diff === 'Intermediate') return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  };

  const progressPercentage = Math.round((completedArticles.length / EDUCATIONAL_ARTICLES.length) * 100);

  // Position Sizing calculations
  const positionSizeResults = useMemo(() => {
    const balance = parseFloat(accountBalance) || 10000;
    const riskPercent = parseFloat(riskPercentage) || 1;
    const entry = parseFloat(entryPrice) || 150;
    const stop = parseFloat(stopLossPrice) || 142;

    const amountAtRisk = balance * (riskPercent / 100);
    const tradeDiff = Math.abs(entry - stop);
    const positionSize = tradeDiff > 0 ? (amountAtRisk / tradeDiff) : 0;
    const totalPositionCost = positionSize * entry;
    const percentLossAsset = entry > 0 ? (tradeDiff / entry) * 100 : 0;
    const leverageMultiplier = balance > 0 ? totalPositionCost / balance : 0;

    return {
      amountAtRisk,
      positionSize,
      totalPositionCost,
      percentLossAsset,
      leverageMultiplier
    };
  }, [accountBalance, riskPercentage, entryPrice, stopLossPrice]);

  // SIP Mutual Fund compounding calculations
  const calculateSipWealth = (monthlyAmt: number, annualRate: number, years: number) => {
    const i = annualRate / 12 / 100;
    const n = years * 12;
    if (i === 0) return { invested: monthlyAmt * n, futureValue: monthlyAmt * n, wealthGained: 0 };
    
    // SIP mutual fund compounding algorithm
    const futureValue = monthlyAmt * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    const invested = monthlyAmt * n;
    const wealthGained = Math.max(0, futureValue - invested);
    
    return {
      invested: Math.round(invested),
      futureValue: Math.round(futureValue),
      wealthGained: Math.round(wealthGained)
    };
  };

  const sipMilestones = useMemo(() => {
    const years = [1, 3, 5, 10, 15, 20];
    const monthlyAmt = parseFloat(sipMonthly) || 5000;
    const rate = parseFloat(sipRate) || 12;

    return years.map(yrs => {
      const stats = calculateSipWealth(monthlyAmt, rate, yrs);
      return {
        years: yrs,
        ...stats
      };
    });
  }, [sipMonthly, sipRate]);

  // Currency Formatter helper
  const currencySign = calcCurrency === 'INR' ? '₹' : (calcCurrency === 'GBP' ? '£' : '$');
  const formatSipCurrency = (num: number) => {
    return currencySign + ' ' + Intl.NumberFormat().format(Math.round(num));
  };

  const toggleFlashcardFlip = (id: string) => {
    setFlippedCardIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div id="vymx-academy-portal" className="space-y-6 pt-2 animate-fade-in">
      
      {/* Onboarding Header Banner */}
      <div className="rounded-2xl border border-zinc-850 bg-gradient-to-tr from-zinc-950 via-zinc-900 to-indigo-950/25 p-5 shadow-xl relative overflow-hidden" id="academy-hero-banner">
        <div className="absolute top-0 right-0 h-48 w-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 h-32 w-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest bg-cyan-500/10 text-cyan-400 uppercase border border-cyan-500/20">
              <Sparkles className="h-3 w-3 text-cyan-400" /> Vymx Wealth Academy
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl font-sans leading-none">
              Accelerate Your Trading Intelligence
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Unlock interactive candlestick playgrounds, position sizing models, SIP Indian market wealth compounding grids, and standard technical indicator definers. Level up from novice to master quant.
            </p>
          </div>

          {/* Achievement Trophy Circular Progression Tracker */}
          <div className="flex items-center gap-4 bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 backdrop-blur-sm self-start md:self-auto min-w-[245px]">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-indigo-950/40 text-indigo-400 border border-indigo-500/20 shadow">
              <Award className="h-7 w-7 text-indigo-400 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500/10"></div>
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500" style={{ transform: `rotate(${progressPercentage * 3.6}deg)` }}></div>
            </div>
            <div>
              <div className="text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">My Learning Stats</div>
              <div className="text-base font-bold text-white font-sans">{progressPercentage}% Complete</div>
              <div className="text-[10px] text-zinc-500">{completedArticles.length} of {EDUCATIONAL_ARTICLES.length} articles read</div>
            </div>
          </div>
        </div>
      </div>

      {/* Academy Navigation Tabs (Expanded Tab List) */}
      <div className="flex border-b border-zinc-850 gap-2 overflow-x-auto pb-px" id="academy-view-tab-selector">
        {[
          { id: 'briefings', label: '📖 Lesson Briefings', desc: 'Browse courses & macro notes' },
          { id: 'candlesticks', label: '🕯️ Candlestick Sandbox', desc: 'Learn visual pattern wicks' },
          { id: 'calculators', label: '🧮 Investor Calculators', desc: 'Sizing & wealth accumulation' },
          { id: 'flashcards', label: '🃏 Quant Flashcards', desc: 'Tactile trading jargon card deck' },
          { id: 'options', label: '📊 Option Strategies', desc: 'Interactive strategy payoff curves' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveAcademySubTab(tab.id as any);
              if (tab.id !== 'briefings') {
                setActiveArticleId(null);
              }
            }}
            className={`flex-1 min-w-[145px] px-3.5 py-3 rounded-t-xl text-left border-t border-x transition-all duration-300 relative cursor-pointer ${
              activeAcademySubTab === tab.id
                ? 'bg-zinc-950 border-zinc-850 border-b-transparent text-white'
                : 'bg-zinc-900/10 border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/20'
            }`}
          >
            <div className="text-xs font-bold font-sans flex items-center gap-1">
              <span>{tab.label}</span>
              {tab.id !== 'briefings' && <span className="text-[8px] bg-indigo-500/20 text-indigo-400 px-1 rounded-full text-center">New</span>}
            </div>
            <div className="text-[9px] text-zinc-500 font-medium mt-0.5">{tab.desc}</div>
            {activeAcademySubTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full"></div>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        
        {/* TAB 1: CURATED LESSONS & ARTICLES (The core documentation layout) */}
        {activeAcademySubTab === 'briefings' && (
          <motion.div
            key="tab-briefings"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            id="tab-pane-lessons"
          >
            {/* Left 2 Columns: Filters & Article Listings */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Controls Panel */}
              <div className="flex flex-col sm:flex-row gap-3 bg-zinc-950 border border-zinc-850 p-3 rounded-xl" id="academy-controls">
                
                {/* Search Input */}
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Search className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-zinc-850 bg-zinc-900/40 py-2.5 pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-zinc-700 transition"
                    placeholder="Search academy logs, tax rules, stop loss ratios..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Difficulty Filter */}
                <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-850 px-2 py-1 rounded-lg shrink-0">
                  <span className="text-[9px] font-extrabold text-zinc-500 font-mono pl-1 uppercase">Tier:</span>
                  <select
                    className="bg-transparent text-xs text-zinc-300 outline-none border-none py-1 pr-4 cursor-pointer"
                    value={difficultyFilter}
                    onChange={(e: any) => setDifficultyFilter(e.target.value)}
                  >
                    <option value="all" className="bg-zinc-950">Show All Levels</option>
                    <option value="Beginner" className="bg-zinc-950">Beginner Tier</option>
                    <option value="Intermediate" className="bg-zinc-950">Intermediate tier</option>
                    <option value="Advanced" className="bg-zinc-950">Advanced Quant</option>
                  </select>
                </div>
              </div>

              {/* Categories Tab Bar */}
              <div className="flex overflow-x-auto gap-1.5 pb-1 scrollbar-none" id="academy-categories-tab">
                {[
                  { id: 'all', label: 'All Modules' },
                  { id: 'bonds', label: 'Bond Securities' },
                  { id: 'stocks', label: 'Equities Model' },
                  { id: 'crypto', label: 'Crypto Assets' },
                  { id: 'forex', label: 'Forex' },
                  { id: 'risk_management', label: 'Risk Parity' },
                  { id: 'advanced', label: 'Technical Indicators' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap border transition-all cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-850 hover:text-zinc-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Active Article Detail View Panel */}
              <AnimatePresence mode="wait">
                {activeArticleId && (() => {
                  const article = EDUCATIONAL_ARTICLES.find(a => a.id === activeArticleId);
                  if (!article) return null;
                  const isCompleted = completedArticles.includes(article.id);
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="rounded-xl border border-zinc-850 bg-zinc-950 p-5 space-y-5"
                      id="active-article-viewer"
                    >
                      <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                        <button
                          onClick={() => setActiveArticleId(null)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          ← Back to Module List
                        </button>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getDifficultyBadgeColor(article.difficulty)}`}>
                            {article.difficulty}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">{article.timeToRead} read</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h2 className="text-xl font-bold tracking-tight text-white font-sans">{article.title}</h2>
                        <p className="text-zinc-400 text-xs italic">{article.summary}</p>
                      </div>

                      <div className="space-y-3.5 text-xs leading-relaxed text-zinc-300 font-sans" id="article-content-paragraphs">
                        {article.content.map((paragraph, index) => (
                          <p key={index} className="pl-3 border-l-2 border-indigo-500/20 text-zinc-300">{paragraph}</p>
                        ))}
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-900">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold">Category:</span>
                          <span className="text-xs text-zinc-300 font-semibold font-sans capitalize bg-zinc-900 px-3 py-1 rounded-md border border-zinc-850">
                            {article.category.replace('_', ' ')}
                          </span>
                        </div>

                        <button
                          onClick={() => toggleArticleComplete(article.id)}
                          className={`w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 border cursor-pointer ${
                            isCompleted
                              ? 'bg-zinc-900 text-zinc-400 border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/20'
                          }`}
                        >
                          <ShieldCheck className="h-4 w-4" />
                          {isCompleted ? 'Marked as Unread' : 'Mark Lesson as Completed ✓'}
                        </button>
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>

              {/* Article Listings Grid */}
              {!activeArticleId && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="articles-list-grid">
                  {filteredArticles.length > 0 ? (
                    filteredArticles.map((art) => {
                      const isCompleted = completedArticles.includes(art.id);
                      return (
                        <div
                          key={art.id}
                          onClick={() => setActiveArticleId(art.id)}
                          className="group rounded-xl border border-zinc-850 bg-zinc-950 p-4 hover:bg-zinc-900/40 hover:border-zinc-805 transition-all cursor-pointer flex flex-col justify-between space-y-4 shadow-sm"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase font-mono ${getDifficultyBadgeColor(art.difficulty)}`}>
                                {art.difficulty}
                              </span>
                              <div className="flex items-center gap-1.5 text-zinc-500 group-hover:text-zinc-400 font-mono text-[10px]">
                                <Clock className="h-3 w-3" />
                                {art.timeToRead}
                              </div>
                            </div>

                            <h3 className="text-sm font-bold text-zinc-100 group-hover:text-white leading-snug transition-colors line-clamp-2">
                              {art.title}
                            </h3>

                            <p className="text-xs text-zinc-400 line-clamp-2">
                              {art.summary}
                            </p>
                            
                            {/* 100x AI Density Lesson Metrics */}
                            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                               <div>
                                  <div className="text-[8px] uppercase text-zinc-500 font-mono tracking-wider">Complexity</div>
                                  <div className="flex gap-0.5 mt-1">
                                    {[1, 2, 3, 4, 5].map(i => (
                                      <div key={i} className={`h-1 flex-1 rounded-sm ${i <= (art.difficulty === 'Advanced' ? 5 : art.difficulty === 'Intermediate' ? 3 : 1) ? 'bg-indigo-500' : 'bg-zinc-800'}`}></div>
                                    ))}
                                  </div>
                               </div>
                               <div>
                                  <div className="text-[8px] uppercase text-zinc-500 font-mono tracking-wider">Pass Rate</div>
                                  <div className="text-[10px] font-mono font-bold text-emerald-400 mt-0.5">
                                    {art.difficulty === 'Advanced' ? '42%' : art.difficulty === 'Intermediate' ? '68%' : '94%'}
                                  </div>
                               </div>
                               <div>
                                  <div className="text-[8px] uppercase text-zinc-500 font-mono tracking-wider">AI Impact</div>
                                  <div className="text-[10px] font-mono font-bold text-amber-400 mt-0.5">
                                    {(9.9 - (art.title.length % 5)).toFixed(1)}/10
                                  </div>
                               </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-zinc-900/60 mt-2">
                            <span className={`text-[10px] font-semibold flex items-center gap-1 ${
                              isCompleted ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'
                            }`}>
                              {isCompleted ? (
                                <>✓ Ready & Completed</>
                              ) : (
                                <>Start Lesson <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" /></>
                              )}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono capitalize">
                              {art.category.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="md:col-span-2 py-12 text-center rounded-xl bg-zinc-950 border border-zinc-850 p-6">
                      <BookOpen className="h-8 w-8 mx-auto text-zinc-650 mb-2" />
                      <p className="text-zinc-400 text-xs font-semibold">No educational modules found matching "{searchQuery}"</p>
                      <p className="text-zinc-650 text-[10px] mt-1">Try broadening your filters or clearing search queries.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar Columns: Interactive Quiz & Rules */}
            <div className="space-y-5" id="academy-sidebar">
              
              {/* Interactive Knowledge check Card */}
              <div className="rounded-xl border border-zinc-850 bg-zinc-950 p-4 space-y-4 relative overflow-hidden" id="academy-quiz-card">
                <div className="absolute top-0 right-0 h-16 w-16 bg-blue-500/[0.02] rounded-full blur-xl"></div>
                
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <div className="flex items-center gap-1.5 text-indigo-400">
                    <HelpCircle className="h-4 w-4 text-indigo-400" />
                    <span className="text-[10px] font-black tracking-widest uppercase font-mono">Knowledge Check</span>
                  </div>
                  <span className="text-[9px] font-bold font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded">
                    Q {currentQuizIdx + 1}/{QUIZ_QUESTIONS.length}
                  </span>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-100 leading-relaxed font-sans">
                    {activeQuestion.text}
                  </h4>

                  <div className="space-y-1.5" id="quiz-options-list">
                    {activeQuestion.options.map((opt, idx) => {
                      let optionStyle = 'border-zinc-850 hover:border-zinc-700 bg-zinc-900/30 text-zinc-300';
                      
                      if (quizAnswered) {
                        if (idx === activeQuestion.correctIdx) {
                          optionStyle = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold';
                        } else if (idx === selectedQuizIndex) {
                          optionStyle = 'border-rose-500/30 bg-rose-500/10 text-rose-400';
                        } else {
                          optionStyle = 'border-zinc-900/40 bg-zinc-900/10 text-zinc-600 cursor-not-allowed';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={quizAnswered}
                          onClick={() => handleQuizOptionClick(idx)}
                          className={`w-full text-left p-2.5 rounded-lg text-xs border transition-all cursor-pointer leading-snug ${optionStyle}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {quizAnswered && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-850 text-[10px] leading-relaxed text-zinc-400 space-y-2"
                    >
                      <p className="flex items-center gap-1 font-bold text-zinc-300">
                        <Lightbulb className="h-3 w-3 text-amber-500" /> Explanation Summary:
                      </p>
                      <p>{activeQuestion.explanation}</p>
                      
                      <div className="flex gap-2 items-center pt-1">
                        {currentQuizIdx < QUIZ_QUESTIONS.length - 1 ? (
                          <button
                            onClick={() => {
                              setCurrentQuizIdx(prev => prev + 1);
                              setQuizAnswered(false);
                              setSelectedQuizIndex(null);
                            }}
                            className="rounded bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-[10px] font-bold text-white transition-all cursor-pointer"
                          >
                            Next Question &rarr;
                          </button>
                         ) : (
                          <button
                            onClick={() => {
                              setCurrentQuizIdx(0);
                              setQuizAnswered(false);
                              setSelectedQuizIndex(null);
                              setQuizScore(0);
                              setAnsweredCorrectly([]);
                            }}
                            className="rounded bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-[10px] font-bold text-zinc-300 transition-all cursor-pointer"
                          >
                            Restart Quiz
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setQuizAnswered(false);
                            setSelectedQuizIndex(null);
                          }}
                          className="text-zinc-500 hover:text-zinc-355 text-[10px] font-semibold underline pl-1 cursor-pointer"
                        >
                          Retry Term
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Capital Allocation Rule Reference */}
              <div className="rounded-xl border border-zinc-850 bg-zinc-950 p-4 space-y-3" id="allocation-cheat-card">
                <div className="flex items-center gap-2 text-indigo-400 border-b border-zinc-900 pb-1.5">
                  <Scale className="h-4 w-4" />
                  <span className="text-[10px] font-black tracking-widest uppercase font-mono">120-Rule of Asset Weights</span>
                </div>

                <div className="space-y-2.5 text-xs text-zinc-400 font-sans leading-relaxed">
                  <p>
                    How much should you invest in stocks vs bonds?
                  </p>
                  <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-850 font-mono text-center text-zinc-100">
                    <div className="font-extrabold text-xs text-indigo-400">Stocks Allocation % = 120 - Your Age</div>
                    <div className="text-[9px] text-zinc-500 mt-1">Remainder goes directly to Fixed-Income Bonds!</div>
                  </div>
                  <p className="text-[9.5px] text-zinc-500">
                    For example, at age 35, allocate 85% to stocks/crypto and 15% to high-credit sovereign Bonds to lock in steady coupon interest. Under Budget 2024 tax rules, this mitigates extreme equity index fluctuations.
                  </p>
                </div>
              </div>

              {/* Fast Jargon glossary */}
              <div className="rounded-xl border border-zinc-850 bg-zinc-950 p-4 space-y-3" id="glossary-cheat-card">
                <div className="flex items-center pb-2 border-b border-zinc-900">
                  <span className="text-[10px] font-black tracking-widest uppercase font-mono text-zinc-400">Fast Market Glossary</span>
                </div>
                
                <div className="space-y-2.5" id="glossary-terms">
                  {[
                    { term: 'Gilts / Treasuries', desc: 'Government bonds issued by United Kingdom (Gilts) and United States (Treasuries) representing bedrock default-free sovereign debt.' },
                    { term: 'Yield Curve', desc: 'A path graphing yield rates of bonds with equal ratings but differing horizons. Curve inversion historically hints macro recessions.' },
                    { term: 'Drawdown Metric', desc: 'The peak-to-trough drop of capital during trading sequences, calculated as %. Standard baseline for hedge funds.' }
                  ].map((term, i) => (
                    <div key={i} className="text-[11px] leading-relaxed">
                      <div className="font-bold text-zinc-200">{term.term}</div>
                      <div className="text-[10px] text-zinc-500">{term.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* TAB 2: INTERACTIVE CANDLESTICK PATTERNS PLAYGROUND */}
        {activeAcademySubTab === 'candlesticks' && (
          <motion.div
            key="tab-candlesticks"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            id="tab-pane-candlesticks"
          >
            {/* Patterns Selection Sidebar */}
            <div className="space-y-3 lg:col-span-1">
              <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-amber-400 border-b border-zinc-900 pb-2">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-[10px] font-black tracking-widest uppercase font-mono">Candlestick Directory</span>
                </div>
                <p className="text-[11px] text-zinc-450 leading-relaxed">
                  Select a classic pattern profile to inspect its candle anatomy and tradable implications.
                </p>

                <div className="space-y-1.5">
                  {CANDLE_PATTERNS.map((pattern) => {
                    const isSelected = selectedPattern.name === pattern.name;
                    return (
                      <button
                        key={pattern.name}
                        onClick={() => setSelectedPattern(pattern)}
                        className={`w-full text-left p-3 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600/15 border-indigo-500/30 text-white'
                            : 'bg-zinc-900/35 border-zinc-900 hover:bg-zinc-900/70 text-zinc-350'
                        }`}
                      >
                        <span className="font-sans font-bold">{pattern.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase font-black tracking-wider ${
                          pattern.type === 'bullish' 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : (pattern.type === 'bearish' ? 'bg-rose-500/10 text-rose-450' : 'bg-zinc-500/10 text-zinc-400')
                        }`}>
                          {pattern.type}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chart Jargon Reminder */}
              <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 text-xs space-y-2">
                <h4 className="font-bold text-zinc-200">How to read Candle Anatomy:</h4>
                <ul className="space-y-1.5 text-[10.5px] text-zinc-450 font-serif">
                  <li><strong className="text-zinc-300 font-mono">Wicks / Shadows:</strong> Indicate price extremes (High and Low) recorded during that timeframe.</li>
                  <li><strong className="text-zinc-300 font-mono">Body Box:</strong> Represents the core span between the session's Open price and Close price.</li>
                  <li><strong className="text-zinc-300 font-mono">Color Fill:</strong> Green means the close exceeded the open (bullish). Red means the asset depreciated (bearish).</li>
                </ul>
              </div>
            </div>

            {/* Central Annotated visual Workspace */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-5 md:p-6 space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white font-sans">{selectedPattern.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black font-mono uppercase border ${
                        selectedPattern.type === 'bullish' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : (selectedPattern.type === 'bearish' ? 'bg-rose-500/10 text-rose-450 border-rose-500/20' : 'bg-zinc-500/10 text-zinc-400 border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300')
                      }`}>
                        {selectedPattern.type} reversal
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 italic">Target Pattern Anatomy Profile & Wicks Annotator</p>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 bg-zinc-900/60 p-2 rounded-lg border border-zinc-850">
                    <span className="font-mono text-[9px] uppercase">Reliability:</span>
                    <strong className={`font-mono text-[10px] ${
                      selectedPattern.reliability === 'High' 
                        ? 'text-emerald-400' 
                        : (selectedPattern.reliability === 'Medium' ? 'text-amber-400' : 'text-zinc-400')
                    }`}>{selectedPattern.reliability}</strong>
                  </div>
                </div>

                {/* Annotation visualization render */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  
                  {/* Candle SVG Drawing Canvas */}
                  <div className="md:col-span-2 bg-[#0c0d10] rounded-xl border border-zinc-900 p-5 flex flex-col items-center justify-center min-h-[250px] relative">
                    <div className="absolute top-2 left-2 flex items-center gap-1 text-[9px] font-mono text-zinc-500">
                      <Activity className="h-3 w-3 text-indigo-400" />
                      <span>SVG Vector Render</span>
                    </div>

                    <svg className="w-full h-44 max-w-[200px]" viewBox="0 0 200 150">
                      {/* Grid background reference lines */}
                      <line x1="15" y1="20" x2="185" y2="20" stroke="#16171d" strokeDasharray="3 3" />
                      <line x1="15" y1="75" x2="185" y2="75" stroke="#16171d" strokeDasharray="3 3" />
                      <line x1="15" y1="130" x2="185" y2="130" stroke="#16171d" strokeDasharray="3 3" />

                      {selectedPattern.candles.map((candle, idx) => {
                        // Position x calculations based on candle count
                        const x = selectedPattern.candles.length === 1 ? 100 : (idx === 0 ? 65 : 135);
                        
                        // Theme variables
                        const isGreen = candle.color === 'green';
                        const isRed = candle.color === 'red';
                        
                        const strokeColor = isGreen ? '#10b981' : (isRed ? '#f43f5e' : '#71717a');
                        const fillColor = isGreen ? 'rgba(16, 185, 129, 0.25)' : (isRed ? 'rgba(244, 63, 94, 0.25)' : 'rgba(113, 113, 122, 0.25)');
                        
                        // Map percentages to canvas coordinates
                        // high/low/open/close spans are indexed 0-100% of 120 pixels (shifted)
                        const mappingFactor = 1.1; 
                        const offsetHeight = 135;
                        const highY = offsetHeight - (candle.high * mappingFactor);
                        const lowY = offsetHeight - (candle.low * mappingFactor);
                        const openY = offsetHeight - (candle.open * mappingFactor);
                        const closeY = offsetHeight - (candle.close * mappingFactor);

                        const bodyY = Math.min(openY, closeY);
                        const bodyHeight = Math.max(3, Math.abs(openY - closeY));

                        return (
                          <g key={idx}>
                            {/* Shadow/Wick Line */}
                            <line 
                              x1={x} 
                              y1={highY} 
                              x2={x} 
                              y2={lowY} 
                              stroke={strokeColor} 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                            />
                            
                            {/* Real Candle Body */}
                            <rect
                              x={x - 14}
                              y={bodyY}
                              width="28"
                              height={bodyHeight}
                              fill={fillColor}
                              stroke={strokeColor}
                              strokeWidth="2"
                              rx="2.5"
                            />

                            {/* Candle session labeling */}
                            {candle.label && (
                              <text x={x} y="148" fill="#52525b" textAnchor="middle" className="text-[8px] font-mono font-bold uppercase">{candle.label}</text>
                            )}

                            {/* Wicks extremities annotations (H/L) */}
                            <circle cx={x} cy={highY} r="2" fill={strokeColor} />
                            <text x={x + 18} y={highY + 3} fill="#a1a1aa" className="text-[8px] font-mono tracking-tighter">H: {candle.high}%</text>

                            <circle cx={x} cy={lowY} r="2" fill={strokeColor} />
                            <text x={x + 18} y={lowY + 3} fill="#52525b" className="text-[8px] font-mono tracking-tighter">L: {candle.low}%</text>

                            {/* Body extremities annotations (O/C) */}
                            <text x={x - 18} y={openY + 3} fill="#a1a1aa" textAnchor="end" className="text-[7.5px] font-mono">O: {candle.open}%</text>
                            <text x={x - 18} y={closeY + 3} fill="#71717a" textAnchor="end" className="text-[7.5px] font-mono">C: {candle.close}%</text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Written Tactical Breakdowns */}
                  <div className="md:col-span-3 space-y-4">
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-zinc-500">Pattern Description</span>
                      <p className="text-xs text-zinc-300 leading-relaxed font-sans">{selectedPattern.description}</p>
                    </div>

                    <div className="bg-indigo-600/[0.04] rounded-xl border border-indigo-500/10 p-4 space-y-2.5">
                      <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-indigo-400 flex items-center gap-1">
                        <Lightbulb className="h-3 w-3 text-indigo-400" /> Tactical Trading Tip
                      </span>
                      <p className="text-xs text-zinc-300 leading-relaxed font-sans">{selectedPattern.tacticalTip}</p>
                    </div>

                    <div className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-900 text-[11px] text-zinc-400 space-y-1.5">
                      <div className="font-bold text-zinc-200">Suggested Action Sequence:</div>
                      <ol className="list-decimal list-inside pl-1 space-y-1 text-zinc-450 font-serif">
                        <li>Locate pattern near extreme levels (highs/lows).</li>
                        <li>Verify that session volume is elevated (indicates institutional footprints).</li>
                        <li>Maintain strict risk limits! Apply our Position Size calculator prior to execution.</li>
                      </ol>
                    </div>
                  </div>

                </div>

                {/* Fast Simulator Controls */}
                <div className="border-t border-zinc-900 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900/10 rounded-xl p-3">
                  <div className="text-xs text-zinc-400">
                    💡 Want to see live setups? Head over to the <strong className="text-white hover:underline cursor-pointer" onClick={() => setView?.('screener')}>Screener tab</strong> to scan custom volume patterns!
                  </div>

                  <button
                    onClick={() => {
                      if (onSelectAsset && assets && assets.length > 0) {
                        // select first index asset as playground ticker
                        onSelectAsset(assets[0]);
                      }
                      if (setView) {
                        setView('dashboard');
                      }
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Analyze on Real-Time Chart</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>

              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: QUANT RISK & WEALTH ACCUMULATION CALCULATORS */}
        {activeAcademySubTab === 'calculators' && (
          <motion.div
            key="tab-calculators"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-6"
            id="tab-pane-calculators"
          >
            {/* Currency settings bar */}
            <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-zinc-400 font-sans">
                ⚙️ Adjust parameters in real-time. Calculations format output signs dynamically for comparative analysis.
              </span>

              <div className="flex bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 rounded-lg p-1 shrink-0">
                {[
                  { id: '1', label: 'INR (₹)', value: 'INR' },
                  { id: '2', label: 'USD ($)', value: 'USD' },
                  { id: '3', label: 'GBP (£)', value: 'GBP' }
                ].map(cur => (
                  <button
                    key={cur.id}
                    onClick={() => setCalcCurrency(cur.value as any)}
                    className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                      calcCurrency === cur.value
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {cur.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Calculator 1: Professional Position Sizer */}
              <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-1.5 text-indigo-400 border-b border-zinc-900 pb-2.5">
                  <Calculator className="h-4 w-4" />
                  <h3 className="text-sm font-black tracking-widest uppercase font-mono">1. Institutional Position Size & Risk Model</h3>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Input your account balance and stop losses to calculate the optimal, capital-safe quantity of share contracts without exceeding risk limits.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase font-mono">Account Balance ({currencySign})</label>
                    <input
                      type="number"
                      value={accountBalance}
                      onChange={(e) => setAccountBalance(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-850 px-3 py-2 rounded-lg text-xs leading-none text-white focus:border-indigo-500/50 outline-none font-mono"
                      placeholder="Balance"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase font-mono">Risk Tolerance Percentage (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={riskPercentage}
                      onChange={(e) => setRiskPercentage(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-850 px-3 py-2 rounded-lg text-xs leading-none text-white focus:border-indigo-500/50 outline-none font-mono"
                      placeholder="e.g. 1%"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase font-mono">Asset Entry Price ({currencySign})</label>
                    <input
                      type="number"
                      value={entryPrice}
                      onChange={(e) => setEntryPrice(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-855 px-3 py-2 rounded-lg text-xs leading-none text-white focus:border-indigo-500/50 outline-none font-mono"
                      placeholder="e.g. 3400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase font-mono">Stop Loss Exit Price ({currencySign})</label>
                    <input
                      type="number"
                      value={stopLossPrice}
                      onChange={(e) => setStopLossPrice(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-850 px-3 py-2 rounded-lg text-xs leading-none text-white focus:border-indigo-500/50 outline-none font-mono"
                      placeholder="e.g. 3250"
                    />
                  </div>
                </div>

                {/* Live Position Sizing Output Metrics Box */}
                <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-3.5 mt-2 shadow-inner">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wide border-b border-zinc-900 pb-1.5">Risk Calculations Outputs:</div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    
                    <div className="space-y-0.5">
                      <div className="text-[9px] text-zinc-500 uppercase font-mono">Capital Under Risk</div>
                      <div className="text-sm font-bold text-rose-400 font-mono">
                        {formatSipCurrency(positionSizeResults.amountAtRisk)}
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-[9px] text-zinc-500 uppercase font-mono">Ideal Safety Quantity</div>
                      <div className="text-sm font-bold text-white font-mono">
                        {positionSizeResults.positionSize > 0 && isFinite(positionSizeResults.positionSize)
                          ? Intl.NumberFormat().format(Math.round(positionSizeResults.positionSize)) + ' units'
                          : '0 units'
                        }
                      </div>
                    </div>

                    <div className="space-y-0.5 col-span-2 md:col-span-1">
                      <div className="text-[9px] text-zinc-500 uppercase font-mono">Position Total Cost</div>
                      <div className="text-sm font-bold text-indigo-400 font-mono">
                        {positionSizeResults.totalPositionCost > 0 && isFinite(positionSizeResults.totalPositionCost)
                          ? formatSipCurrency(positionSizeResults.totalPositionCost)
                          : 'N/A'
                        }
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-[9px] text-zinc-500 uppercase font-mono">Asset Volatility Loss</div>
                      <div className="text-xs font-bold text-zinc-300 font-mono">
                        {positionSizeResults.percentLossAsset.toFixed(2)} %
                      </div>
                    </div>

                    <div className="space-y-0.5 col-span-2">
                      <div className="text-[9px] text-zinc-500 uppercase font-mono">Leverage Requirement Factor</div>
                      <div className="text-xs font-bold text-amber-500 font-mono">
                        {positionSizeResults.leverageMultiplier.toFixed(2)} x
                      </div>
                    </div>

                  </div>
                </div>

                <div className="space-y-2 text-[10.5px] text-zinc-450 leading-normal font-sans pt-1">
                  <div className="flex gap-1.5 items-start">
                    <span className="text-amber-500 font-bold">⚠️ Warning:</span>
                    <p>
                      If your calculated position size requires leverage exceeding <strong>1.5x</strong>, it means you must hold substantial margin capital or reduce your risk tolerance to prevent instant liquidations in rapid price shifts.
                    </p>
                  </div>
                </div>

              </div>

              {/* Calculator 2: Systematic Indian/Global Compound Accumulator (SIP) */}
              <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-1.5 text-indigo-400 border-b border-zinc-900 pb-2.5">
                  <TrendingUp className="h-4 w-4" />
                  <h3 className="text-sm font-black tracking-widest uppercase font-mono block">2. Wealth Compounder & SIP Growth Grid</h3>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Simulate Systematic Investment Plans (SIP) popular inside Indian Nifty funds. Observe how early regular compounding expands over standard horizons.
                </p>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase font-mono">Monthly Deposit ({currencySign})</label>
                    <input
                      type="number"
                      value={sipMonthly}
                      onChange={(e) => setSipMonthly(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-850 px-3 py-2 rounded-lg text-xs leading-none text-white focus:border-indigo-500/50 outline-none font-mono"
                      placeholder="e.g. 5000"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase font-mono">Expected Annual interest (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={sipRate}
                      onChange={(e) => setSipRate(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-855 px-3 py-2 rounded-lg text-xs leading-none text-white focus:border-indigo-500/50 outline-none font-mono"
                      placeholder="e.g. 12"
                    />
                  </div>
                </div>

                {/* Milestone comparative table or visual list */}
                <div className="space-y-3.5 pt-2">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wide border-b border-zinc-900 pb-1.5">Compounding Trajectory Milestone Projections:</div>

                  <div className="space-y-3" id="sip-trajectory-milestones">
                    {sipMilestones.slice(1).map((m) => {
                      const totalWidthPercent = Math.min(100, Math.max(12, (m.futureValue / sipMilestones[sipMilestones.length - 1].futureValue) * 100));
                      const investedWidthPercent = (m.invested / m.futureValue) * 100;
                      
                      return (
                        <div key={m.years} className="space-y-1 bg-zinc-900/30 p-2.5 rounded-lg border border-zinc-900">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono text-zinc-300 font-bold">{m.years} Year Horizon</span>
                            <span className="text-zinc-500 font-sans">
                              Invested: <strong className="text-zinc-300 font-mono">{formatSipCurrency(m.invested)}</strong>
                            </span>
                            <span className="text-white font-mono font-bold">
                              Total: {formatSipCurrency(m.futureValue)}
                            </span>
                          </div>

                          {/* Graphical compound indicators */}
                          <div className="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden flex" style={{ width: '100%' }}>
                            {/* Invested Segment (Indigo) */}
                            <div 
                              className="bg-indigo-600 h-full transition-all duration-300 rounded-l-full" 
                              style={{ width: `${investedWidthPercent}%` }} 
                              title={`Invested portion: ${investedWidthPercent.toFixed(1)}%`}
                            />
                            {/* Wealth Gained Segment (Emerald) */}
                            <div 
                              className="bg-emerald-500 h-full transition-all duration-300 rounded-r-full" 
                              style={{ width: `${100 - investedWidthPercent}%` }} 
                              title={`Gain interest: ${(100 - investedWidthPercent).toFixed(1)}%`}
                            />
                          </div>

                          <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 pt-0.5">
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 inline-block" /> Principal
                            </span>
                            <span className="text-emerald-400 font-bold">
                              Wealth Generated: +{formatSipCurrency(m.wealthGained)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 4: INTERACTIVE QUANT FLASHCARDS SECTION */}
        {activeAcademySubTab === 'flashcards' && (
          <motion.div
            key="tab-flashcards"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-4"
            id="tab-pane-flashcards"
          >
            <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-indigo-400">
                <GraduationCap className="h-4 w-4" />
                <span className="text-[10px] font-black tracking-widest uppercase font-mono">Quant Flip Deck</span>
              </div>
              <p className="text-xs text-zinc-405 leading-relaxed">
                Click any asset concept card below to toggle back-of-card explanations and real-world institutional trading applications.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="flashcards-grid">
              {FLASHCARDS.map((card) => {
                const isFlipped = flippedCardIds.includes(card.id);
                return (
                  <div
                    key={card.id}
                    onClick={() => toggleFlashcardFlip(card.id)}
                    className={`rounded-2xl border p-5 cursor-pointer transition-all duration-300 shadow min-h-[195px] flex flex-col justify-between select-none ${
                      isFlipped
                        ? 'bg-gradient-to-br from-zinc-950 to-indigo-950/20 border-indigo-600/40 shadow-indigo-950/20'
                        : 'bg-zinc-950 border-zinc-850 hover:bg-zinc-900/60 hover:border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300'
                    }`}
                  >
                    <div className="space-y-3.5">
                      {/* Top Context Indicators */}
                      <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                        <span className="font-mono text-[9px] uppercase font-bold text-zinc-500">
                          {card.context}
                        </span>
                        <span className={`text-[8px] font-extrabold uppercase font-mono px-1.5 py-0.2 rounded ${
                          isFlipped ? 'bg-indigo-500/10 text-indigo-400' : 'bg-zinc-900 text-zinc-500'
                        }`}>
                          {isFlipped ? 'REVEALED 👁️' : 'CLICK TO FLIP'}
                        </span>
                      </div>

                      {/* Content panel transition */}
                      <AnimatePresence mode="wait">
                        {!isFlipped ? (
                          <motion.div
                            key="front"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-2"
                          >
                            <h3 className="text-base font-black text-white tracking-tight">{card.term}</h3>
                            <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                              What is this institutional keyword? Click the card to explore the exact definition and mathematical application.
                            </p>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="back"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-3"
                          >
                            <div className="space-y-1">
                              <span className="text-[8px] uppercase tracking-wider font-mono font-bold text-indigo-400">Official definition</span>
                              <p className="text-xs text-zinc-200 leading-normal font-sans">{card.definition}</p>
                            </div>
                            <div className="p-2.5 bg-zinc-900/50 rounded border border-zinc-850 space-y-1 text-[10px]">
                              <span className="text-[8px] uppercase tracking-wider font-mono font-bold text-emerald-400 block">Trading Example Context:</span>
                              <p className="text-zinc-400 italic leading-relaxed font-sans">{card.example}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Bottom deck context */}
                    <div className="text-[9px] text-zinc-500 font-mono text-right pt-2 border-t border-zinc-900/50 mt-4">
                      {isFlipped ? '← Click anywhere to hide definition' : 'Click to read core mechanism →'}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* TAB 5: OPTIONS STRATEGIES SIMULATOR */}
        {activeAcademySubTab === 'options' && (
          <motion.div
            key="tab-options"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in"
            id="tab-pane-options"
          >
            {/* Left Column: Sidebar Controls */}
            <div className="space-y-4 lg:col-span-1 text-left">
              <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-1.5 text-indigo-400 border-b border-zinc-900 pb-2.5">
                  <Cpu className="h-4 w-4" />
                  <span className="text-[10px] font-black tracking-widest uppercase font-mono">Strategy Workspace</span>
                </div>
                
                {/* Select strategy buttons */}
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono block">Select Option Structure</span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {[
                      { id: 'covered_call', label: 'Covered Call', desc: 'Own Stock + Sell Call' },
                      { id: 'bull_call_spread', label: 'Bull Call Spread', desc: 'Buy Low Call + Sell High Call' },
                      { id: 'iron_condor', label: 'Iron Condor', desc: 'Neutral Winged Credit Spread' },
                      { id: 'straddle', label: 'Long Straddle', desc: 'Buy Call + Buy Put (Volatility)' }
                    ].map((strat) => (
                      <button
                        key={strat.id}
                        type="button"
                        onClick={() => {
                          setOptStrategy(strat.id as any);
                          // Assign standard parameters for premium to match strategy realistic spreads
                          if (strat.id === 'covered_call') setOptPremium(4);
                          else if (strat.id === 'bull_call_spread') setOptPremium(5);
                          else if (strat.id === 'iron_condor') setOptPremium(3.5);
                          else if (strat.id === 'straddle') setOptPremium(10);
                        }}
                        className={`w-full text-left p-3 rounded-lg border text-xs leading-tight transition-all cursor-pointer ${
                          optStrategy === strat.id
                            ? 'bg-indigo-600/15 border-indigo-500/35 text-white'
                            : 'bg-zinc-900/35 border-zinc-900 hover:bg-zinc-900/70 text-zinc-400'
                        }`}
                      >
                        <div className="font-bold text-zinc-200">{strat.label}</div>
                        <div className="text-[9px] text-zinc-500 mt-0.5">{strat.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slider values */}
                <div className="space-y-4 pt-2.5 border-t border-zinc-900">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-zinc-400 (K) uppercase font-mono">Strike Price Reference (K)</span>
                      <strong className="text-white font-mono">{optStrike} USD</strong>
                    </div>
                    <input
                      type="range"
                      min="70"
                      max="130"
                      step="5"
                      value={optStrike}
                      onChange={(e) => setOptStrike(parseInt(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer text-zinc-650 bg-zinc-900 h-1.5 rounded-lg appearance-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-zinc-400 uppercase font-mono">Net premium factor</span>
                      <strong className="text-white font-mono">{optPremium} USD</strong>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="15"
                      step="0.5"
                      value={optPremium}
                      onChange={(e) => setOptPremium(parseFloat(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer text-zinc-650 bg-zinc-900 h-1.5 rounded-lg appearance-none"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Strategy Explanation Cards */}
              <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-yellow-500">
                  <Lightbulb className="h-4 w-4" />
                  <span className="text-[10px] font-black tracking-widest uppercase font-mono">Structure Anatomy</span>
                </div>
                
                {optStrategy === 'covered_call' && (
                  <div className="space-y-2 text-xs leading-relaxed text-zinc-450">
                    <h5 className="font-extrabold text-zinc-200">Income Strategy</h5>
                    <p>
                      You buy stock at ${optStrike - 5} and sell a ${optStrike} strike Call. You receive a premium credit (${optPremium}).
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-1 text-[10.5px] text-zinc-500">
                      <li><strong className="text-zinc-300 font-mono">Max profit:</strong> Limited to <span className="text-emerald-450 font-bold">${5 + optPremium}</span> (retained call credit + $5 initial gap).</li>
                      <li><strong className="text-zinc-300 font-mono">Max loss:</strong> Substantial stock downfall minus ${optPremium} premium.</li>
                      <li><strong className="text-zinc-300 font-mono">Breakeven:</strong> Stock cost minus premium = <span className="font-mono text-zinc-300">${optStrike - 5 - optPremium}</span>.</li>
                    </ul>
                  </div>
                )}

                {optStrategy === 'bull_call_spread' && (
                  <div className="space-y-2 text-xs leading-relaxed text-zinc-450">
                    <h5 className="font-extrabold text-zinc-200">Directional Bull Spread</h5>
                    <p>
                      Simultaneous purchase of in-the-money Call (Strike ${optStrike - 10}) and sale of out-of-the-money Call (Strike ${optStrike + 10}).
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-1 text-[10.5px] text-zinc-500">
                      <li><strong className="text-zinc-300 font-mono">Max profit:</strong> Capped at strike width minus net premium = <span className="text-emerald-450 font-bold">${20 - optPremium}</span>.</li>
                      <li><strong className="text-zinc-300 font-mono">Max loss:</strong> Capped strictly at premium debit paid = <span className="text-rose-450 font-bold">${optPremium}</span>.</li>
                      <li><strong className="text-zinc-300 font-mono">Breakeven:</strong> Lower strike price + premium = <span className="font-mono text-zinc-300">${optStrike - 10 + optPremium}</span>.</li>
                    </ul>
                  </div>
                )}

                {optStrategy === 'iron_condor' && (
                  <div className="space-y-2 text-xs leading-relaxed text-zinc-450">
                    <h5 className="font-extrabold text-zinc-200">Non-Directional Income</h5>
                    <p>
                      Selling an OTM Put spread and OTM Call spread concurrent. Perfect for range-bound low-implied-volatility (IV) systems.
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-1 text-[10.5px] text-zinc-500">
                      <li><strong className="text-zinc-300 font-mono">Max profit:</strong> Net premium credit received = <span className="text-emerald-450 font-bold">${optPremium}</span>.</li>
                      <li><strong className="text-zinc-300 font-mono">Max loss:</strong> Capped at strike spread minus credit = <span className="text-rose-450 font-bold">${10 - optPremium}</span>.</li>
                      <li><strong className="text-zinc-300 font-mono">Zone:</strong> Maximum payout resides entirely inside inner bounds (${optStrike - 5} to ${optStrike + 5}).</li>
                    </ul>
                  </div>
                )}

                {optStrategy === 'straddle' && (
                  <div className="space-y-2 text-xs leading-relaxed text-zinc-450">
                    <h5 className="font-extrabold text-zinc-200">Volatility Expansion</h5>
                    <p>
                      Buy ATM Call and Put matching the same strike. Profitable only if asset experiences giant swings in either direction (earnings breakout).
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-1 text-[10.5px] text-zinc-500">
                      <li><strong className="text-zinc-300 font-mono">Max profit:</strong> Theoretically unlimited upwards, immense downwards.</li>
                      <li><strong className="text-zinc-300 font-mono">Max loss:</strong> Total debit premium paid = <span className="text-rose-450 font-bold">${optPremium}</span> when price tags exactly the strike.</li>
                      <li><strong className="text-zinc-300 font-mono">Breakevens:</strong> Strike +/- premium = <span className="font-mono text-zinc-300">${optStrike - optPremium}</span> and <span className="font-mono text-zinc-300">${optStrike + optPremium}</span>.</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Center Chart & Tabular Coordinates */}
            <div className="lg:col-span-2 space-y-4 text-left">
              <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-5 md:p-6 space-y-5 flex flex-col justify-between h-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white font-sans uppercase">Payoff Risk-Reward Curves</h4>
                    <p className="text-[11px] text-zinc-400">Interactive derivatives modeling at option contract expiration</p>
                  </div>

                  <span className="bg-dashed border border-zinc-900 p-2 rounded-lg text-[9px] font-mono text-zinc-500 uppercase tracking-widest text-right shrink-0">
                    Strategy: <strong className="text-indigo-400 font-mono">{optStrategy.replace('_', ' ').toUpperCase()}</strong>
                  </span>
                </div>

                {/* Payoff visualization line Chart */}
                <div className="h-72 w-full mt-2 relative">
                  {/* Overlay Center Zero Line Marker label */}
                  <div className="absolute top-2 right-2 text-[8px] font-mono text-zinc-500 bg-[#09090b] border border-zinc-900 p-1 rounded z-10">
                    Y=0 represents Breakeven Bounds
                  </div>

                  <ChartContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                    <LineChart data={optionPayoffData} margin={{ top: 20, right: 10, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#121214" vertical={false} />
                      <XAxis
                        dataKey="stockPrice"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#71717a', fontSize: 9, fontFamily: 'monospace' }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#a1a1aa', fontSize: 9, fontFamily: 'monospace' }}
                      />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                        labelStyle={{ color: '#a1a1aa', fontWeight: 'bold', fontSize: '9px', fontFamily: 'monospace' }}
                        itemStyle={{ fontSize: '11px' }}
                        formatter={(val: number) => [
                          <span className={val >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-450 font-bold'}>
                            ${val} USD
                          </span>,
                          'Expected P&L'
                        ]}
                      />
                      <ReferenceLine y={0} stroke="#444" strokeWidth={1} strokeDasharray="3 3" />
                      
                      {/* Profit curve plotted */}
                      <Line
                        type="monotone"
                        dataKey="pnl"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 6, fill: '#818cf8', strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ChartContainer>
                </div>

                <div className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-900 text-[11px] text-zinc-450 leading-relaxed font-sans pt-2">
                  <div className="font-bold text-zinc-200">The Quant Hedging Advantage:</div>
                  <p>
                    In professional market desks, option spreads represent strategic risk offsets. For example, owning 100 shares of equity while concurrently selling a covered call lets you mitigate downside risk by banking the premium value offset! This makes option trading highly systematic when managed with discipline.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
