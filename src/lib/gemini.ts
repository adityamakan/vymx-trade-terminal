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

async function requestAI<T>(feature: string, payload: Record<string, unknown>): Promise<T> {
  const response = await fetch(`/api/ai/${encodeURIComponent(feature)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30_000)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.success === false) {
    throw new Error(data?.error || `AI service request failed (HTTP ${response.status})`);
  }
  return data as T;
}

/**
 * Server-proxied portfolio analysis. Provider credentials remain on the server;
 * no VITE_ key is embedded in the browser bundle.
 */
export async function streamWealthAdvisorAllocation(
  input: AdvisorInput,
  onChunk: (accumulatedReasoning: string) => void
): Promise<AdvisorOutput> {
  const data = await requestAI<{ result?: AdvisorOutput }>('advisor', input as unknown as Record<string, unknown>);
  if (!data.result?.allocation || !data.result.reasoning) {
    throw new Error('AI advisor returned an incomplete structured recommendation.');
  }
  const allocation = data.result.allocation;
  const total = allocation.stock + allocation.crypto + allocation.forex +
    allocation.commodity + allocation.index + allocation.bond;
  if (total !== 100) throw new Error('AI advisor allocation failed validation.');
  onChunk(data.result.reasoning);
  return data.result;
}

/**
 * Summarize only the indicator payload supplied by the caller. The model is
 * instructed not to invent missing releases, market prices, or policy decisions.
 */
export async function streamMacroeconomicSummary(
  indicators: any,
  onChunk: (accumulatedSummary: string) => void
): Promise<string> {
  const prompt = `Prepare an institutional macroeconomic summary from the following supplied indicator payload. Separate observed values from inference. Do not fill missing values with assumptions or invent live data. Highlight limitations and uncertainty.\n\nIndicator payload:\n${JSON.stringify(indicators)}`;
  const data = await requestAI<{ reply?: string; answer?: string }>('chat', {
    message: prompt,
    systemInstruction: 'You are VYMX’s macroeconomic research assistant. Use only the data supplied in the user message; never fabricate market facts.'
  });
  const summary = data.reply || data.answer;
  if (!summary) throw new Error('AI service returned an empty macro summary.');
  onChunk(summary);
  return summary;
}

/**
 * Financial chat uses the authenticated server-side provider proxy. The client
 * sends conversation context, never an API key.
 */
export async function streamFinancialChat(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; text: string }>,
  persona: string,
  contextData: any,
  onChunk: (accumulatedText: string) => void
): Promise<string> {
  const data = await requestAI<{ reply?: string; answer?: string }>('generic-chat', {
    message,
    history: history.slice(-10),
    persona,
    contextData,
    systemInstruction: `You are a careful financial research assistant using the ${persona || 'balanced'} persona. Distinguish facts, assumptions, and forecasts. Do not claim access to live market data unless it is explicitly included in the supplied context. This is educational information, not individualized regulated investment advice.`
  });
  const answer = data.reply || data.answer;
  if (!answer) throw new Error('AI service returned an empty response.');
  onChunk(answer);
  return answer;
}
