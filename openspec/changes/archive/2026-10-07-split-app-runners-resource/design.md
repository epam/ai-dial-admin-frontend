## Context

`AppRunners.tsx` (225 lines) is rendered by `SourceField` (entity API, admin-BE runners) and by
`ResourceSourceField` (callback API, merged runners, `view === AssetsApplications`). The merged case
adds: `runnerOptions` state seeded from `runners`, a `runner.$id` mutation after a Platform re-read,
`$id` labels, an `isMergedSource` prop on `SelectAppRunnersModal` choosing `PICKER_RUNNER_COLUMNS`, and a
Platform-origin open-in-tab URL. Spec `application-source` names `AppRunners` for asset apps and
`platform-app-runners` describes the picker as "shared".

## Goals / Non-Goals

**Goals:**
- `AppRunners` is the minimal admin-BE picker.
- `AppRunnersResource` owns every merged/Platform concern, behaviour-identical to today.

**Non-Goals:**
- `resolve-app-runner.ts` stays as is (shared with `ParametersTab`).
- `SourceField`'s `AssetsApplications` reset branch stays.
- No extracted shared picker.

## Decisions

- **Two sibling files in `SourceField/Application/`**, default exports, one component per file
  (`components.md` §3). `AppRunnersResource` is a move-and-trim of today's file, not a rewrite, so the
  `$id` mutation and its forced options copy are carried over unchanged.
- **Duplicate the small shared bits** (the `sourceEntitySelector` validation effect, Select-vs-Modal
  render, loader, resolving flag) rather than extract. Rule of three: two callers, and the bodies will
  diverge further. Alternative — a shared hook/presentational component — rejected for now as a layer
  over ~40 lines.
- **`SelectAppRunnersModal` takes explicit columns**, replacing the `isMergedSource` boolean it uses to
  pick them, so `AppRunners` passes nothing and `AppRunnersResource` passes `PICKER_RUNNER_COLUMNS`.
  Alternative — keep the boolean — leaves a merged-mode flag reachable from the simple path.
- **`AppRunners` still calls `resolveAppRunnerScheme`.** Only the non-Platform branch is reachable from it;
  splitting the helper would touch `ParametersTab` for no gain here.
- **Spec drift corrected:** `application-source` said asset apps render `SourceField.tsx`; the real
  wiring is `ResourceSourceField`. The delta fixes that claim, the source-items constant and the
  asset validation wording alongside the picker rename.

- **An unmatched stored id is displayed, not resolved.** When `selectedValue` matches no option's `$id`
  (a Platform runner whose `$id` was edited after creation), `AppRunnersResource` appends a
  `{ value, label }` item for it to the dropdown items. That keeps the select and the collapsed field
  filled; the picker opens without a selected row and Open is hidden because no runner is matched.
  Alternatives rejected: resolving the runner through `getResolvedRunnerSchema` (its response carries no
  resource `name`, so it cannot be tied back to a list option) and reading every Platform runner's
  content (one read per runner per render, ruled out by `platform-app-runners`).
- **Open-in-new-tab mirrors `BaseAssetList`.** A pure helper in `SourceField/Application/utils.ts` builds
  the URL with `getUrnForEntity(ApplicationRoute.PlatformAppRunners, ...)`: Platform uses `{ path }`;
  Config uses `{ name: $id }` plus `appendUrlQuery(url, 'configFile=true')`, the same shape the list's
  `handleOpenInNewTab` yields for a config-file row. It returns `undefined` for an option with neither a
  path (Platform) nor a `reference` (Config), which hides the control. `AppRunners` keeps the
  `ApplicationRunners/<id>` URL because its runners are admin-BE-backed.

## Risks / Trade-offs

- [`runner.$id` mutation breaks in the move] → move verbatim; the merged spec moves with it and must
  stay green untouched apart from its import/target.
- [Mock path drift: `SourceField.spec` mocks the `AppRunners` module] → update it, and add the equivalent
  mock for `AppRunnersResource` where `ResourceSourceField` is rendered.
- [~40 lines duplicated] → accepted; revisit when a third picker appears.
