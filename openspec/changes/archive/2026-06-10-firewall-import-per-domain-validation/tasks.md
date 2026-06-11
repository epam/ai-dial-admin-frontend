## 1. Validation pipeline (utils)

- [x] 1.1 In `ConfigurationPreview.utils.ts`, extract `GLOBAL_DOMAIN_WHITELIST` errors from `response.validationErrors` and reduce them to `firewallErrorsByDomain: Record<string, string[]>` keyed by `entityIdentifier` (value = that domain's messages). Keep `filterArtifactErrors` for the artifact/row path.
- [x] 1.2 Set `validationSummary.totalFailed = groupedErrors.size + <firewall error count>` so firewall errors gate the Configuration step and Import button via the existing path.
- [x] 1.3 Mark the Global Firewall `TabModel.invalid` true when any firewall error exists, when pushing the firewall tab.
- [x] 1.4 Return `firewallErrorsByDomain` from `getDeploymentConfigurationPreview` (add to the return type).

## 2. Per-domain decoration (components)

- [x] 2.1 Extend `DomainList.tsx` with an optional `errors?: Record<string, string[]>` prop. For a domain with a matching entry, render `text-error` domain text + trailing `IconInfoCircle` (`text-error`) in a `DialTooltip` listing the messages, with `aria-label={domain}`. Domains without a match render unchanged. No prop → unchanged behavior. Use `classNames` for conditional classes.
- [x] 2.2 In `DeploymentConfigurationGrid.tsx`, accept `firewallErrorsByDomain?: Record<string, string[]>` and pass it to `DomainList` as `errors`. Leave the heading and "Compare changes" button unchanged.
- [x] 2.3 In `ConfigurationPreview.tsx`, add state for `firewallErrorsByDomain`, destructure it from `getDeploymentConfigurationPreview`, set it, and pass it to `DeploymentConfigurationGrid`.

## 3. Tests

- [x] 3.1 Update `ConfigurationPreview.utils.spec` cases that assert firewall errors are filtered out / `totalFailed === 0` to the new behavior (firewall errors keyed by domain, counted in `totalFailed`, firewall `TabModel.invalid` true, `errorsByTab` firewall-free).
- [x] 3.2 Add util tests: errors grouped into `firewallErrorsByDomain` by `entityIdentifier`; mixed response → artifact + firewall counts combined; clean firewall → empty map, tab not invalid.
- [x] 3.3 Add `DomainList` test: invalid domain → `text-error` + info icon + tooltip message + `aria-label`; valid sibling undecorated; no error map → unchanged rows.
- [x] 3.4 Add `DeploymentConfigurationGrid` test: firewall tab passes the error map to `DomainList` so the invalid domain is decorated; clean firewall → no decoration.
- [x] 3.5 Add `ConfigurationPreview` test: firewall-only error disables the Import button (`ImportBlockedTooltip`) — proves gating.

## 4. Verification

- [x] 4.1 Run `npx nx lint ai-dial-admin` and the touched specs (and/or `npx nx test ai-dial-admin`); fix failures.
- [x] 4.2 Manually confirm: import a deployment config with an invalid firewall domain → that domain row is red with an info tooltip, Global Firewall tab shows the red exclamation, Import button disabled, Configuration step red; a clean config decorates nothing and import proceeds.
- [x] 4.3 Regression check: admin Config Import path, the compare modal, and the standalone Global Firewall editor (`GlobalWhitelist.tsx`) are unaffected (DomainList `errors` prop is optional).
