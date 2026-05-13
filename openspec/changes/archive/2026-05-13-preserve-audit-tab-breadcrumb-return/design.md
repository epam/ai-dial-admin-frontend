## Context

Entity View components (e.g., `Adapter/View/View.tsx`) initialize their active tab with `useState(EntityViewTab.Properties)`. When a user navigates from the Audit → Activities sub-tab into an activity detail page and returns via breadcrumb, the component remounts and resets to Properties. There is no URL-based or storage-based mechanism to preserve this state.

The `ActivityAudit/List/List.tsx` component handles row clicks and calls `router.push(href)` where `href` is the activity detail path. At this point, the current entity path (from `usePathname()`) is available and the active tabs are implicitly known (main = Audit, sub = Activities).

All entity View components follow the same pattern — `useState(EntityViewTab.Properties)` — and delegate to a `TabsContent` component that conditionally renders `EntityAudit`. The `EntityAudit` component in turn manages its own sub-tab state with `useState(tabs[0].id)`.

## Goals / Non-Goals

**Goals:**
- Restore main tab (Audit) and audit sub-tab (Activities) when returning from a 3rd-level activity detail page to a 2nd-level entity detail page via breadcrumb.
- Implement via sessionStorage: no URL changes, no new routes, no breadcrumb logic changes.
- Keep the implementation generic enough to work across all entity types that support activity audit navigation.

**Non-Goals:**
- Preserving other tab combinations (e.g., Properties sub-states).
- Persisting tab state across page refreshes or new browser tabs.
- Handling forward navigation or direct URL access to entity pages.
- Changing breadcrumb link generation.

## Decisions

### Decision 1: Write location — `List.tsx` before `router.push`

The `onCellClicked` handler in `List.tsx` is the single write point. It already has access to `entity` (non-null when on an entity detail page), the destination `href`, and by extension the entity path (derived via `usePathname()`).

We always know that when `entity` is non-null and the user clicks a row, they are on the Audit → Activities path by definition — so no tab inference is needed.

**Alternative considered**: Write from `EntityAudit` on unmount via `useEffect` cleanup. Rejected because cleanup effects are unreliable during React 19 concurrent mode transitions and are harder to test.

### Decision 2: Storage key — current pathname from `usePathname()`

The entity path is the current page URL (e.g., `/en/adapters/my-adapter`), available via `usePathname()` in the List component. This matches exactly what `usePathname()` returns in the entity View component on remount — making the key symmetric without any path parsing.

Storage key format: `audit-tab-return:<pathname>`

**Alternative considered**: Deriving the entity path by stripping the last segment from the activity `href`. This works but is fragile if the href format changes. `usePathname()` is authoritative and already available.

### Decision 3: Read location — `useState` lazy initializer in entity View

Each entity View component reads and clears from sessionStorage in the `useState` lazy initializer, before first render. This ensures state is consumed exactly once and the entry is removed immediately.

```typescript
const pathname = usePathname();
const [activeTab, setActiveTab] = useState<EntityViewTab>(
  () => readAndClearAuditTabReturn(pathname)?.mainTab ?? EntityViewTab.Properties,
);
```

The `auditTab` value from the same read is passed as `initialAuditTab` prop through `TabsContent` → `EntityAudit`, which uses it as its own `useState` initial value.

**Alternative considered**: Have `EntityAudit` read from sessionStorage independently. Rejected because the entity View reads and **clears** storage first — `EntityAudit` may not be mounted until the user first clicks the Audit tab, by which point the entry is already gone.

### Decision 4: Shared pure utility — `src/utils/audit-tab-return.ts`

All read/write/clear logic lives in one file. This keeps the sessionStorage key format in a single place and makes the utility independently testable. No React hook — just plain functions called synchronously.

```typescript
// Write (called in List.tsx)
saveAuditTabReturn(entityPath: string): void

// Read + clear (called in entity View useState initializer)
readAndClearAuditTabReturn(entityPath: string): { mainTab: EntityViewTab; auditTab: EntityViewTab } | null
```

### Decision 5: Prop threading — `initialAuditTab` through TabsContent

Each `TabsContent` component gains an optional `initialAuditTab?: EntityViewTab` prop that it forwards to `EntityAudit`. `EntityAudit` uses it as: `useState(initialAuditTab ?? tabs[0].id)`. When absent (normal navigation), behavior is unchanged.

This is mechanical repetition across ~11 TabsContent files, but keeps each component simple and avoids shared context for ephemeral one-time state.

## Risks / Trade-offs

- **SSR / window not available**: sessionStorage access must be guarded (`typeof window !== 'undefined'`) since entity View components run during server rendering in Next.js. The `useState` lazy initializer runs client-side only, so this is safe — but the utility must still guard defensively.
- **Stale entry if user navigates away differently**: If a user opens an activity detail and then navigates to a completely different page (not the entity breadcrumb), the sessionStorage entry remains. It is keyed by entity path, so it will be consumed on the next visit to that entity — which may cause an unexpected tab restoration. **Mitigation**: entries are cleared on first read, limiting the window; the behavior is low-impact (restoring Audit tab is not harmful).
- **~11 TabsContent files and ~11 View.tsx files need mechanical updates**: Scoped, low-risk changes but require attention to not miss any entity type that has activity audit navigation.
