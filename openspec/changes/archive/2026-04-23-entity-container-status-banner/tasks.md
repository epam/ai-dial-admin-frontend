## 1. i18n keys

- [x] 1.1 Add `ContainerNotRunningTitle = 'Containers.ContainerNotRunningTitle'`, `ContainerNotRunningDescription = 'Containers.ContainerNotRunningDescription'`, `GoToContainer = 'Containers.GoToContainer'` to `ContainersI18nKey` in `apps/ai-dial-admin/src/constants/i18n.ts`
- [x] 1.2 Add the three entries under `Containers` in `apps/ai-dial-admin/src/locales/en.ts`:
  - `ContainerNotRunningTitle: '{type} serving container for this {typeLower} is not running.'`
  - `ContainerNotRunningDescription: 'This {typeLower} will not be available in the Chat interface until the container is started or reconfigured.'`
  - `GoToContainer: 'Go to Container'`

## 2. Container-list dispatcher

- [x] 2.1 Append `getContainersByView(view: ApplicationRoute)` to `apps/ai-dial-admin/src/utils/deployments/containers.ts` — switches on `view` and returns the matching server-action: `getModelContainers` for `Models`, `getApplicationContainers` for `Applications`, `getMCPContainers` for `Toolsets`, `getInterceptorContainers` for `Interceptors` (matches `DeploymentProperties.tsx:171,191` and `EntityProperties.tsx:80`). Lives with the existing container helpers (`getContainerSourceTypeLabel`, `getContainerTemplate`, etc.) rather than in a component-local file, since the dispatcher is a pure data-layer helper not tied to any component.
- [x] 2.2 Append `getContainersByView` unit tests (all four routes plus an unknown-route default) to `apps/ai-dial-admin/src/utils/deployments/tests/containers.spec.ts` as a nested `describe` block.

## 3. ContainerStatusBanner component

- [x] 3.1 Create `apps/ai-dial-admin/src/components/Deployments/Common/ContainerStatusBanner/ContainerStatusBanner.tsx` with `Props { view: ApplicationRoute; entity: DialModel | DialApplication | DialInterceptor | Toolset }`
- [x] 3.2 Inside the component: call `useProtectedRequest`, `useI18n`; on mount `useEffect` call `getContainersByView(view)`, store the list in local state; silently swallow errors (log via `errorObjLog` or similar; do not `showNotification` — avoid double-toasting since `Containers.tsx` already owns the user-visible error for this call)
- [x] 3.3 Derive `selectedContainer = containers.find(c => c.name === entity.source?.containerId)`
- [x] 3.4 Early-return `null` when any of: `entity.source?.$type !== SOURCE_TYPE.CONTAINER`, `!entity.source?.containerId`, `!selectedContainer`, `selectedContainer.status === CONTAINER_STATUS.RUNNING`, fetch still in flight
- [x] 3.5 Otherwise render `<DialNotification variant={NotificationVariant.Warning}>` with a message composed of two lines — title via `t(ContainersI18nKey.ContainerNotRunningTitle, { type, typeLower })` and description via `t(ContainersI18nKey.ContainerNotRunningDescription, { typeLower })`. Derive `type = getTranslatedEntity(getContainerRoute(view), t)` and `typeLower = type.toLowerCase()`
- [x] 3.6 Pass a `<DialNeutralButton iconBefore={<IconArrowDown .../>} label={t(ContainersI18nKey.GoToContainer)} onClick={goToContainer} />` as children of `DialNotification`. `goToContainer` calls `onOpenInNewTab(getContainerRoute(view), { name: entity.source.containerId })`
- [x] 3.7 Apply `className="mt-4"` (or whatever margin is consistent with `Publications/View/View.tsx:172`'s `mt-8` — match the spacing convention the existing Publications alert uses)
- [x] 3.8 Add component tests `apps/ai-dial-admin/src/components/Deployments/Common/ContainerStatusBanner/tests/ContainerStatusBanner.spec.tsx` covering:
  - Does NOT render when `entity.source?.$type !== CONTAINER`
  - Does NOT render when `containerId` is missing
  - Does NOT render while fetch in flight
  - Does NOT render when container not found in response (deleted case)
  - Does NOT render when status is `running`
  - DOES render for each non-running status (`pending`, `not_deployed`, `crashed`, `stopped`, `stopping`)
  - Title uses the correct `{type}` substitution for Models / Applications / Toolsets / Interceptors
  - Clicking "Go to Container" calls `onOpenInNewTab` with the right route + `{ name: containerId }`
  - Fetch error is swallowed silently (no `showNotification` call, banner renders `null`)

## 4. Wire into the four entity Views

- [x] 4.1 `apps/ai-dial-admin/src/components/Models/View/View.tsx` — render `<ContainerStatusBanner view={ApplicationRoute.Models} entity={selectedModel} />` between `<SimpleEntityHeader>` and the `<div className="flex-1 overflow-auto min-h-0">` wrapping `<TabsContent>`
- [x] 4.2 `apps/ai-dial-admin/src/components/Applications/View/View.tsx` — same, with `view={ApplicationRoute.Applications}` and `entity={selectedApplication}`
- [x] 4.3 `apps/ai-dial-admin/src/components/Toolsets/View/View.tsx` — same, with `view={ApplicationRoute.Toolsets}` and the local selected toolset
- [x] 4.4 `apps/ai-dial-admin/src/components/Interceptors/View/View.tsx` — same, with `view={ApplicationRoute.Interceptors}` and the local selected interceptor
- [x] 4.5 ~~Add one smoke test per View assertion that the banner component is rendered~~ **Skipped** — no existing `View.tsx` test precedent in these four entities; setting up the full cascade of View-level mocks (SimpleEntityHeader, TabsContent, SaveValidationContext, NotificationContext, multiple server actions, etc.) for a one-line import/usage check is disproportionate. The banner's behavior is fully covered by the 16 tests in `ContainerStatusBanner.spec.tsx`; the placement contract is observable from the View source as a sibling between `<SimpleEntityHeader>` and the scroll container

## 5. Code quality checks

- [x] 5.1 Run `npm run lint` — 0 errors; 26 pre-existing warnings in unrelated files, none on touched files
- [x] 5.2 Run `npm run format:write` — formatted one test file
- [x] 5.3 Run `npm run test` — 4292 passed (21 new), 16 pre-existing skips, 0 failures
