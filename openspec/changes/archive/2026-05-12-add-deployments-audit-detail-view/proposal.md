## Why

The Deployments view of the Activity Audit page surfaces deployment-manager activities in the list grid, but clicking a row or selecting `Open in new tab` is currently a no-op — the audit detail route at `/activity-audit/{activityId}` only resolves admin-backend activities. Administrators can see _that_ an image was created or that the global firewall was updated, but they cannot drill into _what_ changed. This change ships the detail experience for the two simpler deployment-manager slices — image definitions and the singleton global firewall — so administrators can audit the actual before/after state. Container subtypes are explicitly deferred to a follow-up.

GitHub issue: [#3105 — \[Deployments\] Implement Audit](https://github.com/epam/ai-dial-admin-frontend/issues/3105).

Follows on from the now-archived `2026-05-12-add-deployments-audit-view` change, which delivered the Deployments list view but intentionally left detail rendering for a follow-up.

## What Changes

- Wire the audit detail route at `/activity-audit/{activityId}` to resolve activities owned by the deployment-manager backend. The page first tries the admin-backend activity-by-id endpoint; on `404` it falls back to the deployment-manager backend.
- For image-definition activities (`AdapterImageDefinition`, `ApplicationImageDefinition`, `InterceptorImageDefinition`, `McpImageDefinition`), fetch the current and previous revision snapshots from `GET /api/v1/images/definitions/{id}/revision/{revision}` and render them through the existing `AuditView` diff engine.
- For global-firewall activities (`ImageBuildDomainWhitelist`), fetch the current and previous whitelist snapshots from `GET /api/v1/global-whitelist/image-build/revision/{revision}` and render them as a single-section diff. The bare `List<String>` response is wrapped as `{ domains: [...] }` once at fetch time so the existing string-array diff path handles the rendering.
- Hide the Resource Rollback button on the audit detail page for every deployment-manager activity (consistent with issue #3105 requirement #4). Introduce a `isDeploymentManagerResource(resourceType)` predicate covering the eleven deployment-manager resource types.
- Hide the Resource identifier chip in `ViewHeader` when `resourceId` is empty (the global firewall is a singleton with no per-resource identifier).
- Image detail renders two sections, both in the existing Accordion (default-open):
  - **Properties** — every image field except `allowedDomains`.
  - **Firewall settings** — `allowedDomains` plus a synthesized `Domain access policy` row (empty list → `All domains`, non-empty → `Specific domains`). The policy row exists only on the front end; the back end does not store it as a discrete field.
- Global firewall detail renders one section, **Global domain whitelist**, using the same Accordion (default-open). No `collapsible={false}` variant is introduced.
- Enable navigation on the Deployments grid for the rows that now have detail pages:
  - For `*ImageDefinition` and `ImageBuildDomainWhitelist` activities: row-body click navigates to `/activity-audit/{activityId}`; the `Open in new tab` menu opens the same URL in a new tab.
  - For the six container subtypes (`AdapterDeployment`, `ApplicationDeployment`, `InterceptorDeployment`, `McpDeployment`, `NimDeployment`, `InferenceDeployment`): row-body click and `Open in new tab` remain no-ops, matching the existing post-`add-deployments-audit-view` behavior, until a follow-up change ships container detail rendering.
- New i18n keys: `Entities.FirewallSettings`, `Entities.GlobalDomainWhitelist`, `Entities.DomainAccessPolicy`, `Entities.DomainAccessPolicyAllDomains`, `Entities.DomainAccessPolicySpecificDomains`.
- Backend coordination: this change consumes endpoints already shipped in `ai-dial-admin-mcp-manager-backend` (feature spec `014-auditing`). No new BE work is required to deliver image + firewall detail rendering.

## Capabilities

### New Capabilities

- `activity-audit-deployments-detail`: Renders the audit detail experience for deployment-manager activities scoped to image definitions and the global firewall. Covers backend resolution (admin → deployment-manager fallback), per-resource snapshot fetching, the image two-section diff (Properties + Firewall settings with the synthesized Domain access policy row), the global firewall single-section diff (Global domain whitelist), the hide-rollback predicate, the singleton-aware header behavior, and the per-resource-type row-interaction enablement on the Deployments grid.

### Modified Capabilities

- `activity-audit-deployments-view`: Two existing requirements change shape now that detail rendering exists for image and firewall activities. The row-action requirement that currently says "Open-in-new-tab is shown but clicks are no-ops" updates so image and firewall rows navigate, while container rows remain no-op. The route requirement that currently says "Audit detail route stays admin-only" updates so image and firewall activities are resolved from the deployment-manager backend. All other requirements (column set, label mapping, filter reset, storage-key scoping, etc.) are unchanged.

## Impact

- **New code**:
  - `apps/ai-dial-admin/src/server/deployments/audit-api.ts` — restore `DeploymentAuditApi.getActivityById(id, token)` calling `GET /api/v1/activities/{id}`.
  - `apps/ai-dial-admin/src/server/deployments/images.ts` — add `ImagesApi.getRevisionDetails(url, token)`.
  - `apps/ai-dial-admin/src/server/deployments/global-firewall.ts` (new file) or extend the existing `WhitelistApi` — add `getRevisionDetails(revision, token)` calling `GET /api/v1/global-whitelist/image-build/revision/{r}` returning `string[]`.
  - `apps/ai-dial-admin/src/app/[lang]/activity-audit/actions.ts` — server actions: `getDeploymentActivityById(id)`, `getDeploymentImageRevisionDetails(imageId, revision)`, `getGlobalFirewallRevisionDetails(revision)`.
  - Predicate helpers `isDeploymentManagerResource`, `isImageDefinitionResource`, `isGlobalFirewallResource` colocated with `ActivityAuditResourceType` in `apps/ai-dial-admin/src/types/activity-audit.ts`.

- **Modified code**:
  - `apps/ai-dial-admin/src/utils/audit/get-revision-route.ts` — add the four `*ImageDefinition` cases returning `/images/definitions/{id}/revision/` and the `ImageBuildDomainWhitelist` case returning `/global-whitelist/image-build/revision/`.
  - `apps/ai-dial-admin/src/app/[lang]/activity-audit/[id]/page.tsx` — resource-type router: tries admin backend first, falls back to deployment-manager; for image and firewall activities fetches the snapshots from the right deployment-manager endpoint; wraps the firewall `List<String>` payload into `{ domains: ... }` before passing to `AuditView`.
  - `apps/ai-dial-admin/src/components/ActivityAudit/View/AuditView.tsx` — hide the Resource Rollback button when `isDeploymentManagerResource(activity.resourceType)` is true.
  - `apps/ai-dial-admin/src/components/ActivityAudit/View/Header/Header.tsx` — drop the Resource identifier chip when `resourceId` is empty.
  - `apps/ai-dial-admin/src/components/ActivityAudit/constants.ts` — add `ALLOWED_DOMAINS = 'allowedDomains'` and `DOMAINS = 'domains'` to `EntityParameterKeys`. Add `ALLOWED_DOMAINS` to `separateObjectParameterKeys` so it renders in its own section.
  - `apps/ai-dial-admin/src/components/ActivityAudit/View/utils/generate-diffs.ts` — route `allowedDomains` into the Firewall settings section instead of the default Properties bucket; synthesize a `Domain access policy` row on the front end based on `allowedDomains` length.
  - `apps/ai-dial-admin/src/components/ActivityAudit/View/DiffReport/DiffSection.tsx` — extend the section-name resolution so the new `allowedDomains` and `domains` keys map to the localized section headers (`Firewall settings`, `Global domain whitelist`).
  - `apps/ai-dial-admin/src/components/ActivityAudit/List/List.tsx` — branch `onCellClicked` and `openInNewTab` on resource type so image and firewall rows navigate while container rows stay no-op.
  - `apps/ai-dial-admin/src/constants/i18n.ts` and `apps/ai-dial-admin/src/locales/en.ts` — new i18n keys listed above.

- **Untouched (intentional)**:
  - The diff engine internals (`create-simple/complex-diffs`, `EntityDiff`, the `Accordion` component) — extended via configuration only, no structural rewrite.
  - Rollback flow (`utils/audit/get-rollback-request.ts`, the rollback modal) — Config view only, untouched.
  - The six container subtypes' row interactions — stay no-op until a follow-up change ships container detail rendering.

- **External dependency**: none for this change. The image-definitions and global-whitelist snapshot endpoints are already shipped in `ai-dial-admin-mcp-manager-backend`. The earlier `version`-field BE prerequisite flagged in the prior change is unrelated to detail rendering — image detail will display the version through the `version` field on `ImageDefinitionDto`, which already exists on the BE.

- **Non-goals** (called out to keep scope clean):
  - Container and Model serving detail rendering (the six `*Deployment` resource types).
  - Resource rollback for any deployment-manager activity (out of scope per issue #3105 requirement #4).
  - Activity types beyond `Create | Update | Delete` (the back end emits only these; design mockups' `Launch Succeeded` / `Launch Failed` / `Installation Succeeded` etc. are illustrative).
  - Per-entity Audit tab embedded in container or image detail pages.
  - A non-collapsible Accordion variant.
