## 1. Models, constants and pure utils

- [x] 1.1 In `src/models/analytics/pipeline.ts` add `TransformPreset.DialAppRoute`, `route?: string` on
      `PipelineTransform`, and `source?: string` on `TransformOutputBody`, `TransformOutput` and
      `PipelineOutput`; add `source` to `OutputRow` in `src/models/analytics/pipeline-ui.ts`
- [x] 1.2 Add `src/models/analytics/enrichment-routes.ts` with the pair, the setting, its DTO and the allowlist
      read state enum (listed, not stored, unknown)
- [x] 1.3 Add `src/utils/analytics/enrichment-routes.ts`: deployment rule, route grammar, duplicate detection,
      the 100-pair cap, blank-row filtering, the pair-is-listed comparison and the suggestions derived from
      the applications listing; the limits and the grammar pattern stay in the util, their only consumer
- [x] 1.4 Update `src/utils/analytics/template-placeholders.ts` to the pattern with the optional `:suffix`,
      still returning names only

## 2. Transform DTO and output rows

- [x] 2.1 In `src/utils/analytics/transform-dto.ts` add `route` to the llm-only members, delete it whenever
      the preset is not `dial_app_route`, and leave an absent `preset` absent
- [x] 2.2 Make `fromOutputSpec`, `toOutputSpec` and the legacy read preset-aware: read `source`, drop an
      identity `source` on read, write `source` under the route preset and `jsonata` otherwise
- [x] 2.3 In `src/components/Analytics/Pipelines/Enrich/outputs.ts` carry `source` on the row and publish
      both expressions on the draft, so the preset picks the written member when the request is built

## 3. Analytics settings API and actions

- [x] 3.1 Add `src/server/analytics/enrichment-routes-api.ts` (`getRoutes` mapping `404` to not stored,
      `putRoutes`) and register it in `src/app/api/api.ts`
- [x] 3.2 Add `getEnrichmentRoutes` and `saveEnrichmentRoutes` to `src/app/[lang]/system-properties/actions.ts`
- [x] 3.3 Reuse the existing actions from both pages rather than duplicating them: `getEnrichmentRoutes` for
      the editor's allowlist read and `getApplications` (`src/app/[lang]/applications/actions.ts`) for the
      suggestions

## 4. Shared deployment and route controls

- [x] 4.1 Add a hook under `src/components/Analytics/Common/` that reads the applications listing on demand
      and derives deployment suggestions and route paths by deployment, silent on failure
- [x] 4.2 Add `EnrichmentRouteFields` under `src/components/Analytics/Common/` on `Common/AutocompleteInput`
      (no new props there): deployment and route with suggestions, typed values accepted, per-field error
      text from the pair util

## 5. Enrichment routes tab

- [x] 5.1 Add `EntityViewTab.EnrichmentRoutes` and its entry in `getSystemPropertiesTabs`
      (`src/utils/tabs/utils.ts`), offered only with Analytics enabled, after Sessions source
- [x] 5.2 Add `src/components/SystemProperties/hooks/use-enrichment-routes.ts`: load on first activation, saved
      versus current rows, validity, save with success and error notifications, discard
- [x] 5.3 Add `src/components/SystemProperties/EnrichmentRoutes.tsx`: explanatory text, rows of
      `EnrichmentRouteFields`,
      add and remove actions with accessible names, add disabled at the cap, controls disabled for a
      read-only administrator
- [x] 5.4 Wire the tab into `SystemProperties.tsx` and `Header.tsx`: replace the per-tab ternaries for
      `isChanged`, Save, Discard and the disabled state with a per-tab lookup, and add the tab's error status
- [x] 5.5 Add `SystemPropertiesI18nKey` members and their `locales/en.ts` strings

## 6. Transform editor

- [x] 6.1 In `Enrich/TransformSection.tsx` add the preset selection for an `llm` transform, presenting an
      absent preset as chat completion and keeping an unknown stored value through `withStrandedOption`
- [x] 6.2 Under the route preset replace the Model text field with `EnrichmentRouteFields`, mark a malformed route
      without blocking the save, and keep the plain Model field under chat completion
- [x] 6.3 In `Enrich/OutputsEditor.tsx` label the transform refinement as the source under the route
      preset, bind it to the row's `source`, and mark an identity source
- [x] 6.4 Add a hook that reads the allowlist once the preset is `dial_app_route`, and render the
      not-allowed statement beside the route in a `role="status"` region with a link to System Properties
- [x] 6.5 Add the `:json` form to the placeholder reference beside the template
- [x] 6.6 Add `AnalyticsPipelinesI18nKey` members and their `locales/en.ts` strings
- [x] 6.7 Under chat completion replace the Model text field with `Common/AutocompleteInput`, suggesting the
      models listing (`Enrich/use-model-suggestions.ts`) and the application names; read no listing for `sql`

## 7. Specs and docs

- [x] 7.1 Add the `analytics/app-routes` row to the routing table in `openspec/specs/analytics/spec.md`
- [x] 7.2 Update the sub-capability count and list in `AGENTS.md` and in the Analytics rule of
      `openspec/config.yaml`

## 8. Tests

- [x] 8.1 Unit tests for `src/utils/analytics/enrichment-routes.ts` and the updated
      `template-placeholders.ts`, including `{{members:json}}` and case-sensitive pair comparison
- [x] 8.2 Extend the `transform-dto` and `outputs` specs: route stripped off the route preset and for `sql`,
      absent preset left absent, `source` versus `jsonata` by preset, identity source dropped on read
- [x] 8.3 Specs for `EnrichmentRoutesApi` and the new actions, including `404` as not stored and a `409` passed
      through with the service's message
- [x] 8.4 Component specs for `EnrichmentRouteFields`, `EnrichmentRoutes` and the tab wiring in `SystemProperties`:
      validation messages, Save disabled on an invalid row, blank row not sent, independent stores,
      read-only administrator
- [x] 8.5 Component specs for `TransformSection` and `OutputsEditor`: preset selection, route presence by
      preset, the three allowlist states of the hint, model and application suggestions under chat
      completion, no allowlist request there and no listing request for `sql`
- [x] 8.6 Add any missing mocks to `apps/ai-dial-admin/test-setup.tsx` rather than inline

## 9. Browser verification

- [x] 9.1 Run the `spec-browser-verify` skill against the local stack with auth disabled and Analytics
      enabled, covering the browser-observable scenarios of the three deltas, and resolve every `fail`
      verdict before the change is complete

## 10. Quality gate

- [x] 10.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and
      `npm run test`, and resolve every failure
