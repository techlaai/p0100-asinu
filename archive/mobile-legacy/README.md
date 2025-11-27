# Asinu Expo Template

Expo Router + TypeScript template that recreates the dashboard/drawer/chat flow from the reference Flutter project using the Asinu UI Kit.

## Stack
- Expo 51 + React Native 0.74 + Expo Router
- Asinu UI Kit in `src/ui` (MetricCard, TrendChart, ProgressRing, LogListItem, ResourceCard, PillTag, SectionHeader, TimelineStepper, DrawerLayout, FormScreenLayout, AiChatLayout)
- Contract-driven screens under `src/features` map 1:1 với `docs/ASINU_MOBILE_CONTRACTS.md` (các demo cũ vẫn còn để tham khảo UI).

## Project structure
```
app/          Expo Router routes (drawer + tabs + modals)
src/
  features/   Contract placeholders + legacy demo screens that consume the UI kit
  ui/         Asinu UI Kit (theme, components, layouts)
  lib/        Hooks + utilities (formatters, mobile API client/hooks)
```

### Contract-driven scaffold (Nov 2025)
- `src/features/mobile/screenRegistry.ts` enumerates every P0 screen contract từ `docs/ASINU_MOBILE_CONTRACTS.md`.
- `src/lib/api/mobileClient.ts` đọc `EXPO_PUBLIC_MOBILE_API_BASE_URL` (mặc định `http://localhost:3000`) + hook `useMobileEndpoint` cho mọi màn.
- Tabs nay là Home/Missions/Tree/Rewards/Family/Profile; Drawer gồm Donate, Settings, Offline và stack routes detail.

### Screens & demo flows
| Screen | Path | Purpose | Primary UI kit pieces |
| --- | --- | --- | --- |
| HomeDashboardScreen | `src/features/home/screens/HomeDashboardScreen.tsx` | Shows hero metrics, trackers, and resources just like the Flutter home dashboard. | MetricCard, TrendChart, ProgressRing, ResourceCard, SectionHeader, PillTag |
| WellnessScreen | `src/features/wellness/screens/WellnessScreen.tsx` | Secondary tab to illustrate stacked cards and trackers. | MetricCard, TimelineStepper |
| LogsScreen | `src/features/history/screens/LogsScreen.tsx` | Lists log/history entries with filters. | LogListItem, PillTag, SectionHeader |
| SessionDetailScreen | `src/features/history/screens/SessionDetailScreen.tsx` | Detail/timeline page for a selected log item. | TimelineStepper, MetricCard |
| AuthScreen | `src/features/auth/screens/AuthScreen.tsx` | Mock auth form using generic copy. | FormScreenLayout, PillTag |
| AiChatScreen | `src/features/aiChat/screens/AiChatScreen.tsx` | Chat UI mock replicating assistant bubble layout. | AiChatLayout, PillTag |

Bạn có thể thay thế dần toàn bộ `src/features` bằng logic thật; `src/ui` vẫn là nơi chứa UI kit chuẩn.

## Usage guide
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Start the Expo development server**
   ```bash
   npm run start
   ```
   Use `i`, `a`, or `w` in the CLI to open iOS Simulator, Android emulator, or web.
3. **Configure API base URL** by setting `EXPO_PUBLIC_MOBILE_API_BASE_URL` (Expo public env). Without it, requests hit `http://localhost:3000`.
4. **Wire real features** by replacing the contract placeholders inside `src/features` with production logic; keep UI kit imports intact.

## Files that influence layout & styling
- `src/ui/theme/colors.ts`, `spacing.ts`, `typography.ts`: update these tokens to shift the entire design system.
- `src/ui/components/*.tsx`: adjust card/list/chart presentation globally.
- `src/ui/layouts/*.tsx`: change the Drawer, Auth form, or Chat shell structure.
- `src/app/**/*.tsx`: tweak navigation (drawer/tabs/modals) or add/remove routes.
- `src/features/**/*.tsx`: modify how mock data is mapped to UI kit components.

## Notes & best practices
- The UI kit expects neutral text/labels; pass domain-specific copy via props or data files.
- Keep shared layout logic inside `src/ui` so future product screens can reuse the same components.
- Legacy demo components (`src/features/*/screens/*Legacy.tsx`) mang dữ liệu giả phục vụ UI; thay bằng data/IDs thật khi backend sẵn sàng.
- When adding new screens, prefer composing UI kit components rather than recreating layout logic to maintain consistency.
- No network/LLM dependencies are included—if you introduce them, keep them scoped to feature modules so the kit stays template-friendly.
