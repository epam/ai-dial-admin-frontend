## Context

The deployment import preview surfaces backend `ValidationError[]` per artifact tab (banner, `TabModel.invalid`, per-row State column, Configuration step error, disabled Import button), all computed in `getDeploymentConfigurationPreview` (`ConfigurationPreview.utils.ts`). The Global Firewall (global domain whitelist) was excluded: `filterArtifactErrors` stripped every `GLOBAL_DOMAIN_WHITELIST` error because the backend used to leave `entityIdentifier` empty, giving no per-domain key.

Backend commit #359 changed this: each invalid domain now produces its own error with `entityIdentifier = <domain>` (or `""` for a `null` entry). The frontend can now join an error to a specific `DomainList` row by exact `entityIdentifier === domain` match. The Global Firewall tab renders a `DomainList` (a `<ul>` over `string[]`) — not an AG Grid — so decoration happens directly in that component.

## Goals / Non-Goals

**Goals:**
- Join each firewall error to its domain row and render it inline: `text-error` domain text + trailing `IconInfoCircle` in a `DialTooltip` with the message(s).
- Gate the import on firewall errors via the existing `validationSummary.totalFailed` path (tab invalid, step error, Import disabled).
- Keep `DomainList` reusable — decoration is opt-in via an optional prop.

**Non-Goals:**
- No backend change; no tab-content banner; no per-row State column on the firewall tab; no change to the admin path, compare modal, or standalone editor.

## Decisions

### Decision: Build a per-domain error map in the preview util
`getDeploymentConfigurationPreview` filters firewall errors separately and reduces them to `firewallErrorsByDomain: Record<string, string[]>` (domain → messages). Using `string[]` per domain mirrors the existing tooltip pattern (`ImportValidationCellRenderer` lists multiple lines) and tolerates the unlikely case of multiple errors for one domain. The map is keyed by `entityIdentifier`; a `null`-domain error keys under `""`.

- **Alternative considered**: `Record<string, string>` (single message). Rejected — marginally simpler but loses multi-error fidelity for no real gain.

### Decision: `validationSummary.totalFailed` includes firewall errors; firewall stays out of `errorsByTab`
`totalFailed = groupedErrors.size + firewallErrors.length`. The Configuration step and Import button already key on `totalFailed`, so gating reuses with no new code. Firewall errors are NOT added to `COMPONENT_TYPE_TO_TAB_ID`/`errorsByTab` (that machinery drives the per-row State column and generic per-tab banner, neither of which applies to the grid-less firewall tab). The Global Firewall `TabModel.invalid` is set directly from `firewallErrors.length > 0`.

- **Alternative considered**: route firewall through `errorsByTab`. Rejected — would resurrect a State column on a tab with no rows and a generic banner the user explicitly does not want.

### Decision: Decorate inside `DomainList` via an optional `errors` prop
`DomainList` gains an optional `errors?: Record<string, string[]>`. For a domain with a matching entry it renders red text + an `IconInfoCircle` (`text-error`) wrapped in `DialTooltip` listing the messages, with `aria-label` set to the domain so assistive tech announces which entry failed. The prop is optional, so the editor/compare callers are unaffected. The visual reuses the established `ImportValidationCellRenderer` pattern (`DialTooltip` + `IconInfoCircle` + `text-error`).

- **Alternative considered**: a separate `DomainListWithErrors` wrapper. Rejected — duplicates markup; an optional prop on the shared component is the DRY choice and keeps a single source of truth.

### Decision: Null-domain errors gate but may not decorate
A `null` whitelist entry yields `entityIdentifier: ""`. It still counts toward `totalFailed` (so the import is blocked) but will only decorate a row if an empty-string domain is actually rendered. This is an accepted edge: gating is preserved; the rare null case simply lacks a visible row to attach to.

## Risks / Trade-offs

- **Tooltip text is raw backend English** → matches how other validation messages are surfaced; localization is out of scope.
- **`DomainList` now has conditional logic** → kept minimal (a lookup + conditional render); shared callers pass no `errors` and behave exactly as before.
- **Reverses published spec requirements** → captured explicitly in the delta spec (REMOVED + MODIFIED) so it is intentional and auditable.

## Migration Plan

Pure frontend, no flag. It tightens validation the backend already performs and reports. Rollback is reverting the FE commit; backend is unaffected.
