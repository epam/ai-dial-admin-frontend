## Why

Large JSON documents can render blank while a user scrolls the Application JSON Editor because Monaco sticky scrolling is enabled by default. Several call sites already opt out individually, which leaves the shared behavior inconsistent and allows affected editors to miss the safeguard.

## What Changes

- Disable Monaco sticky scrolling in the shared JSON-editor defaults used by `JsonEditorBase`.
- Remove redundant per-call-site sticky-scroll opt-outs that inherit those defaults, retaining other local editor options.
- Verify that the Applications JSON Editor remains readable while scrolling a long configuration.

## Capabilities

### New Capabilities

- `shared-json-editor`: Defines consistent baseline scrolling behavior for JSON editors backed by the shared Monaco wrapper.

### Modified Capabilities

- None.

## Non-goals

- Change JSON parsing, validation, formatting, or save behavior.
- Alter editor-specific options other than redundant sticky-scroll configuration.
- Change the behavior of editors that do not use the shared `JsonEditorBase` defaults.

## Impact

- `apps/ai-dial-admin/src/constants/editor.ts`
- JSON/JSONata editor call sites that currently repeat the sticky-scroll opt-out
- Focused editor-default tests and automated browser verification of the Applications JSON Editor
- No backend APIs, data contracts, or dependencies are affected.
