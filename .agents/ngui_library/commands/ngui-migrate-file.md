# /ngui-migrate-file

Migrate the **current file** (or the path the user provides) from legacy Bootstrap/Material/custom markup to **NGUI Canvas** components.

## Steps

1. Identify the target: focused `.component.html` / `.component.ts` pair, or the path the user named.
2. Read and follow **`.agents/ngui_library/skills/ngui-migrate-to-canvas/SKILL.md`**.
   (Cursor users: `.cursor/skills/ngui-migrate-to-canvas/SKILL.md` is an identical mirror.)
3. Before editing, list legacy patterns found and proposed `ngui-*` replacements.
4. Use **`.agents/ngui_library/skills/ngui-component-reference/SKILL.md`** to load each target component's `node_modules/.../lib/interfaces/<name>.ts` API.
5. Update template and `imports` only unless the user asked for logic changes.
6. Summarize migrations, new module imports, and manual follow-up (e.g. large tables, AG Grid setup).

Do not use deprecated NGUI components (`progress-bar`, `content-element`, `sidebar`, `date-range-picker`).
