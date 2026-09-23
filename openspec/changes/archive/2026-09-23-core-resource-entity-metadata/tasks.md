# Tasks — `_metadata` on Core resource detail entities

No browser-verification task is included: the user declined it during planning. All scenarios are
covered by unit/component tests and the two blocking typechecks; the change has no
server-side-config-gated behavior.

## 1. Types and the twelve mergers

- [x] 1.1 Add `CoreResourceEntityMetadata` to `apps/ai-dial-admin/src/models/dial/resource.ts`
      (design D1 shape) and rework the `Dial*Resource` interfaces: remove the flat graft fields
      the mergers no longer set, correct `DialToolsetResource` to the served `updated_at?: number`
      (dropping the merger-artifact `updatedAt: string`), and move
      `DialSkillResource.author/createdAt/updatedAt` into its `_metadata`. Run
      `npm run typecheck` and `npm run typecheck:specs` and fix the app-source errors only to the
      point of compiling — the spec-project errors are burned down by the later test tasks.
- [x] 1.2 Rework `apps/ai-dial-admin/src/server/core/asset-metadata.ts`: the four shared
      formatters (`metadataFields`, `folderMetadataFields`, `flatMetadataFields`,
      `dualBucketMetadataFields`) return the `_metadata` graft object instead of a flat spread;
      the twelve `ASSET_MERGERS` mergers emit `{ ...content, _metadata }` with content untouched
      (design D3) and metadata-first sourcing with content-inline fallback (design D2);
      `status`/`validationWarnings` relocate into `_metadata` where the content response serves
      them.
- [x] 1.3 Rewrite `apps/ai-dial-admin/src/server/core/tests/asset-metadata.spec.ts` per type —
      every merge asserts the `_metadata` nesting, the content-untouched rule (inline
      `author`/`created_at`/`updated_at` survive flat), and the metadata-first precedence — and
      update the merge scenarios in `src/server/core/tests/asset-api.spec.ts`.

## 2. Skill read

- [x] 2.1 Rework `apps/ai-dial-admin/src/server/core/skill-metadata.ts` and the single-skill read
      in `src/server/core/skills-core-api.ts` to populate `_metadata.author/createdAt/updatedAt`
      from the parent-folder listing row, keeping `etag` a separate return value.
- [x] 2.2 Update `src/server/core/tests/skills-core-api.spec.ts` (and the skill-metadata spec) to
      assert the `_metadata` sourcing and the separate etag.

## 3. Write paths

- [x] 3.1 Add the shared `stripMetadata` helper next to
      `stripAssetIdentityFields` in `apps/ai-dial-admin/src/server/assets/exim.ts`, with unit
      tests asserting the outgoing object carries no `_metadata` and nothing else is removed.
- [x] 3.2 Replace the per-field destructuring in the payload builders —
      `src/app/[lang]/platform-keys/actions.ts` (`toKeyPayload`),
      `platform-roles/actions.ts` (`toRolePayload`), `platform-routes/actions.ts`
      (`toRoutePayload`), `platform-app-runners/actions.ts` (`toRunnerPayload`),
      `platform-interceptors/actions.ts` (`toInterceptorPayload`),
      `assets-applications/actions.ts` (`toPlatformApplicationPayload`),
      `assets-toolsets/actions.ts` (`toPlatformToolsetPayload`) — with the `_metadata` strip,
      keeping the per-type quirks (keys' `name`/`description`/`key`, toolsets'
      `reference`/`displayVersion`); update each actions spec to assert the outgoing body.
- [x] 3.3 Change `parsePathFields` enrichment in `apps/ai-dial-admin/src/server/core/asset-api.ts`
      `put` to graft the resolved identity fields into the response's `_metadata`, with spec
      coverage for the versioned/versionless/failed/unparseable scenarios.

## 4. Consumer migration

- [x] 4.1 Migrate the info headers: `src/components/EntityHeaderControls/Info/InfoHeader.tsx` and
      `src/components/Assets/Resources/ResourceInfoHeader.tsx` (delete the
      `updated_at ?? updatedAt` / `created_at ?? createdAt` fallbacks) read
      `_metadata.createdAt/updatedAt/author`; update their component specs.
- [x] 4.2 Migrate `src/components/BaseControls/Maintainer.tsx` display sourcing,
      `src/components/SourceField/Application/utils.ts` runner options, and the Skills view's
      created/updated/author display to `_metadata`; update their specs
      (`SourceField/Application/tests/runner-options.spec.ts`, `Assets/Skills/View/tests/`).
- [x] 4.3 Compiler- and grep-driven sweep of every remaining flat graft read on merged detail
      entities — `.path`/`.folderId`/`.name`/`.version`/`.status`/`.validationWarnings` across
      Views/TabsContent, Move/delete/duplicate flows, `getEntityPath`, and the dual-bucket
      `isPlatformBucketPath(asset.folderId)` checks (`asset._metadata.folderId`) — guided by
      `npm run typecheck` errors and a `grep -rn "\.folderId\|\.validationWarnings"` pass over
      `src/components` and `src/app/[lang]`; fix each to read from `_metadata`, and update the
      affected component specs (including `Publications/View` specs only where they render
      Core-resource shapes, not publication models).
- [x] 4.4 Verify `ResourceInfo` list rows and their grid column definitions are untouched (no
      `_metadata` on rows), with a regression test asserting the flat row shape via
      `toResourceInfoList`.

## 5. exim

- [x] 5.1 Keep `_metadata` in exim export documents and strip it on import by composing
      `stripMetadata` into the `transformForPut`/`stripAssetIdentityFields` chain in
      `apps/ai-dial-admin/src/server/assets/exim.ts`; update the exim specs
      (`src/server/{prompts,assets,toolsets,applications}/tests/exim.spec.ts`) to assert both
      directions.

## 6. Docs and final gates

- [x] 6.1 Update any `docs/` page that describes the merged entity shape (issue #4474 carries the
      `to-be-documented` label); if none exists, note that in the change's archive summary.
- [x] 6.2 Final quality gate: `npm run lint`, `npm run format`, `npm run typecheck`,
      `npm run typecheck:specs` (zero errors), and the full `npm run test` from
      `apps/ai-dial-admin/` (use the Windows `NODE_OPTIONS` prefix from memory if the plain
      command fails).
