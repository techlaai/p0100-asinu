# ASINU Lite E2E Report (2025-11-27)

## Flows attempted
- Planned path: Splash bootstrap → dev bypass login → Home dashboard → Logs (quick entry) → FAB entry → Missions optimistic toggle → Tree view → Profile → Settings logout.
- Actual run: Blocked at Expo startup because registry access is forbidden (`npx expo start --clear --web` cannot download Expo packages), so interactive navigation could not proceed in this environment.

## Current stability (static)
- Static code structure aligns with the template and guards missing data in auth, missions, logs, tree, profile, and settings flows.
- Linting succeeds via shared workspace tooling; runtime validation is pending a successful Expo boot with real dependencies.

## Recommendations
- Install dependencies on a network that can reach `registry.npmjs.org`, then run `npx expo start --clear --web` (or native targets) with `EXPO_PUBLIC_DEV_BYPASS_AUTH=1` to verify the full flow.
- After dependencies resolve, capture tab-by-tab screenshots to confirm layout parity with the template and exercise optimistic mission updates plus log submissions.

## How to run locally
1. From repo root: `cd apps/asinu-lite`.
2. Install deps: `npm install` (requires internet/registry access).
3. Start preview: `npx expo start --clear --web` (or omit `--web` for device). Set `EXPO_PUBLIC_DEV_BYPASS_AUTH=1` to skip login during testing.
4. Navigate through Home → Logs (including FAB quick log) → Missions → Tree → Profile → Settings → Logout.
