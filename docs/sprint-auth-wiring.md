# Sprint Auth Wiring – Notes (2025-11-05)

_Last updated: 2025-11-04 15:15 UTC+7_

## Goal Overview
- All `/api/**` routes derive `user_id` exclusively from session cookie (Edge-safe WebCrypto helper).
- Error Contract v1 everywhere:
  - Success ⇒ `200`/`201` with `{ ok: true, data, request_id }`
  - Errors ⇒ `${status}` with `{ ok: false, code, message, request_id }`
- Every response includes `X-Request-Id` header; mutating routes add `Cache-Control: no-store`.
- API guards never redirect; missing session ⇒ `401` JSON.
- Client fetches go through a single wrapper `lib/http.ts`, `credentials: "include"`, and parse Error Contract v1.

## P0 – Foundation (shared)
- [ ] `auth/session.ts`: add Edge-compatible verifier (Web Crypto) returning `{ user_id } | null`.
- [ ] `logging/request_id.ts`: generate / propagate request IDs per request.
- [ ] `http/response.ts`: helpers to build success/error responses, attach headers (request_id, cache-control).
- [ ] `errors/codes.ts`: central enum/map for codes (`UNAUTHORIZED`, `VALIDATION_ERROR`, `DB_UNAVAILABLE`, …).
- [ ] `lib/http.ts` (client): wrapper around `fetch` (same-origin, `credentials:"include"`), parse `{ ok, code, message }`.
- Deliverable: PR “foundation”, run `QA_SMOKE.md` basic subset (healthz, login, /api/auth/session).

## P1 – Dashboard-critical APIs
### Modules (each must use session + Error Contract v1)
1. `src/app/api/profile/*`
2. `src/app/api/log/bg/route.ts`
3. `src/app/api/log/insulin/route.ts`
4. `src/app/api/meal/*`
5. `src/app/api/chart/*`

### Requirements per route
- Session cookie only (no `x-user-id` headers / allowlists).
- Input validation ⇒ 422 (`VALIDATION_ERROR`).
- Missing session ⇒ 401 (`UNAUTHORIZED`).
- Responses via P0 helpers (include `request_id`).
- `POST`/`PUT`/`DELETE` ⇒ `Cache-Control: no-store`.
- Deliverable: PRs per module (or single PR, but clearly segmented). After merge, rerun `QA_SMOKE.md`.

## P2 – Session & Guard Alignment
- [ ] `/api/auth/session`: 200 when session exists (with `{ ok:true,data:{…},request_id }`), 401 otherwise. Add `Cache-Control: no-store`.
- [ ] `middleware.ts`: guard routing only (no JSON), already WebCrypto-ready.
- [ ] Confirm same-origin CORS (if any cross-origin call, set `Allow-Origin: https://asinu.top`, `Allow-Credentials: true`).

## P3 – Client Wiring
- [ ] Replace all direct `fetch`/axios calls in dashboard/profile/learn/chart/forms with `lib/http.ts` wrapper.
- [ ] Remove `/api/auth/me` usage; use `/api/auth/session`.
- [ ] Surface errors via `code`/`message` from Error Contract v1 (no generic “Failed to fetch”).

## Acceptance Tests (log to capture post-refactor)
_After P1+P2+P3 completed, gather evidence for each case (status, X-Request-Id, body snippet)._ 

### A. Guard & Session
- [ ] Incognito `GET /dashboard|/profile|/learn|/chart` ⇒ `302 /auth/login?next=…`
- [ ] After login: `GET /api/auth/session` ⇒ 200, `cache-control: no-store`.
- [ ] Remove cookie: `GET /dashboard` ⇒ 302.

### B. Log Blood Glucose (`POST /api/log/bg`)
- [ ] Valid payload ⇒ 201 `{ ok:true,data:{id,…},request_id }`
- [ ] No session ⇒ 401 `{ ok:false,code:"UNAUTHORIZED",… }`
- [ ] Invalid payload ⇒ 422 `{ ok:false,code:"VALIDATION_ERROR",… }`

### C. Log Insulin (`POST /api/log/insulin`)
- Same three scenarios (201 / 401 / 422).

### D. Read APIs
- [ ] `GET /api/chart/...` ⇒ 200 `{ ok:true,data:{series…},request_id }`
- [ ] `GET /api/meal/...` ⇒ 200 `{ ok:true,data,… }`
- [ ] `GET /api/profile` ⇒ 200 `{ ok:true,data,… }`

### E. Headers & Request IDs
- Confirm each sampled response includes `X-Request-Id` and correct status.

### F. API Unauthorized Behavior
- [ ] Any protected API without session ⇒ 401 JSON (no 302).

## Notes / Open Questions
- No DB schema changes allowed.
- No UI `.tsx` modifications except swapping to `lib/http.ts`.
- No compatibility shims (do not forward `x-user-id`).
- If any endpoint requires path change, call it out before implementation.

## Next Session Starting Point
1. Implement P0 foundation utilities.
2. Update `/api/auth/session` using new helpers.
3. Tackle modules in P1 sequentially.
4. After each PR → run QA smoke subset, capture logs.
5. Once APIs stable, refactor client fetches (P3) and gather final A–F logs.

