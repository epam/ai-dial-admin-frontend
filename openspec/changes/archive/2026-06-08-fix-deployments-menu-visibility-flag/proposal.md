## Why

Setting `DEPLOYMENTS_ENABLED=false` does not hide the Deployments left-nav group (issue #3589). The env var is parsed correctly — `isValueTruthy('false')` returns `false`, so `featureFlags.deploymentsEnabled` is `false` — but the group still renders.

The root cause is in the menu-group filter at the end of `MENU_CONFIGURATION()` (`apps/ai-dial-admin/src/components/Menu/menu-configuration.tsx:204-213`). Both feature-flag branches re-filter from the **original** `config` instead of the accumulated `result`:

```ts
let result = [...config];
if (!featureFlags.deploymentsEnabled) {
  result = config.filter((item) => item.key !== MenuI18nKey.Deployments);   // from config
}
if (!featureFlags.evaluationEnabled) {
  result = config.filter((item) => item.key !== MenuI18nKey.Evaluation);    // from config again — clobbers the line above
}
return result;
```

So when **both** Deployments and Evaluation are disabled, the second branch rebuilds `result` from the pristine `config`, re-adding the Deployments group the first branch removed. Evaluation is gated on `DIAL_EVAL_API_URL != null`, so deployments that simply don't set that URL have Evaluation off by default — which is exactly why this corner case is hit so easily in practice. The reported workaround (listing every Deployments child in `DISABLE_MENU_ITEMS`) works only because that filter runs later at the item level in `getActualMenuItems()` and bypasses this broken group-level filter entirely.

## What Changes

- Fix the group-visibility filter so each feature-flag branch composes independently — chain each filter off the accumulated `result` rather than the original `config`. With both flags disabled, both the Deployments and Evaluation groups are removed.
- No change to how flags are read from env, to `DISABLE_MENU_ITEMS`, or to the `ModelServings`-item gating inside the Deployments group.

## Capabilities

### New Capabilities
- `menu-group-visibility`: feature-flag-gated hiding of entire left-nav menu groups (Deployments via `DEPLOYMENTS_ENABLED`, Evaluation via `DIAL_EVAL_API_URL`), where each flag removes its own group independently of the others.

### Modified Capabilities
<!-- None. `model-servings-visibility` gates the ModelServings *item* within the Deployments group and is orthogonal to this group-level filter. -->

## Impact

- **Component**: `apps/ai-dial-admin/src/components/Menu/menu-configuration.tsx` — the filter block at the end of `MENU_CONFIGURATION()`.
- **Tests**: `apps/ai-dial-admin/src/components/Menu/tests/menu-configuration.spec.ts`.
- **No env/API/server-action change** — flags are already read in `[lang]/layout.tsx` and carried on `FeatureFlags` via `AppContext`.
- **Non-goals**: changing `DISABLE_MENU_ITEMS` semantics, changing `isValueTruthy`/env parsing, altering the `ModelServings` item gating (`nimEnabled`/`hfEnabled`), or adding new feature-flag groups.
