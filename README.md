# vymx-trade-terminal
Cross-border market analytics terminal and multi-asset trading simulator. Built with Vite, React, Node.js, Express, and Gemini AI. Tracks stocks, crypto, forex, and bonds across multiple currencies with client-side quantitative risk math (VaR, Pearson r), production LRU caching, localized tax auditing, and immersive 3D canvases.
nal-grade telemetry, real-time risk calculations, and macro-to-micro financial decision engines across Equities, Forex, Cryptocurrencies, and Debt Bonds natively under a single unified environment.

---

## 🗺️ Product Vision & System Architecture

The core philosophy of the Vymx Trade Terminal is **Asymmetric Market Telemetry**. Traditional retail trading dashboards treat assets as isolated data streams. Vymx bridges this gap by letting users run multi-asset cross-border analysis across varying base currencies (USD, INR, EUR) to discover true systemic market shifts.

Use code with caution.┌──────────────────────────────┐│      Client Web Browser      ││  (Vite + React 19 + ThreeJS)  │└──────────────┬───────────────┘│HTTPS Requests / WebSockets│┌──────────────▼───────────────┐│      Node.js Server          ││   (Express Middleware Tiers) │└──────────────┬───────────────┘│┌───────────────────────┼───────────────────────┐│                       │                       │┌────────▼────────┐     ┌────────▼────────┐     ┌────────▼────────┐│  Gemini AI Core │     │ Yahoo Finance 2 │     │  Firebase Auth  ││(Search Grounding)     │  (Live Tickers) │     │ (Secure Ledger) │└─────────────────┘     └─────────────────┘     └─────────────────┘
The system splits responsibilities into a highly responsive, stateless client architecture and a secure, middleware-protected computational backend server.

---

## 🛠️ Deep Dive Engineering Highlights

### 1. Client-Side Quantitative Risk Engine
To maximize responsiveness and eliminate heavy server roundtrips, all fundamental portfolio math is calculated directly on the client's browser hardware using optimized data matriculation matrices:
*   **Pearson Correlation Coefficient (r)**: Natively loops through time-series arrays across cross-border assets to detect co-movements. This flags when localized market changes (e.g., a shift in Indian tech sectors) are directly altering global Forex or Crypto positions.
*   **30-Period Linear Regression Trajectory**: Uses standard Ordinary Least Squares (y = mx + b) to evaluate localized trend momentum, mapping out short-term 5-day trajectory vectors for optimal trade entry windows.
*   **95% Daily Value at Risk (VaR)**: Leverages historical asset volatility thresholds to calculate maximum prospective portfolio loss metrics over a 24-hour horizon, giving users real-time stress testing capabilities.

### 2. Enterprise Backend Caching Layer (`AdvancedLRUCache`)
To completely eliminate public API rate-limiting issues and minimize system latency, the Express server uses a custom-coded **Least Recently Used (LRU) In-Memory Cache Wrapper**:
*   **Eviction Thresholds**: Configured with a rigid maximum capacity of 500 records and a 5-minute Time-To-Live (TTL).
*   **Memory Efficiency**: When a new ticker request strikes the endpoint, the oldest data layer is instantly evicted. This mechanism safely buffers requests to third-party endpoints like Yahoo Finance and the Google GenAI SDK.

### 3. High-Fidelity 3D Visualizations & Viewports
Data density is maintained through an immersive visual engine layer utilizing `@react-three/fiber` and `three.js`:
*   **3D Volumetric Sphere Allocation Constellation**: Translates asset distribution metrics into dynamic geometric coordinates. Users can spin, zoom, and physically touch a 3D topology map of their capital risk exposure.
*   **Real-Time Price Tick State Overlays**: Ticker pipelines listen for incoming ticks, using rapid color flash states (Green/Red) to represent microsecond price changes smoothly without degrading viewport framing rates.

### 4. Context-Aware Grounded AI Core
Instead of utilizing standard text prompt fields, Vymx uses a programmatic server-side router interacting with `gemini-2.5-flash`:
*   **Data Injection Structure**: Automatically binds deep client parameter matrices (Asset distribution percentages, country origin, age brackets, financial scale, and risk tolerances).
*   **Google Search Grounding**: Forces the AI model to query verified financial engines to return compliant cross-border wealth protection notes, macro hazard alerts, and domestic tax auditing rules (e.g., structuring advice under Indian Section 80C ELSS systems or Sovereign Gold Bonds).

### 5. Multi-Tier State Security & Hydration
*   **Tamper Protection**: State ledgers match transaction data securely through Firebase Auth and an independent Firestore synchronization layer.
*   **Payload Optimization**: Local browser storage state snapshots utilize raw text compression models (`LZString`) to maintain instant client hydration without exposing vulnerable data arrays to unauthenticated manipulation.

---

## 📦 Core Project Stack

### Frontend Architecture
*   **Framework Core**: React 19, TypeScript, Vite Bundler.
*   **Interface Layout**: Tailwind CSS, Framer Motion, Lucide-React.
*   **Data Graphics**: Recharts Engine, React-Globe.gl, Three.js, React Three Fiber (`@react-three/fiber`, `@react-three/drei`).

### Backend Core
*   **Runtime Server**: Node.js, Express Application Framework.
*   **Live Streams**: WS WebSocket Server Infrastructure.
*   **API Security**: Helmet Shield Layer, Express-Rate-Limit.
*   **Third-Party Engines**: Yahoo-Finance2 SDK, Google GenAI SDK.

---

## 📂 Repository File System Architecture

```text
├── .env.example            <- Safe local environment configuration template
├── .gitignore              <- Excludes build scripts, logs, and node dependencies
├── index.html              <- Application DOM Entry point
├── package.json            <- System metadata, manifest hooks, and core dependencies
├── server.ts               <- Express backend application with customized LRU Cache
├── tsconfig.json           <- Core compilation rules for global TypeScript modules
├── vite.config.ts          <- Asset compilation parameters and manual chunk optimization
├── public/                 <- Static project graphics, branding tokens, and models
└── src/                    <- Core Client Codebase
    ├── App.tsx             <- Standard layout orchestration engine
    ├── main.tsx            <- Context registration and DOM injection pipeline
    ├── assets/             <- Graphic components, core styles, and fonts
    ├── components/         <- Reusable visual logic blocks (Charts, Tickers, 3D elements)
    └── views/              <- Main screen layouts (Macro view, Analytics Dashboard, Simulation)
```

---

## 🚀 Local Installation & Deployment Blueprint

1. **Clone the project workspace locally**:
   ```bash
   git clone https://github.com
   cd vymx-trade-terminal
   ```

2. **Install node project requirements**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   * Create a secure local file named `.env` in the root folder.
   * Populate it with your unique credentials based on the `.env.example` format.

4. **Launch the platform locally**:
   * Terminal A (Launch backend engine): `npm run server` (or `node server.js`)
   * Terminal B (Launch local developer frontend site): `npm run dev`
📥 What to Do on Your Screen Right NowGo back to your open GitHub browser page.Toggle the Add README switch to On (it will turn blue).Scroll right to the bottom and click the green Create repository button.On the next screen, you will see your repository homepage. Click on the file named README.md and click the ✏️ Edit/Pencil icon to paste this massive detailed guide directly ins
