## Context

`buildAssetsExport` (`apps/ai-dial-admin/src/server/assets/exim.ts:39-53`) is the single generic export builder shared by Applications, Prompts, and Toolsets:

```ts
export const buildAssetsExport = async <T extends { id?: string }>(
  config: AssetEximConfig<T>,
  assetApi: AssetApi,
  token: Token,
  paths: string[],
): Promise<ParsedAssets> => {
  const entities: T[] = [];
  for (const path of paths) {
    const entity = await assetApi.getMerged<T>(token, config.resourceType, path);
    if (entity) {
      entities.push({ ...entity, id: `${RESOURCE_TYPE_PREFIX[config.resourceType]}${path}` });
    }
  }
  return config.setEntities(entities);
};
```

Each `path` here is expected to be a single versioned-entity content path. `assetApi.getMerged` (`apps/ai-dial-admin/src/server/core/asset-api.ts:89-103`) calls `getContent` first; a folder has no content resource, so `getMerged` returns `null` for a folder path and the loop silently drops it (this exact behavior — "skips a path that resolves to nothing" — is already asserted by an existing test at `exim.spec.ts:33-39`, written for the genuinely-missing-resource case, not realizing it also matches every folder). `BaseAssetList.tsx`'s `onExport` (lines 400-457) pushes a selected `FOLDER` node's raw path straight into the `paths` array it hands to `exportApps`/`exportPrompts`/`exportToolsets` — so a folder path reaches `buildAssetsExport` unchanged and always yields zero entities.

The codebase already has the primitive needed to fix this correctly: `apps/ai-dial-admin/src/server/folders/resource-walk.ts` exports `gatherResourceUrls`/`fetchAllPages`/`isFolderNode`/`isItemNode` — a walker that pages through a `recursive=true` Core metadata read and flattens every descendant ITEM url at any depth into one list. This is exactly what `folders-core.ts`'s `changeFolderCore`/`removeFolderCore` already use to gather a folder's full contents for move/delete. Files export solves the same "expand a folder before processing" problem differently — one level only, via `resolveExportEntries`/`listFolderChildren` in `apps/ai-dial-admin/src/server/files/export.ts` — but per user decision this fix follows the deep-walk pattern instead, since nested folders are an expected case for exportable asset trees.

## Goals / Non-Goals

**Goals:**
- When a folder path is passed to `buildAssetsExport`, expand it into every descendant leaf resource path (any nesting depth) before the existing `getMerged`-per-path loop runs, so the resulting export document contains every entity actually inside the folder.
- Keep non-folder (single-item) paths behaves exactly as today — no behavior change for the common case of exporting directly-selected items.
- Fix once in the shared `buildAssetsExport`, so Applications, Prompts, and Toolsets export (both JSON and Archive) are all corrected together.
- Reuse `resource-walk.ts`'s existing walker rather than writing a second implementation of "recursively gather descendant URLs."

**Non-Goals:**
- No change to Files export — it already has its own (one-level) folder-expansion and isn't affected by this bug.
- No change to how folder paths reach `buildAssetsExport` from the UI (`BaseAssetList.tsx`'s `onExport`/`exportedItems` reduce) — the paths array already correctly includes a folder's raw path when a folder is selected; the bug is entirely in what `buildAssetsExport` does with that path.
- No change to the export document shape (`{ applications: [] }` / `{ prompts: [] }` / `{ toolSets: [] }`), the JSON/Archive branching in `runAssetExportAction`, or any exported entity's fields/`id` construction beyond what folder-expansion requires.
- No change to Conversations export — no such action exists in the codebase today; out of scope for this fix.
- No change to version-selection semantics: the recursive walk returns whatever concrete resource URLs Core's `recursive=true` metadata read reports for the folder (matching what `removeFolderCore`/`changeFolderCore` already gather for the same folder), not a re-derivation of "latest version only" or similar — consistent with today's delete/move behavior for the same folder tree.

## Decisions

**D1 — Determine folder-vs-item via a single non-recursive metadata read, not via `getMerged` returning `null`.**
Reuse the same check `folderExists` in `folders-core.ts:68-78` already makes: read metadata for the path with `recursive: false` and inspect `nodeType` via `isFolderNode`/`isItemNode` from `resource-walk.ts`. This is an explicit, correct signal — unlike inferring "must be a folder" from `getMerged` returning `null`, which conflates "this is a folder" with "this path genuinely doesn't exist," the exact ambiguity that let the bug exist unnoticed under the "skips a path that resolves to nothing" test.
- Alternative considered: keep trying `getMerged` first and only fall back to folder-expansion when it returns `null`. Rejected — this can't distinguish a real folder from a stale/deleted path, and would silently swallow genuine not-found errors into "empty folder," the same class of silent-failure the D1 approach avoids.

**D2 — Expand a confirmed folder via `gatherResourceUrls(readRecursive, path)`, reusing `resource-walk.ts` as-is.**
No new walking logic. Build a `readRecursive` callback the same shape `folders-core.ts`'s private `readRecursiveMetadata` already uses (`assetApi.getMetadata(token, type, path, { recursive: true, nextToken })`), decode each returned URL back to a bare path (`decodeCorePath(stripPrefix(url, RESOURCE_TYPE_PREFIX[type]))`, matching `folders-core.ts:220`), and feed the resulting bare paths into the existing `getMerged`-per-path loop unchanged.
- Alternative considered: write export-local recursive-walk logic directly in `exim.ts` instead of reusing `resource-walk.ts`. Rejected — `resource-walk.ts` already exists as a shared, tested primitive precisely for this "gather all descendant resource URLs" need; duplicating it here would reintroduce the same risk of subtle divergence (pagination via `nextToken`, flat-vs-nested `items[]` handling) that its own doc comment says the backend's original implementation got wrong.

**D3 — Expand at the front of `buildAssetsExport`, not by changing what `BaseAssetList.tsx` sends.**
The UI already gives `buildAssetsExport` a folder's raw path when a folder is selected for export — that's correct input. Expansion belongs in the function that knows how to walk Core, not in a UI component that shouldn't need per-type Core-walking knowledge duplicated into it (Applications/Prompts/Toolsets all reuse the same UI component).

## Risks / Trade-offs

- **[Risk]** An extra non-recursive metadata read per top-level selected path (D1) adds one Core round-trip before the existing recursive walk/`getMerged` calls. → **Mitigation**: this only runs per *top-level selected path* (typically a handful of folders/items a user picked to export), not per descendant — same order of magnitude as the existence checks `changeFolderCore` already performs before a move.
- **[Risk]** A very large/deeply-nested folder could produce a large number of `getMerged` calls (one per descendant), same as today's per-path loop but now over many more paths. → **Mitigation**: this mirrors the existing fan-out cost `removeFolderCore`/`changeFolderCore` already accept for the same operation shape (gather-then-act-per-resource); no new complexity class is introduced, and export was already expected to handle folder contents per the original (unimplemented) migration design.
- **[Trade-off]** Choosing deep-walk over Files export's one-level `resolveExportEntries` pattern means Applications/Prompts/Toolsets export and Files export now expand folders using two different code paths with different depth semantics. → Accepted per user decision (nested folders are an expected case here); reconciling the two into one shared utility is not undertaken by this change.

## Migration Plan

No data migration. Pure code-path fix, no schema/API contract change — deploy as a normal frontend release.

## Open Questions

- None outstanding — scope confirmed: Applications/Prompts/Toolsets export only, deep recursive expansion, no changes to Files or Conversations export.
