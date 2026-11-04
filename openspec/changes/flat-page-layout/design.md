## Context

See proposal.md — Why. Before this change the shell used three surfaces:

- `body` was `bg-layer-1` (`src/app/[lang]/global.scss`).
- The header (`Header.tsx`) uses `bg-layer-base`, the ui-kit 2.0 name of the same layer (`newTokensMap` in
  `src/utils/themes/constant.ts` maps `bg-layer-1` to `bg-layer-base`).
- The left menu (`SideBar.tsx`, and the hover overlay in `MenuContent.tsx`) was `bg-layer-3`.
- `Content.tsx` padded the page slot with `px-0 md:px-6 lg:px-6 pt-6 pb-6`, and every page drew its own
  rounded `bg-layer-2` card inside that slot.

The mockup paints the page, the header and the menu `#10151E`. In the app's dark fallback theme
(`fallbackDarkTheme` in `constant.ts`) that is exactly `bg-layer-1`; `bg-layer-2` is `#1B212D` and `bg-layer-3`
is `#242A38`. The mockup's content starts at x=272 next to a 248px menu and at y=72 under a 48px header: a 24px
gutter on every side.

There is no shared page container. The card is repeated as a literal class string in about 45 entity views
(`… bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative`, where `pb-14` reserves room for the floating action bar on
small screens), in `ListView/List.tsx` (`bg-layer-2 rounded` plus the `mainListEntitiesViewClassName` padding),
and in about 15 other page roots with their own variants.

## Goals / Non-Goals

**Goals:**

- One surface token for the page, the header and the menu, so a served theme keeps them equal.
- The page-level card removed mechanically, with no change to page content structure.

**Non-Goals:**

- A shared page-container component. See Decision 3.
- Retheming modals, drawers, the right and bottom sidebars, the ui-kit grid, or ui-kit components.

## Decisions

### 1. The menu moves to the page's surface, `bg-layer-base`

`body`, the left menu and the menu's hover overlay use `bg-layer-base`, the token the header already uses. The
page keeps the layer it always had (only the token name changes from the legacy alias to the 2.0 name the
header uses); the menu is the one surface that changes color. With no color step left between the menu and the page, the
menu gets the 1px right border the mockup draws (`border-r border-tertiary`, `#2E3647` in the dark theme), the
same stroke as the header's bottom edge.

Alternatives:

- Move the page to the menu's `bg-layer-3`: the first implementation did this. It made the page `#242A38`,
  lighter than the mockup, and every nested `bg-layer-3` element lost its contrast, which then needed ~40
  recolors. Rejected after comparing the hex values with the mockup.
- Keep `body` on the legacy `bg-layer-1`: the same color in the fallback theme, but a served theme could set
  `--bg-layer-1` and `--bg-layer-base` differently; one token for all three guarantees the match.

### 2. One 24px gutter owned by `Content`

`Content.tsx` pads the page slot with `px-4 pt-4 md:px-6 md:pt-6` and `pb-4 md:pb-6` (`pb-0` while the bottom
sidebar is open). 24px matches the mockup from tablet width up; below it the slot keeps 16px, because the card's
`p-4` used to provide the mobile gutter and the mockup has no phone layout. Pages carry no outer padding.

Entity views keep `pb-14` below `lg` so the floating action bar does not cover the last section, and drop the
bottom padding from `lg` up (`lg:pb-0`), where `Content` provides it.

### 3. Strip the card classes in place, no new component

Each page root keeps its layout classes and loses `bg-layer-*`, `rounded*` and the padding that formed the
card. `List.tsx` drops `bg-layer-2 rounded` and the `mainListEntitiesViewClassName` padding; its
`isMainListView` and `isEmbedToModal` props existed only to toggle those classes, so they are removed with their
call sites. The one list rendered in a popup without `isEmbedToModal` (`PickPublicDataset`, preview step) loses
its `bg-layer-2` fill and now matches the popup's other step.

Pages that framed content without the shared wrapper get the same treatment: the asset lists' `FileManager`
drops `bg-layer-2 pb-4 pl-2 pr-6` for `bg-transparent`, the Query Builder header loses its `p-4` and its result
area keeps only `py-4 pr-4`, and the Usage and custom dashboards drop their `px-3`.

Alternative: extract a `PageContainer` component and route the ~60 roots through it. That is the better end
state, but it turns a class-string diff into a structural one across every page, and the roots differ in gaps
and overflow needs. It can follow as a refactor.

### 4. Nested surfaces mostly need no recolor

In the dark theme every surface a page uses inside the old card — `bg-layer-2`, `bg-layer-3`, `bg-layer-4` — is
lighter than `bg-layer-1`, so it stays distinguishable once the card is gone, and nested elements keep their
classes. The exception is the in-page collapsible side panels (App Routes, Audit, Conversations, Requests,
Execution log, Folders Storage): they move from `bg-layer-3` to `bg-layer-2`, the surface the dashboard widgets
and the asset folder tree use, so the side panels match the other raised surfaces (task 2.9). The few
`bg-layer-1` insets inside the old card (session trace panes, run detail header cells) now match the page; they
are checked in the browser and get a border only where they lose their boundary.

### 5. Accordion border follows the kit inputs

Without the card, accordions sit next to kit inputs on the same surface, and their `border-primary` frame
(`#848E9C`) reads heavier than the inputs' `stroke-secondary` (`#404A5E`, from `.dial-kit-input`). The shared
`Common/Accordion` switches to `border-secondary`, and so do the section frames rendered inside entity view tabs
next to accordions (`Interceptors/CollapsableSection`, `InterfacesField`, `Tools/Tool`, `ResourceMultiAuth`,
`ApplicationEndpoint`, `EndpointAndMCPContainer`, `ContainerVariables/Variable`, `ContainerNodePool`,
`ModelView/Pricing`, `UpstreamEndpoints/Endpoint`, `TestSuites/View/McpToolSchema`, `ArgumentTemplate`, and the
App Routes detail panel in `EntityView/AppRoute` and `Assets/ObjectAppRoutes`, and the deployment Metrics tab
cards through `Common/MetricCard/MetricCardShell`, plus the telemetry cards `TelemetryGrid`,
`EntitiesConsumptionTree` and `Dashboards/LineChart`, and on the Sessions page the summary tiles
(`Header/SessionsSummary`) and the grid frame (`SessionsTraceView`), and every frame on the session and trace
detail pages under `SessionsTrace/Detail` (trace cards, span rows, rail panels, the Request/Response inspector);
only the unclassified trace chip keeps `border-primary`). Frames in
modals, on standalone pages, around editors, chips, session trace panels and the hand-made compact controls keep
`border-primary` for now.

### 6. One offset for controls beside a labelled kit input

A kit `Input` with a label puts the field 24px below its top: a 16px label (`min-h-4`) and an 8px gap. Three rows
pushed their remove button down with a copied `mt-7` (28px), so the button sat 4px below the field. They now
share `LABELLED_FIELD_TOP_OFFSET` (`mt-6`) from `src/constants/main-layout.ts`, so a change to the kit label is
fixed in one place.

### 7. Separator lines use the shell's stroke

One-sided borders that separate regions (`border-t`/`-b`/`-l`/`-r`/`-x`/`-y` without a full frame) used
`border-primary`, `border-secondary` or `border-tertiary` with no rule. On the flat page the lighter ones read
as heavier than the header and menu edges, so every such separator in `src/components` moves to
`border-tertiary`. The `DiffMiniMap` viewport frame is a box drawn with side borders and keeps its stroke.

## Risks / Trade-offs

- [The ui-kit grid paints its own background] → the grid uses ui-kit 2.0 tokens (`bg-layer-raised` rows and
  header, `bg-layer-sunken` odd rows, `bg-layer-base` chrome). The mockup's grid colors are checked in the
  running app; a mismatch is reported upstream to ui-kit, not overridden here.
- [Frames on `border-secondary` fall below the a11y 3:1 boundary contrast] → `stroke-secondary` on the dark page
  is about 2:1 (`border-primary` was about 5.5:1), and `.claude/rules/a11y.md` reserves it for decoration. It is
  accepted deliberately so frames match the kit inputs, which draw their own edge with the same stroke; the gap is
  the kit's as much as this change's, and is raised upstream rather than diverging from the kit here.
- [The layer ordering is dark-theme reasoning] → in the light fallback theme `bg-layer-2` (`#FCFCFC`) is almost
  the page colour (`#F5F7FA`) and `stroke-secondary` / `stroke-tertiary` are faint; the browser verification in
  task 3.1 covers the light theme too.
- [`bg-layer-1` insets blend with the page] → see Decision 4; checked page by page in browser verification.
- [A page missed by the inventory keeps its card] → the sweep task greps for the card patterns across
  `src/components`.

## Migration Plan

No data or configuration migration. Rollback is a revert.
