## Context

Core creates can return the route identity under `_metadata.name`, while the shared flat-platform URL builder currently resolves only top-level `name` or `$id`. The shared create modal and the seeded asset create modal also construct some redirect URLs directly, even though duplicate and row-open flows use `getUrnForEntity`.

Colon-containing names are valid Core names and require ordinary URL-segment encoding. Existing App Runner and Catalog Schema identifiers intentionally have special encoding behavior that must remain unchanged.

## Goals / Non-Goals

**Goals:**

- Build post-create detail URLs from the created resource identity regardless of whether Core returns it top-level or in `_metadata`.
- Use the shared route builder for create redirects so every route retains its existing segment and query-parameter contract.
- Cover Catalog model and platform-bucket Application/Toolset colon-name redirects with focused tests.

**Non-Goals:**

- Change list/grid presentation, row-click navigation, name validation, or Core contracts.
- Redesign detail routes or alter decoding across all entity pages.
- Change special App Runner or Catalog Schema encoding semantics.

## Decisions

### Resolve flat platform identities from Core metadata

The flat-platform branch of `getEntityPath` will fall back to `_metadata.name` after its existing top-level `name` and `$id` sources. The result continues through the existing single `encodeURIComponent` call.

**Rationale:** `AssetApi.put` deliberately enriches successful Core write responses with `_metadata` identity fields. Reading that established shape keeps response handling centralized and makes `:` an encoded route character rather than a special case.

**Alternative considered:** Add colon-specific encoding at create call sites. Rejected because encoding is already centralized, and call-site handling would leave other Core response shapes unreliable.

### Reuse canonical URL construction for post-create redirects

The shared create components will delegate redirect construction to `getUrnForEntity` wherever their current manually composed URL does not supply additional route state.

**Rationale:** duplicate, row-open, and key-create flows already use this helper. It retains platform-vs-public Application and Toolset behavior (`?path=` only for public bucket entities) in one location.

**Alternative considered:** Retain manual route assembly and patch only the missing metadata fallback. Rejected because divergent route assembly can omit the locale-rooted route contract and makes future encoding fixes inconsistent.

### Preserve existing route-specific encoding behavior

The change will not modify the special handling for App Runner and Catalog Schema identifiers, or the public-bucket versioned route path contract.

**Rationale:** those flows have explicit encoding tests and serve distinct Core identity formats.

## Risks / Trade-offs

- [A create flow relies on its current relative URL form] → Cover list-originated and seeded/detail-originated redirects before replacing manual composition.
- [A metadata fallback overrides a caller-provided identity] → Keep top-level `name` and `$id` as higher-priority sources.
- [A platform Application or Toolset is mistaken for a public entity] → Route every redirect through the existing dual-bucket path logic and assert the absence of `?path=` for platform cases.

## Migration Plan

No data migration or deployment coordination is required. The client-side redirect change is backward compatible; rollback is a normal frontend rollback.

## Open Questions

None.
