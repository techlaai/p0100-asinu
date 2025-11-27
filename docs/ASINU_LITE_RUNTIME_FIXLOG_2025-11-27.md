# ASINU Lite Runtime Fix Log (2025-11-27)

## Runtime issues encountered
- **Registry access blocked**: `npm install` fails with `403 Forbidden` when fetching packages (e.g., `@babel/core`, `expo`), preventing a fresh dependency install inside `apps/asinu-lite`.
- **Expo startup blocked**: `npx expo start --clear --web` cannot download Expo binaries because the registry is inaccessible in this environment.

## Resolutions attempted
- Retried install/start commands with `--clear`; all attempts still blocked by the registry restriction.
- Relied on repository-level toolchain (shared ESLint) to run lint checks even without local `node_modules` in `apps/asinu-lite`.

## Verification snapshot
- `npm run lint` (pass).
- `npx expo start --clear --web` (blocked by registry).

## Follow-up recommendations
- Re-run dependency installation and Expo startup on a network that can reach `registry.npmjs.org`.
- Once dependencies are installed, rerun the full UI flow (Home ↔ Logs ↔ Missions ↔ Tree ↔ Profile ↔ Settings) with `EXPO_PUBLIC_DEV_BYPASS_AUTH=1`.

## Commit reference
- Pending current branch updates after syncing the above notes.
