## Context

See `proposal.md` for the problem and scope. Core-direct role references are bare names; Core's merged configuration gives a platform resource precedence over a file-defined role of the same name. `KeyRoles` and the shared `AssetRoles` grid currently lack an open action. `RouteRoles`, reused for both Core-backed object routes and legacy admin-backend routes, drops the open action when its options contain Core origins and otherwise sends it to the legacy role route. Origin-bearing options can be empty or partial, and an existing grant can be represented by a synthetic name-only row.

The platform role detail page currently chooses a source solely by `configFile=true` and treats unsuccessful reads as not found. `getRole` uses `assetApi.getMergedWithEtag`: its content read preserves a failed response's HTTP status, but a successful content read followed by missing or failed metadata produces a failure without status. `configFileApi.getEntity` retains the failure status. The existing role view uses `isConfigFileSource` to enable read-only context and hide the ADMIN/CORE selector; its cleanup restores context on unmount.

## Goals / Non-Goals

**Goals:**

- Make every existing Core-direct role grid open a referenced role in a new tab, independent of option-list completeness or row origin, without changing mutation permissions.
- Resolve bare role references according to Core precedence; make the actual source govern read-only behavior.
- Retain explicit file-root navigation and legacy admin-backend navigation.
- Distinguish confirmed absence from access, service and indeterminate failures.

**Non-Goals:**

- Change role memberships, picker merging, duplicate-name precedence, or file-role write capabilities.
- Apply fallback to other entity types or redesign role detail views.
- Introduce a new backend endpoint or route.

## Decisions

### D1. A role reference opens a source-neutral detail address

Use the existing open-in-new-tab operation and URL builder with `ApplicationRoute.PlatformRoles`, using the reference name as the path segment. Do not add a `configFile` query parameter merely because a picker row has file origin: a reference means Core's effective role, not an assertion about the record's origin. This also covers synthetic rows when a role list is empty or incomplete. Keep the existing encoded URL-building convention, with tests for names containing percent or other supported reserved characters and exactly one decode at the detail boundary.

`KeyRoles` and `AssetRoles` keep their existing grids and action construction; add open independently of the conditional remove action. The action is present for read-only admins, file-sourced parent views and the unrestricted `userRoles` display, without enabling mutation. Retain the existing accessible, localized action control.

**Alternative:** construct a flagged URL from each option's origin. Rejected: the stored reference does not carry origin, a partial list can be misleading, and same-name platform entries supersede file entries.

### D2. Explicitly identify the owning surface for embedded routes

Thread an explicit Core-versus-admin-backend navigation context from the owning surface through `ObjectAppRoutes` / `RouteContent` to `RouteRoles`, and through any other Core-backed caller of that shared route grid. Core routes always open the platform-role reference URL, including when the options are empty or partial; legacy admin-backed callers retain `/roles`. Do not infer this distinction from `hasConfigEntityOrigin(roles)`, `isAppRunnerView`, or whether an option exists. Preserve the current row construction and read-only/remove rules.

**Alternative:** choose the URL from option origin or the presence of a Core-origin row. Rejected: failed or empty reads erase the evidence of source and can misroute a real reference.

### D3. Resolve implicit and explicit sources separately

On `platform-roles/[id]/page.tsx`, normalize the name consistently once. For an unqualified address, read the platform resource first. On success render it with its ETag and `isConfigFileSource=false`. Only a confirmed content 404 permits a config-file role read; on success render that result with `isConfigFileSource=true` and the existing file-source view behavior. If both sources report 404, invoke the existing not-found route. A name appearing in both sources consequently resolves to the platform role.

For `configFile=true`, read only the file source and render it read-only, regardless of a same-name platform role. A file-source 404 is not found; other failures follow D4. Do not redirect either path: the unqualified URL remains an effective-reference URL, and the flag remains the existing explicit source selector. File-root links retain their flag unchanged.

**Alternatives:** redirect after fallback to `?configFile=true` — rejected because it changes an effective-reference address into a source-specific address; always prefer file — rejected because it disagrees with Core collision precedence.

### D4. Preserve failure provenance and never interpret uncertainty as absence

Use the content response's status as the only platform absence signal for this resolver. A metadata failure after successful content is an error, even if its current envelope says `Not Found` without a status; it cannot trigger fallback. Do not change the semantics of `getMergedWithEtag` for unrelated callers. If the existing response contract cannot identify the relevant stage reliably, introduce a role-scoped server-side resolver or a backwards-compatible result discriminator with focused tests. Preserve 401/403, 5xx, cancellation, transport failures and malformed/indeterminate results as errors, and surface them through the established server error boundary rather than `notFound()` or silent logging. Do not expose backend secrets in the error UI.

Config-file read access is restricted: a refused read is an access error, not an empty population. An unqualified platform 404 may require a file lookup, but no UI or backend permission is bypassed. Explicit file reads obey the same failure classification.

**Alternative:** fallback whenever `response` is null or `success` is false. Rejected: it can mask authorization and service failures and show a shadowed file role as if it were effective.

### D5. Preserve existing view semantics and state

Pass the resolved source and ETag to `RoleAssetView`; do not rely only on the URL query to determine editability. Retain the view's existing context cleanup, field/row mutation guards, hidden format selector for file roles, and normal platform-role permission checks. Continue showing model-option warnings as before and do not let an unrelated model option read decide role existence.

## Risks / Trade-offs

- **[Bare URLs can resolve differently after a platform role is added]** → This is intentional: they describe Core's effective role. Explicit file-root URLs continue to identify file roles.
- **[Metadata errors are collapsed]** → Classify only the content GET's actual 404 as platform absence; treat metadata failure as an error and cover it separately in tests.
- **[Shared route UI silently defaults to the wrong source]** → Pass source context from the owning surface, and test Core-backed and legacy callers with empty, partial and complete option lists.
- **[Read-only state could leak or permit a file write]** → Derive the flag from the resolved result and test mutation controls, format selector, cleanup and subsequent platform navigation.
- **[Permission failures could be mistaken for absence]** → Test 401/403, 5xx, network and missing-status outcomes for both reads; surface an error without showing a different role.

## Migration Plan

Frontend-only deployment; stored role references and backend data do not change. Existing explicit file-root URLs remain valid. Roll back by reverting the frontend change; no data migration is needed.

## Open Questions

None for the agreed scope. During implementation, confirm the Core endpoint status contracts and the existing error-boundary presentation for access and service failures before finalizing the resolver.
