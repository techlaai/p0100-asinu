# Outsource Safe Zone (UI-only)

## Allowed (UI-only)
- `src/features/care-pulse/components/PulseWidget.tsx`
- `src/features/care-pulse/components/PulsePopup.tsx`
- Static assets inside `assets/` and `src/assets/` (icons/images only)
- Copy updates to UI text labels **only when approved** by Tech Lead

## Strictly forbidden (core logic)
- Care Pulse engine/store/provider:
  - `src/features/care-pulse/engine/`
  - `src/features/care-pulse/store/`
  - `src/features/care-pulse/providers/`
  - `src/features/care-pulse/api/`
- Any global state, auth, logs, missions, tree:
  - `src/features/auth/`
  - `src/features/logs/`
  - `src/features/missions/`
  - `src/features/tree/`
- Backend logic or endpoints (not part of this repo)
- Theme system changes beyond **small semantic tokens** in `src/styles/theme.ts`

## Warning
⚠️ CORE LOGIC – DO NOT MODIFY WITHOUT TECH LEAD APPROVAL.

If any change touches core logic, stop and request approval first.
