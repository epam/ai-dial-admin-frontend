## Context

The admin frontend manages three categories of entities:
- **World A** — Config entities served by the admin-backend (URLs: `/models`, `/applications`, `/toolsets`, etc.)
- **World B** — Platform entities served by Core directly, stored in the `platform/` bucket, flat/unversioned (URLs currently: `/assets-models`, `/assets-interceptors`, etc.)
- **World C** — User resources served by Core directly, stored in the `public/` bucket, versioned/publishable (URLs: `/assets-applications`, `/assets-toolsets`, etc.)

World B routes were named `assets-*` when they were added, but `assets-*` is also the prefix for World C routes. This works today because no entity type appears in both World B and World C simultaneously. That changes when Applications and Toolsets are migrated as platform entities — `assets-applications` and `assets-toolsets` already belong to World C, making the `assets-` prefix unusable for new World B entries of the same types.

This design addresses the naming collision by renaming all six current World B routes to `platform-*`, aligning their URL prefix with the Core bucket name (`platform/`) they actually use.

## Goals / Non-Goals

**Goals:**
- Make the `platform-` prefix the canonical marker for World B (Core-direct, platform-bucket, flat) routes
- Eliminate the naming collision that would block adding `platform-applications` and `platform-toolsets` in the next change
- Fix two pre-existing i18n inconsistencies surfaced by the rename scope

**Non-Goals:**
- Renaming component directories (`components/Assets/Models/`, etc.) — no semantic value, pure churn
- Adding redirects from old URLs — admin-internal tool, URL stability not contractually required
- Any behavior change, API change, or visual change

## Decisions

### Decision 1: Rename World B, keep World C as-is

**Chosen:** Rename `assets-*` → `platform-*` for the six World B routes. Leave World C routes (`assets-applications`, `assets-toolsets`, `assets-skills`, etc.) unchanged.

**Rationale:** World B routes are newer (recently added platform entity work). World C routes are older and more established in user mental models. The word "platform" is the technical ground truth — it mirrors the actual Core bucket name, so new contributors can immediately understand the relationship. Renaming World C instead would leave the ambiguity at the World B level.

**Alternative considered:** Keep `assets-*` for World B and use a different prefix (e.g., `platform-entity-*`) for new platform Applications/Toolsets. Rejected: creates inconsistency within World B itself.

### Decision 2: TypeScript compiler as the completeness gate

The rename is applied by first updating `ApplicationRoute` enum values (`AssetsModels` → `PlatformModels`, etc.), which makes the TypeScript compiler emit errors at every reference site. All remaining file edits are driven by fixing those compiler errors, guaranteeing no reference escapes. No manual grep pass is needed.

**Rationale:** The enum values are used in typed switch/case and map constructs throughout the codebase. TS strict mode turns every missed case into a compile error rather than a silent runtime bug.

### Decision 3: Fix `AppRunners` i18n key anomaly in the same PR

`assets-app-runners` currently reuses the config-entity `Menu.AppRunners` i18n key instead of having a dedicated `Menu.AssetsAppRunners` key. Since this file is already being edited, introduce the correct `Menu.PlatformAppRunners` key and update the one reference to it.

**Rationale:** The bug is invisible today because both sections happen to use the same display text ("App Runners"). Post-rename the anomaly would become a `Menu.AppRunners` key used in a `Platform*` context, which is confusing. Zero extra cost to fix while touching the file.

### Decision 4: Rename OpenSpec spec directories alongside source files

The six spec directories (`openspec/specs/assets-models/`, etc.) mirror the route names. They are renamed to `openspec/specs/platform-models/`, etc. as part of the same PR.

**Rationale:** Spec and source directories should stay in sync. The spec content (behavior requirements) is unchanged; only the directory name changes. Leaving old spec names creates confusion when the capability path diverges from the route name.

## Risks / Trade-offs

- **Broken bookmarks** → Acceptable for an admin-internal tool with no SLA on URL stability. Not mitigated (no redirects).
- **Large diff (~100 files)** → Mitigated: all changes are mechanical string substitutions across a uniform pattern. TypeScript compiler validates completeness. Zero logic changes.
- **Test failures from hardcoded route strings** → Mitigated: caught in the same TypeScript pass and by running the test suite before the PR is merged.

## Migration Plan

1. Rename the six Next.js app directory folders (git tracks as rename+modify).
2. Update `ApplicationRoute` enum in `types/routes.ts` — member names and string values.
3. Compile; follow all TypeScript errors to completion.
4. Update i18n enum in `constants/i18n.ts` and translation strings in `locales/en.ts`.
5. Update test assertions referencing old string values.
6. Rename OpenSpec spec directories.
7. Run `npm run lint && npx vitest run` from `apps/ai-dial-admin/` to verify.

Rollback: revert the PR. No data migration, no database changes, no external API changes.
