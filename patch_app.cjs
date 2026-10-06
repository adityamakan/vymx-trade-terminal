const fs = require('fs');

let appTsx = fs.readFileSync('src/App.tsx', 'utf8');

// Add import
if (!appTsx.includes("import { Geopolitics }")) {
  appTsx = appTsx.replace("import InstitutionalFlows from './components/InstitutionalFlows';", "import InstitutionalFlows from './components/InstitutionalFlows';\nimport { Geopolitics } from './components/Geopolitics';");
}

// Add view type
appTsx = appTsx.replace(/'dashboard' \| 'screener' \| 'portfolio' \| 'details' \| 'heatmap' \| 'academy' \| 'advisor' \| 'macro' \| 'institutional-flows' \| 'news' \| 'chatbot'/g, "'dashboard' | 'screener' | 'portfolio' | 'details' | 'heatmap' | 'academy' | 'advisor' | 'macro' | 'institutional-flows' | 'news' | 'chatbot' | 'geopolitics'");

// Add render block
const renderBlock = `
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentView}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.15 }}
          className="flex-1 overflow-hidden"
        >
`;
const oldRenderTarget = `<AnimatePresence mode="wait">`;
if (appTsx.includes("currentView === 'chatbot' && <FinancialChatbot isMobile={isMobile} />")) {
  appTsx = appTsx.replace("currentView === 'chatbot' && <FinancialChatbot isMobile={isMobile} />", "currentView === 'chatbot' && <FinancialChatbot isMobile={isMobile} />}\n          {currentView === 'geopolitics' && <Geopolitics isMobile={isMobile} />");
} else {
    console.log("Could not find render section to patch geopolitics");
}

fs.writeFileSync('src/App.tsx', appTsx);
console.log("Patched App.tsx");

let navbarTsx = fs.readFileSync('src/components/Navbar.tsx', 'utf8');

// Add view type
navbarTsx = navbarTsx.replace(/'dashboard' \| 'screener' \| 'portfolio' \| 'details' \| 'heatmap' \| 'academy' \| 'advisor' \| 'macro' \| 'institutional-flows' \| 'news' \| 'chatbot'/g, "'dashboard' | 'screener' | 'portfolio' | 'details' | 'heatmap' | 'academy' | 'advisor' | 'macro' | 'institutional-flows' | 'news' | 'chatbot' | 'geopolitics'");

// Add nav link
const oldNav = `<button
                id="btn-nav-chatbot"`;
const newNav = `<button
                id="btn-nav-geopolitics"
                onClick={() => setView('geopolitics')}
                className={\`relative px-3 py-2 rounded-md text-xs font-medium transition-all \${
                  currentView === 'geopolitics'
                    ? 'text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }\`}
              >
                {currentView === 'geopolitics' && (
                  <motion.div
                    layoutId="navbar-active-bg"
                    className="absolute inset-0 bg-white/10 rounded-md -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                Geopolitics
              </button>
              <button
                id="btn-nav-chatbot"`;

if (navbarTsx.includes(oldNav)) {
  navbarTsx = navbarTsx.replace(oldNav, newNav);
} else {
    console.log("Could not find desktop nav button to patch");
}

// Add mobile nav link
const oldMobileNav = `<button
              id="btn-mobile-nav-chatbot"`;
const newMobileNav = `<button
              id="btn-mobile-nav-geopolitics"
              onClick={() => { setView('geopolitics'); setIsMobileMenuOpen(false); }}
              className={\`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors \${
                currentView === 'geopolitics' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/10' : 'text-zinc-400'
              }\`}
            >
              Geopolitics
            </button>
            <button
              id="btn-mobile-nav-chatbot"`;

if (navbarTsx.includes(oldMobileNav)) {
  navbarTsx = navbarTsx.replace(oldMobileNav, newMobileNav);
} else {
    console.log("Could not find mobile nav button to patch");
}

fs.writeFileSync('src/components/Navbar.tsx', navbarTsx);
console.log("Patched Navbar.tsx");
