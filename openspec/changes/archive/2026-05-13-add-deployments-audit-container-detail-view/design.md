## Context

`add-deployments-audit-detail-view` (archived 2026-05-12) shipped the detail page for image-definition and global-firewall activities, plus the diff-engine infrastructure that makes new section types cheap to add — registry-table dispatch (`SEPARATE_OBJECT_HANDLERS`), shared array-diff walker (`walkSortedArrayDiff`), and predicate-based resolver routing in `[id]/page.tsx`. The six container subtypes (`AdapterDeployment`, `ApplicationDeployment`, `InterceptorDeployment`, `McpDeployment`, `NimDeployment`, `InferenceDeployment`) were intentionally left as no-op rows in the Deployments grid pending this change.

The container/serving domain shares a **single** `Container` model (`src/models/deployments/containers.ts`) across all six subtypes; the `$type` discriminator (`mcp | interceptor | adapter | application | nim | inference`) controls which fields appear in the editor. The same conditional-rendering rule applies to the audit detail view — render every section, hide sections whose underlying field is missing from both snapshots.

The Container editor's accordion grouping (`ContainerFields.tsx`) is the ground truth for section structure: Properties / Source / Endpoint configuration / Autoscaling / Variables / Resources / Configuration / Startup probe / Firewall settings. The locked design mockup (NIM Model Serving / Launch Successful) confirms this ordering, the row-level layout (env vars rendered as flat rows with a MOUNT_AS chip; resources as six flat rows for CPU/Memory/GPU × Request/Limit), and the absence of Autoscaling for NIM/Inference subtypes.

## Goals / Non-Goals

**Goals:**
- Detail page resolves the six `*Deployment` resource types via the deployment-manager backend and renders the `Container` snapshot through `AuditView`.
- Section structure mirrors the editor accordion exactly; conditional sections appear only when the underlying field is populated.
- Env-var diff rows render `name → resolved value` with `PasswordCellRenderer` masking for `secure_*` mount types and an inline `MOUNT_AS_*` chip on the value cell.
- Nested objects (`scaling.strategy`, `probeProperties.probe`, `resources.requests`, `resources.limits`) flatten into flat rows in the parent section — no nested grids.
- The Deployments-grid row interactions for the six container subtypes flip from no-op to navigate, matching the prior change's image/firewall behavior.
- Zero changes required to the existing diff sections (image / firewall / admin entities) and zero changes to `AuditView` / `ViewHeader` (rollback already hidden and resourceId always present for containers).

**Non-Goals:**
- New `AuditView` features. The detail page is purely additive — same component, same diff filter, same accordion shell.
- Activity types beyond `Create | Update | Delete`. Launch / Stop variants in the design mockup are illustrative; BE does not emit them.
- Embedded per-entity Audit tab on the Container view (separate future change).
- Container rollback. The Resource Rollback button is already hidden for all 11 deployment-manager types via `isDeploymentManagerResource`.
- Runtime tabs (Tools, Resources, Prompts, Metrics, Execution Log, Events). Not part of the revision snapshot.

## Decisions

### Section structure mirrors the editor accordion

**Decision:** Render seven sections in fixed order: Properties (default bucket) → Endpoint configuration → Autoscaling → Environment variables → Resources → Configuration → Startup probe → Firewall settings. Each non-default section is registered in `separateObjectParameterKeys` and routed by a handler in `SEPARATE_OBJECT_HANDLERS`. Sections render only when their underlying field exists in at least one snapshot.

**Why:** Users edit containers through this exact accordion. Audit diff that mirrors the editor matches their mental model and minimizes cognitive switching between "what I edited" and "what changed." The locked design confirms the order.

**Alternative considered:** A single flat Properties section with every field. Rejected — Container has ~25 fields across 5 nested objects; one flat list becomes a wall of rows with no logical grouping.

**Alternative considered:** Editor-style nested accordion within each section. Rejected — the existing `AuditView` accordion shell is flat. Nesting would require new UI components and would diverge from how image / firewall detail pages render.

### Environment variables — flat rows with masking + chip

**Decision:** `metadata.envs[]` flattens into one diff row per env. Row shape:
- `parameter = env.name`
- `value = env.value.value` for `VALUE_TYPE.SIMPLE`, `env.value.fileName` for `VALUE_TYPE.FILE`
- `mountType` carried as a third field on the row used by the cell renderer; masked rendering via the existing `PasswordCellRenderer` when `mountType ∈ {secure_content, secure_file}`, plain rendering otherwise
- Inline chip on the value cell shows the mount type (`MOUNT_AS_VARIABLE` for `content`/`secure_content`, `MOUNT_AS_FILE` for `secure_file`).

**Why:** Keeps the diff grid two-column (parameter + value) consistent with every other section. The `PasswordCellRenderer` already exists and is already wired for `key` / `clientId` cells via `cellRendererSelector` in `EntityGrid/constants.ts` — adding env-var masking is a one-line conditional in the same selector. The chip approach is borrowed from how the existing `TagsCellRenderer` decorates the topics row.

**Alternative considered:** Three-column env grid (name | value | mount type). Rejected — would diverge from every other diff section, fork the column config, and complicate the View: Diff filter logic that operates on `value`/`parameter`.

**Alternative considered:** One row per env with `value = "${name}: ${value} (${mountType})"`. Rejected — loses the field-level diff status (can't tell whether name, value, or mount type changed), and the long composite string defeats column tooltips.

### Resources flatten to six rows

**Decision:** `resources` is a `separateObjectParameterKeys` entry. Its handler flattens `requests.{cpu, memory, gpu}` and `limits.{cpu, memory, gpu}` into six rows with parameters `cpuRequest`, `cpuLimit`, `memoryRequest`, `memoryLimit`, `gpuRequest`, `gpuLimit`. Labels resolve through existing `EntityFieldsI18nKey.GPURequest`/`GPULimit`/etc. that the editor already uses.

**Why:** Six rows is well under the threshold where a table earns its complexity. The editor renders these as six flat inputs, so the labels and naming are already in i18n. The diff engine can present added/removed/changed status per individual field.

**Alternative considered:** Render `resources` as a 3×2 table (rows: CPU/Memory/GPU; cols: Request/Limit). Rejected — diff engine is column-fixed, and the table would need a custom renderer.

### Nested objects flatten into the parent section

**Decision:** For `scaling`, `probeProperties`, and `resources`, the handler walks two levels deep and emits flat rows for every leaf. `scaling.strategy.$type` becomes a row, `probeProperties.probe.port` becomes a row, `resources.requests.cpu` becomes a row — all in the parent section's row list.

**Why:** Keeps the diff structure flat and the AG-Grid rendering uniform. The existing engine has no nested-row primitive; introducing one would be disproportionately complex for three legitimately flat-renderable groupings.

**Alternative considered:** Custom nested cell renderer. Rejected — adds complexity, blocks View: Diff filtering at the nested-field level.

### One predicate per concept

**Decision:** Add `isContainerDeploymentResource(type)` to `src/types/activity-audit.ts`, returning true for the six `*Deployment` subtypes. Existing predicates (`isImageDefinitionResource`, `isGlobalFirewallResource`, `isDeploymentManagerResource`) untouched.

**Why:** The detail-page resolver (`pickHandlers` in `[id]/page.tsx`) needs a third predicate to pick the container branch. Coloured with the other predicates next to the `ActivityAuditResourceType` enum keeps the dispatch table readable.

### Reuse of image handler chassis

**Decision:** The existing `ALLOWED_DOMAINS` handler in `SEPARATE_OBJECT_HANDLERS` renders Firewall settings identically for containers — same compare/fill, same `Domain access policy` synthesis, no per-resource branching. Same for `source` (already flattened via `compareSimpleObjects` and `normalizeImageSource`).

**Why:** The previous change designed those handlers to be resource-agnostic. Reusing them is the lowest-risk path and the strongest validation that the chassis works.

### List row click behavior

**Decision:** Update `components/ActivityAudit/List/List.tsx` to navigate for the six container subtypes in both `onCellClicked` and `openInNewTab` handlers. After this change, all 11 deployment-manager resource types navigate; no row stays no-op. The branching helper added in the prior change (now keyed off `isImageDefinitionResource || isGlobalFirewallResource`) becomes `isDeploymentManagerResource` — the simpler check.

**Why:** This change closes the loop on every deployment-manager resource type. There is no remaining subtype that needs no-op behavior, so the predicate can collapse to the broader `isDeploymentManagerResource`.

## Risks / Trade-offs

- **BE endpoint assumed**: We assume `GET /api/v1/deployments/{id}/revision/{r}` exists and returns the `Container` shape the editor consumes. → **Mitigation**: route helper is the only place the URL appears; if BE ships a different path we change one switch case. Verification happens on the first integration call after merge.
- **Polymorphic Container snapshot may omit fields**: `Container.transport`, `mcpEndpointPath`, `modelFormat`, `scaling`, `probeProperties` may all legitimately be absent depending on `$type`. → **Mitigation**: the diff engine's existing "key exists in at least one snapshot" rule handles this; sections render only when both snapshots have data or one had it before/after, producing the correct ADDED/REMOVED state. No per-subtype branching needed.
- **`metadata` is a wrapper, not a top-level field**: `envs` lives at `metadata.envs`, not at the root. → **Mitigation**: the separate-object handler reads `metadata.envs` from the `metadata` value, not the root key. If we later add other `metadata.*` fields we extend the same handler; today `envs` is the only one.
- **`mountType` chip is a new visual primitive**: a small chip rendered inside the value cell next to the value text. → **Mitigation**: build it as a tiny renderer in `Grid/CellRenderers/` reusing the existing Tailwind chip styles (same look as the topics chips in `TagsCellRenderer`); avoids a new component library or styling system.
- **Secure-value masking on diff**: when a `secure_*` env value changes, the diff still renders the row as CHANGED with both sides masked. → **Mitigation**: matches existing behavior for `key`/`clientId` in PasswordCellRenderer. Users see "something changed" without exposure. If this is unacceptable to security we add a "value hidden" placeholder, but that's a separate design decision.
- **Three predicates for deployment-manager resources** (`isImageDefinitionResource`, `isGlobalFirewallResource`, `isContainerDeploymentResource`) plus the umbrella `isDeploymentManagerResource`. → **Trade-off**: more named predicates than strictly necessary, but each maps to a distinct routing decision in the page resolver. Keeping them separate keeps `pickHandlers` clean.

## Open Questions

- **Mount-type label exact strings**: `MOUNT_AS_VARIABLE` vs `Variable`, `MOUNT_AS_FILE` vs `File`. The design shows the enum-style upper-snake; the existing editor uses sentence-case. Tasks will pick the editor convention unless the mockup is authoritative.
- **`description` field on env-vars**: env-vars carry an optional `description`. The design mockup does not show it. Tasks will hide it from the diff to match the mockup; if QA flags it we can promote it to a hover tooltip with `DialEllipsisTooltip`.
