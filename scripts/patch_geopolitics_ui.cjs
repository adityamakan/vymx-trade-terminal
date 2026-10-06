const fs = require('fs');
let code = fs.readFileSync('src/components/Geopolitics.tsx', 'utf8');

// Add a lastUpdated state
if (!code.includes("const [lastUpdated, setLastUpdated]")) {
  code = code.replace("const [error, setError] = useState<string | null>(null);", "const [error, setError] = useState<string | null>(null);\n  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());");
}

// Set last updated on fetch success
code = code.replace("setData(result);", "setData(result);\n      setLastUpdated(new Date());");

// Lower interval to 2 minutes
code = code.replace("300000", "120000");

// Modify the Header to show the last updated timestamp
const targetHeader = `<p className="text-zinc-400 max-w-2xl text-sm md:text-base">
            Live intelligence tracking global conflicts, political affairs, and their macroeconomic impact on sovereign and corporate risk. Automatically updates.
          </p>`;
const replacementHeader = `<p className="text-zinc-400 max-w-2xl text-sm md:text-base mb-2">
            Live intelligence tracking global conflicts, political affairs, and their macroeconomic impact on sovereign and corporate risk.
          </p>
          <div className="flex items-center gap-2 text-xs text-indigo-400 bg-indigo-500/10 w-max px-2 py-1 rounded border border-indigo-500/20">
            <Activity className="h-3 w-3 animate-pulse" />
            <span>Auto-updating live feed • Last fetch: {lastUpdated.toLocaleTimeString()}</span>
          </div>`;
          
code = code.replace(targetHeader, replacementHeader);

fs.writeFileSync('src/components/Geopolitics.tsx', code);
console.log("Patched UI.");
