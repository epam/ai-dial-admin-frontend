## Why

Core never returns a toolset's `client_secret` — a manager reading an OAUTH toolset gets only
`client_secret_hint` (the last 2–4 characters). A toolset exported from one environment therefore
carries no secret, and importing it into another fails in Core: a static OAUTH client requires
`client_secret`, and Core rejects a blank or too-short (< 8 chars) one. Today there is no way to
import OAUTH toolsets across environments at all.

## What Changes

- New server env flag `ENABLE_UNSAFE_TOOLSET_IMPORT` (default off). When on, the toolset **JSON**
  import supplies a `client_secret` for every OAUTH toolset so Core accepts the import. ZIP archive
  import is untouched.
- Conflict-resolution step of the toolset import modal (flag on, JSON, ≥ 1 OAUTH toolset in the
  file):
  - a warning notification titled "Client secrets aren’t included in imports. Add them manually to activate the imported toolsets."; hovering it shows the details — the real secret can be
    entered now or changed later on the toolset page, `REPLACE_WITH_REAL_SECRET` may be edited or left as
    is for now;
  - while **Override** is selected the details gain an extra warning: overriding an existing toolset
    with the placeholder replaces its stored secret, and clearing the value keeps it;
  - the preview grid gains an editable, masked `Client secret` column on OAUTH rows, defaulting to
    `REPLACE_WITH_REAL_SECRET`.
- On Finish, OAUTH toolsets without a real secret are sent with the placeholder (or the user-entered
  value); `client_secret_hint` is dropped from the payload.
- New `EditablePasswordCellRenderer` grid renderer (ui-kit `PasswordInput`, reveal toggle, no
  tooltip), because `EditableCellRenderer` cannot mask its input without leaking it through its
  overflow tooltip, and `PasswordCellRenderer` is display-only.
- README env table row, commented `.env.template` entry.

## Capabilities

### New Capabilities

- `toolset-import-client-secrets`: flag-gated handling of OAUTH `client_secret` in the toolset JSON
  import — warning banner, Override warning, masked per-row secret column, and the Finish-time
  placeholder fill.

### Modified Capabilities

<!-- None: no existing spec describes the asset/toolset import modal. -->

## Non-goals

- No change to Core. A Core-side import mode (accepting secret-less static OAUTH on import) would be
  cleaner, but is out of scope for this workaround.
- No ZIP handling — archives are uploaded as-is and never inspected client-side.
- No distinction between statically and dynamically registered toolsets; the client cannot tell them
  apart, so both get the same treatment.
- No existence lookup to decide per toolset whether the placeholder is safe (considered and
  rejected in favour of an explicit Override warning).
- No client-side secret validation beyond the blank fallback; Core stays the authority on length and
  character rules.

## Impact

- `apps/ai-dial-admin/src/components/EntityListView/Import/` — `ImportModal.tsx`,
  `ImportConflicts.tsx`, `utils.ts` (columns, row data, `changeFilesMap`, Finish-time fill).
- `apps/ai-dial-admin/src/components/Grid/CellRenderers/` — new `EditablePasswordCellRenderer`.
- Server page for toolsets (`app/[lang]/assets-toolsets/page.tsx`) reads the env var and threads it
  through the list → `BaseAssetList` → `Modals` → `ImportModal`, following `ENABLE_EXPORT_CONFIG_MAP`.
- `models/import-asset.ts`, `models/dial/toolset.ts` (grid row/auth typing); i18n keys in
  `constants/i18n.ts` / `locales/en.ts`.
- `README.md`, `.env.template`.
- Shared surface: `ImportModal` and the import grid helpers serve prompts, applications and files
  too — the new behavior must be inert for every route other than toolsets.
- Unverified against Core at proposal time (resolved in design): the change mode an existing toolset
  hits on re-import (whether "no secret on Override keeps the stored one" holds), and the casing of
  auth fields in exported toolset JSON.
