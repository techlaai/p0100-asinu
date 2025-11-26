# Asinu Expo Template

Expo Router + TypeScript template that recreates the dashboard/drawer/chat flow from the reference Flutter project using the Asinu UI Kit.

## Stack
- Expo 51 + React Native 0.74 + Expo Router
- Asinu UI Kit in `src/ui` (MetricCard, TrendChart, ProgressRing, LogListItem, ResourceCard, PillTag, SectionHeader, TimelineStepper, DrawerLayout, FormScreenLayout, AiChatLayout)
- Demo screens under `src/features` consume data from `src/demo/demoData.ts`

## Project structure
```
src/
  app/         Expo Router routes (drawer + tabs + modals)
  features/    Demo feature screens that consume the UI kit
  ui/          Asinu UI Kit (theme, components, layouts)
  demo/        Mock data store
  lib/         Hooks + utilities (formatters, demo data hooks)
```

### Screens & demo flows
| Screen | Path | Purpose | Primary UI kit pieces |
| --- | --- | --- | --- |
| HomeDashboardScreen | `src/features/home/screens/HomeDashboardScreen.tsx` | Shows hero metrics, trackers, and resources just like the Flutter home dashboard. | MetricCard, TrendChart, ProgressRing, ResourceCard, SectionHeader, PillTag |
| WellnessScreen | `src/features/wellness/screens/WellnessScreen.tsx` | Secondary tab to illustrate stacked cards and trackers. | MetricCard, TimelineStepper |
| LogsScreen | `src/features/history/screens/LogsScreen.tsx` | Lists log/history entries with filters. | LogListItem, PillTag, SectionHeader |
| SessionDetailScreen | `src/features/history/screens/SessionDetailScreen.tsx` | Detail/timeline page for a selected log item. | TimelineStepper, MetricCard |
| AuthScreen | `src/features/auth/screens/AuthScreen.tsx` | Mock auth form using generic copy. | FormScreenLayout, PillTag |
| AiChatScreen | `src/features/aiChat/screens/AiChatScreen.tsx` | Chat UI mock replicating assistant bubble layout. | AiChatLayout, PillTag |

You can delete the entire `src/features` folder (and `src/demo`) and build your own flows; `src/ui` remains the source of truth for shared UI.

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
3. **Customize data** by editing `src/demo/demoData.ts` or swapping in API calls within each feature screen.
4. **Wire real features** by replacing demo screens inside `src/features` with production logic, keeping UI kit imports intact.

## Files that influence layout & styling
- `src/ui/theme/colors.ts`, `spacing.ts`, `typography.ts`: update these tokens to shift the entire design system.
- `src/ui/components/*.tsx`: adjust card/list/chart presentation globally.
- `src/ui/layouts/*.tsx`: change the Drawer, Auth form, or Chat shell structure.
- `src/app/**/*.tsx`: tweak navigation (drawer/tabs/modals) or add/remove routes.
- `src/features/**/*.tsx`: modify how mock data is mapped to UI kit components.

## Notes & best practices
- The UI kit expects neutral text/labels; pass domain-specific copy via props or data files.
- Keep shared layout logic inside `src/ui` so future product screens can reuse the same components.
- Demo data is intentionally generic (`metric1`, `tracker1`, etc.); replace with domain IDs as soon as real data exists.
- When adding new screens, prefer composing UI kit components rather than recreating layout logic to maintain consistency.
- No network/LLM dependencies are included—if you introduce them, keep them scoped to feature modules so the kit stays template-friendly.
