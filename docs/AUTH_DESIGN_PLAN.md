# Self-Service Analytics — Authentication & Authorization Plan

> **Historical document.** This file records the original design adapted from `ccdWeb` / `ccdAPI`. For the **current** SSA implementation (routing, services, guards, and auth flow), see **[APP_STRUCTURE.md](../APP_STRUCTURE.md)**. SSA does not use auth bypass, mock login, or E2E test secrets.

---

## 1. Reference Architecture (what `ccdWeb` + `ccdAPI` do today)

**ccdWeb (Angular)**
- `AuthService` calls `token-auth/` for code-exchange, validate, refresh, websocket-token, profile update.
- `UserService` owns the `session_data` localStorage record (accessToken / refreshToken / expiresAt / globalGroups / lanId / fullName / email / department), checks expiry, refreshes silently, exposes role helpers (`isAdmin`, `isAppAdmin`, `isNCM`, `isECM`, `verifyRoles`).
- `AuthGuard.canActivate` ⇒ `combineLatest(isAuthenticated$, phaseCheck$)` ⇒ role check ⇒ if all pass `true`, else FSSO Okta redirect (`/oauth2/default/v1/authorize?client_id&state&nonce&scope&redirect_uri`).
- `UnauthGuard` ⇒ best-effort session restore on public routes.
- `AuthorizeComponent` ⇒ catches `?code=&state=` Okta callback, calls `AuthService.getAccessToken(code)`, then `updateUserProfile`, then `createSession`. In CCD, mock buttons are available under `authBypass` (not used in SSA).
- HTTP interceptors: `Url` (prefixes env API base), `Auth` (`Bearer <accessToken>` for everything except `unAuthenticatedAPI` allowlist e.g. `token-auth`), `Error` (401/403 ⇒ logout + redirect /login, retry-with-backoff up to 3), `Http` (mock router), `CacheControl` (`no-cache,no-store`).
- Per-stage env files (`environment.dev.ts`, `…test.ts`, `…prod.ts`, `…auth-bypass.ts` in CCD) carrying `fssoUrl`, `clientId`, `scope`, `fssoRedirectRoute`, `unAuthenticatedAPI`, `url`, `altUrl`, plus role constants.
- Routes wire `canActivate: [AuthGuard], data: { roles: ROLE_CONST }` per protected feature module.

**ccdAPI (Python)**
- `ccd_token_authorizer` lambda — public (`disable_auth: GET/OPTIONS/PATCH`) at `/ccd-api/token-auth`. Routes:
  - `auth_code` header ⇒ POST Okta `/token` (`grant_type=authorization_code`) ⇒ decode access+id JWT ⇒ build session JSON.
  - `Authorization: Bearer …` ⇒ `validate_access_token`.
  - `refresh_token` header ⇒ POST Okta `/token` (`grant_type=refresh_token`).
  - `func_name=get_websocket_token` ⇒ DynamoDB-issued short-lived token.
  - `func_name=update_user_profile` (PATCH) ⇒ upserts `hpp_usr_prof` Postgres row.
  - `x-e2e-test-secret` header ⇒ Cypress bypass (non-prod only; CCD only).
- `ccd_lambda_authorizer` — API Gateway TOKEN authorizer with per-endpoint `allowed_apis` matrix. `AUTH_BYPASS=true` short-circuits to allow (CCD only).
- Layer `common_ccd_auth`, `gg_authentication`, `serve.py` local runner — see [CCD_AUTH_AUTHORIZATION_WALKTHROUGH.md](./CCD_AUTH_AUTHORIZATION_WALKTHROUGH.md).

For the full CCD step-by-step walkthrough (including bypass modes), see that document. **Those bypass patterns are not implemented in SSA.**

---

## 2. Target System Layout (as built)

```
SelfServiceAnalytics/
├── jakshwealth-ui/        (Angular 21 — this repo)
└── jakshwealth-api/   (Python lambdas + Gunicorn local runner)
```

Both use a dedicated Okta tenant with an SSA client (`clientId`, redirect URI `/authorize`).

**Authorization model (implemented):** membership in `USER_GG` or `ADMIN_GG` (from AWS Secrets Manager / `config.local.json`). The UI does not evaluate groups; it probes `GET /jw-api/secure-data` and treats the API authorizer as the sole gate.

The multi-role taxonomy proposed below was simplified to `user` / `admin` authorizer roles. Feature routes are `/utilization`, `/proof-points`, and `/system_admin` (admin-only).

---

## 3. Implementation status

| Planned in this doc | Actual implementation |
|---------------------|----------------------|
| `self-service-analytics-api` repo name | `jakshwealth-api` |
| Client-side role constants + `verifyRoles` | `AuthorizationService.probeAccess()` → authorizer only |
| `authBypass`, `auth.mock.ts`, mock login UI | **Not implemented** (removed) |
| `AUTH_BYPASS`, E2E test secrets on API | **Not implemented** (removed) |
| `/analytics`, `/reports` feature routes | `/utilization`, `/proof-points` |
| Per-endpoint `allowed_apis.json` matrix | Global-group membership check in `ssa_authorization` |
| `environment.dev.ts` / per-stage file replacements | Single `environment.ts` for local dev |

**Lambdas shipped:** `ssa_authentication`, `ssa_authorization`, `ssa_secure_data`, `ssa_app_config`.

**UI auth stack:** `AuthService`, `UserService`, `AuthorizationService`, `authGuard`, `loggedInGuard`, functional HTTP interceptors — documented in [APP_STRUCTURE.md](../APP_STRUCTURE.md).
