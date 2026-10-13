## Why

On a pending Application or Toolset publication, the Properties tab shows an empty Version field
(issue #4975), and editing it does not take effect. Version is not a resource field — it is the
`__version` suffix of the resource path — and the publication edit flow still reads and writes a flat
`version` that merged Core reads no longer carry (the value lives in `_metadata.version`).

DIAL Core already supports this: `updatePublication` recomputes `reviewUrl` from the submitted
`targetUrl` and moves the review copy when it changes, so no Core change is needed.

## What Changes

- The publication Version control reads and writes `_metadata.version` (Application and Toolset).
- `buildUpdatePlan` builds each versioned resource's `targetUrl` from `_metadata.version` (falling back to flat `version`).
- The post-update content PUT for Application and Toolset targets the **new** review path (the old `_metadata.path` with its last segment swapped to `{name}__{version}`), since Core has moved the review copy there.
- `ApplicationDetails` / `ToolsetDetails` stop fabricating a flat `path` from name and version.

## Non-goals

- Changing a resource's name inside a publication.
- Special handling when the new target already exists — Core's "Target resource already exists" error surfaces through the normal error path.
- Any change in `ai-dial-core`.
- Prompt, conversation, file, and skill publications (versionless or not editable here).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `publications-core-api`: "Update with file staging and target recalculation" — target URL uses the edited `_metadata.version`, and Application/Toolset content is written to the post-move review path.

## Impact

- `components/Assets/Apps/Properties.tsx`, `components/Assets/Toolsets/View/Properties.tsx` (VersionControl wiring, already partly in the working tree)
- `components/Publications/Assets/{Application,Toolset}/*Details.tsx`
- `server/publications/update.ts`
- `utils/files/path.ts` (`updatePathWithNameAndVersion` may become unused)
- Shared `Properties` components are also used by the non-publication asset views; only the `isPublication` branch changes.
