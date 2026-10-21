## Context

`AppRunnerOption` (`SourceField/Application/models.ts`) merges two runner populations into one list:

- `Config` (was `Entity`): admin-backend `DialApplicationScheme[]`, whose `$id` is authoritative as-is.
- `Platform` (was `Asset`): DIAL Core `ResourceInfo[]`, metadata-only. `toAssetOption` stamps
  `$id: runner.name` — the Core resource name, decoded once via `fromCoreRunnerName` at the list-read
  boundary (`toResourceInfo`). That decode recovers the id **encoded at creation time**
  (`toCoreRunnerName(runner.$id)` in `createRunner`). If a runner's `$id` is edited afterwards through
  its content (Properties tab / JSON editor), the Core resource name — and therefore this decoded
  value — does not follow; only a content read (`getRunner`, via `mergeAppRunnerResource`) sees the
  current `$id`.

`AppRunners.tsx` (the picker, used from both `Entities > Applications` and `Assets > Applications`) and
`ParametersTab.tsx` (the Parameters tab, used from Applications, Application Runners, and Assets
Applications) each independently resolve a selected/current runner's scheme:

```
isAsset = origin === AppRunnerOrigin.Asset
resolve = isAsset ? getResolvedRunnerSchema(runner.$id) : getResolvedApplicationScheme(runner.$id)
```

For a `Platform` runner this passes the possibly-stale list-derived `$id` straight to
`getResolvedRunnerSchema`, which looks the schema up by `$id` on Core (`AppRunnerSchemaApi.resolvedSchema`,
`v1/application_type_schemas/schema?id=…`). A stale id either resolves the wrong schema or fails to
resolve at all, and `AppRunners.tsx` additionally persists that same stale id into the application's
source (`createSchemaSource(value)` / `application_type_schema_id`), so the link keeps failing on every
future load too.

## Goals / Non-Goals

**Goals:**

- `Platform`-origin resolution always resolves against the runner's current, authoritative `$id`.
- One shared implementation of "resolve a runner's scheme by origin" backs both `AppRunners.tsx` and
  `ParametersTab.tsx`.
- `AppRunnerOrigin` member names read as `Config`/`Platform` everywhere.

**Non-Goals:**

- Changing `Config`-origin resolution (already correct).
- Reconciling `ResourceSourceField.tsx`'s flat `application_type_schema_id` field against the
  `application-source` spec's aspirational unified `source.applicationTypeSchemaId` (pre-existing drift,
  out of scope).
- Changing the "Create Assets Application" seeding flow (writes a `schemas/platform/{id}` reference
  form for a different purpose — pre-populating a brand-new application from the runner it was opened
  from — not the picker/Parameters resolution this change touches).
- Persisting/backfilling previously-stored stale ids; this change only affects a `Platform` runner the
  next time it's selected or its Parameters tab is opened.

## Decisions

### A shared resolver, not a hook

`AppRunners.tsx` resolves on a user action (`handleRunnerSelect`) and needs the resolved runner's
corrected `$id` back to persist it; `ParametersTab.tsx` resolves in a `useEffect` keyed off the
application's version and only needs the resolved *scheme* for display. Both are already client
components calling server actions (`'use server'` functions) directly — the existing pattern in both
files — so the shared piece is a plain async function, not a `use-*` hook: no shared React state to own,
and a hook would force `ParametersTab.tsx`'s effect to depend on another hook's own effect timing for no
benefit.

It cannot live in `SourceField/Application/utils.ts` — that file holds pure helpers per
`.claude/rules/utils.md` (§2: "No hidden side effects or I/O"), and this function calls three server
actions. New file: `SourceField/Application/resolve-app-runner.ts`, exporting one function:

```ts
export interface ResolvedAppRunner {
  runner?: DialApplicationScheme;
  scheme?: DialApplicationScheme;
}

export const resolveAppRunnerScheme = async (
  runner?: DialApplicationScheme,
): Promise<ResolvedAppRunner> => { ... }
```

- `runner` in the result is the input runner, except for `Platform` origin where a successful detail
  fetch replaces it with the fetched `DialAppRunnerResource` (cast to `DialApplicationScheme`) — carrying
  the corrected `$id`. Callers needing the corrected id (`AppRunners.tsx`) read `result.runner.$id`;
  callers that don't (`ParametersTab.tsx`) ignore it.
- `scheme` is the resolved schema to render/derive defaults from, falling back to `result.runner` (not
  the original input) when resolution fails or is skipped — matching today's "fall back to the runner
  itself" behavior, now based on the corrected runner when one was fetched.
- Given `undefined`, returns `{}` — both call sites already branch on "no runner selected" before this
  point (`AppRunners.tsx`'s early return, `ParametersTab.tsx`'s `getAppRunner` returning `undefined`), so
  this only needs to be a safe no-op, not a distinct code path.

### Platform resolution fetches details first, then the resolved schema by the corrected id

```ts
if (getRunnerOrigin(runner) === AppRunnerOrigin.Platform) {
  const path = (runner as AppRunnerOption).path;
  const detail = path ? await getRunner(path, DEFAULT_ETAG) : undefined;
  const resolvedRunner = (detail?.success ? (detail.response as DialApplicationScheme) : runner);
  const schemeRes = await getResolvedRunnerSchema(resolvedRunner.$id ?? '');
  return {
    runner: resolvedRunner,
    scheme: schemeRes.success ? (schemeRes.response as DialApplicationScheme) : resolvedRunner,
  };
}
```

Two requests (detail, then resolved-schema-by-corrected-id) rather than one, because `getRunner` returns
the *stored* schema — `dial:applicationTypeSchemaEndpoint`-declared external properties are not merged
in (see `AppRunnerSchemaApi`'s doc comment) — while `getResolvedRunnerSchema` is what performs that
merge, but only when given the right id. Skipping the detail fetch and passing the list-derived id
straight to `getResolvedRunnerSchema` is exactly today's bug. Skipping the resolved-schema call and
using the detail fetch's content directly would silently lose externally-declared properties for any
runner that has them.

If the detail fetch fails (deleted, network), `resolvedRunner` stays the original list-derived option,
matching today's fallback behavior instead of surfacing a harder failure for a case the UI already
tolerates.

`(runner as AppRunnerOption).path` mirrors the existing cast in `use-asset-runner-details.ts` — every
`Platform`-origin `AppRunnerOption` carries `path` (set in `toAssetOption`); a `Config`-origin one
never reaches this branch.

### Config resolution is unchanged, just relocated

```ts
const schemeRes = await getResolvedApplicationScheme(runner?.$id ?? '');
return {
  runner,
  scheme: schemeRes.success ? (schemeRes.response as { schema?: DialApplicationScheme })?.schema : runner,
};
```

Moved verbatim into the shared function's other branch; no behavior change.

### Rename scope

`AppRunnerOrigin.Entity`/`.Asset` → `.Config`/`.Platform`, both the member name and string value (no
consumer persists the string value — it exists only as an in-memory discriminator on `AppRunnerOption`,
built fresh on every read). `SourceI18nKey.EntityRunner`/`.AssetRunner` → `.ConfigRunner`/`.PlatformRunner`
for the same reason the enum is being renamed (the old names invite mapping runner "asset" to the
`AssetApp`/`Assets` section, which is unrelated — an `AssetApp` can itself use either a `Config` or a
`Platform` runner). English display strings ("Configuration file" / "API") are unchanged.

## Risks / Trade-offs

- [Selecting a `Platform` runner now costs one extra request (`getRunner`) before the picker applies] →
  Acceptable: this happens once per selection, on a modal/dropdown apply action, not on every keystroke
  or render; `ParametersTab.tsx`'s effect already made a comparable single extra request before this
  change (it just used the wrong id).
- [`getRunner`'s content read can itself fail for a runner whose `path` is stale] → Falls back to the
  list-derived runner, so the picker degrades to today's behavior rather than blocking selection.
- [Renaming the i18n keys touches `en.ts`/`i18n.ts` alongside the enum, widening the diff] → Kept
  because leaving `SourceI18nKey.EntityRunner`/`.AssetRunner` un-renamed next to a freshly-renamed
  `AppRunnerOrigin.Config`/`.Platform` (which the grid column formatter maps directly to those keys)
  would immediately reintroduce the same naming mismatch this change is fixing.

## Open Questions

None — scope was confirmed with the user (enum rename covers both `AppRunnerOrigin` members and the
paired `SourceI18nKey` members; display text unchanged).
