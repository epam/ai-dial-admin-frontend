## Context

`MENU_CONFIGURATION()` builds the full left-nav group list, then applies feature-flag filtering at the end. Two groups are flag-gated today: Deployments (`featureFlags.deploymentsEnabled`) and Evaluation (`featureFlags.evaluationEnabled`). The current implementation reassigns `result` from the original `config` in each branch, so the branches do not compose — the last-evaluated disabled flag wins and silently undoes the others.

## Decision

Make each filter branch operate on the accumulated `result`, so disabled-group filters compose:

```ts
let result = [...config];
if (!featureFlags.deploymentsEnabled) {
  result = result.filter((item) => item.key !== MenuI18nKey.Deployments);
}
if (!featureFlags.evaluationEnabled) {
  result = result.filter((item) => item.key !== MenuI18nKey.Evaluation);
}
return result;
```

This is the minimal, lowest-risk fix and preserves the existing control flow and readability.

### Alternative considered

Build a set of disabled group keys and filter once:

```ts
const hiddenGroups = new Set<MenuI18nKey>();
if (!featureFlags.deploymentsEnabled) hiddenGroups.add(MenuI18nKey.Deployments);
if (!featureFlags.evaluationEnabled) hiddenGroups.add(MenuI18nKey.Evaluation);
return config.filter((item) => !hiddenGroups.has(item.key));
```

This scales better as more flag-gated groups are added and structurally cannot regress to the "filter from `config`" bug. Either is acceptable; the chained-`result` form is chosen as the smaller diff for a bug fix. If a third flag-gated group is added later, prefer migrating to the set form.

## Risks / trade-offs

- Behavioral change is strictly additive to correctness: combinations that already worked (one flag off) are unaffected; only the both-off case changes (Deployments now correctly hidden).
- No impact on `DISABLE_MENU_ITEMS` (item-level filter in `getActualMenuItems()`, applied later) or on the `ModelServings` item gating inside the Deployments group.
