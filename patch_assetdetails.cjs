const fs = require('fs');

let file = fs.readFileSync('src/components/AssetDetails.tsx', 'utf8');

// Add imports
if (!file.includes('CompetitorDashboard')) {
  file = file.replace(
    'import AssetCorrelation from "./AssetCorrelation";',
    'import AssetCorrelation from "./AssetCorrelation";\nimport CompetitorDashboard from "./CompetitorDashboard";\nimport VolumeAnalysis from "./VolumeAnalysis";'
  );
}

// Inject before the end of left column
const targetStr = `              )}
            </div>
          </div>

        </div>

        {/* Right Side Column: Trade Terminal Executer */}`;

const replaceStr = `              )}
            </div>
          </div>

          {/* New Sections */}
          <CompetitorDashboard asset={asset} assets={assets} formatCurrency={formatCurrencyProp} />
          <VolumeAnalysis asset={asset} />

        </div>

        {/* Right Side Column: Trade Terminal Executer */}`;

if (file.includes(targetStr)) {
  file = file.replace(targetStr, replaceStr);
  fs.writeFileSync('src/components/AssetDetails.tsx', file);
  console.log("Patched AssetDetails");
} else {
  console.log("Target string not found in AssetDetails.tsx");
}
