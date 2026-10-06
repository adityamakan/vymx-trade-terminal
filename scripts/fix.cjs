const fs = require('fs');

let comp = fs.readFileSync('src/components/CompetitorDashboard.tsx', 'utf8');
comp = comp.replace(/className=\{\\\`/g, "className={`");
comp = comp.replace(/\\`\}/g, "`}");
comp = comp.replace(/\\\$/g, "$");
fs.writeFileSync('src/components/CompetitorDashboard.tsx', comp);

let vol = fs.readFileSync('src/components/VolumeAnalysis.tsx', 'utf8');
vol = vol.replace(/\\\$/g, "$");
vol = vol.replace(/\\\`/g, "\`");
fs.writeFileSync('src/components/VolumeAnalysis.tsx', vol);

console.log("Fixed backslashes");
