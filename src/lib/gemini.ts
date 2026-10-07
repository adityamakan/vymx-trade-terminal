import { GoogleGenAI } from '@google/genai';

// Initialize GoogleGenAI with import.meta.env.VITE_GEMINI_API_KEY
const getApiKey = (): string => {
  return (
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    ''
  ).replace(/^["']|["']$/g, '').trim();
};

export const createGenAIClient = (): GoogleGenAI | null => {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.length < 5) {
    return null;
  }
  try {
    return new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('[Gemini Client] Initialization warning:', err);
    return null;
  }
};

export interface AdvisorInput {
  ageGroup: string;
  incomeLevel: string;
  riskTolerance: string;
  futureGoals: string;
  investmentHorizon: string;
  virtualBalance: number;
}

export interface AdvisorOutput {
  allocation: {
    stock: number;
    crypto: number;
    forex: number;
    commodity: number;
    index: number;
    bond: number;
  };
  reasoning: string;
  recommendedAssets: string[];
  wealthProtectionTip: string;
  macroOutlook?: string;
}

/**
 * Generate and stream tailored portfolio allocation strategies using Gemini 3.8 Flash
 */
export async function streamWealthAdvisorAllocation(
  input: AdvisorInput,
  onChunk: (accumulatedReasoning: string) => void
): Promise<AdvisorOutput> {
  const client = createGenAIClient();

  const prompt = `You are "Vymx Chief Wealth Officer & Global Risk Architect", an elite portfolio manager and quantitative strategist specializing in global cross-border markets, macroeconomic cycles, and institutional asset allocation.

Analyze this investor's profile:
- Age Tier: ${input.ageGroup || 'career (25-44)'}
- Income Scale: ${input.incomeLevel || 'professional standard'}
- Risk Profile: ${input.riskTolerance || 'moderate'}
- Wealth Target Goal: ${input.futureGoals || 'capital growth'}
- Investment Horizon: ${input.investmentHorizon || 'medium term'}
- Core Sandbox Capital: $${input.virtualBalance || 100000}

Formulate a highly advanced, optimized asset class allocation percentage. Use precise whole numbers (sum must add up to exactly 100%) for these six categories:
1. stock (High-conviction individual equities, e.g., NVDA, AAPL, RELIANCE)
2. crypto (Decentralized digital assets, L1s and DeFi infrastructure)
3. forex (Foreign currency pairs)
4. commodity (Hard assets like Gold, Silver, Crude Oil for inflation hedging)
5. index (Broad index ETFs e.g., SPY, NIFTY50)
6. bond (Fixed-income debt papers e.g. US10Y, US2Y, corporate bonds)

First provide an in-depth institutional analysis of the macro backdrop, duration risk, beta, and correlation.
Then output a JSON block at the very end enclosed in \`\`\`json ... \`\`\` with this exact format:
\`\`\`json
{
  "allocation": {
    "stock": 35,
    "crypto": 5,
    "forex": 5,
    "commodity": 10,
    "index": 25,
    "bond": 20
  },
  "recommendedAssets": ["NIFTY50", "NVDA", "AAPL", "GC=F", "US10Y"],
  "wealthProtectionTip": "Deploy stop-loss brackets on high-beta equity exposure and maintain dollar-cost averaging into broad indices.",
  "macroOutlook": "Central bank rate divergence creates tactical entry opportunities in quality dividend papers."
}
\`\`\``;

  // Fallback defaults
  let stockPct = 35, bondPct = 20, cryptoPct = 5, indexPct = 25, commPct = 10, forexPct = 5;
  if (input.riskTolerance === 'aggressive') {
    stockPct = 50; bondPct = 10; cryptoPct = 15; indexPct = 15; commPct = 5; forexPct = 5;
  } else if (input.riskTolerance === 'conservative' || input.ageGroup === 'retired') {
    stockPct = 10; bondPct = 40; cryptoPct = 0; indexPct = 30; commPct = 15; forexPct = 5;
  }

  const defaultResult: AdvisorOutput = {
    allocation: { stock: stockPct, crypto: cryptoPct, forex: forexPct, commodity: commPct, index: indexPct, bond: bondPct },
    reasoning: `Based on your profile as an investor in the ${input.incomeLevel || 'professional'} bracket with a ${input.riskTolerance || 'moderate'} risk posture, our structural models recommend a highly resilient multi-asset allocation.\n\n- **Equities & Index ETFs (${stockPct + indexPct}%)**: Anchored in liquid bluechips and core index trackers to capture systemic economic expansion.\n- **Fixed Income (${bondPct}%)**: Provides downside buffer and duration stability.\n- **Hard Assets & Commodities (${commPct}%)**: Anchors purchasing power against currency debasement.\n- **Digital Assets (${cryptoPct}%)**: Asymmetric hedge and growth overlay.`,
    recommendedAssets: input.riskTolerance === 'conservative' ? ['NIFTY50', '.SPX', 'HDFCBANK', 'GC=F', 'US10Y'] : ['NIFTY50', 'NVDA', 'AAPL', 'BTC', 'GC=F'],
    wealthProtectionTip: 'Maintain 3-6 months liquid operational reserve and deploy dynamic trailing stop-losses on speculative positions.'
  };

  if (!client) {
    // Attempt backend proxy call if direct client key is omitted
    try {
      const res = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          onChunk(data.result.reasoning || defaultResult.reasoning);
          return data.result;
        }
      }
    } catch (_) {}
    onChunk(defaultResult.reasoning);
    return defaultResult;
  }

  try {
    const stream = await client.models.generateContentStream({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    let fullText = '';
    for await (const chunk of stream) {
      if (chunk.text) {
        fullText += chunk.text;
        // Strip out the json block for clean reading during streaming
        const displayText = fullText.replace(/```json[\s\S]*?```/g, '').trim();
        onChunk(displayText || fullText);
      }
    }

    // Parse the JSON block from fullText
    const jsonMatch = fullText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      const parsed = JSON.parse(jsonMatch[1]);
      const cleanReasoning = fullText.replace(/```json[\s\S]*?```/g, '').trim();
      return {
        allocation: parsed.allocation || defaultResult.allocation,
        reasoning: cleanReasoning || defaultResult.reasoning,
        recommendedAssets: parsed.recommendedAssets || defaultResult.recommendedAssets,
        wealthProtectionTip: parsed.wealthProtectionTip || defaultResult.wealthProtectionTip,
        macroOutlook: parsed.macroOutlook
      };
    }

    return {
      ...defaultResult,
      reasoning: fullText.replace(/```json[\s\S]*?```/g, '').trim() || defaultResult.reasoning
    };
  } catch (err) {
    console.warn('[Gemini Client] Stream error, falling back to proxy/defaults:', err);
    try {
      const res = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          onChunk(data.result.reasoning);
          return data.result;
        }
      }
    } catch (_) {}
    onChunk(defaultResult.reasoning);
    return defaultResult;
  }
}

/**
 * Stream macroeconomic summaries based on real-time indicator data
 */
export async function streamMacroeconomicSummary(
  indicators: any,
  onChunk: (accumulatedSummary: string) => void
): Promise<string> {
  const client = createGenAIClient();

  const prompt = `You are VYMXTRADER's Senior Global Macroeconomist and Quantitative Portfolio Strategist.
Generate a concise, institutional-grade macroeconomic summary based on the following real-time indicator readings:

YIELD CURVE & RATES:
- US 10Y Benchmark: ${indicators?.yieldCurve?.us10y || '4.25'}%
- US 2Y Short-End: ${indicators?.yieldCurve?.us2y || '4.10'}%
- 10Y-2Y Spread: ${indicators?.yieldCurve?.spread10y2y || '+0.15'}% (${indicators?.yieldCurve?.status || 'Normal'})
- Recession Lead Time Estimate: ~${indicators?.yieldCurve?.leadTimeMonths || '12'} months

CENTRAL BANK POLICY:
${indicators?.centralBanks ? Object.entries(indicators.centralBanks).map(([code, b]: any) => `- ${b.name} (${code}): ${b.rate}% [${b.stance}, Cut Prob: ${b.cutProb}%]`).join('\n') : '- Fed Rate: 5.25%, ECB: 3.75%, BOJ: 0.25%'}

MACRO PRESSURES & LIQUIDITY:
- US Dollar Index (DXY): ${indicators?.macroPressures?.dxy || '104.2'}
- WTI Crude Oil: $${indicators?.macroPressures?.crudeOil || '78.5'}/bbl
- Gold Spot: $${indicators?.macroPressures?.gold || '2350'}/oz
- Real Fed Interest Rate: ${indicators?.macroPressures?.realInterestRate || '+2.1'}%

Structure your macroeconomic summary with these concise headings:
1. EXECUTIVE MACRO REGIME DIAGNOSIS
2. MONETARY TRANSMISSION & RATE CUT TIMELINE
3. COMMODITY & CURRENCY FRICTION
4. CROSS-ASSET STRATEGIC IMPLICATIONS (Equities, Bonds, Hard Assets)`;

  const fallbackText = `**EXECUTIVE MACRO REGIME DIAGNOSIS**\nThe global economic landscape is transitioning through a disinflationary consolidation phase. With the 10Y-2Y yield curve spread stabilizing at ${indicators?.yieldCurve?.spread10y2y || '+0.15'}%, recession probabilities remain moderate with an estimated lead time of ~${indicators?.yieldCurve?.leadTimeMonths || 12} months.\n\n**MONETARY TRANSMISSION & RATE CUT TIMELINE**\nMajor central banks exhibit divergent policy velocities. While developed market authorities evaluate easing trajectories, real policy rates remain restrictive, anchoring sovereign duration curves.\n\n**COMMODITY & CURRENCY FRICTION**\nGold spot pricing maintains strong sovereign central bank accumulation bids against dollar volatility. Energy dynamics continue to establish a structural cost floor across transportation and manufacturing.\n\n**CROSS-ASSET STRATEGIC IMPLICATIONS**\nQuantitative portfolios should emphasize quality corporate balance sheets, duration-hedged debt instruments, and systematic index accumulation.`;

  if (!client) {
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          systemInstruction: "You are the chief macroeconomic strategist of VYMXTRADER. Provide quantitative, data-backed macroeconomic summaries."
        })
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.reply || data.response || fallbackText;
        onChunk(text);
        return text;
      }
    } catch (_) {}
    onChunk(fallbackText);
    return fallbackText;
  }

  try {
    const stream = await client.models.generateContentStream({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    let fullText = '';
    for await (const chunk of stream) {
      if (chunk.text) {
        fullText += chunk.text;
        onChunk(fullText);
      }
    }
    return fullText || fallbackText;
  } catch (err) {
    console.warn('[Gemini Client] Macro summary stream error:', err);
    onChunk(fallbackText);
    return fallbackText;
  }
}

/**
 * Stream financial chatbot answers with rich persona context and fallback handling
 */
export async function streamFinancialChat(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; text: string }>,
  persona: string,
  contextData: any,
  onChunk: (accumulatedText: string) => void
): Promise<string> {
  const client = createGenAIClient();

  let personaPrompt = "You are an elite AI Financial Advisor.";
  if (persona === 'Aggressive Growth') {
    personaPrompt = "You are an Aggressive Growth Financial Advisor. Focus on high-risk, high-reward strategies, growth stocks, crypto, and momentum trading.";
  } else if (persona === 'Conservative Wealth') {
    personaPrompt = "You are a Conservative Wealth Advisor. Focus on capital preservation, dividends, bonds, blue-chip stocks, and minimizing risk.";
  } else if (persona === 'Technical Analyst') {
    personaPrompt = "You are a Technical Analyst. Focus on chart patterns, moving averages, RSI, MACD, support/resistance, and price action.";
  }

  let contextString = "";
  if (contextData) {
    if (contextData.activeAsset) {
      contextString += `\nContext: The user is currently viewing: ${contextData.activeAsset.name} (${contextData.activeAsset.symbol}) at price ${contextData.activeAsset.price} (${contextData.activeAsset.change}%).`;
    }
    if (contextData.portfolio && contextData.portfolio.length > 0) {
      contextString += `\nContext: The user's active portfolio contains: ${contextData.portfolio.map((p: any) => `${p.quantity} units of ${p.symbol}`).join(', ')}.`;
    }
  }

  const systemInstruction = `${personaPrompt}${contextString}\nYou can answer any question about finance, trading, markets, macroeconomic indicators, or portfolio optimization.\nBe insightful, professional, and clear. Format output with clean markdown.`;

  const fallbackAnswer = `Thank you for your question. Based on current market conditions and a ${persona} framework, it is advisable to align your positioning with core risk-reward principles. Ensure appropriate position sizing, monitor key benchmark levels, and diversify across uncorrelated asset classes.`;

  if (!client) {
    try {
      const res = await fetch('/api/ai/generic-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: history.slice(-10),
          persona,
          contextData
        })
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.reply || fallbackAnswer;
        onChunk(text);
        return text;
      }
    } catch (_) {}
    onChunk(fallbackAnswer);
    return fallbackAnswer;
  }

  try {
    const formattedContents: any[] = [];
    if (history && history.length > 0) {
      for (const msg of history.slice(-10)) {
        formattedContents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      }
    }
    formattedContents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const stream = await client.models.generateContentStream({
      model: 'gemini-3.8-flash',
      contents: formattedContents,
      config: {
        systemInstruction
      }
    });

    let fullText = '';
    for await (const chunk of stream) {
      if (chunk.text) {
        fullText += chunk.text;
        onChunk(fullText);
      }
    }
    return fullText || fallbackAnswer;
  } catch (err) {
    console.warn('[Gemini Client] Chat stream error, falling back:', err);
    try {
      const res = await fetch('/api/ai/generic-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: history.slice(-10),
          persona,
          contextData
        })
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.reply || fallbackAnswer;
        onChunk(text);
        return text;
      }
    } catch (_) {}
    onChunk(fallbackAnswer);
    return fallbackAnswer;
  }
}

