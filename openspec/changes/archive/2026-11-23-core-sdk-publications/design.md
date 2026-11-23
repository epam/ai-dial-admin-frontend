## Context

See `proposal.md` for motivation. Phases 1 and 2 (`archive/2026-11-10-adopt-core-sdk-pilot` D1–D6,
`archive/2026-11-18-core-sdk-settings`, `archive/2026-11-18-core-sdk-deployments`) fixed the pattern this change reuses:
`getCoreSdk(host)`, the `sdkAction` / `sdkGet` adapters on `CoreApi`, `encodeCorePath` for typed names, Core-issued ids
sent unchanged, SDK types returned instead of admin shapes, and tests that drive the real SDK against
`vitest-fetch-mock` with `CORE_TEST_URL`.

`CorePublicationsApi` is the only class that issues publication calls. Callers pass a **Core-issued** path in every
case:

| Method | Callers | Where `path` comes from |
| --- | --- | --- |
| `getPublication` | `publications/[id]/page.tsx` | `?path=` query, built from `publication.path`, decoded once by Next, equal to the Core id |
| `approve` / `decline` / `delete` | `app/actions/publications.ts` ← `PublicationsButtonsWrapper` | `entity.path` from list / get |
| `approvePublication` | `folders-core.ts` | `stripPrefix(createdUrl)` from Core's `create` response (e.g. `publications/public/y%20o2/`) |

The line numbers are re-verified in task 1.1; they drift.

## Goals / Non-Goals

**Goals:**
- All eight publication operations go through the SDK with behaviour unchanged for callers.
- The SDK's `Publication`, `Rule` and `Rules` types replace the duplicated `Core*` shapes.
- Id handling per input is pinned by specs, including `/`, space and `%`.

**Non-Goals:** the `EnrichmentClients` calls, the `BaseApi` fix, moving `createPublication`'s folder encoding, and
any UI change.

## Inventory of `src/server/publications/`

| Item | Core call | Decision |
| --- | --- | --- |
| `core-publications-api.ts` (in `server/entities/`): list, get, create, rule list, approve, reject, delete, update | `/v1/ops/publication/*` | **migrate** — SDK ops `getPublications`, `getPublication`, `createPublication`, `getPublicationRules`, `approvePublication`, `rejectPublication`, `deletePublication`, `updatePublication` |
| `publications/resolver/*` (`resolve`, `file-`, `skill-`, `project-resource`, `url-resolver`) | none directly; reach Core through `EnrichmentClients` | **keep** — no Core call to move; only their input types change |
| `EnrichmentClients.getAsset` / `updateAsset` / `getBucket` | asset reads and writes | **keep** — platform-entity phase (`AssetApi`) |
| `EnrichmentClients.getFileMetadata` / `uploadFile` | `v1/metadata/files`, `v1/files` | **keep** — files phase (multipart) |
| `EnrichmentClients.getSkillMetadata` / `getProjectMetadata` | `v2/metadata/{skills,projects}` | **keep** — skills phase, `v2` stays hand-written |
| `mappers.ts`, `path.ts`, `update.ts`, `sanitize-comment.ts` | none | **keep** — pure; `mappers` / `update` re-typed to SDK types |
| SDK `listPublishedResources` | `/v1/ops/publication/resource/list` | **not added** — nothing calls it |

## Decisions

### D1. One commit for calls and types, no intermediate converter
Migrating the calls first behind a converter into the old `Core*` shapes, then deleting the shapes, would write code
only to delete it. The calls and the type cleanup land together; the optional-field and enum handling lives in
`mappers.ts` permanently. *Alternative rejected:* a temporary converter for a cleaner bisect — extra throwaway code
for a change small enough to review as one.

### D2. Ids are sent per input; nothing is double-encoded
The id is a JSON body field (`ResourceLink.url`), so no path encoding is involved. A Core-issued path is already
encoded and goes unchanged: encoding it would turn `%20` into `%2520`. A typed folder (`ruleList`) keeps
`encodeFolderPath`. `createPublication.targetFolder` stays encoded by `folders-core.ts` (`encodeCorePath(targetFolder)`),
the client sends it as given and its doc comment says so. *Known inconsistency, recorded not fixed:* `ruleList`
encodes inside the client while `createPublication` relies on its caller. Moving it would touch `folders-core.ts` and
risk a double encode at any missed caller. One cross-flow spec runs `folders-core` against the real client for a folder
named `My Folder` and asserts both bodies, which a spec that mocks `publicationsApi` cannot.

### D3. The list response is cast once, and pinned
The SDK types `ListPublication` as `Publication[]`; Core returns `{ publications: [...] }`. The existing
`(res.publications ?? []).flatMap(...)` stays behind one typed cast with a comment, and a spec feeds the real object
shape. If the SDK later corrects its schema, the spec fails loudly instead of the list silently emptying. An upstream
issue is drafted for the user to file; nothing is posted. *Alternatives:* an `Array.isArray` guard (an unexercised
branch), or leaving the list on `BaseApi` (seven of eight calls migrate while the highest-traffic read stays behind).

### D4. Behaviour is preserved; no defaults, no new validation
`mapRules` already casts `rule.function as RuleFunction`, and missing fields flow through today. The migration keeps
that: an unknown `function` passes through, a missing `source` / `targets` stays absent (no `''` / `[]`), a list item
without `url` or `status` is skipped, and a `get` without `status` resolves to `null`. Each is one spec case, so a later
tightening is a deliberate change. `status` and `function` literals are converted to the admin enums in `mappers.ts`
(the code standards require enums, and `PUBLICATION_NOT_FOUND_STATUSES.has(...)` needs the enum type, no casts).

### D5. `undefined` for 403, mapped to `null` at two sites
`getPublicationList` and `getPublication` widen to `… | null | undefined`, documented once on the private helper as in
Phase 2. The two pages, `app/[lang]/publications/page.tsx` and `[id]/page.tsx`, map `undefined` to `null` where `data`
is declared `Publication | null`. Specs cover the API level (403 → `undefined`) and each page's no-data result.

### D6. Empty and 204 bodies are proved first, and gate the work
The SDK types approve, reject and delete as a `Publication` JSON body, while Core may answer empty. `parseSdkBody`
turns a missing body into `''`, so a 2xx empty body should resolve `success: true`; the first task writes that spec
for `200`-empty and `204`. If openapi-fetch throws instead, **work stops and goes back to the user before `core-api.ts`
is touched**, because Phases 1–2 share it. The `BaseApi` non-JSON fix stays its own change; these specs only pin the
empty-body outcome.

### D7. `publishCredentials` is not sent
The SDK's `PublicationResource` has `publishCredentials`; the admin never reads or sets it and `buildUpdatePlan`
rebuilds resources without it, so the update body is unchanged. The update spec asserts it is absent. Checked in task 1.2: no
hit for `publishCredentials` anywhere in `src/`, and the SDK `Publication` / `PublicationResource` / `Rules` fields all map onto the
admin fields (`status`, `resourceTypes` and rule `function` are string-literal unions there, enums here). The DTO diff
(SDK `Publication` / `PublicationResource` against `CorePublicationCreateDto`, `CorePublicationUpdateDto`,
`CorePublicationResource`) is task 1.2.

## Risks / Trade-offs

- [The SDK throws on an empty 2xx body] → D6: spec first, stop and ask before touching shared `core-api.ts`.
- [SDK `Rules.rules` types `function` / `source` / `targets` as optional, the admin type requires them] → no defaults;
  the mapper type admits absence where Core may omit it, and `folders-core.ts` keeps a non-weakened `DialRule` type
  with no `any`.
- [Component specs reach SDK-backed actions unmocked; CI has no `DIAL_CORE_API_URL`, so `getCoreSdk` throws as an
  unhandled error even when tests pass] → task 4 runs them with `DIAL_CORE_API_URL=` and mocks the action module
  (`@/src/app/actions/publications`, as Phase 2 did for system-properties) where one throws.
- [Larger diff than a call-only change, because the types move with it] → one coherent commit; the type edits are
  mechanical and compile-checked by both typecheck gates.
- [A Core field added to `Publication` later round-trips through `update`] → `buildUpdatePlan` sends an explicit set of
  fields, so unknown fields are not echoed.

## Migration Plan

No deployment step; internal refactor, no env or dependency change. Rollback is a revert of the commit.
