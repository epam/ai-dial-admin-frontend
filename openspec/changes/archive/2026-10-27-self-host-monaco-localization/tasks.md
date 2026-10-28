## 1. Bundled Monaco entry point

- [x] 1.1 Add `src/components/Common/MonacoEditor/monaco-entry.ts`: import `monaco-editor/esm/vs/editor/edcore.main.js`, the JSON contribution (`vs/language/json/monaco.contribution.js`) and the SQL basic language (`vs/basic-languages/sql/sql.contribution.js`), and export the instance with the JSON namespace as `json` (design D3)
- [x] 1.2 Add the worker entries `MonacoEditor/workers/editor.worker.ts` and `MonacoEditor/workers/json.worker.ts` (design D3)
- [x] 1.3 Add `MonacoEditor/constants.ts` with the locales whose Microsoft message bundle carries translations (the 13 shipped minus `pt-br`, empty in 0.55.1), and `MonacoEditor/load-monaco.ts`: one memoized promise that sets `self.MonacoEnvironment.getWorker`, imports `monaco-editor/esm/nls.messages.<locale>.js` when the lowercased app locale is in that list, imports the entry, and calls `loader.config({ monaco })` (design D1, D4). The spike's `?monacoLocale=` override and its `document.documentElement.lang` lookup are not carried over
- [x] 1.4 Add `MonacoEditor/Editor.tsx` and `MonacoEditor/DiffEditor.tsx` (default exports, one component each): read `useCurrentLocale()` and `useI18n()`, call `loadMonaco` in an effect, and render `@monaco-editor/react`'s `Editor` / `DiffEditor` with the caller's props once it resolves, rendering `EditorLoading` (ui-kit `Spinner` in a box of the editor's size) until then (design D2)

## 2. JSON validation error translation

- [x] 2.1 Add a `MonacoJsonErrorI18nKey` enum to `src/constants/i18n.ts` and its entries to `src/locales/en.ts`: one key per syntax error code and one per schema-violation message of the pinned `vscode-json-languageservice`, each holding Monaco's exact English wording, with `{n}` placeholders turned into named parameters (design D5)
- [x] 2.2 Add `MonacoEditor/utils.ts` with a pure function that turns a marker into its translated message: syntax codes map one to one to keys; schema messages match English templates compiled to regular expressions with one capture per argument, whose values go to `t()`; anything unmatched returns the original message (design D5)
- [x] 2.3 In `load-monaco.ts`, subscribe once to `monaco.editor.onDidChangeMarkers`: for markers of owner `json`, translate each message with the latest registered `t()` and write the list back with `setModelMarkers` only when a message changed; `Editor` / `DiffEditor` register their `t()` for it (design D5)

## 3. Editor wrappers

- [x] 3.1 Switch `Editor` / `DiffEditor` imports from `@monaco-editor/react` to the shared module in `JsonEditorBase`, `CodeViewer`, `DiffField`, `FullscreenViewer`, `LogViewer`, `FullscreenDiffViewer` (`Runs/Details/BottomDrawer`), `ResultValueDialog` (`Analytics/QueryBuilder/Result`) and `SchemaViewer` (`TestSuites/Metrics/AddMetric/Values`); keep type-only imports from `@monaco-editor/react`
- [x] 3.2 In `JsonEditorBase`, configure diagnostics through the typed `monaco.json.jsonDefaults` and drop the `(monaco.languages as any).json` cast and its try/catch (design D3)

## 4. Unit tests

- [x] 4.1 Mock the shared `Editor` / `DiffEditor` in `apps/ai-dial-admin/test-setup.tsx` with the same text stubs used for `@monaco-editor/react`, and move `JsonEditorBase.spec.tsx`'s inline mock to the shared module path (design D6)
- [x] 4.2 `MonacoEditor/tests/utils.spec.ts`: a syntax code maps to its key; a schema message with arguments maps to its key with the values passed through; an unknown code or text keeps the original message; with the English locale every pinned message reads exactly as Monaco reports it
- [x] 4.3 `MonacoEditor/tests/json-error-templates.spec.ts`: every English template in the table still appears verbatim in `node_modules/monaco-editor/esm/external/vscode-json-languageservice`, so a Monaco upgrade that rewords one fails here; and every locale listed in `MonacoEditor/constants.ts` has a bundle under `node_modules/monaco-editor/esm` whose entries are not all `null`
- [x] 4.4 `MonacoEditor/tests/load-monaco.spec.ts` against a fake `monaco`: loads once across calls; imports the Microsoft bundle for a shipped locale and none otherwise; calls `loader.config` with the entry; the marker listener rewrites `json` markers once, writes nothing on its own second pass, and leaves markers of other owners untouched
- [x] 4.5 `MonacoEditor/tests/Editor.spec.tsx` and `DiffEditor.spec.tsx`: the library editor renders only after Monaco has loaded, and receives the caller's props
- [x] 4.6 Update existing specs of the switched wrappers (task 3.1) that break on the new import path

## 5. Browser verification

- [x] 5.1 Run the `spec-browser-verify` skill for this change against the local app and resolve every `fail` verdict. Scope: the bundled-engine, language and English-locale scenarios, plus the syntax and schema error scenarios in English. The console ships only `en`, so the non-English locale scenarios are covered by tasks 4.2 and 4.4, not in the browser. The save-blocked scenario MUST use an entity the gate creates for the check and never an existing one

## 6. Quality gate

- [x] 6.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, `npm run test` and `npm run build`, and fix what they report
