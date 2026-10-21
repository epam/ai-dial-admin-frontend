## Why

Prompt and completion pricing can only be authored as flat values even though cache pricing already supports DIAL Core's conditional `PricingRate` decision trees. Cache controls are also inconsistently hidden on the entity model surface. Administrators need one pricing experience across every model rate and surface.

## What Changes

- Let prompt, completion, cache-read, and cache-write prices use the existing flat-or-conditional pricing-rate editor.
- Show every pricing control on both `Entities > Models` and `Assets > Models`.
- Preserve per-million token display scaling, zero-versus-unset behavior, Core's token-only cache validation, and conditional-tree formatting in the models grid.
- Update model pricing types so prompt and completion values can persist DIAL Core `PricingRate` decision trees.
- Keep the four flat pricing controls in one responsive row; when any control enters conditional decision-tree editing, render the complete pricing group as a column so the expanded editor has sufficient width.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `model-cache-pricing`: Extend conditional rate authoring and readable grid rendering from cache rates to prompt and completion rates, while retaining cache-rate safeguards.

## Impact

- `apps/ai-dial-admin/src/components/ModelView/Pricing/` and model-asset properties callers.
- `apps/ai-dial-admin/src/models/dial/model.ts` and model-grid column formatting.
- Focused pricing and grid tests; no new dependencies, backend endpoint, or notification behavior.

## Non-goals

- Changing DIAL Core's pricing evaluation or validation contract.
- Allowing cache rates for non-token cost units.
- Changing model save workflows, pricing units, or activity-audit behavior beyond compatibility with widened pricing values.
