# ASINU Lite (Expo Router)

Status: FREEZE (RC-ready). Backend reactivation pending.

## Overview
- Mobile health tracking app for chronic care (diabetes-focused) daily logging.
- Target users: people tracking blood glucose, blood pressure, weight, water intake.

## Feature inventory (current state)

### Implemented & stable (UI-ready)
- Core navigation and tab shell (Home, Missions, Tree, Profile, Settings).
- Home dashboard UI (summary cards, missions preview, tree summary, recent logs list).
- Tree / Health Overview UI (score ring, chart section, metric cards).
- Profile hub and Settings UI (account overview, settings toggles, compliance buttons).
- Visual assets: PNG tab icons + mascot sticker.

### Partial / stubbed
- Auth: phone + OTP flow exists; dev bypass supported; backend verification not active.
- Health logs: UI forms exist for glucose, blood pressure, weight, water (plus meal/medication/insulin). Remote sync is disabled; fallback data is used.
- Missions: uses fallback data; completion attempts remote call.
- Tree data: fallback summary/history when remote fetch is disabled.
- Delete Account: compliance UI stub (confirmation only, no backend call).
- AI Chat: UI exists (ChatModal and /ai-chat), but backend endpoint is not active.

### Not implemented yet
- AI Chat backend + LLM integration.
- Real health scoring algorithm and medical validation.
- Trend analytics beyond demo/fallback.
- Wearable/device sync.

## Tech stack snapshot
- Mobile: Expo + React Native + Expo Router + TypeScript.
- State: Zustand stores in `src/features/` (auth, logs, missions, tree, profile, app-config flags, chat).
- Backend: `env.apiBaseUrl` currently `https://asinu.top`, mobile endpoints under `/api/mobile/*`. Health check endpoints documented in `docs/context/TECH_RULES.md` (e.g., `/api/healthz`).
- Assets: PNG tab icons at `src/assets/tab-icons/*.png`; mascot PNG at `assets/asinu_chat_sticker.png` used by `src/components/AsinuChatSticker.tsx`.

## Repo structure snapshot
```
app/
  _layout.tsx           // Providers + stack shell
  index.tsx             // Splash/bootstrap
  (tabs)/               // Bottom tabs (home, missions, tree, profile)
  logs/                 // Standalone log forms
  login/                // Auth screens
  settings/             // Settings + logout
  legal/                // Legal content screens
src/
  components/           // Buttons, inputs, cards, list items, FAB, chat modal
  ui-kit/               // UI kit components
  features/             // auth, logs, missions, tree, profile, chat, flags
  lib/                  // api client, env, storage, navigation helpers
  providers/            // Session + React Query providers
  styles/               // Theme tokens
assets/
  asinu_chat_sticker.png
```

## Operational notes
- Env flags:
  - `EXPO_PUBLIC_DEV_BYPASS_AUTH=1` (bypass auth with mock profile).
  - `EXPO_PUBLIC_DISABLE_CHARTS=1` (disable charts).
  - `EXPO_PUBLIC_SHOW_MASCOT=true` (show mascot sticker).
- Demo account credentials: `demo@asinu.health` / `password`.
- Several stores disable remote fetch via internal flags and rely on fallback data.

## Deferred to version 2
- AI Chat backend + LLM integration.
- Real health scoring algorithm for Tree/Health score.
- Advanced trend analytics and reports.
- Wearable/device sync.
- Medical-grade validation/compliance.

## Versioning
- Current: v0.9.x (Preview / RC).
- Next planned: v1.0 (backend + AI reactivation).
