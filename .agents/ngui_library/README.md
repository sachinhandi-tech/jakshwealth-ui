# NGUI — agent-agnostic guidance

Tool-neutral instructions for AI coding assistants (Cursor, Copilot, Claude Code, Windsurf, Codex, etc.).  
The same skill and command content is mirrored under `.cursor/` in this repo for Cursor IDE features.

## Layout

| Path | Purpose |
|------|---------|
| `skills/` | Portable “skill” runbooks (markdown). Load by path or paste into any agent. |
| `commands/` | Step-by-step command checklists (markdown). Use as slash-commands in Cursor or as prompts elsewhere. |

## For consuming applications

After `npm install @cigna/cigna_dae_ngui_library`, postinstall installs:

- `AGENTS.md` at the project root (when applicable)
- **This folder** at `<your-app>/.agents/ngui_library/` (namespaced so it won’t overwrite other vendor agent docs)
- Mirrored skill/command files under `<your-app>/.cursor/` for Cursor users (plus `ngui-*.mdc` rules)

Point any assistant at `.agents/ngui_library/skills/` for NGUI workflows without using Cursor.

## Maintenance (library contributors)

- Edit files under `.agents/ngui_library/` only (skills and commands).
- Edit `.cursor/rules/` directly for Cursor guardrails (not mirrored to `.agents`).
- Run `npm run sync:agents-to-cursor` in `workspaces/angular-library` before publishing so `.cursor/skills` and `.cursor/commands` match.
- Run `npm run sync:cursor-to-dist` (or `build:lib`) to package assets into `dist/angular-library`.
