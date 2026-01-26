# Flags & Data Source Map (Core Lockdown)

## A) EXPO_PUBLIC_* flags inventory

| Flag | Purpose | Default | Where used | Prod-safe value |
| --- | --- | --- | --- | --- |
| `EXPO_PUBLIC_APP_ENV` | Chọn môi trường build (`dev`/`staging`/`prod`) để kiểm soát các tính năng dev-only. | `dev` (fallback khi thiếu biến) | `src/lib/appEnv.ts` | `prod` |
| `EXPO_PUBLIC_API_BASE_URL` | Base URL cho toàn bộ API của mobile. | `https://asinu.top` | `src/lib/env.ts` | `https://asinu.top` |
| `EXPO_PUBLIC_DEV_BYPASS_AUTH` | Bật bypass đăng nhập cho dev; bị khóa cứng nếu runtime production. | `false` | `src/lib/env.ts`, `src/lib/featureFlags.ts`, các store dùng `featureFlags.devBypassAuth` | `0` |
| `EXPO_PUBLIC_DISABLE_CHARTS` | Tắt render chart (fallback UI) trong dev/demo. | `false` | `src/lib/env.ts`, `src/lib/featureFlags.ts`, `src/ui-kit/T1ProgressRing.tsx`, `src/ui-kit/C1TrendChart.tsx` | `0` |
| `EXPO_PUBLIC_SHOW_MASCOT` | Hiển thị mascot sticker. | `false` | `src/lib/featureFlags.ts` | `false` |

## B) Data source map (module → API → fallback/flag)

### Auth / Profile
- **API:** `/api/mobile/auth/login`, `/api/auth/verify`, `/api/mobile/profile`, `/api/mobile/auth/logout`, `/api/auth/me`.  
  **Where:** `src/features/auth/auth.api.ts`.  
- **Fallback / flag:** Dev bypass uses `featureFlags.devBypassAuth` (and `__DEV__` block) to short-circuit auth; tokens stored via `tokenStore`.  
  **Where:** `src/features/auth/auth.store.ts`.

### Care Pulse
- **API:** `POST /api/mobile/logs` with `log_type=care_pulse`.  
  **Where:** `src/features/care-pulse/api/carePulse.api.ts`.  
- **Fallback / flag:** No fallback; state persisted locally via `AsyncStorage` in care pulse store.  
  **Where:** `src/features/care-pulse/store/carePulse.store.ts`.

### Logs (glucose/BP/weight/meds/meal/insulin/water)
- **API:** `GET/POST /api/mobile/logs`.  
  **Where:** `src/features/logs/logs.api.ts`.  
- **Fallback / flag:** Dev bypass returns local fallback list; otherwise uses cache with stale handling via `localCache`.  
  **Where:** `src/features/logs/logs.store.ts`.

### Missions
- **API:** `GET /api/mobile/missions`, `POST /api/mobile/missions/:id/complete`.  
  **Where:** `src/features/missions/missions.api.ts`.  
- **Fallback / flag:** Dev bypass returns fallback missions; otherwise uses cache + stale handling.  
  **Where:** `src/features/missions/missions.store.ts`.

### Tree / Health overview
- **API:** `GET /api/mobile/tree`, `GET /api/mobile/tree/history`.  
  **Where:** `src/features/tree/tree.api.ts`.  
- **Fallback / flag:** Dev bypass returns fallback summary/history; otherwise uses cache + stale handling.  
  **Where:** `src/features/tree/tree.store.ts`.

### Feature flags (remote)
- **API:** `GET /api/mobile/flags`.  
  **Where:** `src/features/app-config/flags.api.ts`.  
- **Fallback / flag:** Hard-disabled flags are merged in store; default flags used on error.  
  **Where:** `src/features/app-config/flags.store.ts`.

### AI Chat
- **API:** `POST /api/mobile/chat`.  
  **Where:** `src/features/chat/chat.api.ts`.  
- **Fallback / flag:** No local fallback; call is direct.
