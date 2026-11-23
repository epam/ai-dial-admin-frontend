## 1. Policy builder

- [x] 1.1 Create `apps/ai-dial-admin/src/utils/security/models.ts` with the `CspMode` and `CspDirective` enums and
  the builder's input and result interfaces (design D3).
- [x] 1.2 Create `apps/ai-dial-admin/src/utils/security/csp.ts` with `resolveCspMode` (`enforce` after trim and
  lower-case, otherwise report-only — design D5) and `buildContentSecurityPolicy`, which returns the header name
  and value from the directive table in design D4, including the development-only `'unsafe-eval'`.
- [x] 1.3 Generate the nonce in `apps/ai-dial-admin/src/middleware.ts` with Web Crypto, so it runs on the edge
  runtime and the builder stays a pure function of its input.

## 2. Middleware

- [x] 2.1 In `apps/ai-dial-admin/src/middleware.ts`, call `I18nMiddleware` first in `middlewareFn` and return its
  response unchanged when it is a redirect (design D2).
- [x] 2.2 Otherwise build the policy from `process.env.CSP_MODE` and `NODE_ENV`, create the response with
  `NextResponse.next({ request: { headers } })` carrying the policy header on the request, move the
  `X-Next-Locale` header and the cookies from the i18n response onto it, and set the policy header on it. Leave
  the matcher and the `withAuth` wrapping unchanged.

## 3. Remove the dead policy and document the new one

- [x] 3.1 In `apps/ai-dial-admin/next.config.js`, delete the `ContentSecurityPolicy` constant, the
  `console.log('ALLOWED_IFRAME_ORIGINS', …)` line, the two commented directive lines above it and the
  commented-out header entry. Keep `X-Content-Type-Options`, `X-Frame-Options` and `Cache-Control`.
- [x] 3.2 In `README.md`, remove the `ALLOWED_IFRAME_ORIGINS` and `ALLOWED_IMAGE_ORIGINS` rows and add a row for
  `CSP_MODE`: the policy is report-only unless the value is `enforce` (design D8).
- [x] 3.3 Add `CSP_MODE` to `.env.template` as a commented entry.
- [x] 3.4 In `docs/INFRA-CHANGELOG.md` under the upcoming release, add a `Removed` entry (the two old variables are
  no longer read and had no effect; remove them from deployment values) and an `Added` entry for `CSP_MODE`,
  stating that enforcement is opt-in through `CSP_MODE=enforce`.

## 4. Unit tests

- [x] 4.1 `apps/ai-dial-admin/src/utils/security/tests/csp.spec.ts`: mode resolution (unset, `enforce`, padded and
  mixed case, unknown value); every directive of the spec present exactly once; `script-src` without
  `'unsafe-inline'`, with `'unsafe-eval'` only in development; the exact values of `frame-src`, `img-src` and
  `connect-src`; the same directives in both modes.
- [x] 4.2 `apps/ai-dial-admin/src/tests/middleware.spec.ts`: a page request gets exactly one policy header, named by
  the mode; two responses carry different nonces; the nonce in the response policy equals the one in the policy passed on the request headers; the
  response keeps `X-Next-Locale` and the `Next-Locale` cookie; a redirect from the i18n middleware keeps its
  `Location` and carries no policy header.

## 5. Browser verification

- [x] 5.1 Run the `spec-browser-verify` skill for this change against the local app started with
  `CSP_MODE=enforce` and auth disabled, covering the scenarios of the requirement "Console features keep working
  under an enforced policy". Resolve every `fail` verdict before the change is complete.

## 6. Quality checks

- [x] 6.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test`,
  and fix what they report.
