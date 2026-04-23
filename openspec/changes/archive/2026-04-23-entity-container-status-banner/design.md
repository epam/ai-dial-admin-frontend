## Context

Four entity detail views — Models, Applications, Toolsets, Interceptors — can have `source.$type === SOURCE_TYPE.CONTAINER` with a `containerId` pointing at a `Container` record. The container's `status` is a `CONTAINER_STATUS` enum: `running | pending | not_deployed | crashed | stopped | stopping`. When the status is anything other than `running`, the entity is not consumable from the Chat interface, but the detail view surface today gives no visible signal.

The Container source field (`components/SourceField/Containers/Containers.tsx`) already fetches the full container list for its dropdown and knows the current selection's status — it filters to `running` for dropdown options but does nothing further when the selected container is non-running. The information needed to show a banner is *observed* deep in the component tree but is not *surfaced* anywhere the View layer can render a top-of-view warning.

## Goals / Non-Goals

**Goals:**
- A single shared banner component reused by all four entity views.
- Zero prop-drill, zero new context, minimal touch points.
- Parametrized copy — one set of i18n keys covers all four entities with `{type}` substitution.
- Navigate to the container view via the same mechanism the existing "Open" button on the Container field already uses.

**Non-Goals:**
- Not handling the deleted-container case (containerId set but container not found in list).
- Not adding inline warning treatment on the Container field itself (neither triangle next to value nor helper text below).
- Not introducing polling or real-time status updates.
- Not modifying `Containers.tsx` or refactoring its fetch pattern.
- Not server-side fetching of the container list at `page.tsx` level.

## Decisions

### 1. Self-contained component, not a hook + render

**Decision:** Build a single `<ContainerStatusBanner view={view} entity={entity} />` component that owns the fetch, derivation, rendering, and early-return logic. No `useContainerStatusBanner` hook, no `<ContainerStatusBannerView>` split.

**Why:** The only consumer is the four entity Views, each of which drops in one line. There is no second renderer, no reuse of the derivation logic in isolation. Splitting into a hook + render component would add two surfaces (hook shape + component props) where one suffices. Composition is only valuable when parts are reused separately.

**Alternatives considered:**
- Hook `useContainerStatusBanner(view, entity)` + `<ContainerStatusBannerView>` component. Rejected — no second consumer makes the split speculative.
- Inlining the logic into each of the four Views. Rejected — four copies of fetch/derive/render.

### 2. Two independent client-side fetches, no shared cache / context

**Decision:** The banner calls `getContainersByView(view)` on mount via `useEffect`; `SourceField/Containers/Containers.tsx` continues to do its own independent fetch. Both requests hit the same list endpoint for the same page load.

**Why:** The user explicitly chose this over a shared context during discovery, on the grounds that the container list endpoints are lightweight and the duplicate fetch is an acceptable cost to avoid any cross-cutting plumbing. Adding a context requires threading a Provider through each of the four Views and modifying `Containers.tsx` to consume it — a wider blast radius than the two-fetch approach.

**Alternatives considered:**
- Shared `ContainersContext` populated by View and consumed by both the banner and `Containers.tsx`. Rejected — wider blast radius, and the list is cheap enough that deduplication isn't worth the machinery.
- Server-side fetch in each `page.tsx` passed as a prop. Rejected — largest blast radius (touches 4 page components + 4 Views + context or prop-drill + `Containers.tsx`); cost doesn't justify the one-request savings.
- Callback lifting from `Containers.tsx` up through 6 layers (`SourceField` → `DeploymentProperties` → `PropertiesTabContent` → `TabsContent` → `View`). Rejected — data flows backwards; prop-drills through shared components that have no other reason to know about container status.

### 3. Placement — below tabs, above tab content

**Decision:** Each View inserts `<ContainerStatusBanner>` in its JSX between `<SimpleEntityHeader>` (which owns the tab bar) and the flex container that renders `<TabsContent>`.

**Why:** Matches the mockup exactly. Keeps the banner outside the `overflow-auto` scroll container so it remains visible as the user scrolls the form. Does not interfere with the header's internal layout.

**Alternatives considered:**
- Passing a `warning` prop to `<SimpleEntityHeader>` (like `PublicationsHeader` does). Rejected — `SimpleEntityHeader` is used across many more entity types than the four affected here; adding a `warning` prop would widen the header's API for an entity-specific concern. Banner as a sibling is cleaner.

### 4. Trigger condition — View-level gates + component-level status check

**Decision:** The four conditions are split between the View and the component:

Gates inside each View (decide whether to even render `<ContainerStatusBanner>`):
```
originalEntity.source?.$type === SOURCE_TYPE.CONTAINER
  AND originalEntity.source?.containerId is truthy
```

Gates inside `<ContainerStatusBanner>` (decide whether to render a non-null output):
```
the container with name === containerId is found in the getContainers response
  AND the found container's status !== CONTAINER_STATUS.RUNNING
```

The View gates are structural (is this entity eligible for a banner at all?) — keeping them in the View lets TypeScript narrow `containerId` to `string` on the component's prop and avoids shipping the entire `entity` object across the boundary. The component's job is purely: given a `view` and a specific `containerId`, decide based on the container's live status.

Banner is gated on the **saved (`originalEntity`)** snapshot, not the mid-edit `selectedEntity`, because the Container dropdown in the source field only allows selecting running containers — a mid-edit selection is always running, so gating on the unsaved edit would immediately hide the banner as soon as the user interacts with the dropdown, even if they haven't saved yet. Gating on the saved baseline means the banner disappears only after the user actually saves a different container.

**Why:**
- Non-container sources have no container to warn about.
- Missing `containerId` means nothing is selected — not a warn-worthy state.
- Container not found (deleted) is explicitly out of scope; without a backend signal we cannot reliably distinguish "deleted" from "still loading" / "filtered out server-side".
- Any non-running status (including transient `pending` and `stopping`) triggers the banner. The user confirmed this — a transient banner during startup is acceptable; gating on terminal states only adds complexity for little benefit.

**Alternatives considered:**
- Gating on terminal states only (`stopped | crashed | not_deployed`). Rejected — user preference to show for any non-running status.
- Showing a different banner variant for the deleted case. Rejected — detection is unreliable without a backend signal; kept out of scope.

### 5. Navigation — reuse `onOpenInNewTab(getContainerRoute(view), ...)`

**Decision:** The "Go to Container" button calls `onOpenInNewTab(getContainerRoute(view), { name: entity.source.containerId })` — the same call `SourceField/Containers/Containers.tsx:85-89` uses for its "Open" button.

**Why:**
- `getContainerRoute` already maps each entity route to its container route (Models → ModelServings, Applications → ApplicationContainers, Interceptors → InterceptorContainers, Toolsets → McpContainers via the default case).
- Opening in a new tab matches the existing affordance; the user doesn't lose their in-progress edits on the entity page.
- The icon in the mockup is `IconArrowDown`, suggesting jump-to-anchor semantics, but the user clarified during discovery that the button "will navigate to the container view." Interpreting that as "open the container detail page in a new tab" matches existing conventions and gives the user more direct access than a same-page scroll.

**Alternatives considered:**
- Scroll-to-anchor on the Container field within the same page. Rejected — user confirmed "navigate to the container view."
- Same-tab navigation. Rejected — entity page may have unsaved edits; in-new-tab preserves them.

### 6. Copy — shared parametrized keys

**Decision:** Three new i18n keys under `ContainersI18nKey`:

```ts
ContainerNotRunningTitle = 'Containers.ContainerNotRunningTitle'
ContainerNotRunningDescription = 'Containers.ContainerNotRunningDescription'
GoToContainer = 'Containers.GoToContainer'
```

Title in `locales/en.ts`:
```
'{type} serving container for this {typeLower} is not running.'
```

Description (shared verbatim across entities):
```
'This {typeLower} will not be available in the Chat interface until the container is started or reconfigured.'
```

Button label:
```
'Go to Container'
```

The `{type}` token is resolved by mapping the entity route to its container route via `getContainerRoute(view)` (`components/SourceField/utils.ts`) and passing the result to `getTranslatedEntity(containerRoute, t)` (`utils/deployments/entity.ts`). This chain returns `"Model"`, `"Application"`, `"Toolset"`, and `"Interceptor"` for the four entity views. `getTranslatedType` was considered but rejected because it returns `"MCP"` (not `"Toolset"`) for `McpContainers`.

**Why:**
- One set of keys for all four entities; no copy-paste drift.
- `getTranslatedType` is the same helper already used by `constants/deployments/containers.tsx` and image labels — matches existing patterns.
- Drops the "or has been deleted" phrase from the mockup because the deleted case is out of scope; title reflects actual triggering condition.

**Alternatives considered:**
- Four separate entity-specific keys. Rejected — three-way duplication that drifts.
- Two keys (one for Models/Applications with "serving" phrasing, one neutral for Toolsets/Interceptors). Rejected — `getTranslatedType` already gives entity-appropriate nouns; single parametrized key suffices.

### 7. Loading / error behavior

**Decision:**
- While the fetch is in flight, the banner renders `null`.
- If the fetch fails, the banner renders `null` and the error is logged (no toast). The Container field's own fetch already surfaces errors via `showNotification` — surfacing the same error twice on a successful load failure is noisy.

**Why:**
- The banner is an *additional signal*, not the authoritative source. Missing the banner due to a fetch error is graceful degradation; failing the whole page is not appropriate.
- `Containers.tsx` already has the user-visible error handling for this endpoint. Duplicating notifications would confuse users.

**Alternatives considered:**
- Showing a generic error banner on fetch failure. Rejected — noise.
- Retrying the fetch. Rejected — out of scope; handled by page refresh.

## Risks / Trade-offs

- **Transient banner during container startup.** A container in `pending` status will show the banner briefly while starting; it disappears once running. Accepted per user decision.
- **Duplicate fetch per page load.** Two independent calls to the same endpoint. The endpoints are lightweight list calls; cost is minimal. Accepted per user decision.
- **Status staleness mid-edit.** If the user changes `containerId` on the Container field while editing, the banner's fetched list doesn't include real-time status for the newly-selected container until the page refreshes. Acceptable — the saved state of the entity is what matters, and user saves/refreshes before the stale state matters.
- **Applications with MCP container source.** The Applications entity can use `getApplicationContainers` (MCP endpoint selection). The banner uses the same dispatcher; behavior is uniform.

## Migration / Rollout

No migration. This is purely additive client-side rendering. The banner appears the first time a user opens a detail page for an affected entity. No feature flag proposed — the feature is safe to enable globally.

## Open Questions

_(none at proposal time — all questions from discovery were resolved)_
