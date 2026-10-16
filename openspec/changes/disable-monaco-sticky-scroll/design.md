## Context

`JsonEditorBase` merges the shared `editorOptions` with caller options, allowing call sites to customize an editor without replacing baseline behavior. Monaco sticky scrolling is currently omitted from those shared defaults. The resulting enabled behavior causes long application JSON documents to intermittently render blank while scrolling. Several `JsonEditorBase` consumers have independently disabled it, producing duplicated configuration.

## Goals / Non-Goals

**Goals:**

- Set a single safe default for every editor that consumes `editorOptions` through `JsonEditorBase`.
- Remove redundant `stickyScroll: { enabled: false }` call-site configuration while retaining unrelated options such as `wordWrap`, `ariaLabel`, and completion settings.
- Prove the shared default in a focused unit test and verify the reported Applications flow in a browser.

**Non-Goals:**

- Modify Monaco versions, rendering lifecycle, or layout behavior.
- Change editor behavior other than disabling sticky scrolling by default.
- Add user-configurable editor preferences.

## Decisions

### Place the opt-out in `defaultOptions`

Add `stickyScroll: { enabled: false }` to the private `defaultOptions` object in `src/constants/editor.ts`, which feeds both `editorOptions` and `diffEditorOptions`.

This is the narrowest shared source of truth: `JsonEditorBase` applies `editorOptions` before consumer options, so local callers still retain the established ability to intentionally override a default. Adding it inside `JsonEditorBase` would make it harder to inspect alongside the other Monaco defaults, while changing each Application editor would leave the duplicated configuration and miss other shared-editor consumers.

**Alternative considered:** Only pass the option from `Applications/View/View.tsx`. Rejected because existing scattered opt-outs demonstrate the problem affects the common integration rather than an Application-only workflow.

### Remove every redundant explicit call-site option

Audit every current `stickyScroll: { enabled: false }` occurrence and remove the redundant property from each call site. `JsonEditorBase` consumers receive `editorOptions`; direct Monaco consumers that spread `editorOptions` receive it as well; and `DiffField` receives it through `diffEditorOptions`, which also derives from `defaultOptions`. When a call-site option object contains other behavior, remove only the `stickyScroll` member and preserve the rest.

**Alternative considered:** Keep explicit options on direct Monaco or diff-editor integrations. Rejected because every current explicit call site inherits the shared default, leaving duplicate configuration without behavioral benefit.

### Verify at the shared-default boundary and in the reported UI

Extend `src/constants/tests/editor.spec.ts` to assert the public `editorOptions` exposes disabled sticky scrolling. Run the browser-verification task against an Application with a sufficiently long JSON document, enabling JSON Editor and scrolling through the editor to ensure the document remains rendered.

## Risks / Trade-offs

- [A future editor stops deriving from the shared options] → Its integration must define its own sticky-scroll preference when it intentionally decouples from the shared defaults.
- [The component test cannot reproduce Monaco’s browser rendering defect] → Keep the focused default assertion and run the approved Playwright browser scenario against the actual Application flow.
- [A future caller needs sticky scrolling] → The existing merge order continues to allow an explicit local override.

## Migration Plan

- Deploy as a frontend-only change with no persisted-data migration.
- Roll back by reverting the shared default and cleanup edits; explicit call-site options can be restored from version control if necessary.

## Open Questions

- None.
