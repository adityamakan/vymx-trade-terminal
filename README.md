# 📈 Vymx Trade Terminal

> Cross-border market analytics terminal and multi-asset trading simulator powered by Vite, React, Node.js, Express, and Google Gemini AI.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)

---

## 🌟 Overview

**Vymx Trade Terminal** is a full-stack financial workspace engineered for real-time cross-border market analytics and multi-asset trading simulations. It combines quantitative risk modeling with AI-driven analytics across equities, cryptocurrencies, foreign exchange, and fixed-income assets.

---

## 🚀 Key Features

* **Multi-Asset Live Tracking:** Real-time tracking for stocks, crypto, forex, and bonds with multi-currency localized support.
* **Quantitative Risk Math:** Client-side financial risk analytics including Value at Risk (VaR), Pearson correlation coefficient ($r$), and asset volatility metrics.
* **AI Market Assistant:** Integrated Google Gemini AI chat interface providing automated technical analysis and portfolio risk feedback.
* **3D Visualizations:** Financial charts and interactive graphics rendered via Three.js and React Three Fiber.
* **Local Tax Auditing:** Localized tax calculation models and transaction audit logs.
* **Production Architecture:** Express backend proxy equipped with LRU caching, rate limiting, and security header enforcement.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Three.js |
| **Backend** | Node.js, Express, Helmet, Express Rate Limit, esbuild |
| **AI Integration** | Google Gemini API (`@google/genai`) |
| **Tooling** | TSX, PostCSS, Autoprefixer |

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
