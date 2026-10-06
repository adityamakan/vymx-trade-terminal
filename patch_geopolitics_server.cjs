const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.get\('\/api\/ai\/geopolitics', async \(req, res\) => \{[\s\S]*?res\.json\(fallbackData\);\n  \}\n\}\);/m;

const newEndpoint = `app.get('/api/ai/geopolitics', async (req, res) => {
  const forceRefresh = req.query.forceRefresh === 'true';
  const cacheKey = 'geopolitics_latest_detailed';
  
  if (!forceRefresh) {
    const cached = getFromCache(cacheKey);
    if (cached) return res.json(cached);
  }

  const client = getGeminiClient();
  const fallbackData = {
    tensions: [
      { 
        id: "1", 
        region: "Middle East", 
        title: "Escalation in the Red Sea", 
        impact: "High", 
        description: "Ongoing disruptions to maritime trade due to regional conflicts.", 
        severity: 85,
        details: {
          what: "Militant groups are targeting commercial vessels in the Red Sea corridor.",
          where: "Red Sea, Bab-el-Mandeb strait, and Gulf of Aden.",
          when: "Escalation began late last year and continues into the current quarter with daily incidents.",
          why: "Stated as retaliation for regional conflicts and a pressure tactic on international coalitions.",
          how: "Using asymmetric drone attacks, anti-ship missiles, and small boat harassment.",
          economic_impact: "Major shipping lines rerouting around the Cape of Good Hope, adding 10-14 days to transit. Spikes in container freight rates and localized energy supply shocks."
        }
      }
    ],
    news: [
      { title: "Global Supply Chains Rerouted Amidst Security Concerns", time: "2 hours ago" },
      { title: "G7 Finance Ministers Meet to Discuss Sanctions", time: "5 hours ago" }
    ],
    globalRiskIndex: 78
  };

  if (!client) {
    setToCache(cacheKey, fallbackData);
    return res.json(fallbackData);
  }

  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const prompt = \`You are an elite geopolitical intelligence analyst. Today is \${currentDate}. Search the web and provide a highly detailed analysis of the current global geopolitical landscape.
Return a clean JSON object exactly adhering to this schema:
{
  "tensions": [
    {
      "id": "unique-string",
      "region": "String (e.g. Middle East, Eastern Europe, Asia-Pacific, etc)",
      "title": "Short headline of the tension/conflict",
      "impact": "High, Medium, or Low (financial/economic impact)",
      "description": "Short 1-2 sentence overview",
      "severity": number from 0 to 100 (100 being extreme global threat),
      "details": {
        "what": "Detailed explanation of the specific event or conflict",
        "where": "Specific geographic locations and territories involved",
        "when": "Detailed timeline of recent developments",
        "why": "Deep analysis of root causes and strategic motivations",
        "how": "Methods, tactics, diplomatic leverage, or military actions employed",
        "economic_impact": "Detailed breakdown of global market consequences, affected assets, inflation risks, and supply chain disruptions"
      }
    }
  ],
  "news": [
    { "title": "Headline", "time": "e.g. 1 hour ago or Date" }
  ],
  "globalRiskIndex": number (overall global geopolitical risk score from 0-100)
}
Return ONLY valid JSON. Give exactly 4-5 major tensions and 4-5 news items, focusing heavily on detailed reporting in the 'details' object.\`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt
    });
    
    let rawText = response.text || "";
    rawText = rawText.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
    
    const parsed = JSON.parse(rawText);
    setToCache(cacheKey, parsed);
    res.json(parsed);
  } catch(e: any) {
    console.error("Geopolitics API error:", e);
    res.json(fallbackData);
  }
});`;

if (regex.test(server)) {
  server = server.replace(regex, newEndpoint);
  fs.writeFileSync('server.ts', server);
  console.log("Successfully patched geopolitics endpoint.");
} else {
  console.log("Regex did not match. Trying manual replacement.");
}
