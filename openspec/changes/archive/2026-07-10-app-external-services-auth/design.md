## Context

DIAL Core applications support an `external_services` map — a set of named external integrations each with independent auth configuration (OAuth 2.0 or API key). The admin frontend already has a complete auth configuration and login/logout system for asset toolsets (`Assets/Resources/Auth/`). That system is tightly coupled to `DialToolsetResource`, making it reusable only for toolsets.

The admin frontend currently has no way to view or manage app external services. The `GET /v1/applications/{appId}` response already returns `external_services` with per-user auth statuses, so no additional fetch is needed. Changes are saved via the app's main PUT (Core processes `external_services` in the app body on write), keeping the UX consistent with the rest of App Properties.

## Goals / Non-Goals

**Goals:**
- Expose external services CRUD in App Properties (add, edit, delete services)
- Support login/logout per service (APPLICATION + USER credential levels)
- Generalize `ResourceAuthentication` so it is reusable across toolsets and external services without duplicating the component
- Add an OAuth callback page for the external service sign-in flow

**Non-Goals:**
- External services management for static-config (config-file) applications (read-only status display is fine, but editing is blocked on the backend for static apps)
- Exposing the `GET /v1/applications/{appId}/external-services` list endpoint (the app GET already carries this data)
- Supporting GLOBAL credential level for external services (core only supports APPLICATION + USER)

## Decisions

### D1: Save via app PUT, not external-service CRUD endpoints

**Decision:** Buffer external service edits in local app state; persist via the existing app Save button (`PUT /v1/applications/{appId}`). Do not call the dedicated external-service CRUD endpoints (`PUT/DELETE /v1/applications/{appId}/external-services/{id}`) from the frontend.

**Rationale:** Keeps UX consistent — users already expect the Save button to commit all changes. Core's app PUT handler calls `ExternalServiceService.processOnWrite`, which reconciles the full `external_services` map. Separate per-service API calls would create partial-save complexity and require a separate refresh cycle.

**Alternative considered:** Immediate CRUD per service (like a standalone panel). Rejected because it conflicts with the existing "discard changes" flow and would leave services in an inconsistent state if the user discards app-level changes after saving a service.

**Strip statuses before PUT:** Auth statuses (`app_level_auth_status`, `user_level_auth_status`, `global_auth_status`) are server-computed on read. The server action for app update must omit these fields from the `auth_settings` map before sending to Core to avoid unexpected behavior.

### D2: Generalize `ResourceAuthentication` (Option A)

**Decision:** Refactor `ResourceAuthentication` and `ResourceAuthTypeSection` props to accept `authSettings` directly + a `name` identifier, instead of a full `DialToolsetResource`. Add an optional `onChangeForwardPerRequestKey` callback for toolset-specific behavior. Add a `redirectUrl` prop for the OAuth `redirect_uri` (defaulting to the existing toolset callback URL).

**Rationale:** Avoids duplicating ~150 lines of auth configuration UI. The component logic is identical for toolsets and external services — only the wrapping entity type differs.

**What changes in existing callers:** The asset toolset view (`Assets/Toolsets/View/View.tsx` or equivalent) passes:
```
name={toolset.name}
authSettings={toolset.auth_settings}
redirectUrl={TOOLSET_AUTH_REDIRECT_URL}
onChange={(auth_settings) => onChange({ ...toolset, auth_settings })}
onChangeForwardPerRequestKey={(val) => onChange({ ...toolset, forward_per_request_key: val })}
```

### D3: New `ExternalServiceOpsApi` class (Core-direct)

**Decision:** Create a `ExternalServiceOpsApi` class parallel to `ToolsetOpsApi`, targeting Core directly (`DIAL_CORE_API_URL`). Register it in `api.ts`.

**Rationale:** Sign-in/sign-out for external services are direct Core passthrough operations (same as toolsets). Routing through the admin backend would add unnecessary overhead.

### D4: New `/external-service-signin` OAuth callback page

**Decision:** Create a dedicated Next.js page at `app/[lang]/external-service-signin/page.tsx`. It reads state from `localStorage`, calls `signInExternalService`, and redirects to the original URL.

**Rationale:** The external service state shape differs from the toolset state shape (appId + serviceId vs toolsetId). A shared page would require branching on state type. Separate pages are clearer and independently testable.

**State shape stored in localStorage before OAuth redirect:**
```ts
{
  callbackUrl: string;       // pathname to return to
  appId: string;             // decoded app id (e.g. user-bucket/path/to/app)
  serviceId: string;         // external service map key
  credentialsLevel: string;  // 'APPLICATION' | 'USER'
}
```

### D5: Login popup — same pattern as toolsets, APPLICATION + USER levels

**Decision:** Reuse `ResourceLoginPopup` and `ResourceLogoutPopup` as-is but with label overrides (APPLICATION → "Application", GLOBAL → not shown). Create `ExternalServiceAuthButtons` as a sibling to `ResourceAuthButtons`, adapted for the external service URL and credential levels.

**Rationale:** The popup UX (choose level → confirm) is identical to toolsets. Reusing the existing popups avoids duplicating modal UI. `ExternalServiceAuthButtons` handles the differing URL construction, API endpoints, and level labels.

**Login status rule:** Show as logged in if `app_level_auth_status === SIGNED_IN` OR `user_level_auth_status === SIGNED_IN`. Show Logout if any level is signed in. Show Login if not fully signed in (not both levels signed in). Hide both buttons if `authentication_type === NONE`.

## Risks / Trade-offs

- **Status staleness after login/logout** → After sign-in/sign-out, the component re-fetches the app to get updated statuses (or the parent View triggers a refresh). The existing toolset flow handles this via `router.push(same-url)` to force a server-side re-render.

- **Static-config apps** → External services on static apps are read-only (backend enforces this). The edit/add UI should be hidden or disabled when the app is a static-config deployment. Detection: static apps have `reference === name` and no `function` field, or we can check if the response returns a 400 on edit attempts. For safety, the component disables editing when `isReadOnlyAdmin` is true; static-config detection can be added as a follow-up.

- **Service ID collision** → If a user enters an ID that already exists and clicks Save, the PUT in `external_services` silently overwrites the existing service. The edit form should warn if the entered ID matches an existing service when adding (not editing).

- **Auth settings stripping** → If Core ever changes which fields are read-only, the frontend's stripping logic may need updating. Mitigated by stripping only the known status fields (`*_auth_status`).
