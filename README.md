# 🎮 GameTracker

> A modern, full-featured video game library, backlog manager, and PlayStation Network (PSN) analytics dashboard built with Angular 21 Signals and Node.js.

[![Angular](https://img.shields.io/badge/Angular-21.2-dd0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-24-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

---

## 🌟 Overview

**GameTracker** is an all-in-one gaming web application designed for passionate gamers who want to track, manage, and analyze their entire gaming journey across platforms. Seamlessly bridging manual tracking with live **PlayStation Network (PSN)** synchronization, GameTracker captures trophies, playtime, completion percentages, ratings, and account metadata in a sleek, dark-themed dashboard interface.

---

## ✨ Features

### 🎮 Unified Game Library
- **Status Lifecycle Tracking**: Categorize games by `Playing`, `Completed`, `Backlog`, `On Hold`, `Dropped`, and `Wishlist`.
- **Custom Metadata**: Cover art, title, studio developer, release year, genre tags, platforms, ratings (1–5 stars), and personal gameplay notes.
- **Progress & Playtime**: Interactive progress sliders (0–100%) and precise decimal playtime tracking (`hoursPlayed`).
- **Flexible Views & Filters**: Real-time title search, multi-criteria filters (Platform, Genre, Status, Sort by Playtime/Rating/Date), and Grid vs. List view toggles.

### 🌐 Live PlayStation Network Integration
- **Zero-Password Secure Auth**: Connects securely via Sony NPSSO session tokens with persistent session disk caching.
- **Trophy Synchronization**: Live trophy stats (🏆 Platinum, 🥇 Gold, 🥈 Silver, 🥉 Bronze), level progression, and detailed game trophy lists.
- **Automated Playtime Extraction**: Queries PSN user played titles, converting ISO-8601 duration strings (`PT#H#M`) into precise decimal hours with intelligent fuzzy-title matching.
- **One-Click Library Import**: Sync individual PlayStation titles or batch-import your entire PS4/PS5 library directly into GameTracker with automatic status mapping.

### 📊 In-Depth Analytics & Statistics
- **6-Metric Overview Cards**: Instant visibility into Total Games, Currently Playing, Completed, Backlog, Total Hours Played, and Average Rating.
- **Playtime Metrics**: Total hours, average hours per title, and equivalent days played with single-decimal formatting (preventing floating-point drift).
- **Visual Distributions**: Status breakdown charts, rating distribution frequency, and platform allocation breakdown.

### 🧭 Sleek, Modern Web App UI
- **Hover-Expand Navigation Sidebar**: Collapses to an unobtrusive 72px icon-only bar and smoothly expands to 260px on hover.
- **Symmetric Centered Layout**: Responsive CSS Grid design optimized for widescreen displays up to 1600px with no awkward left-docking.
- **Personal Account Popup**: Click the sidebar avatar to inspect authenticated account identity details:
  - 👤 Full Name (First & Last)
  - 🎮 PlayStation Online ID
  - 🆔 PlayStation Account ID
  - 🎂 Date of Birth & Age
  - 🌍 Country / Region & Locale
  - ⭐ PlayStation Plus Status

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Angular 21](https://angular.dev/) (Standalone Components, Signals, Computed Signals, Control Flow `@if` / `@for`)
- **State Management**: Reactive Angular Signals (`signal`, `computed`) with `localStorage` persistence
- **Styling**: SCSS with CSS Grid, Flexbox, glassmorphism card aesthetics, and responsive media queries
- **HTTP**: Angular `HttpClient` with RxJS `firstValueFrom`

### Backend Proxy
- **Runtime**: [Node.js](https://nodejs.org) (ES Modules)
- **Framework**: [Express.js](https://expressjs.com/) with CORS middleware
- **PSN Client**: [`psn-api`](https://github.com/acharnen/psn-api) for official PlayStation Network API integration
- **Token Persistence**: File-based session cache with disk validation and auto-refresh

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.x or v20.x+)
- **npm** (v9.x or v10.x+)
- **Angular CLI** (optional, installed globally: `npm install -g @angular/cli`)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/rahuldevpradhan99/game-tracker.git
   cd game-tracker
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the backend proxy server**:
   ```bash
   node server/index.mjs
   ```
   *The proxy starts on `http://localhost:3001`.*

4. **Start the Angular development server**:
   ```bash
   npx ng serve
   ```
   *Open your browser and navigate to `http://localhost:4200`.*

---

## 🔑 How to Connect PlayStation Network

1. Sign in to your PlayStation account at [my.playstation.com](https://my.playstation.com).
2. Visit [https://ca.account.sony.com/api/v1/ssocookie](https://ca.account.sony.com/api/v1/ssocookie) in the same browser.
3. Copy the 64-character `npsso` string from the JSON response:
   ```json
   { "npsso": "your_64_character_token_here" }
   ```
4. In GameTracker, open the **PlayStation** tab and paste your token to instantly authenticate and import your library!

---

## 🗺️ Project Structure

```
game-tracker/
├── server/                    # Node.js / Express proxy server
│   └── index.mjs              # PSN API routes, duration parser & auth cache
├── src/
│   ├── app/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── game-card/     # Game card with cover, status & hours
│   │   │   ├── sidebar/       # Collapsible hover sidebar & user profile popup
│   │   │   └── stats-card/    # Metric summary card
│   │   ├── models/            # TypeScript data contracts
│   │   │   ├── game.model.ts  # Game entity & status configurations
│   │   │   └── psn.model.ts   # PSN profile, title & trophy types
│   │   ├── pages/             # Routed page views
│   │   │   ├── dashboard/     # Summary metrics & currently playing
│   │   │   ├── library/       # Filterable games grid & list view
│   │   │   ├── add-game/      # Manual game entry & cover preview form
│   │   │   ├── game-detail/   # Game details, editor & session history
│   │   │   ├── playstation/   # PSN Hub, live sync, trophy modal & playtime
│   │   │   └── stats/         # Detailed charts, completion rates & breakdown
│   │   ├── services/          # State & business logic
│   │   │   ├── game.service.ts # Core game tracker state & calculations
│   │   │   └── psn.service.ts  # PSN HTTP communication layer
│   │   ├── app.config.ts      # Angular application routing & providers
│   │   ├── app.routes.ts      # Application route definitions
│   │   └── app.ts             # App root layout with responsive container
│   ├── styles.scss            # Global styles, variables & animations
│   └── index.html             # Application entry HTML
├── angular.json               # Angular workspace configuration
├── package.json               # Dependencies & scripts
└── tsconfig.json              # TypeScript compilation settings
```

---

## 🔮 Future Enhancements Roadmap

We are actively working on expanding GameTracker into a comprehensive, multi-ecosystem gaming platform. Key upcoming milestones:

### 🤖 1. AI Gaming Assistant & Chatbot
- **Interactive Conversational AI**: Integrated assistant embedded into the sidebar to answer questions about your gaming backlog (e.g. *"What unplayed RPG under 20 hours should I start this weekend?"*).
- **Trophy & Achievement Guides**: AI-powered strategy guides and trophy tips directly within the game detail view.
- **Smart Playtime Predictions**: Machine learning estimations for "Time to Beat" tailored to your personal playstyle and historical pacing.

### 🎮 2. Multi-Platform Ecosystem Integrations
- **Steam Integration**: OAuth / Web API synchronization for Steam libraries, playtime, achievements, and Steam Deck verification badges.
- **Xbox Live Integration**: Microsoft Graph / Xbox API connectivity for Gamerscore, Xbox One / Series X|S titles, and Game Pass library tracking.
- **Nintendo Account / Switch**: Switch gameplay logs and friend activity aggregator.
- **Epic Games Store & GOG Galaxy**: Cross-library synchronization across all PC launchers.

### 🏆 3. Cross-Platform Unified Gamer Profile
- **Global Gamer Level & Cross-Platform Achievements**: Combine PSN Trophies, Steam Achievements, and Xbox Gamerscore into a single unified gamer level.
- **Community Leaderboards & Social Profiles**: Shareable public gamer cards, profiles, and challenge leaderboards with friends.

### ☁️ 4. Cloud Persistence & Progressive Web App (PWA)
- **Cloud Database Sync**: Seamless authentication with Firebase / Supabase for real-time synchronization across desktop, tablet, and mobile.
- **PWA Offline Support**: Installable desktop & mobile experience with local caching and offline editing.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👨‍💻 Author

**Rahul Dev Pradhan**
- GitHub: [@rahuldevpradhan99](https://github.com/rahuldevpradhan99)
- Email: rahuldevpradhan99@gmail.com
