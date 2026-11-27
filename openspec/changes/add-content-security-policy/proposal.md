## Why

The Admin Console serves no Content-Security-Policy: the header added for issue #523 was disabled the day it
merged and has been commented out in `apps/ai-dial-admin/next.config.js` since. Three attempts (PRs #1086, #1340,
#1353) failed for reasons that are all still in the code: the policy is assembled in `next.config.js`, so its
environment variables are read at build time and are empty in the published image; it leans on `default-src`, so
removing a directive tightened it instead of relaxing it; it allowed inline scripts, so it stopped no injected
script; and it was never observed in a browser before it was enforced.

## What Changes

- Every page response carries a Content-Security-Policy built per request by `src/middleware.ts`, so its
  configuration is read when the server runs, not when the image is built.
- Scripts are allowed by a per-request nonce with `'strict-dynamic'`; `'unsafe-inline'` is not granted to scripts.
- Every fetch directive the console uses is written out explicitly, so no directive falls back to `default-src`
  by omission.
- The policy ships in report-only mode: it blocks nothing and the browser reports what it would have blocked.
  A deployment turns enforcement on with `CSP_MODE=enforce`; any other value, or no value, stays report-only.
- The source lists are constants in code. The mode is the only deployment setting.
- The dead policy, its `console.log` and the commented-out header leave `next.config.js`. `ALLOWED_IFRAME_ORIGINS`
  and `ALLOWED_IMAGE_ORIGINS`, which never had an effect, leave the README.
- `CSP_MODE` is documented in `README.md`, `.env.template` and `docs/INFRA-CHANGELOG.md`, including that the
  policy is report-only until `CSP_MODE=enforce` is set.

## Non-goals

- Making enforcement the default. That is a later change, taken after report-only has run on real deployments.
- Collecting violation reports (`report-uri` / `report-to`). Violations are read from the browser console.
- A policy for the built-in sign-in page under `/api/auth/*`, which the middleware does not serve.
- Removing `'unsafe-inline'` from `style-src`. Monaco, AG Grid and ECharts write inline styles.
- Letting another site embed the console. `frame-ancestors` stays `'none'`, matching today's `X-Frame-Options: DENY`.
- `form-action` and `upgrade-insecure-requests`. See design.md, D6.
- Per-deployment source lists. An embedded editor on a plain `http:` origin is reported, and blocked under
  enforcement; see design.md, D7.

## Capabilities

### New Capabilities

- `content-security-policy`: the Content-Security-Policy the console sends with its pages — where it applies, its
  two modes, how scripts are authorised, and which directives it carries.

### Modified Capabilities

None. `application-parameters-iframe-editor` and `code-editor-runtime` keep their requirements; this change only
has to leave them working under an enforced policy.

## Impact

- `apps/ai-dial-admin/src/middleware.ts` — composes the policy with the existing i18n and auth middleware. Every
  page request passes through it, so a defect here affects the whole console.
- `apps/ai-dial-admin/next.config.js` — dead policy code removed; `X-Frame-Options`, `X-Content-Type-Options` and
  `Cache-Control` stay as they are.
- New policy builder under `apps/ai-dial-admin/src/utils/security/`.
- `README.md` — two rows removed, one added. `.env.template` — one commented entry.
  `docs/INFRA-CHANGELOG.md` — a `Removed` entry for the two old variables and an `Added` entry for `CSP_MODE`.
- Features that load something the policy governs and must keep working under enforcement: the Monaco editor and
  its workers, the Parameters tab iframe (`FrameRenderer`), theme images, entity icons, and the `EventSource`
  streams of containers, image builds and test-suite runs.
- No backend contract changes and no new dependencies.
