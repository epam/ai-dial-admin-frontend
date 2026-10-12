## 1. Foundation (no behavior change)

- [x] 1.1 Add `ApplicationRoute.Containers = '/containers'` in `src/types/routes.ts` and `MenuI18nKey.Containers` in `src/constants/i18n.ts` / `src/locales/en.ts`; keep the four old members for now
- [x] 1.2 Add `src/constants/deployments/container-types.ts`: `CONTAINER_TYPE` ↔ container kind (`ApplicationRoute.*Containers`) mapping, `getContainerPath`, and per-type config (translated type label, create-source options); add the model/type in an adjacent `models.ts`
- [x] 1.3 Name rules checked against the backend (global id): no per-type helper needed; create and duplicate keep the all-container name set
- [x] 1.4 Unit tests for the config (every one of the four types present, labels resolve)

## 2. Unified list page

- [x] 2.0 Confirm the broken list cells ("Source type" `[object Object]`, raw timestamps in "Creation time" / "Updated time") are fixed by the Grid 2.0 formatter fix already on `development` (#4973, `FormattedValueCellRenderer`); add a rendered-cell-text test for the container columns (Source type, Source Name, both time columns) only if #4973 did not cover them

- [x] 2.1 Add the Type column to `CONTAINERS_COLUMNS` (`src/constants/deployments/containers.tsx`) with a cell renderer using the 1.2 labels; update `containers.spec.tsx`
- [x] 2.2 Create `src/app/[lang]/containers/page.tsx`: one `getContainers()` call, keep the four types, pass all containers' per-type name data to the list
- [x] 2.3 Rework `ContainersList` (and `getUrnForEntity`, `onOpenInNewTab`, `storageKey`, `getHref`) to use `ApplicationRoute.Containers` and the row's `$type` instead of the `route` prop; update its specs

## 3. Unified detail page

- [x] 3.1 Create the per-type wiring map (`loadEntities`, `createEntity`, `Wrapper`) server-side next to the page; MCP gets `ToolsetFolderProvider`, application gets no companion
- [x] 3.2 Create `src/app/[lang]/containers/[id]/page.tsx`: fetch container and image, `getContainers(type)` for rename validation, `notFound()` for unsupported `$type`
- [x] 3.3 Rework `ContainerView`, `TabsContent`, `ContainersButtonsWrapper` and `utils/tabs` so tab sets and labels derive from `$type` rather than `route`; keep each type's tab set identical to today; update specs
- [x] 3.4 Move the `/containers/[id]/[activityId]` audit-detail page (currently under each old folder, if present) to the unified route

## 4. Create modal with type selector

- [x] 4.1 Add the type selector and type-driven source options to the create flow in `components/Containers/List/HeaderButtons.tsx` via a wrapper around `ContainerCreate` / `ServingCreate` (no new props on shared components); collapse the `create*DockerImage` modal types
- [x] 4.2 Validate the name against all container names; redirect to `/containers/[id]` on success
- [x] 4.3 Unit tests: selector required, source options per type, per-type validation, read-only admin sees no Create

## 5. Cross-cutting call sites

- [x] 5.1 Switch the audit route map (`constants/activity-audit.ts`), `utils/deployment-navigation.ts`, `utils/open-in-new-tab.ts`, `utils/is-view.ts`, breadcrumbs (`components/Breadcrumbs/constants.ts`) to `ApplicationRoute.Containers`
- [x] 5.2 Switch the remaining consumers: export-config (`deployment-utils.ts`, `AddEntities/utils.ts`), `SourceField/utils.ts`, `Deployments/Fields/ContainerEndpoint.tsx`, `EntityView/Modals/Delete/utils.ts`, help links (`constants/help-documentation-links.ts`)
- [x] 5.3 Update the specs touched by 5.1–5.2 (`deployment-navigation`, `open-in-new-tab`, `get-rollback-*`, `get-activity-audit-detail-data`, breadcrumbs, `EntityProperties`, `DeploymentProperties`)

- [x] 5.4 Resolve the header help link from the container type on `/containers/[id]` (new `HelpTopicContext`, set by `ContainerView`, read by `HelpButton`); the list has no help entry (the button is hidden there); add tests

## 6. Menu, redirects, cleanup

- [x] 6.1 Replace the four menu entries by one "Containers" entry in `components/Menu/menu-configuration.tsx` (and `menu-item-icons.tsx`); update `menu-configuration.spec.ts`
- [x] 6.2 Add the legacy redirects in `next.config.js` (list, `[id]`, `[id]/[activityId]` for the four segments) and retarget the existing `mcp-deployments` / `interceptor-deployments` rules; add a test for the redirect table
- [x] 6.3 Delete the four old route folders under `src/app/[lang]/*-containers/`, mark the four `ApplicationRoute.*Containers` members as internal kinds (enum comment), remove now-dead fixed-type wrappers whose last caller moved; `npm run typecheck` and `npm run typecheck:specs` at zero

## 7. Docs

- [x] 7.1 Update `docs/MENU-DOCUMENTATION.md` (one Containers entry)
- [x] 7.2 Search `docs/` for the four legacy paths and update them

## 8. Browser verification

- [x] 8.1 Run the `spec-browser-verify` skill for this change against the local app (auth disabled): list with Type column and formatted Source type / time cells, create modal type selector, detail page per type, legacy-URL redirects, single menu entry; resolve every `fail` verdict

## 9. Quality checks
- [x] 9.1 Run lint, format check, both typechecks and the full test suite; fix findings
