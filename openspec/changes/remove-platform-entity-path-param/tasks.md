## 1. Update URL builder

- [x] 1.1 In `src/utils/open-in-new-tab.ts`, update `getEntityPath` for all six `ApplicationRoute.PlatformXxx` cases: return `encodeURIComponent(resolvedName)` for navigation and `decodeURIComponent(escapePercentSign(resolvedName))` for `forRemove`, dropping `?path=<encoded>`. The `$id` fallback uses `encodeURIComponent($id)` so app runner URLs (raw `http://…`) are pre-encoded to the same singly-encoded form Core stores as the resource name.

## 2. Update page components

- [x] 2.1 In `src/app/[lang]/platform-models/[id]/page.tsx`, replace `searchParams: Promise<{ path: string }>` with the route `params.id` segment: read `(await params.params).id` directly as the resource path (no extra `decodeURIComponent` — Next.js already decodes the segment once, restoring the singly-encoded Core name) and remove the `searchParams` prop entirely.
- [x] 2.2 Apply the same `searchParams` → `params.id` change to `src/app/[lang]/platform-app-runners/[id]/page.tsx`.
- [x] 2.3 Apply the same change to `src/app/[lang]/platform-interceptors/[id]/page.tsx`.
- [x] 2.4 Apply the same change to `src/app/[lang]/platform-routes/[id]/page.tsx`.
- [x] 2.5 Apply the same change to `src/app/[lang]/platform-roles/[id]/page.tsx`.
- [x] 2.6 Apply the same change to `src/app/[lang]/platform-keys/[id]/page.tsx`.

## 3. Update tests

- [x] 3.1 In `src/utils/tests/open-in-new-tab.spec.ts`, update assertions for the six platform entity cases to expect plain `encodeURIComponent(name)` URLs with no `?path=` suffix.

## 4. Browser verification

- [ ] 4.1 Run `/spec-browser-verify` for this change to confirm the URL-shape scenarios pass against the running local app.

## 5. Quality checks

- [x] 5.1 Run `npx vitest run src/utils/tests/open-in-new-tab.spec.ts` from `apps/ai-dial-admin/` and confirm all tests pass.
- [x] 5.2 Run `npm run lint` and `npm run format` and fix any issues.
