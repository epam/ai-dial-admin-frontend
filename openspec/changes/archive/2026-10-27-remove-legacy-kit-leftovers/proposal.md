## Why

Issue #5147 moves the admin app off the legacy `Dial*` ui-kit components. After the Steps / LabelledText / Analytics and popup batches, a scan of `apps/ai-dial-admin` finds no import of any of the kit's 36 `Design system 1.0` exports. What remains is residue: a stylesheet shim for the 1.0 tooltip bubble, and spec, doc and comment text that still names components the app no longer uses.

## What Changes

- Verify whether any 1.0 tooltip bubble is still portalled in the running app. If none is, remove the `#tooltip-portal` block from `scss/tooltip.scss` (the `.tooltip-arrow` rule above it stays). If one is, record which kit component portals it and keep the block with a corrected comment.
- Replace stale component names in three capability specs: `DialInput` and `DialSelectField` in `container-source-field-layout` and `inline-source-field-warnings`, and `DialTabs` in `test-suite-trends`.
- Fix the Purpose text that names `DialInputPopup` (`inline-source-field-warnings`) and `DialInput` (`toolset-vendor-website-field`), and the "typeable legacy select" wording in `autocomplete-input`. Purpose text is not a requirement, so these are direct edits rather than deltas.
- Drop the "1.0 `DialSelectField`" history from the comments in six pipeline specs, and reword the "legacy `Dial*` ones" line in `.claude/rules/a11y.md` (regenerating its mirrors).

## Capabilities

### New Capabilities
None.

### Modified Capabilities
No behaviour changes; each delta only renames the component a requirement or scenario names.
- `container-source-field-layout`: the image field's value is the 2.0 `Input`'s
- `inline-source-field-warnings`: the modal branch renders a `Select`
- `test-suite-trends`: the Preview runs badge trails the tab line

## Non-goals

- Migrating the legacy color tokens (`bg-layer-0…4`, `controls-*`) or changing the themes contract in `docs/THEME-CUSTOMIZATION.md`.
- Changing any kit component usage in source: there is none left to change.
- Rewriting archived changes, which keep the names they were written with.

## Impact

- `apps/ai-dial-admin/src/scss/tooltip.scss` (conditional on the check), six spec files (comments only), `.claude/rules/a11y.md` and its generated `.github/instructions` and `.cursor/rules` mirrors.
- Six capability specs under `openspec/specs/`.
- No source behaviour, API, or context changes.
