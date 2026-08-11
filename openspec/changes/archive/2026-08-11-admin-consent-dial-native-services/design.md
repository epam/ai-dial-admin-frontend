## Context

`ai-dial-core` PR #1815 introduces a fourth external-service authentication type, `DIAL_NATIVE`, plus two
admin-only endpoints that grant and withdraw an application's approval to use it. Contract verified against
commit `b8efa89`:

```
POST   /v1/applications/{appId}/external-services/{id}/consent   → 200 true
DELETE /v1/applications/{appId}/external-services/{id}/consent    → 200 true | false
```

No request body, no query parameters, level fixed to `APPLICATION`. Approval is read back through the
existing `auth_settings.app_level_auth_status` on the application payload — `SIGNED_IN` means *approved*,
not signed in. Errors are mapped by `ExternalServiceErrors.respond`: 403 non-admin, 400 wrong type (and a
second 400, `"Application-level consent is not supported for: {appId}"`, when the credentials locator has no
`APPLICATION` descriptor), 404 undeclared service, 500 otherwise.

Current state in this repo — external services render as rows inside `ResourceMultiAuth`, reached from
`Assets/Apps/Properties.tsx`. Three places are already wrong for any auth type the frontend enum does not
know, and `DIAL_NATIVE` is the first such type that will actually arrive:

```
ExternalServiceAuthButtons.tsx:251   if (!authType || authType === NONE) return null
                                     → unknown type falls through to [Log in] [Log out]

ResourceMultiAuth.tsx:196-204        isLoggedInToExternalService = user_level || app_level
                                     → green dot for DIAL_NATIVE because the *viewing admin* has
                                       offline credentials, while the app is unapproved

ResourceAuthentication.tsx:90        authOptions.find(o => o.id === selectedAuthType)!
                                     → undefined for an unknown type → TypeError on config.icon
                                       (read-only-admin branch)
```

The second one matters most: `ExternalServiceStatusEnricher.enrich` in Core *deliberately* overwrites
`user_level_auth_status` for `DIAL_NATIVE` with the calling admin's own offline-credential state. It is not
stale data to ignore — it is correct data about the wrong subject.

Constraints: no Core change; the row action must degrade to "no action" if `DIAL_NATIVE` reaches the config
module before the consent endpoints do; the consent URL is a **new URL family** for this frontend, which
today writes external services through the application PUT and signs in through `/v1/ops/external-service/*`.

## Goals / Non-Goals

**Goals:**

- Replace the truthiness fall-through with an explicit dispatch on known `authentication_type` values, so an
  unrecognised type renders no action instead of a button that returns 400.
- Represent approval honestly: `Approved` / not approved from `app_level_auth_status`, with
  `user_level_auth_status` suppressed for `DIAL_NATIVE` in both the label and the status indicator.
- Grant and withdraw behind confirmation dialogs whose copy states the installation-wide reach.
- Keep `OAUTH` and `API_KEY` behaviour byte-for-byte unchanged.
- Fix the read-only-admin crash on an unrecognised type as part of the same dispatch work.

**Non-Goals:**

- Declaring a `DIAL_NATIVE` service from this UI (decided: display-only card).
- Showing who approved and when — Core drops it from the record; the audit log is the system of record.
- A count of affected users — requires the user-bucket enumeration Core's storage design avoids.
- Any cross-application "unapproved services" indicator (dropped; see proposal — the applications list is
  metadata-only and its fallback would ship nothing).
- Chat's offline-access flow, the Scheduler client, Core changes.

## Decisions

### D1 — Dispatch in a pure util, consumed by the row; not inside the auth-buttons component

A pure `getExternalServiceRowAction(service)` in `external-service-auth-utils.ts` returns an
`ExternalServiceRowAction` enum member (`SignIn` / `Consent` / `None`), and `ResourceMultiAuth` chooses which
component to render from it. `ExternalServiceAuthButtons` keeps a narrowed guard admitting only `OAUTH` and
`API_KEY`.

The alternative — teach `ExternalServiceAuthButtons` about consent — was rejected. That component is already
298 lines carrying OAuth redirect state, localStorage handoff, and a module-level `isSignInProcessed` latch;
consent shares none of it. Splitting the decision out as a pure function also makes the dispatch table
directly unit-testable without rendering, which is where most of the specs' scenarios live. A `switch` over
the enum with no `default: SignIn` is what keeps the next unknown type inert.

### D2 — Never-selectable in the component, not excluded per caller

`ResourceAuthentication`'s filter already keeps an excluded type visible when it is the *current* selection —
exactly the required behaviour — so `DIAL_NATIVE` joins `authOptions` and rides that mechanism.

It is **not** excluded through each caller's `excludeAuthTypes`, though. That prop defaults to inclusive: a
third caller, or a caller that forgets, would silently offer `DIAL_NATIVE` as a choice — the same
"unrecognised input falls through to an action that cannot work" shape this change exists to remove. Instead
`NEVER_SELECTABLE_AUTH_TYPES` in the component filters it unconditionally, so no caller can opt in by
omission and the toolset caller needs no change at all. `excludeAuthTypes` keeps its existing meaning and its
existing single use (`NONE`, from `ResourceMultiAuth`).

Two guards are needed on top: the card must not be clickable when it is `DIAL_NATIVE` (otherwise
`onChangeAuthType` would rewrite `auth_settings`), and `ResourceAuthTypeSection`'s
`isSelected && config.id !== NONE` body condition must also exclude `DIAL_NATIVE` so no empty settings panel
opens. Line 90's `find(...)!` becomes a tolerant lookup — a type absent from the options list renders as a
plain type card rather than crashing.

Alternative considered: a separate enum for external-service auth types. Rejected —
`DialExternalServiceAuthSettings extends DialToolsetResourceAuthSettings`, so the field is genuinely shared,
and a parallel enum would need conversion at every boundary.

### D3 — A new API class for the consent URL family, not a method on `ExternalServiceOpsApi`

`ExternalServiceOpsApi` addresses `/v1/ops/external-service/{signin,signout}` with a body carrying a
`url` scope string. Consent is path-addressed, bodyless, and admin-gated. Mixing them would put two
different addressing schemes behind one class name. A new `ExternalServiceConsentApi extends CoreApi` in
`src/server/core/` gets `grant` / `withdraw`, both over `sendActionRequest` (`POST` / `DELETE`), fronted by
two server actions in `src/app/[lang]/assets-applications/actions.ts` next to the existing
`signInExternalService` / `signOutExternalService`.

### D4 — The boolean response body is not plumbed through

`ServerActionResponse.response` is typed `T extends object`, so a bare `true`/`false` does not fit it — and
does not need to. Both values are success by contract: `false` on `DELETE` means there was nothing to
withdraw, which is the desired end state. `success` alone drives the UI. This removes the only place the
plan implied a model change.

### D5 — `encodeCorePath` for the application path, `encodeURIComponent` for the service id

Core's `ControllerSelector` does `UrlUtil.decodePath(pathMatcher.group("appId"))` against
`(?<appId>.+?)/external-services/(?<id>[^/]+)/consent`, so `/` stays a separator and each segment is
percent-decoded — precisely what `encodeCorePath` (already used by `signInExternalService`) produces. The
service id is a single segment, so `encodeURIComponent`.

Two Core-side edges are recorded here rather than worked around, since neither is actionable from this
repo: `consentDescriptor` decodes a second time (an application name containing a literal `%` would grant one
storage key and redeem another), and the non-greedy `appId` mis-splits an application under a folder
literally named `external-services`.

### D6 — Refresh via `router.refresh()`, matching the existing sign-in/sign-out flow

Both flows re-read rather than patching `app_level_auth_status` locally, so the row shows what Core stored.
`ExternalServiceAuthButtons` already calls `router.refresh()` after every successful sign-in/out, and
`DeleteConfirmationModal` does the same after a destructive action — consent follows the established pattern
instead of introducing a second one. A 404 takes the same path (see D8), which is what makes a stale row
disappear.

### D7 — `DialConfirmationPopup` with `ConfirmationPopupVariant.Danger`, for grant as well as withdraw

The repo has no "I understand" checkbox pattern (the original plan left that conditional), so the
established destructive-confirmation component is the answer:
`DialConfirmationPopup` + `ConfirmationPopupVariant.Danger`, as `EntityView/Modals/Delete` uses. One
component parameterised by grant/withdraw copy, not two near-identical popups.

Danger variant on *grant* is deliberate. The reach of an approval is every user in the installation with
offline access, which is a larger consequence than most deletions in this UI.

### D8 — Error handling is uniform except for 404

All failures show an error notification carrying the server's message and request id (the existing
`getErrorNotification` shape) and leave the row's approval state untouched. 404 additionally triggers the
same re-read as success, because it means the declaration changed underneath us and the row itself is stale.
403 and both 400s are unreachable if D1 and the read-only gating hold; they are surfaced, not special-cased,
so that a regression in either is visible rather than silent.

### D10 — Edit and Delete are hidden on a DIAL-native row

W6's "the only mutation available on the row is consent" is taken literally: a `DIAL_NATIVE` row offers
consent and nothing else. An earlier reading of this design narrowed it to *auth settings* only, leaving the
declaration actions in place; seeing the row rendered settled it the other way.

The decisive argument is not symmetry with the manifest model but a reachable hazard: the Edit form can
change the Service ID, and the consent record is keyed by that id. Renaming an approved service orphans its
approval — the row returns to not-approved while the record survives in Core's storage, which is D3's
delete-and-re-add case reachable by an admin who thought they were fixing a name.

Rows of other types are untouched, and an *unrecognised* type deliberately keeps Edit and Delete: it has no
authentication action, so without them such a declaration could never be removed from this UI.

The cost is accepted: a `DIAL_NATIVE` declaration created through the API cannot be renamed or removed here.
That is consistent with it not being creatable here either.

### D9 — Admin gating reuses `useIsReadOnlyAdmin`

This UI has exactly two personas, `FULL_ADMIN` and `READ_ONLY_ADMIN` — there is no application-owner
persona here, so the original plan's "not app owners with write access" reduces to hiding consent from
read-only admins, consistent with how `ResourceMultiAuth` already gates Edit/Delete.

Worth noting: `ExternalServiceAuthButtons` currently ignores `isReadOnlyAdmin` entirely, so Log in is
visible to read-only admins today. Consent will be the first auth action gated in this panel. That
inconsistency is deliberate — see the risk below — and existing sign-in behaviour is left alone.

## Risks / Trade-offs

- **Core's `hasAdminAccess` probably admits read-only admins too** (they must read Core resources at all),
  which would make this UI the only thing stopping a read-only admin from granting installation-wide
  consent → the UI gate ships as specified; the question of narrowing Core's check to a write-capable admin
  role is raised upstream on PR #1815 rather than compensated for here.
- **`router.refresh()` while the Properties panel holds unsaved edits** can leave the panel's etag stale, so
  a later save conflicts → same exposure the existing sign-in/sign-out flow already has; consent actions
  render only in list mode (not inside the service edit form), which keeps the window small. Not widened by
  this change.
- **The type cannot be created from this UI**, so any manual or browser-driven verification needs a
  `DIAL_NATIVE` service created through the API or a mocked payload → component tests drive it from fixture
  props, which covers every scenario in the spec; the browser pass needs an API-seeded application.
- **PR #1815 is a draft and a reviewer has asked for it to be split**, so the landing order may change →
  D1's unknown-type-is-inert dispatch and the absent-status handling mean the row renders harmlessly if the
  type arrives before the endpoints. Only the grant/withdraw calls depend on the endpoints being merged.
- **Adding `DIAL_NATIVE` to the shared `ToolsetAuthType` enum makes it reachable from toolset code** unless
  excluded → excluded explicitly at the toolset caller (D2), and covered by a spec scenario asserting
  toolset options are unchanged.
