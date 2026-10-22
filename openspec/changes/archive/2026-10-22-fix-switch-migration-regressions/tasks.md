## 1. Confirm the root cause

- [x] 1.1 In the running app, click a Features switch and read `scrollTop` on the `Content` root (`components/Content/Content.tsx:97`); then switch its class to `overflow-clip` live and click again. Record the result in `design.md` (Decision 3). If the jump persists, stop and revisit the design.

## 2. Scroll containment

- [x] 2.1 In `apps/ai-dial-admin/src/components/Content/Content.tsx`, replace `overflow-hidden` with `overflow-clip` on the root container.
- [x] 2.2 Check `Sidebar`, `Footer`, `Blackout` and `UserMobile` for `position: sticky` that relies on the root as a scroll container; if any do, use the `relative`-wrapper fallback from `design.md` instead.

## 3. Inherited-feature tooltip

- [x] 3.1 In `apps/ai-dial-admin/src/components/EntityTabs/Features/Features.tsx` and `apps/ai-dial-admin/src/components/Assets/Resources/ResourceFeatures.tsx`, add `items-start` to each switch group container (`flex flex-col gap-y-3`).

## 4. Tests

- [x] 4.1 Update `components/Content/Content.spec.tsx` to assert the root container has `overflow-clip` and not `overflow-hidden`.
- [x] 4.2 Update `components/EntityTabs/Features/tests/Features.spec.tsx` to cover the non-stretched group, the inherited tooltip on a disabled switch, and the absent tooltip on an editable one (the file was `describe.skip`; it is re-enabled).

- [x] 4.3 Add `components/Assets/Resources/tests/ResourceFeatures.spec.tsx` covering the non-stretched switch group (no spec existed for this component).

## 5. Quality checks

- [x] 5.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, and the affected specs (`npx vitest run` from `apps/ai-dial-admin/`), then the full `npm run test`.

<!-- No verification task: the user declined spec-browser-verify for this change. -->
