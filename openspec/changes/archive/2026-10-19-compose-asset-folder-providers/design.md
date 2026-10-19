## Context

`[lang]/layout.tsx` (a server component) wraps the app shell in `RuleFolderProvider` plus 14 providers
produced by `createFolderContext` (`context/assets/*FolderContext.tsx`). Each provider is independent:
its own `createContext`, its own state, no provider reads another's context. They differ only in the
fetch function they were built with. They are nested one inside the other purely because JSX has no
sibling-wrapping syntax, giving ~15 levels of indentation before `<Header>`/`<Menu>`/`<Content>`.

Current mount order, outermost first: Apps, Models, AppRunners, CatalogSchemas, Interceptors,
Translators, Routes, Roles, Keys, Prompt, Toolset, File, Conversation, Skill.

Constraints:
- `layout.tsx` is a server component; providers are `'use client'`. Server-rendered `children` already
  flow through client providers this way, so a client wrapper component is fine.
- 54 non-spec files consume the `use*Folder` hooks and 21 specs `vi.mock` the per-entity modules
  (`test-setup.tsx` mocks them centrally). None of that may change.
- `RuleFolderProvider` takes an `attributes` prop and has a different state shape; it is not a
  `createFolderContext` product.

## Goals / Non-Goals

**Goals:**
- Layout shows the shell at the same depth as `NotificationProvider`/`HelpTopicProvider`.
- Adding an asset entity touches one list, not the layout's nesting.
- Zero behavior change: same providers, same order, same state, same hooks.

**Non-Goals:**
- Merging providers into one context or a `Map` keyed by route/entity (separate, larger change).
- Changing `createFolderContext` internals, hook names, or any consumer.
- Moving `RuleFolderProvider` into the composition.
- Render-performance changes: contexts stay independent, so re-render scope is identical to today.

## Decisions

### D1: A generic `composeProviders` helper, not an inline fold

`src/context/compose-providers.tsx` exports `composeProviders(providers)`, which returns one component
that nests the given `ComponentType<{ children: ReactNode }>` list, first entry outermost, via
`reduceRight`.

- **Why a separate generic helper over folding inline in `AssetFolderProviders`:** `test-setup.tsx`
  mocks every asset provider module, so an order test written against `AssetFolderProviders` would only
  see mocks. A helper that takes the list as an argument is testable with plain fake providers.
- **Why `src/context/` and not `src/utils/`:** it builds a component (JSX), and `utils.md` §2 reserves
  `utils/` for pure functions with no hooks or JSX.
- **Alternatives:** (a) a third-party `reduce-react-providers`-style package — rejected, ~10 lines don't
  justify a dependency; (b) hand-flattening with the providers as siblings — impossible, a provider must
  wrap its subtree; (c) Next.js route-group layouts — rejected, breadcrumbs in `Header` and the
  publications views read these contexts from above any route-group layout.

### D2: `AssetFolderProviders` lists the 14 providers once

`src/context/assets/AssetFolderProviders.tsx` (`'use client'`) exports
`AssetFolderProviders = composeProviders([...])` with the 14 providers in the current order.
`RuleFolderProvider` stays explicit in the layout, directly outside it (it was outermost before and
still is).

- **Why one file rather than several group components (platform vs. assets vs. …):** the split would be
  invented structure; the providers share no behavior beyond the factory, and a single list is what a
  later consolidation would replace.
- **Why keep the original order:** no provider depends on another today, so order is not load-bearing,
  but preserving it makes the change provably a no-op and keeps provider-tree snapshots/diffs readable.

### D3: Built once at module scope

`composeProviders` runs when the module is evaluated, not inside a render. A component created during
render gets a new identity every render, which would unmount and remount the whole subtree (losing all
fetched folder state). The helper's return value is therefore assigned to a module-level `const`.

### D4: Docs

`openspec/config.yaml`'s "Provider stack" line is already stale (it omits most providers). Rewrite it to
the real stack with `AssetFolderProviders` as one entry.

## Risks / Trade-offs

- **[Reversed fold inverts nesting order]** → `reduceRight` with a test that renders fake providers and
  asserts the DOM nesting order, first listed outermost.
- **[Remount on every render if the composed component is created in render]** → D3; the helper's JSDoc
  states it must be called at module scope.
- **[Client boundary]** → `AssetFolderProviders` forwards `children` untouched, the same way each
  provider does today; verified by typecheck and a test that children render through the composition.
- **[A provider silently dropped from the list]** → the 14 hooks are still imported by consumers, and
  each throws `must be used within its Provider` on a missing provider, so omission fails loudly on first
  use. No dedicated test: `test-setup.tsx` mocks these modules, so one would only assert the mocks.
- **[Trade-off: one more indirection]** → the reader now looks in one file for the stack instead of the
  layout; accepted because the layout was the part nobody could read.

## Migration Plan

Single PR, no data or API migration. Rollback is a plain revert. No feature flag.
