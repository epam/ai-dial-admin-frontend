## Context

`ApplicationRoute.AssetsSkills` / `/assets-skills` is the sole remaining World C (public-bucket)
resource whose enum member and URL carry the `Assets` prefix. Prompts, Conversations, and Files have
no prefix. The prior `rename-platform-entity-routes` change already moved all six platform-asset
enums to `Platform*`, so the current state is:

```
AssetsApplications = '/assets-applications'  ← World C, no config counterpart → not changed here
AssetsToolsets     = '/assets-toolsets'       ← World C, no config counterpart → not changed here
AssetsSkills       = '/assets-skills'         ← World C, no config counterpart → THIS CHANGE
```

The pattern of the rename is identical to what `rename-platform-entity-routes` did for the
platform entities: update the single enum member in `src/types/routes.ts` and then fix every
downstream reference mechanically.

## Goals / Non-Goals

**Goals:**
- Rename `ApplicationRoute.AssetsSkills` → `ApplicationRoute.Skills` and update its value to
  `'/skills'`.
- Rename the Next.js app route directory `src/app/[lang]/assets-skills/` → `skills/` so the URL
  is served from `/skills`.
- Update every TypeScript reference (source and tests) and every import path that mentions
  `assets-skills`.
- Rename the spec directory `openspec/specs/assets-skills/` → `openspec/specs/skills/`.

**Non-Goals:**
- Renaming `AssetsApplications` or `AssetsToolsets` (separate, future decision).
- Adding a server-side redirect from `/assets-skills` → `/skills`.
- Any behavior change — the feature is unchanged.

## Decisions

**Decision: straight enum-value change (no compatibility shim)**

Since `ApplicationRoute` is frontend-internal and no outside system addresses
`/assets-skills` through the TypeScript enum, a straight rename is safe. No deprecation alias is
needed.

**Decision: directory rename over file copy**

`src/app/[lang]/assets-skills/` → `skills/` is the minimal change. File content inside the
directory is unchanged; only the folder names move.

**Decision: apply `replace_all` for enum-member and path-string substitutions**

Because `AssetsSkills` appears only as a single enum member (not a prefix shared with any other
entry), a global `replace_all: true` search for `AssetsSkills` and `assets-skills` is safe in
every file.

## Risks / Trade-offs

- **URL change is breaking for bookmarks** — any external link to `/assets-skills` will 404.
  Accepted; no redirect is in scope.
- **File locks (Windows)** — the directory rename is the only step that fails under file locks
  (the same blocker that affected Group 1 of `rename-platform-entity-routes`). All source-file
  edits can land while the directory is still named `assets-skills`; the directory rename is the
  final physical step.
