## 1. Models

- [x] 1.1 In `src/models/evaluation/test-suite.ts`, add `ExtractionWarning` (`column`, `expression`,
      `error`) and a `StreamingStatus` enum (`SUCCESS`, `FAILED`, `TIMEOUT`, `ERROR`); add
      `extractedColumns?: Record<string, unknown>` and `extractionWarnings?: ExtractionWarning[]` to
      both `TryOutResponse` and `TryOutHistoryEntry` (design D1, D4). Verify by type-checking a test
      fixture that assigns a full try-it-out envelope, extraction fields included, to `TryOutResponse`.
- [x] 1.2 Move the core-response type out of
      `src/components/TestSuites/RequestTemplate/components/TryOut.tsx` into
      `src/models/evaluation/test-suite.ts` as `TryOutCoreResponse` (`statusCode`, `body`, `streaming`,
      `events`, `streamingStatus`, `truncationWarning`), and update every importer — `TryOut.tsx`,
      `TryOutResponse.tsx`, `tryout-storage.ts` and their specs (design D2). Verify `npx tsc --noEmit`
      reports no errors and no file still imports a `TryOutResponse` meaning the inner core.

## 2. Column result classification

- [x] 2.1 Add the feature's result model in `src/components/TestSuites/utils/` — a
      `ColumnExtractionStatus` enum (`Extracted`, `Failed`, `NotExtracted`) plus `EvaluatedColumn`
      carrying `status` and `error?` in place of `valid` (design D3). Verify by type-checking; no
      behavior yet.
- [x] 2.2 Add a pure value formatter (string verbatim, everything else `JSON.stringify`) and verify
      unit tests cover `false`, `0`, `""`, a number, an object and an array — each staying `Extracted`
      rather than collapsing to a failure (design D6).
- [x] 2.3 Add a pure per-invocation resolver that maps one invocation's declared columns to results
      from its `extractedColumns` / `extractionWarnings`: value → `Extracted`, explicit `null` →
      `Failed` with the matching warning's `error`, declared-but-omitted → `NotExtracted` (design D4;
      spec "Extracted values are the backend's, not recomputed" and "A failed column shows the reason
      it failed"). Verify unit tests cover each mapping, a `Failed` column with no matching warning,
      and a warning whose `expression` differs from the locally held one being the one displayed.
- [x] 2.4 Extend the resolver's no-extraction branch to classify the reason from the invocation —
      non-2xx `statusCode`, terminal `streamingStatus` (`TIMEOUT`/`ERROR`/`FAILED`), otherwise the
      neutral reason; a suite declaring no columns yields no results at all (design D4; spec "A failed
      invocation reports that nothing was extracted"). Verify unit tests cover a 401, a timed-out
      stream, a 200 with neither extraction nor columns, and a 200 with columns but no extraction
      (the restored-legacy case).

## 3. Section building

- [x] 3.1 Rewrite `evaluateTryOutColumnSections` in
      `src/components/TestSuites/utils/evaluate-columns.ts` to build each section's columns through the
      resolver, keeping the existing shape/grouping helpers from
      `src/utils/evaluation/tryout-sections.ts` untouched, and delete `accumulatedBindings`,
      `mergeColumnBindings` and `parseColumnBindingValue` (design D5; spec "Each invocation of a
      multi-invocation try-out shows its own extraction"). Verify unit tests cover per-turn values
      within one request, per-request values across a chain, a later request's column referencing an
      earlier one, and a chain that stopped early showing results only for invocations that ran.
- [x] 3.2 Route MCP-tool suites to the existing `evaluateColumns` path unchanged, ahead of every other
      branch, and keep non-MCP suites off it entirely (design D4; spec "MCP-tool suites keep
      client-side evaluation"). Verify unit tests assert an MCP suite still produces locally evaluated
      valid/invalid results, and that a non-MCP suite evaluates no expression in the browser on either
      the extraction path or the failed-invocation path.

## 4. Try Out panel and presentation

- [x] 4.1 Keep the whole try-it-out envelope in `TryOut.tsx` state, deriving the core response from it,
      and pass the extraction through to `TryOutColumns` for both the fresh and the
      `getTryoutResponseFromStorage` restore path (design D1; spec "A restored try-out result shows the
      same extraction"). Verify component tests assert a restored envelope with extraction renders the
      same values as a fresh one, and that an envelope without extraction renders `NotExtracted`.
- [x] 4.2 Add the i18n keys for the `NotExtracted` badge and the three reasons to
      `src/constants/i18n.ts` and `src/locales/en.ts`, leaving `ValidityStatusI18nKey.Valid` /
      `.Invalid` for `Extracted` / `Failed` (design D8). Verify every new key resolves in `en.ts` and
      that `npm run lint` passes.
- [x] 4.3 Render the three statuses in `ColumnResultsList` in `TryOutColumns.tsx` — success, error and
      a neutral `NotExtracted` treatment using existing layer/stroke tokens — with a reason line above
      the value area, no value area for `NotExtracted`, and the backend-supplied expression shown when
      a warning provides one (design D3, D7). Verify component tests query each card by role and
      accessible name and assert the reason text, switching on status rather than nested conditionals.
- [x] 4.4 Give each card root `role="group"` with an `aria-label` naming the column and its outcome, so
      the distinction currently carried by colour is exposed non-visually (design D7). Verify component
      tests locate all three card kinds via `getByRole('group', { name: … })`.

## 5. Tests

- [x] 5.1 Update the existing specs under
      `src/components/TestSuites/RequestTemplate/tests/TryOutColumns.spec.tsx`,
      `TryOut.spec.tsx` and `src/components/TestSuites/utils/tests/evaluate-columns.spec.ts` for the
      new result model, removing assertions that only held because expressions were evaluated in the
      browser. Verify `npx vitest run src/components/TestSuites` passes from `apps/ai-dial-admin/`.
- [x] 5.2 Add a regression test built from the reproduced case — a streaming response whose body is
      `{ events: [...] }` with `extractedColumns` reporting both `answer` and `id` — asserting both
      columns render as `Extracted` with their reported values, which is the exact case that renders
      as two `Invalid` cards today. Verify the test fails against the pre-change resolver.

No browser-verification task: the user chose unit tests only for this change.

## 6. Quality checks

- [x] 6.1 Run `npm run lint`, `npm run format`, and the full `npm run test` from
      `apps/ai-dial-admin/`, and verify all three pass with no new warnings.
