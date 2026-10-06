const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');
server = server.replace(/model: 'gemini-3\.5-flash'/g, "model: 'gemini-3.7-flash'");
fs.writeFileSync('server.ts', server);
console.log("Model patched to 3.7-flash.");
