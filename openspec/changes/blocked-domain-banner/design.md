## Context

The deployment-manager backend (PR #302, "Hubble Relay integration") observes Cilium DNS verdicts during image builds and deployment pod runs and emits them as `event: domain` Server-Sent Events on the existing log streams. Each event payload is `{ domain: string, verdict: "ALLOWED" | "BLOCKED" }`. ALLOWED verdicts are informational and out of scope for this change; BLOCKED verdicts indicate that Cilium dropped a flow because the destination domain isn't in the per-entity `allowedDomains` array (the global whitelist is applied separately and untouched here).

Today the user can see only that an install or run failed in the log, with no clear next action. They have to guess the domain from log noise, navigate to the Firewall tab, paste it into the allowed domains list, save, and re-run. This change closes that loop with an inline banner + one-click action.

The frontend already proxies the two log SSE streams through `/api/sse?entity=image|container&id=...&podName=...`. The image side has a single `InstallationLog` component that owns one EventSource. The container side has `ExecutionLog` rendering one `PodView` per pod, each owning its own EventSource. Both already handle `logs`, `error`, `open`, and (for image) `status` events.

`EntityBanner` (`components/Deployments/Common/EntityBanner/EntityBanner.tsx`) is a recently introduced wrapper over `DialAlert` from ai-dial-ui-kit and is the right primitive to reuse — see `ImageStatusBanner.tsx` for a near-identical pattern (banner above tab content, action button via `children`, click triggers a server action / state change).

Tab `invalid` and `warning` flags are already supported by `TabModel`. The existing `Events` tab in `ContainerView` flips `invalid: true` imperatively from inside the SSE handler (`ContainerView.tsx:147`); the existing `Firewall` and `Properties` tabs use `warning` derived from props.

## Goals / Non-Goals

**Goals:**
- Surface BLOCKED domain SSE events as an in-context banner in both the image Installation log tab and the container Execution log tab.
- Mark the affected tab with the existing red `invalid` indicator while a blocked-domain banner is active.
- Let the user one-click promote blocked domains into the entity's `allowedDomains` array, dirtying the form so Save/Discard activate in the existing entity header.
- Reuse the existing `EntityBanner` primitive and the existing `onChange(entity)` flow — no new state/save infrastructure.
- Apply uniformly to MCP containers (which share the Execution log tab).

**Non-Goals:**
- Consuming the new `domains[]` field on the build details response (relies on SSE replay for completed builds; revisit only if a UX gap appears).
- Surfacing ALLOWED verdicts in any UI.
- Auto-saving, auto-installing, or auto-redeploying after the user clicks "Add to allowed domains" — user saves and re-runs explicitly.
- Changes to the global domain whitelist.
- Changes to the Firewall tab UI.
- A standalone "domain history" or audit view of all observed domains.

## Decisions

### Decision 1: Split state — list lives in the log component, boolean lives in the entity view

The `blockedDomains: string[]` accumulator lives locally in `InstallationLog` (image) and `ExecutionLog` (container). The parent (`ImageView` / `ContainerView`) keeps only a `hasBlockedDomains: boolean` for the tab error indicator. Parent passes `setHasBlockedDomains` (a single setter) down; child flips it on first BLOCKED domain and clears it when the user dismisses the banner.

This minimises prop drilling. `TabsContent` already passes `selectedContainer`/`selectedImage` and `onChange` to the log component (or did, after we wired the merge there); the only new prop through `TabsContent` is `setHasBlockedDomains`. The merge logic on banner click (`onChange({ ...entity, allowedDomains: mergeAllowedDomains(...) })`) lives in the child since `selectedContainer`/`selectedImage` and `onChange` are in scope there.

**Caveat handled in implementation:** the child filters incoming BLOCKED domains against the entity's current `allowedDomains` before adding them. This prevents SSE replay from re-populating the banner with a domain the user has just dismissed (since dismissal merged it into `allowedDomains`).

**Alternatives considered:**
- *Lift everything (list + boolean) to the parent.* Original direction. Rejected during apply: required threading three props (`blockedDomains`, `onBlockedDomain`, `onAddBlockedDomainsToAllowed`) through `TabsContent`, and the merge-and-dirty-form logic at the parent duplicated state ownership concerns the child could handle locally with `selectedContainer`/`onChange`.
- *Keep everything in the child and skip the tab indicator.* Rejected: the tab error icon is a stated requirement.
- *React Context.* Rejected: scope is local to a single entity view.

**Lifecycle trade-off:** child unmounts on tab switch → local `blockedDomains` is lost → SSE reconnect on remount replays domain events → list re-fills (filtered against `allowedDomains`). Brief flicker, no data loss.

### Decision 2: Unify the data shape as `string[]` (in the log component) + `boolean` (at the entity view)

In the log component, `blockedDomains: string[]` is uniform — length 0..1 for image, 0..N for container. Banner component, dedup check, and merge logic are identical across the two views.

At the parent, `hasBlockedDomains: boolean` is a single flag that controls the tab `invalid` indicator. This makes it symmetric with `hasWarningEvents` (which we converted from imperative `setTabs(... invalid: true)` to derived state during this change, see Decision 3).

**Alternatives considered:**
- *`string | null` for image, `string[]` for container.* Rejected: forces two banner components or branched props for no benefit.
- *`Set<string>`.* Rejected: array with an `includes` check is enough for the small set sizes involved.

### Decision 3: Derive tab flags via a `withFlags` helper; convert the existing Events flag to derived state

Added a generic helper to `utils/tabs/utils.ts`:

```ts
export type TabFlags = Pick<TabModel, 'invalid' | 'warning' | 'disabled'>;

export const withFlags = (
  tabs: TabModel[],
  flagsMap: Partial<Record<EntityViewTab, TabFlags>>,
): TabModel[] =>
  tabs.map((tab) => {
    const flags = flagsMap[tab.id as EntityViewTab];
    return flags ? { ...tab, ...flags } : tab;
  });
```

Callers stay clean and two-step:

```ts
// ImageView (inline — no useMemo needed)
const baseTabs = getDeploymentsViewTabs(ApplicationRoute.Images, t, selectedImage.buildStatus, selectedImage.allowedDomains);
const tabs = withFlags(baseTabs, {
  [EntityViewTab.InstallationLog]: { invalid: hasBlockedDomains },
});

// ContainerView (memoized; combines blocked-domain + warning-events flags)
const tabs = useMemo(() => {
  const baseTabs = getDeploymentsViewTabs(route, t, container.status, container.allowedDomains, imageNotInstalled);
  return withFlags(baseTabs, {
    [EntityViewTab.ExecutionLog]: { invalid: hasBlockedDomains },
    [EntityViewTab.Events]: { invalid: hasWarningEvents },
  });
}, [...]);
```

`ContainerView`'s pre-existing imperative `setTabs(prev => prev.map(... invalid: true))` for warning Kub events was converted to a derived `hasWarningEvents: boolean` state, set from the existing SSE handler. This removes the implicit "imperative invalid flag" and lets a single tab-derivation site own both flags symmetrically.

**Alternatives considered:**
- *Extend `getDeploymentsViewTabs` to accept dynamic flags directly.* Rejected: mixes static tab structure (which tabs the route has) with dynamic SSE-derived state. `withFlags` keeps these decoupled.
- *Convert `ImageView` tabs to `useState<TabModel[]>` + `useEffect` matching `ContainerView`.* Rejected: not necessary — derived inline is fine for the simpler image case.
- *Mix derived (ExecutionLog) and imperative (Events) flags on `ContainerView`.* Rejected after implementation: the new derived useEffect for ExecutionLog clobbered the imperatively-set Events flag on every recompute. Converting both to derived state was the cleaner fix.

### Decision 4: "Add to allowed domains" dirties the form; does not save

Clicking the banner button (handled inside the log component):
1. Calls `onChange({ ...entity, allowedDomains: mergeAllowedDomains(entity.allowedDomains, blockedDomains) })` — same path as any other inline edit. The header's existing `isChanged` detection lights up Save/Discard.
2. Calls `setBlockedDomains([])` (local) to hide the banner immediately.
3. Calls `setHasBlockedDomains(false)` (parent) to clear the tab error indicator.

The user explicitly saves via the existing header button, then re-runs install/redeploy through the existing controls. This matches every other edit in the entity views and avoids a second save-and-redeploy code path.

`mergeAllowedDomains` lives in `utils/deployments/whitelist.ts`:

```ts
export const mergeAllowedDomains = (existing: string[] | undefined, additions: string[]): string[] =>
  Array.from(new Set([...(existing ?? []), ...additions]));
```

**Alternatives considered:**
- *Immediate persist (call `updateImage`/`updateContainer` from the banner click).* Rejected: inconsistent with how every other field in the view behaves; introduces a second save path; no obvious UX win since the user has to redeploy anyway.
- *Keep banner visible until next install/redeploy clears it.* Rejected per user direction — hide on click is cleaner and matches the screenshot mockup.

### Decision 5: Banner copy is parent-supplied; banner component stays presentational

`BlockedDomainBanner` is a thin wrapper over `EntityBanner` that takes `message: string`, `buttonLabel: string`, `domains: string[]` (used for accessibility / data-testid only — not rendered separately, the message already includes them via interpolation), and `onAddToAllowed: () => void`. The parent picks the right i18n key (image vs container, singular vs plural for container) and interpolates the `domain` / `domains` placeholders. This keeps the banner component dumb and i18n decisions where they belong (alongside other entity copy).

Domains are rendered as plain text inside the message (no `<a>` styling, no underline) per user direction.

**Alternatives considered:**
- *Banner accepts a `context: 'image' | 'container'` prop and picks i18n internally.* Rejected: couples the shared component to specific entity types; harder to test; less flexible for future reuse.

### Decision 6: SSE handler ignores ALLOWED verdicts and skips the new field on build details

The proposal scope is "blocked domains only". ALLOWED events are emitted on the same stream — we read the `verdict` field and bail out unless it's `BLOCKED`. The backend adds a `domains[]` field on `GET /api/v1/images/builds/{id}/details` for completed builds; we don't consume it. SSE replay covers the "open the tab on a completed failed build" case. If we hit a UX gap (e.g., replay is slow or skipped) we revisit.

**Alternatives considered:**
- *Read `domains[]` to seed the banner before SSE catches up.* Rejected: speculative, adds a model field, expands scope. Defer until evidence demands it.

### Decision 7: Banner placement

- **Image**: inside `InstallationLog`, above the `<LogViewer>`. Single component, single SSE — banner naturally lives there.
- **Container**: inside `ExecutionLog`, above the per-pod `<PodView>`. The verdict is keyed on `deployment_id` server-side, so all pods of one container share the same set of blocked domains — rendering once at the `ExecutionLog` level is the correct cardinality. Each `PodView`'s SSE handler still pushes into the shared `blockedDomains` array (deduped); the banner reads the merged set.

### Decision 8: Use `AlertVariant.Error` (or the closest red-error variant in ai-dial-ui-kit)

The screenshot shows a red error banner. `EntityBanner` defaults to `AlertVariant.Warning`; we pass an explicit error variant. Exact enum name to be confirmed against ai-dial-ui-kit at implementation time, but the prop wiring is already in `EntityBanner`.

## Risks / Trade-offs

- **Risk: SSE replay timing for completed failed builds** → if a user opens the Installation log tab on an already-failed build and SSE replay is slow or absent, the banner won't appear immediately. **Mitigation:** Revisit by consuming `domains[]` from build details if this turns out to be a real problem in practice. Out of scope for v1.
- **Risk: SSE replay re-adds dismissed domains on tab switch** → child component unmounts on tab switch, local `blockedDomains` is lost; on remount the SSE replays historical BLOCKED events. **Mitigation:** the child's SSE handler filters incoming domains against the entity's current `allowedDomains` (read via a ref so the closure stays current). After click+save, the domain is in `allowedDomains` → replay is silently skipped. Pre-save edge: the user clicks Add but hasn't saved → `selectedImage`/`selectedContainer` already has the merged list → filter still works because the ref reads the local-edit state.
- **Risk: Transient duplicate BLOCKED events before backend dedup** (called out in the backend SSE contract) → the live stream may briefly emit a domain twice. **Mitigation:** Frontend dedups via `includes` check in the SSE handler — duplicates are no-ops.
- **Risk: User adds the domain, saves, but doesn't redeploy** → the banner is gone, the build/run is still broken. **Mitigation:** The existing `isChanged` / Save flow makes save explicit; the existing redeploy flow makes redeploy explicit. We rely on standard UX and don't try to chain actions automatically.
- **Risk: User clicks Discard after clicking Add to allowed domains** → `allowedDomains` reverts but the banner is already hidden. **Mitigation:** Acceptable. SSE will not re-emit the BLOCKED event for the same domain unless a new build/run happens. User can navigate away and back to re-trigger replay if needed. Edge case, low impact.
- **Risk: Race between `setBlockedDomains([])` (hide) and an in-flight new BLOCKED SSE event** (container only — image only ever sees one) → in theory, a new BLOCKED event could land milliseconds after the user clicks add and re-show the banner with one item. **Mitigation:** This is correct behaviour, not a bug — a *new* domain was blocked after the click and the user should know.
- **Trade-off: Per-pod SSE handlers all push to the same shared `blockedDomains` array in `ExecutionLog`** → minor redundant work; deduped at the array level. Acceptable; the alternative (one shared SSE listener) would require refactoring `PodView`'s SSE ownership.
- **Trade-off: Banner state lifecycle** → child unmounts on tab switch; banner blanks momentarily until SSE replays. Acceptable; the alternative (state at parent across tab switches) would require drilling 3 props through `TabsContent` instead of 1.
