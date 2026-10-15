## Why

Core no longer returns a stored OAuth `client_secret` on read; it returns a read-only `client_secret_hint`
instead (ai-dial-core#1508, merged in #1836). The Assets toolset and application external-service forms
treat an empty Client Secret as invalid, so every saved OAuth toolset opens with a red "This field is
required" on Client Secret and Save blocked, even though a secret is stored (issue #2957).

## What Changes

- Add the read-only `client_secret_hint` to the Assets resource auth-settings model.
- When a hint is present and the user has not typed a secret, the Client Secret field shows a `••••`
  placeholder, shows no "This field is required" error, and does not block Save.
- On save, omit an empty `client_secret` (core rejects a blank one; an absent one keeps the stored secret)
  and drop `client_secret_hint` from the payload.
- Typing a secret sends it as a new secret; clearing it again returns the field to the "unchanged" state.
- A typed Client Secret shorter than 8 characters (core's minimum) shows an inline error and blocks Save,
  for Assets toolsets and external services only.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `oauth-client-validation`: an empty Client Secret is valid when core reports a stored secret via
  `client_secret_hint`; the field renders a masked placeholder; the empty secret is omitted on save.

## Non-goals

- Legacy `Toolsets/*` UI (camelCase `clientSecret`) — it does not talk to the core resource API.
- Duplicate flows: duplicating an OAuth toolset or external service still resets auth to `NONE`, because a
  secret cannot be copied.
- Mirroring core's control-character rule client-side, and rendering the hint's trailing characters.

## Impact

- `apps/ai-dial-admin/src/models/dial/resource.ts` (`DialToolsetResourceAuthSettings`).
- `Toolsets/Auth/Controls/ClientSecretControl.tsx` — shared with the legacy Toolsets UI; the new prop is
  optional, so legacy behavior is unchanged.
- `Assets/Resources/Auth/ResourceOAuthSection.tsx` (Assets Toolsets and Assets Applications external services).
- Save paths: `Assets/Toolsets/View/View.tsx`, `app/[lang]/assets-applications/actions.ts`.
- `utils/validation/toolset-auth-error.ts` (optional minimum length for the secret check).
- New i18n keys (masked placeholder, minimum-length error); `oauth-client-validation` spec.
- Depends on ai-dial-core ≥ the release containing #1836; against an older core there is no hint and
  behavior is as today.
