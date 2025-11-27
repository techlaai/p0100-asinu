# Asinu Mobile Template TODO

## STEP 1 — Dependencies ✅
- `npm install` completed inside `apps/mobile` (see `package-lock.json` + `node_modules/`). Expo CLI + lint tooling now run locally without jumping back to repo root.

## STEP 2 — Screen Contracts (P0)
Contract source: `docs/ASINU_MOBILE_CONTRACTS.md`. Metadata được sync trong `src/features/mobile/screenRegistry.ts`. Status legend → `[x] wired`, `[ ] pending`.

### Auth & Shell
- [x] `splash` (`src/features/shell/screens/SplashScreen.tsx`) — APIs: `/api/mobile/session`, `/api/mobile/app-config` — Nav: `/` → `/home` or `/auth/login` — State: loading, destination, feature flags.
- [x] `auth_login` (`src/features/auth/screens/AuthLoginScreen.tsx`) — APIs: `/api/mobile/auth/login`, `/api/mobile/auth/config` — Nav: `/auth/login` → `/auth/otp`, `/legal/terms`, `/home` — State: form inputs, validation, submit status.
- [x] `auth_otp` (`src/features/auth/screens/AuthOtpScreen.tsx`) — APIs: `/api/mobile/auth/otp/send`, `/api/mobile/auth/otp/verify` — Nav: `/auth/otp` → `/home`, `/onboarding/profile`, back to login — State: phone, otp, resend cooldown, verify status.
- [x] `onboarding_profile` (`src/features/onboarding/screens/OnboardingProfileScreen.tsx`) — APIs: `/api/mobile/profile/template`, `/api/mobile/profile` — Nav: `/onboarding/profile` → `/home` (save/skip) — State: form fields, avatar upload, validation errors.
- [x] `legal_terms` (`src/features/legal/screens/LegalTermsScreen.tsx`) — APIs: `/api/mobile/legal/terms` — Nav: `/legal/terms` → return/back/logout — State: markdown fetch, accept/decline.

### Core Tabs
- [x] `home_dashboard` — Component fetch `/api/mobile/dashboard`, CTA → missions/donate/tree/rewards.
- [x] `mission_today` — Checklist UI gọi `/api/mobile/missions/today`.
- [x] `mission_detail` — Detail + POST `/api/mobile/missions/checkin`.
- [x] `tree_overview` — Pull `/api/mobile/tree/state`, link `/tree/events`.
- [x] `rewards_overview` — Fetch catalog/balance, push detail route.
- [x] `reward_detail` — Fetch `/api/mobile/rewards/{id}` + redeem POST.
- [x] `donate_overview` — Summary view `/api/mobile/donate/summary` + CTA.
- [x] `donate_flow` — Intent form hitting `/api/mobile/donate/intent`.
- [x] `family_overview` — `/api/mobile/family` list + invite link.
- [x] `profile_overview` — `/api/mobile/profile` data, CTA settings.
- [x] `settings` — Toggles + logout POST `/api/mobile/auth/logout`.
- [x] `offline` — NetInfo probe + retry button.

### Action Items
1. Wire router segments so `(drawer)`/`(tabs)` load screen mới. ✅
2. Loại bỏ `src/demo`, dùng API hooks contract. ✅
3. Kết nối Dia Brain feature flags + mobile smoke. ✅ `/api/mobile/session` trả flags → `useMobileSession()` ẩn/hiện UI; bước tiếp theo là mở rộng smoke QA khi backend mobile ổn định.
