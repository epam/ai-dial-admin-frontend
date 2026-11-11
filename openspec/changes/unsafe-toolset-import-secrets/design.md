## Context

Core never returns `client_secret`; a manager sees only `client_secret_hint` (last 2–4 chars, `null`
under 8 chars). The toolset JSON export (`server/toolsets/exim.ts`) deliberately applies no redaction,
so the file carries `auth_settings.client_secret_hint` and no secret. Importing it into a fresh
environment runs `ResourceAuthSettingsService.processResourceAuthSettings` in Core, which for a **new**
OAUTH toolset always takes the `CREATE_STATIC_CLIENT` path (a `client_id` is present) and requires
`CLIENT_SECRET`. Core also rejects a blank secret (`BaseAuthSettingsValidator` treats blank as absent;
`ClientSecretValidation` rejects blank / control chars / `< 8` chars). So neither a blank value nor the
hint can be used as the secret — only a non-blank value of at least 8 characters passes.

Verified against Core while exploring:

- **Existing OAUTH toolset, re-import without a secret works today.** `requiresClientRegistration`
  is `false` (existing is already OAUTH) → `NO_CLIENT_CHANGES`; a `null` secret is copied from the stored
  one. Only a toolset that does not exist yet fails. This is why the placeholder is dangerous under
  **Override**.
- **A PUT that supplies both `client_id` and `client_secret` on a dynamically-registered toolset flips
  it to static** (`explicitlyConvertingToStatic`). A placeholder on an existing DCR toolset therefore
  also loses the dynamic registration, not only the secret.
- **Exported JSON is snake_case.** `{ toolSets: [{ …, auth_settings: { authentication_type,
  client_secret_hint, … } }] }`. The camelCase `Toolset.authSettings` model does not describe the file;
  the import-time code must read `auth_settings` / `authentication_type` / `client_secret`.

Import flow today: `ImportModal` (steps Files → Properties) holds parsed JSON in `jsonFileMap` and grid
edits in `editedFileMap`; `onFinishClick` sends `editedFileMap` if non-empty, else `jsonFileMap`, to
`importToolsets` → `runAssetImportAction` → `importToolsetsExport` (`src/server/assets/exim.ts`).
Resolutions are Override / Skip. The name column is an `EditableCellRenderer` driven by
`changeFilesMap`.

## Goals / Non-Goals

**Goals:**

- Let an operator import a JSON toolset export containing OAUTH toolsets into another environment, by
  supplying either a placeholder or a real secret per toolset.
- Make the consequence (broken OAuth until a real secret is set; Override clobbering a stored secret)
  explicit in the UI.
- Keep the behavior inert unless `ENABLE_UNSAFE_TOOLSET_IMPORT` is on, and for every route/file type
  other than toolset JSON.

**Non-Goals:**

- Changing Core, ZIP import, or the export format.
- Telling static from dynamically-registered toolsets apart, or looking up which toolsets already exist.
- Client-side validation of secret length/characters beyond the blank fallback.

## Decisions

### D1 — Fill client-side at Finish, not in the server import

A pure util `applyToolsetClientSecrets(files, resolution)` in `Import/utils.ts` runs in
`onFinishClick` on the JSON branch only, gated by the flag prop, `route === Toolsets`.

- **Why over the server (`transformForPut`):** the server path is shared with ZIP import, which must stay
  untouched; it would also need `fileType`/`resolution` threaded in. The placeholder is just a
  client-generated string — there is nothing for the server to enforce, since a user can always type a
  secret by hand.
- **Why at Finish, not only on grid edits:** `onFinishClick` falls back to the raw `jsonFileMap` when
  `editedFileMap` is empty (the grid recorded no edits). Filling at Finish covers that path; grid edits
  simply override the default.

Rule per OAUTH toolset (`auth_settings.authentication_type === 'OAUTH'`):

| `client_secret` in the file after edits | Override | Skip |
|---|---|---|
| a non-blank value | sent as is | sent as is |
| absent (never touched) | placeholder | placeholder |
| blank (user cleared the cell) | **omitted** — Core keeps the stored secret of an existing toolset | placeholder |

The OAUTH check is case-insensitive: Core serializes `authentication_type` as `OAUTH` (the wire model's
`ToolsetAuthType` in `models/dial/resource.ts`) but accepts either case on input, so a hand-edited file may
carry `oauth`. The camelCase `models/dial/toolset.ts` enum is lowercase and describes a different shape —
it is not used here.

`client_secret_hint` is dropped from every OAUTH toolset it touches (Core ignores it anyway — `READ_ONLY`,
cleared by `clearComputedFields` — so this is tidiness, not correctness). Non-OAUTH toolsets are never
touched.

Alternatives considered: *empty `client_secret`* and *hint copied into `client_secret`* — both rejected by
Core (above). *Per-toolset existence lookup* to apply the placeholder only to new toolsets — rejected as
extra round-trips for a workaround flag; replaced by the Override warning (D3).

### D2 — Flag plumbing mirrors `ENABLE_EXPORT_CONFIG_MAP`

`app/[lang]/assets-toolsets/page.tsx` (a server component) reads `process.env.ENABLE_UNSAFE_TOOLSET_IMPORT`
through `isValueTruthy` and passes `isUnsafeImportEnabled` down `AssetsToolsetsList` → `BaseAssetList` →
`Modals` → `ImportModal`. A runtime server read, not a build-time `NEXT_PUBLIC_` variable, matches how the
rest of the app is configured (see `export-config/page.tsx`). Other routes never pass the prop, so the
default (`false`) keeps them inert.

### D3 — Warning banner, with an Override addendum

`ImportConflicts` renders a ui-kit warning notification under the Conflict Resolution radios when the flag
is on, the file type is JSON, and at least one parsed toolset is OAUTH. Its title reads "Client secrets aren’t included in imports. Add them manually to activate the imported toolsets." The
details sit in a tooltip: enter the real secret in the column now or change it later on the toolset page;
`REPLACE_WITH_REAL_SECRET` may be edited or left for now; OAuth sign-in will not work until a real secret
is set. While `resolution === OVERRIDE` a second, stronger line is added to the tooltip: overriding an existing toolset with the placeholder replaces its stored secret (and turns a
dynamically-registered toolset into a static one). It also explains the blank rule in the user's terms:
clearing the value declares "this secret already exists in Core and I don't want to rewrite it", and doing
so for a toolset that does not exist yet makes that toolset's import fail; choosing Skip is the other way
out. The clearing explanation lives only in the Override line because the blank rule only keeps the stored
secret under Override — under Skip a blank cell falls back to the placeholder, so the same sentence would
be wrong there.

**Tooltip on the whole banner.** The kit's `Notification` draws its own icon and exposes no slot for it, so
the tooltip is attached to the whole banner (`Tooltip` wrapping the `Notification`) — hovering the icon, or
anywhere else on it, opens the details. Considered and rejected: a hand-built icon-only row (loses the
Notification's coloured surface) and an info icon in the `action` slot (a second icon besides the warning one).
A hover-only tooltip is unreachable by keyboard and touch, so the same details are also rendered inside the
notification as screen-reader-only content (`sr-only`); the Notification's live region announces them with the
title (`a11y.md` — tooltips must not be the only route to content). The Override line re-renders on
resolution change in both places.

### D4 — Masked, editable `Client secret` column

`generateAssetColumnsForImportGrid` gains a trailing-options-style flag (`hasClientSecretColumn`) and adds a
`clientSecret` column after Version. Row data (`generateAssetRowDataForImportGrid`) gets
`clientSecret` (file's own value, else the placeholder) and an `isOAuth` marker for OAUTH rows. The column is
absent when the flag is off or the file has no OAUTH toolset; non-OAUTH rows render an empty,
non-editable cell. `changeFilesMap` gains a `clientSecret` branch that writes
`auth_settings.client_secret` on the targeted file (toolset/app branch only — prompts/files untouched).

A new `Grid/CellRenderers/EditablePasswordCellRenderer.tsx` wraps ui-kit `PasswordInput` (reveal toggle, as
`ClientSecretControl` uses it), calls `params.onChange(value, data, field)` like `EditableCellRenderer`,
sets `autoComplete="new-password"`, carries an accessible name per row, and renders no tooltip.
Not reusing the existing renderers: `EditableCellRenderer`'s `inputType` has no `'password'` and its
overflow tooltip (`OverflowValueTooltip`) and `isReadonly` branch would print the secret in clear text;
`PasswordCellRenderer` is display-only. The default value shows masked; the placeholder text is stated in
the banner and revealed by the toggle.

### D5 — Placeholder constant

`REPLACE_WITH_REAL_SECRET` lives in `Import/constants.ts` (24 chars, passes Core's `≥ 8` and no-control-char
rules).

## Risks / Trade-offs

- **[Silent breakage]** A toolset imported with the placeholder looks configured but OAuth sign-in fails →
  banner title and tooltip details; the details page already shows the secret field for editing.
- **[Override clobbers a stored secret / DCR flag]** The client cannot tell which toolsets exist →
  Override-specific warning and the blank-on-Override rule. Residual risk: a user who ignores the warning
  loses a working secret.
- **[Secret visible on screen]** A real secret typed into a grid cell → masked input with a reveal toggle,
  `autoComplete="new-password"`, no tooltip; the value lives only in modal state and is never persisted
  client-side.
- **[Casing drift]** The file is snake_case while the model is camelCase → the util is typed against the
  existing snake-case `DialToolsetResourceAuthSettings`, and specs use real exported-file fixtures.
- **[Shared modal]** `ImportModal` and the import grid helpers serve prompts, applications and files →
  every new parameter defaults to off; specs assert prompts/apps/files output is unchanged.
- **[Blank + Override on a new toolset]** Core rejects with "CLIENT_SECRET is required" → surfaced by the
  existing per-item import result; acceptable, the user chose to clear it.

## Open Questions

- Which ui-kit component backs the warning notification (resolved at implementation via the MCP server).
- Whether `PasswordInput` renders cleanly in a 32px grid cell with `p-0 border-none`, as
  `PasswordCellRenderer` already does for audit rows (resolved at implementation).
