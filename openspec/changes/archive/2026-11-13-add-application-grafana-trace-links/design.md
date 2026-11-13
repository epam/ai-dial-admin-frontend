## Context

The asset application page is a server component (`assets-applications/[id]/page.tsx`) that fetches the
application from DIAL Core (content plus metadata, merged so identity lives in `name` and `_metadata`) and
renders one of two client views: `Platform/Applications/View` (header: `SimpleEntityHeader`) or
`Assets/Entities/Apps/View` (header: `AssetHeader`). Both headers already render a `children` slot beside the
Delete button, and neither shows entity actions while the application has unsaved changes, the JSON editor is
open, or for a read-only admin.

Grafana today: the Dashboard page gets `GRAFANA_LINK` as a prop from its server page and renders a button if
it is set; runs and try-out render whatever URL the evaluation backend returned. Nothing in this repo builds a
Grafana URL. The reference implementation is the evaluation backend's `GrafanaLinkBuilder`: Explore URL with
`schemaVersion`, URL-encoded `panes` JSON, `orgId`; datasource uid default `tempo`; org id default `1`.

See proposal.md for motivation and scope; `specs/application-grafana-trace-links/spec.md` for the contract.

## Goals / Non-Goals

**Goals:**
- One pure, tested place that turns (config, application path) into the two Explore URLs.
- The attribute name and both query shapes live in constants so a change in what Core emits does not touch
  components.
- No Grafana knowledge and no `process.env` access in client components.

**Non-Goals:**
- A generic "links to Grafana for any entity" component or a change to the Dashboard page's use of
  `GRAFANA_LINK`.
- Making the time range, the attribute name or the error clause configurable through env.

## Decisions

### D1. Build the URLs on the server, in `page.tsx`, and pass them as props
The page already has the application and already runs server code, so it reads the three env variables,
builds `{ allTracesUrl, errorTracesUrl } | null` and hands it to the view.

- *Alternative — expose config through `AppContext` and build in the client:* matches how
  `codeAppEditorUrl` reaches the client, but it ships three more values to every page (even those that never
  render a Grafana link), puts string-building and escaping into client code, and needs a context change
  that every consumer's test mocks (`test-setup.tsx`).
- *Alternative — a server action called on mount:* an avoidable round trip for data the page already has.

The URLs depend only on the application's identity (`_metadata.path` from Core metadata, decoded and with the
`__version` suffix for a versioned public application: `public/ahQuickApp__1.0.0`, or `platform/<name>`),
which editing the form cannot change, so computing them once per page load is correct. The page uses the path
it already loaded, not the `?path=` query parameter, so the link is built from what Core confirmed exists.

### D2. A pure builder plus a separate config reader, under `src/utils/grafana/`
- `get-grafana-config.ts` turns an env record into `{ baseUrl, datasourceUid, orgId } | null`: `GRAFANA_TRACES_URL`
  normalized with `normalizeUrl(url, false)` (so `https://g/` and `https://g` agree), `null` when blank;
  datasource uid via `||` (an empty string from `.env.template` must fall back, which `??` would not);
  org id parsed as a positive integer, else `1`.
- `build-application-traces-urls.ts` takes that config and a name and returns the two URLs.
- Types in `models.ts`, constants (`tempo` and `1` defaults, `now-24h`, `traces`, attribute name, error
  clause) in `constants.ts`, per the code-standards file split.

Splitting reader from builder keeps each testable with plain objects, no `process.env` stubbing, and leaves
the page a thin caller.

### D3. The Grafana root has its own variable, `GRAFANA_TRACES_URL`
`GRAFANA_LINK` is the Dashboard page's "open this URL" target and may point at any page, a specific dashboard
included. Building `/explore` on top of it would break such deployments, so the trace links read their own
variable and leave `GRAFANA_LINK` alone.

- *Alternative — reuse `GRAFANA_LINK` as the root:* rejected for the reason above; it also would have made one
  variable mean two things.
- *Alternative — a new variable that falls back to `GRAFANA_LINK`:* rejected: the fallback reintroduces the
  dashboard-URL failure silently.

### D3a. URL encoding done once, by hand
`panes` is `encodeURIComponent(JSON.stringify(panes))` appended into the query string directly. Passing it
through `URLSearchParams` would encode it a second time, which is what `build(true)` prevents in the Java
builder. A test decodes once and asserts valid JSON.

### D4. Escaping: regex first, then the TraceQL string
The match value is the application's Core path (`_metadata.path`, e.g. `public/ahQuickApp__1.0.0`, or
`platform/<name>`), used as a regex suffix (`".*<path>"`). Unlike the UUIDs the evaluation backend
interpolates, it is free text and contains regex metacharacters at once (`.` in every version number). Two
escaping layers apply, in this order:

1. Regex: escape `\ . * + ? ^ $ { } ( ) | [ ]` so the path matches itself literally.
2. TraceQL string literal: escape `\` then `"`.

`JSON.stringify` then handles the JSON layer. Reversing 1 and 2 would double-escape, and skipping 1 would let
`1.0.0` also match `1x0y0`. Note the suffix form is not anchored at the end by `$` because Tempo regexes are
already fully anchored; the leading `.*` is what makes it a suffix match.

### D5. The query shapes are fixed constants
Confirmed against the live Grafana:

- all traces: `{ span.dial.deployment =~ ".*<path>" }`
- errors only: `{ span.dial.deployment =~ ".*<path>" } >> { status = error }`

The errors-only form uses the descendant operator (`>>`) rather than `&&`: it returns traces where an error
span sits beneath a span of this application, so an error raised by a downstream model or tool call made on
behalf of the application still counts, which `&& status = error` on the application span alone would miss.
Both shapes and the attribute name live in `constants.ts`; the builder only substitutes the escaped path.

- *Alternative — match the bare name:* rejected: versioned public applications share a name across versions
  and only the path (with `__version`) tells them apart, and the confirmed attribute carries the path.
- *Alternative — `&& status = error`:* rejected for the reason above.

### D6. One `ButtonDropdown` in the existing `children` slot
A new `ApplicationGrafanaLinks` component renders one ui-kit `ButtonDropdown` labelled "Traces in Grafana" with
two items (All traces, Errors only), in the neutral outlined style of the header's other buttons. One control
instead of two keeps the header's action row short (it already holds Delete, the JSON toggle and, while
editing, Save and Discard). The component takes the URLs object and returns `null` for `null`, so a view
passes it unconditionally. The trigger carries the existing `grafana.svg` icon; each item an external-link icon
(`IconExternalLink`), both `aria-hidden`.

Items are menu rows, which the kit renders as buttons and gives no `href`, so each opens its URL with
`window.open(url, '_blank', 'noopener,noreferrer')`. The `noopener` keeps the opened page from reaching the
admin tab, which the existing `window.open` Grafana buttons do not do. The cost is that a menu item cannot be
middle-clicked or copied as a link; that is accepted for a compact single control. The new-tab notice is a
visually hidden suffix in each item's label (`All traces (opens in a new tab)`).

- *Alternative — two `LinkButton`s with `href`:* the first implementation. Real anchors (middle-click,
  copy-link), but two buttons in a crowded header; replaced by request.
- *Alternative — `adaptiveActions` on `SimpleEntityHeader`:* gives overflow handling, but adaptive actions
  are `onClick` only (no `href`), `AssetHeader` does not render them at all, and the two views would diverge.
  `children` works identically in both.

### D7. i18n
New keys in a `GrafanaLinksI18nKey` group in `constants/i18n.ts` and `locales/en.ts`: "Traces in Grafana" (the
button), "All traces", "Errors only" and the "opens in a new tab" notice.

## Risks / Trade-offs

- [An application emits no `dial.deployment` span attribute, or a failing call is not marked `status = error`,
  so a link opens an empty result] → outside this repo's control; the query shapes are confirmed against the
  real Grafana and isolated in constants (D5), so a change in what Core emits is a one-line fix.
- [A regex over a path is unanchored on the left by design (`.*<path>`), so `public/a__1.0.0` also matches
  `public/folder/public/a__1.0.0`] → accepted: the leading `.*` is what tolerates whatever prefix Core puts
  before the path, and bucket-qualified paths make a collision unlikely.
- [The datasource uid is not `tempo` on a deployment and the operator forgets the new variable] → documented
  in README and `INFRA-CHANGELOG.md`; the failure is visible (empty Explore) rather than silent corruption.
- [Links vanish for read-only admins and while editing] → inherited from the header's own behaviour and
  stated in the spec; a read-only admin troubleshooting is plausible, so revisit if asked.
- [Installed ui-kit may predate `href` on `Button`] → check the installed version first; if absent, fall back
  to an `<a>` styled with the kit's link classes, keeping `rel="noopener noreferrer"`.
- [The 24-hour range hides older traces] → accepted; the range is one constant.
- [`GRAFANA_TRACES_URL` is set to something other than the Grafana root] → documented as the root; the builder
  only appends `/explore`.

## Migration Plan

No data or API migration. Deployments set `GRAFANA_TEMPO_DATASOURCE_UID` (if not `tempo`) and optionally
`GRAFANA_ORG_ID`; deployments without `GRAFANA_TRACES_URL` see no change. Rollback is removing the links by unsetting
`GRAFANA_TRACES_URL`, or reverting the change.
