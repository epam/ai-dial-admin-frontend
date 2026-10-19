## Why

`apps/ai-dial-admin/src/app/[lang]/layout.tsx` nests 14 asset-folder providers (plus `RuleFolderProvider`)
about 15 levels deep before it reaches the actual app shell. The providers themselves are already thin
— each is a 8–16 line wrapper around `createFolderContext` — so the depth is pure JSX ceremony: every
new asset entity adds an import, a nesting level, and a re-indentation of the whole shell, which makes
layout diffs noisy and hides what the layout actually renders.

## What Changes

- Add a small `composeProviders` helper that folds an ordered list of provider components into a single
  wrapper component.
- Add an `AssetFolderProviders` client component that lists the 14 factory-made asset providers once,
  using that helper. `RuleFolderProvider` is **not** included (it takes an `attributes` prop and has a
  different shape) and stays an explicit layout-level provider.
- Replace the 14 nested providers in `[lang]/layout.tsx` with one `<AssetFolderProviders>`, so the shell
  sits at the same depth as `NotificationProvider`/`HelpTopicProvider`.
- Preserve the current mount order exactly, so any provider that ever reads another one keeps working.
- Refresh the "Provider stack" line in `openspec/config.yaml`, which already lags the real stack.

No behavior changes: same providers, same state, same hooks, same exports. Consumers (54 files) and the
21 specs that `vi.mock` the per-entity context modules are untouched.

## Non-goals

- Merging the providers into one context, or any `Map`/registry keyed by route or entity. That is a
  separate, larger change (explored as "option B") and this one deliberately does not prejudge it.
- Changing `createFolderContext`, the state machine inside it, or the hook names.
- Touching `RuleFolderContext`.
- Any render-performance work. Providers keep their independent contexts, so re-render behavior is
  identical to today.

## Capabilities

### New Capabilities
<!-- None: internal refactor, no new user-visible behavior. -->

### Modified Capabilities
<!-- None: no spec describes the provider nesting. `platform-models` mentions `layout.tsx` only for
     `dashboardEnabled`, and `skill-resources-core-api` mentions `SkillFolderProvider` only as the
     wrapper a view uses, not the layout structure. -->

## Impact

- **Code**: `src/app/[lang]/layout.tsx` (nesting removed), new `src/context/assets/AssetFolderProviders.tsx`
  and a `composeProviders` helper in `src/context/` (it builds a component, so it cannot live in the
  JSX-free `src/utils/`).
- **Docs**: `openspec/config.yaml` provider-stack line.
- **Risk**: low. The one thing to guard is order: nesting order in the layout becomes array order in the
  composition, and a reversed fold would silently invert it. A unit test on the helper pins this.
- **Server/client boundary**: `layout.tsx` is a server component and passes server-rendered `children`
  through a client wrapper. This is already how the existing providers work, but the new wrapper must
  forward `children` untouched.
- **Follow-up**: leaves the door open to consolidating the contexts later without needing to re-flatten
  the layout first.
