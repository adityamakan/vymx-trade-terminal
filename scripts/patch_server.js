const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Inject simple caching
const cacheCode = `
// Simple In-Memory Cache
const apiCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000 * 5; // 5 minutes

function getFromCache(key: string) {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  return null;
}

function setToCache(key: string, data: any) {
  apiCache.set(key, { data, timestamp: Date.now() });
}
`;

content = content.replace('const limiter = rateLimit({', cacheCode + '\nconst limiter = rateLimit({');

fs.writeFileSync('server.ts', content);
