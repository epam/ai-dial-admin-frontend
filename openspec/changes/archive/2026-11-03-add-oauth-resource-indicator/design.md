## Context

Core's `ResourceAuthSettings` (snake_case on the wire) gains an optional `resource`. Core sends it on the
token exchange and refresh; the admin UI must add it to the **authorization** URL, which it builds itself in
three `startOAuthFlow` functions, and must let admins set it for static clients.

In this repo `DialToolsetResourceAuthSettings` is the single type behind Assets toolsets and application
external services (`DialExternalServiceAuthSettings extends` it), and `ResourceOAuthSection` is the single
editor, mounted by `ResourceAuthTypeSection`. Config toolsets use a parallel camelCase type and editor but are
served by ai-dial-admin-backend, whose DTO/entity do not carry `resource` — out of scope.

Core update semantics (from the PR): omitted `resource` keeps the stored value, blank clears it, anything else
replaces it. Core also falls back to the server's published Protected Resource Metadata when a static
registration has no value.

## Goals / Non-Goals

**Goals:**
- Authorization URL carries `resource` whenever the stored settings have one.
- Static OAuth editor can set, change and clear `resource`.
- `resource` survives an application save (external services replace the whole object in core).

**Non-Goals:**
- Config toolsets, dynamic registration UI, UI-side derivation of a value, client-side fragment check
  (see proposal).

## Decisions

**1. Reuse `EndpointControl` for the field, not a bare `Input`.** It already validates http(s) URLs, reports
into `SaveValidationContext` (so an invalid value blocks Save like the neighbouring endpoints), shows a
copyable read-only view when disabled, and passes `''` on clear — exactly the "clear" signal core needs.
`required` is left off so an empty field is valid. Alternative: a plain ui-kit `Input` with a new validator —
rejected as a second URL-validation path for the same kind of value. Note: `EndpointControl` reports a cleared field as `undefined`, not
`''` (found by the section spec), so the section maps `undefined` to `''` itself (decision 3).

**2. Do not add a fragment check.** `getUrlError` has no notion of fragments; adding a parameter to a shared
validator for a case core already rejects (400 → existing save error notification) is not worth the blast
radius. RFC 8707 also allows non-http URIs, which `EndpointControl` would reject; MCP resources are http(s)
in practice, so the narrower client rule is acceptable. Revisit if a non-http resource shows up.

**3. Clear is a blank string, untouched is unchanged.** The section writes the value `EndpointControl` emits
into `resource`, mapping the `undefined` it emits on clear to `''`; it never converts `''` to `undefined`. The save path needs no mapping:
`stripClientSecretHint` and `stripExternalServiceAuthStatuses` use rest-spread, so `resource` is forwarded
as-is in both `assets-toolsets/actions.ts` and `assets-applications/actions.ts`. This is the opposite of
`client_secret`, which is dropped when empty; the difference is deliberate and covered by a regression test so
nobody "tidies" `resource` into the same helper.

**4. Append `resource` to the authorization URL only when non-empty**, in the existing
`url.searchParams.set(...)` run of both button components, next to `scope`. No shared helper: the two
functions already duplicate the URL build and differ in state/redirect handling; extracting is a separate
refactor.

**5. Placement in the form:** directly after Token endpoint, before Code challenge method, with a helper
caption saying that core uses the MCP server's published value when the field is empty. Label and placeholder
go through new `EntityFieldsI18nKey` / `EntityPlaceholdersI18nKey` entries (no existing "resource" key fits —
checked `BasicI18nKey`/`EntitiesI18nKey`).

## Risks / Trade-offs

- **Server refills a cleared value** → For static toolsets core falls back to published metadata when no
  value is given, so clearing may come back populated after save. Helper text sets that expectation; the
  field reloads from core's response, so the UI never shows a stale value.
- **Entra-style servers reject `resource`** → The UI never prefills or derives a value; only an explicit admin
  entry (or core's metadata lookup) produces one.
- **Older core ignores the field** → Harmless: unknown key is dropped on save and the value never round-trips.
  Documented in the proposal impact.
- **Existing toolsets have no `resource` until re-registered/re-saved** → Core-side caveat; authorize URL is
  unchanged for them, which matches today's behaviour.

## Open Questions

- None blocking. Whether config toolsets get the same field depends on the backend adding `resource` first.
