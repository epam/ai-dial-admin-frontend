## 1. Grafana URL utilities

- [x] 1.1 Add `models.ts` and `constants.ts` under `apps/ai-dial-admin/src/utils/grafana/` (config and link-pair types; defaults `tempo` and `1`, range `now-24h`/`now`, `tableType` `traces`, the `dial.deployment` attribute and the two TraceQL shapes `{ span.dial.deployment =~ ".*<path>" }` and `... >> { status = error }`) and verify `npm run typecheck` passes.
- [x] 1.2 Add `get-grafana-config.ts` reading `GRAFANA_TRACES_URL`, `GRAFANA_TEMPO_DATASOURCE_UID`, `GRAFANA_ORG_ID` from an env record: base link via `normalizeUrl(url, false)` and `null` when blank, `||` fallbacks for empty values, positive-integer org id else `1`. Verify with the config unit tests in task 4.1.
- [x] 1.3 Add `build-application-traces-urls.ts` returning `{ allTracesUrl, errorTracesUrl }`: `{base}/explore` with `schemaVersion=1`, panes encoded exactly once with `encodeURIComponent(JSON.stringify(...))`, `orgId`, and a two-layer escape of the path (regex metacharacters first, then `\` and `"` for the TraceQL string). Verify with the builder unit tests in task 4.1.

## 2. Page and views

- [x] 2.1 In `app/[lang]/assets-applications/[id]/page.tsx` build the links from `process.env` and the loaded application's `_metadata.path`, and pass them as an optional prop to `PlatformApplicationView` and `AppView`. Verify with the page test in task 4.2 (links prop present when configured, absent when not, no change to the other props).
- [x] 2.2 Add `components/Assets/ApplicationGrafanaLinks/ApplicationGrafanaLinks.tsx` (and `models.ts`): one ui-kit `ButtonDropdown` labelled "Traces in Grafana" with All traces and Errors only items that `window.open` their URL with `noopener,noreferrer`, the `grafana.svg` trigger icon and an external-link item icon (`aria-hidden`), a new-tab notice in each item's accessible name, `null` when the links prop is `null`. Verify with the component test in task 4.3.
- [x] 2.3 Render `ApplicationGrafanaLinks` as the header `children` in `Assets/Platform/Applications/View.tsx` and `Assets/Entities/Apps/View.tsx` and accept the new prop in both. Verify with the view tests in task 4.4.
- [x] 2.4 Add the new i18n keys (group enum in `constants/i18n.ts`, strings in `locales/en.ts`) and verify `npm run typecheck` and `npm run lint` pass.

## 3. Configuration and docs

- [x] 3.1 Document `GRAFANA_TRACES_URL`, `GRAFANA_TEMPO_DATASOURCE_UID` and `GRAFANA_ORG_ID` (the Grafana root and the defaults) in the README environment table, and make the `.env.template` entries state their defaults. Verify the table renders the three rows and `npm run validate:agent-docs` still passes.
- [x] 3.2 Add an `Added` entry under `0.24.0` in `docs/INFRA-CHANGELOG.md` naming the three variables, their defaults, that a datasource uid other than `tempo` must be set, and that links appear only when `GRAFANA_TRACES_URL` is set. Verify the entry sits under the right version and section.

## 4. Tests

- [x] 4.1 Unit-test `get-grafana-config.ts` and `build-application-traces-urls.ts` in `utils/grafana/tests/`: defaults, custom uid/org, empty and invalid values, trailing-slash base, blank base returns `null`, panes decode once to valid JSON, errors-only differs only by the `>> { status = error }` clause, versioned public path and platform path, dots in versions escaped, regex metacharacters, `"` and `\` in a path. Verify with `npx vitest run src/utils/grafana` from `apps/ai-dial-admin/`.
- [x] 4.2 Extend the assets-applications page test so the links prop is passed to both views when Grafana is configured and omitted otherwise. Verify with `npx vitest run` on that spec.
- [x] 4.3 Component-test `ApplicationGrafanaLinks`: one button holding both options (closed until opened), each option opens its URL via `window.open` with `_blank` and `noopener,noreferrer`, each option conveys the new tab, renders nothing for `null`. Verify with `npx vitest run` on that spec.
- [x] 4.4 Extend the `Platform/Applications/View` and `Assets/Entities/Apps/View` specs: the dropdown button present beside Delete when the prop is given, absent when not, absent while the JSON editor is open (the unsaved-changes case is covered in the header wrapper specs). Verify with `npx vitest run` on those specs.

## 5. Quality checks

- [x] 5.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test`; all pass at zero errors.
