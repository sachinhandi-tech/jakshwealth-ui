# /build-feature-page

Add a new lazy-loaded feature area in **JakshWealth** following existing app patterns.

## Steps

1. Ask which feature name, URL path, and whether it requires login or admin roles.
2. Follow **`.cursor/skills/ssa-feature-page/SKILL.md`**.
3. Copy structure from `features/utilization/` (simple) or `features/proof-points/` (tabs).
4. Register the route in `app.routes.ts` with `FeatureLayout` and `authGuard` when protected.
5. Use NGUI components; read APIs from `node_modules/@cigna/cigna_dae_ngui_library/lib/interfaces/<name>.ts`.
6. Summarize files created and the URL to test.

Do not scaffold a new app shell or re-run NGUI install — see **`AGENTS.md`**.
