const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');

const newEndpoint = `
// Geopolitics endpoint
app.get('/api/ai/geopolitics', async (req, res) => {
  const cacheKey = 'geopolitics_latest';
  const cached = getFromCache(cacheKey);
  if (cached) return res.json(cached);

  const client = getGeminiClient();
  const fallbackData = {
    tensions: [
      { id: "1", region: "Middle East", title: "Escalation in the Red Sea", impact: "High", description: "Ongoing disruptions to maritime trade due to regional conflicts.", severity: 85 },
      { id: "2", region: "Eastern Europe", title: "Continued Hostilities", impact: "High", description: "Prolonged conflict affecting global energy and agricultural markets.", severity: 90 },
      { id: "3", region: "Asia-Pacific", title: "South China Sea Naval Maneuvers", impact: "Medium", description: "Increased military presence and contested territorial claims.", severity: 70 }
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
  const prompt = \`You are an elite geopolitical intelligence analyst. Today is \${currentDate}. Search the web and provide an analysis of the current global geopolitical landscape.
Return a clean JSON object exactly adhering to this schema:
{
  "tensions": [
    {
      "id": "unique-string",
      "region": "String (e.g. Middle East, Eastern Europe, Asia-Pacific, etc)",
      "title": "Short headline of the tension/conflict",
      "impact": "High, Medium, or Low (financial/economic impact)",
      "description": "2-3 sentences explaining the affair and its global market consequences",
      "severity": number from 0 to 100 (100 being extreme global threat)
    }
  ],
  "news": [
    { "title": "Headline", "time": "e.g. 1 hour ago or Date" }
  ],
  "globalRiskIndex": number (overall global geopolitical risk score from 0-100)
}
Return ONLY valid JSON. Give exactly 5-6 major tensions and 4-5 news items.\`;

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
});
`;

// Insert the endpoint before the websocket block or at the end of the API routes
const targetStr = `app.post('/api/ai/generic-chat'`;
if (server.includes(targetStr)) {
  server = server.replace(targetStr, newEndpoint + '\n\n  ' + targetStr);
  fs.writeFileSync('server.ts', server);
  console.log("Geopolitics endpoint added successfully.");
} else {
  console.log("Could not find insertion point.");
}
