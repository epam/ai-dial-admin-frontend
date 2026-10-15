## Context

Core contract (ai-dial-core#1836, merged): read responses for toolsets, applications and the single
external-service GET carry read-only `client_secret_hint` — the secret's last 4 characters (2 for 8–11
character secrets), absent when there is no secret or it is shorter than 8. `client_secret` is never
returned. On write, an absent `client_secret` keeps the stored one; a blank one is rejected; a new one must
be ≥ 8 characters; an echoed hint is cleared by core. The external-services *listing* endpoint carries no
hint; the Admin form edits the application's inline `external_services`, which does carry it.

`ClientSecretControl` is shared by `ResourceOAuthSection` (snake_case `client_secret`, Assets) and the legacy
`Toolsets/Auth` sections (camelCase `clientSecret`). Validation is local to the control and reported to
`SaveValidationContext` under `authSettings.clientSecret`.

## Goals / Non-Goals

**Goals:** a stored secret is not reported as missing; an untouched secret survives a save; a typed secret
shorter than core's 8-character minimum is caught in the form instead of failing on save.

**Non-Goals:** legacy Toolsets, duplicate flows, mirroring core's control-character rule, displaying the
hint's tail.

## Decisions

1. **Optional `hasSecretHint` prop on `ClientSecretControl`** rather than a new control. Only
   `ResourceOAuthSection` passes it, so legacy callers are unaffected. When true and the value is empty the
   control skips `getErrorForClientSecret`, dispatches valid, and uses a new masked placeholder key.
   *Alternative:* a separate Assets control — duplicates the trimming/validation logic.
2. **Hint stays in form state; it is stripped at save.** Because the hint is retained, clearing a typed
   secret returns to the "unchanged" state. *Alternative:* drop the hint on first keystroke — clearing would
   then show a required error with no way back.
3. **Placeholder `••••`, not the hint text.** The field value stays empty so it can never be mistaken for, or
   submitted as, a secret. Rendering the tail (`••••cret`) is a later option.
4. **Strip in a small pure util applied at the two save paths** (`Assets/Toolsets/View/View.tsx` before
   `updateToolset`, and `assets-applications/actions.ts` beside `stripExternalServiceAuthStatuses`). Omitting
   an empty `client_secret` is mandatory (core rejects `""`); stripping the hint is redundant (core clears
   it) but keeps the payload clean.
5. **Client-side minimum length, opt-in.** `getErrorForClientSecret` gains an optional `minLength`
   argument; `ClientSecretControl` gets an optional `minLength` prop that `ResourceOAuthSection` sets from a
   `CLIENT_SECRET_MIN_LENGTH = 8` constant (in a feature `constants.ts`, mirroring core's
   `ClientSecretValidation.MIN_LENGTH`). A non-empty value shorter than that shows a new "at least N
   characters" error and blocks Save; an empty value keeps the existing required / hint rules. Legacy
   callers pass nothing, so they are unaffected. The rule applies only to a value the user typed — a stored
   secret is never in the form, so a legacy short stored secret is not flagged.
   *Alternative:* enforce for every `ClientSecretControl` — would change the legacy Toolsets, which are out
   of scope. Control characters are not mirrored; core still rejects them through the save-error path.
6. **Spec as ADDED requirements** on `oauth-client-validation`: that spec has no `### Requirement:` blocks
   to MODIFY, so a delta can only add; the archive step folds them in.

## Risks / Trade-offs

- [Stored secret shorter than 8 characters, or legacy plaintext that fails decryption → core emits no hint]
  → the field still shows the required error; the user re-enters the secret. Acceptable: such secrets do not
  come from real issuers.
- [Older core without #1836 returns no hint] → behavior is unchanged from today.
- [The 8-character minimum is duplicated from core and could drift] → single named constant with a
  comment pointing at core's `ClientSecretValidation.MIN_LENGTH`; core stays authoritative and its
  rejection still surfaces through the existing save-error notification.
- [Control characters in a typed secret] → not validated client-side; core rejects them on save.
- [`ClientSecretControl` is shared] → new prop is optional and defaults to current behavior; regression
  test covers "no hint + empty → error".
