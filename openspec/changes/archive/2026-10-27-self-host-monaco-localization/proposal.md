## Why

Every code editor in the console (JSON editors, diff views, SQL, JSONata, log and read-only viewers) runs a
Monaco build that `@monaco-editor/loader` pulls from `cdn.jsdelivr.net` at its default version, 0.52.2, because
the app never configures the loader. The npm `monaco-editor@0.55.1` in `package.json` only supplies types. So
Monaco's own UI cannot follow the app locale, and the JSON validation errors it reports are always English —
in the editor's error hover and in the notification shown when a save is blocked. Issue #59 asks for Monaco
to be localized; that is only possible once the app owns the Monaco it runs.

Running the CDN copy also leaves the runtime on a different version than the types (hence the
`(monaco.languages as any).json` cast in `JsonEditorBase`), makes the `dompurify` override in `package.json`
inert at runtime, and makes every editor depend on a third-party host. A spike on
`spike/monaco-self-host` showed the npm ESM build works under Next with workers, CSS and localized UI, and that
the JSON error text can be replaced in place.

GitHub Issue: #59

## What Changes

- Load Monaco from the npm `monaco-editor` package (ESM, bundled by webpack) instead of the jsdelivr CDN,
  client-only, through one shared entry point that every editor wrapper imports. Workers are bundled too.
- Register only the Monaco languages the console uses (JSON, SQL, plain text, plus the app's own `log` and
  `jsonata` languages) instead of every language Monaco ships.
- Show Monaco's own UI (context menu, find/replace widget, command palette, read-only notice, accessibility
  labels) in the app locale, using the message bundle Microsoft ships with `monaco-editor` for that locale.
  English stays the fallback for a locale Microsoft does not ship.
- Translate the JSON validation errors — syntax errors and schema-violation errors — through the app's i18n
  (`src/locales`, an `I18nKey` enum in `src/constants/i18n.ts`, `t()`), so the editor's error hover and the
  save-blocked notification show the same translated text.

## Non-goals

- **Custom translations of Monaco's UI strings**, including fixes to Microsoft's wording and translations
  for locales Microsoft does not ship. Monaco's UI comes only from Microsoft's bundles in this change.
- **Errors from loading a JSON schema** (the language service's schema-resolution messages): the console
  disables schema requests, so they do not surface.
- **Errors from non-JSON languages** (SQL, JSONata): Monaco reports no diagnostics for them today.
- **Switching Monaco's language without a page load.** Monaco is a page-wide singleton; the console ships one
  locale (`en`) today.
- **Re-enabling the Content-Security-Policy header** that `next.config.js` has commented out. This change removes
  one blocker for it (scripts from jsdelivr) but does not turn it on.
- **Hardcoded English in the app's own completion providers** (JSONata function and request-template variable
  descriptions). That is the app's text, not Monaco's.

## Capabilities

### New Capabilities

- `code-editor-runtime`: how the console loads Monaco (bundled, client-only, one entry point, the language set
  it registers), which locale Monaco's UI uses, and how JSON validation errors are translated in the editor
  hover and the save-blocked notification.

### Modified Capabilities

None. `shared-json-editor` requirements (sticky scroll, focus preservation) are unchanged.

## Impact

- **New shared module**: `src/components/Common/MonacoEditor/` — the loader, the `Editor`/`DiffEditor` entry
  points, the bundled workers and the JSON error translation.
- **Editor wrappers switch their import** from `@monaco-editor/react` to the shared entry point:
  `JsonEditorBase`, `CodeViewer`, `DiffField`, `FullscreenViewer`, `LogViewer`, `FullscreenDiffViewer`,
  `ResultValueDialog`, `SchemaViewer`. Through `JsonEditorBase` this reaches every entity JSON tab, the JSONata
  editor, the Analytics SQL editor and the row-limit editor.
- **i18n**: new JSON-validation keys in `src/locales/en.ts` and `src/constants/i18n.ts`.
- **Save-blocked notifications** (`showEditorErrorNotifications`) keep their shape; their title becomes the
  translated error text.
- **Tests**: `test-setup.tsx` gains a mock for the shared entry point; specs that mocked `@monaco-editor/react`
  locally follow it.
- **Build**: client static output grows (Monaco and its workers are now our chunks, loaded only when an editor
  mounts); first-load JS shared by all pages grows by about 2 kB per the spike. No new runtime host.
- **Dependencies**: none added. The `dompurify` override starts applying to the Monaco that actually runs.
