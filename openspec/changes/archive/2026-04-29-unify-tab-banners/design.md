## Context

Two warning banners surface deployment-related issues on entity detail views:

- **`ContainerStatusBanner`** (lives at `Deployments/Common/ContainerStatusBanner/`) renders on Models / Applications / Interceptors / Toolsets views when the entity's saved source is a container that isn't `RUNNING`. It is mounted in each `View.tsx` between `<SimpleEntityHeader>` and the `flex-1 overflow-auto` scroll container that wraps `<TabsContent>`. Result: it eats vertical space on every tab and never scrolls.
- **Image-not-installed banner** lives **inline** as a `DialAlert` inside `Containers/View/TabsContent.tsx`, gated to the Properties branch. It is positioned above `<PropertiesTabContent>` (which renders `EntityInfoHeader`) and therefore scrolls naturally with the tab content. Implementation includes a custom CSS workaround (`[&>div]:flex-1 [&>div>div:last-child]:w-full`) to lay out the inline message + Install button in a single row.

Both banners are visually identical (`DialAlert` with `AlertVariant.Warning` + a `DialNeutralButton` CTA). The two implementations diverge for no good reason, and the container banner's placement is the worse of the two UX-wise.

## Goals / Non-Goals

**Goals:**
- One configurable rendering primitive (`EntityBanner`) backing both banners; no inline `DialAlert` markup outside it.
- Consistent placement: both banners live inside the Properties tab content, above `<PropertiesTabContent>` (i.e. above `EntityInfoHeader`), and scroll with tab content.
- `ContainerStatusBanner` keeps its existing data-fetch + trigger semantics; only its render output and mount location change.
- The image-not-installed banner gets a named wrapper component (`ImageStatusBanner`) so its trigger logic, copy branching, and CTA gating live behind a clean call-site.

**Non-Goals:**
- No outer view layout changes — `SimpleEntityHeader`, the `bg-layer-2 rounded p-4` panel, the `flex-1 overflow-auto` scroll container all stay as-is.
- No sticky-header behavior. The user explicitly opted out of pinning the header.
- No banner introduced on the Image detail view — image-level warnings stay out of scope here.
- No change to which states trigger the banners (container statuses or image build statuses).
- The new `EntityBanner` is not promoted to a generic `Common/` location — it stays under `Deployments/Common/` until non-deployment use-cases appear.

## Decisions

### 1. Mount location: inside Properties branch of each view's `TabsContent`, not in `View.tsx`

**Decision**: Move `<ContainerStatusBanner>` mounts out of the four entity `View.tsx` files and into the Properties branch of each `TabsContent.tsx`, positioned before `<PropertiesTabContent>`.

**Why**:
- Properties is the right scope: a non-running source container is most relevant when looking at the entity's configuration (Properties), not when inspecting Routes / Versions / Tools / etc.
- Inside `TabsContent`, the banner sits within the existing `flex-1 overflow-auto` scroll container in `View.tsx`, so it scrolls with content for free — no scroll-boundary refactor required.
- Mirrors the existing image-not-installed banner placement (`Containers/View/TabsContent.tsx` Properties branch), giving the codebase one pattern instead of two.
- `View.tsx` becomes simpler: it no longer needs the `originalEntity.source?.$type === SOURCE_TYPE.CONTAINER && originalEntity.source?.containerId &&` gate at the parent level. That gate moves into `TabsContent` (alongside the rest of the per-tab logic).

**Alternative considered**: keep banner above `SimpleEntityHeader` and scroll the whole panel as one. Rejected — user opted out of moving the scroll boundary.

**Alternative considered**: keep banner in `View.tsx` but conditionally render based on `activeTab`. Rejected — it would force `View.tsx` to thread `activeTab` down into a banner mount and would still mount the banner outside the scroll container, partially defeating the point.

### 2. New `EntityBanner` component as the only `DialAlert` renderer for these warnings

**Decision**: Create `Deployments/Common/EntityBanner/EntityBanner.tsx` — a presentational wrapper around `DialAlert` accepting `variant`, optional `title`, `message`, `className`, and `children`. Both `ContainerStatusBanner` and the new `ImageStatusBanner` delegate rendering to it.

**Why**:
- Removes duplicated `DialAlert` boilerplate and the custom CSS workaround in `TabsContent`.
- Keeps the visual contract in one place — easy to tweak spacing / typography / variant defaults later.
- Caller-friendly API: `title` for the optional bold prefix (used by `ContainerStatusBanner`), `message` for body text, `children` for the CTA button. No structural overrides needed by callers.
- Stays presentational: no data fetching, no contexts, no `useEffect`. Trigger logic lives in the wrappers.

**API shape**:
```ts
interface Props {
  variant?: AlertVariant;     // defaults Warning
  title?: ReactNode;          // optional semibold inline prefix
  message: ReactNode;
  className?: string;
  children?: ReactNode;       // CTA slot
}
```

**Render**:
```tsx
<DialAlert
  variant={variant ?? AlertVariant.Warning}
  className={className}
  message={
    <span className="small">
      {title && <><span className="small-text-semi">{title}</span> </>}
      {message}
    </span>
  }
>
  {children}
</DialAlert>
```

**Alternative considered**: a structured `action?: { label, icon, onClick, disabled }` prop instead of `children`. Rejected — `children` is more flexible (caller picks the button component, can render nothing, can render a non-button), and matches how `DialAlert` itself takes children.

### 3. New `ImageStatusBanner` wrapper, mirror of `ContainerStatusBanner`

**Decision**: Extract the inline `DialAlert` block in `Containers/View/TabsContent.tsx` into `Deployments/Common/ImageStatusBanner/ImageStatusBanner.tsx`. Wrapper props: `image?: Image`. Internally:
- Returns `null` when `!isImageNotInstalled(image)` or `!image`.
- Branches copy on `image.buildStatus === BUILD_FAILED` (`ImageBuildFailedWarning`) vs `NOT_BUILT` (`ImageNotInstalledWarning`).
- Owns the install-confirmation modal state, `installImage` server action call, success-redirect, and error notification.
- Gates the CTA button on `useIsReadOnlyAdmin()`.
- Renders `<EntityBanner>` for output.

**Why**:
- Symmetry with `ContainerStatusBanner` — both are wrappers in `Deployments/Common/` that own their trigger + side-effects and delegate visuals to `EntityBanner`.
- `Containers/View/TabsContent.tsx` shrinks: the `imageWarning`, install-modal state, and the `ImageInstall` portal usage all move out, leaving just `<ImageStatusBanner image={image} />` in the Properties branch.
- Matches the project rule "Break down complex components into smaller, reusable components".

**Alternative considered**: keep the logic inline in `TabsContent` and only swap the `DialAlert` for `EntityBanner`. Rejected — `TabsContent` is already crowded with per-tab logic and the inline alert pulls in modal portal handling, server-action wiring, and read-only-admin gating that don't belong on the Properties branch.

### 4. `ContainerStatusBanner` keeps its name and data-fetch, swaps render only

**Decision**: Don't rename or split `ContainerStatusBanner`. It keeps `view` + `containerId` props, the `getContainersByView(view)` fetch on mount, the early-return for `null` / `RUNNING`, and the `mb-6` spacing class. It replaces its `DialAlert` JSX with `<EntityBanner title=... message=... className="mb-6">{button}</EntityBanner>`.

**Why**:
- Minimum-impact refactor — keeps existing call-sites' API, keeps existing tests' shape (only the rendered DOM markup deepens by one wrapper).
- Preserves the existing `mb-6` margin (image banner uses `mb-8`, kept on its own caller — the difference is intentional and documented as call-site spacing).

### 5. Banners disappear on non-Properties tabs (no opt-out)

**Decision**: Both banners live inside `activeTab === Properties` branches and are absent from other tabs. There is no prop to make them visible across all tabs.

**Why**: User explicitly chose Properties-only for both. A non-running container or an unbuilt image is best surfaced where the user is configuring the entity, not where they're monitoring it.

**Trade-off**: If the user lands on Tools / Routes / Events first, they won't see the warning until they switch to Properties. Acceptable — the entity tabs are visible at the top, and the warning isn't time-critical.

### 6. Component location stays under `Deployments/Common/`

**Decision**: Don't promote `EntityBanner` to a generic `components/Common/` location.

**Why**:
- Today's only callers are deployment wrappers (`ContainerStatusBanner`, `ImageStatusBanner`).
- Project rule: "Prefer reusing components from `@epam/ai-dial-ui-kit` and `src/components/Common/`" — promoting prematurely would risk a partial design that doesn't fit non-deployment cases.
- Moving the file later is cheap (one rename + import update). Promoting too early and having to redesign is expensive.

## Risks / Trade-offs

- **Test churn**: `ContainerStatusBanner.spec.tsx` likely asserts on `DialAlert`-rooted DOM; after the swap the root becomes `EntityBanner` → `DialAlert`. → **Mitigation**: update the spec to query for the rendered title / message / button rather than the DialAlert wrapper.
- **View-level placement tests**: any test that asserts banner DOM order at the `View.tsx` level (rather than inside `TabsContent`) will fail after the move. → **Mitigation**: locate and rewrite those assertions against the Properties branch of `TabsContent` for each of the four views.
- **Banner not visible on other tabs**: if a user lands on Tools / Events first, they don't see the warning until switching to Properties. → **Mitigation**: existing tab indicators and the absence of a Save button on `Properties` already guide users back. No fix needed.
- **`ImageStatusBanner` portals the install modal**: keep the existing `createPortal(... document.body)` pattern verbatim in the wrapper — `test-setup.tsx` already mocks `createPortal`, so tests stay simple.
- **Spacing parity**: `ContainerStatusBanner` uses `mb-6`, image banner currently uses `mb-8`. Preserve both values at the wrapper call sites (passed via `className` prop into `EntityBanner`). Don't normalize to a shared default in this change — it's a UX call that belongs in a separate visual-polish pass.
