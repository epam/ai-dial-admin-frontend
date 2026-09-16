## Why

The key detail view's JSON editor lets an admin edit the raw key resource, but a `key` value typed
there is silently discarded by `toKeyPayload` on Save — the PUT succeeds, yet the secret is
unchanged. The only way to change a key's secret is the Rotate modal. The JSON editor should be a
second, manual path: a value the user enters in raw JSON is sent to Core as-is.

## What Changes

- `toKeyPayload` in `src/app/[lang]/platform-keys/actions.ts` includes `key` in the PUT payload
  whenever the client holds a non-null value, instead of gating it behind an `includeKey` option
  used only by create and rotate.
- The `options` parameter and the `{ includeKey: true }` call-site flags are removed;
  `createKey`/`rotateKey` behavior is unchanged (they always hold a generated value).
- A regular properties-only save still sends no `key` — the value is `undefined` because Core never
  returns it on reads, so the field is absent from the payload and Core's
  `mergePreservingOmittedSecrets` preserves the stored secret. The mechanism is unchanged; it just
  no longer depends on a call-site flag.
- `"key": null` entered in the JSON editor is treated as absent (normalized away), not sent —
  Core's handling of an explicit null secret is unknown and not worth discovering via a PUT.
- No reveal/copy step after a JSON-editor key save: the user typed the value themselves (unlike
  rotation, where the client generates it), so the generic update notification is the only
  feedback.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `platform-keys`: the JSON editor requirement gains scenarios for changing the secret via raw
  JSON; the "Save key properties" scenario's omit-`key` rationale is reworded to the new
  include-when-present contract.

## Impact

- `apps/ai-dial-admin/src/app/[lang]/platform-keys/actions.ts` — `toKeyPayload` signature and doc
  comment; `createKey`/`rotateKey` call sites.
- `apps/ai-dial-admin/src/app/[lang]/platform-keys/actions.spec.ts` — the two "omits key on
  update" tests flip to the new contract.
- `openspec/specs/platform-keys/spec.md` — Save-key-properties and JSON-editor requirements.
- No UI components change: `View.tsx`, `TabsContent`, and `KeyRotateModal` are untouched — the
  JSON editor already threads a user-typed `key` into `selectedKey`; only the server action strips
  it today.

## Non-goals

- Showing or editing the key value in the Properties tab — it stays hidden (write-only field).
- Changing the Rotate modal flow (generate + reveal) or the create/duplicate flows.
- Sending `key: null` to clear a secret — null is normalized to absent.
