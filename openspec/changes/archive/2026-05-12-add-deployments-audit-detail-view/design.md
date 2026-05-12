## Context

The Activity Audit detail page (`src/app/[lang]/activity-audit/[id]/page.tsx`) currently resolves activities from the admin backend only. It fetches:

1. The activity record via `activityAuditApi.getActivityById`.
2. The sibling activity list (to identify "current" revision) via `activityAuditApi.getActivitiesList` filtered by `resourceId`.
3. The current and previous-revision entity snapshots via `activityAuditApi.getRevisionDetails`, where the snapshot URL is composed from a per-resource-type fragment returned by `getRevisionRouteForEntityType`.

The page then renders `AuditView`, which exposes `Comparison: Before/After`, `View: All parameters | Diff`, an optional JSON toggle, a Resource Rollback button, and the diff body via `EntityDiff → DiffSection → AuditEntityGrid`.

The diff engine is already resource-type agnostic in its core. `generate-diffs.ts` walks two `Record<string, unknown>` blobs (the before/after snapshots) and emits diffs grouped by section. Section grouping is controlled by `EntityParameterKeys`, `arrayParameterKeys`, `arrayObjectParameterKeys`, and `separateObjectParameterKeys` in `src/components/ActivityAudit/constants.ts`. Section headers come from a per-key i18n lookup in `DiffSection` (`EntityFieldsI18nKey`).

The deployment-manager backend already exposes the endpoints we need:

- `GET /api/v1/activities/{activityId}` (per-activity record).
- `GET /api/v1/images/definitions/{id}/revision/{revision}` (image snapshot, polymorphic by `$type`).
- `GET /api/v1/global-whitelist/image-build/revision/{revision}` (firewall snapshot, bare `List<String>`).

The Deployments list view delivered in `2026-05-12-add-deployments-audit-view` has `openInNewTab` and the row-body click handler short-circuited to no-op for every Deployments-view row. With detail rendering landing for image and firewall, we re-enable those navigations selectively.

Stakeholders: frontend team (this change); audit detail-view team for containers (follow-up change to enable the remaining six `*Deployment` resource types).

## Goals / Non-Goals

**Goals:**

- Reach feature parity with the Config view for image-definition and global-firewall activities: end-to-end detail rendering, Before/After diff, View all-vs-diff toggle, JSON toggle, Comparison selector, copy-to-clipboard for activity ID.
- Reuse every existing rendering primitive — `AuditView`, `EntityDiff`, `DiffSection`, the simple/complex diff utilities, the `Accordion`, the `ViewHeader`. No new section component is introduced.
- Keep the deployment-manager API surface narrow: only what we need to read snapshots; no new write endpoints, no rollback wiring.
- Keep the row-interaction logic on the Deployments list view minimal: a single predicate gating the navigation.

**Non-Goals:**

- Container detail rendering (six `*Deployment` resource types) — a separate follow-up change will add these after this one ships.
- Resource rollback for deployment-manager activities — intentionally permanent per issue #3105 requirement #4.
- A non-collapsible Accordion variant — both image and firewall detail use the existing default-open Accordion.
- Activity-type expansions beyond Create/Update/Delete — the back end does not emit them; mockups showing `Launch Succeeded` / `Installation Succeeded` are illustrative only.
- Per-entity Audit tab embedded in container or image detail pages — deferred to a later change.

## Decisions

### D1. Detail page resolves activity owner via admin-first, deployment-manager-fallback

The page tries `activityAuditApi.getActivityById(id, token)` first; on a `null` / non-success response it tries `deploymentAuditApi.getActivityById(id, token)`. If both miss, the existing `notFound()` behavior is preserved. The chosen ordering keeps admin-backend latency identical to today and only adds the second request when the admin lookup actually misses. A boolean local flag `isDeploymentActivity` drives the subsequent snapshot-fetch branch.

Alternatives considered:

- Parallel `Promise.all` against both backends. Rejected: doubles the request volume on every detail page load; admin activities are the majority case today.
- Encode the source backend in the URL (`/activity-audit/deployments/{id}`). Rejected: needs a corresponding URL change in the Deployments grid `openInNewTab` and complicates shareable links — the activity ID alone should be the canonical identifier.

### D2. Snapshot fetching branches per resource type

After the activity is resolved, the page consults `isImageDefinitionResource(resourceType)` and `isGlobalFirewallResource(resourceType)` to decide where to fetch snapshots from:

- Image activities → `imagesApi.getRevisionDetails(url, token)` where `url` is composed from the existing `getRevisionRouteForEntityType` (extended with the four `*ImageDefinition` cases all returning `/images/definitions/{id}/revision/`).
- Firewall activities → `globalFirewallApi.getRevisionDetails(revision, token)`. The endpoint takes only the revision number (singleton resource). The bare `List<String>` response is wrapped to `{ domains: ... }` server-side so the existing diff path treats it like any other entity.

For sibling-activity lookup (used to compute the "current" revision for Comparison: Current), the page uses `deploymentAuditApi.getActivitiesList` with the same `resourceId` / `resourceType` filter shape as the admin path. For the firewall singleton this filter becomes a `resourceType` filter only.

Alternatives considered:

- Introduce a single `deploymentSnapshotApi` that switches internally on resource type. Rejected: each resource type's endpoint has a different path shape; the calling code is the right place for the branch, and the surface area is small (two resource families today).
- Pass the deployment API the raw URL and reuse `getRevisionDetails` shared across both backends. Considered but rejected because the admin `getRevisionDetails` lives on `ActivityAuditApi` and is bound to `DIAL_ADMIN_API_URL`; we want the deployment-manager calls bound to `DIAL_DEPLOYMENTS_API_URL`.

### D3. Predicates colocated with `ActivityAuditResourceType`

Add `isDeploymentManagerResource`, `isImageDefinitionResource`, and `isGlobalFirewallResource` next to the enum in `src/types/activity-audit.ts`. They take a `string | undefined` and return `boolean`. Centralizing the type-set checks makes future expansion (e.g. when container detail ships) a one-line addition.

`isDeploymentManagerResource` returns true for the eleven deployment-manager resource types: the four `*ImageDefinition` subtypes, the six `*Deployment` subtypes, and `ImageBuildDomainWhitelist`.

### D4. Hide rollback at the `AuditView` level, not at the page level

`AuditView` is the only place the Resource Rollback affordance is rendered, so hiding it there keeps the predicate close to the affordance. The page does not need a separate flag.

The render condition becomes `!isReadOnlyAdmin && !isDeploymentManagerResource(activity.resourceType)`. Read-only admins continue to lose the button (existing behavior); deployment-manager activities additionally lose it for every user.

Alternatives considered:

- Pass a `hideRollback` prop down from the page. Rejected: makes `AuditView` consumers responsible for understanding deployment-vs-admin semantics; the predicate is the right abstraction.

### D5. `Domain access policy` row is synthesized on the front end

The back end does not store a `domainAccessPolicy` field on image definitions. The design's `Domain access policy` row is a UI affordance derived from `allowedDomains`:

- `allowedDomains` length `0` → "All domains".
- `allowedDomains` length `> 0` → "Specific domains".

The synthesis happens in `generate-diffs.ts` when the Firewall settings section is being constructed for an image. It inserts a synthetic `domainAccessPolicy` parameter row alongside the real `allowedDomains` rows. The synthetic row participates in the diff like any other simple-type field — if the before/after policies differ (empty vs non-empty list) the row gets a `CHANGED` status; if they match, `MIRROR`.

Alternatives considered:

- Wait for the back end to add a `domainAccessPolicy` field. Rejected: avoidable backend work for a value the FE can derive deterministically.
- Render the policy as a static informational label outside the diff. Rejected: it then doesn't participate in the diff filter / View toggle, which feels inconsistent with the rest of the section.

### D6. `allowedDomains` becomes its own section via `separateObjectParameterKeys`

Add `ALLOWED_DOMAINS = 'allowedDomains'` to `EntityParameterKeys` and include it in `separateObjectParameterKeys`. This is the existing mechanism the diff engine uses to graduate a key out of the default `properties` bucket and into its own section.

The section title comes from extending the `DiffSection` lookup so `'allowedDomains'` maps to the `Entities.FirewallSettings` i18n key. Same path applies to `'domains'` (firewall payload key) → `Entities.GlobalDomainWhitelist`.

Alternatives considered:

- Introduce a brand-new section-grouping concept that lets sections be keyed on `(resourceType, key)` rather than just `key`. Rejected: would let two different resource types put the same key in different sections, but we don't need that flexibility today and it would complicate the simpler model.

### D7. Firewall payload wrapping happens once, server-side

The `GET /global-whitelist/image-build/revision/{r}` endpoint returns a bare `List<String>`. The diff engine expects each side of the comparison to be a `Record<string, unknown>`. The server action `getGlobalFirewallRevisionDetails(revision)` wraps the bare list as `{ domains: stringArray }` before returning to the page. The page passes this wrapped object straight to `AuditView` as `activityRevision` / `previousRevision`.

This keeps the wrapping invisible to `AuditView` and the diff engine — they continue to treat both sides as opaque maps.

### D8. Singleton-aware `ViewHeader`

The global firewall has no per-resource identifier. The activity record's `resourceId` field is empty (`""`) for `ImageBuildDomainWhitelist` activities. `ViewHeader` currently always renders a Resource identifier chip; we add a tiny guard that omits the chip when the value is falsy.

This is a narrow defensive change. The Config view's existing resource types always carry a `resourceId`, so the guard never fires for them.

### D9. Re-enable navigation on the Deployments list view for image + firewall rows

In `List.tsx`, the `onCellClicked` handler currently has an early `if (isDeploymentsView) return;` that we relax to `if (isDeploymentsView && !isImageDefinitionResource(e.data.resourceType) && !isGlobalFirewallResource(e.data.resourceType)) return;`. Identical relaxation in the `openInNewTab` callback's resource-type check.

Container rows continue to no-op because their resource types fail both predicates. When the container detail follow-up ships, it widens the predicate and the row interactions enable themselves automatically.

Alternatives considered:

- Enable navigation for every Deployments row and let the page show not-found for container activities. Rejected: shipping a control that always lands on a 404 page is worse than shipping it disabled.

### D10. Re-use the existing diff utilities for the firewall string-array case

The firewall payload `{ domains: string[] }` flows through `generate-diffs.ts` like any other string-array entity. The diff engine already handles `string[]` keys via `compareStringArray` and `fillStringArray`. We add `domains` to `separateObjectParameterKeys` so it renders in its own section, and provide a section header via the `DiffSection` i18n lookup.

The result matches the mockup #5 layout: a single section labeled "Global domain whitelist" with Before / After columns showing the per-domain rows with diff-status coloring.

## Risks / Trade-offs

- **Synthesized Domain access policy row diverges from BE truth** → If the back end later adds an explicit `domainAccessPolicy` field, the synthesized row could conflict. Mitigation: the synthesis lives in one place (the image-section construction in `generate-diffs.ts`); a future change can swap synthesis for a real field with a single edit. The FE-only label list (`All domains` / `Specific domains`) is the same vocabulary the back end uses elsewhere.
- **Admin-first fallback adds one extra request per deployment-manager detail page open** → A deployment-manager activity always pays the cost of the admin 404. Accepted: the alternative (URL-encoded source hint) costs UX clarity; the request volume is one extra `GET` per detail open and most users open a detail page rarely.
- **Re-enabled navigation surface area** → Now that image and firewall rows navigate, an accidental click can take the user away from the list view and lose their grid scroll position. Mitigation: identical UX to the Config view, which has the same behavior today.
- **Polymorphic image DTO** → `ImageDefinitionDto` is polymorphic with a `$type` discriminator (`mcp` / `adapter` / `interceptor` / `application`) plus subtype-specific fields. The diff engine treats all extra fields as plain properties; subtype-specific keys appear in the Properties section unmapped. Accepted: the labels for those subtype-specific keys may render as the raw key name initially; if any prove confusing they can be added to the i18n key lookup later.
- **Sibling-activity lookup for the firewall singleton** → The page filters by `resourceId` to identify the latest activity for "current revision" computation. For the firewall singleton, `resourceId` is empty. The deployment-manager `POST /activities` endpoint must accept a `resourceType = ImageBuildDomainWhitelist` filter without a `resourceId` filter. Verified against the BE contract; the filter language supports any combination of column filters with no `resourceId` requirement.
- **Read-only-admin behavior** → Read-only admins on a deployment-manager activity see the same affordances they see on a Config activity, minus the rollback button (which they already don't see). No new gating needed.
