## Context

Core (epam/ai-dial-core#2311) lets an OAUTH external service carry `auth_settings.discovery_url`. Its behaviour, as read from the PR branch (`ResourceAuthSettingsService`, `ExternalServiceService`, `openspec/specs/external-services`):

| PUT body (OAUTH) | Stored service | Core |
| --- | --- | --- |
| `discovery_url`, no client | none, or a non-OAUTH type | registers a client, PKCE if S256 offered, `dynamically_registered: true` |
| full client, no `discovery_url` | none / non-OAUTH | stores as sent, no outbound call |
| full client + `discovery_url` | none / non-OAUTH | stores, fills PKCE, scopes, `resource` from metadata, no registration |
| anything | already OAUTH | **update branch**: keeps omitted fields, never registers, never reads metadata |
| `client_id` + `client_secret` | registered | converts to static (`dynamically_registered: false`) |
| `discovery_url: ""` | already OAUTH | clears it (omitted keeps it); on create a blank is normalised to null |

The panel today: `ResourceMultiAuth` (external services list + Add/Edit form) → `ResourceAuthentication` (auth type cards; stamps `redirect_uri = <origin>/external-service-signin` on choosing OAUTH) → `ResourceAuthTypeSection` → `ResourceOAuthSection`, which is shared with toolsets. It declares `AuthType.DYNAMIC` but offers only "Existing client", with the `Select` pinned to `AuthType.EXISTING`. Changes are local until `Apps/View.onSave` PUTs the whole application through `updateApp`; on success it calls `router.push` + `router.refresh()`, so the page re-reads the application from Core.

Validation is registered per field in `SaveValidationContext`. `ClientIdControl`, `ClientSecretControl` and `EndpointControl` set their field on mount/change and clear it on unmount, so a control that is not rendered cannot keep Apply disabled.

## Goals / Non-Goals

**Goals:**
- Create an external service whose client Core registers, from a Discovery URL alone.
- Show and manage a registered client without letting the panel send anything Core rejects.
- Keep toolsets, sign-in and static external services byte-for-byte unchanged in behaviour and payload.

**Non-Goals:**
- Toolset registration, repair/re-register, row-level error marking, changes to sign-in (see proposal).

## Decisions

### D1. Three-state registration mode: stored state derives it, a local view value covers the one gap

```
enum ClientRegistrationMode { Existing, Automatic, Registered }

stored dynamically_registered === true  ──► Registered   (derived, no local state needed)
stored static / new, user picks Existing ──► Existing     (default)
new, user picks "Register automatically" ──► Automatic
```

The mode is inferred from `auth_settings` wherever the settings can tell it: `dynamically_registered` means Registered. The one case they cannot is a new service that has picked "Register automatically" with the Discovery URL still empty — its settings are identical to a new service in "Existing client" with nothing filled in. That single case is held in a local `useState` inside `ResourceOAuthSection`, initialised from the derivation and changed only by the mode `Select` and the "Use an existing client instead" action. It never reaches the payload.

Once a Discovery URL exists and there is no `client_id`, the inference and the local value agree, so the local value is a view detail, not a second source of truth: remounting the section (switching auth type cards and back) re-derives it. A remount losing an empty "Automatic" selection is acceptable — the form is empty at that point.

*Alternative considered — infer only (`discovery_url` set ∧ no `client_id`).* Rejected for the empty-URL gap: choosing "Register automatically" would visibly snap back to "Existing client" until the user typed a URL, and Discovery URL's "required" rule could not apply to a field the form believes is optional.
*Alternative — a marker field in `auth_settings`.* Rejected: it would be sent to Core, which fails unknown fields on some write paths.

### D2. When the choice is offered is decided by the stored type, not the edited one

`ResourceMultiAuth` computes `isDynamicRegistrationOffered = stored service absent || stored authentication_type !== OAUTH`, where "stored" is `services[editState.originalId]` — the value in the application as loaded, not `editState.service`. It passes the flag down; `ResourceOAuthSection` renders the mode `Select` only when it is true. A second prop, `isDiscoveryUrlSupported`, is set unconditionally by `ResourceMultiAuth` (see D4).

Reason: Core takes the update branch whenever the stored service is already OAUTH, and never registers there. If the flag followed the edited type, a user could open a stored OAUTH service, switch to API Key and back to OAUTH, pick "Register automatically", and send a body Core treats as an update — keeping the old client and silently doing nothing. Keying off the stored type removes the trap. Toolsets never receive the flag (default `false`), which is also what keeps Discovery URL and "Register automatically" off the toolset form.

For an already-stored OAUTH service the mode `Select` is not rendered: Registered if `dynamically_registered`, Existing otherwise, as the requirements say.

### D3. Payload scrubbing lives in pure helpers

New `utils` under `components/Assets/Resources/Auth/utils/` (feature-local, per `utils.md`):

- `toAutomaticSettings(authSettings)` → `{ authentication_type: OAUTH, discovery_url }` and nothing else. Drops `client_id`, `client_secret`, `client_secret_hint`, both endpoints, `scopes_supported`, `resource`, PKCE fields, `token_endpoint_auth_method` and `redirect_uri` (Core answers `400` if a registration body carries values for these, and `redirect_uri` outside its allow-list). Core ignores `token_endpoint_auth_method` there, but it is dropped anyway so the "no other OAuth field" acceptance line is literal.
- `toExistingSettings(authSettings, redirectUri)` for Automatic → Existing: restores `redirect_uri` (what `ResourceAuthentication` stamps on choosing OAUTH) and an empty `client_id`, keeps `discovery_url` (it is optional there and, with a full client, makes Core fill PKCE/scopes/resource on create).
- `toStaticFromRegistered(authSettings)` for Registered → Existing: clears `client_id` and `client_secret` so the admin supplies their own, resets `token_endpoint_auth_method` from `none` to `client_secret_basic` (a client with a secret contradicts `none`), and leaves every other field as read — endpoints, scopes, `resource`, PKCE pair and the stored `redirect_uri` — because Core keeps the PKCE pair while `code_challenge_method` is unchanged and sign-in never reads `redirect_uri`.

`ResourceAuthentication` already owns the `redirect_uri` stamp, so it passes the computed redirect URI down (a new optional prop) rather than the section recomputing `window.location.origin + …`.

### D4. Discovery URL control reuses `EndpointControl`

Rendered by `ResourceOAuthSection` only when `isDiscoveryUrlSupported` is set. `ResourceMultiAuth` always sets it (every external-service OAuth form, stored or new, since Core keeps or clears `discovery_url` on update); toolsets never do. It is a separate prop from `isDynamicRegistrationOffered` (D2) on purpose: a stored OAUTH service shows its Discovery URL but is not offered automatic registration. `EndpointControl` already validates an absolute `http`/`https` URL (`getUrlError`), registers its field in `SaveValidationContext`, resets it on unmount and accepts a `caption`. `required` is `mode === Automatic`; this satisfies "Apply disabled without a Discovery URL" with no new validator.

Clearing semantics follow the existing `resource` field: `EndpointControl` emits `undefined` on clear, and the section maps it to `''`, because on an update an omitted key keeps the stored value and only a blank clears it. On create Core normalises a blank to null, so sending `''` is safe for a new static service.

*Alternative — a new `DiscoveryUrlControl`.* Rejected: it would duplicate validation and the unmount cleanup.

### D5. Validation in Automatic mode is "render less", not new rules

In Automatic mode the section renders only the mode `Select` and Discovery URL. `ClientIdControl`, `ClientSecretControl` and the required endpoint controls are unmounted, and their unmount cleanup removes their validation fields, so Apply is no longer blocked. The requirements doc points at `utils/validation/toolset-auth-error.ts`; no change is needed there — it only maps a value to an error, and the gating is by which controls are mounted. The new rule lives in the Discovery URL control's `required` prop.

### D6. Registered state is the existing form, disabled, plus a banner and one action

In Registered mode the section reuses the existing controls with `disabled`: client id, scopes, both endpoints, `resource`, token auth method, PKCE method and Discovery URL; the client secret control is omitted (Core never returns a secret). A `Notification` ("Registered by DIAL Core") sits above them, and an `OutlinedButton` "Use an existing client instead" applies `toStaticFromRegistered`. Both are hidden for a read-only admin, as are other edits via `useIsReadOnlyAdmin`. While signed in, the section's existing "locked" behaviour (`isAuthDisabled`) disables the action too, consistent with every other field.

The disabled fields must not push `client_secret` or any change into the payload: with nothing edited, the service round-trips exactly as read, which is what Core's "send the service back as read" contract requires (and is what makes "edit the display name keeps client id and PKCE challenge" hold).

### D7. Read-after-save needs no new code path, only a check

`Apps/View.onSave` already ends with `router.refresh()`, and the page server component re-fetches the application, giving the registered `client_id` and `dynamically_registered`. The one thing to verify while implementing is that `selectedApp` is rebuilt from the refreshed `originalApp` after a save instead of keeping the pre-save local copy; if it is not, the registered values would not appear until the next navigation, and the fix belongs in that reset, not in a second fetch.

### D8. Errors stay on the existing toast path

A failed registration fails the whole save with `400` and `External service '<id>': <reason>`; `onSave` already shows `res.errorHeader`/`res.errorMessage` and saves nothing. No parsing, row marking or per-reason hints (decided with the requester). The prefix Core adds already names the service.

### D9. UI-4 is verification only

`TokenEndpointAuthMethod.CLIENT_SECRET_NONE` is `'none'` in `models/dial/resource.ts` and both OAuth sections list it as "None". Work is limited to confirming `models/dial/toolset.ts` (a second `TokenEndpointAuthMethod` enum, used by the toolset `OAuthSection`, which lowercases the stored value) agrees, and adding component tests that a stored `none` selects "None" and choosing it emits `none`.

### D10. Deployment docs

This repo has no Helm chart or deployment guide (they live in other repos, outside this change); the deployment-facing record here is `docs/INFRA-CHANGELOG.md`. Add an entry under the existing `0.24.0` section (the unreleased one, confirmed), in the file's `Added` / area style, stating: the feature needs Core with #2311; `toolsets.security.allowedRedirectUris` must contain `<admin origin>/external-service-signin` (plus Chat's callback if users sign in from Chat); with the default empty list every "Register automatically" save fails with `400`; with a list lacking the admin callback the save succeeds but panel sign-in fails and the client must be deleted and re-added after the list is fixed. If an upgrade plan under `docs/upgrade-plans/` is warranted for the release that ships this, it is added there too.

## Risks / Trade-offs

- **Silent no-op on a stored OAUTH service** (Core update branch never registers) → D2 keys the choice off the stored type.
- **A registered `redirect_uri` that is Chat's callback** is sent back as read on conversion → harmless: sign-in uses the panel's own origin and Core's allow-list accepts it. Not overwritten, so the stored value stays a faithful record.
- **Renaming the Service ID of a stored OAuth service** deletes the old key and adds a new one in `ResourceMultiAuth.onSave`; Core sees a create. For a registered client the body has a client id but no secret (Core never returns it), so Core answers `400`. This already affects static clients with a hint and is not made worse here; left out of scope and noted in the proposal. If it proves common, disabling the ID field for a stored OAuth service is a separate change.
- **Edit does not read metadata.** Adding a Discovery URL to an already-stored static service stores it, but Core does not fill PKCE/scopes/`resource` on an update. The "issuer URL gets PKCE" behaviour holds on create or a switch to OAUTH only; the spec states it that way rather than promising it on edit.
- **Local view value lost on remount** (D1) → only the empty "Automatic" selection, which has nothing to lose.
- **Shared-component regressions for toolsets** → every new branch is behind an opt-in prop; tests assert toolset rendering and payload are unchanged.
- **Core older than #2311** rejects `discovery_url` → called out in the INFRA changelog; only visible once a Discovery URL is entered.

## Open Questions

- Whether the first mode shown for a *new* OAuth service should stay "Existing client" once automatic registration is common — the requirements say keep it, and this design does.
