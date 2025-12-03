# Theme Audit – ASINU Lite (Nov 2025)

## A. Đang dùng theme đúng chuẩn
- `src/styles/theme.ts` exported via `src/styles/index.ts`; `colors`, `spacing`, `radius`, `typography`.
- App shell & auth: `app/_layout.tsx`, `app/index.tsx`, `app/login/index.tsx`, `app/settings/index.tsx` (content/background, StatusBar, text).
- Tabs: `app/(tabs)/_layout.tsx` (tabBarActiveTintColor/background/border).
- Home: `app/(tabs)/home/index.tsx` (cards, tree stats, logs, hero uses `H2HeroBanner` gradient with `colors.primary/secondary`).
- Missions / Tree / Profile: `app/(tabs)/missions/index.tsx`, `app/(tabs)/tree/index.tsx`, `app/(tabs)/profile/index.tsx` (cards, text, borders).
- Logs screens: `app/logs/glucose.tsx`, `app/logs/blood-pressure.tsx`, `app/logs/medication.tsx` (backgrounds).
- Shared components using theme: `src/components/Button.tsx` (primary/secondary/ghost), `FloatingActionButton`, `TextInput`, `ListItem`, `Card`, `Avatar`, `SectionHeader`, `H1SectionHeader`, `H2HeroBanner`, `M1MetricCard`, `T1ProgressRing`, `C1TrendChart`, `F1ProfileSummary`.

## B. Đang hard-code màu (cần refactor/để ý)
- Legacy template (not used by main app):  
  - `src/template/legacy-ui/demo/demoData.ts` (accentColor hex).  
  - `src/template/legacy-ui/app/index.tsx` (`#f5f5f5` background).  
  - `src/template/legacy-ui/features/auth/screens/AuthScreen.tsx` (`#f1f0fb` background).  
  - `src/template/legacy-ui/ui/components/MetricCard.tsx` gradient includes `#6f6bff`.  
  - `src/template/legacy-ui/ui/theme/colors.ts` duplicates palette with hex literals.
- Theme definitions themselves (`src/styles/theme.ts`) contain hex constants by design.

## Refactor actions done
- `src/ui-kit/M1MetricCard.tsx`: gradient now uses `colors.accent` instead of hard-coded `#6f6bff`.
- Confirmed hero gradient (`H2HeroBanner`), primary buttons, bottom tabs already consume `colors.primary/secondary`.
