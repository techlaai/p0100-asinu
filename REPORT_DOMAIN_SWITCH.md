# Domain Switch Report — diabot → asinu

## A. Files Updated
- `.env.example` — add public API and AI gateway defaults for `asinu` domains.
- `.env.local.example` — append `NEXT_PUBLIC_API_URL` and `AI_GATEWAY_URL` placeholders for `https://asinu.top` / `https://api.asinu.top`.
- `README.md` — update branding text and clone instructions to "ASINU".
- `README_CLOUDOPS.md` — align CloudOps copy and agent references with Asinu branding.
- `app.manifest.json` — refresh app name/description for Asinu CloudOps.
- `package.json` — rename package to `asinu`.
- `packages/ai/src/policies/safety.ts` — update assistant safety prompt to "Asinu".
- `src/app/*` legal & about pages — replace `diabot.top` links/emails and on-page branding with Asinu equivalents.
- `src/app/api/{health,export}/route.ts`, `src/app/profile/ExportProfileButton.tsx`, `src/app/auth/register/page.tsx` — align service IDs, filenames, and phone-email alias domain to `asinu`.
- `src/interfaces/ui/components/FloatingAIBtn.tsx`, `src/interfaces/ui/screens/Dashboard.tsx` — point hero art to `/assets/asinu.png`.
- `ops/healthcheck.sh`, `qa_staging_manual.sh`, `scripts/{create-release-tag,verify-deployment}.sh` — adjust URLs, log paths, and banner text for Asinu.
- `agents/asinu_ai.agent.json`, `agents/asinu_ops.agent.json` — renamed from `diabot_*.agent.json` with updated display names/descriptions.
- `public/assets/asinu.png`, `public/assets/mascot/asinu-*.png` — renamed from `diabot` asset filenames (no pixel changes).
- `scripts/smoke-domain-check.mjs` — new helper for env/domain smoke probe.
- `report_artifacts/*` — contains grep scan plus command outputs (npm install, dev run, env echo, smoke probe).

> _Line counts per file available via `git diff --stat` in commit history._

## B. ENV & Host Diff
```diff
#.env.example
+# Added defaults for public endpoints
+NEXT_PUBLIC_API_URL=https://asinu.top
+AI_GATEWAY_URL=https://api.asinu.top

#.env.local.example
+# Appended public endpoint overrides
+NEXT_PUBLIC_API_URL=https://asinu.top
+AI_GATEWAY_URL=https://api.asinu.top
```

## C. Smoke Test
| Command | Result | Notes |
| --- | --- | --- |
| `npm ci` | ❌ (npm internal error / proxy rename conflicts) | See `report_artifacts/npm_install.log` for full trace. Node 22 in sandbox triggers `npm` ENOTEMPTY & "Exit handler never called" errors while fetching via MITM proxy. |
| `npm run dev --silent` | ❌ (`next` binary missing) | Dependency install failed, so Next.js CLI absent. Output in `report_artifacts/npm_dev.log`. |
| `node -e "console.log(process.env.NEXT_PUBLIC_API_URL, process.env.AI_GATEWAY_URL)"` | ✅ | Logged `undefined undefined` because env not exported locally; stored in `report_artifacts/env_echo.log`. |
| `node scripts/smoke-domain-check.mjs` | ✅ | Confirms env unset and skips HEAD probes; output in `report_artifacts/smoke_ai.txt`. |

_All commands executed from repo root on branch `chore/domain-switch-asinu`._

## D. Risks & Deployment Notes
- **CORS / SSL:** ensure new `https://asinu.top` and `https://api.asinu.top` endpoints present matching TLS certs and update backend CORS allowlists; fallback to `diabot` hosts is no longer referenced.
- **Client caches:** rename of static assets (`/assets/asinu*.png`) may require CDN cache purge.
- **Operational scripts:** container/image names still carry `diabot` identifiers (per freeze, left untouched). Coordinate follow-up if infra moves to `asinu` namespaces.
- **Caddy guidance:**
  ```caddyfile
  asinu.top, www.asinu.top {
      reverse_proxy 127.0.0.1:3000
  }
  ```
  Apply on VPS once DNS is switched, then reload Caddy.
