const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.post\('\/api\/ai\/generic-chat', async \(req, res\) => \{[\s\S]*?res\.json\(\{ reply: response\.text \}\);\s*\} catch\(e: any\) \{/m;

const newImplementation = `app.post('/api/ai/generic-chat', async (req, res) => {
  const { message, history, persona, contextData } = req.body;
  const client = getGeminiClient();
  
  if (!client) {
    return res.json({ reply: "Mock response: I am a generic financial chatbot. (API key not configured)" });
  }

  try {
    let personaPrompt = "You are an elite AI Financial Advisor.";
    if (persona === 'Aggressive Growth') {
      personaPrompt = "You are an Aggressive Growth Financial Advisor. Focus on high-risk, high-reward strategies, growth stocks, crypto, and momentum trading.";
    } else if (persona === 'Conservative Wealth') {
      personaPrompt = "You are a Conservative Wealth Advisor. Focus on capital preservation, dividends, bonds, blue-chip stocks, and minimizing risk.";
    } else if (persona === 'Technical Analyst') {
      personaPrompt = "You are a Technical Analyst. Focus on chart patterns, moving averages, RSI, MACD, and price action.";
    }

    let contextString = "";
    if (contextData) {
      if (contextData.activeAsset) {
        contextString += \`\\nContext: The user is currently viewing the asset: \${contextData.activeAsset.name} (\${contextData.activeAsset.symbol}).\`;
      }
      if (contextData.portfolio && contextData.portfolio.length > 0) {
        contextString += \`\\nContext: The user's current portfolio contains: \${contextData.portfolio.map((p: any) => \`\${p.quantity} shares of \${p.symbol}\`).join(', ')}.\`;
      }
    }

    const sysInstruct = \`\${personaPrompt}\${contextString}\\nYou can answer any question about finance, trading, markets, or economics.\\nBe insightful, professional, and helpful. Use markdown for formatting.\`;

    // Map history to the format expected by the API
    const formattedContents = [];
    if (history && history.length > 0) {
      for (const msg of history) {
        formattedContents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      }
    }
    
    // Add current user message
    formattedContents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: formattedContents,
      config: {
        systemInstruction: sysInstruct
      }
    });
    
    res.json({ reply: response.text });
  } catch(e: any) {`;

if (regex.test(server)) {
  server = server.replace(regex, newImplementation);
  fs.writeFileSync('server.ts', server);
  console.log("Successfully patched generic-chat endpoint.");
} else {
  console.log("Regex did not match.");
}
