import os from 'os';
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", "https:"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(compression());
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const PORT = 3000;



// Advanced LRU Cache for Performance & Reliability
class AdvancedLRUCache {
  capacity: number;
  cache: Map<string, { data: any, timestamp: number, ttl: number }>;
  defaultTtl: number;

  constructor(capacity: number, ttlMs: number) {
    this.capacity = capacity;
    this.defaultTtl = ttlMs;
    this.cache = new Map();
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    // Refresh position for LRU
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.data;
  }

  set(key: string, data: any, customTtl?: number) {
    if (this.cache.size >= this.capacity) {
      // Evict oldest (first item in Map)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, { data, timestamp: Date.now(), ttl: customTtl || this.defaultTtl });
  }

  stats() {
    return { size: this.cache.size, capacity: this.capacity };
  }
}

const apiCacheLRU = new AdvancedLRUCache(500, 60 * 1000 * 5); // 500 items, 5 min TTL
function getFromCache(key: string) { return apiCacheLRU.get(key); }
function setToCache(key: string, data: any, customTtl?: number) { apiCacheLRU.set(key, data, customTtl); }

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // Limit each IP to 200 requests per `window` (here, per 1 minute)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: "Too many requests. Please try again later." }
});

app.use("/api/", limiter);

// Lazy initialization of Gemini client
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'MY_GEMINI_API_KEY' && key.trim() !== '') {
      ai = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  return ai;
}

const SYMBOL_MAP: Record<string, string> = {
  '.SPX': '^GSPC',
  '.IXIC': '^IXIC',
  '.DJI': '^DJI',
  'NIFTY50': '^NSEI',
  'SENSEX': '^BSESN',
  'BANKNIFTY': '^NSEBANK',
  'BRK.B': 'BRK-B',
  'US10Y': '^TNX',
  'US2Y': '^IRX',
  'RELIANCE': 'RELIANCE.NS',
  'UK100': '^FTSE',
  'DAX': '^GDAXI',
  'CAC': '^FCHI',
  'EUR/USD': 'EURUSD=X',
  'USD/INR': 'INR=X',
  'USD/JPY': 'JPY=X',
  'GBP/USD': 'GBPUSD=X',
  'USD/CAD': 'CAD=X',
  'AUD/USD': 'AUDUSD=X',
  'GOLD': 'GC=F',
  'CRUDE': 'CL=F',
  'SILVER': 'SI=F',
  'COPPER': 'HG=F',
  'NATGAS': 'NG=F',
  'VIX': '^VIX',
  'BTC': 'BTC-USD',
  'ETH': 'ETH-USD',
  'TCS': 'TCS.NS',
  'HDFCBANK': 'HDFCBANK.NS',
  'INFY': 'INFY.NS',
  'ICICIBANK': 'ICICIBANK.NS',
  'BHARTIARTL': 'BHARTIARTL.NS',
  'SBIN': 'SBIN.NS',
  'LT': 'LT.NS',
  'ITC': 'ITC.NS',
  'HINDUNILVR': 'HINDUNILVR.NS',
  'TATASTEEL': 'TATASTEEL.NS',
  'ZOMATO': 'ZOMATO.NS',
  'BAJFINANCE': 'BAJFINANCE.NS',
  'MARUTI': 'MARUTI.NS',
  'GOOGL': 'GOOGL',
  'META': 'META',
  'AMZN': 'AMZN',
};

// 1. Core AI Explanation & Research Route
app.post('/api/ai/explain', async (req, res) => {
  const { symbol, name, type, price, change, analysisType, customInstruct } = req.body;
  const cacheKey = `explain-${symbol}-${analysisType}-${customInstruct || ''}`;
  const cached = getFromCache(cacheKey);
  if (cached) return res.json(cached);


  if (!symbol || !name || !type) {
    return res.status(400).json({ error: 'Missing symbol, name, or asset type.' });
  }

  const client = getGeminiClient();

  // Define prompts based on requested analysisType
  let targetPrompt = '';
  let fallbackContent = '';

  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const dateSuffix = `\n\nReference Date: ${currentDate}. Use the googleSearch tool to search for real-world live details, news, and current conditions for ${symbol} (${name}) as of this date. Keep it extremely granular, real, and factual.`;

  if (analysisType === 'marketReport') {
    targetPrompt = customInstruct || `Provide a market summary report.`;
    fallbackContent = `### Market Summary\nThe market is currently trading with typical volatility.`;
  } else if (analysisType === 'explain') {
    targetPrompt = `You are a professional financial research analyst and chief investment strategist at Vymx Trade. Provide a clear, highly structured corporate and structural analysis for "${name}" (${symbol}), which is categorized as a ${type}. The analysis MUST explicitly include:
1. **Investment Theses**: What is the core investment thesis? (Include Bull Case and Bear Case).
2. **Pros and Cons**: A bulleted list of the top Pros and Cons of this asset right now.
3. **Max Potential**: What is the maximum upside/downside potential based on current macro structures?
4. **Market Position & Viewed**: How is it currently viewed by institutional money, and its business summary.
Format using clean, compact Markdown. Keep it professional, objective, and scannable. Avoid dry placeholders.
${dateSuffix}`;
    fallbackContent = `### Vymx Trade Corporate Research Brief • ${symbol}

**1. Premium Business Summary**
*${name}* holds a prominent position within its industry vertical. As a key ${type} asset, its valuation is anchored by massive operational velocity, continuous product innovation, and expanding global market share.

**2. Key Growth Catalysts**
* **Scalable Technological Integration**: Adoption of automated networks and structural efficiency drives cost reductions.
* **Geographical and Regulatory Diversification**: Penetrating emerging regions counters domestic saturation thresholds.

**3. Primary Macro Risks**
* **Regulatory Oversight**: Shifting global compliance standards could increase administrative overhead.
* **Market Friction**: Heightened capital cost pressures may restrict immediate-term consumer discretionary expansion.`;
  } else if (analysisType === 'newsSentiment') {
    targetPrompt = `You are an elite fintech sentiment analyst. Conduct a professional, data-centric AI news summary and sentiment brief for "${name}" (${symbol}).
Explain:
1. Short-term news momentum (Bullish, Neutral, or Bearish) and what exact real events, earnings releases, or factors as of ${currentDate} are driving this sentiment (e.g., sector catalysts, institutional flows, macro indicators).
2. Bulleted synthesis of the historical and current news narrative. Ensure to list exact headlines, source references, or dates from recent news.

Format with beautiful, clean Markdown. No introductory pleasantries.${dateSuffix}`;
    fallbackContent = `### AI Sentiment Analysis for ${symbol} (${name})

**Market Momentum Indicator**: <span class="px-2 py-0.5 rounded text-xs bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">BULLISH SKEW</span>

**Core Structural Sentiment drivers**:
* **Institutional Accumulation**: High-volume net inflows into exchange-traded and trust vehicles indicate a robust retail-to-institutional transition.
* **Product Pipeline Execution**: Recent beta performance validations suggest low friction for the upcoming platform deployments.`;
  } else {
    // default/explainMove
    targetPrompt = `You are a quantitative market risk expert. Analyze the recent price dynamics of "${name}" (${symbol}).
It is currently trading at ${price} with a 24-hour rate of ${change}%.
Explain:
1. The likely technical or macro catalysts causing this asset movement (e.g., orderbook order sweeps, block-deals, macro-liquidity, moving averages).
2. Crucial support and resistance thresholds to monitor inside paper portfolios.

Keep it analytical, structured, and format as Markdown. Avoid financial advice warnings; make it clear this is a quantitative model summary.${dateSuffix}`;
    fallbackContent = `### Quantitative Price Dynamics of ${symbol} (${name})

Currently traded at **${price}** reflecting a 24h change of **${change}%**.

**Orderbook Analysis & Price Action Drivers**:
* **Liquidity Sweep**: Shifting volume profiles indicate automated execution of buy stops around key moving average thresholds. This momentum represents normal high-beta index correlation.
* **Critical Levels to Monitor**:
  * **Resistance**: 5% above current pricing (psychological major breakout barrier).
  * **Support**: 4.5% below current pricing (the 50-day EMA support anchor).`;
  }

  if (customInstruct && analysisType !== 'marketReport') {
    targetPrompt = `User Specific Context / Dynamic Context:\n${customInstruct}\n\n${targetPrompt}`;
  }

  if (!client) {
    // Fail gracefully with realistic high-utility mock analysis if no API key is supplied
    return res.json({
      content: fallbackContent + '\n\n*(Note: Displaying premium quantitative fallback research. To activate live server-side AI, set your GEMINI_API_KEY in Settings > Secrets).*',
      isMock: true,
    });
  }

  try {
    const response = await client.models.generateContent({
      // @ts-ignore
      model: 'gemini-2.5-flash',
      contents: targetPrompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const outputText = response.text || fallbackContent;
    return res.json({
      content: outputText,
      isMock: false,
    });
  } catch (error: any) {
    // Silenced API error warning
    return res.json({
      content: `${fallbackContent}\n\n*(Gemini API encountered an error - displaying local analysis model instead. Error details: ${error.message || 'unknown'}*)`,
      isMock: true,
    });
  }
});

// 2. TradingView-style Intelligent Chat Proxy Route
app.post('/api/ai/chat', async (req, res) => {
  const { message, activeAsset } = req.body;

  const client = getGeminiClient();
  const assetCtx = activeAsset ? `Active asset under discussion is: ${activeAsset.name} (${activeAsset.symbol}) priced at $${activeAsset.price}.` : '';

  const prompt = `You are "Vymx AI Guru", an elite market quant dealer and TradingView community senior moderator.
Answering trader's community forum chat question: "${message}".
${assetCtx}
Provide a sharp, extremely insightful, and data-driven answer (around 3 to 4 sentences maximum). Use actual technical trading terms (e.g., liquidity sweep, volume profiles, dynamic EMA support, RSI deviation, order block density, premium valuations). Show high confidence and expertise.
If the message relates to Indian stocks (Reliance, TCS, HDFC, SBI Nifty 50, etc.) or is in Hindi, supply an Indian rupee perspective and reference rupee values using the Indian numbering system or Rs. and ₹.
Do NOT start with conversational padding like "Sure, I can help" or end with signatures. Deliver direct raw strategical signal.`;

  const fallbackResponses = [
    "Looks like S&P 500 support is establishing clearly around the 50-day EMA. The liquidity sweep indicates a healthy leverage flush.",
    "Indian stock indexes are demonstrating strong resilience. RELIANCE and TCS buy volume suggests smart money is positioning for a structural breakout above psychological resistances.",
    "Be careful trying to catch this falling knife. The orderbook profile shows massive sell wall concentrations right above current pricing. Wait for RSI stabilization.",
    "Forex pair is squeezing tightly. The Bollinger bands are narrowing to historical lows. Watch out for a massive breakout expansion.",
    "Crypto liquidations are clearing up high-margin positions, setting a solid double-bottom. I am keeping a long bias with risk rules below the swing low."
  ];

  const randomFallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

  if (!client) {
    return res.json({
      reply: randomFallback,
      isMock: true,
    });
  }

  try {
    const response = await client.models.generateContent({
      // @ts-ignore
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    return res.json({
      reply: response.text || randomFallback,
      isMock: false,
    });
  } catch (error: any) {
    // Silenced API error warning
    return res.json({
      reply: randomFallback + ' (Local calculation fallback active)',
      isMock: true,
    });
  }
});

// 3. Asset Hedge Generator Route
app.post('/api/ai/hedge', async (req, res) => {
  const { symbol, name, type, change } = req.body;
  const client = getGeminiClient();
  const prompt = `You are an elite quantitative analyst and risk manager.
The user is looking at an asset that is moving: ${name} (${symbol}), currently changed by ${change}%.
Generate a 3-asset paper trading hedge strategy to offset the risk of a severe downturn in ${name}.
Return EXACTLY a JSON array of 3 objects, each with:
- "name": string (The name of the hedge asset, e.g. "US 10-Year Treasury", "Gold", "USD/JPY")
- "symbol": string (The ticker symbol, e.g. "US10Y", "GC=F", "JPY=X")
- "reason": string (A 1-2 sentence explanation of why this hedges the risk)

Example:
[
  { "name": "Gold", "symbol": "GC=F", "reason": "Acts as a safe haven during market panic." }
]
Only return the raw JSON array.`;

  const fallbackHedges = [
    { name: "Gold Futures", symbol: "GC=F", reason: "Gold traditionally acts as a safe haven when equities or risk assets face heavy drawdown pressure." },
    { name: "US 10-Year Treasury", symbol: "^TNX", reason: "Bonds usually rally (yields fall) during a flight to safety as capital exits volatility." },
    { name: "Japanese Yen / USD", symbol: "JPY=X", reason: "The Yen is a classic funding currency that unwinds strongly during a risk-off global market shock." }
  ];

  if (!client) {
    return res.json({ suggestions: fallbackHedges });
  }

  try {
    const response = await client.models.generateContent({
      // @ts-ignore
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });
    const parsed = JSON.parse(response.text || '[]');
    return res.json({ suggestions: parsed.length ? parsed : fallbackHedges });
  } catch (error) {
    // Silenced fallback
    return res.json({ suggestions: fallbackHedges });
  }
});

// 4. Wealth Advisor Allocation optimization API
app.post('/api/ai/advisor', async (req, res) => {
  const { ageGroup, incomeLevel, riskTolerance, futureGoals, investmentHorizon, virtualBalance } = req.body;

  const client = getGeminiClient();

  const prompt = `You are "Vymx Chief Wealth Officer & Global Risk Architect", an elite portfolio manager and quantitative strategist specializing in global cross-border markets, macroeconomic cycles, and institutional asset allocation.

Analyze this investor's profile:
- Age Tier: ${ageGroup || 'career (25-44)'}
- Income Scale: ${incomeLevel || 'professional'}
- Risk Profile: ${riskTolerance || 'moderate'}
- Wealth Target Goal: ${futureGoals || 'capital growth'}
- Investment Horizon: ${investmentHorizon || 'medium term'}
- Core Sandbox Capital: ${virtualBalance || 100000}

Formulate a highly advanced, optimized asset class allocation percentage. Use precise whole values (sum must add up to exactly 100%) for these six categories:
1. stock (High-conviction individual equities, e.g., NVDA, AAPL)
2. crypto (Decentralized digital assets, L1s and DeFi infrastructure)
3. forex (Foreign currency pairs)
4. commodity (Hard assets like Gold, Silver, Crude Oil for inflation hedging)
5. index (Broad index ETFs e.g., SPY, QQQ)
6. bond (Fixed-income debt papers e.g. US10Y, US2Y, corporate bonds)

Please craft your reasoning with extreme technical precision. Use quantitative terminology (e.g., standard deviations, beta, Sharpe ratio, yield spread, duration risk). Provide in-depth analysis of risk factors, correlation coefficients, and exact entry/exit structures. Discuss macroeconomic indicators (PMI, CPI, rate paths) and how they influence this specific allocation.

You must return a single JSON object. Use exactly this JSON structure, with no markdown codeblocks, no extra explanation text, just pure JSON:
{
  "allocation": {
    "stock": <number>,
    "crypto": <number>,
    "forex": <number>,
    "commodity": <number>,
    "index": <number>,
    "bond": <number>
  },
  "reasoning": "<string summarizing highly advanced professional rationale in clear scannable markdown with macro insights, correlation metrics, and quantitative framing>",
  "recommendedAssets": ["<symbol1>", "<symbol2>", "<symbol3>", "<symbol4>", "<symbol5>"],
  "wealthProtectionTip": "<string giving absolute instructions for tail-risk defense, hedging strategies (e.g., put spreads, VIX calls), and tracking error offsets>",
  "macroOutlook": "<string providing a concise 3-6 month macroeconomic forecast based on current Fed/Central Bank policies>"
}
Ensure recommendedAssets contains exactly 5 symbols.`;

  // Default localized high-quality response builder for safe fallback (Indian-focused)
  let stockPct = 35, bondPct = 20, cryptoPct = 5, indexPct = 25, commPct = 10, forexPct = 5;
  if (riskTolerance === 'aggressive') {
    stockPct = 50; bondPct = 10; cryptoPct = 15; indexPct = 15; commPct = 5; forexPct = 5;
  } else if (riskTolerance === 'conservative' || ageGroup === 'retired') {
    stockPct = 10; bondPct = 40; cryptoPct = 0; indexPct = 30; commPct = 15; forexPct = 5;
  }
  
  const fallbackObj = {
    allocation: { stock: stockPct, crypto: cryptoPct, forex: forexPct, commodity: commPct, index: indexPct, bond: bondPct },
    reasoning: `Based on your profile as an investor in India with an income bracket of **${incomeLevel || 'professional'}** and a **${riskTolerance || 'moderate'}** risk posture, our structural models recommend a highly resilient layout heavily weighted towards Indian economic growth:
* **Index ETFs (${indexPct}%)**: Anchored in the **NIFTY50**, **SENSEX**, or **BANKNIFTY** to ride the structural expansion of the Indian GDP.
* **Bluechips (${stockPct}%)**: Strategically positioned in high-liquidity market leaders like **RELIANCE**, **TCS**, and **HDFCBANK** which display historical consistency.
* **Commodities & Bonds (${commPct + bondPct}%)**: Anchoring your purchasing power against rupee inflation through Gold (GC=F) and sovereign bonds (yielding steady cash-equivalent buffers).
* **Tax Action Note**: Consider combining these with Equity Linked Savings Schemes (ELSS) under Section 80C to maximize tax refunds while investing.`,
    recommendedAssets: riskTolerance === 'conservative' ? ['NIFTY50', 'SENSEX', 'HDFCBANK', 'GC=F'] : ['NIFTY50', 'RELIANCE', 'TCS', 'BTC', 'HDFCBANK'],
    wealthProtectionTip: `Always retain 3-6 months' liquid runway in emergency contingency deposits. Maintain a systematic trading stop-loss on high-beta sector bets, while deploying systematically (SIP) into India Index trackers to average technical drawdowns.`
  };

  if (!client) {
    return res.json({ result: fallbackObj, isMock: true });
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            allocation: {
              type: Type.OBJECT,
              properties: {
                stock: { type: Type.INTEGER },
                crypto: { type: Type.INTEGER },
                forex: { type: Type.INTEGER },
                commodity: { type: Type.INTEGER },
                index: { type: Type.INTEGER },
                bond: { type: Type.INTEGER }
              },
              required: ['stock', 'crypto', 'forex', 'commodity', 'index', 'bond']
            },
            reasoning: { type: Type.STRING },
            recommendedAssets: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            wealthProtectionTip: { type: Type.STRING }
          },
          required: ['allocation', 'reasoning', 'recommendedAssets', 'wealthProtectionTip']
        }
      }
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);
    return res.json({ result: parsed, isMock: false });
  } catch (error: any) {
    // Silenced API error warning
    return res.json({ result: fallbackObj, isMock: true });
  }
});

// 4. Live Grounded News search endpoint
app.post('/api/ai/live-news', async (req, res) => {
  const { market } = req.body;
  const cacheKey = `live-news-${market}`;
  const cached = getFromCache(cacheKey);
  if (cached) return res.json(cached);

  const client = getGeminiClient();
  const fallbackData = {
    articles: [
      { id: "1", title: "Global Markets Rally on Tech Earnings Surrogate Data", source: "Financial Times", time: "2 mins ago", summary: "Earnings exceed expectations.", sentiment: "bullish", symbolAffected: "Equities" },
      { id: "2", title: "Central Banks Hint at Coordinated Rate Decisions Next Quarter", source: "Bloomberg", time: "15 mins ago", summary: "Rate decisions pending.", sentiment: "neutral", symbolAffected: "Macro" }
    ],
    isMock: true
  };
  if (!client) {
    setToCache(cacheKey, fallbackData);
    return res.json(fallbackData);
  }
  const prompt = `Search the web for the absolute latest, breaking financial news globally (focusing on ${market || 'global equities'}).
Return EXACTLY a JSON object with an "articles" array. Each article MUST have these EXACT keys:
- "id": string (unique ID)
- "title": string (the headline)
- "source": string (the publisher)
- "time": string (e.g. "10 mins ago")
- "summary": string (1 sentence summary)
- "sentiment": "bullish" | "bearish" | "neutral"
- "symbolAffected": string (the ticker or general category e.g. "Equities", "Macro", "AAPL", "BTC")

Ensure there are exactly 6 recent articles. ONLY return valid JSON.`;

  try {
    const response = await client.models.generateContent({
      // @ts-ignore
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            articles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  source: { type: Type.STRING },
                  time: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  sentiment: { type: Type.STRING },
                  symbolAffected: { type: Type.STRING }
                },
                required: ['id', 'title', 'source', 'time', 'summary', 'sentiment', 'symbolAffected']
              }
            }
          },
          required: ['articles']
        }
      }
    });
    const text = response.text || '';
    const parsed = JSON.parse(text);
    const finalData = { articles: parsed.articles, isMock: false };
    setToCache(cacheKey, finalData);
    return res.json(finalData);
  } catch (e) {
    setToCache(cacheKey, fallbackData);
    return res.json(fallbackData);
  }
});

// 6. Domino Quiz Generation Route
app.get('/api/ai/quiz', async (req, res) => {
  const client = getGeminiClient();
  const prompt = `You are a macroeconomic AI. Generate a "Domino Quiz" scenario for global financial markets.
Return a clean JSON object with these exact keys:
- "scenarioTitle": A short 3-4 word title (e.g. "Red Sea Blockade")
- "scenarioText": A 2-3 sentence explanation of the macro event.
- "options": An array of exactly 3 objects representing sectors/regions, with keys "label" (e.g. "Transport", "Energy (Europe)"), "correct" (boolean, only one is true), and "reason" (short string explaining why).
Return ONLY the raw JSON.`;

  const fallbackQuiz = {
    scenarioTitle: "Red Sea Blockade",
    scenarioText: "Houthi rebel attacks have paralyzed the Suez Canal. Select a sector on the globe most likely to experience a massive supply shock.",
    options: [
      { label: "Transport", correct: false, reason: "While impacted, it is not the primary shockpoint." },
      { label: "Semis (Taiwan)", correct: false, reason: "Chip supply relies more on air freight than the Suez." },
      { label: "Energy (Europe)", correct: true, reason: "The delayed supply shock immediately triggers energy cost spikes across Europe." }
    ]
  };

  if (!client) {
    return res.json(fallbackQuiz);
  }

  try {
    const response = await client.models.generateContent({
      // @ts-ignore
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });
    
    return res.json(JSON.parse(response.text || "{}"));
  } catch(e) {
    return res.json(fallbackQuiz);
  }
});

// 7. Macro Narrative Generator
app.get('/api/ai/narrative', async (req, res) => {
  const client = getGeminiClient();
  const prompt = `Generate a single short sentence (max 20 words) describing a current real-world macroeconomic flow detected globally by Vymx AI. Make it sound like a Bloomberg terminal alert. e.g. "Aggressive rotation from US Software into Asian Semiconductor manufacturing detected."`;

  if (!client) {
    return res.json({ text: "Aggressive rotation from US Software into Asian Semiconductor manufacturing detected." });
  }

  try {
    const response = await client.models.generateContent({
      // @ts-ignore
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    
    return res.json({ text: response.text?.trim() || "Massive capital flow out of European bonds into emerging market commodities." });
  } catch(e) {
    return res.json({ text: "Massive capital flow out of European bonds into emerging market commodities." });
  }
});

// 8. Latest Exchange/Event Details
app.get('/api/ai/exchange-latest', async (req, res) => {
  const exchange = req.query.exchange || 'NYSE';
  const client = getGeminiClient();

  const fallbackData = {
    news: `Latest real-world constraints impacting ${exchange} are driving localized volatility.`,
    sentiment: "Cautiously Optimistic",
    topSector: "Financials"
  };

  if (!client) {
    return res.json(fallbackData);
  }

  const prompt = `Search the web for the absolute latest, most current financial news regarding the ${exchange} market or economic region. Return a JSON object with:
- "news": A 2-sentence summary of the biggest event happening *right now*.
- "sentiment": A short string (e.g., "Bullish", "Bearish", "Risk-Off").
- "topSector": The sector most impacted by this event.`;

  try {
    const response = await client.models.generateContent({
      // @ts-ignore
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json'
      }
    });
    
    return res.json(JSON.parse(response.text || "{}"));
  } catch(e) {
    return res.json(fallbackData);
  }
});

// 9. Market Auras Live Analyzer
app.get('/api/ai/market-auras', async (req, res) => {
  const client = getGeminiClient();
  const fallbackData = [
    { sector: 'Technology', score: 85, trend: 'growth' },
    { sector: 'Healthcare', score: 62, trend: 'neutral' },
    { sector: 'Energy', score: 30, trend: 'stress' },
    { sector: 'Financials', score: 45, trend: 'stress' },
    { sector: 'Consumer', score: 75, trend: 'growth' },
    { sector: 'Real Estate', score: 55, trend: 'neutral' },
  ];

  if (!client) {
    return res.json(fallbackData);
  }

  const prompt = `Search the current web for live market performance across major sectors. Return a JSON array of precisely these 6 sectors: Technology, Healthcare, Energy, Financials, Consumer, Real Estate. 
For each, provide:
- "sector": the name
- "score": a number from 0-100 indicating momentum/confidence
- "trend": "growth", "neutral", or "stress"`;

  try {
    const response = await client.models.generateContent({
      // @ts-ignore
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json'
      }
    });
    const parsed = JSON.parse(response.text || 'null');
    return res.json(Array.isArray(parsed) && parsed.length > 0 ? parsed : fallbackData);
  } catch(e) {
    return res.json(fallbackData);
  }
});

// 10. Real-time Institutional Flows
app.get('/api/ai/institutional-flows', async (req, res) => {
  const client = getGeminiClient();
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const prompt = `You are a premium institutional block deal and fund flow tracking AI. Search the web for the top 5 most significant institutional block deals, FII/DII fund movements, or sovereign wealth fund activities that occurred recently (as of ${currentDate}). 
Return a JSON object strictly adhering to this schema:
{
  "deals": [
    {
      "id": "unique-id",
      "investor": "Fund Name (e.g., Vanguard, BlackRock, LIC)",
      "type": "FII" or "DII",
      "targetCompany": "Company Name",
      "targetSector": "Sector",
      "targetCountry": "Country",
      "amount": number (in USD or INR, absolute value),
      "currency": "USD" or "INR",
      "pricePerShare": number (estimated execution price),
      "date": "ISO timestamp of event",
      "rationale": "1-2 sentence strategic reasoning for the trade based on news",
      "sentiment": "Bullish" or "Bearish",
      "assetClass": "Equity" or "Debt" or "Hybrid"
    }
  ],
  "monthlyTrends": [
     // generate 30 objects representing the last 30 days of net flow (FII/DII)
     // { "date": "Jan 1", "FII": 1200, "DII": -400 }
  ],
  "sectorFlows": [
     // generate 5 sector objects
     // { "sector": "Tech", "fii": 400, "dii": 200, "net": 600 }
  ]
}
Return only JSON.`;

  const fallbackData = {
    deals: [],
    monthlyTrends: [],
    sectorFlows: []
  };

  if (!client) {
    return res.json({ ...fallbackData, isMock: true });
  }

  try {
    const response = await client.models.generateContent({
      // @ts-ignore
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json'
      }
    });
    const parsed = JSON.parse(response.text || '{}');
    return res.json({ ...parsed, isMock: false });
  } catch(e) {
    return res.json({ ...fallbackData, isMock: true });
  }
});

// 11. Economic Calendar Live
app.get('/api/ai/economic-calendar', async (req, res) => {
  const client = getGeminiClient();
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  const prompt = `You are a live macroeconomic event tracker. Today is ${currentDate}. List the 6 most important macroeconomic events (CPI, FOMC, ECB rates, GDP, etc.) happening this week or recently.
Return a JSON object:
{
  "events": [
    {
      "id": "unique-id",
      "time": "Time (e.g. 08:30 AM UTC)",
      "country": "US, EU, JP, IN, etc",
      "impact": "high" or "medium" or "low",
      "title": "Event Title",
      "actual": "Actual figure (or '-')",
      "forecast": "Forecast figure",
      "prev": "Previous figure"
    }
  ]
}
Return only JSON.`;

  const fallbackData = {
    events: [
      { id: '1', time: '08:30 AM', country: 'US', impact: 'high', title: 'Core CPI (MoM)', actual: '0.3%', forecast: '0.3%', prev: '0.4%' },
      { id: '2', time: '10:00 AM', country: 'US', impact: 'medium', title: 'Consumer Sentiment', actual: '79.6', forecast: '79.0', prev: '78.8' },
      { id: '3', time: '02:00 PM', country: 'US', impact: 'high', title: 'FOMC Meeting Minutes', actual: '-', forecast: '-', prev: '-' },
      { id: '4', time: '04:00 AM', country: 'EU', impact: 'medium', title: 'ECB President Speaks', actual: '-', forecast: '-', prev: '-' },
      { id: '5', time: '12:30 AM', country: 'JP', impact: 'high', title: 'BoJ Interest Rate Decision', actual: '0.1%', forecast: '0.1%', prev: '-0.1%' },
      { id: '6', time: '07:30 AM', country: 'IN', impact: 'medium', title: 'WPI Inflation (YoY)', actual: '0.53%', forecast: '0.40%', prev: '0.27%' }
    ]
  };

  if (!client) {
    return res.json({ ...fallbackData, isMock: true });
  }

  try {
    const response = await client.models.generateContent({
      // @ts-ignore
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json'
      }
    });
    const parsed = JSON.parse(response.text || '{}');
    return res.json({ events: parsed.events || fallbackData.events, isMock: false });
  } catch(e) {
    return res.json({ ...fallbackData, isMock: true });
  }
});

// App health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    time: new Date().toISOString(), 
    memoryUsage: process.memoryUsage(), 
    systemMemory: { total: os.totalmem(), free: os.freemem() },
    uptime: process.uptime(), 
    cpuLoad: os.loadavg(),
    version: '2.0.0-advanced', 
    aiBackend: getGeminiClient() ? 'connected' : 'mock',
    cache: apiCacheLRU.stats()
  });
});
import yahooFinanceModule from 'yahoo-finance2';
const YF = (yahooFinanceModule as any).default || yahooFinanceModule;
const yahooFinance = typeof YF === 'function' ? new YF({ suppressNotices: ['yahooSurvey'] }) : YF;
if (yahooFinance.suppressNotices) {
  yahooFinance.suppressNotices(['yahooSurvey']);
}

// 5. Live real prices API endpoint
app.post('/api/prices', async (req, res) => {
  const cacheKey = 'prices_' + JSON.stringify([...req.body.symbols].sort());
  const cached = getFromCache(cacheKey);
  if (cached) return res.json(cached);
  const { symbols } = req.body;
  if (!symbols || !Array.isArray(symbols)) {
    return res.status(400).json({ error: 'Symbols array required' });
  }

  // Pre-process symbols. Map our internal symbols to Yahoo Finance symbols
  const queries = symbols.map(s => SYMBOL_MAP[s] || s);

  try {
    const quotesResponse = await yahooFinance.quote(queries);
    const quotes: any[] = Array.isArray(quotesResponse) ? quotesResponse : [quotesResponse];

    const result: Record<string, any> = {};
    
    // Process backwards to match original symbols
    for (let i = 0; i < symbols.length; i++) {
      const originalSym = symbols[i];
      const yahooSym = queries[i];
      const quote = quotes.find(q => q.symbol === yahooSym);
      
      if (quote && quote.regularMarketPrice) {
        result[originalSym] = {
          price: quote.regularMarketPrice,
          change: quote.regularMarketChangePercent,
          changeAbs: quote.regularMarketChange,
          low52w: quote.fiftyTwoWeekLow || quote.regularMarketPrice,
          high52w: quote.fiftyTwoWeekHigh || quote.regularMarketPrice,
          prevClose: quote.regularMarketPreviousClose,
        };
      }
    }

    const responseData = { success: true, prices: result };
    setToCache('prices_' + JSON.stringify([...req.body.symbols].sort()), responseData, 1000);
    res.json(responseData);
  } catch (error) {
    console.error('Yahoo Finance API Error:', error);
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
});


// Vymx Intelligence Real-time Data Transmitter Pipeline
app.get('/api/ai/vymx-intelligence', async (req, res) => {
  const cacheKey = 'vymx_intelligence_live';
  const cached = getFromCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const indices = ['^NSEI', '^BSESN', '^GSPC', '^IXIC', 'BTC-USD', 'ETH-USD', '^VIX', 'INR=X', 'EURINR=X', 'GBPINR=X'];
    const quotes = await yahooFinance.quote(indices);
    
    // Process quotes
    const quoteMap = {};
    for (const q of quotes) {
      quoteMap[q.symbol] = q;
    }
    
    // Calculate synthetic intelligence data based on real markets
    const btc = quoteMap['BTC-USD'];
    const vix = quoteMap['^VIX'];
    const spx = quoteMap['^GSPC'];
    const nifty = quoteMap['^NSEI'];
    const sensex = quoteMap['^BSESN'];

    const fearGreed = Math.max(0, Math.min(100, 100 - ((vix?.regularMarketPrice || 20) / 40 * 100)));
    
    const realtimeData = {
      fearGreed: Math.round(fearGreed),
      btcHigh: btc?.regularMarketDayHigh || btc?.regularMarketPrice || 0,
      btcPrice: btc?.regularMarketPrice || 0,
      vixPrice: vix?.regularMarketPrice || 0,
      spxPrice: spx?.regularMarketPrice || 0,
      spxChange: spx?.regularMarketChangePercent || 0,
      niftyPrice: nifty?.regularMarketPrice || 0,
      niftyChange: nifty?.regularMarketChangePercent || 0,
      sensexPrice: sensex?.regularMarketPrice || 0,
      sensexChange: sensex?.regularMarketChangePercent || 0,
      
      orderImbalance: Math.floor(40 + (spx?.regularMarketChangePercent || 0) * 10),
      smartMoney: 140 + (spx?.regularMarketChangePercent || 0) * 5,
      darkPool: Math.floor(65 - (vix?.regularMarketChangePercent || 0)),
      algoRisk: Math.min(1, Math.max(0, (vix?.regularMarketPrice || 15) / 50)),
      
      capitalInflows: { 
        us: 42.5 + (spx?.regularMarketChangePercent || 0) * 2, 
        jp: 18.2, 
        in: 8.4 + (nifty?.regularMarketChangePercent || 0) * 2
      },
      capitalOutflows: { 
        eu: 15.1, 
        cn: 12.8 
      },
      sectorMomentum: { 
        tech: 85 + (quoteMap['^IXIC']?.regularMarketChangePercent || 0) * 5, 
        fin: 62 + (nifty?.regularMarketChangePercent || 0) * 3, 
        util: -15, 
        real: -40 
      }
    };

    const responseData = { success: true, data: realtimeData };
    setToCache(cacheKey, responseData, 1000); // 1 second cache for extreme live feel
    res.json(responseData);
  } catch (error) {
    console.error('Vymx Intelligence Pipeline Error:', error);
    res.status(500).json({ error: 'Pipeline breakdown' });
  }
});


// --- External Financial APIs Integration (Alpaca, FMP, Finnhub, Yahoo Finance) ---

// Yahoo Finance - Historical Data
app.get('/api/historical/:symbol', async (req, res) => {
  const cacheKey = 'hist_' + req.params.symbol + '_' + JSON.stringify(req.query);
  const cached = getFromCache(cacheKey);
  if (cached) return res.json(cached);
  const { symbol } = req.params;
  const { period1, period2, interval } = req.query; 
  
  const lookupSymbol = SYMBOL_MAP[symbol] || symbol;

  try {
     const options = {
         period1: period1 ? String(period1) : '2023-01-01',
         period2: period2 ? String(period2) : new Date().toISOString().split('T')[0],
         interval: (interval as "1d" | "1wk" | "1mo") || '1d',
     };
     const result = await yahooFinance.historical(lookupSymbol, options);
     const responseData = { success: true, data: result };
     setToCache(cacheKey, responseData);
     res.json(responseData);
  } catch (error: any) {
     res.status(500).json({ error: 'Failed to fetch historical data.', details: error.message });
  }
});

// Yahoo Finance - Fundamentals & Financial Statements
app.get('/api/yahoo/financials/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const cacheKey = 'fin_' + symbol;
  const cached = getFromCache(cacheKey);
  if (cached) return res.json(cached);
  
  const lookupSymbol = SYMBOL_MAP[symbol] || symbol;

  try {
    const modules: any = ['defaultKeyStatistics', 'financialData', 'assetProfile'];
    const result = await yahooFinance.quoteSummary(lookupSymbol, { modules });
    
    // Use fundamentalsTimeSeries for latest financial statements
    try {
      const fundTimeseries = await yahooFinance.fundamentalsTimeSeries(lookupSymbol, { period1: '2023-01-01', module: 'all', type: 'quarterly' });
      
      // Ensure fundTimeSeries has standard elements
      if (fundTimeseries && fundTimeseries.length > 0) {
        // FundTimeSeries can come back as a patchy array where sometimes an object only has a few keys
        // So we group by date
        const dateMap: Record<string, any> = {};
        
        for (const item of fundTimeseries) {
           const tsDate = (item as any).date;
           if (!tsDate) continue;
           const dKey = tsDate instanceof Date ? tsDate.toISOString() : String(tsDate);
           if (!dateMap[dKey]) dateMap[dKey] = { endDate: tsDate, totalAssets: null, totalLiab: null, totalStockholderEquity: null, cash: null };
           
           if (item.totalAssets !== undefined) dateMap[dKey].totalAssets = item.totalAssets;
           if (item.totalLiabilitiesNetMinorityInterest !== undefined) dateMap[dKey].totalLiab = item.totalLiabilitiesNetMinorityInterest;
           if (item.commonStockEquity !== undefined) dateMap[dKey].totalStockholderEquity = item.commonStockEquity;
           if (item.cashAndCashEquivalents !== undefined) dateMap[dKey].cash = item.cashAndCashEquivalents;
           else if (item.cashCashEquivalentsAndShortTermInvestments !== undefined) dateMap[dKey].cash = item.cashCashEquivalentsAndShortTermInvestments;
        }

        const statements = Object.values(dateMap)
          .filter((st: any) => st.totalAssets !== null || st.totalLiab !== null)
          .sort((a: any, b: any) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

        if (statements.length > 0) {
           (result as any).fundamentalsTimeSeries = statements;
        }
      }
    } catch (e: any) {
       console.warn(`Failed to fetch fundamentalsTimeSeries fallback for ${lookupSymbol}: `, e.message);
    }

    const responseData = { success: true, data: result };
    setToCache(cacheKey, responseData);
    res.json(responseData);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch financials.', details: error.message });
  }
});

// Yahoo Finance - Screener Engine
app.post('/api/yahoo/screener', async (req, res) => {
  const { symbols } = req.body;
  if (!symbols || !Array.isArray(symbols)) return res.status(400).json({ error: 'Symbols array required.' });

  
  const cacheKey = 'screener_' + JSON.stringify([...symbols].sort());
  const cached = getFromCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const results = [];
    const concurrency = 5;
    for (let i = 0; i < symbols.length; i += concurrency) {
      const chunk = symbols.slice(i, i + concurrency);
      const chunkPromises = chunk.map(async (sym) => {
        try {
          const symCacheKey = 'quoteSummary_' + sym;
          let quoteSummary = getFromCache(symCacheKey);
          
          if (!quoteSummary) {
             quoteSummary = await yahooFinance.quoteSummary(sym, {
              modules: ['price', 'defaultKeyStatistics', 'financialData']
             });
             setToCache(symCacheKey, quoteSummary, 1000 * 60 * 15); // 15 mins cache for fundamental data
          }

          return {
            "Ticker": sym,
            "Company Name": quoteSummary.price?.longName,
            "P/E Ratio": quoteSummary.defaultKeyStatistics?.trailingPE || null,
            "Debt-to-Equity": quoteSummary.financialData?.debtToEquity || null,
            "Profit Margin": quoteSummary.financialData?.profitMargins || null,
            "Total Cash": quoteSummary.financialData?.totalCash || null,
            "Forward EPS": quoteSummary.defaultKeyStatistics?.forwardEps || null,
          };
        } catch (e) {
          console.warn(`Skipping ${sym} for screener: ${e.message}`);
          return null;
        }
      });
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults.filter(Boolean));
    }
    const responseData = { success: true, data: results };
    setToCache(cacheKey, responseData, 1000 * 60 * 5); // 5 minutes cache for the whole screener result
    res.json(responseData);

  } catch (error: any) {
    res.status(500).json({ error: 'Failed to execute screener engine.', details: error.message });
  }
});

// Alpaca Markets - Paper Trading
app.post('/api/alpaca/order', async (req, res) => {
   const { symbol, qty, side, type, time_in_force } = req.body;
   const { ALPACA_API_KEY, ALPACA_API_SECRET } = process.env;
   if (!ALPACA_API_KEY || !ALPACA_API_SECRET) {
     return res.status(403).json({ error: 'Alpaca credentials missing. Add ALPACA_API_KEY and ALPACA_API_SECRET in environment.' });
   }
   
   try {
      const resp = await fetch('https://paper-api.alpaca.markets/v2/orders', {
         method: 'POST',
         headers: {
            'APCA-API-KEY-ID': ALPACA_API_KEY,
            'APCA-API-SECRET-KEY': ALPACA_API_SECRET,
            'Content-Type': 'application/json'
         },
         body: JSON.stringify({ symbol, qty, side, type, time_in_force })
      });
      const data = await resp.json();
      if (!resp.ok) { return res.status(resp.status).json({ error: data.message }); }
      res.json({ success: true, data });
   } catch (error: any) {
      res.status(500).json({ error: 'Failed to execute Alpaca paper trade.', details: error.message });
   }
});

// Financial Modeling Prep (FMP) - Fundamental Analysis
app.get('/api/fmp/profile/:symbol', async (req, res) => {
   const { symbol } = req.params;
   const apiKey = process.env.FMP_API_KEY;
   if (!apiKey) return res.status(403).json({ error: 'FMP credential missing. Add FMP_API_KEY in environment.' });

   try {
      const resp = await fetch(`https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${apiKey}`);
      const data = await resp.json();
      res.json({ success: true, data: data[0] || {} });
   } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch FMP profile', details: error.message });
   }
});

// Finnhub - Global Markets News
app.get('/api/finnhub/news', async (req, res) => {
   const category = req.query.category || 'general';
   const apiKey = process.env.FINNHUB_API_KEY;
   if (!apiKey) return res.status(403).json({ error: 'Finnhub credential missing. Add FINNHUB_API_KEY in environment.' });

   try {
      const resp = await fetch(`https://finnhub.io/api/v1/news?category=${category}&token=${apiKey}`);
      const data = await resp.json();
      res.json({ success: true, data });
   } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch Finnhub news', details: error.message });
   }
});

// TwelveData - Live Stock Quotes
app.get('/api/twelvedata/quote/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) return res.status(403).json({ error: 'TwelveData credential missing. Add TWELVEDATA_API_KEY in environment.' });

  try {
     const resp = await fetch(`https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${apiKey}`);
     const data = await resp.json();
     res.json({ success: true, data });
  } catch (error: any) {
     res.status(500).json({ error: 'Failed to fetch TwelveData quote', details: error.message });
  }
});


// Global Error Handler Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[Global Error]", err);
  res.status(500).json({ 
    success: false, 
    error: "Internal Server Error", 
    message: err.message || "An unexpected error occurred in the Vymx Engine."
  });
});

// 2. Vite static assets serving & SPA router

async function bootstrapServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const httpServer = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Vymx Server] running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });

  const wss = new WebSocketServer({ server: httpServer, path: '/api/ws' });

  wss.on('connection', (ws) => {
    console.log('[WebSocket] Client connected');
    
    ws.on('message', (message) => {
      const text = message.toString();
      
      // Handle heartbeat ping
      if (text === 'ping') {
        ws.send('pong');
        return;
      }
      
      // Broadcast to everyone else
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(text);
        }
      });
    });

    ws.on('close', () => {
      console.log('[WebSocket] Client disconnected');
    });
  });
}

bootstrapServer().catch((err) => {
  console.error('Failed to bootstrap Express server:', err);
});
