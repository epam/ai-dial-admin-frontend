## Context

See proposal.md — Why. The constraints that shape the approach:

- **No Monaco runtime import today.** #3275 turned every `monaco-editor` import into `import type` while fixing a
  hydration error, and `test-setup.tsx` stubs `queryCommandSupported` because Monaco 0.55 touches the DOM at
  import time. Monaco therefore MUST NOT be imported on the server, and must not be evaluated during SSR of a
  `'use client'` component either.
- **`@monaco-editor/react` takes an instance.** `loader.config({ monaco })` makes `loader.init()` resolve to the
  given instance instead of injecting the CDN AMD script. It has to be set before the first editor mounts.
- **Monaco UI text is a positional array.** Monaco reads `globalThis._VSCODE_NLS_MESSAGES` while its modules
  evaluate. `monaco-editor/esm/nls.messages.<locale>.js` sets it for 13 locales (cs, de, es, fr, it, ja, ko,
  pl, pt-br, ru, tr, zh-cn, zh-tw), but in 0.55.1 the `pt-br` file holds only `null` entries, so Monaco
  renders English for it. A browser check of the other 12 found every context-menu and find-widget string
  translated, no clipped labels and CJK glyphs rendering.
- **JSON errors are English by construction.** The JSON language service runs in a worker and formats its
  diagnostics through the `@vscode/l10n` bundled into Monaco, whose `t()` is a passthrough. Each marker carries
  a numeric `code` (`ErrorCode` in `vscode-json-languageservice`): syntax errors have one code each (`514`
  CommaExpected, `519` TrailingComma, …); schema violations share a few codes (`0`/`1`/`2`) and embed arguments
  in the text (`Missing property "{0}".`).
- **Two places show the text.** Monaco's own hover over the squiggle, and `showEditorErrorNotifications`, which
  turns the markers that `onValidate` hands `JsonEditor` into save-blocked notifications.
- **Languages in use**: `json` (JSON editors, viewers, diffs), `sql` (Analytics SQL tab), `plaintext`, and the
  app-registered `log` (`LogViewer`) and `jsonata` (`JsonataEditor`). `DiffField` defaults to `'Markdown'`,
  which is not a Monaco language id and already renders as plain text.

## Goals / Non-Goals

**Goals:**

- One place decides how Monaco is loaded, in which locale, and with which languages; editor wrappers only
  import from it.
- The JSON error text a user reads is the same in the hover and in the notification, and it comes from
  `src/locales` like any other app text.
- A Monaco upgrade that changes a JSON error message fails a unit test instead of silently reverting that
  message to English.

**Non-Goals:**

- A Monaco instance per editor or per locale. Monaco stays a page-wide singleton, loaded once.
- Translating diagnostics the console does not produce today (schema-loading errors, other languages).

## Decisions

### D1 — Bundle the ESM build through webpack

Load `monaco-editor`'s ESM build with a dynamic `import()` on the client and hand the result to
`loader.config({ monaco })`.

- *Alternative: copy `min/vs` into `public/` and point the loader's `paths.vs` at it.* Smallest diff and keeps
  the AMD loader, but Monaco 0.53 deprecated the AMD build and no longer supports it, so it would be a second
  migration later.
- *Alternative: keep the CDN, pinned to 0.55.1.* Fixes the version skew only; localization would still mean
  injecting globals into a script we don't host, and every editor would keep depending on jsdelivr.

The spike built this under Next 15 / webpack without config changes: CSS imported from `node_modules` and
`new Worker(new URL(…, import.meta.url))` both work.

### D2 — Wrappers wait for Monaco in an effect, not through `next/dynamic`

`src/components/Common/MonacoEditor/` exports `Editor` and `DiffEditor` (one component per file). Each one:

1. reads the locale (`useCurrentLocale()`) and `t()` (`useI18n()`);
2. calls `loadMonaco(...)` in an effect, which is client-only by construction;
3. renders `@monaco-editor/react`'s component once the promise resolves. Before that it renders
   `EditorLoading`: a box of the same size, so the layout doesn't shift, holding ui-kit's `Spinner` labelled
   with `BasicI18nKey.Loading`. Steps 1–2 live in a `use-bundled-monaco.ts` hook both share.

`loadMonaco` lives in the same folder and memoizes a single promise. It configures workers, imports the
locale's Microsoft bundle when one exists, then imports the Monaco entry (D3) and calls `loader.config`.

- *Alternative: `next/dynamic` with `ssr: false` (what the spike did).* The dynamic loader runs outside React, so
  it can't read the locale or `t()` from hooks — the spike read `document.documentElement.lang` and a query
  parameter instead. The effect keeps both inside React.
- *Alternative: patch `loader.init`.* `@monaco-editor/react` expects a cancelable promise from it; replacing it
  ties us to the loader's internals.

The spike's `?monacoLocale=` override is not carried over: the locale comes only from the app.

### D3 — An app-owned Monaco entry with only the languages in use

`load-monaco.ts` imports an app entry module instead of `monaco-editor` (whose `editor.main.js` registers about
80 languages plus the TypeScript, CSS and HTML services). The entry imports `vs/editor/edcore.main.js` (editor
core and every editor contribution: find, context menu, folding, diff…), the JSON contribution
(`vs/language/json/monaco.contribution.js`) and the SQL basic language, and exposes the JSON namespace as
`json`, the 0.55 top-level shape. `@monaco-editor/react` types its instance as the core API only
(`typeof editor.api`), so a `BundledMonaco` type in the module's `models.ts` adds `json`.

- `JsonEditorBase` then calls `json.jsonDefaults.setDiagnosticsOptions` through `BundledMonaco`, dropping the
  `(monaco.languages as any).json` cast and its try/catch: the runtime and the types are the same version now.
- `edcore.main.js` ships no declaration file, so the entry imports it for its side effects only and takes the
  namespace from `editor.api.js`, which is typed and re-exports the same `editor.api2.js`.
- Workers: an editor worker and a JSON worker only (`MonacoEditor/workers/*.worker.ts`). No other language
  service is registered, so no other worker is ever requested.
- Adding a language later is one import in the entry, plus a worker if it has a language service.
- *Alternative: import all of `monaco-editor`.* Simpler, but in the spike it added about 14 MB of lazy chunks
  (TypeScript service, ~80 tokenizers) for languages nothing uses.

### D4 — Microsoft's bundle for the UI, English fallback

The app locale is lowercased and looked up in the 12 bundles that carry translations; `pt-br` is left out
of the list because its 0.55.1 bundle is empty, and loading it would only cost a request. A hit imports
`monaco-editor/esm/nls.messages.<locale>.js` before the entry; a miss imports nothing, so Monaco keeps its
built-in English. With the console shipping only `en` today, the visible result is unchanged; the next app
locale that Microsoft covers is localized without code changes. The list of bundled locales lives in the
module's `constants.ts`, and a unit test fails if a listed bundle stops carrying translations after an
upgrade.

### D5 — Translate JSON markers after the fact, through app i18n keys

`loadMonaco` subscribes once to `monaco.editor.onDidChangeMarkers`. For each changed model it reads the markers
of owner `json`, translates each message, and writes the list back with `setModelMarkers` under the same
owner. Writing back fires the listener again; the second pass finds every message already translated and
writes nothing. The hover and `onValidate` both read the marker store, so the notification is translated with
no change to `showEditorErrorNotifications`.

Translation is a pure function in the module's `utils.ts`:

- **Syntax errors**: `code` → i18n key, one to one.
- **Schema violations**: `code` is not unique, so the message is matched against the English template list of
  the pinned language service. A template becomes a regular expression with one capture per `{n}`; a match gives
  the i18n key and the arguments, which are passed to `t()` as named parameters.
- **Anything else** (an unknown code or text) keeps Monaco's English message.

The keys live in a `MonacoJsonErrorI18nKey` enum in `src/constants/i18n.ts`; `en.ts` holds Monaco's own English
wording, so an English UI reads exactly as today. The translator gets `t()` from the wrappers (D2), and the
listener always uses the latest one registered, so it never reads hooks itself.

- *Alternative: translate only in `showEditorErrorNotifications`.* Fixes the notification but leaves the hover
  English — the case the user asked to cover.
- *Alternative: alias `@vscode/l10n` in the worker bundle to a configured implementation.* Native, but it
  needs a webpack alias into a Monaco-internal path and a way to ship the translations into the worker.
- *Alternative: key everything by English text.* Works for syntax errors too, but codes are stabler where they
  are unique.

### D6 — One shared test mock

`test-setup.tsx` mocks the shared `Editor`/`DiffEditor` with the same text stubs it uses for
`@monaco-editor/react`. Specs that mocked `@monaco-editor/react` inline (`JsonEditorBase.spec.tsx`) move to the
shared module path. `loadMonaco` and the translation utilities get their own unit tests against a fake
`monaco` object; the drift test (Goals) reads the pinned `vscode-json-languageservice` sources from
`node_modules` and asserts each template still exists verbatim.

## Risks / Trade-offs

- [The hover shows English for a moment if it is open while the worker replaces markers] → The listener runs
  on Monaco's debounced marker event before the hover re-reads the store; the spike saw no English text across
  repeated edits with the hover open. Opening the hover by keyboard (⌘K ⌘I) right after a keystroke is
  unverified, and the browser-verification task covers it.
- [A Monaco upgrade renames an error message] → The drift test fails; until it is updated, that message falls
  back to English instead of disappearing.
- [The save-blocked notification can read English if `onValidate` fires between the worker's write and ours]
  → `JsonEditor` replaces its error list on each `onValidate`, so the translated list overwrites the English
  one within the same debounce tick.
- [Static output grows and webpack build time rises] → Lazy chunks only, loaded on first editor mount; D3 limits
  them to what is used. First-load JS shared by all pages grew about 2 kB in the spike.
- [Monaco reads its NLS array once] → A locale change needs a full page load. Acceptable while the console ships
  one locale; recorded as a proposal non-goal.
- [Worker URLs and a future CSP] → Workers are same-origin chunks under `/_next/static`, so a later
  `worker-src 'self'` covers them; nothing in this change depends on CSP.

## Migration Plan

No data, API or environment changes. Deployments stop fetching Monaco from jsdelivr, which also makes the editors
work where that host is unreachable. Rollback is a revert of the change.
