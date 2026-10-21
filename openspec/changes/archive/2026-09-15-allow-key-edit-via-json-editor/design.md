## Context

`toKeyPayload` (`src/app/[lang]/platform-keys/actions.ts`) strips the `key` field from every PUT
payload unless the caller passes `{ includeKey: true }` — only `createKey` and `rotateKey` do. The
omission on regular updates is deliberate: Core never returns the secret on reads, so the client
holds `key: undefined` there, and Core's `SecretFieldProcessor.mergePreservingOmittedSecrets`
preserves the stored secret when the field is absent.

The JSON editor already threads a user-typed `key` all the way to the server action:
`EntityJsonEditor.onChangeJSON` parses the raw JSON and `mergeWithIgnoredFields` (no
`ignoredFields` passed from the key view) keeps it on `selectedKey`; `View.tsx`'s `onSave` passes
`selectedKey` to `updateKey`. `toKeyPayload` is the single point that discards it — the save
succeeds while the secret silently stays the old one.

Serialization matters to the contract: `sendRequest` builds the body with `JSON.stringify`
(`src/utils/api/send-request.ts`), which drops `undefined` properties but keeps `null`.

## Goals / Non-Goals

**Goals:**

- A `key` value entered in the JSON editor reaches Core on Save (manual alternative to Rotate).
- Create/rotate behavior unchanged; properties-only saves unchanged on the wire.
- `"key": null` never reaches Core.

**Non-Goals:**

- No UI changes — Properties keeps hiding `key`; Rotate keeps its generate-and-reveal flow; no
  reveal step for JSON-editor saves.
- No Core backend changes.

## Decisions

### 1. Include `key` via a null-safe spread, not an unconditional property

```ts
function toKeyPayload(key: DialKeyResource) {
  const { /* stripped read-only fields */ ..., key: keyValue, ...payload } = key;
  return { ...payload, ...(keyValue != null && { key: keyValue }) };
}
```

- **Alternatives considered:**
  - Keep the `includeKey` option and pass it from `updateKey` too — rejected: `updateKey` cannot
    know whether the key came from the JSON editor or a properties edit; the presence of the value
    itself is the only correct signal, and the option becomes redundant with it.
  - Unconditional `key: keyValue` — rejected twice over: `"key": null` from the JSON editor would
    survive `JSON.stringify` as `{"key": null}` (Core's null-secret handling is unknown), and the
    in-memory payload would carry a literal `key: undefined` property, making
    `expect(payload).not.toHaveProperty('key')` assertions in tests dishonest about the wire.
- `!= null` covers both `undefined` (properties-only save → field absent → Core preserves the
  secret, exactly as today) and `null` (normalized to absent).

### 2. Delete the `options` parameter entirely

`createKey`/`rotateKey` always hold a generated value, so `{ includeKey: true }` adds nothing
after decision 1. Removing the parameter and both call-site flags keeps one contract — "send what
the client holds" — instead of two overlapping ones.

### 3. Rewrite the doc comment to the new contract

The current comment's "`key` is NEVER included in regular updates" becomes the inverse statement:
`key` is included whenever the client holds a non-null value; absence (the normal properties-only
case, since Core never returns the secret) is what triggers Core's merge-preserving behavior. The
null normalization is stated explicitly so it reads as deliberate, not incidental.

## Risks / Trade-offs

- [A JSON-editor typo silently becomes the new secret] → Accepted: the same is true of every other
  field in the raw editor, and the value round-trips only through an explicit Save. Rotation via
  the modal remains the guided path.
- [Core rejects a PUT whose `key` equals the stored secret or has an unexpected format] →
  Surfaced as the standard error notification with Core's message; no client-side pre-validation,
  consistent with how the rest of the raw editor behaves.
- [`updateKey` and `rotateKey` become wire-identical when a key is present] → Accepted; they stay
  separate actions because their callers and UX differ (modal vs editor), and collapse would lose
  the rotate-only generate/reveal semantics at the call site.
