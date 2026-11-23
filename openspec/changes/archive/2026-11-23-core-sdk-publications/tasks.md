## 1. Checks that gate the work

- [x] 1.1 Re-verify the caller audit in `design.md` against the code (`publications/[id]/page.tsx`, `app/actions/publications.ts`, `PublicationsButtonsWrapper.tsx`, `folders-core.ts`): every path-taking method still receives a Core-issued path; update the table if a line or caller moved
- [x] 1.2 Diff SDK `Publication` / `PublicationResource` / `Rules` against `CorePublicationCreateDto`, `CorePublicationUpdateDto`, `CorePublicationResource` and `CorePublicationRule`; confirm `publishCredentials` is neither read nor sent and note the result in `design.md` D7
- [x] 1.3 Write the empty-body specs first in `server/entities/tests/core-publications-api.spec.ts` against the real SDK (`CORE_TEST_URL`): approve, reject and delete on an empty `200` and on `204` resolve `success: true` with the `BaseApi` envelope. **If openapi-fetch throws, stop and ask the user before touching `core/core-api.ts`**

## 2. Calls on the SDK

- [x] 2.1 `CorePublicationsApi`: `getPublicationList` and `getPublication` call `getPublications` / `getPublication` through `sdkGet`; `createPublication`, `ruleList`, `approvePublication`, `declinePublication`, `deletePublication` and `updatePublication` call their SDK ops through `sdkAction`. Ids as `design.md` D2: Core-issued path unchanged after `PUBLICATIONS_PREFIX`, `ruleList` through `encodeFolderPath`, `createPublication.targetFolder` as given (JSDoc says the caller encodes it). `sanitizeComment`, the FormData parsing, `uploadStagedFiles` and the `clients.updateAsset` loop stay
- [x] 2.2 The list read keeps `(res.publications ?? []).flatMap(...)` behind one typed cast with a comment naming the SDK schema mismatch (D3)
- [x] 2.3 Widen `getPublicationList` and `getPublication` to `… | null | undefined`, documented once on the private helper (D5); map `undefined` to `null` in `app/[lang]/publications/page.tsx` and `[id]/page.tsx`
- [x] 2.4 Delete the eight `CORE_PUBLICATION_*_URL` constants from `constants/publications-core.ts`; keep `PUBLIC_PUBLICATIONS_PATH` and `PUBLICATIONS_PREFIX`

## 3. Types move to the SDK

- [x] 3.1 Remove `CorePublication`, `CorePublicationInfos` and `CorePublicationRulesResponse` from `server/publications/models.ts`; keep the admin-only types and enums that add something
- [x] 3.2 Re-type `mapPublicationBase`, `mapRules`, `resolvePublication`, `buildUpdatePlan` and the `resolver/*` files to the SDK types; handle optional `url` / `status` and convert the `status` and rule `function` literals to the admin enums in `mappers.ts`, with no invented defaults (D4): an unknown `function` passes through, missing `source` / `targets` stay absent, a list item without `url` or `status` is skipped, a `get` without `status` resolves to `null`
- [x] 3.3 Re-type `folders-core.ts` (`getRulesCore`, `createAndApprovePublication`, `updateRulesCore`) with no `any` and no weakened `DialRule`

## 4. Tests

- [x] 4.1 Rewrite `server/entities/tests/core-publications-api.spec.ts` for the SDK `Request` (`fetch.mock.calls[0][0]`, headers via `new Headers(...)`), `CORE_TEST_URL`, no SDK mock: method and path of each operation, bearer token, the list object shape, 403 → `undefined`, other failure and abort → `null`, approved and rejected `get` → `null`
- [x] 4.2 Id specs: a Core-issued `public/My%20Folder/req%2520__1` reaches the body of get, approve, reject, delete and update unchanged; `ruleList('My Folder/100%')` sends `My%20Folder/100%25/`; `createPublication` sends the target folder as given; a created `publications/public/My%20Folder/` approved by its returned path sends `publications/public/My%20Folder/`
- [x] 4.3 Cross-flow spec: `folders-core` against a real `CorePublicationsApi` over the fetch mock for a folder `My Folder` — rule-list body `My%20Folder/`, create target folder `public/My%20Folder/`, approve body the returned url unchanged
- [x] 4.4 Rules and update specs: an unknown rule `function` and a rule with no `targets` pass through; the update body carries url, name, target folder, resources, resource types, rules and display author and no `publishCredentials`; reject strips HTML from the comment
- [x] 4.5 Update `mappers.spec.ts`, the resolver specs, `app/api/tests/publications-enrichment.spec.ts` and `folders/tests/folders-core.spec.ts` for the SDK types; add the page-data cases for a 403 (`undefined` → `null`) for the list page and the view page
- [x] 4.6 Run the component specs that reach the publication actions without a Core URL — `DIAL_CORE_API_URL= npx vitest run` over `Publications/View/tests`, `EntityHeaderControls/Wrappers/tests/PublicationsButtonsWrapper.spec.tsx`, `app/actions/tests/publications.spec.ts` and `folders-storage/actions.spec.ts` — and mock `@/src/app/actions/publications` in any spec that throws in `getCoreSdk`

## 5. OpenSpec bookkeeping

- [x] 5.1 Confirm `core-client` lists the eight publication calls after archive; no browser-verification task is added because every scenario's THEN is a request body, a resolved value or an envelope, not UI state

## 6. Gates

- [x] 6.1 From `apps/ai-dial-admin/`: `npx vitest run src/server src/app src/components/Publications src/components/EntityHeaderControls`, then `npm run typecheck`, `npm run typecheck:specs`, `npm run lint` and `npm run lint:specs`; check `git ls-files --eol` for `w/crlf` on touched files
- [x] 6.2 Run the full `npm run test` in the background as the final gate; rerun `EditableCellRenderer.spec.tsx`, `RequestsSidebar.spec.tsx` and `publications-enrichment.spec.ts` alone before treating a failure as real
