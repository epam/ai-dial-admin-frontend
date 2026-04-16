## 1. i18n keys

- [x] 1.1 Add `DockerImage = 'Source.DockerImage'`, `NgcRegistry = 'Source.NgcRegistry'`, `HuggingFace = 'Source.HuggingFace'` to `SourceI18nKey` in `apps/ai-dial-admin/src/constants/i18n.ts` (grouped with existing source labels `InternalImage`, `DockerImageReference`)
- [x] 1.2 Add the three corresponding entries under `Source` in `apps/ai-dial-admin/src/locales/en.ts`: `DockerImage: 'Docker Image'`, `NgcRegistry: 'NGC Registry'`, `HuggingFace: 'Hugging Face'`

## 2. Centralized source type label utility

- [x] 2.1 Implement `getContainerSourceTypeLabel(source: ContainerSource | undefined, route: ApplicationRoute, t: Translator): string` in `apps/ai-dial-admin/src/utils/deployments/containers.ts` with one case per `CONTAINER_SOURCE_TYPE` value and an empty-string fallback
- [x] 2.2 Add unit tests in `apps/ai-dial-admin/src/utils/deployments/tests/containers.spec.ts` covering each `CONTAINER_SOURCE_TYPE` value, per-route substitution for `INTERNAL_IMAGE` (MCP / Adapter / Interceptor), and the missing/unknown source fallback

## 3. InternalImageField component

- [x] 3.1 Create `apps/ai-dial-admin/src/components/Deployments/Fields/ContainerSource/InternalImageField.tsx` with `Props` containing `container`, `image?`, `route`, `isModal?`, `disabled?`. Render a `DialLabel` (from `ContainersI18nKey.ContainerImage`) + `DialInputPopup` (the input-with-modal primitive from `@epam/ai-dial-ui-kit`) whose `selectedValue` is `${image.name} (${image.version})` and whose children is `ContainerChangeImage`
- [x] 3.2 Own `isModalOpen` state inside the component and wire it to `DialInputPopup`'s `open`/`onOpen`; on apply, call `updateContainer` with `source: { ...container.source, imageDefinitionId: <id> }` and `router.refresh()`; on error show toast via `getErrorNotification`
- [x] 3.3 Pass `disabled` to `DialInputPopup` when `container.status` is `PENDING` or `STOPPING` (matching `change-image-button` archived spec semantics), when the parent `disabled` prop is true, and when `image` is `undefined`
- [x] 3.4 `DialInputPopup` supplies the popup trigger button with a built-in aria-label (`open-popup`); the `DialLabel` provides the field's visible label. No additional aria-label needed.
- [x] 3.5 Add component tests `apps/ai-dial-admin/src/components/Deployments/Fields/ContainerSource/tests/InternalImageField.spec.tsx` covering: value rendering, label rendering, modal open on click, no modal open for `PENDING`/`STOPPING`/missing image/`disabled`, modal opens for `RUNNING`/`STOPPED`/`FAILED`, `updateContainer` called with correct payload on apply, error notification on failure — reuse existing mocks from `test-setup.tsx`

## 4. Wire INTERNAL_IMAGE into ContainerSource

- [x] 4.1 In `apps/ai-dial-admin/src/components/Deployments/Fields/ContainerSource.tsx`, add `image?: Image` to `Props` and forward to the new component
- [x] 4.2 Add an `INTERNAL_IMAGE` case to the `renderSourceField` switch that returns `<InternalImageField ... />`
- [x] 4.3 Update `apps/ai-dial-admin/src/components/Deployments/Fields/tests/ContainerSource.spec.tsx` to assert that `INTERNAL_IMAGE` containers render the internal image field (title/label assertion only — full behavior lives in step 3.5)

## 5. Remove image from info header, add source-type label

- [x] 5.1 In `apps/ai-dial-admin/src/components/Containers/View/TabsContent.tsx`, remove the `headerPrefix` that renders `MCP Image: ...` with the `OpenPopup` icon (current lines ~112-145), remove `handleModalOpen` / `isModalOpen` / `ContainerChangeImage` portal, remove `onApply` / `updateContainer` import if no longer used
- [x] 5.2 Replace `headerPrefix` with a `DialLabelledText` whose label is `t(EntitiesI18nKey.SourceType)` and whose child text is `getContainerSourceTypeLabel(selectedContainer.source, route, t)`
- [x] 5.3 Keep `ImageInstall` alert + modal logic untouched (separate concern)

## 6. Unconditional ContainerSource + image threading

- [x] 6.1 In `apps/ai-dial-admin/src/components/Containers/Fields/ContainerFields.tsx`, remove the `route === ModelServings || $type === IMAGE_REFERENCE` gate and render `<ContainerSource>` for every container; add `image?: Image` prop and forward to `ContainerSource`. In `ContainerSource.tsx`, the `INTERNAL_IMAGE` branch returns `null` when `isModal=true` so create modals preserve their existing (no-image-field) layout — the new field is a detail-view concern only.
- [x] 6.2 In `apps/ai-dial-admin/src/components/Containers/View/Properties/Properties.tsx`, add `image?: Image` prop and forward to `ContainerFields`
- [x] 6.3 In `apps/ai-dial-admin/src/components/Containers/View/TabsContent.tsx`, forward the existing `image` prop to `<Properties>`
- [x] 6.4 Verify `ContainerView.tsx` already provides `image` (no changes expected) — verified: passes `image` to `TabsContent` at line 319

## 7. Update existing tests

- [x] 7.1 Update `apps/ai-dial-admin/src/components/Containers/View/tests/*` — no existing tests found for `TabsContent` or `ContainerView`, nothing to update
- [x] 7.2 If any spec used `ContainerChangeImage` modal-open behavior from `TabsContent`, relocate those assertions to `InternalImageField` (step 3.5) — no such spec found; behavior is covered exclusively by the new `InternalImageField.spec.tsx`
- [x] 7.3 Update `apps/ai-dial-admin/src/components/Containers/Fields/tests/ContainerFields.spec.tsx` if it exists — no existing spec file, nothing to update

## 8. Visual QA + cleanup

- [ ] 8.1 Run the app with `npm start` and navigate to one container of each source type on each route — verify: (a) info header shows correct `Source type` label; (b) form body shows the source field; (c) for `INTERNAL_IMAGE`, expand icon opens change-image modal, apply updates the container, toast on error; (d) modal opens for `RUNNING`/`STOPPED`/`FAILED` and is disabled for `PENDING`/`STOPPING` — **manual, not run by implementer**
- [ ] 8.2 Visually compare against the design mockup on the four routes: `/mcp-containers/[id]`, `/adapter-containers/[id]`, `/interceptor-containers/[id]`, model servings — **manual, not run by implementer**
- [x] 8.3 Remove any now-unused imports across touched files (verified: TabsContent.tsx imports slimmed; `tsc --noEmit` clean of new errors; `npm run lint` reports 0 errors, only pre-existing warnings in untouched files)

## 9. Code quality checks

- [x] 9.1 Run `npm run lint` — 0 errors (26 pre-existing warnings in unrelated files)
- [x] 9.2 Run `npm run format:write` — auto-fixed prettier formatting
- [x] 9.3 Run `npm run test` — 427 test files passed, 3944 tests passed (2 pre-existing skips)
