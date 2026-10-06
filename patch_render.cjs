const fs = require('fs');

let appTsx = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `{currentView === 'institutional-flows' && (`;
const injection = `{currentView === 'geopolitics' && (
              <motion.div key="geopolitics" initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <Geopolitics isMobile={false} />
              </motion.div>
            )}
            {currentView === 'institutional-flows' && (`

if (appTsx.includes(targetStr)) {
  appTsx = appTsx.replace(targetStr, injection);
  fs.writeFileSync('src/App.tsx', appTsx);
  console.log("Patched render section.");
} else {
  console.log("Could not find target string.");
}
