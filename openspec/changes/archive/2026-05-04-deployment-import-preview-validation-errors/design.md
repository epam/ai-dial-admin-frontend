## Context

The deployment Config Import preview lets users see what will be created/updated before clicking Import. The deployment manager backend now validates every deserialized entity during preview (spec `010-import-validations`) and returns a `validationErrors` array of `{ entityType, entityIdentifier, fieldPath, message }`. The frontend currently:

- has no visual indication of preview-time errors,
- has no banner or per-row marker,
- lets the user click Import on a known-bad file, after which the backend returns 400 with a flattened text blob in `ErrorView.message` rendered as a single error toast,
- has no signal in the wizard (the `Configuration` step appears identical regardless of validation outcome).

This change wires the FE to the new `validationErrors` field so users can fix the file before clicking Import.

The existing preview pipeline is:

```
ImportConfig.tsx (owns DialSteps)
  └── ConfigurationPreview.tsx
        └── previewDeploymentImportConfig() → DeploymentImportPreviewResponse
              └── getDeploymentConfigurationPreview() → { previewData, prevData, tabs, globalFirewall }
                    └── DeploymentConfigurationGrid (ag-grid: Action | DisplayName | Description | Name)
```

We extend the response, the preview-build util, the grid, the wizard step status, and add a per-tab banner — without touching the admin (non-deployment) import path.

## Goals / Non-Goals

**Goals**:

- Surface validation errors at preview time, per row, per tab, per active-tab banner, in the wizard step indicator, and globally on the Import button.
- Block Import while preview-time errors exist.
- Reuse existing ui-kit affordances (`TabModel.invalid`, `DialTooltip`, `DialAlert`, `StepStatus`) — no new visual primitives.
- Keep the data model honest: each row stays a faithful BE entity, FE-only metadata isolated under a single `__import` namespace.

**Non-goals**:

- Partial import / per-entity selection (backend forbids; out of scope).
- Global firewall (`GLOBAL_DOMAIN_WHITELIST`) error UI (rare; explicitly out of scope).
- Parsing import-time 400 text into structured errors (race-only; toast remains).
- Changes to admin Config Import path (`isDeployments === false`).

## Decisions

### 1. Where validation metadata lives on rows

**Decision**: nested `__import` namespace per row.

```ts
row.__import = {
  validationState: 'VALIDATED' | 'FAILED',
  validationErrors: ValidationError[],
};
```

**Why**: a single grab-bag for FE-only metadata; one namespace to strip in tests; cell renderer reads `params.data.__import.validationState`. Won't appear in any column accidentally; doesn't clash with real entity fields.

**No `entityIdentifier` field**: tests use *data isolation* (crafting a response where only one candidate identifier could possibly match) to verify that the multi-candidate matcher picks the right key. Exposing the matched candidate as a field would be a test-only public API.

### 2. Multi-candidate row-to-error matching

**Decision**: try each row against multiple candidate identifiers in order:

```
1. next.name
2. next.id
3. `${next.name}(${next.version})`         ← composite
4. prev.name
5. prev.id
6. `${prev.name}(${prev.version})`         ← composite
```

The first candidate to match an error keyed as `${entityType}::${candidate}` wins. Matching always reads `componentItem.next` / `componentItem.prev` directly — never display fields that may have been clobbered for the IMAGE tab.

**Why**: the BE keys errors differently per entity type:
- For deployments, the BE's `entityIdentifier` is `Deployment.id` (the slug, e.g. `"echo"`) → matches `next.name`.
- For image definitions, observed live data shows `entityIdentifier = "${name}(${version})"` (e.g. `"Registry image(1.0.0)"`) → matches the composite candidate.

Multi-candidate trades a few cheap lookups for resilience to BE convention drift across entity types and update vs. create.

**Reference**:
- BE validator: `ImportConfigValidator.java:66` (deployment) and `:87` (image definition)
- FE clobber site: `ConfigurationPreview.utils.ts` — IMAGE-tab `name = prev?.id` rewrite

### 3. Per-tab error indicator

**Decision**: set `TabModel.invalid: true` on tabs whose error count > 0.

**Why**: `@epam/ai-dial-ui-kit` already renders a red `IconExclamationCircle` next to the label when `tab.invalid === true` (`DialTab.tsx`). No custom UI; matches the rest of the app's tab-error pattern.

### 4. Per-tab banner (not global)

**Decision**: render `ValidationBanner` *inside* the active tab's content area, between `DialTabs` and the grid. Banner count = `validationSummary.errorsByTab[selectedTab]`. Hidden when 0.

**Why**: scopes the message to what the user is currently looking at. Switching tabs swaps the banner, matching how the State column is already tab-scoped. Avoids a permanent global banner that says "X total errors" while showing a clean tab.

**Copy**: composed of two i18n keys with different weights:
- `ImportI18nKey.ValidationBannerHeading` — semi-bold, with `{count}` interpolation: *"{count} artifacts could not be imported."*
- `ImportI18nKey.ValidationBannerHelp` — regular: *"Update or replace the invalid files and try uploading again."*

Renders inside `DialAlert` (`AlertVariant.Error`).

### 5. State column renderer

**Decision**: `ImportValidationCellRenderer` at `src/components/Grid/CellRenderers/`. Uses tabler icons directly (no colored dots).

**Output**:
- `VALIDATED`: `IconCheck` (`text-success`) + label `t(BasicI18nKey.Validated)`.
- `FAILED`: `IconX` (`text-error`) + label `t(BasicI18nKey.Failed)` + right-aligned (`ml-auto`) `IconInfoCircle` (`text-secondary`) wrapped in `DialTooltip`. Info icon carries `aria-label={label}`.

**Why solid icons over dots**: design uses real check/X marks for clearer semantic signal. Right-aligned info icon mirrors the design's "row state on the left, expandable detail on the right" layout. Gray info icon avoids redundant red — the X already communicates failure; the info icon is the *interaction affordance*.

**Tooltip line format**:

```ts
const formatValidationLine = (e: ValidationError): string =>
  e.fieldPath ? `${e.fieldPath}: ${e.message}` : e.message;
```

`fieldPath: ""` only happens on backend mapping failures (`ImportConfigValidator.java:75,96`) where the message already begins with `"Mapping failed: …"`.

### 6. Component-type → tab id mapping

**Decision**: `COMPONENT_TYPE_TO_TAB_ID` lives at `src/constants/deployments/import.ts` alongside `DEPLOYMENT_RESPONSE_KEYS` (response key → component type) and `GLOBAL_FIREWALL_TAB_ID`. Tab ids for response keys are derived: `responseKey → componentType → tabId`.

```
MCP_DEPLOYMENT          → MCP_CONTAINER
ADAPTER_DEPLOYMENT      → ADAPTER_CONTAINER
APPLICATION_DEPLOYMENT  → APPLICATION_CONTAINER
INTERCEPTOR_DEPLOYMENT  → INTERCEPTOR_CONTAINER
NIM_DEPLOYMENT          → MODEL_SERVING
INFERENCE_DEPLOYMENT    → MODEL_SERVING
{MCP|ADAPTER|APP|INTERCEP}_IMAGE_DEFINITION → IMAGE
```

`GLOBAL_DOMAIN_WHITELIST` deliberately absent — filtered out upstream.

### 7. Configuration wizard step status

**Decision**: `ConfigurationPreview` accepts an `onValidationChange(hasErrors: boolean)` prop. After the deployment preview resolves, it calls the callback with `validationSummary.totalFailed > 0`. `ImportConfig` updates the `Configuration` step's `status` accordingly:

- `hasErrors: true` → `StepStatus.ERROR` (red icon)
- `hasErrors: false` → `StepStatus.VALID` (green check)

**Why callback over global state**: parent owns the `steps` state already; one callback keeps the data flow downward and the contract narrow.

### 8. Import button disable + tooltip

**Decision**: extend `isImportDisabled`:

```ts
isImportDisabled = (isDeployments ? !files?.length : isLoading || !files)
                || validationSummary.totalFailed > 0;
```

The button is wrapped in a *single* `DialTooltip` whose `hideTooltip` is true unless validation errors are the SOLE reason for disabling. No conditional ternary.

**Why**: simpler JSX (no variable extraction, no branch); `hideTooltip` is the ui-kit's first-class affordance for this exact case.

### 9. Filtering whitelist errors

**Decision**: `filterArtifactErrors(errors)` strips `entityType === 'GLOBAL_DOMAIN_WHITELIST'` before any banner/grouping/summary logic runs.

**Why**: explicitly out of scope. Backend still rejects on Import; any leftover whitelist-only failure surfaces as the existing toast.

## Component Structure

```
ImportConfig.tsx (owns steps state)
├── DialSteps (Configuration step status driven by onValidationChange)  ← extension
└── ConfigurationPreview.tsx
    ├── h1 + DialTooltip > DialPrimaryButton (Import)                     ← always wrapped, hideTooltip toggled
    ├── DialTabs                                                           ← tabs[i].invalid extension
    └── (tab content area)
        ├── ValidationBanner (per active tab, when count > 0)              ← NEW
        └── DeploymentConfigurationGrid
              ├── action column   (existing)
              ├── …entity columns (existing)
              └── State column                                              ← NEW
                    cellRenderer: ImportValidationCellRenderer
```

## Data Flow

```
PreviewResponse {validationErrors[]}
        │
        ▼
filterArtifactErrors()             (drops GLOBAL_DOMAIN_WHITELIST)
        │
        ▼
groupErrorsByEntity()              (key: `${entityType}::${entityIdentifier}`)
        │
        ├──► buildErrorsByTab()    → Partial<Record<EntityType, number>>   → tab.invalid + per-tab banner count
        ├──► totalFailed           → onValidationChange(true|false) → Configuration step status
        ├──►                       → Import button disable + tooltip
        └──► enrichRowsWithValidation()
                row.__import = { validationState, validationErrors }
                                                    ▲
                                                    │
                              ImportValidationCellRenderer
```

## i18n

Keys added to `ImportI18nKey` and `src/locales/en.ts`:

```
ImportI18nKey.ValidationBannerHeading  = "{count} artifacts could not be imported."
ImportI18nKey.ValidationBannerHelp     = "Update or replace the invalid files and try uploading again."
ImportI18nKey.ImportBlockedTooltip     = "File errors must be resolved before importing"
ImportI18nKey.State                    = "State"
```

Plus `BasicI18nKey.Validated` (reusing existing `BasicI18nKey.Failed`).

## Test infrastructure

Global `useI18n` mock in `test-setup.tsx` updated to return a *closure-stable* `t` (matching `next-international`'s production semantics):

```ts
vi.mock('@/src/locales/client', () => {
  const t = (key: string) => key;
  return { useI18n: () => t, useCurrentLocale: () => 'en' };
});
```

This avoids infinite-loop re-renders in components that include `t` in `useEffect` dep arrays. Centralizing this in test-setup means no per-spec override needed.

## Edge Cases

- **`validationErrors` absent or empty** → `totalFailed = 0`, every row VALIDATED, banner hidden, all tabs valid, Configuration step valid, Import enabled.
- **Multiple errors for same entity** → grouped by `entityType + entityIdentifier`, rendered as multiple lines in one tooltip.
- **`fieldPath: ""` (mapping failure)** → message-only line; no `field:` prefix.
- **Only whitelist errors in response** → filtered out; FE shows a clean preview but BE will 400 on Import. User sees the existing toast.
- **Identifier collision across types** (e.g. an MCP deployment named "echo" and an adapter deployment named "echo") → join uses `${entityType}::${entityIdentifier}` so collisions across types don't cross-contaminate.
- **Image-definition error keyed as `${name}(${version})`** → composite candidate matches.
- **Race: file changes between preview and import** → import-time 400 → existing toast path unchanged.

## Risks / Trade-offs

- **Backend timing**: this change requires the deployment manager backend to ship `validationErrors`. FE is forward-compatible (treats absent field as no errors), so the change can land first; behavior only activates once BE deploys.
- **Whitelist errors invisible in UI**: a user with only whitelist errors sees a "clean" preview, then a 400 on Import. Documented; acceptable given the rarity.
- **Multi-candidate breadth**: trying 6 candidates per row is more permissive than a single-key match. In rare collision cases (e.g. two distinct rows that share *some* candidate string with the same `entityType`) the wrong row could be flagged. In practice the BE's identifier is unique per entity within a type, so collisions don't occur. If they do, both rows would be marked failed — fail-loud rather than fail-silent.
- **`__import` namespace on row data**: ag-grid never references it via `field`, so it can't leak into a column header by accident.
- **`COMPONENT_TYPE_TO_TAB_ID` drift**: if BE adds a new component type, FE won't know about it. We don't add a forward-compat fallback; a future BE addition would need a paired FE update.
- **Test setup mock change**: stabilizing `useI18n`'s `t` matches production semantics, but is a global change. Verified: 4436/4436 existing tests pass with the new mock.
