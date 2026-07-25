# /ngui-setup

Set up **@cigna/cigna_dae_ngui_library** in this Angular project and scaffold the app shell.

## Steps

1. **Ask three required questions before writing any code:**
   - **Theme:** Canvas (default) or Evernorth design system?
   - **Dark mode:** Does this app need a dark-mode toggle?
   - **Layout:** Header + Left Rail Navigation / Header + Menu Bar Navigation / Header only / Other?

2. Read and follow **`.agents/ngui_library/skills/ngui-install-and-setup/SKILL.md`** end to end using the answers from step 1.
   (Cursor users: `.cursor/skills/ngui-install-and-setup/SKILL.md` is an identical mirror.)

3. Apply the layout template that matches the chosen layout (A, B, or C from the skill).

4. For layout A (left rail nav): ensure `ngui-drawer` has `[visible]="true"` — the drawer is hidden when this is unset.

5. For layout B (menu bar nav): ensure `mainNavItems` has one Home item and `selectedNav` is `'Home'`.

6. Run `ng serve`, confirm the shell renders and dark mode works (if chosen), then report what was changed and suggest using **ngui-build-feature-page** for individual page content.

Do not invent component APIs — use **ngui-component-reference** for any component beyond the app shell.
