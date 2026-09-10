## Context

Core's `v1/settings/platform/global` singleton has no separate create/update endpoint — one `PUT`
does both, distinguished only by whether a blob currently exists (`GET` returns 404 when it doesn't).
`EtagHeader.validateIfMatch` on the Core side (`storage/.../util/EtagHeader.java`) treats the mere
*presence* of an `If-Match` header as an assertion that the resource exists, per RFC 7232 — this holds
even for `If-Match: *`, since `*` means "some representation exists," which is false for a singleton
that was never written via the API.

`BaseApi.putActionWithEtag` (`apps/ai-dial-admin/src/server/base-api.ts`) always attaches `If-Match`,
falling back to `DEFAULT_ETAG` (`'*'`, `apps/ai-dial-admin/src/constants/api-headers.ts`) whenever the
caller's `etag` is falsy:

```ts
protected async putActionWithEtag<T extends object>(url: string, dto: T, token: Token, etag: string) {
  return this.putAction<T>(url, dto, token, { [IF_MATCH]: etag || DEFAULT_ETAG });
}
```

Every other entity (`models-api.ts`, `roles-api.ts`, `keys-api.ts`, `interceptors-api.ts`, …) avoids
this failure mode structurally: creation goes through a separate `POST` method with no `If-Match` at
all, and `putActionWithEtag` is reached only from an update path where the entity is already known to
exist (its etag came from a prior successful read). System Properties has no create/update split — it
is one PUT-only singleton — so its first-ever save is the only call site that reaches
`putActionWithEtag` for something that might not exist yet.

One existing call site, `utility-api.ts`'s config-version write, passes `DEFAULT_ETAG` **explicitly**
to mean "overwrite unconditionally, but the resource is always present" (a startup-created resource
that is never absent). That usage is intentional and must keep working.

`handleSettingsGet` (Core) never validates a conditional header and never sets an `ETag` response
header, on either 200 or 404 — only `handleSettingsPut`'s success response carries one. So there is no
real etag value a subsequent GET can ever hand back for this singleton; the only fact a GET yields is
existence (200 vs. 404), never a value to compare against. Any design that tries to thread a "real
etag from the last read" through to the save is chasing a value that doesn't exist — simplified below.

## Goals / Non-Goals

**Goals:**
- The System Properties page saves successfully on an environment where no global-settings blob has
  ever been written via the API.
- The distinction between "no blob yet" (omit `If-Match`, effectively a create) and "blob exists"
  (send `If-Match` with its real etag, guarding against a concurrent edit) is explicit in the code,
  not implied by a fallback value that happens to work in one case and not the other.
- The existing behavior of every other `putActionWithEtag` call site (all of which are genuine
  updates to entities that already exist) is unchanged.
- The frontend's `GlobalSettings` type reflects both fields Core's `GlobalSettings` actually has, so
  the "spread previous settings, replace only `globalInterceptors`" merge in `SystemProperties.tsx` is
  type-backed rather than incidental.

**Non-Goals:**
- Adding a `retriableErrorCodes` editing UI — out of scope; the fix only needs the field to survive
  the round trip.
- Changing `EtagHeader` semantics on the Core side — Core's behavior is RFC-7232-correct; this is a
  frontend-only fix.
- Restructuring `interceptors-api.ts`/`keys-api.ts`/other entities' create/update split — unaffected,
  used here only as the reference pattern.
- General retry/optimistic-concurrency UX for a real 412 caused by a genuine concurrent edit (an
  admin editing on two tabs) — that path already surfaces the error via `getErrorNotification`; this
  change only fixes the false-positive 412 on first save.

## Decisions

### 1. Make "omit `If-Match`" an explicit, distinct call shape — not a falsy-etag fallback

`putActionWithEtag` keeps its signature but drops the `|| DEFAULT_ETAG` fallback: the header is set
only when a caller passes a defined `etag`. Callers that want the existing "unconditional write,
resource known to exist" behavior (`utility-api.ts`) keep passing `DEFAULT_ETAG` explicitly, which is
unchanged. System Properties' save path passes `undefined` when the prior read confirmed no blob
exists, which now genuinely omits the header rather than substituting `'*'`.

**Alternative considered:** add a separate `postActionWithoutEtag`/create-style method mirroring the
`interceptors-api.ts` split. Rejected: there is only one Core endpoint (`PUT`) for this singleton;
inventing a second frontend method for the same HTTP verb and URL would be a distinction without a
difference, and the sibling entities' create/update split exists because *they* have two Core
endpoints (`POST` create, `PUT` update) to mirror — this singleton doesn't.

### 2. Track "does a settings blob exist" as a plain boolean — not a real etag

Since Core's GET never returns a real etag either way, there is nothing to gain from a tri-state or
from threading a "real etag" value at all. `page.tsx` tracks a simple `doesSettingsExist: boolean`
from the GET outcome (`true` on 200, `false` on 404), and the save call is equally simple:
`doesSettingsExist ? DEFAULT_ETAG : undefined` passed as the `etag` argument — `DEFAULT_ETAG` (`'*'`)
asserts existence on an update, `undefined` omits `If-Match` on a create.

**Alternative considered:** a tri-state carrying a "real etag" for the exists case. Rejected once it
became clear Core's GET never supplies one — there is no third state to model; existence is binary and
that's all this endpoint can ever tell the frontend.

### 3. Add `retriableErrorCodes` to the frontend `GlobalSettings` type

```ts
export interface GlobalSettings {
  globalInterceptors: string[];
  retriableErrorCodes?: number[];
}
```

The field stays optional and unedited by any UI control; declaring it only makes the existing
spread-based merge in `changeInterceptors` (`SystemProperties.tsx`) type-checked rather than silently
relying on a field TypeScript doesn't know about. No behavior changes for this field beyond making its
survival visible in the type.

### 4. Surface read failures on the full-settings fetch, matching the existing `optionWarnings` pattern

`page.tsx`'s settings fetch starts checking `res.success`; a failure that isn't the expected 404
(confirmed-absent) pushes a warning through the same `optionWarnings` mechanism already used on this
page for the interceptor option list, instead of silently proceeding as if nothing was read.

## Risks / Trade-offs

- **[Risk]** Removing the `|| DEFAULT_ETAG` fallback from `putActionWithEtag` changes its default
  behavior for any call site that relied on the fallback rather than passing an etag explicitly. →
  **Mitigation**: grep confirms every current call site either passes a real etag from a prior read
  (all entity update paths) or passes `DEFAULT_ETAG` explicitly (`utility-api.ts`); none relies on the
  implicit fallback. Add a test asserting the explicit-`DEFAULT_ETAG` call site is unaffected.
- **[Risk]** No real concurrent-edit (lost-update) protection exists for this endpoint — two admins
  saving around the same time will have the second save silently win. → **Mitigation**: accepted as a
  Core API limitation, not something the frontend can fix; out of scope for this change.
- **[Trade-off]** This fix is scoped to the System Properties singleton rather than generalized into a
  shared "create-or-update singleton" helper, since it's the only PUT-only singleton in the app today.
  If a second such singleton appears, revisit extracting the pattern then rather than speculatively now.

## Migration Plan

No data migration. This is a client-request-shape fix; Core is unchanged. Rollout is a normal
frontend deploy — no feature flag needed, since the failing case (first save with no existing blob)
was unconditionally broken before and unconditionally fixed after, with no behavior change for
environments where a settings blob already exists.

## Open Questions

None — the fix is fully determined by the traced root cause; no further product decisions are needed.
