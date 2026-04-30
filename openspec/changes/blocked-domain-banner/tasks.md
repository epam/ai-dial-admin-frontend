## 1. i18n keys

- [x] 1.1 Add image-context message key with `{domain}` placeholder under `ImagesI18nKey` in `apps/ai-dial-admin/src/constants/i18n.ts` (e.g., `BlockedDomainInBuild`).
- [x] 1.2 Add container-context message key with `{domains}` placeholder under `ContainersI18nKey` in `apps/ai-dial-admin/src/constants/i18n.ts` (e.g., `BlockedDomainsInRun`).
- [x] 1.3 Add a shared button-label key (e.g., reuse `ButtonsI18nKey` if a fitting one exists, otherwise add a `AddToAllowedDomains` key under the appropriate group — check `BasicI18nKey` / `ButtonsI18nKey` first per project rule).
- [x] 1.4 Add corresponding English values to `apps/ai-dial-admin/src/locales/en.ts` matching the wording in the spec scenarios.

## 2. Shared `BlockedDomainBanner` component

- [x] 2.1 Create `apps/ai-dial-admin/src/components/Deployments/Common/BlockedDomainBanner/BlockedDomainBanner.tsx` as a thin wrapper over `EntityBanner` (from `Deployments/Common/EntityBanner/EntityBanner.tsx`), using the error/red `AlertVariant` from `@epam/ai-dial-ui-kit`. Props: `message: ReactNode`, `buttonLabel: string`, `onAddToAllowed: () => void`. Action button rendered as `children` (use `DialNeutralButton` matching `ImageStatusBanner.tsx`). Domains rendered inside `message` as plain text — no link styling.
- [x] 2.2 Add a co-located unit test file `BlockedDomainBanner.spec.tsx` in `BlockedDomainBanner/tests/` covering: renders with given message, renders the button with given label, fires `onAddToAllowed` on click. Use existing test-setup.tsx mocks; do not use `data-testid`.

## 3. Image side — state lift, SSE listener, banner

- [x] 3.1 In `apps/ai-dial-admin/src/components/Images/View/ImageView.tsx`: add `const [blockedDomains, setBlockedDomains] = useState<string[]>([])`.
- [x] 3.2 In `ImageView`, derive an `invalid` flag on the `InstallationLog` tab from `blockedDomains.length > 0` by mapping over the result of `getDeploymentsViewTabs(...)` immediately after it's computed (no refactor to `useState<TabModel[]>` needed).
- [x] 3.3 In `ImageView`, define an `onAddBlockedDomainsToAllowed` handler that calls `setSelectedImage(prev => ({ ...prev, allowedDomains: Array.from(new Set([...(prev.allowedDomains ?? []), ...blockedDomains])) }))` and then `setBlockedDomains([])`. Wire it through `TabsContent` to `InstallationLog`.
- [x] 3.4 ~~Reset `blockedDomains` on `image.id` change~~ — dropped during review: `ImageView` remounts on navigation, so `useState` initializer already gives a clean slate.
- [x] 3.5 In `apps/ai-dial-admin/src/components/Images/View/InstallationLog/InstallationLog.tsx`: accept new props `blockedDomains: string[]`, `onBlocked: (domain: string) => void`, `onAddToAllowed: () => void`.
- [x] 3.6 In `InstallationLog`, register a `domain` event listener on the existing `EventSource`. On each event, parse `{ domain, verdict }`; call `onBlocked(domain)` only when `verdict === "BLOCKED"` and only if not already in `blockedDomains` (guard against duplicates locally). Remove the listener in cleanup.
- [x] 3.7 In `InstallationLog`, render `<BlockedDomainBanner>` above `<LogViewer>` when `blockedDomains.length > 0`. Build the message via `t(ImagesI18nKey.BlockedDomainInBuild, { domain: blockedDomains[0] })`.
- [x] 3.8 Update/add unit tests in `apps/ai-dial-admin/src/components/Images/View/InstallationLog/tests/InstallationLog.spec.tsx` covering: dispatching a BLOCKED `domain` event invokes `onBlocked`; dispatching an ALLOWED event does not; banner renders only when `blockedDomains.length > 0`. Use the existing `EventSource` mock pattern from `test-setup.tsx` — extend it if needed but reuse the existing infrastructure rather than creating a new mock.
- [x] 3.9 Update/add unit tests in `apps/ai-dial-admin/src/components/Images/View/tests/ImageView.spec.tsx` (or the closest existing parent test) covering: tab `invalid` flag is set on `InstallationLog` when `blockedDomains` is non-empty; `onAddToAllowed` merges into `selectedImage.allowedDomains` deduped, clears `blockedDomains`, and dirties the form.

## 4. Container side — state lift, SSE listener, banner

- [x] 4.1 In `apps/ai-dial-admin/src/components/Containers/View/ContainerView.tsx`: add `const [blockedDomains, setBlockedDomains] = useState<string[]>([])`.
- [x] 4.2 In `ContainerView`, derive an `invalid` flag on the `ExecutionLog` tab from `blockedDomains.length > 0` inside the existing `setTabs(...)` `useEffect` (apply on top of the array returned by `getDeploymentsViewTabs(...)`). Do this for both regular `ApplicationRoute.Containers` and `ApplicationRoute.McpContainers`.
- [x] 4.3 In `ContainerView`, define an `onBlocked = (domain: string) => setBlockedDomains(prev => prev.includes(domain) ? prev : [...prev, domain])` callback and an `onAddBlockedDomainsToAllowed` handler that calls `setSelectedContainer(prev => ({ ...prev, allowedDomains: Array.from(new Set([...(prev.allowedDomains ?? []), ...blockedDomains])) }))` and then `setBlockedDomains([])`. Pass both through `TabsContent` to `ExecutionLog`.
- [x] 4.4 ~~Reset `blockedDomains` on container change / redeploy~~ — dropped during review: `ContainerView` remounts on navigation, and `container.name` doesn't change on save / `router.refresh()` / redeploy, so the effect would never have fired meaningfully.
- [x] 4.5 In `apps/ai-dial-admin/src/components/Containers/View/ExecutionLog/ExecutionLog.tsx`: accept new props `blockedDomains: string[]`, `onBlocked: (domain: string) => void`, `onAddToAllowed: () => void`. Render `<BlockedDomainBanner>` above the pod sidebar+pod-view layout when `blockedDomains.length > 0`. Build the message via `t(ContainersI18nKey.BlockedDomainsInRun, { domains: blockedDomains.join(', ') })`. Pass `onBlocked` down to each `PodView`.
- [x] 4.6 In `apps/ai-dial-admin/src/components/Containers/View/ExecutionLog/PodView.tsx`: accept new prop `onBlocked: (domain: string) => void`. Register a `domain` event listener on the existing per-pod `EventSource`. On each event, parse `{ domain, verdict }`; call `onBlocked(domain)` only when `verdict === "BLOCKED"`. Remove the listener in cleanup.
- [x] 4.7 Update/add unit tests in `apps/ai-dial-admin/src/components/Containers/View/ExecutionLog/tests/PodView.spec.tsx` covering: BLOCKED event invokes `onBlocked`; ALLOWED event does not.
- [x] 4.8 Update/add unit tests in `apps/ai-dial-admin/src/components/Containers/View/ExecutionLog/tests/ExecutionLog.spec.tsx` covering: banner renders only when `blockedDomains.length > 0`; banner message contains all domains comma-joined; clicking "Add to allowed domains" invokes `onAddToAllowed`.
- [x] 4.9 Update/add unit tests in `apps/ai-dial-admin/src/components/Containers/View/tests/ContainerView.spec.tsx` covering: BLOCKED domains accumulate dedupedly across multiple `onBlocked` calls; `ExecutionLog` tab gets `invalid: true` for both regular containers and MCP containers when `blockedDomains` is non-empty; `onAddToAllowed` merges deduped, clears `blockedDomains`, dirties the form.

## 5. Final checks

- [x] 5.1 Run `npm run lint` from the repo root and resolve any new lint errors.
- [x] 5.2 Run `npm run format` (check) from the repo root; if it fails, run `npm run format:write` to apply.
- [x] 5.3 Run `npm run test` from the repo root and ensure all suites pass (this also runs in pre-push).
- [x] 5.4 Sanity-check by reading the diff: confirm no hardcoded user-facing strings, no relative imports outside the current directory, no new `data-testid` in tests, no untouched dependencies declared in `package.json`.
