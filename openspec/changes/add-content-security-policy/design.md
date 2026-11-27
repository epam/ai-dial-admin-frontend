## Context

See proposal.md for why the earlier attempts failed. The facts that shape the approach:

- `headers()` in `next.config.js` is evaluated by `next build` and stored in `routes-manifest.json`; `next start`
  serves the stored result. The `Dockerfile` builds without deployment variables, so anything read there is empty
  in the published image.
- `src/middleware.ts` already runs on every page request. Its matcher excludes `/api`, static files and images. It
  wraps `next-international`'s middleware and, when auth is on, `next-auth`'s `withAuth`.
- The root layout is `force-dynamic` and so is every data page, so each page is rendered per request. A nonce
  needs exactly that.
- The app's own source has no `eval`, no `new Function`, no `dangerouslySetInnerHTML` and no `next/script`.
  Monaco and its workers are bundled and served from the console's own origin. Fonts come from `next/font`, which
  self-hosts them.
- Browser-side network use is same-origin: `fetch` to the console's API routes and four `EventSource` streams.
- The only iframe is `FrameRenderer` on the Parameters tab. Its URL is an entity's editor URL or
  `CODE_APP_EDITOR_URL`, so the set of frame origins is data an admin enters, not deployment configuration.
- Images reach the browser from the console's own origin: entity icons go through `next/image`
  (`/_next/image`), theme files through `/api/themes`. The header logo is the one plain `<img>`.
- Checked on two running deployments: nothing in front of the console sets a policy today.

## Goals / Non-Goals

**Goals:**

- One place builds the policy, as a pure function of a nonce and the environment, testable without a server.
- A deployment that upgrades and changes nothing keeps working.
- An enforced policy that stops an injected script.

**Non-Goals:**

- See proposal.md, Non-goals. At design level: no change to the middleware matcher, to the auth flow, or to the
  three headers `next.config.js` already sets.

## Decisions

### D1. The middleware sets the header

`src/middleware.ts` builds the policy for each request and sets it on the response.

- *`next.config.js` `headers()`* — rejected: build-time, and it cannot carry a per-request nonce.
- *A custom server or a proxy snippet* — rejected: the console ships as a plain `next start` image, and a proxy
  cannot know the nonce.
- *Hash-based policy through `experimental.sri`* — rejected: experimental in Next 15, and experimental options
  are not used for this change.

### D2. The nonce reaches the renderer through request headers

Next applies a nonce to the scripts it emits when the incoming request carries the policy header; it reads the
nonce out of `script-src`, from either header name. The middleware therefore sets the policy on the request as
well as on the response.

`next-international`'s middleware creates its own response, so the request headers cannot be passed in at the
point that response is created. For a page request it returns a plain `NextResponse.next()` carrying the
`X-Next-Locale` header and, when it changes, the `Next-Locale` cookie; for a path without a locale it returns a
redirect.

The console's middleware calls the i18n middleware first. A redirect is returned as it is: it renders nothing and
needs no policy. Otherwise the middleware creates its own response with
`NextResponse.next({ request: { headers } })`, the documented way to pass request headers, moves the locale
header and cookies from the i18n response onto it, and sets the policy header.

- *Copying the request-override headers of a carrier response onto the i18n response* — rejected: those header
  names are internal to Next and not a documented contract.
- *Replacing `next-international`'s middleware with our own locale handling* — rejected: a larger change to a
  path every request takes, for one locale.
- *Reading the nonce in the root layout and passing it down* — not needed: the app renders no script of its own.

### D3. A pure builder under `src/utils/security/`

`buildContentSecurityPolicy` takes the nonce, the mode value and whether the server is in development mode, and
returns the header name and value. Directive names and the mode are enums; the directive
table is one ordered list. The nonce is generated in the middleware, not in the builder, so the builder stays
deterministic. Both use only Web APIs, because middleware runs on the edge runtime.

### D4. Directive values

| Directive | Value | Reason |
| --- | --- | --- |
| `default-src` | `'self'` | Backstop for directives not listed here |
| `script-src` | `'self' 'nonce-…' 'strict-dynamic'` (+ `'unsafe-eval'` in development) | Next's dev runtime evaluates code; production does not |
| `style-src` | `'self' 'unsafe-inline'` | Monaco, AG Grid and ECharts write inline styles |
| `img-src` | `'self' data: blob:` | Icons and theme images are served from the console's origin |
| `font-src` | `'self' data:` | `next/font` self-hosts; Monaco's icon font is inlined |
| `connect-src` | `'self'` | All browser requests are same-origin |
| `frame-src` | `'self' https:` | Editor URLs are admin-entered data |
| `worker-src` | `'self' blob:` | Monaco workers |
| `object-src` | `'none'` | |
| `base-uri` | `'self'` | |
| `frame-ancestors` | `'none'` | Same as today's `X-Frame-Options: DENY` |

`https:` for frames is deliberately wide: editor origins are data we cannot know. Plain `http:` is left out.

### D5. Two modes, selected by one value

`CSP_MODE=enforce` enforces; anything else is report-only. There is no "off".

- *A third `off` value* — rejected. Its only use was a deployment whose proxy owns the policy, and a report-only
  header cannot interfere with one: it blocks nothing.
- *Enforce by default* — rejected for this change. A default that can break an upgrade is what the last attempt
  shipped.

### D6. Left out on purpose

- `form-action` — the built-in sign-in page posts to the console, which answers with a redirect to the identity
  provider. Chromium applies `form-action` to that redirect, so `'self'` would break sign-in, and listing every
  provider origin is per-deployment configuration for little gain.
- `upgrade-insecure-requests` — it broke plain-http embedded editors in the first attempt.
- `report-uri` / `report-to` — needs an endpoint and storage; see Open Questions.

### D7. Source lists are constants, not configuration

No variable feeds a directive. A wrong constant costs nothing while the policy is report-only: the browser
reports it and the constant is corrected in code. A deployment that enforces and hits one sets `CSP_MODE` back.

- *A variable per directive (`frame-src`, `img-src`, `connect-src`)* — rejected. No deployment has asked to
  narrow or extend a list, and each variable needs parsing, filtering against directive injection, documentation
  and tests.
- *`http:` in `frame-src`* — rejected. A browser already refuses an `http:` frame on an `https:` page, so it would
  only matter where the console itself is served over `http:`.

### D8. The mode variable is documented

`CSP_MODE` is added to `README.md`, `.env.template` and `docs/INFRA-CHANGELOG.md`, with the statement that the
policy is report-only until `CSP_MODE=enforce` is set.

- *Leaving it undocumented until enforcement is the default* — rejected. The mode is not a secret: the header
  name and every directive are in each page response, and the variable name is in the middleware source in this
  repository. An operator who is not told about `CSP_MODE` never turns enforcement on.

## Risks / Trade-offs

- [D2 moves two known outputs of `next-international` — the locale header and the cookie — onto a new response; a
  library upgrade that adds a third output would drop it] → A unit test pins both; the browser-verification task
  fails on the first page if the locale or the nonce is lost.
- [A third-party library needs `eval` in production] → Not known today. Report-only surfaces it without breaking
  anything; the browser-verification task runs in enforce mode and reports it before the default ever changes.
- [Report-only writes a console message for every violation] → Acceptable: it is the signal this change exists to
  produce.
- [A proxy in front of the console adds its own enforcing policy without our nonce] → Scripts are blocked by the
  proxy's policy, not ours. Not present on the deployments checked; out of the console's control.
- [`https:` in `frame-src` is a weak restriction] → Editor origins are admin-entered data; a list cannot be known
  in code.
- [An editor on an `http:` origin, or a theme logo given as an absolute URL, violates the policy] → Reported in
  report-only mode, blocked under enforcement. Not known to exist; the fix is a constant in code (D7).
- [`frame-ancestors` is not enforced in report-only mode] → `X-Frame-Options: DENY` stays and covers it.

## Migration Plan

Deploy as any release. No variable is required. Rollback is a redeploy of the previous image; nothing is stored.

## Open Questions

- Where violation reports should be collected once more than a developer's console needs to see them.
- The criterion for flipping the default to `enforce`.
