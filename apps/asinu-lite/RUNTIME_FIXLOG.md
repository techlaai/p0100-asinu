# ASINU Lite Runtime Fix Log

- 2025-11-27: Prevented expo-router crash ("Attempted to navigate before mounting the Root Layout") by waiting for `useRootNavigationState` and deferring redirects with `InteractionManager.runAfterInteractions` in `app/index.tsx`; kept existing auth redirect logic intact.
